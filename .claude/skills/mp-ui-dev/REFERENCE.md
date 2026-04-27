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
- `src/app.css` — CSS variables (OKLCH), Tailwind theme, base styles
- `src/lib/utils.ts` — `cn()` utility + `WithElementRef` type
- `src/lib/modules/board/board.context.svelte.ts` — dark mode via board module's `theme` property

## CSS Variable System

All colors defined in `src/app.css` using OKLCH color space. Variables are set in `:root` (light) and `.dark` (dark).

### Semantic Tokens

| Token                      | Purpose                    | Tailwind class                |
| -------------------------- | -------------------------- | ----------------------------- |
| `--background`             | Page/app background        | `bg-background`               |
| `--foreground`             | Default text               | `text-foreground`             |
| `--card`                   | Card backgrounds           | `bg-card`                     |
| `--card-foreground`        | Card text                  | `text-card-foreground`        |
| `--popover`                | Popover/dropdown bg        | `bg-popover`                  |
| `--popover-foreground`     | Popover text               | `text-popover-foreground`     |
| `--primary`                | Primary actions/brand      | `bg-primary`                  |
| `--primary-foreground`     | Text on primary            | `text-primary-foreground`     |
| `--secondary`              | Secondary elements         | `bg-secondary`                |
| `--secondary-foreground`   | Text on secondary          | `text-secondary-foreground`   |
| `--muted`                  | Muted/disabled backgrounds | `bg-muted`                    |
| `--muted-foreground`       | Muted text                 | `text-muted-foreground`       |
| `--accent`                 | Accent highlights          | `bg-accent`                   |
| `--accent-foreground`      | Text on accent             | `text-accent-foreground`      |
| `--destructive`            | Destructive/error actions  | `bg-destructive`              |
| `--destructive-foreground` | Text on destructive        | `text-destructive-foreground` |
| `--border`                 | Default borders            | `border-border`               |
| `--input`                  | Input borders              | `border-input`                |
| `--ring`                   | Focus rings                | `ring-ring`                   |
| `--sidebar-*`              | Sidebar-specific variants  | `bg-sidebar`, etc.            |
| `--chart-1..5`             | Chart/visualization colors | `fill-chart-1`, etc.          |
| `--radius`                 | Border radius scale        | `rounded-md` (uses --radius)  |

### Rules

1. **Always use semantic tokens** — `bg-background` not `bg-zinc-950`
2. **Never hardcode colors** — all colors flow through CSS variables
3. **Dark mode is automatic** — `.dark` class swaps all variables
4. **OKLCH format** — `oklch(lightness chroma hue)` for perceptual uniformity

## Dark Mode Context

Located in the board module at `src/lib/modules/board/board.context.svelte.ts`:

```ts
import { useBoard } from '$lib/modules/board';

const boardStore = useBoard();
boardStore.theme.mode; // 'system' | 'light' | 'dark'
boardStore.theme.isDark; // boolean (resolved)
theme.mode = 'dark'; // set mode
```

The context uses `Persisted` for localStorage sync and applies `.dark` class to `<html>` via `$effect.pre`.

## Component Patterns

### Adding a shadcn component

```bash
pnpm dlx shadcn-svelte@latest add dialog --yes --overwrite
```

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
		variant === 'default' && 'bg-card text-card-foreground',
		variant === 'muted' && 'bg-muted text-muted-foreground',
		className,
	)}
>
	<!-- content -->
</div>
```

## Context7 Library IDs

Use these with the `mp-context7-docs-fetcher` agent:

| Library       | ID                          | Snippets |
| ------------- | --------------------------- | -------- |
| shadcn-svelte | `/huntabyte/shadcn-svelte`  | 644      |
| Bits UI       | `/huntabyte/bits-ui`        | 1005     |
| Tailwind CSS  | `/tailwindlabs/tailwindcss` | varies   |
| Lucide        | `/lucide-icons/lucide`      | varies   |
| Svelte        | `/sveltejs/svelte`          | varies   |

## Future: Multi-Theme Support

The app is designed for eventual multi-theme support:

- Themes = sets of CSS variable overrides
- Theme registry in `src/lib/theme/` (not yet implemented)
- `data-theme` attribute on `<html>` for theme switching
- Pre-built themes (e.g., GitHub Dark, Nord, Solarized)
- Theme selection persisted in the same store as dark mode
