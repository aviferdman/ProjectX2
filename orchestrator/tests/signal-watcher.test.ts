import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { SignalWatcher } from '../src/signal-watcher.js';
import { loadOrchestratorConfig } from '../src/config.js';
import { Logger } from '../src/logger.js';
import type { CompletionSignal, OrchestratorConfig } from '../src/types.js';

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'projectx2-signal-test-'));
}

describe('SignalWatcher', () => {
  let tempDir: string;
  let config: OrchestratorConfig;
  let logger: Logger;
  let watcher: SignalWatcher;

  beforeEach(() => {
    tempDir = createTempDir();
    const signalsDir = path.join(tempDir, 'company', 'state', 'signals');
    fs.mkdirSync(signalsDir, { recursive: true });

    config = loadOrchestratorConfig(tempDir);
    logger = new Logger('error');  // quiet during tests
    watcher = new SignalWatcher(config, logger);
  });

  afterEach(async () => {
    await watcher.stop();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should find existing signals without starting the watcher', async () => {
    const signal: CompletionSignal = {
      agentId: 'test',
      taskId: 'existing-task',
      timestamp: new Date().toISOString(),
      status: 'success',
      summary: 'Already done',
      branchName: 'agent/test/existing-task',
    };

    const signalFile = path.join(tempDir, 'company', 'state', 'signals', 'test-existing-task-123.json');
    fs.writeFileSync(signalFile, JSON.stringify(signal));

    // waitForTask should find the existing signal immediately
    watcher.start();
    const result = await watcher.waitForTask('existing-task', 5000);
    expect(result.status).toBe('success');
    expect(result.taskId).toBe('existing-task');
  });

  it('should detect new signal files (event-driven)', async () => {
    watcher.start();

    const signal: CompletionSignal = {
      agentId: 'agent-x',
      taskId: 'new-task-001',
      timestamp: new Date().toISOString(),
      status: 'success',
      summary: 'Completed dynamically',
      branchName: 'agent/agent-x/new-task-001',
    };

    // Start waiting for the task
    const waitPromise = watcher.waitForTask('new-task-001', 10000);

    // Write the signal file after a delay
    setTimeout(() => {
      const signalFile = path.join(tempDir, 'company', 'state', 'signals', 'agent-x-new-task-001-456.json');
      fs.writeFileSync(signalFile, JSON.stringify(signal));
    }, 500);

    const result = await waitPromise;
    expect(result.taskId).toBe('new-task-001');
    expect(result.status).toBe('success');
  });

  it('should timeout when signal is not received', async () => {
    watcher.start();

    await expect(
      watcher.waitForTask('never-coming', 1000)
    ).rejects.toThrow('Timeout');
  });
});
