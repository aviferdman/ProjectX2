import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CompanyConfig, Phase, ProjectStatus, CompletionSignal, OrchestratorConfig, DeliberationState } from './types.js';
import { getStatePath, getLogsPath, getSignalsPath } from './config.js';

export class StateManager {
  constructor(private config: OrchestratorConfig) {}

  readCompanyConfig(): CompanyConfig {
    const filePath = getStatePath(this.config, 'company-config.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as CompanyConfig;
  }

  writeCompanyConfig(config: CompanyConfig): void {
    const filePath = getStatePath(this.config, 'company-config.json');
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  }

  readProjectStatus(): ProjectStatus {
    const filePath = getStatePath(this.config, 'project-status.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    return this.parseProjectStatus(content);
  }

  parseProjectStatus(content: string): ProjectStatus {
    const phaseMatch = content.match(/## Current Phase\s*\n`(\w+)`/);
    const projectMatch = content.match(/## Active Project\s*\n(.+)/);
    const cycleMatch = content.match(/## Current Cycle\s*\n(\d+)/);
    const lastUpdatedMatch = content.match(/## Last Updated\s*\n(\S+)/);

    const phase = (phaseMatch?.[1] ?? 'initialization') as Phase;
    const activeProject = projectMatch?.[1]?.trim() ?? null;
    const currentCycle = cycleMatch ? parseInt(cycleMatch[1], 10) : 0;
    const lastUpdated = lastUpdatedMatch?.[1] ?? new Date().toISOString().split('T')[0];

    return {
      phase,
      activeProject: activeProject === 'None' ? null : activeProject,
      blockers: [],
      currentCycle,
      lastUpdated,
    };
  }

  updateProjectStatus(updates: Partial<ProjectStatus>): void {
    const filePath = getStatePath(this.config, 'project-status.md');
    let content = fs.readFileSync(filePath, 'utf-8');

    if (updates.phase !== undefined) {
      content = content.replace(/## Current Phase\s*\n`\w+`/, `## Current Phase\n\`${updates.phase}\``);
    }
    if (updates.activeProject !== undefined) {
      const value = updates.activeProject ?? 'None';
      content = content.replace(/## Active Project\s*\n.+/, `## Active Project\n${value}`);
    }
    if (updates.currentCycle !== undefined) {
      content = content.replace(/## Current Cycle\s*\n\d+/, `## Current Cycle\n${updates.currentCycle}`);
    }

    const today = new Date().toISOString().split('T')[0];
    content = content.replace(/## Last Updated\s*\n\S+/, `## Last Updated\n${today}`);

    fs.writeFileSync(filePath, content, 'utf-8');
  }

  writeLog(agentId: string, title: string, description: string): void {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    const logFile = getLogsPath(this.config, `${dateStr}.md`);

    const entry = `\n## [${timeStr}] ${agentId} — ${title}\n${description}\n`;

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, entry, 'utf-8');
    } else {
      fs.writeFileSync(logFile, `# Activity Log — ${dateStr}\n${entry}`, 'utf-8');
    }
  }

  writeSignal(signal: CompletionSignal): void {
    const fileName = `${signal.agentId}-${signal.taskId}-${Date.now()}.json`;
    const filePath = getSignalsPath(this.config, fileName);
    fs.writeFileSync(filePath, JSON.stringify(signal, null, 2) + '\n', 'utf-8');
  }

  readSignals(): CompletionSignal[] {
    const dir = getSignalsPath(this.config);
    if (!fs.existsSync(dir)) return [];

    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
        return JSON.parse(raw) as CompletionSignal;
      });
  }

  clearSignals(): void {
    const dir = getSignalsPath(this.config);
    if (!fs.existsSync(dir)) return;

    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.json')) {
        fs.unlinkSync(path.join(dir, f));
      }
    }
  }

  readDeliberationState(): DeliberationState | null {
    const filePath = getStatePath(this.config, 'research', 'deliberation', 'state.json');
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as DeliberationState;
  }

  writeDeliberationState(state: DeliberationState): void {
    const dir = getStatePath(this.config, 'research', 'deliberation');
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, 'state.json');
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2) + '\n', 'utf-8');
  }

  /**
   * Read all verdict files for a given deliberation round.
   * Returns a map of agentId → verdict content.
   */
  readVerdicts(round: number): Map<string, string> {
    const dir = getStatePath(this.config, 'research', 'deliberation');
    const verdicts = new Map<string, string>();
    for (const agentId of ['researcher', 'pm', 'gm']) {
      const filePath = path.join(dir, `round-${round}-verdict-${agentId}.md`);
      if (fs.existsSync(filePath)) {
        verdicts.set(agentId, fs.readFileSync(filePath, 'utf-8'));
      }
    }
    return verdicts;
  }

  /**
   * Check if all agents are satisfied in their verdicts for a given round.
   */
  checkConvergence(round: number): boolean {
    const verdicts = this.readVerdicts(round);
    if (verdicts.size < 3) return false;
    return [...verdicts.values()].every(v => /##\s*satisfied\s*:\s*yes/i.test(v));
  }

  ensureDirectories(): void {
    const dirs = [
      getStatePath(this.config),
      getStatePath(this.config, 'research'),
      getStatePath(this.config, 'research/proposals'),
      getStatePath(this.config, 'research/deliberation'),
      getStatePath(this.config, 'signals'),
      getLogsPath(this.config),
      path.join(this.config.companyRoot, 'company', 'archive'),
    ];

    for (const dir of dirs) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // ── Backlog parsing & agent briefings ─────────────────────────

  /**
   * Move rows with `done` status from backlog.md into company/archive/backlog-done.md.
   * This keeps the active backlog small so agents can process it faster.
   */
  archiveDoneTasks(): number {
    const backlogPath = getStatePath(this.config, 'backlog.md');
    if (!fs.existsSync(backlogPath)) return 0;

    const content = fs.readFileSync(backlogPath, 'utf-8').replace(/\r\n/g, '\n');
    const lines = content.split('\n');
    const donePattern = /^\|\s*TASK-\d+\s*\|\s*P\d\s*\|\s*done\b/i;

    const doneLines: string[] = [];
    const keptLines: string[] = [];

    for (const line of lines) {
      if (donePattern.test(line)) {
        doneLines.push(line);
      } else {
        keptLines.push(line);
      }
    }

    if (doneLines.length === 0) return 0;

    // Append done rows to archive file
    const archivePath = path.join(this.config.companyRoot, 'company', 'archive', 'backlog-done.md');
    const header = '# Archived Done Tasks\n\n| Task ID | Priority | Status | Assigned | Effort | Title |\n|---------|----------|--------|----------|--------|-------|\n';
    if (!fs.existsSync(archivePath)) {
      fs.writeFileSync(archivePath, header + doneLines.join('\n') + '\n', 'utf-8');
    } else {
      fs.appendFileSync(archivePath, doneLines.join('\n') + '\n', 'utf-8');
    }

    // Write the trimmed backlog
    fs.writeFileSync(backlogPath, keptLines.join('\n'), 'utf-8');
    return doneLines.length;
  }

  parseBacklogTasks(): BacklogTask[] {
    const filePath = getStatePath(this.config, 'backlog.md');
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
    const tasks: BacklogTask[] = [];

    for (const line of content.split('\n')) {
      const match = line.match(
        /^\|\s*(TASK-\d+)\s*\|\s*(P\d)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|(.*)$/,
      );
      if (match) {
        tasks.push({
          id: match[1].trim(),
          priority: match[2].trim(),
          status: match[3].trim().toLowerCase().split('/')[0].trim(),
          assigned: match[4].trim(),
          effort: match[5].trim(),
          title: match[6].trim(),
          notes: match[7]?.trim() || undefined,
        });
      }
    }
    return tasks;
  }

  /**
   * Build a compact, pre-computed briefing for a specific agent so it
   * doesn't have to read the entire 1,300-line backlog or other state files.
   */
  buildAgentBriefing(agentId: string): string {
    const tasks = this.parseBacklogTasks();
    const status = this.readProjectStatus();

    const statusCounts = {
      done: tasks.filter(t => t.status === 'done').length,
      review: tasks.filter(t => t.status === 'review').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      todo: tasks.filter(t => t.status === 'todo').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      total: tasks.length,
    };

    switch (agentId) {
      case 'developer':
      case 'backend-dev':
      case 'frontend-dev':
      case 'designer':
      case 'uxui': {
        const todoTasks = tasks
          .filter(t => t.status === 'todo' && t.assigned === agentId)
          .sort((a, b) => {
            const priDiff = a.priority.localeCompare(b.priority);
            if (priDiff !== 0) return priDiff;
            return parseInt(a.id.replace('TASK-', '')) - parseInt(b.id.replace('TASK-', ''));
          });

        if (todoTasks.length === 0) {
          return `## Pre-computed Context\nNo \`todo\` tasks assigned to ${agentId}. Nothing to implement this cycle.`;
        }

        const next = todoTasks[0];
        return [
          '## ⚡ Your Assigned Task',
          `**${next.id}** [${next.priority}] — ${next.title}`,
          `Effort: ${next.effort}`,
          '',
          '## Sprint Status',
          `Done: ${statusCounts.done} | Review: ${statusCounts.review} | Todo: ${statusCounts.todo} | Total: ${statusCounts.total}`,
          '',
          '## What To Do',
          `1. Implement **${next.id}: ${next.title}** in the product repo`,
          '2. Write tests for the new code',
          `3. Update the task status to \`review\` in: ${this.config.companyRoot}/company/state/backlog.md`,
          '4. Write a completion signal',
        ].join('\n');
      }

      case 'qa': {
        const reviewTasks = tasks.filter(t => t.status === 'review');
        if (reviewTasks.length === 0) {
          return '## Pre-computed Context\nNo tasks in `review` status. Nothing to QA this cycle.';
        }
        return [
          '## Tasks to Review',
          ...reviewTasks.map(t => `- **${t.id}** [${t.priority}] — ${t.title} (${t.effort})`),
          '',
          '## Sprint Status',
          `Done: ${statusCounts.done} | Review: ${reviewTasks.length} | Todo: ${statusCounts.todo} | Total: ${statusCounts.total}`,
          '',
          '## What To Do',
          '1. Review each task listed above',
          '2. Run the test suite in the product repo',
          '3. Mark tasks as `done` if they pass quality gates',
          `4. Update statuses in: ${this.config.companyRoot}/company/state/backlog.md`,
          '5. Write a brief QA report and completion signal',
        ].join('\n');
      }

      case 'projm': {
        const completionPct = statusCounts.total > 0
          ? Math.round((statusCounts.done / statusCounts.total) * 100)
          : 0;
        return [
          '## Sprint Dashboard',
          `| Status | Count |`,
          `|--------|-------|`,
          `| Done | ${statusCounts.done} |`,
          `| Review | ${statusCounts.review} |`,
          `| In Progress | ${statusCounts.inProgress} |`,
          `| Todo | ${statusCounts.todo} |`,
          `| Blocked | ${statusCounts.blocked} |`,
          `| **Total** | **${statusCounts.total}** |`,
          `| **Completion** | **${completionPct}%** |`,
          '',
          '## Tasks In Review',
          ...tasks.filter(t => t.status === 'review').map(t => `- ${t.id} — ${t.title}`),
          '',
          'Update project-status.md with current sprint progress.',
          `Full backlog at: ${this.config.companyRoot}/company/state/backlog.md`,
        ].join('\n');
      }

      case 'pm': {
        const done = tasks.filter(t => t.status === 'done');
        const review = tasks.filter(t => t.status === 'review');
        const completionPct = statusCounts.total > 0
          ? Math.round((done.length / statusCounts.total) * 100)
          : 0;
        return [
          '## Product Progress Summary',
          `Phase: ${status.phase} | Cycle: ${status.currentCycle} | Completion: ${completionPct}%`,
          '',
          '## Recently Completed (last 5)',
          ...(done.length > 0
            ? done.slice(-5).map(t => `- ${t.id} [${t.priority}] — ${t.title}`)
            : ['- (none)']),
          '',
          '## Currently In Review',
          ...(review.length > 0
            ? review.map(t => `- ${t.id} [${t.priority}] — ${t.title}`)
            : ['- (none)']),
          '',
          'Validate that completed work meets acceptance criteria and product vision.',
          `Full backlog at: ${this.config.companyRoot}/company/state/backlog.md`,
        ].join('\n');
      }

      default:
        return '';
    }
  }
}

export interface BacklogTask {
  id: string;
  priority: string;
  status: string;
  assigned: string;
  effort: string;
  title: string;
  notes?: string;
}
