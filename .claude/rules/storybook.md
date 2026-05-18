---
paths:
    - '**/*.stories.svelte'
applyTo: '**/*.stories.svelte'
---

# Storybook

Story structure, naming, and quality rules. For low-level Storybook API usage (imports, `defineMeta`, play test utilities, bits-ui patterns), see the shadcn-svelte rule.

## Story Organization

Three tiers mirror the component layering system:

| Tier        | Storybook title prefix | Component location    |
| ----------- | ---------------------- | --------------------- |
| **Base**    | `Base/`                | `shadcn/` and `base/` |
| **Derived** | `Derived/`             | `derived/`            |
| **Blocks**  | `Blocks/<Module>/`     | `blocks/<module>/`    |

Every component gets exactly one `.stories.svelte` file.

## "All Variants" Story

Every component with variant dimensions (intent, size, tone, format, style, etc.) must have an **"All Variants"** story as its **first story**. This serves as the visual regression baseline.

**Requirements:**

- Import variant arrays from `*-variants.ts` or `index.ts` (e.g. `BUTTON_INTENTS`, `BADGE_TONES`, `BADGE_SIZES`).
- Loop through variant arrays with `{#each}` — never hardcode individual variants.
- Build a **full matrix** combining all variant dimensions. Use a grid layout: one dimension on columns, another on rows. Badge and Button are the templates.
- Label rows and columns with dimension values using `text-xs text-foreground-muted`.
- If there are more than 2 dimensions, nest loops or split into sections with headings (`text-sm font-medium text-foreground-muted`).
- Use `argTypes` with `control: 'select'` and `options: [...VARIANT_ARRAY]` for interactive controls.

**Reference — Badge (tone × size × format × style, 4 dimensions):**

```svelte
{#each BADGE_STYLES as badgeStyle (badgeStyle)}
  {#each BADGE_SIZES as size (size)}
    {#each BADGE_FORMATS as format (format)}
      {#each BADGE_TONES as tone (tone)}
        <Badge {tone} {badgeStyle} {format} {size}>{tone}</Badge>
```

**Reference — Button (intent × size, split into text/icon/icon+text sections):**

```svelte
{#each BUTTON_INTENTS as intent (intent)}
  {#each BUTTON_TEXT_SIZES as size (size)}
    <Button {intent} {size}>Label</Button>
```

## "All States" Story

Components with interactive states (checked, disabled, indeterminate, error, open) should have an **"All States"** story showing every visual state. This is separate from "All Variants" — variants are design dimensions, states are interaction states.

## Per-Dimension Stories

Each variant dimension should also have its own dedicated story showcasing all values of that single dimension. Examples: "All Dots" for Badge dot options, "All Fonts" for Badge formats, "All Styles" for Badge styles. This gives focused documentation for each axis.

## Play Test Labels

Every story with a `play` function must include a **`[play: description]`** suffix in its name. The description is a short lowercase phrase summarizing what the test verifies.

Format: `"Story Name [play: what it tests]"`

Examples:

- `"Primary [play: click calls handler]"`
- `"Disabled [play: disabled no change]"`
- `"Keyboard Navigation [play: keyboard toggle]"`
- `"With Submenus [play: arrow down focuses]"`
- `"Escape Containment [play: escape contained]"`

Stories without play functions never have `[play:]` in their name.

## Keyboard Shortcut Info Boxes

Stories that demonstrate keyboard interaction must include a visible info box listing available shortcuts. Place it **above** the component inside the story template.

```svelte
<div class="mb-4 rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
	<p class="mb-1 font-medium text-foreground">Keyboard shortcuts</p>
	<ul class="flex flex-col gap-0.5">
		<li>
			<kbd class="rounded bg-muted px-1 font-mono text-xs">Enter</kbd> /
			<kbd class="rounded bg-muted px-1 font-mono text-xs">Space</kbd> — Toggle item
		</li>
		<li>
			<kbd class="rounded bg-muted px-1 font-mono text-xs">↓</kbd> /
			<kbd class="rounded bg-muted px-1 font-mono text-xs">↑</kbd> — Navigate items
		</li>
	</ul>
</div>
```

Document the actual keyboard shortcuts the component supports — check what the play test exercises and what the underlying shadcn-svelte/bits-ui primitive provides.

## Overlay Stories

Overlay components (Dialog, Sheet, Popover, Select, DropdownMenu, ContextMenu) must use `portalProps={{ disabled: true }}` in stories so content renders inside the Storybook canvas rather than escaping to `<body>`.
