# Project Instructions

## Svelte

Before finalizing any .svelte or .svelte.ts file, run svelte-autofixer and iterate until no issues remain.
When editing or creating Svelte code, use Svelte MCP tools (get-documentation, svelte-autofixer) for up-to-date API reference.

## Main library

C:\_MP_projects\low-poly-2d-trees This project relies heavily on rendering 2D trees from this library that I maintain and have full control over. Whenever it's needed, feel free to update anything in that library, but specifically mention this update at the end of the session.

## Stack

Tauri v2 (Rust backend) + SvelteKit (static adapter) + Vite
TypeScript (strict) + Rust
Tailwind CSS 4
SQLite (rusqlite, bundled)
Vitest + Playwright

## Commands

`pnpm tauri dev` -- full dev (frontend + native window)
`pnpm dev` -- frontend only
`pnpm check:fast` -- prettier + oxlint (pre-commit tier)
`pnpm check:fallow` -- dead-code regression gate
`pnpm check:all` -- full check suite (format + lint + fallow + typecheck + eslint)
`pnpm test` -- unit tests
`pnpm test:e2e` -- E2E tests
`pnpm db:reset` -- delete SQLite database (app recreates it on next launch)

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
- Before production: switch to versioned migrations (PRAGMA user_version)

## Testing

- TDD: write tests first, then implement.
- 80% coverage threshold enforced.
