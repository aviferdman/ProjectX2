---
description: "Use when writing or modifying code in the product repository. Covers coding style, commit messages, testing requirements, and project structure conventions."
applyTo: "product/**"
---

# Coding Conventions

These conventions apply to all code in the product repository (Crewspace — TypeScript-native agent orchestration framework).

**Tech Stack:** Node.js 18+ / TypeScript 5+ / Monorepo (packages: @crewspace/core, @crewspace/tools-*, @crewspace/cli)

## TypeScript Style

### Type Safety
- **Strict mode enabled** — `"strict": true` in tsconfig.json
- **No implicit any** — Type all function parameters and return values
- **Prefer interfaces over types** for object shapes
- **Use enums for fixed sets** of values (severity levels, status codes)
- **Leverage discriminated unions** for variant types

### Naming Conventions
- **Variables/functions:** camelCase (`parseFile`, `fileScanner`)
- **Classes/interfaces:** PascalCase (`SecurityRule`, `FileScanner`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `DEFAULT_TIMEOUT`)
- **Private fields:** prefix with `_` (`_cache`, `_internalState`) OR use TypeScript `#private`
- **No single-letter names** except loop counters (`i`, `j`, `k`)

### Code Structure
- **Functions:** One responsibility, under 50 lines, descriptive names
- **Modules:** Export only what's needed, prefer named exports over default
- **Async/await:** Use async/await over callbacks or raw Promises
- **Avoid classes unless modeling entities** — prefer pure functions and composition
- **Immutability:** Use `const` by default, `readonly` for object properties

### Comments
- **JSDoc for public APIs** — Include `@param`, `@returns`, `@throws`
- **Inline comments only when necessary** — code should be self-documenting
- **TODO/FIXME** with issue reference: `// TODO(TASK-042): Handle edge case`

## Error Handling

- **Wrap I/O operations** in try-catch (file reads, network calls, parsing)
- **Typed errors** — Create custom error classes for domain errors
- **Never swallow errors** — Always log or propagate
- **Fail fast** — Validate inputs early, throw on invalid state
- **Error messages** — Include context: filename, line number, expected vs actual

Example:
```typescript
class AgentExecutionError extends Error {
  constructor(agentId: string, taskId: string, cause: Error) {
    super(`Agent ${agentId} failed on task ${taskId}: ${cause.message}`);
    this.name = 'AgentExecutionError';
  }
}
```

## Project Structure

```
product/
├── packages/
│   ├── core/                 # @crewspace/core package
│   │   ├── src/
│   │   │   ├── agent/        # Agent class and lifecycle
│   │   │   ├── crew/         # Crew orchestration
│   │   │   ├── task/         # Task planning and execution
│   │   │   ├── memory/       # Short-term and long-term memory
│   │   │   ├── llm/          # LLM provider abstraction
│   │   │   ├── execution/    # Event-driven execution engine
│   │   │   ├── types/        # Shared TypeScript types
│   │   │   └── utils/        # Core utilities
│   │   ├── tests/
│   │   └── package.json
│   ├── tools-file/           # @crewspace/tools-file (read, write, list)
│   ├── tools-web/            # @crewspace/tools-web (fetch, parse, search)
│   ├── tools-shell/          # @crewspace/tools-shell (exec with sandbox)
│   ├── cli/                  # @crewspace/cli (npx crewspace commands)
│   │   ├── src/
│   │   │   ├── commands/     # init, run, validate commands
│   │   │   ├── output/       # Terminal formatting, progress indicators
│   │   │   └── templates/    # Scaffolding templates
│   │   └── package.json
│   └── examples/             # Example workflows (chat, research, etc.)
├── docs/                     # Documentation site (VitePress/Docusaurus)
├── tests/
│   ├── integration/          # End-to-end CLI tests
│   └── fixtures/             # Test workflows and data
├── package.json              # Root package (workspace config)
├── tsconfig.json             # Base TypeScript config
├── .eslintrc.js
├── .prettierrc
└── README.md
```

## Dependencies

### Allowed (Free/Open Source)
- **Core framework:**
  - `zod` (schema validation and type inference)
  - `EventEmitter` (Node.js built-in, event-driven architecture)
  - `sqlite3` or `better-sqlite3` (long-term memory persistence)
- **LLM integration:**
  - `openai` (official OpenAI SDK)
  - `@anthropic-ai/sdk` (official Anthropic SDK)
  - `ollama` (local model support)
- **CLI:**
  - `commander` (argument parsing)
  - `chalk` (terminal colors)
  - `ora` (progress spinners)
  - `inquirer` (interactive prompts, if needed)
- **File system:**
  - `fast-glob` or `globby` (glob patterns)
  - `ignore` (.gitignore parsing)
  - `chokidar` (file watching, if needed)
- **Utilities:**
  - `p-limit` (concurrency control)
  - `p-queue` (task queuing)
  - `p-retry` (retry logic with backoff)
- **Logging:**
  - `winston` or `pino` (structured logging)
- **Testing:**
  - `vitest` (preferred) or `jest`
  - `@types/node`
- **Linting:**
  - `eslint`, `@typescript-eslint/parser`, `prettier`
- **Build:**
  - `tsup` or `esbuild` (fast TypeScript bundler)
  - `turbo` (monorepo build orchestration)

### Prohibited (Paid/Enterprise)
- No SaaS services requiring API keys or payment (budget is $0)
- No paid infrastructure (cloud hosting, databases, etc.)

### Dependency Rules
- **Check npm downloads** — Prefer packages with >100k weekly downloads
- **Check last update** — Avoid packages not updated in >1 year
- **Document rationale** — Add comment in package.json if non-obvious choice
- **Lock versions** — Use `package-lock.json` or `yarn.lock`

## Git Commit Messages

Format: `[TASK-XXX] Brief description of what changed`

Examples:
- `[TASK-001] Initialize monorepo with TypeScript and Vitest`
- `[TASK-011] Implement Agent class with TypeScript types`
- `[TASK-020] Add OpenAI provider with streaming support`

Rules:
- **Imperative mood:** "Add feature" not "Added feature"
- **First line <72 chars**
- **Reference task ID** from backlog
- **No trailing period** on first line

## Testing Requirements

### Coverage
- **Unit tests:** All agent logic, execution engine, core functions
- **Integration tests:** CLI commands end-to-end, multi-agent workflows
- **Minimum coverage:** 80% line coverage for `packages/*/src/`

### Test Naming
Describe the scenario in plain English:
- `should_execute_agent_task_successfully()`
- `should_handle_llm_provider_failure_gracefully()`
- `should_resolve_task_dependencies_in_correct_order()`

### Test Structure
```typescript
describe('Agent', () => {
  it('should execute task with LLM provider', async () => {
    const agent = new Agent({
      role: 'researcher',
      goal: 'Find information',
      llm: mockLLMProvider,
    });
    const result = await agent.execute('Search for TypeScript frameworks');
    expect(result.status).toBe('success');
    expect(result.output).toBeDefined();
  });

  it('should retry on transient LLM failure', async () => {
    const agent = new Agent({
      role: 'researcher',
      goal: 'Find information',
      llm: mockFailingLLMProvider,
      retries: 3,
    });
    const result = await agent.execute('Search for data');
    expect(mockFailingLLMProvider.attemptCount).toBe(3);
  });
});
```

### Test Fixtures
Store test workflows and data in `tests/fixtures/`:
- `tests/fixtures/workflows/simple-chat.ts`
- `tests/fixtures/workflows/research-crew.ts`
- `tests/fixtures/data/mock-llm-responses.json`

## Performance Targets

- **Agent initialization:** <100ms per agent instance
- **Task execution:** <5s for simple tasks (excluding LLM latency)
- **Parallel task execution:** Support 10+ concurrent tasks without blocking
- **Memory system:** Read/write operations <50ms for SQLite persistence
- **CLI startup:** <200ms from command invocation to execution
- **Memory footprint:** <200MB for typical multi-agent workflow

## Code Review Checklist

Before marking task as `review`:
- [ ] TypeScript compiles with no errors (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Code follows style conventions
- [ ] JSDoc comments on public APIs
- [ ] Error handling in place for I/O operations
- [ ] Test coverage >80%
- [ ] Commit message follows format

## Documentation

- **README.md:** Installation, quick start (10 lines of code), key features
- **Architecture docs:** Explain agent lifecycle, execution engine, memory system
- **API reference:** JSDoc for all public classes, interfaces, and methods
- **Examples:** 8-10 complete example workflows (chat, research, code review, etc.)
- **Comparison guide:** vs CrewAI, LangChain, AutoGen (positioning document)
- **Inline docs:** JSDoc for functions, interfaces, complex logic

## Crewspace-Specific Patterns

### Agent Definition
```typescript
import { Agent, AgentConfig } from '@crewspace/core';

const researcher = new Agent({
  role: 'Market Researcher',
  goal: 'Find and analyze competitive intelligence',
  backstory: 'Expert in market analysis and competitive research',
  llm: openaiProvider,
  tools: [webSearch, fileReader],
  memory: true, // Enable long-term memory
  verbose: true,
});
```

### Crew Orchestration
```typescript
import { Crew, Task } from '@crewspace/core';

const crew = new Crew({
  agents: [researcher, analyst, writer],
  tasks: [
    new Task({
      description: 'Research competitors',
      agent: researcher,
      expectedOutput: 'List of 5 competitors with details',
    }),
    new Task({
      description: 'Analyze findings',
      agent: analyst,
      context: ['research-task'], // Depends on previous task
    }),
  ],
  process: 'sequential', // or 'parallel'
});

const result = await crew.kickoff();
```

### Custom Tool Creation
```typescript
import { tool } from '@crewspace/core';
import { z } from 'zod';

const emailTool = tool({
  name: 'send_email',
  description: 'Send an email to a recipient',
  schema: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
  }),
  execute: async ({ to, subject, body }) => {
    // Implementation
    return { success: true, messageId: 'abc123' };
  },
});
```

## Framework Design Principles

1. **TypeScript-native** — First-class TypeScript support, not a Python port
2. **Zero configuration** — Sensible defaults, works out of the box
3. **Composable** — Small, focused modules that work together
4. **Observable** — Rich logging and debugging support built-in
5. **Extensible** — Plugin system for custom tools, LLM providers, memory backends
6. **Framework-agnostic** — Works with Express, Fastify, standalone scripts
7. **Runtime-agnostic** — Node.js, Bun, Deno support (where feasible)
