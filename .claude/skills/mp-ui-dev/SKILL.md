---
name: mp-ui-dev
description: 'Fetch UI library docs and apply Grovekeeper theming conventions when building components. Use when: "build UI", "create component", "add shadcn component", "theme", "styling"'
allowed-tools: Read, Glob, Grep, Bash(pnpm dlx shadcn-svelte*), Agent
metadata:
    author: MartinoPolo
    version: '0.1'
    category: execution
---

# UI Development with Grovekeeper Theming

Build UI components using shadcn-svelte + Bits UI + Tailwind CSS v4, following Grovekeeper's theming system.

## Process

### Step 1: Fetch Documentation

Spawn `mp-context7-docs-fetcher` agents for the relevant libraries:

- **shadcn-svelte** — library ID: `/huntabyte/shadcn-svelte` — component usage, theming, CLI
- **Bits UI** — library ID: `/huntabyte/bits-ui` — headless component primitives, accessibility
- **Tailwind CSS** — library ID: `/tailwindlabs/tailwindcss` — utility classes, v4 features
- **Lucide icons** — library ID: `/lucide-icons/lucide` — icon names, usage in Svelte

Query the specific component or topic the user is building.

### Step 2: Add shadcn Components

Use the CLI to add pre-built components:

```bash
pnpm dlx shadcn-svelte@latest add <component-name> --yes --overwrite
```

Available components include: accordion, alert, alert-dialog, avatar, badge, breadcrumb, button, calendar, card, carousel, checkbox, collapsible, combobox, command, context-menu, data-table, date-picker, dialog, drawer, dropdown-menu, form, hover-card, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle, toggle-group, tooltip.

Components are installed to `$lib/components/ui/<name>/`. After adding:

1. Rename the main `.svelte` file to PascalCase (e.g., `button.svelte` → `Button.svelte`)
2. Extract `<script module>` content (types, `tv()` variants) into a separate `.ts` file (e.g., `button-variants.ts`)
3. Update `index.ts` to import types/variants from the `.ts` file and default export from the `.svelte` file
4. This avoids oxlint TS2614 errors with Svelte module script imports

### Step 3: Apply Grovekeeper Theming Conventions

Read [REFERENCE.md](REFERENCE.md) for the full theming system. Key rules:

1. **Use semantic color tokens** — `bg-background`, `text-foreground`, `bg-primary`, `border-border` — never hardcode raw colors
2. **Dark mode** — use Tailwind's `dark:` variant via `.dark` class on `<html>`. The theme store (`$lib/stores/theme.svelte.ts`) manages the mode
3. **OKLCH color space** — all theme colors use `oklch()` in CSS variables defined in `src/app.css`
4. **Component structure** — follow Svelte 5 runes: `$props()`, `$state()`, `$derived()`. Use `cn()` from `$lib/utils` for class merging
5. **Icons** — use `lucide-svelte` (`import { IconName } from 'lucide-svelte'`)

### Step 4: Verify

Run `pnpm check` after adding or modifying components to ensure type safety.
