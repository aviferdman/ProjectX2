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
   */
  createBranch(branchName: string, cwd?: string): void {
    const workDir = cwd ?? this.config.companyRoot;
    this.git(['checkout', 'main'], workDir);
    this.git(['pull', 'origin', 'main'], workDir);
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
   * Return to main branch. Commits any uncommitted changes first to avoid
   * checkout failures.
   */
  checkoutMain(cwd?: string): void {
    const workDir = cwd ?? this.config.companyRoot;
    if (this.hasUncommittedChanges(workDir)) {
      this.logger.info('Committing uncommitted changes before checkout main');
      this.commitAll('auto-commit before checkout main', workDir);
    }
    this.git(['checkout', 'main'], workDir);
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
