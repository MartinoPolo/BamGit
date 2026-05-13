## Context

Read `.mpx/testing-framework/CONVENTIONS.md` in full before starting. It defines the story format, event propagation rules, conflict reporting format, and sub-agent instructions.

This phase creates Storybook stories for shadcn/base/derived components that currently have no story. These are simpler components with no or minimal context dependencies. After this phase every primitive-tier and derived-tier component has at least one documented, interactive story.

**DO NOT** create stories for sub-components (accordion-item, dialog-trigger, etc.) — only for the top-level composed component.

---

## Project Context

- **Story files location**: co-located with the component, e.g. `src/lib/components/shadcn/accordion/Accordion.stories.svelte`
- **Component imports**: always from the barrel `./index.js`, not the `.svelte` file directly
    > **Exception**: derived components (`language-switcher`, `path-input`, `repo-combobox`, `sync-badge`, `theme-toggle`) do **not** have barrel exports. Import them directly: `import SyncBadge from './SyncBadge.svelte'`.
- **All stories must**: have `tags: ['autodocs']`, use `{#snippet template(...)}` pattern
- **ThemeDecorator**: applied globally
- **bits-ui documentation**: use Context7 MCP (`mcp_context7_resolve-library-id` then `mcp_context7_get-library-docs`) to check the current API for any bits-ui primitive you write a story for — especially for `onEscapeKeydown`, focus management, and keyboard interaction props

---

## Components to Cover (14 sub-agents)

Spawn one sub-agent per item. Each sub-agent reads the component source, checks the barrel export (`index.ts`), fetches bits-ui docs if relevant via Context7 MCP, then creates the story file.

### Sub-agent 1 — `Accordion`

- **File**: `src/lib/components/shadcn/accordion/accordion.svelte`
- **Barrel**: `src/lib/components/shadcn/accordion/index.ts`
- **Variants needed**: Default (single open), Multiple open, All collapsed, Disabled item
- **Event propagation**: Accordion is not an overlay, no propagation concern. But verify: does `Accordion.Trigger` stop `keydown` from bubbling? Check if pressing Space/Enter only affects the focused trigger item.
- **bits-ui API to check**: `Accordion.Root` props — `type` (single/multiple), `disabled`, `onValueChange`

### Sub-agent 2 — `Alert`

- **File**: `src/lib/components/shadcn/alert/alert.svelte`
- **Barrel**: `src/lib/components/shadcn/alert/index.ts`
- **Variants needed**: Default (info), Destructive/error, With icon, With action button, Without title
- **No event propagation concern** (display-only)

### Sub-agent 3 — `DropdownMenu`

- **File**: `src/lib/components/shadcn/dropdown-menu/dropdown-menu.svelte`
- **Barrel**: `src/lib/components/shadcn/dropdown-menu/index.ts`
- **Variants needed**: Basic menu (trigger + items), With separators, With icons, With keyboard shortcuts displayed, With sub-menu, Disabled items
- **⚠️ Event propagation required**: This component renders a floating overlay. The story must demonstrate correct escape containment. Read bits-ui `DropdownMenu` docs via Context7 MCP. Check that `onEscapeKeydown` is available on `DropdownMenu.Content` and verify whether it stops propagation automatically or requires explicit handling. Document finding in Findings Report.
- **bits-ui API to check**: `DropdownMenu.Root`, `DropdownMenu.Content` — `onEscapeKeydown`, `onInteractOutside`, `escapeKeydownBehavior` (replaces the old `closeOnEscapeKeydown` boolean from v1)

### Sub-agent 4 — `Sheet`

- **File**: `src/lib/components/shadcn/sheet/sheet.svelte`
- **Barrel**: `src/lib/components/shadcn/sheet/index.ts`
- **Variants needed**: Left side, Right side (default), Top, Bottom, With form content, With long scrollable content
- **⚠️ Event propagation required**: Sheet is a drawer/overlay. Check `Sheet.Content` for `onEscapeKeydown`. Verify that pressing Escape closes Sheet without triggering page-level listeners.
- **bits-ui API to check**: `Sheet` (or `Dialog`-based) — side prop, overlay close, escape handling

### Sub-agent 5 — `Progress`

- **File**: `src/lib/components/shadcn/progress/progress.svelte`
- **Barrel**: `src/lib/components/shadcn/progress/index.ts`
- **Variants needed**: 0%, 25%, 50%, 75%, 100%, Indeterminate (if supported)
- **No event propagation concern** (display-only)

### Sub-agent 6 — `Calendar`

- **File**: `src/lib/components/shadcn/calendar/calendar.svelte`
- **Barrel**: `src/lib/components/shadcn/calendar/index.ts`
- **Variants needed**: Default (today), With preselected date, Min/max date constraint, Disabled dates
- **bits-ui API to check**: `Calendar.Root` — `value`, `minValue`, `maxValue`, `isDateDisabled`, keyboard navigation behavior (arrow keys, page up/down for month navigation)
- **Event propagation note**: Calendar is embedded in a popover elsewhere. Verify arrow key events from Calendar navigation don't bubble outside the calendar grid.

### Sub-agent 7 — `RangeCalendar`

- **File**: `src/lib/components/shadcn/range-calendar/range-calendar.svelte`
- **Barrel**: `src/lib/components/shadcn/range-calendar/index.ts`
- **Variants needed**: Empty (no selection), Partial selection (start only), Full range selected, Single-month display, Two-month display
- **bits-ui API to check**: `RangeCalendar.Root` — `value` (DateRange), `onValueChange`, focus behavior

### Sub-agent 8 — `Separator`

- **File**: `src/lib/components/shadcn/separator/separator.svelte`
- **Barrel**: `src/lib/components/shadcn/separator/index.ts`
- **Variants needed**: Horizontal (default), Vertical, With surrounding content, In a form
- **No event propagation concern** (display-only)

### Sub-agent 9 — `HelpText` (base)

- **File**: `src/lib/components/base/help-text/HelpText.svelte`
- **Barrel**: `src/lib/components/base/help-text/index.ts`
- **Variants needed**: Default help text, Error state, Success state, Long text wrapping
- **Note**: The only supported `status` values are `'default' | 'error' | 'success'`. There is no `'warning'` value.
- **No event propagation concern** (display-only)

### Sub-agent 10 — `LanguageSwitcher` (derived)

- **File**: `src/lib/components/derived/language-switcher/LanguageSwitcher.svelte`
- **Read the component source first** to understand what it does and what props it accepts
- **Variants needed**: Default (current language), With multiple languages, Compact form
- **Check**: Does it use a dropdown internally? If yes, apply event propagation check.

### Sub-agent 11 — `PathInput` (derived)

- **File**: `src/lib/components/derived/path-input/PathInput.svelte`
- **Note**: This component calls `invoke('pick_folder')` via Tauri. This works automatically in Storybook (tauri_mock.ts intercepts it and returns a mock path).
- **Variants needed**: Empty, Pre-filled path, With custom placeholder, Disabled
- **Check**: Does the Browse/folder button stop its click from bubbling to the input's `onchange`?

### Sub-agent 12 — `RepoCombobox` (derived)

- **File**: `src/lib/components/derived/repo-combobox/RepoCombobox.svelte`
- **Note**: This component calls `invoke('list_user_repos')` and `invoke('search_github_repos')`. Both are intercepted by tauri_mock.ts.
- **Variants needed**: Empty (no repos loaded), With repos list, With preselected value, Loading state, Remote search results
- **⚠️ Event propagation required**: This is a combobox/popover overlay. Verify that Escape closes only the popover, not any parent dialog. Check bits-ui `Combobox` or `Select` escape handling via Context7.
- **bits-ui API to check**: Combobox escape handling, `onEscapeKeydown`

### Sub-agent 13 — `SyncBadge` (derived)

- **File**: `src/lib/components/derived/sync-badge/SyncBadge.svelte`
- **Read the component source first** to understand what props it accepts
- **Variants needed**:
    - Up-to-date (renders nothing — document this in the story with a note)
    - Behind by 1 commit (warning styling)
    - Behind by 10+ commits (danger styling)
- **Note**: The component accepts a single `behindBaseCount: number` prop. When `behindBaseCount <= 0` it renders nothing. There is no loading, error/stale, or tooltip-toggle variant. The tooltip is always shown when the badge is visible.
- **No event propagation concern** (display-only with tooltip)

### Sub-agent 14 — `ThemeToggle` (derived)

- **File**: `src/lib/components/derived/theme-toggle/ThemeToggle.svelte`
- **Note**: This component uses `useBoard()` context for the current theme. The global ThemeDecorator already provides this context — it will work out of the box.
- **Variants needed**: Light mode active, Dark mode active, System mode active, Collapsed sidebar version
- **Check**: The component cycles through modes on click. Does clicking it stop propagation so it doesn't trigger sidebar item navigation?

---

## Instructions for Each Sub-Agent

```
You are implementing a Storybook story for a specific component in the Grovekeeper project.

1. Read the component source file completely before writing anything.
2. Check if the component has an `index.ts` barrel export. Import from the barrel.
3. If the component uses bits-ui primitives, use Context7 MCP to fetch current API docs:
   - mcp_context7_resolve-library-id({ libraryName: "bits-ui" })
   - mcp_context7_get-library-docs({ id: "<result>", topic: "<component name>" })
4. Create the story file co-located with the component (e.g. Accordion.stories.svelte).
5. Follow the exact format in CONVENTIONS.md (defineMeta, snippet pattern).
6. Cover all required variants listed for this component.
7. If the component is an overlay/dropdown: verify event propagation (see CONVENTIONS.md §1).
   - If a violation is found, fix the component AND document in Findings Report.
8. Run `pnpm check:all` mentally (TypeScript strict, no unused imports).
9. Return a Findings Report (format in CONVENTIONS.md §4).
```

---

## Completion Criteria

- All 14 story files exist and follow the CONVENTIONS.md format exactly
- `pnpm test -- --project=storybook` passes (stories render without errors)
- `pnpm check:all` passes with no new errors
- Consolidated Findings Report produced listing all violations discovered and their resolutions

---

## Example Story (reference — Accordion)

```svelte
<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Accordion } from './index.js';

	const { Story } = defineMeta({
		title: 'Base/Accordion',
		component: Accordion,
		tags: ['autodocs'],
	});
</script>

<Story name="Single Open">
	{#snippet template()}
		<div class="w-80">
			<Accordion.Root type="single">
				<Accordion.Item value="item-1">
					<Accordion.Trigger>Section One</Accordion.Trigger>
					<Accordion.Content>Content for section one.</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item value="item-2">
					<Accordion.Trigger>Section Two</Accordion.Trigger>
					<Accordion.Content>Content for section two.</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</div>
	{/snippet}
</Story>

<Story name="Multiple Open">
	{#snippet template()}
		<div class="w-80">
			<Accordion.Root type="multiple">
				<!-- ... -->
			</Accordion.Root>
		</div>
	{/snippet}
</Story>
```
