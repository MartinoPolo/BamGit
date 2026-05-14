# Phase 2 — Storybook Stories: Block Components

**Status**: Ready to execute
**Pre-requisite**: Phase 1 complete ✅
**Estimated sub-agents**: 20 (18 components + 2 story splits)
**Run after**: Phase 1
**Run before**: Phase 3

---

## Context

Read `.mpx/testing-framework/CONVENTIONS.md` in full before starting.

This phase creates dedicated Storybook stories for block-level components — the composed UI that forms the actual app. It also splits existing combined stories into per-component files.

**Key principles:**

- Every component gets its own `.stories.svelte` file (one component = one Storybook page).
- Composition demos (showing how components work together) are separate stories.
- Prefer prop-driven isolation. Components that accept data as props and only call `invoke()` for mutations work standalone (Tauri calls are auto-mocked).
- Components calling context hooks (`useIssues()`, `useSelection()`, etc.) need a co-located `*StoryWrapper.svelte`.

---

## Pre-Flight: Split Existing Combined Stories

Before spawning component sub-agents, the orchestrator (or sub-agents 1–2) must split these combined story files:

### Split 1 — ChatComponents → CodeBlock

**Current**: `src/lib/components/blocks/chat/ChatComponents.stories.svelte` bundles CodeBlock + StreamingCaret + InlineImage.

**Action**:

- Create `src/lib/components/blocks/chat/CodeBlock.stories.svelte` — dedicated CodeBlock stories.
- Keep `ChatComponents.stories.svelte` as a composition demo (`Blocks/Chat/ChatComponents`) showing StreamingCaret and InlineImage together.

### Split 2 — SessionLayout → SessionSidebar + SessionChatView

**Current**: `src/lib/components/blocks/session/SessionLayout.stories.svelte` bundles SessionTopBar, SessionSidebar, and full layout.

**Action**:

- Create `src/lib/components/blocks/session/SessionSidebar.stories.svelte` — dedicated sidebar stories (move the 3 sidebar variants from SessionLayout).
- Create `src/lib/components/blocks/session/SessionChatView.stories.svelte` — dedicated chat view stories.
- Keep `SessionLayout.stories.svelte` as a composition demo (`Blocks/Session/Layout`) showing the full assembled layout.

---

## Execution Waves

All sub-agents within a wave can run in parallel.

### Wave 1 — Tier 1: No Context, No Wrappers (8 sub-agents)

These components accept all data as props. No context hooks. Simplest to story.

| #   | Component             | Storybook Title                          |
| --- | --------------------- | ---------------------------------------- |
| 1   | CodeBlock             | `Blocks/Chat/CodeBlock`                  |
| 2   | SessionSidebar        | `Blocks/Session/SessionSidebar`          |
| 3   | IssueDetail           | `Blocks/Issue/IssueDetail`               |
| 4   | AssignedIssuesPanel   | `Blocks/Issue/AssignedIssuesPanel`       |
| 5   | TopBar                | `Blocks/Layout/TopBar`                   |
| 6   | DiscoveredSessionCard | `Blocks/Workspace/DiscoveredSessionCard` |
| 7   | GhSetupBanner         | `Blocks/GitHub/GhSetupBanner`            |
| 8   | WorkspaceCard         | `Blocks/Workspace/WorkspaceCard`         |

### Wave 2 — Tier 2: Single Context Wrapper (7 sub-agents)

Each needs one context hook. Create a co-located `*StoryWrapper.svelte` that provides the missing context.

| #   | Component            | Context needed           | Storybook Title                              |
| --- | -------------------- | ------------------------ | -------------------------------------------- |
| 9   | IssueCardList        | `useSelection()`         | `Blocks/Issue/IssueCardList`                 |
| 10  | SessionCard          | `useNotifications()`     | `Blocks/Workspace/SessionCard`               |
| 11  | NoteCard             | `useRawRequirements()`   | `Blocks/Workspace/NoteCard`                  |
| 12  | DependencyGraphView  | `useSelection()`         | `Blocks/DependencyGraph/DependencyGraphView` |
| 13  | WorkspaceBottomPanel | `useSelection()`         | `Blocks/Layout/WorkspaceBottomPanel`         |
| 14  | ForestView           | `useSelection()`         | `Blocks/Forest/ForestView`                   |
| 15  | DashboardSidebar     | `useKeyboardShortcuts()` | `Blocks/Layout/DashboardSidebar`             |

### Wave 3 — Tier 3/4: Complex Wrappers or Tauri-Only (5 sub-agents)

These need multi-store wrappers, Tauri event listeners, or have Tauri-only commands.

| #   | Component        | Context needed                 | Storybook Title                        |
| --- | ---------------- | ------------------------------ | -------------------------------------- |
| 16  | IssueCard        | `useIssues()` (hard dep)       | `Blocks/Issue/IssueCard`               |
| 17  | SessionChatView  | `useSessions()` + Tauri events | `Blocks/Session/SessionChatView`       |
| 18  | CreationWizard   | `useCreationWizard()`          | `Blocks/CreationWizard/CreationWizard` |
| 19  | GitHubAuthWizard | Tauri-only commands            | `Blocks/GitHub/GitHubAuthWizard`       |
| 20  | _(orchestrator)_ | Split + composition stories    | —                                      |

---

## Project Context

- Mock data: `src/lib/tauri_mock_data.ts` — exports `MOCK_SESSIONS`, `MOCK_ISSUES`, `MOCK_DASHBOARDS`, `MOCK_OVERVIEW_DATA`, `MOCK_ISSUE_DEPENDENCIES`, `MOCK_ASSIGNED_ISSUES_RESULT`, etc.
- Wrapper reference: `src/lib/components/blocks/command-palette/CommandPaletteStoryWrapper.svelte`
- Tauri commands: auto-intercepted by `src/lib/tauri_mock.ts` in Storybook
- bits-ui docs: use Context7 MCP for any component using bits-ui primitives
- Session layout reference: existing `SessionLayout.stories.svelte` has good `makeMockSession()` factory pattern

---

## Sub-Agent Specs

### Sub-agent 1 — `CodeBlock` (chat) — Tier 1

- **File**: `src/lib/components/blocks/chat/CodeBlock.svelte`
- **Props**: `code: string`, `language?: string`
- **Context**: None
- **Invoke**: None
- **Create**: `CodeBlock.stories.svelte`
- **Also**: Update `ChatComponents.stories.svelte` to remove CodeBlock story (keep StreamingCaret + InlineImage as composition demo)
- **Variants**: Short snippet (JS), Long multi-line (Rust), No language specified, Very long single line, Copy button interaction (show copied state)
- **Event propagation**: Copy button click must not bubble. Verify `stopPropagation()`.

### Sub-agent 2 — `SessionSidebar` (session) — Tier 1

- **File**: `src/lib/components/blocks/session/SessionSidebar.svelte`
- **Props**: `session: Session`, `contextPercent?: number`, `quota5hPercent?: number`, `quota7dPercent?: number`, `subAgentCount?: number`, `subAgentTree?: Snippet`
- **Context**: None
- **Invoke**: None
- **Create**: `SessionSidebar.stories.svelte`
- **Also**: Remove sidebar stories from `SessionLayout.stories.svelte` (keep only the "Full Layout" composition story)
- **Variants**: With session data (running), Idle session, With quota warning (quota5hPercent > 80), Errored session, With sub-agents, Collapsed state (if applicable)
- **Mock data**: Use `makeMockSession()` factory from existing SessionLayout stories

### Sub-agent 3 — `IssueDetail` (issue) — Tier 1

- **File**: `src/lib/components/blocks/issue/IssueDetail.svelte`
- **Props**: `issue: Issue`, `cache?: GitStatusCache | null`, `ghAvailable?: boolean`, `paletteColors?: string[]`, `usedColors?: string[]` + `IssueCardCallbacks` interface
- **Context**: None
- **Invoke**: None
- **Variants**: Full detail view (all fields populated), Minimal info (no PR, no worktree), With sub-issues, With GitHub PR linked, With worktree active, Edit mode (if applicable)
- **Mock data**: Use `MOCK_ISSUES[0]` as base, spread overrides for variants
- **Event propagation**: Any dialog/overlay opened from IssueDetail must contain Escape properly.

### Sub-agent 4 — `AssignedIssuesPanel` (issue) — Tier 1

- **File**: `src/lib/components/blocks/issue/AssignedIssuesPanel.svelte`
- **Props**: `issues: AssignedIssue[]`, `dashboardIssues: readonly Issue[]`, `hasMore: boolean`, `loading?: boolean`, `lastSynced?: Date | null`, `disabled?: boolean` + callbacks (`onWizardOpen?`, `onQuickAddWithWorktree?`, `onLoadMore?`, `onRefresh?`)
- **Context**: None
- **Invoke**: None
- **Variants**: With assigned issues, Empty state (no issues), Loading state, With "has more" (load more button visible), Disabled state, Recently synced vs stale sync
- **Mock data**: Use `MOCK_ASSIGNED_ISSUES_RESULT` and `MOCK_ISSUES`

### Sub-agent 5 — `TopBar` (layout) — Tier 1

- **File**: `src/lib/components/blocks/layout/TopBar.svelte`
- **Props**: `title: string`, `subtitle?: string`, `hasNotifications?: boolean`, `syncing?: boolean`, `forestCollapsed?: boolean` + callbacks (`onSync?`, `onQuickIdeas?`, `onCreateIssue?`, `onToggleForest?`) + `children?: Snippet`
- **Context**: None
- **Invoke**: None
- **Variants**: Default (title only), With subtitle, With notifications badge, Syncing state, Forest collapsed, With all actions visible
- **Event propagation**: Action buttons must not interfere with each other.

### Sub-agent 6 — `DiscoveredSessionCard` (workspace) — Tier 1

- **File**: `src/lib/components/blocks/workspace/DiscoveredSessionCard.svelte`
- **Props**: `session: DiscoveredSession`, `onAdopt: (session: DiscoveredSession) => void`
- **Context**: None
- **Invoke**: None
- **Variants**: Default discovered session, With cost info, With process ID, Multiple providers
- **Mock data**: Create `makeMockDiscoveredSession()` factory

### Sub-agent 7 — `GhSetupBanner` (github) — Tier 1

- **File**: `src/lib/components/blocks/github/GhSetupBanner.svelte`
- **Props**: `authStatus: GhAuthStatus`, `onconnect?: () => void`
- **Context**: None
- **Invoke**: None
- **Variants**: GitHub not configured (default), With repo configured but no auth, Authenticated (if banner renders differently or hides)

### Sub-agent 8 — `WorkspaceCard` (workspace) — Tier 1

- **File**: `src/lib/components/blocks/workspace/WorkspaceCard.svelte`
- **Props**: `workspace: OverviewWorkspaceData`, `onclick: () => void` + 10 optional click handlers (`onGithubClick`, `onFolderClick`, `onGithubRightClick`, `onFolderRightClick`, `onIssuesClick`, `onPrsClick`, `onAttnClick`, `onHitlClick`, `onPrdClick`, `onAfkClick`)
- **Context**: None
- **Invoke**: None
- **Variants**: Active workspace (full data), Dormant (no active sessions), Busy (multiple sessions), Empty workspace (no issues), With AFK loop, With attention badge, With open PRs, With merge conflicts, Dark accent color, Light accent color
- **⚠️ Event propagation**: Multiple icon buttons — each must `stopPropagation()` to prevent triggering card's main `onclick`. Verify ALL interactive children are covered.
- **Mock data**: Use `MOCK_OVERVIEW_DATA[0]` as base. Field names are **snake_case**: `active_session_count`, `open_issue_count`, `hitl_count`. Override for variants: `{ ...MOCK_OVERVIEW_DATA[0], active_session_count: 3 }`.

### Sub-agent 9 — `IssueCardList` (issue) — Tier 2

- **File**: `src/lib/components/blocks/issue/IssueCardList.svelte`
- **Props**: `IssueCardCallbacks` interface + `parentIssues: Issue[]`, `archivedIssues: Issue[]`, `showArchived: boolean`, `isPortfolio: boolean`, `cacheMap?: Map<string, GitStatusCache>`, `ghAvailable?: boolean`, `prioritiesEnabled?: boolean` + batch callbacks + getters (`getChildren`, `getNotificationDotColor?`, `getVisualization?`)
- **Context**: `useSelection()` from `$lib/modules/board/selection.context.svelte.ts`
- **Wrapper needed**: `IssueCardListStoryWrapper.svelte` — must call `setSelectionContext()`. Check if `setBoardContext()` is also required (ThemeDecorator may already provide it). Also needs `setIssuesContext()` because child `IssueCard` calls `useIssues()`.
- **Invoke**: None
- **Variants**: Full list (use `MOCK_ISSUES`), Empty list, Single issue, Mixed priorities, All archived (with `showArchived: true`), Batch selection mode
- **Mock data**: `MOCK_ISSUES` for parentIssues, empty array for archivedIssues in most variants

### Sub-agent 10 — `SessionCard` (workspace) — Tier 2

- **File**: `src/lib/components/blocks/workspace/SessionCard.svelte`
- **Props**: `session: Session`, `onClick: (session: Session) => void`, `onTerminate: (id: string) => void`
- **Context**: `useNotifications()` from notifications module
- **Wrapper needed**: `SessionCardStoryWrapper.svelte` — calls `setNotificationsContext()` with no-op handlers
- **Invoke**: None
- **Variants**: Running session, Needs-input session, Errored session, Finished session, With cost displayed, With issue linked, Without issue (orphan)
- **Event propagation**: Action buttons (terminate) must not trigger card's `onClick`.
- **Mock data**: Use `MOCK_SESSIONS`, override `state` for variants

### Sub-agent 11 — `NoteCard` (workspace) — Tier 2

- **File**: `src/lib/components/blocks/workspace/NoteCard.svelte`
- **Props**: `note: RawRequirementNote`, `index: number`, `showToggleProcessed?: boolean`
- **Context**: `useRawRequirements()` from raw requirements module
- **Wrapper needed**: `NoteCardStoryWrapper.svelte` — calls `setRawRequirementsContext()` with mock data
- **Invoke**: None
- **Variants**: View mode, Edit mode, Empty note, Long note (overflow), With toggle processed visible
- **Mock data**: Create `makeMockNote()` factory

### Sub-agent 12 — `DependencyGraphView` (dependency-graph) — Tier 2

- **File**: `src/lib/components/blocks/dependency-graph/DependencyGraphView.svelte`
- **Props**: `issues: readonly Issue[]`, `dependencies: readonly IssueDependency[]`, `onhitlquickstart?: (issueId: string) => void`
- **Context**: `useSelection()` from `$lib/modules/board/selection.context.svelte.ts`
- **Wrapper needed**: `DependencyGraphStoryWrapper.svelte` — calls `setSelectionContext()`. Check if `setBoardContext()` is also required.
- **Invoke**: None
- **Variants**: With issues and dependencies (use `MOCK_ISSUES` + `MOCK_ISSUE_DEPENDENCIES`), Empty graph (no issues), Filtered view (subset of issues), Long dependency chain, Single isolated node
- **Canvas note**: Uses SVG/canvas-based rendering. Wrap in a `div` with explicit dimensions (`min-h-[400px] w-full`).

### Sub-agent 13 — `WorkspaceBottomPanel` (layout) — Tier 2

- **File**: `src/lib/components/blocks/layout/WorkspaceBottomPanel.svelte`
- **Props**: Extensive — `IssueCardCallbacks` + `issues`, `parentIssues`, `archivedIssues`, `showArchived`, `isPortfolio`, `cacheMap`, `ghAvailable`, `prioritiesEnabled`, `paletteColors`, `usedColors`, `dependencies`, `authStatus` + assigned issues props + getters + callbacks
- **Context**: `useSelection()` from `$lib/modules/board/selection.context.svelte.ts`
- **Wrapper needed**: `WorkspaceBottomPanelStoryWrapper.svelte` — calls `setSelectionContext()`. Also needs `setIssuesContext()` because child components (IssueCardList → IssueCard) call `useIssues()`.
- **Invoke**: None
- **Variants**: Issues tab active (default), Dependencies tab active, With issue selected (detail panel visible), Empty state (no issues), With GitHub setup banner, With assigned issues panel
- **Note**: This is a container component — test that tab switching works and content renders. Detailed component testing happens in the individual component stories.

### Sub-agent 14 — `ForestView` (forest) — Tier 2

- **File**: `src/lib/components/blocks/forest/ForestView.svelte`
- **Props**: `issues: readonly Issue[]`, `allIssues: readonly Issue[]`, `dependencies: readonly IssueDependency[]`, `getGitStatus: (issueId: string) => GitStatusCache | undefined`, `getSessionsForIssue: (issueId: string) => readonly SessionForMapping[]` + callbacks (`onAddIssue?`, `onArchiveIssue?`, `onChangeIssueColor?`)
- **Context**: `useSelection()` from `$lib/modules/board/selection.context.svelte.ts`
- **Wrapper needed**: `ForestViewStoryWrapper.svelte` — calls `setSelectionContext()`.
- **Invoke**: None
- **Variants**: Full forest (multiple issues/trees), Empty forest (no issues), Single issue/tree, Many issues (performance test), With active session on a tree
- **Canvas note**: Uses `low-poly-2d-trees` canvas library. Wrap in a `div` with explicit dimensions (`min-h-[500px] w-full`). The canvas must have visible space to render.
- **Mock data**: `MOCK_ISSUES` for issues, `MOCK_ISSUE_DEPENDENCIES` for dependencies. Pass stub functions for `getGitStatus` and `getSessionsForIssue`.

### Sub-agent 15 — `DashboardSidebar` (layout) — Tier 2

- **File**: `src/lib/components/blocks/layout/DashboardSidebar.svelte`
- **Props**: `workspaceName: string`, `username: string`, `userInitials: string`, `activeSessionCount?: number`, `collapsed: boolean`, `onToggleSidebar: () => void`, `onEditWorkspace?: () => void`
- **Context**: `useKeyboardShortcuts()` from `$lib/modules/keyboard-shortcuts/keyboard_shortcuts.context.svelte.ts`
- **Wrapper needed**: `DashboardSidebarStoryWrapper.svelte` — calls `setKeyboardShortcutsContext()`. ThemeDecorator already provides board context.
- **Invoke**: None
- **Variants**: Expanded (default), Collapsed icon-only mode, With active sessions badge, With notification badge, Dark mode (handled by ThemeDecorator controls)
- **Navigation**: Contains links to `/`, `/sessions`, `/ai-config`, `/usage`, `/workspace-settings`, `/settings`. In Storybook these links won't navigate — that's fine, they're visual.
- **Internal components**: WorkspaceSelector, UserAvatar, ThemeToggle, LanguageSwitcher, SidebarNavItem, BrandMark

### Sub-agent 16 — `IssueCard` (issue) — Tier 3

- **File**: `src/lib/components/blocks/issue/IssueCard.svelte`
- **Props**: `issue: Issue` + `cache?`, `ghAvailable?`, `notificationDotColor?`, `childCount?`, `prdParent?`, `prioritiesEnabled?`, `sessionState?`, `visualization?`, `isActive?`, `isHovered?`, `isBatchSelected?`, `isModifierHeld?` + 7 callback handlers (`onCardClick`, `onTitleClick`, `onMouseEnter`, `onMouseLeave`, `onExecuteAction`, `onPriorityClick`, `onQuickActionAssignFolder`)
- **Context**: `useIssues()` — **hard dependency**, called unconditionally
- **Invoke**: `invoke('toggle_issue_sound_mute')` (auto-mocked)
- **Wrapper needed**: `IssueCardStoryWrapper.svelte` — must call `setIssuesContext()` and load mock issues via `issuesCtx.loadIssues(MOCK_DASHBOARDS[0].id)` from `onMount`. See CONVENTIONS.md §3 for the exact pattern. **Do NOT assign to `issuesCtx.issues` directly — it is a read-only getter.**
- **Variants**: Active issue (default), Selected/active state, Batch-selected state, High priority, Low priority, No priority, With worktree active, With GitHub PR linked, Archived issue, With notification dot, With session state chip (running/hitl/error)
- **⚠️ Event propagation — CRITICAL**: Action buttons (GitHub link, terminal, VS Code) must stop click propagation. Right-click on quick-action buttons must call `stopPropagation()` on `contextmenu` event. Verify all nested interactive elements.
- **Mock data**: `MOCK_ISSUES[0]` as base, spread overrides

### Sub-agent 17 — `SessionChatView` (session) — Tier 3

- **File**: `src/lib/components/blocks/session/SessionChatView.svelte`
- **Props**: `session: Session`, `onBack?: () => void`
- **Context**: `useSessions()` — requires session store context
- **Invoke**: `listen<SessionEventPayload>('session-event', ...)` (Tauri event listener)
- **Wrapper needed**: `SessionChatViewStoryWrapper.svelte` — must call `setSessionsContext(noopNotifications)` where `noopNotifications = { addPending: () => {}, clearPending: () => {} }`. Messages arrive via Tauri event listeners (not direct prop/context injection), so stories should pass different `session` prop objects to show different states rather than trying to pre-populate messages.
- **Variants**: Running session, Empty session (no messages yet), Needs-input state, Error state, With back button
- **Event propagation**: Chat input Escape should clear the input field only, NOT dismiss any parent dialog.
- **Mock data**: Use `makeMockSession()` factory, override `state` field

### Sub-agent 18 — `CreationWizard` (creation-wizard) — Tier 3

- **File**: `src/lib/components/blocks/creation-wizard/CreationWizard.svelte`
- **Props**: `assignedIssues: AssignedIssue[]`, `onCreate: (request: CreateIssueRequest) => Promise<Issue>`, `onUpdate: (request: UpdateIssueRequest) => Promise<Issue>`, `onSetupWorktree: (issue: Issue) => Promise<void>`
- **Context**: `useCreationWizard()` — provides full wizard state and step management
- **Invoke**: `search_github_issues` (via context, auto-mocked)
- **Wrapper needed**: `CreationWizardStoryWrapper.svelte` — must call `setCreationWizardContext()`. Check the context's dependencies — it may need board context (already provided by ThemeDecorator) or additional contexts.
- **Variants**: Closed state, Open — Step 1 (GitHub Search), Open — Step 2 (Issue Name), Open — Step 3 (Color Selection), Open — Step 4 (Worktree Choice), Submitting state
- **⚠️ Event propagation — CRITICAL**: Uses `svelte:window onkeydown` for Escape with explicit `stopPropagation()`. Uses `onEscapeKeydown={(e) => e.preventDefault()}` on `Dialog.Content` to suppress bits-ui's built-in close. Verify: (1) Escape correctly closes the wizard, (2) Escape does NOT reach other `svelte:window` listeners, (3) Escape inside text input navigates back rather than typing "Escape".
- **Keyboard**: Arrow keys for step navigation, Enter for confirm, Backspace for back
- **Mock data**: `MOCK_ASSIGNED_ISSUES_RESULT` for assignedIssues, return mock `Issue` from `onCreate`/`onUpdate` callbacks

### Sub-agent 19 — `GitHubAuthWizard` (github-auth) — Tier 4

- **File**: `src/lib/components/blocks/github-auth/GitHubAuthWizard.svelte`
- **Props**: `open = $bindable()`, `onconnected?: (user: GitHubUser) => void`
- **Context**: None
- **Invoke**: `invoke('github_device_flow_start')`, `invoke('github_device_flow_poll')` — **both are in `TAURI_ONLY_COMMANDS`**. In Storybook they fire a "Desktop app required" warning toast and are no-ops.
- **Wrapper needed**: None (props-driven dialog)
- **Variants**: Initial state (dialog open, showing UI before device code), Error state (if supported via props)
- **Limitation**: Live device-flow polling will not work in Storybook. Stories can only show static initial states.
- **⚠️ Event propagation**: This is a Dialog. Check `onEscapeKeydown` on `Dialog.Content`.

### Sub-agent 20 — Story Splits & Composition (orchestrator task)

This is not a component sub-agent — it's cleanup by the orchestrator after Waves 1-3:

1. **Verify splits**: Confirm `CodeBlock.stories.svelte` and `SessionSidebar.stories.svelte` were created by sub-agents 1 and 2.
2. **Update ChatComponents.stories.svelte**: Remove CodeBlock story if sub-agent 1 didn't already. Keep StreamingCaret + InlineImage stories. Update title to `Blocks/Chat/ChatComponents`.
3. **Update SessionLayout.stories.svelte**: Remove SessionSidebar variants if sub-agent 2 didn't already. Keep the "Full Layout" composition story. Ensure it imports SessionChatView and SessionSidebar to show them composed together.
4. **Verify title taxonomy**: Every new story file must use the correct Storybook title prefix per CONVENTIONS.md §2.

---

## Context Wrapper Patterns

### Selection context (used by 4 components: IssueCardList, DependencyGraphView, WorkspaceBottomPanel, ForestView)

```svelte
<!-- Example: DependencyGraphStoryWrapper.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setSelectionContext } from '$lib/modules/board/selection.context.svelte.js';

	const { children }: { children: Snippet } = $props();

	setSelectionContext();
</script>

{@render children()}
```

> **Note**: Check whether `setSelectionContext()` requires `setBoardContext()` to have been called first. ThemeDecorator calls `setBoardContext()` globally, so this may already be available. If `setSelectionContext()` calls `useBoard()` internally, it will work. If it requires an explicit parameter, read the source and adjust.

### Issues context (used by IssueCard, and transitively by IssueCardList/WorkspaceBottomPanel)

```svelte
<!-- IssueCardStoryWrapper.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { setIssuesContext } from '$lib/modules/issues/index.js';
	import { MOCK_DASHBOARDS } from '$lib/tauri_mock_data.js';

	const { children }: { children: Snippet } = $props();

	const issuesCtx = setIssuesContext();
	onMount(() => issuesCtx.loadIssues(MOCK_DASHBOARDS[0].id));
</script>

{@render children()}
```

### Sessions context (used by SessionChatView)

```svelte
<!-- SessionChatViewStoryWrapper.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setSessionsContext } from '$lib/modules/sessions/index.js';

	const { children }: { children: Snippet } = $props();

	const noopNotifications = { addPending: () => {}, clearPending: () => {} };
	setSessionsContext(noopNotifications);
</script>

{@render children()}
```

### Composite wrappers (for components needing multiple contexts)

Components like `IssueCardList` and `WorkspaceBottomPanel` need **both** `useSelection()` and child `IssueCard`s need `useIssues()`. Their wrappers must set up both:

```svelte
<!-- IssueCardListStoryWrapper.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { setSelectionContext } from '$lib/modules/board/selection.context.svelte.js';
	import { setIssuesContext } from '$lib/modules/issues/index.js';
	import { MOCK_DASHBOARDS } from '$lib/tauri_mock_data.js';

	const { children }: { children: Snippet } = $props();

	setSelectionContext();
	const issuesCtx = setIssuesContext();
	onMount(() => issuesCtx.loadIssues(MOCK_DASHBOARDS[0].id));
</script>

{@render children()}
```

---

## Instructions for Each Sub-Agent

```
You are implementing a Storybook story for a specific block component in the Grovekeeper project.

1. Read ALL source files for this component completely before writing anything.
2. Determine context tier (see CONVENTIONS.md §3): Does it need a wrapper?
3. If it calls context hooks, read the context module to understand:
   - What the set*Context() function signature is
   - What parameters it requires
   - Whether it depends on other contexts being set first
4. Import mock data from 'src/lib/tauri_mock_data.ts' — do NOT hardcode fixture data.
5. If a wrapper is needed, create `MyComponentStoryWrapper.svelte` alongside the story.
6. Create the story file following the exact format in CONVENTIONS.md §2.
7. Cover all variants listed for this component.
8. Check event propagation for any interactive element inside the component (CONVENTIONS.md §1).
   - For every nested button/link: verify stopPropagation() exists.
   - For every dialog/popover child: verify onEscapeKeydown guard exists.
   - If violations found: fix the source file AND document in Findings Report.
9. Use Context7 MCP for bits-ui API reference if needed.
10. Run svelte-autofixer on any .svelte files you create or modify.
11. Return a Findings Report (format in CONVENTIONS.md §4).
```

---

## Mock Data Quick Reference

```ts
import {
	MOCK_SESSIONS, // Session[]
	MOCK_ISSUES, // Issue[]
	MOCK_DASHBOARDS, // Dashboard[]
	MOCK_OVERVIEW_DATA, // OverviewWorkspaceData[]
	MOCK_ISSUE_DEPENDENCIES, // IssueDependency[]
	MOCK_GIT_STATUSES, // GitStatusCache[]
	MOCK_ASSIGNED_ISSUES_RESULT, // { issues: AssignedIssue[], has_more: boolean }
	MOCK_COLOR_PALETTES, // ColorPalette[]
} from '$lib/tauri_mock_data.js';
```

---

## Completion Criteria

- All 18 component story files (or story+wrapper pairs) exist and render without errors
- Combined stories split: CodeBlock and SessionSidebar have dedicated story files
- SessionLayout.stories.svelte and ChatComponents.stories.svelte are composition-only demos
- Every story uses the correct title prefix from the taxonomy table
- `pnpm test -- --project=storybook` passes
- `pnpm check:all` passes with no new errors
- Consolidated Findings Report listing:
    - All event propagation violations found and whether they were fixed or deferred
    - All context setup issues encountered
    - Any components that could not be rendered in Storybook (with reason)
