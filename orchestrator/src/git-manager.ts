import { execSync, exec } from 'node:child_process';
import type { OrchestratorConfig } from './types.js';
import { Logger } from './logger.js';

export class GitManager {
  private config: OrchestratorConfig;
  private logger: Logger;

  constructor(config: OrchestratorConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Create a new branch from main and check it out.
   * Ensures clean state first and deletes any stale local branch with the same name.
   */
  createBranch(branchName: string, cwd?: string): void {
    const workDir = cwd ?? this.config.companyRoot;
    this.ensureCleanState(workDir);
    this.git(['checkout', 'main'], workDir);
    this.git(['pull', 'origin', 'main'], workDir);
    // Delete stale local branch if it exists from a previous cycle
    try {
      this.git(['branch', '-D', branchName], workDir);
      this.logger.debug(`Deleted stale local branch: ${branchName}`);
    } catch { /* branch doesn't exist — expected */ }
    this.git(['checkout', '-b', branchName], workDir);
    this.logger.info(`Created branch: ${branchName}`);
  }

  /**
   * Check out an existing branch.
   */
  checkoutBranch(branchName: string, cwd?: string): void {
    const workDir = cwd ?? this.config.companyRoot;
    this.git(['checkout', branchName], workDir);
  }

  /**
   * Commit all changes with a message.
   */
  commitAll(message: string, cwd?: string): void {
    const workDir = cwd ?? this.config.companyRoot;
    this.git(['add', '-A'], workDir);

    // Check if there are staged changes
    try {
      execSync('git diff --cached --quiet', { cwd: workDir });
      this.logger.debug('No changes to commit');
      return;
    } catch {
      // There are changes — proceed with commit
    }

    this.git(['commit', '-m', message], workDir);
    this.logger.info(`Committed: ${message}`);
  }

  /**
   * Push a branch to origin.
   */
  pushBranch(branchName: string, cwd?: string): void {
    const workDir = cwd ?? this.config.companyRoot;
    this.git(['push', 'origin', branchName], workDir);
    this.logger.info(`Pushed branch: ${branchName}`);
  }

  /**
   * Create a pull request using gh CLI.
   * Returns the PR number.
   */
  createPR(branchName: string, title: string, body: string, cwd?: string): number | null {
    const workDir = cwd ?? this.config.companyRoot;
    try {
      const result = execSync(
        `${this.config.ghCliPath} pr create --base main --head ${branchName} --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}"`,
        { cwd: workDir, encoding: 'utf-8' }
      );
      const prMatch = result.match(/\/pull\/(\d+)/);
      const prNumber = prMatch ? parseInt(prMatch[1], 10) : null;
      this.logger.info(`Created PR #${prNumber ?? '?'} for ${branchName}`);
      return prNumber;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to create PR for ${branchName}: ${msg}`);
      return null;
    }
  }

  /**
   * Merge a PR. Returns true if successful.
   */
  mergePR(prNumber: number, cwd?: string): boolean {
    const workDir = cwd ?? this.config.companyRoot;
    try {
      execSync(
        `${this.config.ghCliPath} pr merge ${prNumber} --merge --delete-branch`,
        { cwd: workDir, encoding: 'utf-8' }
      );
      this.logger.info(`Merged PR #${prNumber}`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to merge PR #${prNumber}: ${msg}`);
      return false;
    }
  }

  /**
   * Check if a branch has merge conflicts with main.
   */
  hasConflicts(branchName: string, cwd?: string): boolean {
    const workDir = cwd ?? this.config.companyRoot;
    try {
      // Try a dry-run merge
      this.git(['checkout', 'main'], workDir);
      execSync(`git merge --no-commit --no-ff ${branchName}`, { cwd: workDir });
      execSync('git merge --abort', { cwd: workDir });
      return false;
    } catch {
      try {
        execSync('git merge --abort', { cwd: workDir });
      } catch {
        // merge --abort can fail if merge wasn't in progress
      }
      return true;
    }
  }

  /**
   * Return to main branch. Aborts any in-progress merge and commits any
   * uncommitted changes first to avoid checkout failures.
   */
  checkoutMain(cwd?: string): void {
    const workDir = cwd ?? this.config.companyRoot;
    this.ensureCleanState(workDir);
    this.git(['checkout', 'main'], workDir);
  }

  /**
   * Abort any in-progress merge and commit any uncommitted changes so the
   * working tree is clean for the next git operation.
   */
  ensureCleanState(cwd?: string): void {
    const workDir = cwd ?? this.config.companyRoot;
    // Abort any in-progress merge/rebase
    try {
      execSync('git merge --abort', { cwd: workDir, encoding: 'utf-8', stdio: 'pipe' });
      this.logger.debug('Aborted in-progress merge');
    } catch { /* no merge in progress — expected */ }
    // Commit any uncommitted changes
    if (this.hasUncommittedChanges(workDir)) {
      this.logger.info('Committing uncommitted changes before checkout main');
      this.commitAll('auto-commit before checkout main', workDir);
    }
  }

  /**
   * Merge a branch into main locally. Used so subsequent tasks can see
   * the previous task's file outputs without waiting for a remote PR.
   */
  mergeLocallyToMain(branchName: string, cwd?: string): void {
    const workDir = cwd ?? this.config.companyRoot;
    this.checkoutMain(workDir);
    this.git(['merge', branchName, '--no-edit'], workDir);
    this.logger.info(`Merged ${branchName} into main locally`);
  }

  /**
   * Delete a local branch.
   */
  deleteBranch(branchName: string, cwd?: string): void {
    const workDir = cwd ?? this.config.companyRoot;
    try {
      this.git(['branch', '-D', branchName], workDir);
    } catch {
      // Branch may already be deleted or not exist
      this.logger.debug(`Could not delete branch ${branchName}`);
    }
  }

  /**
   * Get current branch name.
   */
  getCurrentBranch(cwd?: string): string {
    const workDir = cwd ?? this.config.companyRoot;
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: workDir, encoding: 'utf-8' }).trim();
  }

  /**
   * Check if the repo has uncommitted changes.
   */
  hasUncommittedChanges(cwd?: string): boolean {
    const workDir = cwd ?? this.config.companyRoot;
    const result = execSync('git status --porcelain', { cwd: workDir, encoding: 'utf-8' });
    return result.trim().length > 0;
  }

  /**
   * Fetch latest refs from remote.
   */
  fetch(cwd?: string): void {
    const workDir = cwd ?? this.config.companyRoot;
    this.git(['fetch', 'origin', '--prune'], workDir);
  }

  /**
   * Pull latest changes for the current branch from origin.
   */
  pull(cwd?: string): void {
    const workDir = cwd ?? this.config.companyRoot;
    this.git(['pull', 'origin', this.getCurrentBranch(workDir)], workDir);
  }

  /**
   * List remote branches matching a substring pattern.
   * Returns branch names without the `origin/` prefix.
   */
  listRemoteBranches(pattern?: string, cwd?: string): string[] {
    const workDir = cwd ?? this.config.companyRoot;
    try {
      const result = execSync('git branch -r', { cwd: workDir, encoding: 'utf-8', stdio: 'pipe' });
      const branches = result
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.includes('HEAD'))
        .map(line => line.replace(/^origin\//, ''));

      if (pattern) {
        return branches.filter(branch => branch.includes(pattern));
      }
      return branches;
    } catch {
      return [];
    }
  }

  /**
   * Check if a remote branch has commits that are NOT in main.
   * Returns false if the branch is already fully merged or doesn't exist.
   */
  branchHasNewCommits(branchName: string, cwd?: string): boolean {
    const workDir = cwd ?? this.config.companyRoot;
    try {
      const count = execSync(
        `git rev-list --count origin/main..origin/${branchName}`,
        { cwd: workDir, encoding: 'utf-8', stdio: 'pipe' }
      ).trim();
      return parseInt(count, 10) > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get the open PR number for a branch, if one exists.
   * Returns null if no open PR exists.
   */
  getPRForBranch(branchName: string, cwd?: string): number | null {
    const workDir = cwd ?? this.config.companyRoot;
    try {
      const result = execSync(
        `${this.config.ghCliPath} pr list --head ${branchName} --state open --json number --jq ".[0].number"`,
        { cwd: workDir, encoding: 'utf-8', stdio: 'pipe' }
      ).trim();
      if (result && result !== 'null' && result !== '') {
        const num = parseInt(result, 10);
        return isNaN(num) ? null : num;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Delete a remote branch.
   */
  deleteRemoteBranch(branchName: string, cwd?: string): void {
    const workDir = cwd ?? this.config.companyRoot;
    try {
      this.git(['push', 'origin', '--delete', branchName], workDir);
      this.logger.debug(`Deleted remote branch: ${branchName}`);
    } catch {
      this.logger.debug(`Could not delete remote branch ${branchName}`);
    }
  }

  private git(args: string[], cwd: string): string {
    const cmd = `git ${args.map(a => a.includes(' ') || a.includes('[') ? `"${a}"` : a).join(' ')}`;
    
    // Retry up to 3 times on index.lock errors
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        
        // Retry on index.lock errors
        if (attempt < 2 && msg.includes('index.lock')) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
          this.logger.warn(`Git lock detected, retrying in ${delay}ms...`);
          // Wait using a simple busy-wait (execSync blocks the thread)
          const start = Date.now();
          while (Date.now() - start < delay) { /* wait */ }
          continue;
        }
        
        this.logger.error(`Git command failed: ${cmd} — ${msg}`);
        throw err;
      }
    }
    
    throw new Error('Git retry limit exceeded');
  }
}
