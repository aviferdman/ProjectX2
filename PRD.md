# ProjectX2 — Product Requirements Document (PRD)

## 1. Overview

**Project Name:** ProjectX2  
**Type:** Autonomous AI Company Operating System  
**Product Repo:** https://github.com/aviferdman/ProjectX2-Product.git  
**Company OS Repo:** ProjectX2 (this repo)  
**Created:** 2026-04-05  
**Owner:** Avi Ferdman

### 1.1 Vision

ProjectX2 is a self-governing AI company that operates as a team of specialized agents — General Manager, Project Managers, Researchers, Developers, QA Engineers, and more. Given a set of constraints (budget, field of interest, etc.), the company autonomously researches market opportunities, designs products, writes production-grade code, tests, iterates, and pivots — continuously — with the goal of producing a profitable, real-world product.

### 1.2 One-Liner

> An autonomous AI company that runs 24/7 on your local machine, staffed entirely by AI agents that research, build, and ship real products.

---

## 2. Problem Statement

Building a software product requires coordinating multiple disciplines — market research, product management, software engineering, quality assurance, and strategic decision-making. Today, AI coding assistants help with individual tasks, but no system orchestrates multiple AI agents into a cohesive, continuously-operating team that can autonomously drive a product from idea to production.

---

## 3. Goals & Non-Goals

### 3.1 Goals

| # | Goal | Success Metric |
|---|------|----------------|
| G1 | Agents operate autonomously in a continuous loop without human intervention | Company runs for 24+ hours producing meaningful output without manual prompts |
| G2 | The company can research, plan, build, test, and ship a product end-to-end | At least one product reaches a deployable state |
| G3 | The company can self-organize — hiring new agents, modifying conventions, adjusting roles | HR agent successfully creates/modifies agent definitions that are used in subsequent cycles |
| G4 | The owner can interact with the company without disrupting operations | Liaison agent answers questions and relays directives accurately |
| G5 | The company can pivot or stash failed projects and start fresh | At least one stash-and-restart cycle completes cleanly |
| G6 | All decisions and actions are auditable | Complete log trail exists for every agent action |

### 3.2 Non-Goals (v1)

- Multi-user / team access to the company OS
- Cloud-hosted deployment (runs on owner's local machine only)
- Managing multiple product repos concurrently

---

## 4. Owner Configuration (Initial Constraints)

Before the company starts operating, the owner provides an initial configuration that all agents must respect. This is stored in `company/state/company-config.json` and read by every agent at the start of each cycle.

### 4.1 Required Configuration

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `budget_usd` | number | `500` | Total available budget for company expenses — paid APIs, cloud hosting, domain registration, third-party services, etc. Agents must track all spend against this limit. $0 means the company can only use free-tier services and open-source tools. |

### 4.2 Optional Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `domain` | string | `""` (agents decide) | The industry/field to focus on. Empty = agents research and propose. |
| `product_type` | string | `""` (agents decide) | What to build: `SaaS`, `CLI tool`, `library`, `API service`, `marketplace`, etc. |
| `target_audience` | string | `""` (agents decide) | Who the product is for. Guides research and product decisions. |
| `monetization` | string | `""` (agents decide) | Pricing strategy: `freemium`, `subscription`, `one-time`, `open-core`, `usage-based`, etc. |
| `tech_stack` | string[] | `[]` (agents decide) | Preferred languages/frameworks. Empty = agents choose based on research. |
| `avoid_domains` | string[] | `[]` | Industries or topics to explicitly avoid. |
| `max_agents` | number | `10` | Maximum number of agents the HR can hire. |
| `risk_tolerance` | string | `"moderate"` | `conservative` (proven markets), `moderate`, `aggressive` (blue ocean, experimental). |
| `time_horizon` | string | `"3 months"` | Expected timeline for first viable product. Guides planning. |
| `owner_notes` | string | `""` | Free-form notes, preferences, or specific ideas the owner wants explored. |

### 4.3 How Constraints Are Enforced

1. **Every agent reads `company-config.json`** at the start of each task and must respect the constraints.
2. **Researcher** filters opportunities by `domain`, `target_audience`, and `risk_tolerance`.
3. **GM** evaluates ideas against `monetization`, `budget_usd`, and `time_horizon`.
4. **Developer** respects `tech_stack` if specified; otherwise proposes and logs the decision.
5. **PM** ensures product features align with domain, audience, and monetization strategy.
6. **ProjM** plans within `budget_usd` and `time_horizon`.
7. **Orchestrator** validates that agent outputs don't violate constraints.
7. The owner can update constraints at any time via `@liaison` — changes take effect on the next cycle.

### 4.4 Example Configuration

```json
{
  "company_name": "ProjectX2 AI Corp",
  "domain": "developer tools",
  "budget_usd": 200,
  "product_type": "SaaS",
  "target_audience": "indie developers and small teams",
  "monetization": "freemium",
  "tech_stack": [],
  "avoid_domains": ["crypto", "gambling"],
  "max_agents": 10,
  "risk_tolerance": "moderate",
  "time_horizon": "3 months",
  "owner_notes": ""
}
```

---

## 5. Architecture

### 5.1 Two-Repo Model

```
ProjectX2 (this repo)                    ProjectX2-Product (product repo)
├── .github/                            ├── src/
│   ├── agents/        ← Agent defs     ├── tests/
│   ├── instructions/  ← Meta-rules     ├── docs/
│   └── prompts/       ← User shortcuts ├── .github/
├── company/                            │   └── instructions/  ← Coding conventions
│   ├── state/         ← Shared state   └── README.md
│   │   └── signals/   ← Agent completion signals
│   ├── logs/          ← Activity logs
│   └── archive/       ← Stashed projects
└── orchestrator/      ← Run scripts
```

**ProjectX2** = The company's brain (agents, state, orchestration).  
**ProjectX2-Product** = The company's output (clean product repo, no company internals).

### 5.2 Agent Roster (Initial)

| Agent | Role | Tools | Authority |
|-------|------|-------|-----------|
| **Orchestrator** | Main loop controller. Determines which agent to invoke based on current phase. | execute, read, search, agent | Reads/updates project-status, invokes all agents |
| **General Manager (GM)** | Strategic decisions. Go/no-go gates. Pivot/stash decisions. | read, search, web, agent | Writes decisions, modifies project-status, reads inbox |
| **Project Manager (PM)** | Backlog management, sprint planning, task decomposition. | read, edit, search, agent | Owns backlog, updates project-status |
| **Researcher** | Market analysis, competitive research, technology scouting. | read, edit, search, web | Writes to `state/research/` |
| **Developer** | Code implementation in the product repo. | read, edit, execute, search | Writes code in ProductX-Product repo |
| **QA Engineer** | Testing, code review, quality gates. | read, edit, execute, search | Writes/runs tests in product repo |
| **HR Manager** | Creates/modifies/removes agents. Updates coding conventions and company rules. | read, edit, search | Modifies `.github/agents/`, `.github/instructions/`, roster |
| **Liaison** | Owner-facing communication. Answers questions, relays directives. | read, search, agent | Reads all state files, can query other agents |

### 5.3 Orchestration Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    Orchestrator Loop                           │
│                                                               │
│  1. Read company/state/project-status.md (from main branch)   │
│  2. Determine current phase                                   │
│  3. Build task graph for the phase (identify parallelizable   │
│     tasks vs sequential dependencies)                         │
│  4. For each agent task:                                      │
│     a. Create a branch: agent/<agent-id>/<task-id>            │
│     b. Dispatch agent in a separate process on that branch    │
│  5. Each agent: pulls latest → does work → commits → pushes   │
│     → opens PR → writes completion signal                     │
│  6. Orchestrator watches for completion signals (event-driven)│
│  7. Merge PRs to main (auto-merge if no conflicts)            │
│  8. If merge conflict → invoke the conflicting agent to       │
│     resolve, or escalate to GM for cross-role conflicts       │
│  9. Repeat from step 1                                        │
└────────────────────────────────────────────────────────────────┘
```

### 5.4 Git-Based Collaboration Model

Agents work like a real development team — each on their own branch, merging to main:

#### Branch Naming Convention

```
agent/<agent-id>/<task-id>       # e.g. agent/backend-dev/TASK-042
agent/<agent-id>/research-<topic> # e.g. agent/researcher/market-analysis-saas
agent/<agent-id>/convention-update # e.g. agent/hr/add-testing-standards
```

#### Workflow Per Agent

1. **Checkout** — Create branch from `main`
2. **Work** — Read state, implement changes, commit with meaningful messages
3. **Push** — Push branch to remote
4. **PR** — Open a pull request describing what was done and why
5. **Signal** — Write a completion signal file so orchestrator knows the task is done

#### Merge Strategy

| Scenario | Action |
|----------|--------|
| PR has no conflicts | Auto-merge to main |
| Conflict between same-role agents (e.g., two devs) | The agent who opened the later PR resolves the conflict |
| Conflict between different-role agents | GM reviews and decides which version wins, or instructs one agent to rebase |
| Conflict on state files (backlog, decisions) | ProjM resolves task conflicts; PM resolves feature conflicts; GM resolves decision conflicts |

This model gives full Git history, blame, and rollback capability. Every agent's work is traceable through commits and PRs — exactly like a real company.

#### Parallel Execution

Since each agent works on its own branch, **any agents can run in parallel** regardless of whether they touch the same files. Conflicts are resolved at merge time, not prevented upfront. The orchestrator spawns independent agents as separate child processes simultaneously.

| Must be sequential | Why |
|--------------------|-----|
| PM → ProjM | Project Manager needs product features defined before decomposing into tasks |
| ProjM → Developer | Developer needs tasks assigned and merged first |
| Developer → QA | QA needs merged code to test |
| Researcher → GM (review) | GM needs merged research output to evaluate |

Completion is **event-driven** — each agent writes a signal file on finish, and the orchestrator watches for these rather than polling on a timer.

**Phase-to-Agent mapping:**

| Phase | Primary Agent | Supporting Agents |
|-------|--------------|-------------------|
| `initialization` | GM | — |
| `research` | Researcher | GM (review) |
| `ideation` | GM | Researcher, PM |
| `planning` | PM, ProjM | GM (approval) |
| `development` | Developer | ProjM (tasks), QA (review) |
| `testing` | QA | Developer (fixes) |
| `launch` | ProjM | Developer, GM |
| `monitoring` | GM | Researcher, PM, QA |
| `pivot` | GM | All |

---

## 6. Self-Modification System

### 6.1 Agent Lifecycle

Agents are defined as `.github/agents/<name>.agent.md` files. The HR agent can:

- **Hire** — Create a new `.agent.md` file (e.g., `frontend-dev.agent.md`) and add it to the roster
- **Modify** — Update an existing agent's instructions, tools, or constraints
- **Terminate** — Remove an agent file and mark it as terminated in the roster
- **Specialize** — Split a general role into specialists (e.g., `developer` → `backend-dev` + `frontend-dev`)

### 6.2 Convention Management

Coding conventions and rules live in `.github/instructions/*.instructions.md`. The HR agent (or GM) can modify these to:

- Set language/framework choices for the product
- Define code style rules
- Establish Git workflow conventions (branching, commit messages, PR templates)
- Set testing requirements (coverage thresholds, required test types)

These instruction files use `applyTo` globs — when agents work on matching files, the conventions are automatically loaded into their context.

Convention changes follow the same Git workflow — HR creates a branch, modifies the instruction files, opens a PR, and it gets merged to main. All agents pick up the new conventions on their next cycle.

### 6.3 Guardrails

- Only the HR agent can modify agent definitions (enforced by the authority matrix in workspace instructions)
- Agent modifications are logged in `company/logs/`
- The GM must approve significant structural changes (new roles, major convention changes)
- Roster changes are tracked in `company/state/roster.md`

---

## 7. Communication Model

### 7.1 Inter-Agent Communication

Agents do **not** chat with each other in real-time. They communicate via structured state files:

- `company/state/project-status.md` — Current phase, blockers, progress
- `company/state/backlog.md` — Task list with assignments
- `company/state/decisions.md` — Append-only decision log
- `company/state/research/*.md` — Research findings
- `company/logs/YYYY-MM-DD.md` — Timestamped activity logs

This is intentional — it prevents runaway agent-to-agent conversations and makes everything auditable.

### 7.2 Owner ↔ Company Communication

Two interaction methods:

| Method | Mechanism | When to Use |
|--------|-----------|-------------|
| **`@liaison` agent** | Direct chat in VS Code: `@liaison What's the project status?` | Real-time questions, status checks, directives |
| **Prompt shortcuts** | `/company-status`, `/give-directive`, `/review-progress` in VS Code chat | Quick common interactions |

---

## 8. Project Lifecycle & Pivot Mechanism

### 8.1 Lifecycle Phases

```
initialization → research → ideation → planning → development → testing → launch → monitoring
                    ↑                                                                  ↓
                    └─────────────────── pivot/stash (GM decision) ←────────────────────┘
```

### 8.2 Pivot/Stash Protocol

Stashing should be **rare**. A thorough research phase should produce a product direction with real value. Stashing is a last resort when evidence overwhelmingly shows the product cannot succeed, not a casual decision.

When the GM determines a project must be abandoned:

1. **GM** logs decision in `decisions.md` with detailed rationale and evidence
2. **PM** archives the current product specs
3. **ProjM** archives the current task backlog
3. **Developer** pushes final state of product repo
4. **Orchestrator** archives a snapshot reference in `company/archive/<project-name>/`
5. **GM** resets phase to `research` with learnings documented
6. All logs and decisions are preserved — agents reference past failures to avoid repeating them

### 8.3 Evaluation Criteria

The GM runs periodic evaluations against these questions:
- **Profitability path** — Will customers pay for this? Is there a clear monetization model (SaaS, licensing, marketplace, etc.)?
- **Market demand** — Does web research, forum analysis, and competitive landscape confirm real unmet demand?
- **Technical viability** — Is the technical approach achievable within our constraints?
- **Differentiation** — Is there meaningful differentiation from existing solutions?
- **Progress velocity** — Are we making measurable progress or going in circles?

The GM, Researchers, and PMs should actively use web search to validate market assumptions — analyzing forums, social media, competitor pricing, industry reports, and developer communities to ground-truth demand.

---

## 9. State Management

### 9.1 State Files

| File | Format | Owner | Purpose |
|------|--------|-------|---------|
| `company-config.json` | JSON | GM, Orchestrator | Company constraints, product repo path, field of interest |
| `project-status.md` | Markdown | GM, PM, ProjM, Orchestrator | Current phase, blockers, last update |
| `backlog.md` | Markdown (structured) | PM, ProjM | Product features (PM) and implementation tasks (ProjM) |
| `decisions.md` | Markdown (append-only) | GM | Immutable decision log |
| `roster.md` | Markdown (table) | HR | Active/terminated agent list |
| `research/*.md` | Markdown | Researcher | Research findings, one file per topic |

### 9.2 Golden Rules

1. **Never destroy state** — Logs and decisions are append-only. Never delete history.
2. **Read before write** — Always read current state before making changes.
3. **Stay in your lane** — Only modify files you're authorized to touch (authority matrix).
4. **Log everything** — Every agent action gets a timestamped log entry.
5. **Owner messages are priority** — Check inbox before starting any work cycle.

---

## 10. Runtime Environment

### 10.1 Requirements

- **Machine:** Owner's local Windows PC
- **Model Provider:** GitHub Copilot subscription (unlimited tokens, advanced models)
- **Execution:** GitHub Copilot SDK (`@github/copilot-sdk`) for programmatic agent invocation
- **Editor:** VS Code with Copilot Chat for interactive sessions
- **Git:** GitHub CLI (`gh`) for repo operations

### 10.2 Orchestrator Runtime

The orchestrator is a **TypeScript/Node.js application** (chosen for async I/O, file watching, and process management) that:

- **Runs continuously** as a long-lived process
- **Event-driven, not polling** — agents write completion signals; orchestrator watches via file system events (no arbitrary sleep timers)
- **Multi-process parallel execution** — spawns independent agents in separate child processes using the task dependency graph
- **Resumable** — on startup, reads `company/state/` to determine exactly where the company left off and resumes seamlessly. No special "restart" logic needed; the state files ARE the checkpoint.
- Invokes Copilot CLI agents with appropriate context
- Handles errors and retries with exponential backoff
- Tracks cycle count and elapsed time
- Can be paused (Ctrl+C) and resumed (re-run) by the owner at any time

---

## 11. Constraints & Risks

### 11.1 Known Constraints

| Constraint | Impact | Mitigation |
|-----------|--------|------------|
| LLMs lack persistent memory | Agents "forget" between invocations | All state lives in files; agents re-read state each cycle |
| Copilot CLI session limits | Long operations may time out | Break work into small, focused agent invocations |
| No real user feedback loop | Agents can't validate product-market fit with real users | GM, Researchers, and PMs actively use web search (forums, social media, competitor analysis, industry reports) to identify real user pain points and validate demand. Owner provides ground truth via liaison. |

### 11.2 Risks

| Risk | Likelihood | Severity | Mitigation |
|------|-----------|----------|------------|
| Agents build confidently in the wrong direction | High | High | GM evaluation gates every N cycles; owner review via liaison |
| Infinite loops / no progress | Medium | High | Orchestrator tracks cycle count and detects stalls |
| Agent modifies itself destructively | Low | High | HR is the only modifier; all changes logged; git history as backup |
| State file corruption | Low | Medium | Git commits after each cycle; structured formats with validation |

---

## 12. Success Criteria (v1 Milestone)

- [ ] Orchestrator runs a complete loop: read state → invoke agent → update state → log
- [ ] All 9 initial agents are functional and can be invoked
- [ ] Research agent produces a market analysis document
- [ ] GM makes a go/no-go decision based on research
- [ ] PM defines product features from an approved idea
- [ ] ProjM creates task backlog from PM's features
- [ ] Developer writes code in the product repo from backlog tasks
- [ ] QA agent runs tests on the product code
- [ ] HR agent successfully creates a new specialist agent
- [ ] Owner interacts via `@liaison` and gets accurate status
- [ ] One full lifecycle (research → development) completes without manual intervention

---

## 13. Future Considerations (v2+)

- Cloud deployment (run on a VM/container 24/7)
- Multiple concurrent product repos
- Real CI/CD integration (GitHub Actions triggered by agents)
- Financial tracking (API costs, potential revenue modeling)
- External tool integrations (analytics, deployment platforms)
- Agent performance metrics and self-optimization
- Multi-owner support (multiple humans directing the company)
