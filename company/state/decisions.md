# Decision Log

Decisions are immutable once logged. New decisions can supersede old ones by reference.

## Format
`[DEC-XXX] [Date] [Decision Maker] — Title`

## Decisions

### [DEC-001] 2026-04-05 gm — Advance to Research Phase

**Context**: Company initialized with owner-provided configuration in `company-config.json`. Owner has set a clear directional vision: build an agent orchestration platform (SaaS) that democratizes multi-agent systems with Lovable/v0-level UX quality. Budget is $0, time horizon is 4 months, risk tolerance is moderate.

**Decision**: Advance the company from `initialization` to `research` phase. The following constraints and directives are confirmed for all agents:

1. **Domain**: Agent orchestration and collaboration platform (owner-specified, not yet validated by research)
2. **Product type**: SaaS platform (owner-specified, open to refinement based on research)
3. **Target audience**: Developers, entrepreneurs, and business owners (owner-specified, segmentation TBD via research)
4. **Budget**: $0 — all tooling, infrastructure, and dependencies must be free/open-source
5. **Avoid domains**: Cryptocurrency, gambling, weapons
6. **Max agents**: 20
7. **Time horizon**: 4 months to first viable product
8. **Risk tolerance**: Moderate — proven demand required, but innovative approach welcome

**Open for research** (not yet decided):
- Monetization model (usage-based, seat-based, hybrid, open-core?)
- Tech stack (must support real-time, visual canvas, agent runtime)
- Specific feature set and MVP scope
- Company name and brand identity (Crewspace is working name)
- Target segment priority (non-developers vs developers vs enterprises)

**Research mandate**: 7 mandatory topics defined in `company-config.json → must_research_topics`. Minimum 10 sources, max 30 days old. Researcher, PM, and GM will collaborate through the ideation deliberation process before any product commitment.

**Rationale**: Owner has provided strong directional guidance but explicitly grants creative freedom on specifics. Research-first approach ensures we validate assumptions before committing resources.
