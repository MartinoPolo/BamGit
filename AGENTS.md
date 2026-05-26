# Project Instructions

App is in development — no backwards compatibility is required. When implementing changes, freely delete, replace, or restructure obsolete code and schemas without preservation shims.

## Project Documentation

Before implementation, read `.mpx/CONTEXT.md` (domain language, feature index, constraints) and `.mpx/DECISIONS.md` (settled architectural choices). If a requirement is missing from these files, search `.mpx/archive/` for detail — but verify against current code before trusting archived content.

## Svelte

Before finalizing any .svelte or .svelte.ts file, run svelte-autofixer and iterate until no issues remain.
When editing or creating Svelte code, use Svelte MCP tools (get-documentation, svelte-autofixer) for up-to-date API reference.

## Main library

C:\_MP_projects\low-poly-2d-trees This project relies heavily on rendering 2D trees from this library that I maintain and have full control over. Whenever needed, update anything in that library, but mention this update in summary.

## Cloned OSS Repositories

When debugging or analyzing issues related to third-party libraries, delegate exploration to a sub-agent pointing at the cloned source in `C:\_MP_github_cloned\`
**Available**: svelte (+sveltekit), bits-ui, shadcn-svelte, storybook, fallow, lucide, tailwindcss, paneforge, tauri (+tauri-docs)

## Stack

Tauri v2 (Rust backend) + SvelteKit (static adapter) + Vite
TypeScript (strict)
Tailwind CSS 4
SQLite (rusqlite, bundled)
Vitest, Playwright, WebdriverIO (Tauri E2E), Storybook

## Commands

`pnpm tauri dev` -- full dev (frontend + native window)
`pnpm dev` -- frontend only
`pnpm check:fast` -- prettier + oxlint (pre-commit tier)
`pnpm check:fallow` -- dead-code regression gate
`pnpm check:all` -- full check suite (format + lint + fallow + typecheck + eslint)
`pnpm test` -- unit tests
`pnpm e2e` -- E2E tests (Playwright, static build + mocks, no Tauri backend)
`pnpm e2e:tauri` -- E2E tests (builds debug binary, then WebdriverIO + tauri-driver, real SQLite)
`pnpm db:reset` -- delete SQLite database (app recreates it on next launch)
`npx playwright test tests/perf/ --config tests/perf/playwright.perf.config.ts --project dev` -- dashboard perf benchmarks (requires dev server running, see `tests/perf/README.md`)

## Context Budget

- For Svelte edits, run `svelte-autofixer` first. Fetch Svelte docs only for unfamiliar APIs or syntax, and request the smallest relevant sections.
- Prefer targeted shell reads: `rg -l`, path-scoped `rg`, `git diff --stat`, and `git diff -- <files>`.
- Inspect a full log only when the tail does not identify the failure.
- Do not run full Storybook build unless changing Storybook build config, deployment output, or behavior that only appears in the production Storybook bundle.
- Use sub-agents for broad or third-party exploration when explicitly requested or already required by these instructions. Ask them for concise findings and file paths, not full command output.

## Architecture

- Frontend is SPA mode (ssr=false, static adapter with fallback)
- Rust backend handles commands, SQLite, native APIs
- Frontend calls Rust via `invoke()` from `@tauri-apps/api/core`
- Vite dev server on port 1420 (Tauri requirement)

## Database (SQLite — no migrations, dev-only)

No versioned migrations. Pre-production, no user data to preserve.
On startup: `schema::create_tables()` (IF NOT EXISTS) then `defaults::seed_defaults()` (INSERT OR IGNORE).

- New table: add to `schema.rs`, add demo data to `seed_commands.rs` if needed
- Modify existing table: edit `schema.rs` directly, run `pnpm db:reset`, update `seed_commands.rs` if affected
- New app default: update `defaults.rs::seed_defaults()`

## Browser Mock Mode

`pnpm dev` renders the full app in a browser without Tauri — `src/lib/tauri_mock.ts` intercepts all `invoke()` calls and returns fixture data from `src/lib/tauri_mock_data.ts`. When adding a new Tauri command, always add a corresponding mock handler in `tauri_mock.ts`; if the command requires the native backend (worktree, terminal, session, git ops), also add it to `TAURI_ONLY_COMMANDS` in `src/lib/modules/toasts/mock_toast_bridge.ts` so a warning toast fires in browser mode. Navigation, theming, issue display, and layout work fully; write operations return mock responses but don't persist; native ops (worktree setup, session spawn, terminal, git sync) are no-ops that show "Desktop app required" toasts.

## Pre-existing Errors

Always fix unrelated errors you encounter (merge artifacts, stale imports, broken references, prior bugs) — they accumulate if ignored. Commit fixes separately from main work. If a fix fails after two attempts, revert and continue with the main task. Always notify user — both for fixes made and problems left unresolved.

## Testing

- When writing tests, always derive expected behavior from requirements (GitHub issue descriptions and comments, `DECISIONS.md`, `CONTEXT.md`, or other docs) — never adapt tests to match the implementation. If a test reveals a bug, report it to the user or fix it immediately.

### Tauri E2E Tests (WebdriverIO)

Tests in `tests/e2e-tauri/specs/`. Config: `wdio.conf.ts`. Runs against `src-tauri/target/debug/grovekeeper.exe`.

**When to use:** Testing features that depend on the Rust backend — settings persistence, database operations, IPC round-trips, worktree operations. Not for pure UI testing (use Playwright for that).

## Visual Testing (Tauri MCP)

For frontend visual verification, spawn a `mp-tauri-tester` sub-agent with numbered test requirements and expected outcomes. The agent connects to the running app via Tauri MCP bridge, applies all known workarounds, and returns a structured pass/fail report with screenshot evidence.

Prerequisite: `pnpm tauri dev` must be running.
