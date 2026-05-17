# Shared Testing Conventions

This document is referenced by all phase prompts. Read it completely before starting any phase.

---

## 1. Event Propagation: The Core Architectural Rule

### The Problem

Grovekeeper uses layered floating UI: dropdowns can appear inside dialogs, context menus appear above cards, popovers appear over panels. A persistent bug class is **event bleed-through**: the user presses `Escape` to close an inner dropdown, and that `Escape` also closes the outer dialog behind it. Similarly, clicking a menu item can trigger click handlers on elements beneath the menu in the DOM.

### The Rule: Floating Overlays Are Event Boundaries

Any component that renders "in front of" other content — Dropdown, ContextMenu, Popover, Sheet, Select, Combobox, Tooltip — **must stop keyboard and pointer events from propagating to layers behind it** when those events are handled by the overlay.

### Required Patterns

#### Escape key in bits-ui/shadcn overlay components

bits-ui v2 uses an **escape-layer system**: every overlay (Dialog, DropdownMenu, Popover, Select, etc.) registers itself in a global layer stack. When Escape is pressed, bits-ui finds the **topmost layer** and fires `onEscapeKeydown` only on that layer. When a DropdownMenu is open inside a Dialog, the dropdown is the topmost layer — only its handler fires. The Dialog's `onEscapeKeydown` is **not called at all** until the dropdown is closed.

This means the "nested dropdown + dialog" case is **handled correctly by default** — no `stopPropagation` needed on `Dialog.Content` itself.

> **Important**: bits-ui passes a **cloned** `KeyboardEvent` to `onEscapeKeydown` callbacks. Calling `e.stopPropagation()` on a cloned event is a **no-op** — it has zero effect on DOM propagation. Only `e.preventDefault()` has effect (it prevents bits-ui from auto-closing the overlay).

The real risk is components that install a **`svelte:window onkeydown` handler** that responds to Escape independently of bits-ui's layer system. Those handlers receive the real DOM event and can fire even when a bits-ui overlay is open.

Patterns:

```svelte
<!-- CORRECT: prevent auto-close when the component owns its own Escape handling -->
<Dialog.Content onEscapeKeydown={(e) => e.preventDefault()}>
<!-- + svelte:window handles Escape with stopPropagation() in its own handler -->
```

```svelte
<!-- Also valid if you want bits-ui to defer Escape handling to the parent layer -->
<Dialog.Content escapeKeydownBehavior="defer-otherwise-close">
```

```svelte
<!-- WRONG: svelte:window Escape handler fires even when a dialog is open -->
<svelte:window onkeydown={(e) => {
    if (e.key === 'Escape') doSomething(); // ← fires even when dialog is absorbing Escape
}} />

<!-- CORRECT: always stop propagation after handling -->
<svelte:window onkeydown={(e) => {
    if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation(); // ← stop the real DOM event from reaching other listeners
        doSomething();
    }
}} />
```

#### Custom keyboard handlers in non-bits-ui components

Any component that installs a `svelte:window onkeydown` handler or an element-level `onkeydown` that handles a key must call `event.stopPropagation()` **after** handling it so the event doesn't reach other listeners at or above the same level.

```svelte
<!-- CORRECT -->
function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation(); // ← required: stop parent layers seeing this
        closeMe();
    }
}
```

#### Click events inside overlays

Action buttons inside cards or overlays that should NOT trigger the card's own `onclick` must stop propagation:

```svelte
<!-- CORRECT: icon button inside a card that has its own onclick -->
<button onclick={(e) => { e.stopPropagation(); doAction(); }}>
```

#### Nested interactive elements in selectable cards

Selectable cards (IssueCard, WorkspaceCard, ItemCard) have an `onclick` that changes application state (selection, URL, navigation). They are also wrapped by a `<ContextMenu.Root>` that opens on right-click. Nested elements — buttons, links, chips — inside those cards have their **own** actions that must not bleed into the card's handlers.

**How bits-ui ContextMenu works**: `ContextMenu.Trigger` listens to the native browser `contextmenu` DOM event (fired by right-click on desktop, long-press on touch). It does NOT listen to `click` with `button: 2`. Stopping `contextmenu` propagation from a nested element prevents bits-ui from opening the card menu; letting it bubble is what allows the card menu to open.

Two events to consider:

| User action                 | Event         | When to stop propagation                                                                                                                                                                                                |
| --------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Left-click a nested button  | `click`       | Always — must not trigger card's `onclick` (selection)                                                                                                                                                                  |
| Right-click a nested button | `contextmenu` | Only when the button has its OWN right-click action that conflicts with the card menu. If it's acceptable for the card's context menu to open on right-click (e.g., a label or text element), stopping is not required. |

```svelte
<!-- CORRECT: nested button whose right-click has its own distinct action (e.g., quick-action) -->
<button
    onclick={(e) => { e.stopPropagation(); doMyAction(); }}
    oncontextmenu={(e) => { e.preventDefault(); e.stopPropagation(); doRightClickAction(); }}
>

<!-- ALSO CORRECT: nested link where right-clicking the card menu is acceptable UX -->
<a
    href={url}
    onclick={(e) => e.stopPropagation()}
    {/* no oncontextmenu — right-click opens the card's context menu, which is fine */}
>
```

**Canonical example in the codebase**: `IssueCard.svelte` quick-action buttons use `handleQuickActionContextMenu` which calls both `preventDefault()` and `stopPropagation()` on `contextmenu` — because right-clicking one of those buttons has a specific action (assign folder). Other nested elements (priority chip, GitHub link) do NOT stop `contextmenu` — right-clicking them opens the card's context menu, which is intentional.

### What to Test for Event Propagation

When writing `play()` tests or Playwright tests for any floating overlay, always include:

1. **Escape containment test**: Open outer dialog → open inner dropdown → press Escape → assert inner dropdown is closed AND outer dialog is still open.
2. **Click containment test**: If the overlay has clickable items, click one → assert the background element's click handler was NOT called.
3. **No unintended dismissal test**: Interact with the overlay (type, select, scroll) → assert the overlay did not dismiss unexpectedly.

For selectable cards with nested interactive elements, always include:

4. **Left-click containment**: Click a nested button → the card's selection handler (`onclick`) must NOT have been called.
5. **Right-click / contextmenu containment** (only for buttons that have their own right-click action): Right-click the button → the card's context menu must NOT open, and the button's own right-click handler fires instead. If a button has no dedicated right-click action, it is acceptable (and correct) for the card's context menu to open on right-click — do NOT add `oncontextmenu` guards to those elements.

### When You Find a Violation

If you find a component that is **missing** the `stopPropagation` / `preventDefault` guard and the test proves it bleeds events through:

1. **Write the failing test first** (it should fail).
2. **Fix the component** by adding the guard.
3. **Verify the test now passes**.
4. **Report the fix** in the Findings section of your output.

### Context7 MCP for bits-ui / shadcn-svelte Reference

Before writing stories or tests that involve bits-ui primitives, fetch current API documentation:

```
Use the Context7 MCP tools:
1. mcp_context7_resolve-library-id({ libraryName: "bits-ui" })
2. mcp_context7_get-library-docs({ context7CompatibleLibraryID: "<id>", topic: "dialog escape keydown" })
```

Do this for: Dialog, Popover, DropdownMenu, Select, ContextMenu, Combobox, Sheet, Tooltip.
Pay particular attention to: `onEscapeKeydown`, `escapeKeydownBehavior` (enum: `'close' | 'ignore' | 'defer-otherwise-close' | 'defer-otherwise-ignore'`), focus management props, and any `onInteractOutside` callbacks.

> **Note**: `closeOnEscapeKeydown` was a bits-ui v1 boolean prop. In bits-ui v2 it was replaced by `escapeKeydownBehavior`. Do not look for `closeOnEscapeKeydown`.

---

## 2. Story File Format

All story files must follow this exact pattern (`.stories.svelte` extension, no `.stories.ts`):

> **Global decorator**: `ThemeDecorator` is registered globally in `.storybook/preview.ts` and wraps every story automatically.

```svelte
<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { MyComponent } from './index.js'; // ← from barrel export

	const { Story } = defineMeta({
		title: 'Category/SubCategory', // ← see Title Taxonomy below
		component: MyComponent,
		tags: ['autodocs'],
		argTypes: {
			variant: { control: 'select', options: ['a', 'b'] },
			disabled: { control: 'boolean' },
		},
		args: {
			/* sensible defaults */
		},
	});
</script>

<script lang="ts">
	// Mock data factories, helper imports, local state — put here
	import type { MyType } from '$lib/types/generated/MyType.js';

	function makeMock(overrides: Partial<MyType> = {}): MyType {
		return { id: 'mock-1', name: 'Mock Item', ...overrides };
	}
</script>

<Story name="Default">
	{#snippet template(args)}
		<MyComponent {...args} />
	{/snippet}
</Story>

<Story name="Disabled State">
	{#snippet template(args)}
		<MyComponent {...args} disabled />
	{/snippet}
</Story>
```

### Title Taxonomy

| Location                   | Title prefix              |
| -------------------------- | ------------------------- |
| `shadcn/`                  | `Base/`                   |
| `base/`                    | `Base/`                   |
| `derived/`                 | `Derived/`                |
| `blocks/chat/`             | `Blocks/Chat/`            |
| `blocks/session/`          | `Blocks/Session/`         |
| `blocks/usage/`            | `Blocks/Usage/`           |
| `blocks/issue/`            | `Blocks/Issue/`           |
| `blocks/workspace/`        | `Blocks/Workspace/`       |
| `blocks/layout/`           | `Blocks/Layout/`          |
| `blocks/creation-wizard/`  | `Blocks/CreationWizard/`  |
| `blocks/dependency-graph/` | `Blocks/DependencyGraph/` |
| `blocks/forest/`           | `Blocks/Forest/`          |
| `blocks/github/`           | `Blocks/GitHub/`          |
| `blocks/command-palette/`  | `Blocks/CommandPalette/`  |

### Mandatory Story Coverage

Every story file must have at minimum:

- **Default/Primary** — the standard "happy path" state
- **Disabled** — if the component has a disabled prop
- **Empty / No Data** — if the component renders a list or data-dependent content
- **Loading** — if the component has a loading state
- **Error / Destructive** — if the component has an error/danger variant
- **Dark mode** — the global ThemeDecorator controls panel handles this; no explicit story needed

### Mock Data

Use `src/lib/tauri_mock_data.ts` as the source of fixture objects. Import constants from it rather than duplicating data:

```ts
import {
	MOCK_SESSIONS,
	MOCK_ISSUES,
	MOCK_DASHBOARDS,
	MOCK_OVERVIEW_DATA,
} from '$lib/tauri_mock_data.js';
```

For one-off local variations, define a `makeMockX()` factory function in the `<script lang="ts">` block.

### Import Conventions

> **⚠️ No dynamic `import()` calls in Storybook stories**: Storybook does NOT support dynamic `import()` calls (e.g., `const mod = await import('./index.js')`). Always use static imports at the top of the script block: `import { Root, Item, Content } from './index.js'` or the named alias `import { ComponentName } from './index.js'`.
>
> Static namespace imports (`import * as ContextMenu from './index.js'`) **are fine** — these are resolved at build time by Vite and work correctly in Storybook CSF. The issue is exclusively with dynamic `import()` expressions evaluated at runtime. Components like ContextMenu, Dialog, Popover, DropdownMenu, etc. that export namespaced aliases may use either static named imports or static namespace imports in stories.

---

## 3. Context Dependencies

### Tier 1 — No context needed (just props)

Most shadcn wrappers, base components, display-only derived components, and chat display components. The global ThemeDecorator is always present; no extra setup required.

### Tier 2 — Board context (covered by global ThemeDecorator)

Components that call `useBoard()` for theme/accent information. The global ThemeDecorator calls `setBoardContext()` automatically, so these components work out of the box with no extra setup.

### Tier 3 — Multi-store wrapper needed

Components that call multiple context hooks (`useIssues()`, `useSessions()`, `useActions()`, etc.).
Pattern: create a `MyComponentStoryWrapper.svelte` file alongside the story that sets up required contexts, then use that wrapper as the `component` in `defineMeta`. Reference: `src/lib/components/blocks/command-palette/CommandPaletteStoryWrapper.svelte`.

> **Note for issues context**: The `issues` property on the object returned by `setIssuesContext()` is a read-only getter — you cannot assign to it directly. To populate issues for stories, call `issuesCtx.loadIssues(dashboardId)` from `onMount`, which routes through the auto-mocked `get_issues_for_dashboard` handler. Example:
>
> ```svelte
> <script lang="ts">
> 	import { onMount } from 'svelte';
> 	import { setIssuesContext } from '$lib/modules/issues/index.js';
> 	import { MOCK_DASHBOARDS } from '$lib/tauri_mock_data.js';
> 	const issuesCtx = setIssuesContext();
> 	onMount(() => issuesCtx.loadIssues(MOCK_DASHBOARDS[0].id));
> </script>
> ```
>
> **Note for sessions context**: `setSessionsContext(notifications)` requires a `NotificationsApi` argument: `{ addPending: (sessionId, eventType) => void; clearPending: (sessionId) => void }`. Pass a no-op mock in stories:
>
> ```ts
> const noopNotifications = { addPending: () => {}, clearPending: () => {} };
> const sessionsCtx = setSessionsContext(noopNotifications);
> ```

### Tier 4 — Tauri commands

Components that call `invoke()`. These work automatically in Storybook because `src/lib/tauri_mock.ts` intercepts all `invoke()` calls when `window.__TAURI_INTERNALS__` is undefined. No special setup needed.

---

## 4. Conflict Reporting Format

Every agent (and every sub-agent) must append a **Findings Report** to their output with this structure:

```markdown
## Findings Report

### ✅ Completed

- [ComponentName] — story created, N variants, clean

### ⚠️ Pattern Violations Found

- [ComponentName] — [description of violation]
    - File: `src/lib/components/.../MyComponent.svelte`
    - Issue: Missing `stopPropagation()` on Escape in Dialog.Content
    - Action taken: Fixed + test added that verifies containment
    - Test status: ✅ Now passes

### 🐛 Bugs Discovered

- [ComponentName] — [description of bug]
    - Reproduction: [minimal steps]
    - Root cause: [brief explanation]
    - Action taken: Fixed / Deferred (explain why)

### 🔲 Deferred / Not Attempted

- [ComponentName] — [reason: too coupled, missing types, needs design decision]
```

---

## 5. General Sub-Agent Instructions

When a phase prompt instructs you to spawn sub-agents:

- Spawn one sub-agent per component or module. Keep context small.
- Each sub-agent receives: the component file path(s), the relevant sections of this CONVENTIONS.md, and the specific task.
- Sub-agents run independently and return a Findings Report.
- The orchestrating agent collects all reports, deduplicates findings, and presents a consolidated summary to the user.
- If a sub-agent fails or produces a broken file, the orchestrator attempts one retry with corrected instructions before marking the task as Deferred.

---

## 6. Running Tests

```bash
# Run all Vitest tests (unit + component + storybook)
pnpm test

# Run only Storybook interaction tests
pnpm test -- --project=storybook

# Run Playwright E2E
pnpm test:e2e

# Check everything passes
pnpm check:all
```

After each phase, run `pnpm check:all` and fix any TypeScript or lint errors before marking the phase complete.

---

## 7. Design System Consistency Checks

When reviewing or creating components and stories, always verify these design system consistency rules:

### Rounded Corners

- All interactive sub-components (items, cells, options, rows) should use `rounded-md` or `rounded-lg` for their hover/selected backgrounds, matching the parent container's border radius
- Avoid `rounded-1` or very small radius for selected/highlighted states — these look inconsistent against containers with `rounded-md`
- Checkbox and other form controls: use `rounded-sm` (matches shadcn-svelte standard) for the control itself
- Dropdown items, context menu items, select options: use `rounded-sm` for item backgrounds

### Colors

- All components must respect light/dark mode using CSS variables (`text-foreground-subtle`, `bg-surface-2`, etc.)
- Shadows (`shadow-lg`) may need to be visible in dark mode — check that `shadow` colors work in both themes
- Header/label text in menus should be `text-foreground-subtle` (not the same as item text) to be distinguishable

### Icon Usage

- **Never use Unicode characters as icons in UI code**: Replace ⌫, ⌘, ↵, ✓, × etc. with Lucide icon components from `@lucide/svelte`. The only exceptions are keyboard key LABELS inside `<Kbd>` components (e.g., `<Kbd>Esc</Kbd>` is fine).
- Import pattern: `import DeleteIcon from '@lucide/svelte/icons/delete'`
- Common substitutions: `⌫` → `<DeleteIcon />`, `↵` → `<CornerDownLeftIcon />`, `✓` → `<CheckIcon />`, `×` → `<XIcon />`, `⌘` → text `"Ctrl"`

### Keyboard Accessibility

- bits-ui overlays (Popover, DropdownMenu, ContextMenu, Dialog, Select) handle focus management automatically
- Popover: Focus moves to first focusable element on open; Tab cycles through items (no focus trap); Escape closes via escape-layer system
- Checkboxes inside popovers: Space key toggles them (native bits-ui behavior)
- Buttons inside overlays should show `Kbd` hints for primary actions (Enter/↵ for confirm, Ctrl+R for reset)
- Multi-key chords use `KbdGroup` wrapping multiple `Kbd` elements with `<span>+</span>` separators
- Single-key hints on primary buttons use `<Kbd variant="inverted">` with a `CornerDownLeftIcon` for Enter

### Keyboard Shortcut Notation (Platform-Adaptive)

The app uses platform-adaptive keyboard shortcut display:

- **Mac**: Show `⌘` (Command symbol)
- **Windows/Linux**: Show `Ctrl`

Implementation pattern:

- Use a `getModifierKey()` utility (to be implemented) that returns `⌘` on Mac and `Ctrl` on Windows/Linux
- Never hardcode `⌘` in component code — detect platform at runtime
- For Storybook stories and current placeholder usage: use `Ctrl` (Windows/Linux default)
- Full chord format: `Ctrl+K` on Windows, `⌘K` on Mac

For keyboard shortcut display in `<Kbd>` components:

- Single key: `<Kbd>Esc</Kbd>`, `<Kbd>Tab</Kbd>`, `<Kbd>Enter</Kbd>`
- Icon key: `<Kbd><CornerDownLeftIcon /></Kbd>` for Enter
- Delete key: `<Kbd><DeleteIcon /></Kbd>` for Backspace/Delete
- Multi-key chord: `<KbdGroup><Kbd>Ctrl</Kbd><Kbd>K</Kbd></KbdGroup>`
- On primary button: `<Kbd variant="inverted">...</Kbd>`
- On ghost/secondary button: `<Kbd>...</Kbd>` (default variant)

### Dialog & Modal Conventions

- Primary confirm button in DESTRUCTIVE dialogs: always use `variant="primary-destructive"` (solid red)
- Primary confirm button in non-destructive dialogs: use `variant="primary"`
- Never use `variant="danger"` (transparent red) as the primary confirm button in a dialog
- Always add `<Kbd>Esc</Kbd>` to Cancel/Close buttons in dialogs
- Always add `<Kbd variant="inverted"><CornerDownLeftIcon /></Kbd>` to primary confirm buttons
- The "Open by Default" story pattern is deprecated — it creates confusion with the real open state
