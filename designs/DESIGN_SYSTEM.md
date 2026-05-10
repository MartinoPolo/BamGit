# Grovekeeper Design System Reference

## App Identity

Grovekeeper is a desktop developer tool for managing parallel AI coding sessions. Design priorities:

- **Information density** — maximize useful data per screen area
- **Keyboard-first** — every action accessible via keyboard
- **Developer-focused** — monospace data, compact layouts, minimal decoration
- **Forest Moss theme** — dark mode primary, nature-inspired color palette

## Design Tokens

Full token definitions: `claude_design/tokens.css`

| Category      | Key values                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Fonts         | Geist (sans), Geist Mono (mono)                                                                              |
| Spacing       | 4px base grid (`--space-1` through `--space-32`)                                                             |
| Control sizes | sm=26px, md=32px, lg=38px                                                                                    |
| Radii         | xs=4px, sm=6px, md=8px, lg=10px, xl=14px                                                                     |
| Palette       | Forest Moss — moss, amber, bark, azure scales                                                                |
| Theme class   | `gk-root theme-dark` (dark primary)                                                                          |
| Accent system | 12 accents (moss/amber/bark/azure/plum/teal/rose/coral/gold/sage/indigo/fuchsia) via `data-accent` attribute |

## CSS Component Classes (from tokens.css)

Use these in HTML mockups. They are fully styled and self-contained.

**Buttons**: `.gk-btn` (32px), `.gk-btn-sm` (26px), `.gk-btn-lg` (38px), `.gk-btn-icon`
Variants: `.gk-btn-primary`, `.gk-btn-secondary`, `.gk-btn-ghost`, `.gk-btn-danger`, `.gk-btn-success`

**Form controls**: `.gk-input`, `.gk-select`, `.gk-textarea` (32px), `.gk-check`, `.gk-radio` (16px), `.gk-toggle`, `.gk-label`

**Display**: `.gk-badge` (20px) + `.gk-badge-success/warning/danger/info/moss/amber`, `.gk-card`, `.gk-card-padded`

**Navigation**: `.gk-tabs` + `.gk-tab` + `.is-active`, `.gk-popover` + `.gk-popover-item`

**Layout**: `.gk-modal` + `.gk-modal-backdrop/header/body/footer`, `.gk-tooltip`, `.gk-hr`, `.gk-resizer`, `.gk-kbd`

**Typography**: `.gk-h1` (22px), `.gk-h2` (17px), `.gk-h3` (14px), `.gk-body` (13px), `.gk-small` (12px), `.gk-tiny` (11px), `.gk-eyebrow` (10.5px uppercase), `.font-mono`

**CodeBurn data panels**: `.cb-panel` + `.cb-panel-title` (bracket-style `[HEADING]`), `.cb-row` + `.cb-num` + `.cb-mute` (dense data rows), `.cb-bar` / `.cb-bar-cool` / `.cb-bar-moss` (gradient bars), `.cb-tabs` + `.cb-tab`, `.cb-finding` (left-border accent cards), `.cb-statusbar` + `.cb-keycap` (TUI status bar)

**Animations**: `.gk-pulse`, `.gk-sway`, `.gk-bob`, `.gk-glow`

## Tailwind Semantic Tokens (for Svelte components)

When building Svelte components (not HTML mockups), use Tailwind classes mapped to CSS variables.

- **Surfaces**: `bg-background`, `bg-surface`, `bg-surface-2`, `bg-surface-3`, `bg-surface-hover`
- **Text**: `text-foreground`, `text-foreground-muted`, `text-foreground-subtle`
- **Interactive**: `bg-primary`, `text-primary-foreground`, `bg-primary-soft`, `bg-accent`, `ring-ring`
- **Borders**: `border-border`, `border-border-strong`
- **Status**: `text-status-success`, `text-status-warning`, `bg-status-danger`, `text-status-info`, `text-status-merged`
- **Scales**: `bg-moss-50`..`bg-moss-950`, `bg-amber-300`..`bg-amber-600`, `bg-bark-300`..`bg-bark-700`, `bg-azure-300`..`bg-azure-700`

Rules: Always use semantic tokens. Never hardcode colors. Dark mode is automatic via `data-theme`.

## Component Library

```
src/lib/components/
├── ui/              ← shadcn-svelte (Button, Input, Dialog, Tabs, etc.)
├── chat/            ← ChatMessage, ToolCards
├── session/         ← SessionLayout, FloatingInputPanel
├── color-picker/    ← Custom color picker
├── creation-wizard/ ← Multi-step wizard
├── icons/           ← Custom SVG icon components
└── *.svelte         ← Root-level domain components (IssueCard, WorkspaceCard,
                       SessionCard, ForestView, CommandPalette, TopBar, etc.)
```

### Adding shadcn Components

```bash
pnpm dlx shadcn-svelte@latest add <name> --yes --overwrite
```

After: rename to PascalCase, extract `<script module>` to `.ts` file, update `index.ts`.

### Component Usage

```svelte
import {Button} from '$lib/components/ui/button'; import * as Dialog from '$lib/components/ui/dialog';
```

### Icons — path-based imports for tree-shaking:

```svelte
import SearchIcon from '@lucide/svelte/icons/search';
```

### Class Merging — `cn()` from `$lib/utils` (clsx + tailwind-merge)

## Context7 Library IDs

| Library       | ID                          |
| ------------- | --------------------------- |
| shadcn-svelte | `/huntabyte/shadcn-svelte`  |
| Bits UI       | `/huntabyte/bits-ui`        |
| Tailwind CSS  | `/tailwindlabs/tailwindcss` |
| Lucide        | `/lucide-icons/lucide`      |
| Svelte        | `/sveltejs/svelte`          |

## Storybook

Stories: `src/lib/components/**/*.stories.svelte` — run `pnpm storybook`

## File Conventions

### Design Briefs

- Location: `claude_design/design_briefs/`
- No underscore prefix = ready for mockup (unfinished)
- Underscore prefix (`_NAME.md`) = completed (has final design)

### Mockups

- Variants: `claude_design/mockups/variants/<component-name>/variant-{a,b,c}.html`
- Finals: `claude_design/mockups/<component-name>.html`
- Format: self-contained HTML, `tokens.css` inlined, `gk-root theme-dark` wrapper, Geist font via CDN
