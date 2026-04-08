# Agent Roster — ProjectX2 AI Corp

**Last Updated:** 2026-04-05  
**Current Agent Count:** 14 / 20 (max)

---

## Active Agents

| Agent ID | Role | File Path | Status | Hire Date | Model |
|----------|------|-----------|--------|-----------|-------|
| gm | General Manager | .github/agents/gm.agent.md | active | 2026-04-05 | Claude Opus 4.6 |
| pm | Product Manager | .github/agents/pm.agent.md | active | 2026-04-05 | Claude Opus 4.6 |
| projm | Project Manager | .github/agents/projm.agent.md | active | 2026-04-05 | Claude Sonnet 4.5 |
| researcher | Market Researcher | .github/agents/researcher.agent.md | active | 2026-04-05 | Claude Sonnet 4.5 |
| developer | Full-Stack Developer | .github/agents/developer.agent.md | active | 2026-04-05 | Claude Opus 4.6 |
| backend-dev | Backend Developer | .github/agents/backend-dev.agent.md | active | 2026-04-05 | Claude Opus 4.6 |
| frontend-dev | Frontend Developer | .github/agents/frontend-dev.agent.md | active | 2026-04-05 | Claude Opus 4.6 |
| qa | QA Engineer | .github/agents/qa.agent.md | active | 2026-04-05 | Claude Sonnet 4.5 |
| security-eng | Security Engineer | .github/agents/security-eng.agent.md | active | 2026-04-05 | Claude Sonnet 4.5 |
| designer | Designer | .github/agents/designer.agent.md | active | 2026-04-05 | Claude Opus 4.6 |
| uxui | UX/UI Specialist | .github/agents/uxui.agent.md | active | 2026-04-05 | Claude Opus 4.6 |
| marketing-growth | Marketing/Growth | .github/agents/marketing-growth.agent.md | active | 2026-04-05 | Claude Sonnet 4.5 |
| hr | HR Manager | .github/agents/hr.agent.md | active | 2026-04-05 | Claude Sonnet 4.5 |
| liaison | Owner Liaison | .github/agents/liaison.agent.md | active | 2026-04-05 | Claude Sonnet 4.5 |

---

## Dormant Agents

None

---

## Terminated Agents

None

---

## Team Composition Analysis (2026-04-08)

### Current Phase: Development (Phase 1 Complete → User Validation → Phase 2 Planning Active)

**Phase 2 Requirements (M3-4) — DEC-006: "Super" UI Strategy (8-12 weeks, Cycle 210-225):**
- React Flow visual workflow canvas with production-quality UX
- Integrated debugging timeline (killer feature — timeline visualization with playback)
- Beautiful UX (Lovable/v0/Bolt-level quality bar)
- Design system (colors, typography, spacing, components, design tokens)
- Workflow templates library (5-10 templates at launch)
- Cloud dashboard (authentication, workflow management, usage metrics)
- Landing page & marketing site
- User onboarding flows (sub-5-minute time-to-value goal)

**Workload Assessment:**
- **Frontend-heavy**: 70% of Phase 2 is visual UI/UX work
- **Design-critical**: "Lovable for agents" positioning requires world-class design (per DEC-003)
- **Design must lead development**: Design system and UX flows required BEFORE frontend implementation
- **User research in parallel**: Validate canvas UX patterns, onboarding flows, template discovery

**Team Coverage:**
- 🎨 **designer** (ACTIVATED FOR PHASE 2): Design system, brand identity, visual design, canvas UI, timeline visualization, component specifications, design tokens
- 🧭 **uxui** (ACTIVATED FOR PHASE 2): User flows, information architecture, interaction patterns, wireframes, usability, accessibility, user research
- ✅ **frontend-dev**: Implement visual canvas, dashboard, React components from design specs
- ✅ **backend-dev**: Cloud backend APIs (auth, storage, execution runtime)
- ✅ **developer**: General implementation, templates, integrations
- ✅ **qa**: UI/UX testing, accessibility validation, cross-browser testing
- ✅ **pm**: User validation, template curation, product direction
- ✅ **marketing-growth**: Landing page content, launch strategy, community

**Additional Hires Assessment:**
- ❌ **Design Systems Engineer**: NOT needed (frontend-dev can implement from designer specs, premature for Phase 2)
- ❌ **Motion/Animation Designer**: NOT needed (designer can specify basic animations, not required for launch)
- ❌ **User Researcher**: NOT needed (uxui agent + PM handle user validation in STORY-015 and Phase 2 testing)

**Decision:** Designer and uxui agents ACTIVATED for Phase 2. No new hires needed. Current team (14 agents) covers all Phase 2 requirements with appropriate specialization.

**Phase 2 Timeline:** Cycle 158 → Cycle 210-225 (design starts immediately to run in parallel with CLI 2-week checkpoint at Cycle 168)
