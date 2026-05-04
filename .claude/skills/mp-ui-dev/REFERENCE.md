# Grovekeeper UI & Theming Reference

## Tech Stack

| Layer       | Tool                  | Purpose                                         |
| ----------- | --------------------- | ----------------------------------------------- |
| Components  | shadcn-svelte         | Copy-paste styled components (you own the code) |
| Primitives  | Bits UI v2            | Headless accessible primitives (used by shadcn) |
| Styling     | Tailwind CSS v4       | Utility-first CSS with `@theme inline`          |
| Icons       | lucide-svelte         | Icon library                                    |
| Split panes | PaneForge             | Resizable panels (via shadcn `resizable`)       |
| Toasts      | Svelte Sonner         | Notifications (via shadcn `sonner`)             |
| Utilities   | clsx + tailwind-merge | Class merging via `cn()`                        |

## Configuration Files

- `components.json` — shadcn-svelte config (aliases, registry, base color)
- `src/app.css` — CSS variables (OKLCH), Tailwind `@theme inline`, custom variant, base styles
- `src/lib/utils.ts` — `cn()` utility + `WithElementRef` type
- `src/lib/modules/board/board.context.svelte.ts` — theme mode + accent color via `useBoard()`

## Dark Mode

Dark mode uses a **`data-theme` attribute** on `<html>`, not a `.dark` class.

```css
/* src/app.css — custom variant wires dark: to data-theme=dark */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

You can still use `dark:` Tailwind utilities — they resolve via the custom variant. The `$effect.pre` in the board context writes the attribute:

```ts
document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
document.documentElement.dataset.accent = accentColor.current;
```

## CSS Variable System

All colors defined in `src/app.css` using OKLCH. Variables are declared in `[data-theme='light']` and `[data-theme='dark']` selectors and mapped to Tailwind via `@theme inline`.

### Core Surface Tokens

| CSS variable      | Tailwind class     | Purpose                                     |
| ----------------- | ------------------ | ------------------------------------------- |
| `--background`    | `bg-background`    | Page/app background                         |
| `--surface`       | `bg-surface`       | Default card/panel surface                  |
| `--surface-2`     | `bg-surface-2`     | Elevated or secondary surface               |
| `--surface-3`     | `bg-surface-3`     | Tertiary surface (tooltips, deeper nesting) |
| `--surface-hover` | `bg-surface-hover` | Hover state for interactive surfaces        |

> `bg-card`, `bg-popover`, `bg-muted`, `bg-secondary` are **aliases** for `--surface` or `--surface-2` for shadcn component compatibility.

### Text Tokens

| CSS variable          | Tailwind class           | Purpose          |
| --------------------- | ------------------------ | ---------------- |
| `--foreground`        | `text-foreground`        | Default text     |
| `--foreground-muted`  | `text-foreground-muted`  | Secondary text   |
| `--foreground-subtle` | `text-foreground-subtle` | Placeholder/hint |

> `text-muted-foreground` is an alias for `--foreground-muted` (shadcn compatibility).

### Interactive Tokens

| CSS variable     | Tailwind class            | Purpose                      |
| ---------------- | ------------------------- | ---------------------------- |
| `--primary`      | `bg-primary`              | Primary brand color (accent) |
| `--primary-fg`   | `text-primary-foreground` | Text on primary              |
| `--primary-soft` | `bg-primary-soft`         | Soft primary bg (chips, etc) |
| `--accent`       | `bg-accent`               | Amber/highlight accent       |
| `--accent-fg`    | `text-accent-foreground`  | Text on accent               |
| `--ring`         | `ring-ring`               | Focus ring color             |

### Border Tokens

| CSS variable      | Tailwind class         | Purpose           |
| ----------------- | ---------------------- | ----------------- |
| `--border`        | `border-border`        | Default border    |
| `--border-strong` | `border-border-strong` | Emphasized border |

### Status Tokens

| CSS variable       | Tailwind class        | Purpose                            |
| ------------------ | --------------------- | ---------------------------------- |
| `--status-success` | `text-status-success` | Success state (green)              |
| `--status-warning` | `text-status-warning` | Warning state (amber)              |
| `--status-danger`  | `bg-status-danger`    | Error/danger (maps to destructive) |
| `--status-info`    | `text-status-info`    | Informational (blue)               |

### Custom Color Palette

Grovekeeper has a forest-themed palette defined in `app.css`:

| Scale   | Tailwind classes                | Description                    |
| ------- | ------------------------------- | ------------------------------ |
| `moss`  | `bg-moss-50` … `bg-moss-950`    | Forest green (primary palette) |
| `amber` | `bg-amber-300` … `bg-amber-600` | Golden yellow accent           |
| `bark`  | `bg-bark-300` … `bg-bark-700`   | Warm brown                     |
| `azure` | `bg-azure-300` … `bg-azure-700` | Sky blue                       |

### Sidebar & Misc

| CSS variable   | Tailwind class            |
| -------------- | ------------------------- |
| `--sidebar-bg` | `bg-sidebar`              |
| `--sidebar-fg` | `text-sidebar-foreground` |
| `--code-bg`    | `bg-code-bg`              |

### Typography Scale

Defined as CSS variables and used directly; does **not** use Tailwind's default `text-xs/sm/base`:

```
--text-2xs (10.5px)  --text-xs (11px)  --text-sm (12px)  --text-md (13px)
--text-base (14px)   --text-lg (15px)  --text-xl (17px)  --text-2xl (22px)
--text-3xl (28px)    --text-4xl (36px) --text-5xl (48px)
--weight-regular (400)  --weight-medium (500)  --weight-semibold (600)  --weight-bold (700)
--leading-tight/snug/normal/relaxed/loose
--tracking-tight/snug/normal/wide/wider
```

### Design System Tokens

```
Control sizes:  --size-control-sm (26px)  --size-control-md (32px)  --size-control-lg (38px)
Spacing:        --space-0/1/2/3/4/5/6/7/8/10/12/14/16/20/24/32
Z-index:        --z-base/raised/dropdown/sticky/overlay/modal/toast/tooltip (0–70)
Border widths:  --border-width-1/2/3 (1px/1.5px/2px)  --focus-ring-width/offset
Animation:      --ease-standard/out/in  --duration-1/2/3/4/5 (90–320ms)
```

### Rules

1. **Always use semantic tokens** — `bg-surface` not `bg-white`, `text-foreground-muted` not `text-gray-500`
2. **Never hardcode colors** — all colors flow through CSS variables
3. **Dark mode is automatic** — `data-theme=dark` swaps all variables; `dark:` still works via custom variant
4. **OKLCH format** — `oklch(lightness chroma hue)` for perceptual uniformity

## Accent Color System

The app has 4 accent colors that override `--primary`, `--primary-fg`, `--primary-soft`, `--ring`:

| Accent  | Value   | Theme                  |
| ------- | ------- | ---------------------- |
| `moss`  | default | Forest green (default) |
| `amber` | `amber` | Golden yellow          |
| `bark`  | `bark`  | Warm brown             |
| `azure` | `azure` | Sky blue               |

Applied via `data-accent` attribute on `<html>`. Use `boardStore.theme.accent` to read/set.

## Dark Mode Context

Located in `src/lib/modules/board/board.context.svelte.ts`:

```ts
import { useBoard } from '$lib/modules/board';

const boardStore = useBoard();
boardStore.theme.mode; // 'system' | 'light' | 'dark'
boardStore.theme.isDark; // boolean (resolved — system preference applied)
boardStore.theme.prefersDark; // boolean (raw OS preference)
boardStore.theme.accent; // 'moss' | 'amber' | 'bark' | 'azure'
boardStore.theme.mode = 'dark'; // set mode (persisted to localStorage)
boardStore.theme.accent = 'amber'; // set accent (persisted to localStorage)
```

The context uses `Persisted` for localStorage sync and writes `data-theme` / `data-accent` to `<html>` via `$effect.pre`.

## Component Patterns

### Adding a shadcn component

```bash
pnpm dlx shadcn-svelte@latest add dialog --yes --overwrite
```

After adding:

1. Rename `.svelte` file to PascalCase (`button.svelte` → `Button.svelte`)
2. Extract `<script module>` content (types, `tv()` variants) to a `.ts` file (`button-variants.ts`)
3. Update `index.ts` to import types/variants from the `.ts` file — avoids oxlint TS2614

### Using a shadcn component

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
</script>

<Dialog.Root>
	<Dialog.Trigger>
		{#snippet children()}
			<Button variant="outline">Open</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Title</Dialog.Title>
			<Dialog.Description>Description</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
```

### Custom component with theming

```svelte
<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		class?: string;
		variant?: 'default' | 'muted';
	}

	let { class: className, variant = 'default' }: Props = $props();
</script>

<div
	class={cn(
		'rounded-md border border-border p-4',
		variant === 'default' && 'bg-surface text-foreground',
		variant === 'muted' && 'bg-surface-2 text-foreground-muted',
		className,
	)}
>
	<!-- content -->
</div>
```

### Icons

Prefer path-based imports (better tree-shaking):

```svelte
<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import TreePine from '@lucide/svelte/icons/tree-pine';
</script>
```

Or namespace import when using many icons:

```svelte
<script lang="ts">
	import { TreePine, Search } from 'lucide-svelte';
</script>
```

## Context7 Library IDs

Use these with the `mp-context7-docs-fetcher` agent:

| Library       | ID                          |
| ------------- | --------------------------- |
| shadcn-svelte | `/huntabyte/shadcn-svelte`  |
| Bits UI       | `/huntabyte/bits-ui`        |
| Tailwind CSS  | `/tailwindlabs/tailwindcss` |
| Lucide        | `/lucide-icons/lucide`      |
| Svelte        | `/sveltejs/svelte`          |
