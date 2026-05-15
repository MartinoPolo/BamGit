# Phase 3 — Storybook `play()` Interaction Tests + Accessibility CI

**Status**: Complete
**Pre-requisite**: Phase 1 and Phase 2 complete (all stories exist)
**Estimated sub-agents**: 24 component groups + 1 a11y enablement task
**Run after**: Phase 2
**Run before**: Phase 4

---

## Context

Read `.mpx/testing-framework/CONVENTIONS.md` in full before starting, especially §1 (Event Propagation Rules).

This phase adds `play()` interaction tests to Storybook stories using `@storybook/addon-vitest`. The infrastructure is **already installed** but unused. `play()` functions run as real Vitest tests inside Chromium via the `storybook` project in `vite.config.ts`. Every `play()` function added automatically becomes part of `pnpm test`.

Also enable accessibility (a11y) CI enforcement (currently configured as `test: 'todo'` — violations show but don't fail).

### What `play()` tests can do

```ts
play: async ({ canvasElement, step }) => {
	const canvas = within(canvasElement);

	// Click interactions
	await userEvent.click(canvas.getByRole('button', { name: 'Open' }));

	// Keyboard events
	await userEvent.keyboard('{Escape}');
	await userEvent.keyboard('{ArrowDown}');
	await userEvent.type(canvas.getByRole('textbox'), 'hello');

	// Assertions
	await expect(canvas.getByRole('dialog')).toBeVisible();
	await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();

	// Named steps (shown in Storybook's Interactions panel)
	await step('Open dropdown', async () => {
		await userEvent.click(canvas.getByRole('button'));
	});
	await step('Select first item', async () => {
		await userEvent.keyboard('{ArrowDown}{Enter}');
		await expect(canvas.getByRole('button')).toHaveTextContent('Item 1');
	});
};
```

Import from: `import { expect, userEvent, within, fn } from 'storybook/test';`

> **Note**: The package is `storybook/test` (subpath export), **not** `@storybook/test` (that package does not exist in Storybook 10). Use `fn()` from `storybook/test` instead of `vi.fn()` for spy functions in play() — `vi` is not reliably available as a global in the storybook vitest project.

---

## Notes

> **SearchField note**: SearchField is a styled `<input>` wrapper with no built-in overlay or dropdown behavior. Keyboard interactivity (Escape to close results, arrow key navigation through results) lives in the **parent components** that compose SearchField with a results list — primarily CommandPalette (sub-agent 16) and CreationWizard's GitHub search step (sub-agent 15). Those components' play() tests cover SearchField's keyboard behavior in context.

---

## Task 0 — Enable Accessibility CI (1 task, not a sub-agent)

**Do this first, before spawning any sub-agents.**

**File**: `.storybook/preview.ts` (project root — **not** `src/lib/storybook/preview.ts`)

Search for `test: 'todo'` inside `.storybook/preview.ts`:

Change the accessibility test mode from `'todo'` (violations shown but not blocking) to `'error'` (violations fail the test run):

```ts
// Before
accessibility: {
    test: 'todo',
}

// After
accessibility: {
    test: 'error',
}
```

After making this change:

1. Run `pnpm test -- --project=storybook`
2. If accessibility violations are reported, fix them (they were likely pre-existing)
3. Common a11y fixes:
    - Missing `aria-label` on icon-only buttons → add `aria-label="Description"`
    - Missing `id`/`for` label associations → use `htmlFor` or `aria-labelledby`
    - Color contrast issues → these may require design decisions; if unfixable automatically, add `// eslint-disable-next-line` with a comment explaining why and defer to a design review
4. Document all a11y violations found and their resolution in the Findings Report

---

## Components for `play()` Tests (24 sub-agents)

Spawn one sub-agent per component/group. Each sub-agent adds `play()` functions to the **existing story** for that component (created in Phase 1 or Phase 2, or already existing before Phase 1).

### Sub-agent 1 — `Button`

- **Story**: `src/lib/components/shadcn/button/Button.stories.svelte`
- **Play tests to add**:
    - Primary story: click button → `onclick` callback is called once
    - Disabled story: click disabled button → callback is NOT called
    - Loading story (if variant exists): button in loading state ignores clicks
- **Import**: `import { expect, userEvent, within, fn } from 'storybook/test';`
- **Note**: Use `fn()` from `storybook/test` for spy functions (NOT `vi.fn()`). Add `onclick: fn()` in `args` and verify call count.

### Sub-agent 2 — `Checkbox`

- **Story**: `src/lib/components/shadcn/checkbox/Checkbox.stories.svelte`
- **Play tests**:
    - Click unchecked → becomes checked, callback called with `true`
    - Click checked → becomes unchecked, callback called with `false`
    - Click disabled checkbox → state does NOT change, callback NOT called
    - Space key on focused checkbox → toggles state (keyboard accessibility)

### Sub-agent 3 — `Switch`

- **Story**: `src/lib/components/shadcn/switch/Switch.stories.svelte`
- **Play tests**:
    - Click off switch → turns on
    - Click on switch → turns off
    - Disabled switch ignores clicks
    - Space key toggles

### Sub-agent 4 — `Tabs`

- **Story**: `src/lib/components/shadcn/tabs/Tabs.stories.svelte`
- **Component note**: Tabs is a **custom component** (`<div role="tablist">` + `<button role="tab">` with `aria-selected`), NOT bits-ui Tabs. Arrow key navigation is NOT built in — it must be implemented if desired.
- **Play tests**:
    - Click Tab 2 → Tab 2 panel becomes visible, Tab 1 panel hidden
    - Click Tab 3 → Tab 3 active
    - Click disabled tab (if "With Disabled Tab" variant exists) → no state change
    - Verify `aria-selected` is `true` on active tab and `false` on others
    - **Keyboard accessibility**: Since Tabs is custom (no bits-ui), verify that Enter/Space on a focused tab activates it. Arrow key navigation between tabs is NOT expected unless explicitly implemented.

### Sub-agent 5 — `Dialog`

- **Story**: `src/lib/components/shadcn/dialog/Dialog.stories.svelte`
- **Play tests**:
    - Click trigger → dialog opens (role="dialog" visible)
    - Click close button → dialog closes
    - Press Escape → dialog closes
    - Click outside overlay (if dismissible) → dialog closes
    - **⚠️ Event propagation test — Escape containment**:
      Open dialog. Inside dialog, simulate pressing Escape. Assert: (1) dialog closes, (2) NO page-level `keydown` handler was called after dialog closed. To test this, add a `onkeydown` spy on `document` before the test and assert it was not called after the dialog's own Escape handler fired.
    - Tab key cycles within dialog (focus trap): Tab through all focusable elements, verify focus does not leave dialog

### Sub-agent 6 — `DropdownMenu`

- **Story**: `src/lib/components/shadcn/dropdown-menu/DropdownMenu.stories.svelte`
- **Play tests**:
    - Click trigger → menu opens (role="menu" visible)
    - ArrowDown → first item focused
    - ArrowDown again → second item focused
    - Enter on focused item → item's action called, menu closes
    - Escape → menu closes
    - **⚠️ Event propagation test — Escape containment**:
      Create a "Dropdown in Dialog" story variant that wraps DropdownMenu inside a Dialog:
        1. Open dialog → open dropdown inside it
        2. Press Escape → **expect: dropdown closes, dialog REMAINS OPEN**
        3. Press Escape again → dialog closes

        **This test is expected to pass by default.** bits-ui v2's escape-layer system guarantees only the topmost layer (DropdownMenu) handles the first Escape. If the test fails, investigate whether any `svelte:window` keydown handler (outside bits-ui's layer system) is responding to Escape — that would be the real source of bleed-through, not the DropdownMenu itself.

### Sub-agent 7 — `Select`

- **Story**: `src/lib/components/shadcn/select/Select.stories.svelte`
- **Play tests**:
    - Click trigger → options list visible
    - Click an option → option selected, list closes, trigger shows selected value
    - Escape → list closes, selection unchanged
    - **⚠️ Event propagation test**: Escape closes Select listbox without affecting parent layer
- **⚠️ Note (Phase 1 upgrade)**: The Select component now has both a native `<Select>` wrapper (preserved for existing app usage) and new custom `SelectCustom*` components built on bits-ui. Phase 3 play tests for Select should test the `CustomSelectRoot` story variants, **not** the native select stories — the native `<select>` element does not support programmatic open/close via `userEvent` in the same way.

### Sub-agent 8 — `Popover`

- **Story**: `src/lib/components/shadcn/popover/Popover.stories.svelte`
- **Play tests**:
    - Click trigger → popover content visible
    - Click outside → popover closes
    - Escape → popover closes
    - **⚠️ Event propagation test**: Same nested-in-dialog test as DropdownMenu

### Sub-agent 9 — `Accordion`

- **Story**: `src/lib/components/shadcn/accordion/Accordion.stories.svelte` (created in Phase 1)
- **Play tests**:
    - Click trigger → content expands
    - Click trigger again → content collapses (single type)
    - In multiple type: both items can be expanded simultaneously
    - Disabled item: click does nothing
    - Space/Enter on focused trigger → toggles expansion (keyboard)

### Sub-agent 10 — `Sheet`

- **Story**: `src/lib/components/shadcn/sheet/Sheet.stories.svelte` (created in Phase 1)
- **Play tests**:
    - Click trigger → sheet slides in
    - Click close button → sheet slides out
    - Escape → sheet closes
    - **⚠️ Event propagation test**: Same nested Escape containment test as Dialog

### Sub-agent 11 — `ColorPicker`

- **Story**: `src/lib/components/derived/color-picker/ColorPicker.stories.svelte`
- **Note**: Unit tests already exist at `color_picker.svelte.test.ts`. Migrate the key interaction tests to `play()` functions in the story so they are visible in Storybook's Interactions panel. Do NOT delete the `.test.ts` file — the play() tests complement rather than replace unit tests.
- **Play tests** (matching existing unit tests):
    - Click trigger → popover opens
    - Click a color swatch → `onSelect` called, popover closes
    - Type hex value in input → updates trigger preview color
    - Escape inside color popover → only popover closes (not parent if embedded)

### Sub-agent 12 — `RepoCombobox`

- **Story**: `src/lib/components/derived/repo-combobox/RepoCombobox.stories.svelte` (created in Phase 1)
- **Play tests**:
    - Click trigger → dropdown opens, repos list visible
    - Type "grove" → list filters to matching repos
    - ArrowDown → first item highlighted
    - Enter → selects highlighted repo, closes dropdown, trigger shows selected name
    - Escape → closes dropdown, no selection
    - **⚠️ Event propagation test**: Escape closes combobox only; if embedded in dialog, dialog stays open

### Sub-agent 13 — `IssueCard`

- **Story**: `src/lib/components/blocks/issue/IssueCard.stories.svelte` (created in Phase 2)
- **Play tests**:
    - Render active card → card element visible with correct title
    - Hover card → action buttons appear (if hover-revealed)
    - **⚠️ Left-click containment** — click priority badge → `onPriorityClick` callback called, main card `onclick` NOT called
    - **⚠️ Left-click containment** — click GitHub link → GitHub callback called, card onclick NOT called
    - **⚠️ Left-click containment** — click each quick-action button (folder, terminal, editor) → its callback called, card onclick NOT called
    - **⚠️ Right-click containment for quick-action buttons** — right-click one of the quick-action buttons → the button's `handleQuickActionContextMenu` fires (assign folder action), the card's context menu (`role="menu"`) does NOT appear. This should already work because `handleQuickActionContextMenu` calls `stopPropagation()` — verify it passes.
    - **Note on other right-clicks**: Right-clicking the priority chip or GitHub link WILL open the card's context menu — this is intentional UX (bits-ui `ContextMenu.Trigger` listens to the `contextmenu` event, and those elements do not suppress it). Do NOT add tests asserting the context menu is suppressed for those elements.
    - Click batch checkbox → `onBatchSelect` called, card onclick NOT called
    - Render selected state → card has selected CSS class
- **Story variant needed**: Create a \"WithContextMenu\" story variant that wraps the card in `IssueCardContextMenu` (the actual production wrapper) — required for context-menu-related tests to be meaningful.

### Sub-agent 14 — `WorkspaceCard`

- **Story**: `src/lib/components/blocks/workspace/WorkspaceCard.stories.svelte` (created in Phase 2)
- **Play tests**:
    - Render card → title, issue count, session count visible
    - Click GitHub button → GitHub callback called, main card onclick NOT triggered
    - Click issues badge → issues callback called, main card onclick NOT triggered
    - Click sessions section → sessions callback called, main card onclick NOT triggered
    - **⚠️ Verify all nested buttons stop propagation**. The source already has some. If any are missing, fix + document.

### Sub-agent 15 — `CreationWizard`

- **Story**: `src/lib/components/blocks/creation-wizard/CreationWizard.stories.svelte` (created in Phase 2)
- **Play tests**:
    - Trigger opens wizard → Step 1 (GitHub Search) visible
    - Type in search → list updates (mock debounce)
    - Press Enter → advances to Step 2 (Issue Name)
    - Press Backspace → goes back to Step 1
    - **⚠️ Escape containment — CRITICAL**:
        1. Open wizard (Step 2 name entry)
        2. Press Escape
        3. Assert: wizard closes
        4. Assert: NO other page-level handler fired (add document keydown spy)
           The wizard uses `svelte:window onkeydown` with explicit `stopPropagation()`. Verify this actually works. If any other global listener fires after wizard Escape, it's a bug.
    - Text input focused → ArrowDown/ArrowUp do NOT navigate wizard steps (are consumed by text input)

### Sub-agent 16 — `CommandPalette`

- **Story**: `src/lib/components/blocks/command-palette/CommandPalette.stories.svelte`
- **Play tests**:
    - Palette is open → search input focused
    - Type "settings" → results filtered to settings-related commands
    - ArrowDown → second result highlighted
    - Enter → command executed (mock action called), palette closes
    - Escape → palette closes
    - **⚠️ Event propagation**: Escape in palette must NOT trigger any page-level shortcut handler after palette closes. Test: add document keydown spy, open palette, press Escape, assert spy not called after palette is closed.

### Sub-agent 17 — Notifications & Account Popovers

- Both story files exist separately and should receive separate play() tests:
    - `src/lib/components/shadcn/popover/NotificationsPopover.stories.svelte` (bell icon + notification list)
    - `src/lib/components/shadcn/popover/AccountDropdown.stories.svelte` (user avatar + profile dropdown)
- **Play tests for each**:
    - Click trigger → popover/dropdown opens
    - Click an item → action executed, popover closes
    - Escape → popover closes
    - **⚠️ Event propagation**: Escape containment test (these are Popover-based overlays)

### Sub-agent 18 — `DependencyGraphView`

- **Story**: `src/lib/components/blocks/dependency-graph/DependencyGraphView.stories.svelte` (created in Phase 2)
- **Rendering**: Uses **SVG + foreignObject** for DOM nodes (NOT canvas). Nodes are rendered as Svelte components inside `<foreignObject>` elements within an SVG. Edges are SVG `<path>` elements with arrow markers.
- **Play tests**:
    - Graph renders with nodes visible — query for foreignObject content or node text
    - View mode switcher: click "PRDs" or "Single PRD" → graph re-renders with filtered nodes
    - Filter bar: toggle filter checkboxes → nodes appear/disappear
    - Click on a node → `handleNodeSelect` fires with correct issue ID
    - Empty state: when no issues exist, empty state icon/message is shown
    - **Note**: Use `canvas.getByText()` or `canvas.getByRole()` to find node content rendered inside foreignObject elements. Standard DOM queries work because foreignObject renders real HTML.

### Sub-agent 19 — `ContextMenu`

- **Story**: `src/lib/components/shadcn/context-menu/ContextMenu.stories.svelte`
- **Component note**: Base overlay component built on bits-ui `ContextMenuPrimitive`. Used as wrapper around IssueCard, WorkspaceCard, and other cards throughout the app. Triggered by right-click (`contextmenu` event).
- **Play tests**:
    - Right-click trigger area → context menu appears (`role="menu"` visible)
    - Click menu item → item action fires, menu closes
    - ArrowDown → first item focused, ArrowDown again → second item focused
    - Enter on focused item → item action fires, menu closes
    - Escape → menu closes
    - **⚠️ Event propagation test — Escape containment**:
      Create a "ContextMenu in Dialog" story variant: open dialog → right-click inside to open context menu → press Escape → context menu closes, dialog REMAINS open. This validates bits-ui's escape-layer system for context menus.
    - Disabled items: verify disabled items cannot be clicked or focused via keyboard

### Sub-agent 20 — `RadioGroup`

- **Story**: `src/lib/components/shadcn/radio-group/RadioGroup.stories.svelte`
- **Component note**: Built on bits-ui `RadioGroupPrimitive`. Form control with keyboard accessibility.
- **Play tests**:
    - Click a radio option → that option becomes selected, callback fires
    - Click a different option → selection moves, previous deselected
    - ArrowDown on focused radio → next option focused and selected
    - ArrowUp on focused radio → previous option focused and selected
    - Space on focused radio → selects it (if not already selected)
    - Disabled radio cannot be selected via click or keyboard
    - Verify `aria-checked` attributes update correctly

### Sub-agent 21 — `Calendar` & `RangeCalendar`

- **Stories**:
    - `src/lib/components/shadcn/calendar/Calendar.stories.svelte`
    - `src/lib/components/shadcn/range-calendar/RangeCalendar.stories.svelte`
- **Component note**: Built on bits-ui calendar primitives. Interactive date picker with navigation and constraints.
- **Play tests (Calendar)**:
    - Click a date → date selected, `onValueChange` callback fires
    - Click next month button → month advances, dates update
    - Click previous month button → month goes back
    - Disabled dates: cannot be clicked or selected
    - Min/max constraints: dates outside range are disabled
    - Verify `aria-selected` on selected date cell
- **Play tests (RangeCalendar)**:
    - Click start date → start selected
    - Click end date → range completed, callback fires with both dates
    - Range highlight visible between start and end dates
    - Click outside range after start selected → range resets or adjusts

### Sub-agent 22 — `FloatingInputPanel`

- **Story**: `src/lib/components/blocks/session/FloatingInputPanel.stories.svelte`
- **Component note**: Complex session input panel with textarea, optional image carousel, skill chips, and send/stop button. Keyboard shortcuts: Shift+Enter for newline vs Enter for submit (behavior varies by mode).
- **Play tests**:
    - Type in textarea → text appears, send button enables (if it was disabled when empty)
    - Click send button → `onSend` callback fires with textarea content
    - Click stop button (during generation) → `onStop` callback fires
    - Skill chip click → command prepended to textarea input
    - Image carousel toggle → carousel section appears/disappears
    - Verify textarea auto-focus behavior
    - Disabled state: textarea and send button are disabled when `disabled` prop is true

### Sub-agent 23 — `DateRangePicker`

- **Story**: `src/lib/components/blocks/usage/DateRangePicker.stories.svelte`
- **Component note**: Composition of Popover + RangeCalendar. Trigger button shows selected range; clicking opens popover with calendar.
- **Play tests**:
    - Click trigger → popover opens with RangeCalendar visible
    - Select date range in calendar → trigger text updates with selected range
    - Escape → popover closes, selection preserved
    - Click outside → popover closes
    - **⚠️ Event propagation test**: Escape closes DateRangePicker popover without affecting parent layer

### Sub-agent 24 — `SessionCard`

- **Story**: `src/lib/components/blocks/workspace/SessionCard.stories.svelte`
- **Component note**: Card with nested terminate button that uses `stopPropagation()` (confirmed at line 129). Same propagation pattern as IssueCard/WorkspaceCard.
- **Play tests**:
    - Click card → `onClick` callback fires
    - Click terminate button → `onTerminate` fires, card `onClick` NOT fired (propagation stopped)
    - Verify different visual states: running, needs-input, errored
    - Token count and session info display correctly
    - Terminate button only visible when session is active

---

## Instructions for Each Sub-Agent

```
You are adding play() interaction tests to an existing Storybook story in Grovekeeper.

1. Read the existing story file completely.
2. Read the component source file completely.
3. Identify which stories are best suited for interaction tests (default/primary story usually best).
4. Import test utilities: import { expect, userEvent, within, fn } from 'storybook/test';
5. Add play() functions following the patterns in CONVENTIONS.md §1.
6. For EVERY floating overlay (dropdown, popover, dialog, select): add an Escape containment test.
7. For EVERY nested interactive element inside a card/container: add a click propagation test.
8. If a test FAILS because the component has a bug:
   a. Confirm the failure is a real bug (not a test setup problem)
   b. Fix the component source (add stopPropagation, fix event handler, etc.)
   c. Verify the test now passes
   d. Document in Findings Report
9. Use Context7 MCP for bits-ui docs if needed.
10. Return a Findings Report (format in CONVENTIONS.md §4).

Key imports for play() functions:
  import { expect, userEvent, within, fn } from 'storybook/test';
  // NOTE: use `fn()` from 'storybook/test' for spy functions — NOT vi.fn()
  // NOTE: the package is 'storybook/test', NOT '@storybook/test'

Adding spies to story args:
  args: { onclick: fn(), onSelect: fn() }
  argTypes: { onclick: { action: 'clicked' } }

Escape containment test pattern:
  play: async ({ canvasElement }) => {
      import { fn } from 'storybook/test';

      // Add spy on document keydown
      const documentSpy = fn();
      document.addEventListener('keydown', documentSpy, { capture: true });

      // Open overlay
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('button', { name: 'Open' }));
      await expect(canvas.getByRole('listbox')).toBeVisible();

      // Press Escape
      await userEvent.keyboard('{Escape}');

      // Overlay should be gone
      await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();

      // Clean up spy (no redeclaration)
      document.removeEventListener('keydown', documentSpy, { capture: true });
  }
```

---

## Completion Criteria

- `play()` functions added to all 24 component stories
- a11y CI enabled (test: 'error') and all violations fixed or explicitly deferred with justification
- All `play()` tests pass in `pnpm test -- --project=storybook`
- `pnpm check:all` passes
- Consolidated Findings Report listing:
    - All event propagation violations found and fixed
    - All a11y violations found and their resolution
    - Any deferred items with justification
