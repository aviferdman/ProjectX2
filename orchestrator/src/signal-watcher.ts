import * as fs from 'node:fs';
import * as path from 'node:path';
import { watch, type FSWatcher } from 'chokidar';
import type { CompletionSignal, OrchestratorConfig } from './types.js';
import { getSignalsPath } from './config.js';
import { Logger } from './logger.js';

export class SignalWatcher {
  private config: OrchestratorConfig;
  private logger: Logger;
  private watcher: FSWatcher | null = null;
  private pendingResolvers: Map<string, (signal: CompletionSignal) => void> = new Map();

  constructor(config: OrchestratorConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Start watching the signals directory for new completion signals.
   */
  start(): void {
    const signalsDir = getSignalsPath(this.config);
    fs.mkdirSync(signalsDir, { recursive: true });

    this.watcher = watch(signalsDir, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
    });

    this.watcher.on('add', (filePath: string) => {
      if (!filePath.endsWith('.json')) return;

      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const signal = JSON.parse(raw) as CompletionSignal;
        this.logger.debug(`Signal received: ${signal.agentId}/${signal.taskId} (${signal.status})`);

        // Resolve any pending waiters for this task
        const resolver = this.pendingResolvers.get(signal.taskId);
        if (resolver) {
          this.pendingResolvers.delete(signal.taskId);
          resolver(signal);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to parse signal ${filePath}: ${msg}`);
      }
    });

    this.logger.info('Signal watcher started');
  }

  /**
   * Wait for a specific task to complete. Returns when the signal is received.
   * Has a timeout to prevent indefinite waiting.
   */
  waitForTask(taskId: string, timeoutMs: number = 600_000): Promise<CompletionSignal> {
    // Check if signal already exists
    const existing = this.findExistingSignal(taskId);
    if (existing) return Promise.resolve(existing);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingResolvers.delete(taskId);
        reject(new Error(`Timeout waiting for task ${taskId} after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingResolvers.set(taskId, (signal) => {
        clearTimeout(timer);
        resolve(signal);
      });
    });
  }

  /**
   * Wait for any of the given task IDs to complete.
   */
  waitForAny(taskIds: string[], timeoutMs: number = 600_000): Promise<CompletionSignal> {
    return Promise.race(taskIds.map(id => this.waitForTask(id, timeoutMs)));
  }

  private findExistingSignal(taskId: string): CompletionSignal | null {
    const signalsDir = getSignalsPath(this.config);
    if (!fs.existsSync(signalsDir)) return null;

    for (const file of fs.readdirSync(signalsDir)) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = fs.readFileSync(path.join(signalsDir, file), 'utf-8');
        const signal = JSON.parse(raw) as CompletionSignal;
        if (signal.taskId === taskId) return signal;
      } catch {
        continue;
      }
    }
    return null;
  }

  /**
   * Stop watching for signals.
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this.logger.info('Signal watcher stopped');
    }

    // Reject any pending resolvers
    for (const [taskId, resolver] of this.pendingResolvers) {
      // Can't reject from here since we only have resolve, so we resolve with failure
      resolver({
        agentId: 'orchestrator',
        taskId,
        timestamp: new Date().toISOString(),
        status: 'failure',
        summary: 'Signal watcher stopped before task completed',
        branchName: '',
      });
    }
    this.pendingResolvers.clear();
  }
}
