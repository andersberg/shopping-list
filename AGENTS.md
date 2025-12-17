# Repository Guidelines

## Project Structure & Module Organization
- Domain-first layout:
  - `client/`: React UI built with Vite; assets live in client/public/.
  - `server/`: Cloudflare Worker powered by Hono; deployment config in server/wrangler.json.
  - `lib/`: Shared domain logic, database layer, and Vitest specs such as GroceryInputParser/Parser.test.ts.
  - `legacy/`: Archived implementation kept for reference; avoid modifying unless migrating features.
- Root tooling: `package.json`, `biome.json`, and `tsconfig.base.json` apply repo-wide conventions.
- Group related logic together by feature or domain; keep shared utilities in `lib/`.
- Avoid deep hierarchies and per-folder barrels; one public entry per package is acceptable.

⸻

## Build, Test, and Development Commands
- `pnpm install once` to hydrate all workspaces.
- `pnpm client:dev` launches the Vite dev server for the React app.
- `pnpm server:dev` runs the Worker locally via Wrangler.
- `pnpm build builds` both client and server; pnpm deploy pushes the Worker.
- Database:
  - `pnpm db:generate` — generate Drizzle schema
  - `pnpm db:migrate:local` / `pnpm db:migrate:remote` — apply migrations
  - `pnpm db:execute:*` — execute manual SQL
- Tests: `pnpm --filter lib test` runs Vitest specs.

⸻

## Coding Style & Naming Conventions

### General Principles
- Predictable, explicit, minimal magic, boundary-validated, composable.
- Always prefer clarity over brevity.
- Validate external data at the boundaries; assume validated types inside.
- Keep logic close to its domain and side effects near data changes.

## Syntax & Naming

| Element | Convention | Example
| --- | --- | ---
| Types / Interfaces / Classes / Components | PascalCase | `User`, `UserService`, `UserCard`
| Functions / Variables | snake_case | `fetch_user_by_id`, `user_count`
| Constants | SCREAMING_SNAKE_CASE | MAX_RESPONSE_TIME_MS
| Files | kebab-case.ts[x] (default) | user-service.ts, order-list.tsx
| React Props & Handlers | camelCase | userId, onClick
| CSS Classes | kebab-case | .main-header

### File casing:
Use kebab-case by default; allow PascalCase only when the file exports one primary class or React component (e.g. User.ts, UserCard.tsx).

### Imports & Modules
- ESM only; always include file extensions (.ts, .tsx, .js).
- Named imports/exports only — no default exports.
- Use relative imports unless explicit aliases are configured.
- Barrel files allowed only at package entry points; never per feature.

### React
- Function components only; small and focused.
- Local state first, lift minimally, global state sparingly.
- Allow related sub-components in the same file (UserCard, UserCardHeader).
- Separate data fetching (hooks/adapters) from presentation.
- CSS classes use kebab-case.

### Errors & Validation
- Functions may throw; let exceptions bubble and catch once at boundaries (API/worker/CLI).
- Boundary layers translate errors into structured responses or Result objects.
- Expected negatives (e.g. not found) should be explicit — use try_, maybe_, or document with @throws.
- Validate all external inputs (HTTP, DB, env) at boundaries using schemas; trust validated values inside the domain.

### Constants & Literals
- Inline only trivial literals (0, 1, -1, "", true, false, indices).
- Name all meaningful values with SCREAMING_SNAKE_CASE.
- Group constants near usage or under lib/constants/.

### Documentation
- Every exported symbol requires JSDoc with Summary / Params / Returns / Throws / Example.
- Focus on intent and contract, not implementation details.

### Testing
- Colocate tests with implementation: *.test.ts or *.test.tsx.
- Keep tests deterministic and isolated from external systems.

⸻

## Commit & Pull Request Guidelines
- Use Conventional Commits:
- feat: new functionality
- fix: bug fix
- docs: documentation changes
- refactor: structural improvement
- chore: tooling or maintenance
- Keep commit subjects short and present-tense (feat(parser): improve tokenization).
- One concern per commit; include context or motivation in the body when needed.
- Pull requests should describe motivation, summarize changes, and link issues.
- Include screenshots or CLI output for UI/API updates and mention any DB migrations executed.
- Ensure CI passes (lint, tests, builds) or explain known issues before requesting review.

⸻

## Agent Behavior Summary

### For AI agents:
- Ask before assuming. Clarify uncertainties before proposing code.
- Output in Markdown; concise bullets and examples only when relevant.
- Prefer clarity over brevity; explain reasoning when choices exist.
- Follow the above naming, import, and validation rules precisely.
- Be consistent with domain-first organization and test colocation.
- Be consice. Sacrifice grammar for concision.

### Agent Workflow & Permissions
- **Plan-First Approach:** For significant refactoring or new feature implementation, agents must first present a detailed plan to the user and await explicit user approval before making any code changes.
- **Implementation vs. Planning:** Clearly separate the "planning" phase (read-only, documentation) from the "implementation" phase (file edits, code execution).
- **Permission Required:** Do not execute implementation steps (file edits, running commands, commits) until the user has reviewed the plan and explicitly approved it.
- **Revert on Mistake:** If an agent accidentally executes without approval, they must immediately revert changes and wait for user direction.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
