# ProjectX2 AI Corp

An autonomous AI company that runs 24/7 on your local machine, staffed entirely by AI agents that research, build, and ship real products. Powered by the [GitHub Copilot SDK](https://github.com/github/copilot-sdk).

## Quick Start

### Prerequisites

- Node.js 18+
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) installed and authenticated
- GitHub Copilot subscription

### 1. Configure the company

Edit `company/state/company-config.json` — set your `budget_usd` (required) and optionally `domain`, `product_type`, etc.

### 2. Install & build the orchestrator

```bash
cd orchestrator
npm install
npm run build
```

### 3. Run the company

```bash
npm start
```

Press `Ctrl+C` to pause. Re-run to resume — the company picks up exactly where it left off.

### 4. Interact with the company

In VS Code chat:
- `@liaison What's the project status?`
- `/company-status` — quick status report
- `/give-directive` — send instructions to the company
- `/review-progress` — progress review

## Architecture

| Repo | Purpose |
|------|---------|
| **ProjectX2** (this repo) | Company OS — agents, state, orchestration |
| **[ProjectX2-Product](https://github.com/aviferdman/ProjectX2-Product.git)** | The product being built |

The orchestrator uses `@github/copilot-sdk` to programmatically create sessions per agent, each with its own model and system prompt. Agents run in parallel where the task dependency graph allows.

## Agents

| Agent | Role | Model |
|-------|------|-------|
| GM | Strategic decisions, go/no-go gates | Claude Opus 4.6 |
| PM | Product vision, feature prioritization, stories | Claude Sonnet 4.5 |
| ProjM | Sprint planning, task decomposition, assignments | Claude Sonnet 4.5 |
| Researcher | Market research, competitive analysis | Claude Sonnet 4.5 |
| Developer | Code implementation | Claude Opus 4.6 |
| QA | Testing, code review | Claude Sonnet 4.5 |
| HR | Agent/convention management | Claude Sonnet 4.5 |
| Liaison | Owner communication | Claude Sonnet 4.5 |

## Project Structure

```
ProjectX2/
├── .github/
│   ├── agents/          # Agent definitions (.agent.md)
│   ├── instructions/    # Coding conventions
│   └── prompts/         # User prompt shortcuts
├── company/
│   ├── state/           # Shared state (config, backlog, decisions, signals)
│   ├── logs/            # Activity logs
│   └── archive/         # Stashed projects
├── orchestrator/
│   ├── src/             # TypeScript source
│   ├── tests/           # Vitest test suites
│   └── dist/            # Compiled output (gitignored)
├── PRD.md               # Full product requirements
└── README.md
```

## Project Lifecycle

```
initialization → research → ideation → planning → development → testing → launch → monitoring
                    ↑                                                                  ↓
                    └──────────────── pivot/stash (rare, last resort) ←─────────────────┘
```

## Tests

```bash
cd orchestrator
npm test
```

See [PRD.md](PRD.md) for full documentation.