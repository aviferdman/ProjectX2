import { loadOrchestratorConfig } from './config.js';
import { StateManager } from './state-manager.js';
import { buildTaskGraph, getReadyTasks, isGraphComplete, hasRunningTasks } from './task-graph.js';
import { AgentRunner } from './agent-runner.js';
import { GitManager } from './git-manager.js';
import { SignalWatcher } from './signal-watcher.js';
import { Logger } from './logger.js';
import type { TaskGraphNode, CompletionSignal, OrchestratorConfig, DeliberationState } from './types.js';

const MAX_DELIBERATION_ROUNDS = 3;

export class Orchestrator {
  private config: OrchestratorConfig;
  private logger: Logger;
  private stateManager: StateManager;
  private agentRunner: AgentRunner;
  private gitManager: GitManager;
  private signalWatcher: SignalWatcher;
  private running = false;

  constructor(companyRoot?: string) {
    this.config = loadOrchestratorConfig(companyRoot);
    this.logger = new Logger('info', this.config);
    this.stateManager = new StateManager(this.config);
    this.agentRunner = new AgentRunner({
      config: this.config,
      stateManager: this.stateManager,
      logger: this.logger,
    });
    this.gitManager = new GitManager(this.config, this.logger);
    this.signalWatcher = new SignalWatcher(this.config, this.logger);
  }

  async start(): Promise<void> {
    this.running = true;
    this.stateManager.ensureDirectories();
    this.signalWatcher.start();
    await this.agentRunner.start();

    this.logger.info('=== ProjectX2 AI Corp — Orchestrator Starting ===');

    // Load company config and validate
    const companyConfig = this.stateManager.readCompanyConfig();
    this.logger.info(`Company: ${companyConfig.company_name}`);
    this.logger.info(`Budget: $${companyConfig.budget_usd} (spent: $${companyConfig.budget_spent_usd})`);
    this.logger.info(`Domain: ${companyConfig.domain || '(agents will decide)'}`);

    // Load product repo path from company config
    if (companyConfig.product_repo_local_path) {
      this.config.productRepoPath = companyConfig.product_repo_local_path;
      this.logger.info(`Product repo: ${this.config.productRepoPath}`);
    }

    // Clean up stale agent branches in both repos before starting cycles
    await this.cleanupStaleBranches();

    try {
      while (this.running) {
        await this.runCycle();
      }
    } finally {
      await this.agentRunner.stop();
      await this.signalWatcher.stop();
      this.logger.info('=== Orchestrator Stopped ===');
    }
  }

  async stop(): Promise<void> {
    this.running = false;
  }

  async runCycle(): Promise<void> {
    // 1. Read current state
    const status = this.stateManager.readProjectStatus();
    this.logger.info(`--- Cycle ${status.currentCycle + 1} | Phase: ${status.phase} ---`);

    // 2. Clear signals from previous cycle
    this.stateManager.clearSignals();

    // 2b. Archive done tasks to keep backlog lean
    const archived = this.stateManager.archiveDoneTasks();
    if (archived > 0) {
      this.logger.info(`Archived ${archived} done task(s) from backlog`);
    }

    // 3. Handle deliberation state for ideation phase
    let deliberationState: DeliberationState | undefined;
    if (status.phase === 'ideation') {
      deliberationState = this.stateManager.readDeliberationState() ?? undefined;
      if (!deliberationState) {
        deliberationState = { stage: 'proposals', round: 0 };
        this.stateManager.writeDeliberationState(deliberationState);
      }
      this.logger.info(`  Deliberation: stage=${deliberationState.stage}, round=${deliberationState.round}`);
    }

    // 4. Build task graph for this phase
    const graph = buildTaskGraph(status.phase, status.currentCycle, deliberationState);

    if (graph.length === 0) {
      this.logger.warn(`No tasks defined for phase: ${status.phase}`);
      this.running = false;
      return;
    }

    this.logger.info(`Task graph: ${graph.map(n => `${n.task.agentId}(${n.task.id})`).join(' → ')}`);

    // 5. Execute the task graph
    await this.executeGraph(graph);

    // 6. Merge completed work
    await this.mergeCompletedWork(graph);

    // 7. Advance deliberation state if in ideation
    if (status.phase === 'ideation' && deliberationState) {
      this.advanceDeliberationState(deliberationState);
    }

    // 8. Increment cycle counter
    this.stateManager.updateProjectStatus({ currentCycle: status.currentCycle + 1 });

    // 9. Log cycle completion
    const stageInfo = deliberationState ? ` (${deliberationState.stage} r${deliberationState.round})` : '';
    this.stateManager.writeLog(
      'orchestrator',
      `Cycle ${status.currentCycle + 1} Complete`,
      `Phase: ${status.phase}${stageInfo}. Tasks: ${graph.filter(n => n.status === 'completed').length}/${graph.length} completed.`
    );

    // 10. Brief pause between cycles
    if (this.running) {
      await this.delay(2000);
    }
  }

  private async executeGraph(graph: TaskGraphNode[]): Promise<void> {
    while (!isGraphComplete(graph) && this.running) {
      const readyTasks = getReadyTasks(graph);

      if (readyTasks.length === 0 && !hasRunningTasks(graph)) {
        // Deadlock or all remaining tasks have failed dependencies
        this.logger.error('No tasks ready and none running — possible deadlock');
        break;
      }

      if (readyTasks.length === 0) {
        // Wait for running tasks to complete
        await this.delay(1000);
        continue;
      }

      // Execute ready tasks one at a time so each task's output is
      // visible to subsequent tasks via local merge to main.
      for (const node of readyTasks) {
        if (!this.running) break;

        node.status = 'running';
        const isDeveloper = node.task.agentId === 'developer';
        const productRepo = this.config.productRepoPath;
        this.logger.info(`Dispatching: ${node.task.agentId} (${node.task.id})`);

        try {
          // Create branch for this agent's work (company repo)
          try {
            this.gitManager.createBranch(node.task.branchName);
          } catch (branchErr) {
            this.logger.warn(`Branch creation failed for ${node.task.branchName}, recovering`);
            try {
              this.gitManager.ensureCleanState();
              this.gitManager.deleteBranch(node.task.branchName);
              this.gitManager.createBranch(node.task.branchName);
            } catch {
              this.logger.error(`Cannot set up branch for ${node.task.id}`);
              node.status = 'failed';
              try { this.gitManager.checkoutMain(); } catch { /* best effort */ }
              continue;
            }
          }

          // For developer tasks, also create branch in product repo
          if (isDeveloper && productRepo) {
            try {
              this.gitManager.createBranch(node.task.branchName, productRepo);
            } catch {
              this.logger.warn(`Product repo branch creation failed for ${node.task.branchName}, recovering`);
              try {
                this.gitManager.ensureCleanState(productRepo);
                this.gitManager.deleteBranch(node.task.branchName, productRepo);
                this.gitManager.createBranch(node.task.branchName, productRepo);
              } catch {
                this.logger.error(`Cannot set up product repo branch for ${node.task.id}`);
                node.status = 'failed';
                try { this.gitManager.checkoutMain(); } catch { /* best effort */ }
                continue;
              }
            }
          }

          // Pre-compute a compact briefing so the agent doesn't have to read
          // the entire 1,300-line backlog and other state files from scratch.
          const briefing = this.stateManager.buildAgentBriefing(node.task.agentId);
          if (briefing) {
            this.logger.info(`  Injecting ${briefing.length}-char briefing for ${node.task.agentId}`);
          }

          // Run the agent (developer works in product repo, others in company repo)
          const signal = await this.agentRunner.runAgent(node.task, briefing || undefined);

          // Commit any changes the agent made on its branch (company repo)
          try {
            this.gitManager.commitAll(`[${node.task.id}] ${node.task.agentId} work`);
          } catch {
            this.logger.warn(`No changes to commit for ${node.task.id}`);
          }

          // Merge the branch locally into main so the next task can see the output
          try {
            this.gitManager.mergeLocallyToMain(node.task.branchName);
            this.gitManager.deleteBranch(node.task.branchName);
          } catch {
            this.logger.warn(`Local merge failed for ${node.task.branchName}, falling back to checkout main`);
            this.gitManager.checkoutMain();
          }

          // For developer tasks, also commit and merge product repo changes
          if (isDeveloper && productRepo) {
            try {
              this.gitManager.commitAll(`[${node.task.id}] ${node.task.agentId} work`, productRepo);
            } catch {
              this.logger.warn(`No product repo changes to commit for ${node.task.id}`);
            }
            try {
              this.gitManager.mergeLocallyToMain(node.task.branchName, productRepo);
              this.gitManager.deleteBranch(node.task.branchName, productRepo);
              this.logger.info(`Merged developer work into product repo main`);
            } catch {
              this.logger.warn(`Product repo merge failed for ${node.task.branchName}`);
              try { this.gitManager.checkoutMain(productRepo); } catch { /* best effort */ }
            }
          }

          // Handle the result
          if (signal.status === 'success') {
            node.status = 'completed';
          } else {
            this.logger.error(`Task ${node.task.id} failed: ${signal.summary}`);
            node.status = 'failed';
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Task ${node.task.id} threw: ${msg}`);
          node.status = 'failed';
          // Try to get back to main even on failure
          try { this.gitManager.checkoutMain(); } catch { /* best effort */ }
          if (isDeveloper && productRepo) {
            try { this.gitManager.checkoutMain(productRepo); } catch { /* best effort */ }
          }
        }
      }
    }
  }

  private async mergeCompletedWork(graph: TaskGraphNode[]): Promise<void> {
    this.gitManager.checkoutMain();

    const completedCount = graph.filter(n => n.status === 'completed').length;
    if (completedCount === 0) return;

    // All work was already merged locally during executeGraph.
    // Push main to sync with remote.
    try {
      this.gitManager.pushBranch('main');
      this.logger.info(`Pushed main with ${completedCount} merged task(s)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to push main to remote: ${msg}`);
    }

    // Also push product repo main if developer work was completed
    const hasDeveloperWork = graph.some(n => n.task.agentId === 'developer' && n.status === 'completed');
    if (hasDeveloperWork && this.config.productRepoPath) {
      try {
        this.gitManager.checkoutMain(this.config.productRepoPath);
        this.gitManager.pushBranch('main', this.config.productRepoPath);
        this.logger.info('Pushed product repo main');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to push product repo main: ${msg}`);
      }
    }
  }

  /**
   * On startup, scan both repos for stale agent branches that are already
   * merged into main (0 commits ahead) and clean them up.  For branches
   * that DO have unmerged commits and an open PR, attempt auto-merge.
   */
  private async cleanupStaleBranches(): Promise<void> {
    // Process orchestration repo
    this.logger.info('=== Cleaning up orchestration repo branches ===');
    await this.processRepoBranches(this.config.companyRoot);

    // Process product repo if configured
    if (this.config.productRepoPath) {
      this.logger.info('=== Cleaning up product repo branches ===');
      await this.processRepoBranches(this.config.productRepoPath);
    }
  }

  /**
   * For a single repo, fetch, list agent branches, and handle each one:
   *  - Already merged (0 commits ahead) → delete remote branch
   *  - Has unmerged commits + existing PR  → try auto-merge
   *  - Has unmerged commits + no PR        → create PR then try auto-merge
   *  - Errors → log and skip
   */
  private async processRepoBranches(repoPath: string): Promise<void> {
    try {
      this.gitManager.checkoutMain(repoPath);
      this.gitManager.fetch(repoPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not fetch repo at ${repoPath}: ${msg}`);
      return;
    }

    const branches = this.gitManager.listRemoteBranches('agent/', repoPath);
    if (branches.length === 0) {
      this.logger.info('No agent branches found');
      return;
    }

    this.logger.info(`Found ${branches.length} agent branch(es)`);

    let cleaned = 0;
    let merged = 0;
    let skipped = 0;

    for (const branch of branches) {
      // 1) Does the branch have commits not yet in main?
      if (!this.gitManager.branchHasNewCommits(branch, repoPath)) {
        // Already fully merged — clean up the stale remote branch
        this.gitManager.deleteRemoteBranch(branch, repoPath);
        cleaned++;
        continue;
      }

      // 2) Branch has unmerged work — check for existing open PR
      let prNumber = this.gitManager.getPRForBranch(branch, repoPath);

      if (!prNumber) {
        // Create a new PR
        const title = `[Agent Work] ${branch}`;
        const body = `Automated PR for agent branch: ${branch}`;
        prNumber = this.gitManager.createPR(branch, title, body, repoPath);
        if (!prNumber) {
          this.logger.warn(`Skipping ${branch} — could not create PR`);
          skipped++;
          continue;
        }
      }

      // 3) Try to auto-merge (conflicts will cause a skip)
      if (this.gitManager.hasConflicts(branch, repoPath)) {
        this.logger.warn(`PR #${prNumber} (${branch}) has conflicts — skipping`);
        this.gitManager.checkoutMain(repoPath);
        skipped++;
        continue;
      }

      if (this.gitManager.mergePR(prNumber, repoPath)) {
        merged++;
      } else {
        skipped++;
      }
    }

    // Sync local main after merges
    if (merged > 0) {
      try {
        this.gitManager.checkoutMain(repoPath);
        this.gitManager.pull(repoPath);
      } catch { /* best effort */ }
    }

    this.logger.info(`Done — cleaned: ${cleaned}, merged: ${merged}, skipped: ${skipped}`);
  }

  /**
   * Advance the deliberation state machine after an ideation cycle completes.
   * proposals → challenges(1) → convergence(1) → challenges(2)/final-decision → ...
   */
  private advanceDeliberationState(current: DeliberationState): void {
    let next: DeliberationState;

    switch (current.stage) {
      case 'proposals':
        next = { stage: 'challenges', round: 1 };
        this.logger.info('Deliberation: proposals complete → starting challenge round 1');
        break;

      case 'challenges':
        next = { stage: 'convergence', round: current.round };
        this.logger.info(`Deliberation: challenge round ${current.round} complete → convergence vote`);
        break;

      case 'convergence': {
        const converged = this.stateManager.checkConvergence(current.round);
        const maxReached = current.round >= MAX_DELIBERATION_ROUNDS;

        if (converged) {
          next = { stage: 'final-decision', round: current.round };
          this.logger.info(`Deliberation: all agents satisfied at round ${current.round} → final decision`);
        } else if (maxReached) {
          next = { stage: 'final-decision', round: current.round };
          this.logger.warn(`Deliberation: max rounds (${MAX_DELIBERATION_ROUNDS}) reached without full consensus → forcing final decision`);
        } else {
          next = { stage: 'challenges', round: current.round + 1 };
          this.logger.info(`Deliberation: no consensus at round ${current.round} → challenge round ${current.round + 1}`);
        }
        break;
      }

      case 'final-decision':
        // Phase transition is handled by GM agent updating project-status.md
        this.logger.info('Deliberation: final decision complete — GM should advance phase to planning');
        return;
    }

    this.stateManager.writeDeliberationState(next);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
