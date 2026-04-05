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

### [DEC-002] 2026-04-05 gm — Research Sufficient; Advance to Ideation Phase

**Context**: Researcher completed market analysis (28KB, 13 sources, 5 product opportunities, 9+ competitors analyzed) and PM completed user-needs analysis (53KB, 4 user segments, 5 competitive gaps, pricing validation). Both documents were reviewed by the GM against the 7 mandatory research topics in `company-config.json`.

**Evaluation of mandatory research topics:**

1. ✅ **Complete competitive landscape analysis** — 9+ competitors analyzed (CrewAI, LangGraph/LangSmith, AutoGen, Lovable, v0, Bolt, Base44, Cursor, Replit Agent) with pricing, strengths, weaknesses, differentiation gaps.
2. ✅ **User pain points with current agent orchestration tools** — 5 universal pain points identified and ranked across 4 user segments (developers, PMs, founders, enterprises). Evidence includes direct quotes from platform docs, community data, and case studies.
3. ✅ **Lovable/v0/Bolt UX patterns and what makes them successful** — Detailed analysis of instant time-to-value, chat-first interfaces, no-code paradigm. Lovable (3M+ projects), v0 (thousands paying $30-100/user), Bolt (all-in-one approach) analyzed as benchmarks.
4. ✅ **Multi-agent framework adoption rates and developer sentiment** — CrewAI: 450M+ workflows/month, 4,000+ signups/week, 60% Fortune 500. LangChain: Klarna, LinkedIn, Coinbase, Uber. GitHub: 547+ repos. AutoGen v0.2→v0.4 migration underway.
5. ✅ **Pricing models in the no-code/low-code and AI tools space** — Three pricing strategies identified (freemium+usage, seat+usage hybrid, pure usage). Market validated at $20-100/user/month across 6+ competitors. Recommended tiered pricing with evidence.
6. ⚠️ **Technical architecture patterns for real-time collaborative platforms** — Partially covered: MCP, A2A protocol, open standards discussed. Deep architecture patterns (WebSocket, CRDT, visual canvas tech) deferred to planning phase. Acceptable — this is appropriately a planning-phase concern, not a market-research concern.
7. ✅ **Market size and growth trends** — $5.1B in 2026, projected $47.5B by 2030 (CAGR 55.7%). Population sizing per segment: developers (500K-1M), PMs (200K-500K), founders (500K-1M), enterprises (50K-100K accounts).

**Source compliance**: ✅ 13+ unique sources cited, all publicly accessible, all from April 2026 (within 30-day freshness requirement), URLs provided for verification.

**Decision**: Advance the company from `research` phase to `ideation` phase. The research is thorough enough to begin the multi-agent deliberation process (Researcher → PM → GM proposals, challenges, convergence votes).

**Key findings that inform ideation:**
- "Lovable for agents" positioning is highly differentiated and unoccupied
- 700K-1.5M non-developer users are blocked by technical barriers in current tools
- $20-100/user/month pricing is market-validated across competitors
- 5 product opportunities identified, with Visual Agent Orchestration Platform (#1) and OSS Framework (#5) as strongest candidates
- All 4 user segments want: visual workflows, sub-5-minute time-to-value, integrated debugging, built-in deployment
- $0 budget constraint is achievable via OSS stack + freemium SaaS model

**What still needs to happen (during ideation):**
- Each agent (Researcher, PM, GM) proposes 3 product concepts
- Challenge rounds to stress-test proposals
- Convergence votes to reach consensus
- Final product decision by GM
- Technical architecture deep-dive deferred to planning phase

**Rationale**: Both research documents exceed the minimum quality bar (10+ sources, data-driven, multiple domains, evidence-backed). The one partial gap (technical architecture patterns) is appropriate to address in the planning phase after product direction is decided. Delaying further would waste time without material benefit — the market intelligence is actionable.

### [DEC-003] 2026-04-05 gm — Final Product Decision: Crewspace (Ideation → Planning)

**Context**: Multi-agent deliberation completed with 9 proposals (3 per agent), 3 challenge rounds, and 3 final verdicts. All three agents (Researcher, PM, GM) voted **Satisfied: YES** on the same product — an unprecedented unanimous convergence after rigorous self-challenge.

**Decision**: The company will build **Crewspace** — a TypeScript-native agent orchestration framework with a visual canvas and commercial cloud platform. Advance from `ideation` phase to `planning` phase.

**Product Definition:**
- **Name:** Crewspace
- **Positioning:** "The TypeScript-native agent orchestration framework with a beautiful visual canvas — build, debug, and deploy multi-agent workflows in under 5 minutes. Open-source core, commercial cloud."
- **Business Model:** Open-source MIT-licensed TypeScript framework → Commercial freemium SaaS cloud
- **Pricing:** Free tier (500 runs/month, 5 agents) → Pro $25/user/month → Team $49/user/month (3-seat min) → Enterprise custom
- **Year 1 Revenue Target:** $100-200K ARR (300-600 paying users) — anchored to comparable company data (Vercel, Supabase, Linear, Sentry at similar stage)

**How Consensus Was Reached:**

The deliberation followed the prescribed multi-agent process: Proposals → Challenges → Convergence Votes → Synthesis.

1. **Proposals phase:** Each agent proposed 3 products from their unique lens (market data, user adoption, business viability). All three independently identified Crewspace (visual orchestration with OSS foundation) as a top candidate — early convergence signal.

2. **Challenge phase:** Each agent critically reviewed ALL 9 proposals, including their own. Key outcomes:
   - Researcher challenged $928K ARR as 2-3× too optimistic → revised to $100-200K
   - PM challenged own top pick FlowCrew as impossible at $0/4mo (real-time collab = $100M+ problem) → pivoted to Crewspace OSS-first
   - GM challenged own CrewEmbed as having zero demand validation → rejected for v1
   - Five alternative products (FlowCrew, CrewEmbed, AgentBench, AgentOps, CrewMarket) were eliminated through rigorous analysis

3. **Convergence phase:** All three agents voted YES on Crewspace with specific conditions:
   - Researcher: YES with caveats (honest revenue, tempered UX, scope cuts)
   - PM: YES with conditions (concurrent lean validation, decision gate at Month 2)
   - GM: YES with directives (ruthless phase gates, 30% effort on community, no collab in v1)

4. **Synthesis:** PM produced final synthesis document confirming unanimous consensus and documenting all conditions, concerns, and resolutions.

**Why Crewspace Won (5 convergence arguments):**
1. **Proven market demand** — CrewAI 450M+ workflows/month, LangChain 450K+ npm downloads/week, 547+ GitHub repos. Not speculative.
2. **"Lovable for agents" positioning is unoccupied** — No competitor combines visual-first, no-code, sub-5-min value, and beautiful UX for agent orchestration.
3. **OSS-first is the only strategy viable at $0 budget** — Community moat is free to build. Proven playbook (Vercel $200M+ ARR, Supabase $100M+ ARR, Sentry $100M+ ARR all started this way).
4. **TypeScript gap is real** — 20M+ JS/TS developers, zero TypeScript-native agent framework. LangChain.js is a Python port with inferior DX.
5. **Self-challenge survived** — Each agent challenged their own proposals and revised conclusions. Consensus held after scrutiny from all three perspectives.

**Execution Strategy (4 Phases):**
- **Phase 1 (M1-2):** OSS TypeScript framework — MIT license, MCP-compatible, 10-20 examples, docs, Discord. Target: 300-500 GitHub stars, 50-100 npm downloads/week.
- **Phase 2 (M3-4):** Visual canvas + cloud — React Flow, integrated debugging timeline (killer feature), Free + Pro tiers. Target: 1,500-2,000 signups, 15-30 Pro users.
- **Phase 3 (M5-8):** Templates + chat-to-workflow + team tier — 20-30 templates, async collab, code export/import. Target: $42K-102K ARR.
- **Phase 4 (M9-12):** Growth + polish — Designer hire, 50+ templates, integrations, enterprise features if demand. Target: $108K-180K ARR.

**Binding Conditions (accepted by GM):**
1. Revenue expectations: $100-200K ARR Year 1. No fantasy projections.
2. UX expectations: "Clean and professional" for v1. "Lovable-quality" is Year 2 aspiration.
3. GTM: Developer-first. Zero enterprise sales motion Year 1. Enterprise is inbound-only upside.
4. Scope: Ruthless phase gates. Each phase must hit metrics before the next begins.
5. Community: 30% of effort on docs, examples, Discord, content. This IS the moat.
6. Decision gate at Month 2: <100 stars + <50 npm downloads/week after 4 weeks → reassess before visual platform.
7. No real-time collaboration in v1. Async in Phase 3 earliest.
8. Concurrent lean validation during Phase 1 (developer interviews, HN/Reddit posts) — not 6-week pre-build sprint.

**Accepted Risks:**
- Market size ($5.1B) unverified — dropping figure, using bottom-up metrics instead. Even at 10-50× smaller, supports our Year 1 target.
- Competitive response in 6-12 months from well-funded players (CrewAI, LangChain, AutoGen) — mitigated by speed + OSS community moat.
- UX will be "good" not "great" at launch — hire designer at Month 6-8 with early revenue.
- Switching cost limits Year 1 TAM to 550-4,400 users — target new users Year 1, switchers Year 2+.

**Rationale**: This is a data-informed decision made with honest expectations after the most rigorous product deliberation process available — 9 proposals challenged from 3 independent analytical perspectives, with each agent revising their own positions based on evidence. The business case holds at conservative numbers ($100-200K ARR on $0 investment is extraordinary ROI), the competitive positioning is genuinely differentiated, and the execution plan is phased with clear checkpoints. Three agents converged independently, then survived self-challenge. This is the strongest possible consensus signal.

**Supersedes**: None. Refines domain, product_type, target_audience, and monetization fields originally set in DEC-001 (which noted these were "open to refinement based on research").
