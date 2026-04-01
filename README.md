# BamGit

Desktop Git client built with Tauri v2, Svelte 5, and Rust.

## Stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Framework     | SvelteKit 2 + Svelte 5 (runes)              |
| Desktop       | Tauri v2 (Rust backend)                     |
| Build         | Vite 7 via Vite Plus                        |
| Language      | TypeScript (strict) + Rust                  |
| Styling       | Tailwind CSS 4                              |
| Database      | SQLite (rusqlite, bundled)                  |
| Testing       | Vitest + Playwright + Storybook             |
| Linting       | ESLint + Stylelint + OxLint (via Vite Plus) |
| Formatting    | OxFormatter (via Vite Plus)                 |
| Dead code     | Knip                                        |
| Component dev | Storybook 10                                |

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

| Script               | Description                            |
| -------------------- | -------------------------------------- |
| `pnpm tauri dev`     | Start dev server + native Tauri window |
| `pnpm tauri build`   | Production build (native installer)    |
| `pnpm run dev`       | Frontend dev server only (`vp dev`)    |
| `pnpm run build`     | Frontend build only (`vp build`)       |
| `pnpm run preview`   | Preview production build locally       |
| `pnpm run storybook` | Start Storybook on port 6006           |

### Code Quality

| Script               | Description                                                             |
| -------------------- | ----------------------------------------------------------------------- |
| `pnpm run check:all` | Full suite: lint + typecheck + eslint + stylelint + knip + svelte-check |
| `pnpm run check`     | Quick svelte-check only                                                 |
| `pnpm run lint`      | OxLint + ESLint (type-aware)                                            |
| `pnpm run lint:css`  | Stylelint for CSS and Svelte                                            |
| `pnpm run format`    | Format with OxFormatter                                                 |

### Testing

| Script              | Description                                     |
| ------------------- | ----------------------------------------------- |
| `pnpm run test`     | Unit tests with Vitest (80% coverage threshold) |
| `pnpm run test:e2e` | E2E tests with Playwright (Chromium)            |

## Architecture

### Frontend (SvelteKit + Static Adapter)

The frontend runs as a Single Page Application inside Tauri's webview. SvelteKit is configured with `@sveltejs/adapter-static` and `fallback: 'index.html'` for SPA mode. SSR is disabled (`ssr = false`) since there is no Node.js server in a Tauri app.

The Vite dev server runs on port **1420** (required by Tauri's `devUrl` config).

### Backend (Rust + Tauri)

The Rust backend in `src-tauri/` handles:

- **Tauri commands** -- functions callable from the frontend via `invoke()`
- **SQLite database** -- local data storage via `rusqlite` (bundled, no system dependency)
- **Native APIs** -- file system, system tray, window management via Tauri plugins

### Communication

Frontend calls Rust functions through Tauri's IPC bridge:

```svelte
<script lang="ts">
	import { invoke } from '@tauri-apps/api/core';

	let result = $state('');

	async function call_backend() {
		result = await invoke('greet', { name: 'World' });
	}
</script>
```

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

## Svelte Inspector

Press **Alt+X** during development to toggle the Svelte Inspector. Click any element to jump to its source code in your editor.

## Experimental Features

### Async Components

Use `await` directly in Svelte components without `{#await}` blocks. Enabled via `compilerOptions.experimental.async` in `svelte.config.js`.

## Storybook

Component development environment with Tailwind CSS support.

```sh
pnpm run storybook        # dev server on port 6006
pnpm run build:storybook  # static build
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
- **Variable naming**: `snake_case` or `PascalCase` (no camelCase)
- **Type naming**: `PascalCase`
- **Constants**: `UPPER_CASE`, `snake_case`, or `PascalCase`
- **Svelte**: Svelte 5 runes only (`$state`, `$derived`, `$props`). No legacy patterns.
- **Imports**: Consistent type imports with `inline-type-imports` style

## Project Structure

```
src/
  app.css                    # Tailwind CSS entry point
  app.d.ts                   # Global type definitions
  app.html                   # HTML shell
  routes/
    +layout.svelte           # Root layout (CSS import)
    +layout.ts               # SPA config (ssr=false, prerender=true)
    +page.svelte             # Home page
  lib/                       # Shared frontend code ($lib alias)
src-tauri/
  src/
    lib.rs                   # Rust commands and app setup
    main.rs                  # Entry point
  Cargo.toml                 # Rust dependencies
  tauri.conf.json            # Tauri app config (window, permissions, bundle)
  capabilities/              # Tauri security capabilities
  icons/                     # App icons (PNG, ICO, ICNS)
static/                      # Static assets
tests/e2e/                   # Playwright E2E tests
.storybook/                  # Storybook configuration
.github/workflows/           # CI pipeline
```
