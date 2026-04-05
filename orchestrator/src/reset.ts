import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { loadOrchestratorConfig, getStatePath, getLogsPath, getSignalsPath } from './config.js';

const INITIAL_PROJECT_STATUS = `# Project Status

## Current Phase
\`initialization\`

## Active Project
None

## Blockers
None

## Current Cycle
0

## Last Updated
${new Date().toISOString().split('T')[0]}

## Timeline
| Date | Event | Agent | Details |
|------|-------|-------|---------|
| ${new Date().toISOString().split('T')[0]} | Hard reset | system | Company state reset to scratch |
`;

const INITIAL_BACKLOG = `# Product Backlog

## Format
Each item: \`[ID] [Priority: P0-P3] [Status] [Assigned] — Title\`

Status: \`todo\` | \`in-progress\` | \`review\` | \`done\` | \`blocked\`

## Backlog Items

_No items yet. The PM agent will populate this after the research phase._
`;

const INITIAL_DECISIONS = `# Decision Log

Decisions are immutable once logged. New decisions can supersede old ones by reference.

## Format
\`[DEC-XXX] [Date] [Decision Maker] — Title\`

## Decisions

_No decisions yet._
`;

export async function hardReset(companyRoot?: string): Promise<void> {
  const config = loadOrchestratorConfig(companyRoot);

  console.log('=== ProjectX2 AI Corp — Hard Reset ===\n');

  // 1. Reset state files
  console.log('[1/4] Resetting state files...');
  resetStateFiles(config.companyRoot);

  // 2. Clear logs
  console.log('[2/4] Clearing logs...');
  clearDirectory(getLogsPath(config));

  // 3. Clear signals
  console.log('[3/4] Clearing signals...');
  clearDirectory(getSignalsPath(config));

  // 4. Clear research
  console.log('[4/4] Clearing research...');
  clearDirectory(getStatePath(config, 'research'));

  // 5. Reset product repo if configured
  const companyConfig = readCompanyConfigSafe(config.companyRoot);
  if (companyConfig?.product_repo_local_path && typeof companyConfig.product_repo_local_path === 'string') {
    console.log('[5/5] Resetting product repo...');
    resetProductRepo(companyConfig.product_repo_local_path);
  } else {
    console.log('[5/5] No product repo local path configured — skipping.');
  }

  console.log('\n✔ Hard reset complete. The company is ready to start fresh.');
}

function resetStateFiles(companyRoot: string): void {
  const statePath = path.join(companyRoot, 'company', 'state');

  // Core state files that should be preserved (but reset)
  const coreFiles = new Set([
    'project-status.md',
    'backlog.md',
    'decisions.md',
    'company-config.json',
  ]);

  // Remove all stale files (progress reviews, roster, etc.)
  const staleFiles: string[] = [];
  const entries = fs.readdirSync(statePath);
  for (const entry of entries) {
    const fullPath = path.join(statePath, entry);
    const stat = fs.statSync(fullPath);
    
    // Skip directories and core files
    if (stat.isDirectory() || coreFiles.has(entry)) continue;
    
    // Delete stale files
    fs.unlinkSync(fullPath);
    staleFiles.push(entry);
  }

  if (staleFiles.length > 0) {
    console.log(`  → Removed ${staleFiles.length} stale file(s): ${staleFiles.join(', ')}`);
  }

  // Reset project-status.md
  fs.writeFileSync(path.join(statePath, 'project-status.md'), INITIAL_PROJECT_STATUS, 'utf-8');

  // Reset backlog.md
  fs.writeFileSync(path.join(statePath, 'backlog.md'), INITIAL_BACKLOG, 'utf-8');

  // Reset decisions.md
  fs.writeFileSync(path.join(statePath, 'decisions.md'), INITIAL_DECISIONS, 'utf-8');

  // Reset company-config.json — preserve user-set fields, clear runtime fields
  const configPath = path.join(statePath, 'company-config.json');
  const existing = readCompanyConfigSafe(companyRoot);
  if (existing) {
    existing.budget_spent_usd = 0;
    existing.domain = '';
    existing.product_type = '';
    existing.target_audience = '';
    existing.monetization = '';
    existing.tech_stack = [];
    delete existing.product_vision;
    // Keep: company_name, product_repo, product_repo_local_path, budget_usd,
    //        avoid_domains, max_agents, risk_tolerance, time_horizon, owner_notes
    fs.writeFileSync(configPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
  }

  console.log('  → Reset core state files: project-status.md, backlog.md, decisions.md, company-config.json');
}

function clearDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) return;

  const files = fs.readdirSync(dirPath).filter(f => !f.startsWith('.'));
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      fs.unlinkSync(filePath);
    } else if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  }
  console.log(`  → ${files.length} item(s) removed from ${path.basename(dirPath)}/`);
}

function resetProductRepo(localPath: string): void {
  if (!fs.existsSync(localPath)) {
    console.log(`  → Product repo path not found: ${localPath} — skipping.`);
    return;
  }

  try {
    // Check out main, remove all tracked files except .git
    execSync('git checkout main', { cwd: localPath, stdio: 'pipe' });
    execSync('git pull origin main', { cwd: localPath, stdio: 'pipe' });

    // Remove all files except .git
    const entries = fs.readdirSync(localPath);
    for (const entry of entries) {
      if (entry === '.git' || entry === '.gitignore') continue;
      const fullPath = path.join(localPath, entry);
      fs.rmSync(fullPath, { recursive: true, force: true });
    }

    // Commit the clean slate
    execSync('git add -A', { cwd: localPath, stdio: 'pipe' });
    try {
      execSync('git diff --cached --quiet', { cwd: localPath, stdio: 'pipe' });
      console.log('  → Product repo already clean.');
    } catch {
      execSync('git commit -m "[reset] Clean slate — hard reset from company OS"', { cwd: localPath, stdio: 'pipe' });
      execSync('git push origin main', { cwd: localPath, stdio: 'pipe' });
      console.log('  → Product repo wiped and pushed.');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ⚠ Failed to reset product repo: ${msg}`);
  }
}

function readCompanyConfigSafe(companyRoot: string): Record<string, unknown> | null {
  try {
    const configPath = path.join(companyRoot, 'company', 'state', 'company-config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }
}
