---
description: "Use when writing or modifying code in the product repository. Covers coding style, commit messages, testing requirements, and project structure conventions."
applyTo: "product/**"
---

# Coding Conventions

These conventions apply to all code in the product repository (VibeSafe — AI Code Security Auditor).

**Tech Stack:** Node.js 18+ / TypeScript 5+ / CLI tool

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
class RuleExecutionError extends Error {
  constructor(ruleId: string, filePath: string, cause: Error) {
    super(`Rule ${ruleId} failed on ${filePath}: ${cause.message}`);
    this.name = 'RuleExecutionError';
  }
}
```

## Project Structure

```
product/
├── src/
│   ├── cli/           # CLI entry point, command handlers
│   ├── scanner/       # File system scanner, glob patterns
│   ├── parser/        # AST parsing (tree-sitter, Babel)
│   ├── engine/        # Rule engine, plugin system
│   ├── rules/         # Security detection rules
│   ├── output/        # Report formatting (terminal, Markdown, HTML)
│   ├── types/         # Shared TypeScript types and interfaces
│   └── utils/         # Shared utilities (logging, config)
├── tests/
│   ├── unit/          # Unit tests for isolated functions
│   ├── integration/   # CLI command integration tests
│   └── fixtures/      # Test code samples for rule validation
├── docs/              # Documentation
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
└── README.md
```

## Dependencies

### Allowed (Free/Open Source)
- **CLI:** `commander` (argument parsing)
- **File system:** `fast-glob` or `globby` (glob patterns), `ignore` (.gitignore parsing)
- **AST parsing:** `tree-sitter`, `@babel/parser`, `@babel/traverse`
- **Output:** `chalk` (terminal colors), `marked` (Markdown rendering)
- **Logging:** `winston` or `pino` (structured logging)
- **Testing:** `vitest` or `jest`, `@types/node`
- **Linting:** `eslint`, `@typescript-eslint/parser`, `prettier`

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
- `[STORY-001] Add CLI scaffolding with Commander.js`
- `[STORY-003] Integrate tree-sitter for JS/TS AST parsing`
- `[STORY-005] Implement hardcoded secrets detection rule`

Rules:
- **Imperative mood:** "Add feature" not "Added feature"
- **First line <72 chars**
- **Reference task ID** from backlog
- **No trailing period** on first line

## Testing Requirements

### Coverage
- **Unit tests:** All rule logic, parser utilities, core functions
- **Integration tests:** CLI commands end-to-end
- **Minimum coverage:** 80% line coverage for `src/`

### Test Naming
Describe the scenario in plain English:
- `should_detect_hardcoded_api_key_in_variable_assignment()`
- `should_not_flag_environment_variable_usage()`
- `should_parse_typescript_file_with_jsx_syntax()`

### Test Structure
```typescript
describe('HardcodedSecretsRule', () => {
  it('should detect API key in string literal', () => {
    const code = 'const apiKey = "sk-1234567890abcdef";';
    const findings = rule.check('test.ts', parseAST(code));
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('CRITICAL');
  });

  it('should not flag environment variable', () => {
    const code = 'const apiKey = process.env.API_KEY;';
    const findings = rule.check('test.ts', parseAST(code));
    expect(findings).toHaveLength(0);
  });
});
```

### Test Fixtures
Store test code samples in `tests/fixtures/`:
- `tests/fixtures/vulnerable/hardcoded-secrets.js`
- `tests/fixtures/secure/env-variables.js`

## Performance Targets

- **File scan:** 1000+ file repo in <5 seconds
- **AST parsing:** 500-line file in <100ms
- **Rule execution:** <100ms per file per rule
- **Memory:** <500MB for 10,000-file repo

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

- **README.md:** Installation, usage, examples
- **Architecture docs:** Explain rule engine design, plugin system
- **Rule docs:** Each rule should have a comment header with examples
- **Inline docs:** JSDoc for functions, interfaces, complex logic
