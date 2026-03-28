# Project Instructions

## Svelte

Before finalizing any .svelte or .svelte.ts file, run svelte-autofixer and iterate until no issues remain.
When editing or creating Svelte code, use Svelte MCP tools (get-documentation, svelte-autofixer) for up-to-date API reference.

## Stack

Tauri v2 (Rust backend) + SvelteKit (static adapter) + Vite Plus
TypeScript (strict) + Rust
Tailwind CSS 4
SQLite (rusqlite, bundled)
Vitest + Playwright

## Commands

`pnpm tauri dev` -- full dev (frontend + native window)
`vp dev` -- frontend only
`pnpm check:all` -- full check suite
`vp test` -- unit tests
`pnpm test:e2e` -- E2E tests

## Architecture

- Frontend is SPA mode (ssr=false, static adapter with fallback)
- Rust backend handles commands, SQLite, native APIs
- Frontend calls Rust via `invoke()` from `@tauri-apps/api/core`
- Vite dev server on port 1420 (Tauri requirement)

## Testing

- TDD: write tests first, then implement.
- 80% coverage threshold enforced.
