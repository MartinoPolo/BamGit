# Phase 2 — Storybook Stories: Block Components

**Status**: Not started
**Pre-requisite**: Phase 1 complete (CONVENTIONS.md written, pattern established)
**Estimated sub-agents**: 18 (one per component or tightly-related group)
**Run after**: Phase 1
**Run before**: Phase 3

---

## Context

Read `.mpx/testing-framework/CONVENTIONS.md` in full before starting.

This phase creates Storybook stories for block-level components — the complex composed components that form the actual UI: issue cards, workspace cards, session panels, layout shells, dependency graph, forest view, creation wizard, and GitHub auth flows.

Many of these components depend on context stores (`useIssues()`, `useSessions()`) or call `invoke()` for Tauri commands. Refer to CONVENTIONS.md §3 (Context Dependencies) for the correct approach for each tier.

**Key principle**: Prefer prop-driven isolation wherever possible. If a component accepts all data as props and only calls `invoke()` for mutations, it can be rendered standalone (Tauri calls are auto-mocked). If it calls context hooks to pull data, create a minimal wrapper.

---

## Project Context

- Mock data source: `src/lib/tauri_mock_data.ts` — use `MOCK_SESSIONS`, `MOCK_ISSUES`, `MOCK_DASHBOARDS`, etc.
- Context wrapper pattern: see `src/lib/components/blocks/command-palette/CommandPaletteStoryWrapper.svelte`
- Tauri commands: auto-intercepted by `src/lib/tauri_mock.ts` in Storybook (no setup needed)
- Session layout pattern: see existing `src/lib/components/blocks/session/SessionLayout.stories.svelte` as a reference for mock data factories and multi-variant stories
- **bits-ui docs**: use Context7 MCP for any component using bits-ui primitives

---

## Components to Cover

### Sub-agent 1 — `CodeBlock` (chat)

- **File**: `src/lib/components/blocks/chat/CodeBlock.svelte`
- **Dependencies**: None (pure display + clipboard API)
- **Variants**: Short snippet (JS), Long multi-line code (Rust), No language specified, Very long single line, Copy button interaction (show copied state)
- **Event propagation**: Copy button click must not bubble up. Verify `stopPropagation()` is present or add it.

### Sub-agent 2 — `SessionChatView` (session)

- **File**: `src/lib/components/blocks/session/SessionChatView.svelte`
- **Dependencies**: Calls `useSessions()` context + Tauri `listen()` events
- **Approach**: Read the component. Create a `SessionChatViewStoryWrapper.svelte` that calls `setSessionsContext(noopNotifications)` (note: `setSessionsContext` **requires** a `NotificationsApi` argument — pass `{ addPending: () => {}, clearPending: () => {} }`). Messages arrive via Tauri event listeners, not via direct prop/context injection, so stories should pass different `session` prop objects rather than trying to pre-populate messages directly.
- **Variants**: Running session (pass `session` prop with `state: 'running'`), Empty session (no messages yet), Needs-input state (`state: 'needs-input'`), Error state (`state: 'errored'`)
- **Event propagation**: Chat input Escape should clear the input field only, NOT dismiss any parent dialog.

### Sub-agent 3 — `SessionSidebar` (session)

- **File**: `src/lib/components/blocks/session/SessionSidebar.svelte`
- **Dependencies**: Likely props-driven (read the source first)
- **Variants**: With session data, Without session (idle), With cost displayed, Collapsed state

### Sub-agent 4 — `IssueCard` (issue)

- **File**: `src/lib/components/blocks/issue/IssueCard.svelte`
- **Dependencies**: `useIssues()` is a **hard dependency** (called unconditionally). You must create an `IssueCardStoryWrapper.svelte` that calls `setIssuesContext()` and loads mock issues. See CONVENTIONS.md §3 for the correct way to populate issues context (use `issuesCtx.loadIssues(dashboardId)` from `onMount`). The `toggle_issue_sound_mute` Tauri command is auto-mocked.
- **Variants**: Active issue (default), Selected/active state, Batch-selected state, High priority, Low priority, No priority, With worktree active, With GitHub PR linked, Archived issue, With notification dot, Loading/submitting state
- **⚠️ Event propagation**: IssueCard has action buttons (GitHub link, terminal, VS Code). Each must stop click propagation so the card's main `onclick` is not triggered by button clicks. Verify `stopPropagation()` on all nested interactive elements. Report any missing guards.

### Sub-agent 5 — `IssueCardList` (issue)

- **File**: `src/lib/components/blocks/issue/IssueCardList.svelte`
- **Dependencies**: Read source — probably accepts `issues` as a prop
- **Variants**: Full list (use `MOCK_ISSUES`), Empty list, Single issue, Mixed priorities, All archived

### Sub-agent 6 — `IssueDetail` (issue)

- **File**: `src/lib/components/blocks/issue/IssueDetail.svelte`
- **Dependencies**: Read source to understand data flow
- **Variants**: Full detail view, Minimal info (no PR, no worktree), With sub-issues, With dependency chain, Edit mode (if applicable)
- **Event propagation**: Any dialog/overlay opened from IssueDetail (rename, edit, delete confirmation) must contain Escape properly. Check each dialog child.

### Sub-agent 7 — `AssignedIssuesPanel` (issue)

- **File**: `src/lib/components/blocks/issue/AssignedIssuesPanel.svelte`
- **Dependencies**: Likely fetches via Tauri (auto-mocked) or receives props
- **Variants**: With assigned issues, Empty state, Loading, With action buttons

### Sub-agent 8 — `WorkspaceCard` (workspace)

- **File**: `src/lib/components/blocks/workspace/WorkspaceCard.svelte`
- **Dependencies**: Read source — mostly prop-driven with callbacks
- **Variants**: Active workspace (full data), Dormant (no active sessions), Busy (multiple sessions), Empty workspace (no issues), With AFK loop, With attention badge, With GitHub PR open, With merge conflicts, Dark accent color, Light accent color
- **⚠️ Event propagation**: WorkspaceCard has multiple icon buttons. Each must `stopPropagation()` to prevent triggering the card's main click. The source already has some `stopPropagation()` calls — verify ALL interactive children are covered.
- **Mock data**: `WorkspaceCard` takes `workspace: OverviewWorkspaceData`, **not** a `Dashboard` object. Use `MOCK_OVERVIEW_DATA[0]` as the base fixture (not `MOCK_DASHBOARDS[0]`). Field names are snake_case: `active_session_count`, `open_issue_count`, `hitl_count`, etc. Example: `{ ...MOCK_OVERVIEW_DATA[0], active_session_count: 3 }`.

### Sub-agent 9 — `SessionCard` (workspace)

- **File**: `src/lib/components/blocks/workspace/SessionCard.svelte`
- **Dependencies**: Read source — mostly prop-driven
- **Variants**: Running session, Needs-input session, Errored session, Finished session, With cost displayed, With issue linked, Without issue (orphan)
- **Event propagation**: Session card likely has action buttons. Verify same pattern as WorkspaceCard.

### Sub-agent 10 — `NoteCard` (workspace)

- **File**: `src/lib/components/blocks/workspace/NoteCard.svelte`
- **Dependencies**: Read source — inline editing behavior
- **Variants**: View mode, Edit mode, Empty note, Long note (overflow), Saving/submitting

### Sub-agent 11 — `DiscoveredSessionCard` (workspace)

- **File**: `src/lib/components/blocks/workspace/DiscoveredSessionCard.svelte`
- **Dependencies**: Read source
- **Variants**: Default discovered session, With cost info, With process ID

### Sub-agent 12 — `DashboardSidebar` (layout)

- **File**: `src/lib/components/blocks/layout/DashboardSidebar.svelte`
- **Dependencies**: Read source carefully before writing anything. `DashboardSidebar` does NOT use `useBoard()` or `useSelection()` — it reads the active route directly from SvelteKit's `$app/state` (`page.url.pathname`). Its only external context is `useKeyboardShortcuts()`. The ThemeDecorator is sufficient; no additional wrapper is needed for most stories.
- **Variants**: Expanded (default), Collapsed icon-only mode, Active route = '/', Active route = '/sessions', Active route = '/settings', With notification badge, Dark mode

### Sub-agent 13 — `TopBar` (layout)

- **File**: `src/lib/components/blocks/layout/TopBar.svelte`
- **Dependencies**: Read source — likely uses board/selection context
- **Variants**: Default state, With issue selected, With sync indicator running, With notifications

### Sub-agent 14 — `WorkspaceBottomPanel` (layout)

- **File**: `src/lib/components/blocks/layout/WorkspaceBottomPanel.svelte`
- **Dependencies**: Read source — likely takes active tab + content as props or slot
- **Variants**: Issues tab active, Kanban tab active, Dependencies tab active, Collapsed/hidden state, With tab badge

### Sub-agent 15 — `CreationWizard` (creation-wizard)

- **File**: `src/lib/components/blocks/creation-wizard/CreationWizard.svelte`
- **Dependencies**: This is the main issue creation dialog. It uses `wizard` state internally and accepts callbacks (`onCreate`, `onUpdate`, `onSetupWorktree`). Calls `invoke('search_github_issues')` etc. (all auto-mocked).
- **Variants**: Closed state, Open — Step 1 (GitHub Search), Open — Step 2 (Issue Name), Open — Step 3 (Color Selection), Open — Step 4 (Worktree Choice, if localFolder set), Submitting state
- **⚠️ Event propagation — CRITICAL**: `CreationWizard.svelte` uses `svelte:window onkeydown` to handle Escape and uses `onEscapeKeydown={(e) => e.preventDefault()}` on `Dialog.Content`. This pattern suppresses bits-ui's built-in Escape close and delegates to the window handler instead. The window handler calls both `preventDefault()` AND `stopPropagation()`. Verify: (1) Escape correctly closes the wizard, (2) Escape does NOT reach any other `svelte:window onkeydown` listener on the page, (3) Escape inside a text input navigates the wizard back rather than typing "Escape".
- **Story mock**: Provide mock `assignedIssues` array from `MOCK_ISSUES`

### Sub-agent 16 — `DependencyGraphView` (dependency-graph)

- **File**: `src/lib/components/blocks/dependency-graph/DependencyGraphView.svelte`
- **Also cover**: `DependencyGraphCanvas.svelte`
- **Dependencies**: `DependencyGraphView` is **fully prop-driven** — it accepts `issues: readonly Issue[]` and `dependencies: readonly IssueDependency[]` as props, not from context. However it calls `useSelection()` from `$lib/modules/board` internally, so a wrapper that calls `setBoardContext()` and `setSelectionContext()` (or equivalent) is needed. Read the source to identify the exact context setup required. There is no `useDependencyGraph()` function.
- **Variants**: With issues and dependencies (use `MOCK_ISSUES`), Empty graph, Filtered view (only AFK issues), Graph with a long chain

### Sub-agent 17 — `ForestView` (forest)

- **File**: `src/lib/components/blocks/forest/ForestView.svelte`
- **Note**: ForestView uses the `low-poly-2d-trees` canvas library for 2D tree rendering. It likely accepts issues/dashboards as data props.
- **Dependencies**: Read source carefully. Use `MOCK_ISSUES` and `MOCK_DASHBOARDS` as fixtures.
- **Variants**: With full issue tree, Empty forest, Single issue, Many issues (performance view)
- **Canvas note**: The canvas element should render visibly in Storybook. If it requires a minimum size, wrap in a `div` with explicit dimensions.

### Sub-agent 18 — `GhSetupBanner` + `GitHubAuthWizard` (github)

- **Files**: `src/lib/components/blocks/github/GhSetupBanner.svelte` and `src/lib/components/blocks/github-auth/GitHubAuthWizard.svelte`
- **Dependencies**: Auth wizard calls `invoke('github_device_flow_start')`. **Important**: this command is in `TAURI_ONLY_COMMANDS` — in browser/Storybook mode it fires a "GitHub authentication requires the desktop app" warning toast and is a no-op. Stories for `GitHubAuthWizard` can only show static initial states; the live device-flow polling will not work in Storybook.
- **Variants for GhSetupBanner**: Default (GitHub not configured), With repo configured but no auth
- **Variants for GitHubAuthWizard**: Initial state (show the UI with device code), Error state (simulate error via props if supported)
- **⚠️ Event propagation**: GitHubAuthWizard is a dialog. Check `onEscapeKeydown` on its `Dialog.Content`.

---

## Instructions for Each Sub-Agent

```
You are implementing a Storybook story for a specific block component in the Grovekeeper project.

1. Read ALL source files for this component completely before writing anything.
2. Determine context tier (see CONVENTIONS.md §3): Does it need a wrapper?
3. If it calls context hooks, read the context module to understand what data it needs.
4. Import mock data from 'src/lib/tauri_mock_data.ts' — do NOT hardcode fixture data.
5. If a wrapper is needed, create `MyComponentStoryWrapper.svelte` alongside the story.
6. Create the story file following the exact format in CONVENTIONS.md §2.
7. Cover all variants listed for this component.
8. Check event propagation for any interactive element inside the component (CONVENTIONS.md §1).
   - For every nested button/link: verify stopPropagation() exists.
   - For every dialog/popover child: verify onEscapeKeydown guard exists.
   - If violations found: fix the source file AND document in Findings Report.
9. Use Context7 MCP for bits-ui API reference if needed:
   - mcp_context7_resolve-library-id({ libraryName: "bits-ui" })
   - mcp_context7_get-library-docs({ id: "<result>", topic: "<relevant feature>" })
10. Return a Findings Report (format in CONVENTIONS.md §4).
```

---

## Completion Criteria

- All 18 story files (or story+wrapper pairs) exist and render without errors
- `pnpm test -- --project=storybook` passes
- `pnpm check:all` passes with no new errors
- Consolidated Findings Report listing all event propagation violations found and whether they were fixed or deferred

---

## Example: Context Wrapper Pattern (reference)

If `IssueCard` needs `useIssues()` context, create `IssueCardStoryWrapper.svelte`:

```svelte
<!-- src/lib/components/blocks/issue/IssueCardStoryWrapper.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { setIssuesContext } from '$lib/modules/issues/index.js';
	import { MOCK_DASHBOARDS } from '$lib/tauri_mock_data.js';
	import type { Snippet } from 'svelte';

	const { children }: { children: Snippet } = $props();

	const issuesCtx = setIssuesContext();
	// Load mock issues via the auto-mocked Tauri handler
	// Do NOT assign to issuesCtx.issues directly — it is a read-only getter.
	onMount(() => issuesCtx.loadIssues(MOCK_DASHBOARDS[0].id));
</script>

{@render children()}
```

Then in the story:

```svelte
<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import IssueCardStoryWrapper from './IssueCardStoryWrapper.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Issue/IssueCard',
		component: IssueCardStoryWrapper,
		// @ts-expect-error
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import IssueCard from './IssueCard.svelte';
	import { MOCK_ISSUES } from '$lib/tauri_mock_data.js';
</script>

<Story name="Active Issue">
	{#snippet template()}
		<IssueCardStoryWrapper>
			<IssueCard issue={MOCK_ISSUES[0]} isActive={false} />
		</IssueCardStoryWrapper>
	{/snippet}
</Story>
```
