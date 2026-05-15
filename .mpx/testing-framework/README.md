# Testing Framework Overhaul

This folder contains stand-alone agent prompt documents for each phase of the Grovekeeper testing initiative. Each file is a complete, self-contained prompt that can be given directly to a coding agent or orchestrator with no other context required.

## Execution Order

| Phase | File                                                   | Description                                                      | Est. Sub-Agents | Status      |
| ----- | ------------------------------------------------------ | ---------------------------------------------------------------- | --------------- | ----------- |
| 1     | _(deleted — complete)_                                 | Storybook stories for shadcn/base/derived components             | 14              | ✅ Complete |
| 2     | _(deleted — complete)_                                 | Storybook stories for block components                           | 20              | ✅ Complete |
| 3     | _(deleted — complete)_                                 | play() interaction tests + a11y CI enforcement                   | 18              | ✅ Complete |
| 4     | [phase-4-vitest-logic.md](phase-4-vitest-logic.md)     | Fill Vitest unit test gaps for business logic modules            | 6               | ⏳ Parallel |
| 5     | [phase-5-rust-tests.md](phase-5-rust-tests.md)         | Rust `#[cfg(test)]` tests for backend commands and logic         | 6               | ⏳ Parallel |
| 6     | [phase-6-playwright-e2e.md](phase-6-playwright-e2e.md) | Playwright E2E tests: navigation, URL state, keyboard, workflows | 4               | ⏳ Parallel |

Phases 1-3 prompts were deleted after completion. Reusable patterns extracted to `.claude/rules/grovekeeper-shadcn-svelte.md`.

## Shared Conventions

All phases reference shared rules defined in [CONVENTIONS.md](CONVENTIONS.md):

- Event propagation rules (the core architectural principle)
- Story file format and patterns
- Conflict reporting format
- Context7 MCP usage instructions

## Running Each Phase

Each phase prompt instructs the agent to orchestrate multiple sub-agents in parallel (one per component/module). When a phase is complete, the orchestrating agent produces a **Findings Report** summarising conflicts, violations, and bugs discovered. These reports should be reviewed before committing — tests may reveal real bugs that need fixing before they pass.

## Key Architectural Context

- **Stack**: Tauri v2 (Rust) + SvelteKit + Svelte 5 (runes) + Vite
- **Component library**: bits-ui v2 + shadcn-svelte (custom wrappers under `src/lib/components/shadcn/`)
- **Testing stack**: Vitest + vitest-browser-svelte (browser), Storybook 10 + @storybook/addon-vitest, Playwright
- **Mock layer**: `src/lib/tauri_mock.ts` intercepts all `invoke()` calls in browser/Storybook mode automatically
- **Theme context**: `ThemeDecorator` is registered as a **global decorator** in `.storybook/preview.ts` — it wraps every story automatically. Do not import it or add it to `decorators` in individual story files.
