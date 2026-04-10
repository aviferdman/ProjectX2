# User Interview Protocol — TASK-117
## Crewspace User Validation Study

**Objective:** Recruit and interview 10-15 TypeScript developers to validate product-market fit for Crewspace (TypeScript-native agent orchestration framework with visual canvas)

**Timeline:** 3 days  
**Target:** 10-15 TypeScript developers (primary target audience)  
**Study Type:** User validation interviews (30-45 min each)  
**Date Created:** 2026-04-10  
**Status:** Active  

---

## Recruitment Plan

### Target Audience Profile

**Primary Segment:**
- **Role:** TypeScript developers, full-stack engineers, Node.js developers
- **Experience:** 2+ years professional TypeScript development
- **Current Pain:** Working with or evaluating AI agent frameworks
- **Motivation:** Building multi-agent systems, automation, AI workflows

**Secondary Segment (if primary hard to recruit):**
- **Role:** Product managers, technical founders, engineering managers
- **Pain:** Blocked on engineering for agent orchestration needs
- **Motivation:** Evaluating no-code/low-code agent solutions

### Recruitment Channels

**Channel 1: TypeScript Discord Communities** (Target: 5-7 participants)
- TypeScript Community Discord
- Node.js Discord
- Join relevant channels, post recruitment message:
  > "Hi! I'm validating a new TypeScript-native agent orchestration framework (think CrewAI/LangChain, but TypeScript-first with a visual canvas). Looking for 10-15 TS developers to interview (30 min, $0 compensation, early beta access offered). DM if interested!"

**Channel 2: Reddit** (Target: 3-5 participants)
- /r/typescript
- /r/node
- /r/LangChain
- /r/MachineLearning (if relevant)
- Post recruitment thread:
  > **Title:** [User Research] Looking for TypeScript devs to interview about AI agent orchestration (30 min)  
  > **Body:** Building a TypeScript-native agent orchestration framework (OSS + commercial SaaS). Need feedback from developers who've used or evaluated CrewAI, LangChain, AutoGen, or similar tools. 30-minute interview, no compensation but early beta access. DM if interested!

**Channel 3: Twitter/X** (Target: 2-3 participants)
- Tweet recruitment message:
  > "Building a TypeScript-native agent orchestration framework (like CrewAI but with a visual canvas). Looking for 10 TS devs to interview (30 min). No compensation, but early beta access. DM if you've used LangChain/CrewAI and want to help shape the product!"
- Tag relevant accounts: @typescript, @nodejs, share in relevant threads

**Channel 4: LinkedIn** (Target: 2-3 participants)
- Post in TypeScript Developer groups
- Direct outreach to 2nd-degree connections matching profile
- Message template:
  > "Hi [Name], I saw you work with TypeScript and [relevant tech]. I'm conducting user research for a new agent orchestration framework (TypeScript-native, visual canvas). Would you be open to a 30-min interview? Happy to share early beta access as a thank-you."

**Channel 5: GitHub** (Target: 1-2 participants)
- Identify developers who've starred/contributed to CrewAI, LangChain, AutoGen repos
- Open issue in relevant repos (if allowed) or direct outreach:
  > "Hi! I'm researching AI agent orchestration frameworks. Noticed you use/contribute to [repo name]. Would you be open to a 30-min interview about your experience? Building a TypeScript-native alternative and want to learn from real users."

### Screening Criteria

**Must-Have:**
- ✅ Professional TypeScript developer (2+ years) OR PM/founder blocked on agent orchestration
- ✅ Familiar with AI agent frameworks (CrewAI, LangChain, AutoGen, etc.) OR actively evaluating
- ✅ Available for 30-45 min video call within 3 days

**Nice-to-Have:**
- Has built multi-agent systems in production
- Has evaluated multiple agent frameworks
- Works at a startup or product company (not enterprise consulting)

**Disqualify:**
- No TypeScript experience AND no agent orchestration pain
- Not available for interview within 3 days
- Competitive product builder (working on similar framework)

---

## Interview Script

### Introduction (2 min)

"Hi [Name], thanks for joining! I'm [Your Name], and I'm building a new agent orchestration framework called Crewspace. It's TypeScript-native with a visual canvas for designing multi-agent workflows.

This interview will take about 30-45 minutes. I want to understand your experience with AI agent frameworks and whether Crewspace would solve real problems for you.

There are no right or wrong answers — I'm here to learn. Feel free to be brutally honest. Your feedback will directly shape the product.

Before we start, do I have your permission to record this for note-taking? (If yes, start recording. If no, take detailed notes.)

Any questions before we dive in?"

### Part 1: Background & Context (5-7 min)

**Goal:** Understand the participant's experience level and current pain points

1. **"Tell me about your current role and what you're working on."**
   - Listen for: Job title, company type, team size, tech stack
   - Follow-up: "How much of your work involves TypeScript?"

2. **"Have you worked with AI agent frameworks before? If so, which ones?"**
   - Listen for: CrewAI, LangChain, AutoGen, LangGraph, others
   - Follow-up: "What were you trying to build?"

3. **"What prompted you to explore agent orchestration? What problem were you solving?"**
   - Listen for: Use case, business problem, technical challenge
   - Follow-up: "Was this for a production system or just experimentation?"

4. **"On a scale of 1-10, how satisfied are you with the agent framework(s) you've used?"**
   - Listen for: Pain points, frustrations, unmet needs
   - Follow-up: "What's the biggest pain point?"

### Part 2: Pain Points & Unmet Needs (10-12 min)

**Goal:** Identify specific problems Crewspace could solve

5. **"Walk me through the last time you set up a multi-agent workflow. What was the process like?"**
   - Listen for: Setup friction, configuration complexity, debugging challenges
   - Follow-up: "What took the most time? What was frustrating?"

6. **"What's the hardest part about building multi-agent systems today?"**
   - Listen for: Debugging, agent coordination, state management, error handling, performance
   - Follow-up: "Can you give me a specific example?"

7. **"If you could wave a magic wand and fix one thing about agent frameworks, what would it be?"**
   - Listen for: Top pain point, unmet need, "I wish I could..." statements

8. **"Have you tried using visual tools or no-code platforms for agent orchestration? Why or why not?"**
   - Listen for: Attitude toward visual tools, code-first vs no-code preferences
   - Follow-up: "What would make a visual canvas useful (or useless) for you?"

9. **"How do you currently debug agent workflows when something goes wrong?"**
   - Listen for: Debugging methods, tools, time spent debugging
   - Follow-up: "What information do you wish you had during debugging?"

### Part 3: Crewspace Concept Testing (10-12 min)

**Goal:** Validate Crewspace value proposition and feature prioritization

10. **"I'm going to describe Crewspace to you. As I explain, think about whether this would solve your problems."**

**[Present Crewspace concept:]**
> "Crewspace is a TypeScript-native agent orchestration framework with three key parts:
> 1. **OSS Framework (MIT license):** npm install @crewspace/core — Define agents, tasks, crews in TypeScript. First-class TS support, not a Python port.
> 2. **Visual Canvas:** Design multi-agent workflows visually. Drag-and-drop agents, connect tasks, see execution flow in real-time. For debugging and onboarding, not replacing code.
> 3. **Cloud Platform (freemium SaaS):** Run workflows in the cloud, share with team, track executions, replay failed workflows. Free tier (500 runs/month, 5 agents) → Pro $25/user/mo."

**"What's your initial reaction?"**
- Listen for: Excitement, skepticism, confusion, specific concerns
- Follow-up: "What excites you? What concerns you?"

11. **"Would you use Crewspace for your current project? Why or why not?"**
   - Listen for: Fit with current needs, blockers, objections
   - Follow-up: "What would need to be true for you to adopt it?"

12. **"Of the three parts (OSS framework, visual canvas, cloud platform), which is most valuable to you? Which is least?"**
   - Listen for: Value hierarchy, priorities, skepticism about specific features
   - Follow-up: "Why is [X] most valuable? Why is [Y] least valuable?"

13. **"If Crewspace launched tomorrow, would you try it? What would make you try it?"**
   - Listen for: Adoption drivers, triggers, requirements
   - Follow-up: "What would prevent you from trying it?"

14. **"Would you pay $25/month for the Pro tier? Why or why not?"**
   - Listen for: Willingness to pay, price sensitivity, value perception
   - Follow-up: "What features would justify that price?"

### Part 4: Feature Prioritization (5-7 min)

**Goal:** Rank features by user value

15. **"I'm going to list some potential features. For each, tell me if it's a must-have, nice-to-have, or don't-care."**

**Features to test:**
- **A. TypeScript-native framework (not Python)** — Must-have / Nice-to-have / Don't care
- **B. Visual canvas for workflow design** — Must-have / Nice-to-have / Don't care
- **C. Real-time execution timeline (see agents working)** — Must-have / Nice-to-have / Don't care
- **D. Workflow replay (rerun failed executions)** — Must-have / Nice-to-have / Don't care
- **E. Sample templates (pre-built workflows)** — Must-have / Nice-to-have / Don't care
- **F. Team collaboration (share workflows)** — Must-have / Nice-to-have / Don't care
- **G. Cloud-hosted execution (no local setup)** — Must-have / Nice-to-have / Don't care
- **H. Local execution (run workflows on your machine)** — Must-have / Nice-to-have / Don't care

16. **"Are there any features I didn't mention that would be critical for you?"**
   - Listen for: Unmet needs, missing features, deal-breakers

### Part 5: Competitive Landscape (3-5 min)

**Goal:** Understand competitive positioning

17. **"If you had to choose today, what would you use instead of Crewspace? Why?"**
   - Listen for: Competitive alternatives, switching barriers
   - Follow-up: "What would make Crewspace better than that?"

18. **"Have you heard of or tried any of these tools?"**
   - **Lovable / v0 / Bolt** (no-code coding tools)
   - **Replit Agent** (AI coding assistant)
   - **Base44** (agent orchestration)
   - **Multi-On** (AI browser automation)
   - Listen for: Awareness, perception, comparisons

### Part 6: Wrap-Up (2-3 min)

19. **"If you could give me one piece of advice about building Crewspace, what would it be?"**
   - Listen for: Strategic advice, warnings, opportunities

20. **"Is there anything I should have asked but didn't?"**

21. **"Would you be interested in early beta access when we launch?"**
   - If yes: Collect email, add to beta waitlist

**"Thank you so much for your time! Your feedback is incredibly valuable. I'll send you early beta access as soon as we launch. Feel free to reach out if you think of anything else!"**

---

## Data Collection & Analysis

### Notes Template (use for each interview)

**Participant ID:** [P001, P002, etc.]  
**Date:** [YYYY-MM-DD]  
**Duration:** [XX min]  
**Recording:** [Yes/No]  

**Background:**
- Role:
- Company:
- TypeScript experience:
- Agent framework experience:

**Pain Points (ranked by severity):**
1. 
2. 
3. 

**Crewspace Reaction:**
- Initial reaction:
- Would use? (Yes/No/Maybe):
- Willingness to pay? (Yes/No/Maybe):

**Feature Prioritization:**
- Must-haves:
- Nice-to-haves:
- Don't cares:

**Top 3 Insights:**
1. 
2. 
3. 

**Quotes (verbatim):**
- 
- 

---

## Success Metrics

**Recruitment Success:**
- ✅ 10-15 participants recruited within 3 days
- ✅ 80%+ match target audience profile (TS developers with agent experience)
- ✅ 80%+ completion rate (participants complete full interview)

**Validation Success:**
- ✅ 60%+ say "Would use Crewspace" (strong PMF signal)
- ✅ 40%+ say "Would pay $25/month" (monetization validated)
- ✅ Clear feature prioritization emerges (consensus on must-haves)
- ✅ Top 3 pain points identified with 50%+ mention rate

**Insights Quality:**
- ✅ 3+ verbatim quotes per interview (qualitative richness)
- ✅ Competitive positioning clarified (vs CrewAI, LangChain, etc.)
- ✅ Unmet needs identified (features we haven't considered)

---

## Next Steps (After Interviews)

1. **Synthesize Findings (TASK-119):** Aggregate all interview data, identify patterns
2. **Document Feature Requests (TASK-120):** Extract top 3 feature requests from users
3. **Write Validation Report (TASK-121):** Write findings to `company/state/research/user-validation.md`
4. **Present to GM (TASK-122 — not PM-owned):** GM decision gate (go/pivot/stash)

---

## Appendix: Recruitment Message Templates

### Discord Template

```
**[User Research] Need TypeScript devs for 30-min interview about AI agents**

Hi! I'm building **Crewspace** — a TypeScript-native agent orchestration framework (think CrewAI/LangChain, but TS-first with a visual canvas).

Looking for **10-15 TypeScript developers** to interview (30 min):
- Have you used CrewAI, LangChain, AutoGen, or similar?
- Building or evaluating multi-agent systems?
- Want to shape the future of agent orchestration?

**What you get:** Early beta access, influence product roadmap
**Time:** 30-45 min video call (next 3 days)
**Compensation:** None (just beta access)

**DM me if interested!**
```

### Reddit Template

```
**Title:** [User Research] TypeScript devs wanted for AI agent orchestration interview (30 min)

**Body:**
Hi /r/typescript! I'm conducting user research for **Crewspace**, a TypeScript-native agent orchestration framework with a visual canvas.

**Who I'm looking for:**
- TypeScript developers (2+ years)
- Used or evaluated AI agent frameworks (CrewAI, LangChain, AutoGen, etc.)
- Open to 30-45 min video interview (next 3 days)

**What I'm building:**
Think CrewAI/LangChain, but:
- TypeScript-native (not Python port)
- Visual canvas for designing workflows
- Freemium SaaS cloud platform

**What you get:**
- Early beta access
- Influence product roadmap

**No compensation, just beta access.**

DM if interested! First 15 respondents accepted.
```

### LinkedIn Template

```
**Subject:** User research opportunity — AI agent orchestration (30 min)

Hi [Name],

I'm building **Crewspace**, a TypeScript-native agent orchestration framework, and noticed you work with [TypeScript / Node.js / AI].

I'm conducting user interviews (30-45 min) with developers who've used or evaluated AI agent frameworks like CrewAI, LangChain, or AutoGen.

**Would you be open to a quick interview?**
- Share your experience with agent frameworks
- Test Crewspace concept
- Get early beta access

Let me know if you're interested! Happy to work around your schedule.

Thanks,
[Your Name]
```

---

## Contact & Follow-Up

**Interview Scheduler:** [Use Calendly or manual scheduling]  
**Interview Platform:** Zoom / Google Meet / Discord  
**Note-Taking:** Notion / Google Docs / Markdown files  
**Data Storage:** `company/state/research/interviews/` (create folder)  

**Follow-Up Email (after interview):**
```
Subject: Thank you + Early beta access

Hi [Name],

Thank you for the interview today! Your feedback on [specific insight] was incredibly valuable.

I'll send you early beta access as soon as Crewspace launches (targeting [date]).

In the meantime, feel free to reach out if you think of anything else!

Best,
[Your Name]
```

---

**END OF PROTOCOL**
