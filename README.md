# Grovekeeper

Desktop agent orchestration GUI built with Tauri v2, Svelte 5, and Rust. Unifies task state, editor, terminal, browser, and agent session into a single per-task view with reliable notifications.

## Stack

| Layer         | Technology                      |
| ------------- | ------------------------------- |
| Framework     | SvelteKit 2 + Svelte 5 (runes)  |
| Desktop       | Tauri v2 (Rust backend)         |
| Build         | Vite 7                          |
| Language      | TypeScript (strict) + Rust      |
| Styling       | Tailwind CSS 4                  |
| Database      | SQLite (rusqlite + r2d2 pool)   |
| Type gen      | ts-rs (Rust → TypeScript)       |
| Testing       | Vitest + Playwright + Storybook |
| Linting       | ESLint + Stylelint + OxLint     |
| Formatting    | Prettier                        |
| Dead code     | Fallow                          |
| Component dev | Storybook 10                    |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri backend)

### Setup

```sh
# 1. Install dependencies
pnpm install

# 2. Start dev server (frontend + native window)
pnpm tauri dev
```

## Scripts

### Development

| Script             | Description                            |
| ------------------ | -------------------------------------- |
| `pnpm tauri dev`   | Start dev server + native Tauri window |
| `pnpm tauri build` | Production build (native installer)    |
| `pnpm dev`         | Frontend dev server only               |
| `pnpm build`       | Frontend build only                    |
| `pnpm preview`     | Preview production build locally       |
| `pnpm storybook`   | Start Storybook on port 6006           |

### Code Quality

| Script              | Description                                                              |
| ------------------- | ------------------------------------------------------------------------ |
| `pnpm check:all`    | Full suite: format + oxlint + eslint + stylelint + fallow + svelte-check |
| `pnpm check:fast`   | Quick pre-commit tier (prettier + oxlint)                                |
| `pnpm check:fallow` | Dead-code regression gate                                                |
| `pnpm check`        | Quick svelte-check only                                                  |
| `pnpm lint`         | OxLint + ESLint (type-aware)                                             |
| `pnpm lint:css`     | Stylelint for CSS and Svelte                                             |
| `pnpm format`       | Format with Prettier                                                     |

### Testing

| Script          | Description                                     |
| --------------- | ----------------------------------------------- |
| `pnpm test`     | Unit tests with Vitest (80% coverage threshold) |
| `pnpm test:e2e` | E2E tests with Playwright (Chromium)            |

## Architecture

See `.mpx/ARCHITECTURE.md` for the full architecture document with diagrams.

### Frontend (SvelteKit + Static Adapter)

The frontend runs as a Single Page Application inside Tauri's webview. SvelteKit is configured with `@sveltejs/adapter-static` and `fallback: 'index.html'` for SPA mode. SSR is disabled (`ssr = false`) since there is no Node.js server in a Tauri app. The Vite dev server runs on port **1420** (required by Tauri's `devUrl` config).

The frontend uses a **deep module architecture** — domain modules in `src/lib/modules/` that each own their types, IPC calls, state management, and event listeners behind a minimal `use*()` API. Modules use Svelte 5's `createContext()` for scoped state. All user-facing strings are internationalized via Paraglide (`m.key_name()` imports).

### Backend (Rust + Tauri)

The Rust backend in `src-tauri/` handles:

- **Tauri commands** — functions callable from the frontend via `invoke()`
- **SQLite database** — r2d2 connection pool (4 concurrent readers + 1 writer) with WAL mode
- **Session management** — tokio-based session actors with stream-JSON protocol parsing
- **Type generation** — ts-rs generates TypeScript types from Rust structs (27 IPC-crossing types)
- **Native APIs** — notifications, sound, multi-window management via Tauri plugins (including `single_instance`)

### Communication

Two IPC patterns:

- **Commands** (`invoke()`) — request/response for CRUD, spawning sessions, syncing state
- **Events** (`listen()`) — push from Rust for session streaming, state changes, worktree progress

## Svelte Inspector

Press **Alt+X** during development to toggle the Svelte Inspector. Click any element to jump to its source code in your editor.

## Experimental Features

### Async Components

Use `await` directly in Svelte components without `{#await}` blocks. Enabled via `compilerOptions.experimental.async` in `svelte.config.js`.

## Storybook

Component development environment with Tailwind CSS support.

```sh
pnpm storybook        # dev server on port 6006
pnpm build:storybook  # static build
```

Place story files next to components: `src/lib/components/Button.stories.svelte` or `Button.stories.ts`.

## CI/CD (GitHub Actions)

`.github/workflows/ci.yml` runs on PRs and pushes to `dev`/`main`:

1. Install dependencies (pnpm, Node 22)
2. Run full check suite (`check:all`)
3. Run unit tests with coverage
4. Install Playwright and run E2E tests

## Code Conventions

- **Indentation**: Tabs (4-width)
- **Quotes**: Single quotes
- **Semicolons**: Required
- **Trailing commas**: Yes
- **Line width**: 100 characters
- **Line endings**: LF
- **Variable naming**: `snake_case` preferred; `camelCase` acceptable in tree visualization layer (matches `low-poly-2d-trees` library API)
- **Type naming**: `PascalCase`
- **Constants**: `UPPER_CASE`, `snake_case`, or `PascalCase`
- **Svelte**: Svelte 5 runes only (`$state`, `$derived`, `$props`). No legacy patterns.
- **Imports**: Consistent type imports with `inline-type-imports` style

## Project Structure

```
src/
  app.css                    # Tailwind CSS entry point (OKLCH design tokens, theme switching)
  app.html                   # HTML shell (data-theme="dark" default)
  routes/
    +layout.svelte           # Root layout — initializes all module contexts
    +layout.ts               # SPA config (ssr=false, prerender=true)
    +page.svelte             # Dashboard (list / kanban / forest view modes)
    overview/+page.svelte    # Multi-workspace overview (workspace card grid)
    quick-ideas/+page.svelte # Quick Ideas full-page view (raw requirements capture)
    sessions/+page.svelte    # Session management
    settings/+page.svelte    # Configuration + keyboard shortcuts
  lib/
    modules/                 # Deep domain modules ($lib/modules/*)
      sessions/              # Session spawn, terminate, state, events
      version-control/       # Git status, GitHub sync, PR state
      issues/                # Issue CRUD, labels, worktrees
      board/                 # Dashboards, palettes, theme, accent, view mode
      notifications/         # Notification routing + config
      actions/               # Action templates + execution
      visualization/         # Tree visualization + forest layout (pure)
      keyboard-shortcuts/    # Global shortcut registry, binding, persistence
      command-palette/       # Ctrl+K palette, search, action/navigation/issue items
      creation-wizard/       # 5-step keyboard-driven issue creation wizard
      raw-requirements/      # Quick Ideas capture and markdown parsing
      window/                # Multi-window context, window type detection
    types/generated/         # ts-rs output — DO NOT EDIT
    reactivity/              # Shared primitives (StateRaw, Persisted)
    paraglide/               # Generated i18n runtime (Paraglide JS)
    components/              # UI components (design system + app-level)
    i18n/                    # Error/notification key → Paraglide message translators
messages/                    # i18n message files (en.json, cs.json)
project.inlang/              # Paraglide i18n configuration
src-tauri/
  .cargo/config.toml         # ts-rs export directory config
  src/
    lib.rs                   # Tauri app setup + command registration + single_instance
    main.rs                  # Entry point
    commands/                # Tauri IPC command handlers (14 files)
    session/                 # Session actor, protocol parser, discovery
    models/                  # Data models with ts-rs annotations
    database/                # SQLite schema, migrations, connection pool
    notification/            # Notification service (toast, sound, flash)
    git/                     # Git types and helpers
  Cargo.toml                 # Rust dependencies
  tauri.conf.json            # Tauri app config
static/                      # Static assets
tests/e2e/                   # Playwright E2E tests
.storybook/                  # Storybook configuration
.github/workflows/           # CI pipeline
.mpx/                        # Project documentation (architecture, roadmap, etc.)
claude_design/               # Design reference files (tokens.css, artboards)
```
