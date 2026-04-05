import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { OrchestratorConfig } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadOrchestratorConfig(companyRoot?: string): OrchestratorConfig {
  const root = companyRoot ?? path.resolve(path.join(__dirname, '..', '..'));

  return {
    companyRoot: root,
    productRepoPath: '',  // will be loaded from company-config.json at runtime
    maxRetries: 3,
    retryBaseDelayMs: 5000,
    cycleDelayMs: 2000,
    ghCliPath: 'gh',
  };
}

export function getStatePath(config: OrchestratorConfig, ...segments: string[]): string {
  return path.join(config.companyRoot, 'company', 'state', ...segments);
}

export function getLogsPath(config: OrchestratorConfig, ...segments: string[]): string {
  return path.join(config.companyRoot, 'company', 'logs', ...segments);
}

export function getSignalsPath(config: OrchestratorConfig, ...segments: string[]): string {
  return path.join(config.companyRoot, 'company', 'state', 'signals', ...segments);
}

export function getAgentsPath(config: OrchestratorConfig, ...segments: string[]): string {
  return path.join(config.companyRoot, '.github', 'agents', ...segments);
}
