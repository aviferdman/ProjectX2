import { CopilotClient, approveAll } from '@github/copilot-sdk';
import type { AgentTask, CompletionSignal, OrchestratorConfig } from './types.js';
import { StateManager } from './state-manager.js';
import { Logger } from './logger.js';

const AGENT_MODELS: Record<string, string> = {
  gm: 'claude-opus-4.6',
  pm: 'claude-sonnet-4.5',
  projm: 'claude-sonnet-4.5',
  researcher: 'claude-sonnet-4.5',
  developer: 'claude-opus-4.6',
  qa: 'claude-sonnet-4.5',
  hr: 'claude-sonnet-4.5',
  liaison: 'claude-sonnet-4.5',
};

export interface AgentRunnerOptions {
  config: OrchestratorConfig;
  stateManager: StateManager;
  logger: Logger;
}

export class AgentRunner {
  private config: OrchestratorConfig;
  private stateManager: StateManager;
  private logger: Logger;
  private client: CopilotClient | null = null;

  constructor(options: AgentRunnerOptions) {
    this.config = options.config;
    this.stateManager = options.stateManager;
    this.logger = options.logger;
  }

  async start(): Promise<void> {
    this.client = new CopilotClient();
    await this.client.start();
    this.logger.info('Copilot SDK client started');
  }

  async stop(): Promise<void> {
    if (this.client) {
      await this.client.stop();
      this.client = null;
      this.logger.info('Copilot SDK client stopped');
    }
  }

  /**
   * Run an agent task using the Copilot SDK.
   * Creates a session with the agent's model, sends the task prompt,
   * and waits for the agent to complete.
   */
  async runAgent(task: AgentTask): Promise<CompletionSignal> {
    if (!this.client) {
      throw new Error('AgentRunner not started — call start() first');
    }

    this.logger.info(`[${task.agentId}] Starting task: ${task.id}`);

    const model = AGENT_MODELS[task.agentId] ?? 'claude-sonnet-4.5';
    const prompt = this.buildPrompt(task);
    const systemContent = this.buildSystemContent(task);

    try {
      // Developer works in product repo; all other agents work in company repo
      const workingDir = task.agentId === 'developer'
        ? this.config.productRepoPath
        : this.config.companyRoot;

      const session = await this.client.createSession({
        model,
        agent: task.agentId,
        workingDirectory: workingDir,
        systemMessage: {
          mode: 'customize' as const,
          content: systemContent,
        },
        onPermissionRequest: approveAll,
      });

      // Developer needs more time (20min) since it reads backlog + writes code in product repo
      // Large tasks get 20min, developer always gets 20min, others get 10min
      const timeout = (task.agentId === 'developer' || task.effort === 'L' || task.effort === 'XL') ? 1_200_000 : 600_000;
      const response = await session.sendAndWait({ prompt }, timeout);
      await session.disconnect();

      const signal: CompletionSignal = {
        agentId: task.agentId,
        taskId: task.id,
        timestamp: new Date().toISOString(),
        status: 'success',
        summary: response?.data.content?.slice(0, 500) ?? `Task ${task.id} completed`,
        branchName: task.branchName,
      };

      this.stateManager.writeSignal(signal);
      this.logger.info(`[${task.agentId}] Task completed: ${task.id} (success)`);
      return signal;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const signal: CompletionSignal = {
        agentId: task.agentId,
        taskId: task.id,
        timestamp: new Date().toISOString(),
        status: 'failure',
        summary: `Task ${task.id} failed: ${msg.slice(0, 500)}`,
        branchName: task.branchName,
      };

      this.stateManager.writeSignal(signal);
      this.logger.error(`[${task.agentId}] Task failed: ${task.id} — ${msg}`);
      return signal;
    }
  }

  private buildSystemContent(task: AgentTask): string {
    const lines = [
      `You are the @${task.agentId} agent in ProjectX2 AI Corp, an autonomous AI company.`,
      `You must follow all workspace rules in .github/copilot-instructions.md.`,
      `Always read the current state files before acting.`,
      `Commit changes with message format: [${task.id}] <brief description>`,
      `Write a completion signal JSON to company/state/signals/ when done.`,
    ];

    // Developer-specific guidance to reduce wasted time
    if (task.agentId === 'developer') {
      lines.push('');
      lines.push('## Developer-Specific Instructions');
      lines.push(`Your working directory is the PRODUCT REPO: ${this.config.productRepoPath}`);
      lines.push(`The company state files (backlog, project-status, decisions) are in: ${this.config.companyRoot}/company/state/`);
      lines.push('IMPORTANT: Do NOT spend time fixing formatting or linting issues unless that is your assigned task.');
      lines.push('IMPORTANT: Pick ONE task from the backlog, implement it, write tests, and commit. Do not try to do multiple tasks.');
      lines.push('IMPORTANT: Focus on writing CODE in the product repo. Minimize time reading state files — just find your next task and start coding.');
    }

    // Add deliberation context for research/ideation phases
    if (task.id.startsWith('research-') || task.id.startsWith('ideation-')) {
      lines.push('');
      lines.push('## Multi-Agent Deliberation Process');
      lines.push('The product/domain decision is made collaboratively by Researcher, PM, and GM.');
      lines.push('Each agent brings a different perspective: market data (Researcher), user needs (PM), or business viability (GM).');
      lines.push('You MUST read all existing research, proposals, challenges, and verdicts from other agents before writing your own.');
      lines.push('Be specific, data-driven, and willing to disagree with other agents when evidence supports it.');
      lines.push('Create subdirectories (proposals/, deliberation/) under company/state/research/ as needed.');
      lines.push('');
      lines.push('## Deliberation Loop');
      lines.push('The deliberation proceeds in rounds: Proposals → Challenges → Convergence votes → (repeat if no consensus).');
      lines.push('In your VERDICT files, use exact markdown headings: "## Top Pick:", "## Satisfied: YES/NO", "## Reasoning:", "## Unresolved Concerns:".');
      lines.push('Only write "## Satisfied: YES" when you genuinely believe the product has strong market potential, clear user need, and viable business model.');
    }

    return lines.join('\n');
  }

  private buildPrompt(task: AgentTask): string {
    return [
      `## Your Task`,
      task.description,
      ``,
      `## Context`,
      `- Working branch: ${task.branchName}`,
      `- Task ID: ${task.id}`,
      `- Company root: ${this.config.companyRoot}`,
      ``,
      `## Instructions`,
      `1. Read the current state files before doing anything.`,
      `2. Perform your task as described above.`,
      `3. Commit your changes with message: [${task.id}] <brief description>`,
      `4. Write a completion signal to company/state/signals/${task.agentId}-${task.id}-${Date.now()}.json`,
      ``,
      `## Signal Format`,
      `{`,
      `  "agentId": "${task.agentId}",`,
      `  "taskId": "${task.id}",`,
      `  "timestamp": "<ISO timestamp>",`,
      `  "status": "success" or "failure",`,
      `  "summary": "<what you did>",`,
      `  "branchName": "${task.branchName}"`,
      `}`,
    ].join('\n');
  }
}
