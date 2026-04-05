import { describe, it, expect } from 'vitest';
import { loadOrchestratorConfig, getStatePath, getLogsPath, getSignalsPath, getAgentsPath } from '../src/config.js';
import * as path from 'node:path';

describe('Config', () => {
  describe('loadOrchestratorConfig', () => {
    it('should return config with default values', () => {
      const config = loadOrchestratorConfig('/test/root');
      expect(config.companyRoot).toBe('/test/root');
      expect(config.maxRetries).toBe(3);
      expect(config.retryBaseDelayMs).toBe(5000);
      expect(config.cycleDelayMs).toBe(2000);
      expect(config.ghCliPath).toBe('gh');
    });

    it('should use provided company root', () => {
      const config = loadOrchestratorConfig('C:\\Users\\test\\ProjectX2');
      expect(config.companyRoot).toBe('C:\\Users\\test\\ProjectX2');
    });
  });

  describe('path helpers', () => {
    const config = loadOrchestratorConfig('/test/root');

    it('should build state path', () => {
      const p = getStatePath(config, 'company-config.json');
      expect(p).toBe(path.join('/test/root', 'company', 'state', 'company-config.json'));
    });

    it('should build logs path', () => {
      const p = getLogsPath(config, '2026-04-05.md');
      expect(p).toBe(path.join('/test/root', 'company', 'logs', '2026-04-05.md'));
    });

    it('should build signals path', () => {
      const p = getSignalsPath(config, 'signal.json');
      expect(p).toBe(path.join('/test/root', 'company', 'state', 'signals', 'signal.json'));
    });

    it('should build agents path', () => {
      const p = getAgentsPath(config, 'gm.agent.md');
      expect(p).toBe(path.join('/test/root', '.github', 'agents', 'gm.agent.md'));
    });

    it('should work with no segments', () => {
      const p = getStatePath(config);
      expect(p).toBe(path.join('/test/root', 'company', 'state'));
    });
  });
});
