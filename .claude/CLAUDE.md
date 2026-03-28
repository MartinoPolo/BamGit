# Project Context

## Overview
BamGit — Desktop Git client built with Tauri v2 + Svelte 5 + TypeScript

## Tech Stack
- Frontend: Svelte 5, TypeScript, Vite
- Backend: Rust (Tauri v2)
- Package Manager: pnpm
- Build: Tauri CLI

## Project Structure
```
src/             # Svelte frontend (SvelteKit with static adapter)
src-tauri/       # Rust backend (Tauri commands, config)
static/          # Static assets
```

## Development Commands
```bash
# Install dependencies
pnpm install

# Run development server (frontend + native window)
pnpm tauri dev

# Build for production
pnpm tauri build

# Type check
pnpm check
```

## Key Files
- `src-tauri/tauri.conf.json`: Tauri app config (window, permissions, bundle)
- `src-tauri/src/lib.rs`: Rust backend entry point
- `src/routes/+page.svelte`: Main frontend page
- `svelte.config.js`: SvelteKit config (static adapter)
- `vite.config.js`: Vite config
