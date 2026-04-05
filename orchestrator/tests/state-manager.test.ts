import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { StateManager } from '../src/state-manager.js';
import { loadOrchestratorConfig } from '../src/config.js';
import type { OrchestratorConfig, CompletionSignal } from '../src/types.js';

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'projectx2-test-'));
}

function setupTestCompanyRoot(root: string): void {
  const stateDir = path.join(root, 'company', 'state');
  const signalsDir = path.join(root, 'company', 'state', 'signals');
  const researchDir = path.join(root, 'company', 'state', 'research');
  const logsDir = path.join(root, 'company', 'logs');
  const archiveDir = path.join(root, 'company', 'archive');

  fs.mkdirSync(signalsDir, { recursive: true });
  fs.mkdirSync(researchDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });
  fs.mkdirSync(archiveDir, { recursive: true });

  // Write company config
  fs.writeFileSync(path.join(stateDir, 'company-config.json'), JSON.stringify({
    company_name: 'Test Corp',
    product_repo: 'https://github.com/test/test.git',
    product_repo_local_path: '',
    budget_usd: 100,
    budget_spent_usd: 0,
    domain: 'testing',
    product_type: 'CLI tool',
    target_audience: 'developers',
    monetization: 'open-core',
    tech_stack: ['TypeScript'],
    avoid_domains: [],
    max_agents: 5,
    risk_tolerance: 'moderate',
    time_horizon: '1 month',
    owner_notes: '',
  }, null, 2));

  // Write project status
  fs.writeFileSync(path.join(stateDir, 'project-status.md'), [
    '# Project Status',
    '',
    '## Current Phase',
    '`initialization`',
    '',
    '## Active Project',
    'None',
    '',
    '## Blockers',
    'None',
    '',
    '## Current Cycle',
    '0',
    '',
    '## Last Updated',
    '2026-04-05',
    '',
    '## Timeline',
    '| Date | Event | Agent | Details |',
    '|------|-------|-------|---------|',
    '| 2026-04-05 | Test started | system | Test |',
  ].join('\n'));
}

describe('StateManager', () => {
  let tempDir: string;
  let config: OrchestratorConfig;
  let stateManager: StateManager;

  beforeEach(() => {
    tempDir = createTempDir();
    config = loadOrchestratorConfig(tempDir);
    setupTestCompanyRoot(tempDir);
    stateManager = new StateManager(config);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('readCompanyConfig', () => {
    it('should read and parse company config', () => {
      const cc = stateManager.readCompanyConfig();
      expect(cc.company_name).toBe('Test Corp');
      expect(cc.budget_usd).toBe(100);
      expect(cc.domain).toBe('testing');
      expect(cc.tech_stack).toEqual(['TypeScript']);
    });
  });

  describe('writeCompanyConfig', () => {
    it('should write config and re-read it correctly', () => {
      const cc = stateManager.readCompanyConfig();
      cc.budget_spent_usd = 50;
      cc.domain = 'fintech';
      stateManager.writeCompanyConfig(cc);

      const updated = stateManager.readCompanyConfig();
      expect(updated.budget_spent_usd).toBe(50);
      expect(updated.domain).toBe('fintech');
    });
  });

  describe('readProjectStatus', () => {
    it('should parse project status from markdown', () => {
      const status = stateManager.readProjectStatus();
      expect(status.phase).toBe('initialization');
      expect(status.activeProject).toBeNull();
      expect(status.currentCycle).toBe(0);
    });
  });

  describe('parseProjectStatus', () => {
    it('should parse different phases', () => {
      const content = [
        '# Project Status',
        '',
        '## Current Phase',
        '`development`',
        '',
        '## Active Project',
        'MyProduct',
        '',
        '## Blockers',
        'None',
        '',
        '## Current Cycle',
        '5',
        '',
        '## Last Updated',
        '2026-04-05',
      ].join('\n');

      const status = stateManager.parseProjectStatus(content);
      expect(status.phase).toBe('development');
      expect(status.activeProject).toBe('MyProduct');
      expect(status.currentCycle).toBe(5);
    });

    it('should handle fallback when fields are missing', () => {
      const status = stateManager.parseProjectStatus('# Incomplete Status');
      expect(status.phase).toBe('initialization');
      expect(status.activeProject).toBeNull();
      expect(status.currentCycle).toBe(0);
    });
  });

  describe('updateProjectStatus', () => {
    it('should update phase', () => {
      stateManager.updateProjectStatus({ phase: 'research' });
      const status = stateManager.readProjectStatus();
      expect(status.phase).toBe('research');
    });

    it('should update cycle count', () => {
      stateManager.updateProjectStatus({ currentCycle: 3 });
      const status = stateManager.readProjectStatus();
      expect(status.currentCycle).toBe(3);
    });

    it('should update active project', () => {
      stateManager.updateProjectStatus({ activeProject: 'NewProject' });
      const status = stateManager.readProjectStatus();
      expect(status.activeProject).toBe('NewProject');
    });
  });

  describe('writeLog', () => {
    it('should create a new log file', () => {
      stateManager.writeLog('test-agent', 'Test Action', 'Did something for testing.');
      const dateStr = new Date().toISOString().split('T')[0];
      const logFile = path.join(tempDir, 'company', 'logs', `${dateStr}.md`);
      expect(fs.existsSync(logFile)).toBe(true);

      const content = fs.readFileSync(logFile, 'utf-8');
      expect(content).toContain('test-agent');
      expect(content).toContain('Test Action');
      expect(content).toContain('Did something for testing.');
    });

    it('should append to existing log file', () => {
      stateManager.writeLog('agent-1', 'First', 'First action');
      stateManager.writeLog('agent-2', 'Second', 'Second action');

      const dateStr = new Date().toISOString().split('T')[0];
      const logFile = path.join(tempDir, 'company', 'logs', `${dateStr}.md`);
      const content = fs.readFileSync(logFile, 'utf-8');
      expect(content).toContain('agent-1');
      expect(content).toContain('agent-2');
    });
  });

  describe('signals', () => {
    it('should write and read a completion signal', () => {
      const signal: CompletionSignal = {
        agentId: 'test-agent',
        taskId: 'task-001',
        timestamp: new Date().toISOString(),
        status: 'success',
        summary: 'Completed the test task',
        branchName: 'agent/test-agent/task-001',
      };

      stateManager.writeSignal(signal);
      const signals = stateManager.readSignals();
      expect(signals).toHaveLength(1);
      expect(signals[0].agentId).toBe('test-agent');
      expect(signals[0].taskId).toBe('task-001');
      expect(signals[0].status).toBe('success');
    });

    it('should clear all signals', () => {
      stateManager.writeSignal({
        agentId: 'a', taskId: 't1', timestamp: '', status: 'success', summary: '', branchName: '',
      });
      stateManager.writeSignal({
        agentId: 'b', taskId: 't2', timestamp: '', status: 'success', summary: '', branchName: '',
      });

      expect(stateManager.readSignals()).toHaveLength(2);
      stateManager.clearSignals();
      expect(stateManager.readSignals()).toHaveLength(0);
    });
  });

  describe('ensureDirectories', () => {
    it('should create all required directories', () => {
      const freshDir = createTempDir();
      const freshConfig = loadOrchestratorConfig(freshDir);
      const freshManager = new StateManager(freshConfig);

      freshManager.ensureDirectories();

      expect(fs.existsSync(path.join(freshDir, 'company', 'state'))).toBe(true);
      expect(fs.existsSync(path.join(freshDir, 'company', 'state', 'signals'))).toBe(true);
      expect(fs.existsSync(path.join(freshDir, 'company', 'state', 'research'))).toBe(true);
      expect(fs.existsSync(path.join(freshDir, 'company', 'logs'))).toBe(true);
      expect(fs.existsSync(path.join(freshDir, 'company', 'archive'))).toBe(true);

      fs.rmSync(freshDir, { recursive: true, force: true });
    });
  });
});
