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
}
