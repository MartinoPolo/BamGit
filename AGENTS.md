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
`pnpm run dev` -- frontend only
`pnpm run check:all` -- full check suite
`pnpm run test` -- unit tests
`pnpm test:e2e` -- E2E tests

## Architecture

- Frontend is SPA mode (ssr=false, static adapter with fallback)
- Rust backend handles commands, SQLite, native APIs
- Frontend calls Rust via `invoke()` from `@tauri-apps/api/core`
- Vite dev server on port 1420 (Tauri requirement)

## Testing

- TDD: write tests first, then implement.
- 80% coverage threshold enforced.
