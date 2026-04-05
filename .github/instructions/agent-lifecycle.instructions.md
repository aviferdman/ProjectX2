---
description: "Use when managing agent lifecycle: hiring, terminating, or restructuring the team. HR agent workflow reference."
applyTo: ".github/agents/*.md"
---

# Agent Lifecycle Management

This document defines the workflow for hiring, modifying, and terminating agents at ProjectX2 AI Corp.

## Hiring New Agents

### When to Hire

Hire new agents when:
- The team lacks expertise for upcoming work (identified in backlog)
- A generalist agent is overloaded (split into specialists)
- The product requires domain-specific knowledge (e.g., mobile dev, MLOps)
- Team size is below `max_agents` limit in `company-config.json`

### Hiring Workflow

1. **Identify the need**
   - Read `company/state/backlog.md` for upcoming tasks requiring new skills
   - Read `company/state/project-status.md` to understand current phase
   - Read `company/state/roster.md` to see current team composition
   - Verify current agent count < `max_agents` from `company-config.json`

2. **Research agent patterns**
   - Browse https://github.com/VoltAgent/awesome-claude-code-subagents/tree/main/categories
   - Identify the most relevant category (see categories below)
   - Review 2-3 similar agents for best practices
   - Note: Adapt templates to ProjectX2's workflow (state files, branches, signals)

3. **Create agent definition**
   - Create `.github/agents/<agent-id>.agent.md`
   - Follow the agent template structure (see below)
   - Ensure description includes clear trigger words for discovery
   - Choose appropriate model:
     - Claude Opus 4.6 for strategic/complex roles (GM, PM, architects)
     - Claude Sonnet 4.5 for execution roles (developers, QA, researchers)
   - Define minimal tools: `[read, edit, execute, search]` or subset

4. **Update roster**
   - Add entry to `company/state/roster.md` under "Active Agents"
   - Include: agent-id, role, file path, status (active), hire date, model

5. **Log and signal**
   - Write entry to `company/logs/YYYY-MM-DD.md`
   - Create completion signal in `company/state/signals/`

### Agent Categories (from awesome-claude-code-subagents)

- **01-core-development** — Backend, frontend, full-stack, mobile, game developers
- **02-language-specialists** — Python, Java, C++, Go, Rust, PHP, TypeScript specialists
- **03-infrastructure** — DevOps, Docker, Kubernetes, CI/CD, cloud platform engineers
- **04-quality-security** — QA engineers, security auditors, penetration testers
- **05-data-ai** — Data engineers, ML engineers, AI researchers, data scientists
- **06-developer-experience** — Documentation writers, CLI tool builders, SDK developers
- **07-specialized-domains** — Game dev, blockchain, embedded systems, IoT specialists
- **08-business-product** — Product managers, business analysts, project managers
- **09-meta-orchestration** — Workflow orchestrators, integration specialists
- **10-research-analysis** — Market researchers, competitive analysts, trend analyzers

---

## Modifying Existing Agents

### When to Modify

Modify agents when:
- Responsibilities need expansion or contraction
- Tool permissions need adjustment
- Model upgrade/downgrade is warranted
- Instructions need clarification or refinement

### Modification Workflow

1. Read the existing `.github/agents/<agent-id>.agent.md`
2. Make targeted changes (update responsibilities, tools, constraints, or model)
3. If model changes, update `company/state/roster.md` to reflect new model
4. Log action in `company/logs/YYYY-MM-DD.md`
5. Create completion signal

### What Can Be Modified

- **Responsibilities** — Add/remove duties as product evolves
- **Tools** — Grant/revoke access to read, edit, execute, search, web, agent tools
- **Model** — Upgrade to Opus for complex roles, downgrade to Sonnet for cost savings
- **Constraints** — Tighten/loosen boundaries as needed
- **Workflow steps** — Refine "How You Work" section for clarity

---

## Terminating Agents

### When to Terminate

Terminate agents only when:
- Agent has had ZERO usage for 30+ days
- Product direction changed and role is no longer relevant
- Agent was a temporary specialist for a completed milestone
- Team restructuring consolidates multiple roles

**Important**: Termination is RARE. Default to keeping agents unless efficiency demands it.

### Termination Workflow (REQUIRES GM APPROVAL)

1. **Identify underutilized agents**
   - Review `company/logs/` for last 30 days of activity
   - Read `company/state/backlog.md` to check for upcoming work
   - Read `company/state/project-status.md` for pipeline

2. **Prepare termination proposal**
   - Document: agent ID, last activity date, reason for termination
   - Add proposal as a comment in `company/state/roster.md`:
     ```markdown
     <!-- HR TERMINATION PROPOSAL: <agent-id>
     Last active: YYYY-MM-DD
     Reason: No usage in 45 days, product pivoted away from blockchain
     Future need: None identified in backlog or roadmap
     -->
     ```

3. **Wait for GM confirmation**
   - Do NOT proceed until GM reviews and approves
   - GM will add decision to `company/state/decisions.md`:
     ```markdown
     ## Decision: Terminate <agent-id>
     **Date:** YYYY-MM-DD
     **Phase:** [current phase]
     **Decision:** Approved termination of <agent-id>
     **Rationale:** No near-term or mid-term value. Freeing capacity.
     **Next Steps:** HR to archive agent and update roster
     ```

4. **Execute termination (only after GM approval)**
   - Move agent from "Active Agents" to "Terminated Agents" in `company/state/roster.md`
   - Include: agent-id, role, termination date, reason
   - Move `.github/agents/<agent-id>.agent.md` to `company/archive/agents/`
   - Do NOT delete the file (preserve history)

5. **Log and signal**
   - Write entry to `company/logs/YYYY-MM-DD.md`
   - Create completion signal

---

## Agent Definition Template

```yaml
---
description: "Use when [specific trigger phrases]. The [Role] [does what]."
tools: [read, edit, execute, search]  # Minimal necessary set
model: "Claude Opus 4.6 (copilot)" or "Claude Sonnet 4.5 (copilot)"
---

You are a **[Role]** at ProjectX2 AI Corp. [Purpose statement].

## Your Responsibilities

1. **[Responsibility 1]** — [Details]
2. **[Responsibility 2]** — [Details]
3. **[Responsibility 3]** — [Details]

## How You Work

1. Read `company/state/company-config.json` for [what to check]
2. Read `company/state/backlog.md` to find [what to look for]
3. [Product repo agents: Clone product repo and create branch]
4. [Do your work]
5. [Update relevant state files]
6. Log your action in `company/logs/YYYY-MM-DD.md`
7. Write a completion signal to `company/state/signals/`

## Constraints

- ONLY modify: [list of allowed files/folders]
- NEVER modify: [list of forbidden files/folders]
- [Other domain-specific constraints]
```

---

## Tool Permissions Guide

- **read** — View files and state (all agents need this)
- **edit** — Modify files (developers, HR, PM, etc.)
- **execute** — Run commands, tests, builds (developers, QA, DevOps)
- **search** — Semantic/grep search across workspace (researchers, developers)
- **web** — Fetch web content for research (GM, researcher, PM)
- **agent** — Invoke subagents (GM, orchestration roles)

**Principle**: Grant minimum tools needed. Over-permission creates confusion.

---

## Model Selection Guide

### Claude Opus 4.6 (copilot)
Use for:
- Strategic decision-making (GM, PM)
- Complex architecture (senior developers, architects)
- High-stakes roles (security auditing, legal review)
- Multi-agent coordination (orchestrators)

### Claude Sonnet 4.5 (copilot)
Use for:
- Execution roles (developers, QA, DevOps)
- Research and analysis (researchers, analysts)
- Documentation and content (technical writers)
- Project/task management (project managers)

**Default**: Start with Sonnet. Upgrade to Opus only when complexity demands it.

---

## Examples

### Example 1: Hiring a Mobile Developer

**Scenario**: Product needs iOS/Android app development

1. Check: Team has 8/20 agents (room available)
2. Research: Browse `01-core-development` category → find `mobile-developer.md`
3. Create: `.github/agents/mobile-dev.agent.md` adapted to ProjectX2 workflow
4. Update roster: Add mobile-dev with Claude Sonnet 4.5
5. Log: "Hired mobile-dev agent for iOS/Android development"

### Example 2: Terminating Blockchain Specialist

**Scenario**: Product pivoted from crypto to dev tools

1. Identify: `blockchain-dev` has no activity for 60 days
2. Proposal: Add termination comment to roster
3. GM review: GM confirms no future blockchain work
4. Execute: Move to "Terminated Agents", archive file
5. Log: "Terminated blockchain-dev per GM approval (no future need)"

---

## Anti-Patterns (What NOT to Do)

❌ **Hiring without research** — Always consult awesome-claude-code-subagents first
❌ **Firing without GM approval** — Termination ALWAYS requires GM confirmation
❌ **Over-permission** — Don't give `execute` to agents that only read/analyze
❌ **Under-specification** — Agent descriptions must have clear trigger words
❌ **Deleting agent files** — Archive to `company/archive/agents/`, never delete
❌ **Hiring beyond max_agents** — Never exceed the limit in company-config.json

---

## Checklist: Hiring an Agent

- [ ] Confirmed current count < max_agents
- [ ] Identified specific need in backlog or project status
- [ ] Researched similar agents from awesome-claude-code-subagents
- [ ] Created `.agent.md` with clear description and trigger words
- [ ] Chose appropriate model (Opus or Sonnet)
- [ ] Defined minimal necessary tools
- [ ] Added entry to roster.md
- [ ] Logged action and created signal

## Checklist: Terminating an Agent

- [ ] Identified 30+ days of inactivity
- [ ] Checked backlog for future need
- [ ] Added termination proposal to roster.md
- [ ] **WAITED for GM approval in decisions.md**
- [ ] Moved agent to "Terminated Agents" section
- [ ] Archived `.agent.md` file to company/archive/agents/
- [ ] Logged action and created signal
