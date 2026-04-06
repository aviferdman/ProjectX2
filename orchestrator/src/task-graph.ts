import type { Phase, AgentTask, TaskGraphNode, DeliberationState } from './types.js';

/**
 * Maximum deliberation challenge rounds before forcing a decision.
 */
const MAX_DELIBERATION_ROUNDS = 3;

/**
 * Defines which agents run in which phase and their dependencies.
 * Tasks with no dependencies can run in parallel.
 *
 * For the ideation phase, pass a DeliberationState to determine which
 * sub-stage of the deliberation to run (proposals, challenges, convergence, final-decision).
 */
export function buildTaskGraph(phase: Phase, cycle: number, deliberationState?: DeliberationState): TaskGraphNode[] {
  const tasks = getPhaseAgentTasks(phase, cycle, deliberationState);
  return tasks.map(task => ({
    task,
    dependsOn: task.dependencies,
    status: 'pending' as const,
  }));
}

function getPhaseAgentTasks(phase: Phase, cycle: number, deliberationState?: DeliberationState): AgentTask[] {
  const taskId = (agentId: string, suffix?: string) =>
    suffix ? `${phase}-${agentId}-${suffix}-c${cycle}` : `${phase}-${agentId}-c${cycle}`;
  const branchName = (agentId: string, suffix?: string) =>
    `agent/${agentId}/${taskId(agentId, suffix)}`;

  switch (phase) {
    case 'initialization':
      return [
        {
          id: taskId('gm'),
          agentId: 'gm',
          description: 'Review company configuration and prepare the company for the product discovery process. Read company-config.json. Note that domain and product decisions will be made collaboratively by multiple agents in the research and ideation phases. Your job here is to set initial constraints, note any owner preferences, and advance to the research phase. Update project-status.md to move to research.',
          dependencies: [],
          branchName: branchName('gm'),
        },
      ];

    case 'research':
      return [
        // Step 1: Researcher conducts deep market research
        {
          id: taskId('researcher', 'market'),
          agentId: 'researcher',
          description: 'Read company-config.json and respect the domain constraint. Conduct deep market research within the specified domain. Search the web for 3-5 specific product opportunities in that domain where software products can be profitable. For each opportunity, analyze: market size, competition level, user pain points (from forums, Reddit, HackerNews), pricing of existing solutions, and gaps. Write findings to company/state/research/market-analysis.md. Be data-driven — cite sources with URLs. Respect all relevance_and_freshness constraints.',
          dependencies: [],
          branchName: branchName('researcher', 'market'),
        },
        // Step 2: PM adds user-needs perspective
        {
          id: taskId('pm', 'needs'),
          agentId: 'pm',
          description: 'Read the researcher\'s market analysis in company/state/research/market-analysis.md. For each market opportunity identified, conduct deeper user-needs analysis: who exactly are the users, what are their workflows, what do they currently pay for, what frustrates them, what would make them switch to a new product. Use web search to find evidence from user communities. Write findings to company/state/research/user-needs-analysis.md.',
          dependencies: [taskId('researcher', 'market')],
          branchName: branchName('pm', 'needs'),
        },
        // Step 3: GM reviews all research and decides to advance
        {
          id: taskId('gm', 'review'),
          agentId: 'gm',
          description: 'Review ALL research findings in company/state/research/market-analysis.md and company/state/research/user-needs-analysis.md. Evaluate whether the research is thorough enough to make product decisions. If sufficient (multiple domains explored with evidence), advance to the ideation phase. If not, document what\'s missing and keep the phase as research. Log your decision in decisions.md. Update project-status.md.',
          dependencies: [taskId('pm', 'needs')],
          branchName: branchName('gm', 'review'),
        },
      ];

    case 'ideation': {
      const state = deliberationState ?? { stage: 'proposals' as const, round: 0 };
      return getIdeationTasks(state, cycle);
    }

    case 'planning':
      return [
        {
          id: taskId('pm'),
          agentId: 'pm',
          description: 'Define features and user stories based on the GM\'s product concept and decisions. Prioritize by business value and user impact. Write stories with acceptance criteria in backlog.md using STORY-XXX format.',
          dependencies: [],
          branchName: branchName('pm'),
        },
        {
          id: taskId('projm'),
          agentId: 'projm',
          description: 'Decompose PM\'s stories into concrete development tasks with TASK-XXX format. Estimate effort, set priorities, define dependencies, and assign tasks to the developer. Update backlog.md with task breakdown.',
          dependencies: [taskId('pm')],
          branchName: branchName('projm'),
        },
        {
          id: taskId('hr'),
          agentId: 'hr',
          description: 'Review the backlog and current roster. Determine if the team needs specialization (e.g., frontend-dev, backend-dev). If so, create new agent definitions and update the roster. Update coding conventions based on the tech stack decision.',
          dependencies: [taskId('projm')],
          branchName: branchName('hr'),
        },
        {
          id: taskId('gm'),
          agentId: 'gm',
          description: 'Review the PM\'s features, ProjM\'s task plan, and HR\'s team recommendations. Approve or adjust the plan. Advance to development phase if satisfied. Log approval decision in decisions.md.',
          dependencies: [taskId('projm'), taskId('hr')],
          branchName: branchName('gm'),
        },
      ];

    case 'development':
      return [
        {
          id: taskId('developer'),
          agentId: 'developer',
          description: 'Implement the task assigned to you in the pre-computed briefing below. Write code and tests in the product repository following coding conventions. Mark the task as `review` in backlog.md when done.',
          dependencies: [],
          branchName: branchName('developer'),
        },
        {
          id: taskId('qa'),
          agentId: 'qa',
          description: 'Review and test the tasks listed in your briefing (those in `review` status). Run the test suite in the product repo. Mark tasks as `done` if they pass quality gates. Write a brief QA report.',
          dependencies: [taskId('developer')],
          branchName: branchName('qa'),
        },
        {
          id: taskId('projm'),
          agentId: 'projm',
          description: 'Track sprint progress using the dashboard in your briefing. Reassign or reprioritize as needed. If all P0/P1 tasks are done, recommend advancing to testing phase. Update project-status.md.',
          dependencies: [taskId('qa')],
          branchName: branchName('projm'),
        },
        {
          id: taskId('pm'),
          agentId: 'pm',
          description: 'Review product progress using the summary in your briefing. Validate that completed work meets acceptance criteria and product vision. Identify any scope gaps or new stories needed.',
          dependencies: [taskId('projm')],
          branchName: branchName('pm'),
        },
      ];

    case 'testing':
      return [
        {
          id: taskId('qa'),
          agentId: 'qa',
          description: 'Run comprehensive testing of the product: unit tests, integration tests, and any e2e tests. Ensure all tests pass. Report any remaining bugs. If critical bugs exist, create backlog items and recommend returning to development phase.',
          dependencies: [],
          branchName: branchName('qa'),
        },
        {
          id: taskId('developer'),
          agentId: 'developer',
          description: 'Fix any bugs reported by QA. Prioritize critical/blocker bugs first. Mark fixed bugs as `review` for QA to verify.',
          dependencies: [taskId('qa')],
          branchName: branchName('developer'),
        },
        {
          id: taskId('gm'),
          agentId: 'gm',
          description: 'Review testing results. If all critical bugs are fixed and tests pass, advance to launch phase. If significant issues remain, send back to development. Log the quality gate decision.',
          dependencies: [taskId('qa'), taskId('developer')],
          branchName: branchName('gm'),
        },
      ];

    case 'launch':
      return [
        {
          id: taskId('developer'),
          agentId: 'developer',
          description: 'Prepare the product for launch: ensure README is complete, documentation is written, build scripts work, and the product is deployable.',
          dependencies: [],
          branchName: branchName('developer'),
        },
        {
          id: taskId('projm'),
          agentId: 'projm',
          description: 'Verify all P0 tasks are done and no blockers remain. Finalize the task board and ensure all work is merged.',
          dependencies: [taskId('developer')],
          branchName: branchName('projm'),
        },
        {
          id: taskId('pm'),
          agentId: 'pm',
          description: 'Write launch notes and validate product completeness against the original feature set. Advance to monitoring phase after launch.',
          dependencies: [taskId('projm')],
          branchName: branchName('pm'),
        },
      ];

    case 'monitoring':
      return [
        {
          id: taskId('researcher'),
          agentId: 'researcher',
          description: 'Research the market reaction and competitive landscape post-launch. Look for user feedback, reviews, and mentions. Identify improvement opportunities.',
          dependencies: [],
          branchName: branchName('researcher'),
        },
        {
          id: taskId('gm'),
          agentId: 'gm',
          description: 'Evaluate the product against profitability criteria. Review market research. Decide: continue improving, pivot, or stash. If continuing, create new research/development tasks. Log the evaluation decision.',
          dependencies: [taskId('researcher')],
          branchName: branchName('gm'),
        },
      ];

    case 'pivot':
      return [
        {
          id: taskId('gm'),
          agentId: 'gm',
          description: 'Document the reasons for pivoting in decisions.md. Archive current project state. Reset phase to research with learnings documented. This is a major decision — be thorough in rationale.',
          dependencies: [],
          branchName: branchName('gm'),
        },
        {
          id: taskId('pm'),
          agentId: 'pm',
          description: 'Archive current feature stories and product vision documents. Document lessons learned about product-market fit.',
          dependencies: [taskId('gm')],
          branchName: branchName('pm'),
        },
        {
          id: taskId('projm'),
          agentId: 'projm',
          description: 'Archive the current task board and clear active assignments. Prepare for a fresh research cycle.',
          dependencies: [taskId('gm')],
          branchName: branchName('projm'),
        },
      ];

    default:
      return [];
  }
}

/**
 * Build tasks for a specific stage of the ideation deliberation process.
 * The deliberation loops through challenges/convergence rounds until all agents agree.
 */
function getIdeationTasks(state: DeliberationState, cycle: number): AgentTask[] {
  const taskId = (agentId: string, suffix: string) =>
    `ideation-${agentId}-${suffix}-c${cycle}`;
  const branchName = (agentId: string, suffix: string) =>
    `agent/${agentId}/${taskId(agentId, suffix)}`;

  const r = state.round;

  switch (state.stage) {
    case 'proposals':
      return [
        {
          id: taskId('researcher', 'propose'),
          agentId: 'researcher',
          description: 'Read ALL research in company/state/research/. Based on the market data and evidence you gathered, propose exactly 3 product ideas. For each idea, provide: product name, one-line pitch, target domain, target users, how it makes money, estimated market size, key competitors and their weaknesses, and why this idea has strong potential. Ground every claim in evidence from your research. Write to company/state/research/proposals/researcher-proposals.md.',
          dependencies: [],
          branchName: branchName('researcher', 'propose'),
        },
        {
          id: taskId('pm', 'propose'),
          agentId: 'pm',
          description: 'Read ALL research in company/state/research/ AND the researcher\'s proposals in company/state/research/proposals/researcher-proposals.md. Now propose your own 3 product ideas. You may overlap with the researcher if you agree, but you MUST also propose at least 1 idea the researcher did NOT suggest. Focus on user experience, product-market fit, and willingness to pay. For each idea provide: product name, pitch, users, UX differentiator, monetization model, and PMF evidence. Write to company/state/research/proposals/pm-proposals.md.',
          dependencies: [taskId('researcher', 'propose')],
          branchName: branchName('pm', 'propose'),
        },
        {
          id: taskId('gm', 'propose'),
          agentId: 'gm',
          description: 'Read ALL research in company/state/research/ AND all proposals in company/state/research/proposals/. Now propose your own 3 product ideas from a business/profitability perspective. You may overlap with others if you agree, but you MUST also propose at least 1 unique idea. Focus on revenue potential, scalability, competitive moat, and alignment with company constraints. For each idea provide: product name, pitch, business model, revenue projections, competitive advantage, and risk assessment. Write to company/state/research/proposals/gm-proposals.md.',
          dependencies: [taskId('pm', 'propose')],
          branchName: branchName('gm', 'propose'),
        },
      ];

    case 'challenges': {
      const prevContext = r === 1
        ? 'Read ALL proposals from company/state/research/proposals/.'
        : `Read ALL proposals from company/state/research/proposals/ AND all previous challenge rounds and verdict files from company/state/research/deliberation/. Pay special attention to the unresolved concerns from the previous round's verdicts.`;

      return [
        {
          id: taskId('researcher', `challenge-r${r}`),
          agentId: 'researcher',
          description: `${prevContext} Critically challenge the proposals from a market-data perspective. For each idea: (1) what the data actually supports vs what is assumed, (2) market risks and competition threats, (3) feasibility concerns, (4) a score from 1-10 on market viability with justification. ${r > 1 ? 'Focus especially on addressing concerns raised in previous rounds.' : 'Be rigorous — use web search to fact-check claims.'} Write to company/state/research/deliberation/round-${r}-researcher-challenges.md.`,
          dependencies: [],
          branchName: branchName('researcher', `challenge-r${r}`),
        },
        {
          id: taskId('pm', `challenge-r${r}`),
          agentId: 'pm',
          description: `${prevContext} Read the researcher's round ${r} challenges. Critically challenge the proposals from a user/product perspective. For each idea: (1) would users actually switch to this, (2) is the UX differentiator real or imagined, (3) pricing/willingness-to-pay reality check, (4) a score from 1-10 on product-market fit with justification. ${r > 1 ? 'Incorporate learnings from previous challenge rounds.' : ''} Write to company/state/research/deliberation/round-${r}-pm-challenges.md.`,
          dependencies: [taskId('researcher', `challenge-r${r}`)],
          branchName: branchName('pm', `challenge-r${r}`),
        },
        {
          id: taskId('gm', `challenge-r${r}`),
          agentId: 'gm',
          description: `${prevContext} Read ALL round ${r} challenges. Critically challenge the proposals from a business perspective. For each idea: (1) realistic revenue potential, (2) can we build this within budget and time constraints, (3) what is the actual competitive moat, (4) a score from 1-10 on business viability with justification. ${r > 1 ? 'Address unresolved concerns from previous verdicts.' : ''} Write to company/state/research/deliberation/round-${r}-gm-challenges.md.`,
          dependencies: [taskId('pm', `challenge-r${r}`)],
          branchName: branchName('gm', `challenge-r${r}`),
        },
      ];
    }

    case 'convergence': {
      const isLastRound = r >= MAX_DELIBERATION_ROUNDS;
      const forcedNote = isLastRound
        ? ' NOTE: This is the final deliberation round. You MUST reach a decision. Pick the best available option even if you have remaining concerns.'
        : '';

      return [
        {
          id: taskId('researcher', `verdict-r${r}`),
          agentId: 'researcher',
          description: `Read ALL proposals, ALL challenge rounds, and ALL previous verdicts in company/state/research/. Based on the full deliberation history, write your verdict. Include (use these exact markdown headings): "## Top Pick: [product name]", "## Satisfied: YES" or "## Satisfied: NO", "## Reasoning: [why this product]", "## Unresolved Concerns: [any remaining issues, or 'None']".${forcedNote} Write to company/state/research/deliberation/round-${r}-verdict-researcher.md.`,
          dependencies: [],
          branchName: branchName('researcher', `verdict-r${r}`),
        },
        {
          id: taskId('pm', `verdict-r${r}`),
          agentId: 'pm',
          description: `Read ALL proposals, ALL challenge rounds, the researcher's round ${r} verdict, and ALL previous verdicts in company/state/research/. Write your verdict. Include (use these exact markdown headings): "## Top Pick: [product name]", "## Satisfied: YES" or "## Satisfied: NO", "## Reasoning: [why this product]", "## Unresolved Concerns: [any remaining issues, or 'None']".${forcedNote} Write to company/state/research/deliberation/round-${r}-verdict-pm.md.`,
          dependencies: [taskId('researcher', `verdict-r${r}`)],
          branchName: branchName('pm', `verdict-r${r}`),
        },
        {
          id: taskId('gm', `verdict-r${r}`),
          agentId: 'gm',
          description: `Read ALL proposals, ALL challenge rounds, the researcher's and PM's round ${r} verdicts, and ALL previous verdicts in company/state/research/. Write your verdict. Include (use these exact markdown headings): "## Top Pick: [product name]", "## Satisfied: YES" or "## Satisfied: NO", "## Reasoning: [why this product]", "## Unresolved Concerns: [any remaining issues, or 'None']".${forcedNote} Write to company/state/research/deliberation/round-${r}-verdict-gm.md.`,
          dependencies: [taskId('pm', `verdict-r${r}`)],
          branchName: branchName('gm', `verdict-r${r}`),
        },
      ];
    }

    case 'final-decision':
      return [
        {
          id: taskId('pm', 'synthesize'),
          agentId: 'pm',
          description: 'Read ALL proposals, ALL challenge rounds, and ALL verdicts from the entire deliberation in company/state/research/. Synthesize the full deliberation history: which product did agents converge on, what were the key arguments that led to agreement, what concerns were resolved and how. Write the final product recommendation with full justification. Write to company/state/research/deliberation/final-synthesis.md.',
          dependencies: [],
          branchName: branchName('pm', 'synthesize'),
        },
        {
          id: taskId('gm', 'decide'),
          agentId: 'gm',
          description: 'Read the final synthesis in company/state/research/deliberation/final-synthesis.md and ALL supporting deliberation materials. Make the FINAL product decision based on the consensus reached during deliberation. Update company-config.json with: domain, product_type, target_audience, monetization, and a "product_vision" field describing the product. Log the decision in decisions.md with full rationale referencing the multi-agent deliberation process and how consensus was reached. Advance project-status.md to the planning phase.',
          dependencies: [taskId('pm', 'synthesize')],
          branchName: branchName('gm', 'decide'),
        },
      ];
  }
}

/**
 * Returns tasks that are ready to execute (all dependencies completed).
 */
export function getReadyTasks(graph: TaskGraphNode[]): TaskGraphNode[] {
  const completedIds = new Set(
    graph.filter(n => n.status === 'completed').map(n => n.task.id)
  );

  return graph.filter(
    n => n.status === 'pending' && n.dependsOn.every(dep => completedIds.has(dep))
  );
}

/**
 * Returns true when all tasks in the graph are completed or failed.
 */
export function isGraphComplete(graph: TaskGraphNode[]): boolean {
  return graph.every(n => n.status === 'completed' || n.status === 'failed');
}

/**
 * Returns true when any tasks are still running.
 */
export function hasRunningTasks(graph: TaskGraphNode[]): boolean {
  return graph.some(n => n.status === 'running');
}
