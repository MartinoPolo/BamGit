# Testing Framework Overhaul

This folder contains stand-alone agent prompt documents for each phase of the Grovekeeper testing initiative. Each file is a complete, self-contained prompt that can be given directly to a coding agent or orchestrator with no other context required.

## Execution Order

| Phase | File                                                               | Description                                                                      | Est. Sub-Agents | Priority    |
| ----- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------- | --------------- | ----------- |
| 1     | [phase-1-storybook-primitives.md](phase-1-storybook-primitives.md) | Storybook stories for shadcn/base/derived components missing stories             | 14              | High        |
| 2     | [phase-2-storybook-blocks.md](phase-2-storybook-blocks.md)         | Storybook stories for block components (issue, workspace, session, layout, etc.) | 18              | High        |
| 3     | [phase-3-storybook-play-tests.md](phase-3-storybook-play-tests.md) | Add `play()` interaction tests to existing + new stories; enable a11y CI         | 18              | Highest ROI |
| 4     | [phase-4-vitest-logic.md](phase-4-vitest-logic.md)                 | Fill Vitest unit test gaps for business logic modules                            | 6               | Critical    |
| 5     | [phase-5-rust-tests.md](phase-5-rust-tests.md)                     | Rust `#[cfg(test)]` tests for backend commands and logic                         | 6               | Critical    |
| 6     | [phase-6-playwright-e2e.md](phase-6-playwright-e2e.md)             | Playwright E2E tests: navigation, URL state, keyboard, workflows                 | 4               | Important   |

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
- **Theme context**: All stories must use `ThemeDecorator` from `$lib/storybook/ThemeDecorator.svelte`
