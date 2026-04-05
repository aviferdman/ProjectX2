export interface CompanyConfig {
  company_name: string;
  product_repo: string;
  product_repo_local_path: string;
  budget_usd: number;
  budget_spent_usd: number;
  domain: string;
  product_type: string;
  target_audience: string;
  monetization: string;
  tech_stack: string[];
  avoid_domains: string[];
  max_agents: number;
  risk_tolerance: string;
  time_horizon: string;
  owner_notes: string;
}

export type Phase =
  | 'initialization'
  | 'research'
  | 'ideation'
  | 'planning'
  | 'development'
  | 'testing'
  | 'launch'
  | 'monitoring'
  | 'pivot';

export interface ProjectStatus {
  phase: Phase;
  activeProject: string | null;
  blockers: string[];
  currentCycle: number;
  lastUpdated: string;
}

export interface AgentTask {
  id: string;
  agentId: string;
  description: string;
  dependencies: string[];  // task IDs that must complete first
  branchName: string;
  effort?: 'XS' | 'S' | 'M' | 'L' | 'XL';  // task effort level (affects timeout)
}

export interface CompletionSignal {
  agentId: string;
  taskId: string;
  timestamp: string;
  status: 'success' | 'failure';
  summary: string;
  branchName: string;
  prNumber?: number;
}

export interface TaskGraphNode {
  task: AgentTask;
  dependsOn: string[];      // task IDs
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface OrchestratorConfig {
  companyRoot: string;       // path to ProjectX2 repo
  productRepoPath: string;   // path to product repo (local)
  maxRetries: number;
  retryBaseDelayMs: number;
  cycleDelayMs: number;      // minimum delay between cycles
  ghCliPath: string;         // path to gh CLI
}

export type DeliberationStage = 'proposals' | 'challenges' | 'convergence' | 'final-decision';

export interface DeliberationState {
  stage: DeliberationStage;
  round: number;  // challenge/convergence round (0 = proposals, 1+ = challenge rounds)
}
