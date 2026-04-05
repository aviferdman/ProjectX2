# ProjectX2 AI Corp — Workspace Rules

This is an autonomous AI company. All agents operate within this workspace.

## Directory Structure

### This Repository (Orchestration & Management Only)
- `company/state/` — Shared state files. ALL agents read from here. Only authorized agents write.
- `company/state/company-config.json` — Company configuration, constraints, budget
- `company/state/project-status.md` — Current phase and project status
- `company/state/backlog.md` — Product backlog (owned by PM)
- `company/state/decisions.md` — Immutable decision log
- `company/state/roster.md` — Active agent roster (owned by HR)
- `company/state/research/` — Research findings
- `company/state/signals/` — Agent completion signals
- `company/logs/` — Agent activity logs
- `company/archive/` — Stashed projects
- `.github/agents/` — Agent definitions (modifiable by HR agent)
- `.github/instructions/` — Coding conventions and rules (modifiable by HR/GM)
- `orchestrator/` — Orchestrator application (TypeScript/Node.js)

### Product Repository (Code & Artifacts Only)
**Location**: Configured in `company/state/company-config.json` as `product_repo` and `product_repo_local_path`

**Critical Rule**: ALL product code, tests, documentation, and build artifacts MUST be created in the product repository. This orchestration repository is ONLY for company management, state, and agent definitions.

Agents that create product artifacts:
- `developer` / `backend-dev` / `frontend-dev` / specialized developers
- `qa` (writes tests)
- `security-eng` (writes security rules/code)
- Any specialized engineering agents

These agents MUST:
1. Use the product repo already cloned at the local path specified in `company-config.json → product_repo_local_path`
2. Create their branch in the product repo: `agent/<agent-id>/<task-id>`
3. Work exclusively in the product repo
4. NEVER create code files in this orchestration repository

## Git Workflow

Every agent works on its own branch and merges via pull request:

**For orchestration repository (management/state changes):**
1. Create branch from `main`: `agent/<agent-id>/<task-id>`
2. Do work, commit with meaningful messages
3. Push branch and open a pull request
4. Orchestrator auto-merges if no conflicts
5. If conflict: the author resolves. Cross-role conflicts escalate to GM.

**For product repository (code/artifacts):**
1. Use the product repo already cloned at the path in `company-config.json → product_repo_local_path`
2. Create branch from `main`: `agent/<agent-id>/<task-id>`
3. Do work in product repo only, commit with meaningful messages
4. Push branch to product repo and open a pull request
5. Orchestrator auto-merges if no conflicts
6. If conflict: the author resolves. Cross-role conflicts escalate to GM.

## Agent Authority Matrix

### Orchestration Repository (This Repo)
| Action | Authorized Agents |
|--------|-------------------|
| Modify company-config.json | gm |
| Modify project-status.md | gm, pm, projm |
| Modify backlog.md (features/stories) | pm |
| Modify backlog.md (tasks/assignments) | projm |
| Modify decisions.md | gm (append only) |
| Modify roster.md | hr |
| Create/modify/delete .agent.md files | hr (with gm approval for firing) |
| Create/modify .instructions.md files | hr, gm |
| Write research findings | researcher, pm, gm |
| Write to company/logs/ | all agents |
| Write completion signals | all agents |

### Product Repository (Separate Repo)
| Action | Authorized Agents |
|--------|-------------------|
| Write product code | developer, backend-dev, frontend-dev, specialized devs |
| Write/run tests | qa, developer agents |
| Write security rules/detections | security-eng |
| Write documentation | developer agents, technical writers |
| Modify build config | backend-dev, devops agents |
| Create product artifacts | any specialized engineering agent |

**Golden Rule**: NO product code, tests, or build artifacts in this orchestration repository. If you're writing `.ts`, `.js`, `.py`, `.java`, etc. files for the product, you're in the WRONG repository.

## Communication Protocol

Agents do NOT communicate in free-form chat. They communicate through state files:
1. Read the current state before acting
2. Read `company-config.json` and respect all constraints
3. Perform your task
4. Update the relevant state file with your changes
5. Log your action in `company/logs/YYYY-MM-DD.md`
6. Write a completion signal to `company/state/signals/`

## Project Lifecycle

```
initialization → research → ideation (multi-agent deliberation) → planning → development → testing → launch → monitoring
                    ↑                                                                                           ↓
                    └──────────────── pivot/stash (if product lacks value) ←─────────────────────────────────────┘
```

### Ideation Deliberation Process

The product/domain decision is the most critical decision the company makes.
It is NOT made by a single agent. Instead, three agents collaborate in an iterative loop until consensus:

1. **Research Phase**: Researcher does market research → PM adds user-needs analysis → GM reviews
2. **Ideation Phase — Proposals**: Researcher, PM, and GM each propose 3 product ideas (sequential, each reads previous)
3. **Ideation Phase — Challenges**: Each agent critically reviews ALL proposals, scoring 1-10 with justification
4. **Ideation Phase — Convergence Vote**: Each agent writes a verdict (Top Pick + Satisfied YES/NO + Reasoning + Unresolved Concerns)
5. **Loop**: If all agents say "Satisfied: YES" → proceed to final decision. If NOT → return to step 3 for another challenge round with focus on unresolved concerns
6. **Ideation Phase — Final Decision**: PM synthesizes the deliberation → GM makes the final product decision

Maximum 3 challenge rounds. After round 3, GM forces a decision with the best available option.

All proposals, challenges, verdicts, and synthesis documents are written to `company/state/research/proposals/` and `company/state/research/deliberation/`.
The orchestrator tracks deliberation progress in `company/state/research/deliberation/state.json`.

## Logging Format

Each agent logs actions to `company/logs/YYYY-MM-DD.md`:
```
## [HH:MM] agent-id — Action Title
Brief description of what was done and why.
```

## Signal Format

Completion signals are JSON files in `company/state/signals/`:
```
<agent-id>-<task-id>-<timestamp>.json
```

## Golden Rules

1. **Never destroy state** — Always append to logs and decisions. Never delete history.
2. **Read before write** — Always read current state before making changes.
3. **Stay in your lane** — Only modify files you're authorized to touch.
4. **Respect constraints** — Always read and follow company-config.json.
5. **Log everything** — Every action gets a log entry.
6. **Branch and PR** — Never commit directly to main. Always use a branch and PR.

## Relevance and Freshness Rules

All agents must enforce `relevance_and_freshness` from `company/state/company-config.json` when producing or reviewing research, ideas, and product direction:

1. Use sources that satisfy `research_max_source_age_days`.
2. Meet at least `research_min_sources` for research-backed claims.
3. Re-check volatile assumptions on the `research_refresh_cadence_days` cadence.
4. Do not advance ideas without problem evidence when `idea_requires_problem_evidence` is true.
5. Ensure competitor checks are within `idea_requires_competitor_check_within_days`.
6. Treat `product_required_fields` as required before product direction is considered valid.
