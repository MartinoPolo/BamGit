# Deep Module Decomposition Plan

## Goal

Refactor `src/lib/modules/` from single-file modules into properly structured deep modules. Each module gets an `index.ts` barrel (public boundary) and a `<name>.context.svelte.ts` file (reactive logic). Modules above 200 lines additionally decompose pure logic into separate `.ts` files.

## Architecture Context

Grovekeeper is a Tauri v2 + SvelteKit 2 + Svelte 5 desktop app. The frontend modules in `src/lib/modules/` follow a "deep module" pattern (Ousterhout's "A Philosophy of Software Design") where each module has a small public interface hiding complex implementation.

Currently each module is a folder containing a single `index.svelte.ts` — the folder adds nothing because the module boundary IS the file. This refactor introduces real internal structure behind a clean barrel.

**Module path:** `src/lib/modules/`

**7 modules total:**

| Module          | Current file      | Lines | Decompose?        |
| --------------- | ----------------- | ----- | ----------------- |
| actions         | `index.svelte.ts` | 120   | Rename only       |
| notifications   | `index.svelte.ts` | 124   | Rename only       |
| version-control | `index.svelte.ts` | 188   | Rename only       |
| sessions        | `index.svelte.ts` | 257   | Rename + evaluate |
| board           | `index.svelte.ts` | 359   | Full decompose    |
| issues          | `index.svelte.ts` | 379   | Full decompose    |
| visualization   | `index.ts`        | 1,010 | Full decompose    |

## Tech Constraints

- Svelte 5 runes (`$state`, `$derived`, `$effect`) require `.svelte.ts` file extension for the Svelte compiler to process them.
- The project has reactivity wrapper classes in `src/lib/reactivity/` (`StateRaw`, `Persisted`, `ReadonlyState`). These are already compiled `.svelte.ts` classes. Code that only instantiates them (e.g., `new StateRaw(0)`) can live in plain `.ts` files, but code using raw runes must be in `.svelte.ts` files.
- The existing context pattern uses `createContext` from Svelte 5.40+ with `set*Context()` (provider) and `use*()` (consumer).
- `$lib/types/generated/` contains ts-rs output from Rust — these files must never be edited.
- Vite resolves `$lib/modules/<name>` to `$lib/modules/<name>/index.ts` (standard directory resolution).

## Conventions for All Sub-Agents

1. **`index.ts`** — plain `.ts`, contains ONLY re-exports. This is the public boundary. Every symbol currently exported from the old `index.svelte.ts` must be re-exported here.
2. **`<name>.context.svelte.ts`** — the reactive context factory. Contains `createContext` destructuring, `set*Context()`, `use*()`, `create*Context()`, and reactive state.
3. **`types.ts`** — type definitions, interfaces, type aliases, type guards. Plain `.ts`. Created when a module has 5+ exported types.
4. **Additional `.ts` files** — pure helper functions named by concern (e.g., `serialization.ts`, `forest-layout.ts`). Created when the context file would exceed 200 lines after type extraction.
5. **File ordering within context file:** imports → type alias + `createContext` destructuring → `set*Context()` → `create*Context()` factory last.
6. **The public API must not change.** Every symbol currently exported must remain importable from `$lib/modules/<name>`. No renames, no type changes, no removed exports.
7. **Always use braces and multi-line blocks for if statements.**
8. **Delete the old `index.svelte.ts`** after creating the new files. Each module should have exactly one `index.ts` (the barrel) and no `index.svelte.ts`.
9. **Internal imports use `.js` extension** (SvelteKit convention): `from './types.js'`, `from './serialization.js'`, `from './issues.context.svelte.js'`.

## Orchestration

An Opus orchestrator spawns Sonnet sub-agents. Work runs in three phases.

### Phase 1 — Module Internal Refactoring (5 parallel sub-agents)

Each sub-agent touches ONLY files inside its assigned module folder(s). No consumer files outside the module.

- **Sub-Agent A:** Rename small modules (actions, notifications, version-control)
- **Sub-Agent B:** Decompose sessions
- **Sub-Agent C:** Decompose board
- **Sub-Agent D:** Decompose issues
- **Sub-Agent E:** Decompose visualization

### Phase 2 — Consumer Import Migration (1 sub-agent, after Phase 1)

One sub-agent updates all files outside `src/lib/modules/` that import from modules, plus cross-module imports and documentation.

### Phase 3 — Verification (orchestrator)

Run `pnpm check` and `pnpm build`. Fix any issues.

---

## Sub-Agent A: Rename Small Modules

**Scope:** `actions/`, `notifications/`, `version-control/` — all under 200 lines, rename only.

### actions/ (120 lines)

**Current exports:**

- Functions: `setActionsContext`, `useActions`
- Types: `CreateActionRequest`, `UpdateActionRequest`

**Steps:**

1. Read `src/lib/modules/actions/index.svelte.ts`.
2. Create `src/lib/modules/actions/actions.context.svelte.ts` with the full content of the old file.
3. Delete `src/lib/modules/actions/index.svelte.ts`.
4. Create `src/lib/modules/actions/index.ts`:

```typescript
export { setActionsContext, useActions } from './actions.context.svelte.js';
export type { CreateActionRequest, UpdateActionRequest } from './actions.context.svelte.js';
```

### notifications/ (124 lines)

**Current exports:**

- Functions: `setNotificationsContext`, `useNotifications`
- Constants: `NOTIFICATION_DOT_COLORS`
- Types: `NotificationConfig`, `UpdateNotificationConfigRequest`

**Steps:**

1. Read `src/lib/modules/notifications/index.svelte.ts`.
2. Create `src/lib/modules/notifications/notifications.context.svelte.ts` with the full content.
3. Delete `src/lib/modules/notifications/index.svelte.ts`.
4. Create `src/lib/modules/notifications/index.ts`:

```typescript
export {
	setNotificationsContext,
	useNotifications,
	NOTIFICATION_DOT_COLORS,
} from './notifications.context.svelte.js';
export type {
	NotificationConfig,
	UpdateNotificationConfigRequest,
} from './notifications.context.svelte.js';
```

### version-control/ (188 lines)

**Current exports:**

- Functions: `setVersionControlContext`, `useVersionControl`
- No exported types, no exported constants

**Steps:**

1. Read `src/lib/modules/version-control/index.svelte.ts`.
2. Create `src/lib/modules/version-control/version-control.context.svelte.ts` with the full content.
3. Delete `src/lib/modules/version-control/index.svelte.ts`.
4. Create `src/lib/modules/version-control/index.ts`:

```typescript
export { setVersionControlContext, useVersionControl } from './version-control.context.svelte.js';
```

### Verification

Each module folder should have exactly: `index.ts` + `<name>.context.svelte.ts`. No `index.svelte.ts` remaining.

---

## Sub-Agent B: Decompose sessions (257 lines)

**Scope:** `src/lib/modules/sessions/`

**Current exports:**

- Functions: `setSessionsContext` (takes `NotificationsApi` parameter), `useSessions`
- No types exported to consumers

**Internal types:** `SpawnSessionRequest`, `AdoptSessionRequest`, `NotificationsApi`, `NOTIFICATION_STATES`

**Internal functions:** `createSessionsContext`, `handleSessionEvent`, `handleDiscoveredSessionsUpdate`, `fetchAndSetSessions`

**Steps:**

1. Read `src/lib/modules/sessions/index.svelte.ts` fully.
2. Create `src/lib/modules/sessions/sessions.context.svelte.ts` with the full content.
3. Delete `src/lib/modules/sessions/index.svelte.ts`.
4. Create `src/lib/modules/sessions/index.ts`:

```typescript
export { setSessionsContext, useSessions } from './sessions.context.svelte.js';
```

5. **Evaluate extraction:** The file is 257 lines (above the 200-line threshold). Review the private functions. If any are pure (take data in, return data out, no reactive state access) and total more than 30 lines, extract them to a separate `.ts` file. Event handler functions that are closures over `$state` variables stay in the context file. Typical candidates: the `NOTIFICATION_STATES` mapping and any event-type resolution logic.

---

## Sub-Agent C: Decompose board (359 lines)

**Scope:** `src/lib/modules/board/`

**Current exports:**

- Functions: `setBoardContext`, `useBoard`
- Constants: `DEFAULT_PALETTE_ID`, `FALLBACK_ISSUE_COLOR`
- Types: `CreateDashboardRequest`, `UpdateDashboardRequest`, `CreateColorPaletteRequest`, `UpdateColorPaletteRequest`, `AddRepoToPortfolioRequest`, `ViewMode`, `ThemeMode`

**Internal functions:** `createBoardContext`, `isThemeMode`, `isViewMode`

**Current imports (line 1–11 of the file):**

```typescript
import { createContext } from 'svelte';
import { browser } from '$app/environment';
import { MediaQuery } from 'svelte/reactivity';
import { invoke } from '@tauri-apps/api/core';
import { Persisted, stringSerde } from '$lib/reactivity/persisted.svelte.js';
import type {
	Dashboard,
	ColorPalette,
	PortfolioDashboardPointer,
	LabelShapeMapping,
} from '$lib/types/generated';
```

**Target structure:**

```
board/
  index.ts
  board.context.svelte.ts
  types.ts
```

**Steps:**

1. Read `src/lib/modules/board/index.svelte.ts` fully.
2. Create `src/lib/modules/board/types.ts` containing:
    - All 7 exported type definitions: `CreateDashboardRequest`, `UpdateDashboardRequest`, `CreateColorPaletteRequest`, `UpdateColorPaletteRequest`, `AddRepoToPortfolioRequest`, `ViewMode`, `ThemeMode`
    - The type guard functions: `isThemeMode()`, `isViewMode()`
    - Any imports these types need (likely none — they're self-contained interfaces and string literal unions)
3. Create `src/lib/modules/board/board.context.svelte.ts` containing:
    - All imports except what moved to types.ts
    - Add `import type { ... } from './types.js'` and `import { isThemeMode, isViewMode } from './types.js'` for the types and guards used by the context
    - Constants: `DEFAULT_PALETTE_ID`, `FALLBACK_ISSUE_COLOR`
    - Context: `createContext` destructuring, `setBoardContext`, `useBoard`, `createBoardContext`
    - All reactive state, derived values, and methods
4. Delete `src/lib/modules/board/index.svelte.ts`.
5. Create `src/lib/modules/board/index.ts`:

```typescript
export {
	setBoardContext,
	useBoard,
	DEFAULT_PALETTE_ID,
	FALLBACK_ISSUE_COLOR,
} from './board.context.svelte.js';
export type {
	CreateDashboardRequest,
	UpdateDashboardRequest,
	CreateColorPaletteRequest,
	UpdateColorPaletteRequest,
	AddRepoToPortfolioRequest,
	ViewMode,
	ThemeMode,
} from './types.js';
```

---

## Sub-Agent D: Decompose issues (379 lines)

**Scope:** `src/lib/modules/issues/`

**Current exports:**

- Functions: `setIssuesContext`, `useIssues`
- Types (11): `WorktreeState`, `SortMode`, `IssuePriority`, `IssueStatus`, `IssueLabel`, `Issue`, `CreateIssueRequest`, `UpdateIssueRequest`, `SetupWorktreeRequest`, `RemoveWorktreeRequest`, `IssueCardCallbacks`

**Internal functions:** `createIssuesContext`, `deserializeLabels`, `toIssue`, `serializeLabels`, `startWorktreeListeners`, `stopWorktreeListeners`, `getChildren`, `fetchIssues`

**Internal constant:** `HEX_COLOR_PATTERN` (used by serialization)

**Current imports (line 1–10 of the file):**

```typescript
import { createContext, onDestroy } from 'svelte';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { SvelteMap } from 'svelte/reactivity';
import type {
	Issue as GeneratedIssue,
	WorktreeProgressPayload,
	WorktreeStateChangePayload,
	PrunableIssue,
} from '$lib/types/generated';
```

**Target structure:**

```
issues/
  index.ts
  issues.context.svelte.ts
  types.ts
  serialization.ts
```

**Steps:**

1. Read `src/lib/modules/issues/index.svelte.ts` fully.
2. Create `src/lib/modules/issues/types.ts` containing:
    - All 11 exported type definitions: `WorktreeState`, `SortMode`, `IssuePriority`, `IssueStatus`, `IssueLabel`, `Issue`, `CreateIssueRequest`, `UpdateIssueRequest`, `SetupWorktreeRequest`, `RemoveWorktreeRequest`, `IssueCardCallbacks`
    - The `Issue` interface extends `Omit<GeneratedIssue, 'labels' | 'priority' | 'status' | 'worktree_state'>`, so `types.ts` needs: `import type { Issue as GeneratedIssue } from '$lib/types/generated'`
3. Create `src/lib/modules/issues/serialization.ts` containing:
    - `HEX_COLOR_PATTERN` constant
    - `deserializeLabels(raw: string | null): IssueLabel[]`
    - `serializeLabels(labels: IssueLabel[]): string`
    - `toIssue(raw: GeneratedIssue): Issue` (converts the Rust-generated type to the frontend type)
    - Imports: `import type { Issue as GeneratedIssue } from '$lib/types/generated'` and `import type { Issue, IssueLabel } from './types.js'`
4. Create `src/lib/modules/issues/issues.context.svelte.ts` containing:
    - Imports from `'svelte'`, `'@tauri-apps/api/core'`, `'@tauri-apps/api/event'`, `'svelte/reactivity'`, `'$lib/types/generated'`
    - `import type { ... } from './types.js'` for types used in the context
    - `import { deserializeLabels, serializeLabels, toIssue } from './serialization.js'`
    - Context: `createContext` destructuring, `setIssuesContext`, `useIssues`, `createIssuesContext`
    - Event listeners: `startWorktreeListeners`, `stopWorktreeListeners` (these are closures over reactive state — keep them here)
    - Helpers that access reactive state: `getChildren`, `fetchIssues`
5. Delete `src/lib/modules/issues/index.svelte.ts`.
6. Create `src/lib/modules/issues/index.ts`:

```typescript
export { setIssuesContext, useIssues } from './issues.context.svelte.js';
export type {
	WorktreeState,
	SortMode,
	IssuePriority,
	IssueStatus,
	IssueLabel,
	Issue,
	CreateIssueRequest,
	UpdateIssueRequest,
	SetupWorktreeRequest,
	RemoveWorktreeRequest,
	IssueCardCallbacks,
} from './types.js';
```

---

## Sub-Agent E: Decompose visualization (1,010 lines)

**Scope:** `src/lib/modules/visualization/`

This is a pure computation module — no Svelte context, no reactivity. All files are plain `.ts`.

**Current files:**

- `index.ts` (1,010 lines) — all production code
- `testing.ts` (17 lines) — re-exports internals for tests
- `visualization.test.ts` (1,270 lines) — test suite

**Current `index.ts` imports (lines 1–12):**

```typescript
import type {
	TreeShape,
	TreeStage,
	PottedPlantStage,
	FruitType,
	TreeConfig,
	ToolVisibility,
	OverlayConfig,
} from 'low-poly-2d-trees';
import type { Issue } from '$lib/modules/issues/index.svelte.js';
import type { GitStatusCache, ExecutionPhase, SessionState } from '$lib/types/generated';
import type { WorktreeState } from '$lib/modules/issues/index.svelte.js';
```

**Current exports:**

- Constants: `TREE_STAGES`, `POTTED_PLANT_STAGES`, `TOOL_TYPES`, `MIN_SPACING_PX`
- Types (~18): `LabelShapeMappingEntry`, `AggregateSessionState`, `ForestBranchStatus`, `ForestPullRequestState`, `ForestSyncStatus`, `StateDimensions`, `TreeVisualizationTree`, `TreeVisualizationPottedPlant`, `TreeVisualizationOak`, `TreeVisualization`, `TreeComputeContext`, `SessionForMapping`, `Viewport`, `ForestLayoutItemOak`, `ForestLayoutItemTree`, `ForestLayoutItemPottedPlant`, `ForestLayoutItem`, `PositionedForestItem`
- Production functions: `computeVisualization`, `computeForestLayout`
- Test-facing functions: `aggregateSessionState`, `mapIssueToStateDimensions`, `computeTreeVisualization`

**Internal functions (20+):** `resolveTreeShape`, `createDefaultToolVisibility`, `computeToolVisibility`, `computeTreeStage`, `computePottedPlantStage`, `issueIdToSeed`, `mapBranchStatus`, `mapPrState`, `mapSyncStatus`, `pickExecutionPhase`, `priorityRank`, `sortByPriorityThenOrder`, `isStump`, `ringCapacityAt`, `countTreeRings`, `classifyItems`, `semicircleAngles`, `placeOnSemicircles`, `enforceMinimumSpacing`, `placeOak`, `placeStumps`, `placePottedPlants`

**Target structure:**

```
visualization/
  index.ts               ← barrel re-exports (replaces current 1,010-line file)
  types.ts               ← all type/interface definitions
  constants.ts           ← TREE_STAGES, POTTED_PLANT_STAGES, TOOL_TYPES, MIN_SPACING_PX
  tree-computation.ts    ← computeVisualization pipeline + tree-level helpers
  forest-layout.ts       ← computeForestLayout pipeline + layout helpers
  testing.ts             ← updated re-exports from new locations
  visualization.test.ts  ← updated imports (if needed)
```

**Steps:**

1. Read `src/lib/modules/visualization/index.ts` fully (1,010 lines).
2. Read `src/lib/modules/visualization/testing.ts`.
3. Create `src/lib/modules/visualization/types.ts`:
    - Move all `export type` and `export interface` definitions
    - Include necessary imports from `'low-poly-2d-trees'` and `'$lib/types/generated'` for types referenced in the definitions (e.g., `TreeShape`, `TreeStage`, `SessionState`, etc.)
    - Import `type Issue` and `type WorktreeState` — for now use the existing path `$lib/modules/issues/index.svelte.js` (Phase 2 will update this to `$lib/modules/issues`)
4. Create `src/lib/modules/visualization/constants.ts`:
    - Move `TREE_STAGES`, `POTTED_PLANT_STAGES`, `TOOL_TYPES`, `MIN_SPACING_PX`
    - Include the necessary imports these constants reference (library types for the `satisfies` checks, if any)
5. Create `src/lib/modules/visualization/tree-computation.ts`:
    - **Exported functions:** `computeVisualization`, `computeTreeVisualization`, `aggregateSessionState`, `mapIssueToStateDimensions`
    - **Internal functions used by the above:** `resolveTreeShape`, `createDefaultToolVisibility`, `computeToolVisibility`, `computeTreeStage`, `computePottedPlantStage`, `issueIdToSeed`, `mapBranchStatus`, `mapPrState`, `mapSyncStatus`, `pickExecutionPhase`
    - Import types from `./types.js`, constants from `./constants.js`
    - Import library types from `'low-poly-2d-trees'`
    - Import generated types from `'$lib/types/generated'`
6. Create `src/lib/modules/visualization/forest-layout.ts`:
    - **Exported function:** `computeForestLayout`
    - **Internal functions used by the above:** `priorityRank`, `sortByPriorityThenOrder`, `isStump`, `ringCapacityAt`, `countTreeRings`, `classifyItems`, `semicircleAngles`, `placeOnSemicircles`, `enforceMinimumSpacing`, `placeOak`, `placeStumps`, `placePottedPlants`
    - Import types from `./types.js`, constants from `./constants.js` (if needed)
    - If any helper is shared between `tree-computation.ts` and `forest-layout.ts`, keep it in whichever file uses it more and import from there
7. Replace `src/lib/modules/visualization/index.ts` content with barrel re-exports:

```typescript
// Types
export type {
	LabelShapeMappingEntry,
	AggregateSessionState,
	ForestBranchStatus,
	ForestPullRequestState,
	ForestSyncStatus,
	StateDimensions,
	TreeVisualizationTree,
	TreeVisualizationPottedPlant,
	TreeVisualizationOak,
	TreeVisualization,
	TreeComputeContext,
	SessionForMapping,
	Viewport,
	ForestLayoutItemOak,
	ForestLayoutItemTree,
	ForestLayoutItemPottedPlant,
	ForestLayoutItem,
	PositionedForestItem,
} from './types.js';

// Constants
export { TREE_STAGES, POTTED_PLANT_STAGES, TOOL_TYPES, MIN_SPACING_PX } from './constants.js';

// Production API
export { computeVisualization } from './tree-computation.js';
export { computeForestLayout } from './forest-layout.js';

// Test-facing exports (used by testing.ts and directly by tests)
export {
	aggregateSessionState,
	mapIssueToStateDimensions,
	computeTreeVisualization,
} from './tree-computation.js';
```

8. Update `src/lib/modules/visualization/testing.ts` to re-export from the new locations:

```typescript
export { TREE_STAGES, POTTED_PLANT_STAGES, TOOL_TYPES } from './constants.js';

export {
	aggregateSessionState,
	mapIssueToStateDimensions,
	computeTreeVisualization,
} from './tree-computation.js';

export type { StateDimensions } from './types.js';
```

9. Read `src/lib/modules/visualization/visualization.test.ts` and verify its imports still resolve. The test file imports from `./index.js` and `./testing.js` — both still exist, so imports should work without changes. If the test file imports any symbol that was not re-exported through the barrel, add the missing re-export.

---

## Phase 2: Consumer Import Migration

**Scope:** All files OUTSIDE `src/lib/modules/` that import from modules, plus cross-module imports within modules, plus documentation.

### Step 1: Update source file imports

Search for and replace all occurrences. The pattern is always the same: change the explicit `index.svelte.js` path to a bare directory import.

**Replacements (apply across entire `src/` directory):**

| Old import path                                | New import path                |
| ---------------------------------------------- | ------------------------------ |
| `$lib/modules/actions/index.svelte.js`         | `$lib/modules/actions`         |
| `$lib/modules/board/index.svelte.js`           | `$lib/modules/board`           |
| `$lib/modules/issues/index.svelte.js`          | `$lib/modules/issues`          |
| `$lib/modules/notifications/index.svelte.js`   | `$lib/modules/notifications`   |
| `$lib/modules/sessions/index.svelte.js`        | `$lib/modules/sessions`        |
| `$lib/modules/version-control/index.svelte.js` | `$lib/modules/version-control` |

**Known consumer files (exhaustive list at time of writing):**

From **board**:

- `src/routes/+layout.svelte` (lines 11)
- `src/routes/settings/+page.svelte` (line 3)
- `src/routes/issues/+page.svelte` (line 3)
- `src/lib/storybook/ThemeDecorator.svelte` (line 2)
- `src/lib/components/DashboardCreateDialog.svelte` (line 2)
- `src/lib/components/DashboardEditDialog.svelte` (line 2)
- `src/lib/components/DashboardToolbar.svelte` (line 4)
- `src/lib/components/IssueEditDialog.svelte` (line 3)
- `src/lib/components/ThemeToggle.svelte` (line 2)
- `src/lib/components/ViewToggle.svelte` (line 3)

From **issues**:

- `src/routes/+layout.svelte` (line 14)
- `src/routes/issues/+page.svelte` (lines 4, 16)
- `src/lib/components/DashboardToolbar.svelte` (line 3)
- `src/lib/components/ForestView.svelte` (line 2)
- `src/lib/components/IssueCard.svelte` (lines 2, 4)
- `src/lib/components/IssueCardList.svelte` (lines 2, 4)
- `src/lib/components/IssueEditDialog.svelte` (line 2)
- `src/lib/components/IssueCreateDialog.svelte` (line 2)

From **sessions**:

- `src/routes/+layout.svelte` (line 13)
- `src/routes/sessions/+page.svelte` (line 3)
- `src/routes/issues/+page.svelte` (line 11)
- `src/lib/components/SessionChatView.svelte` (line 3)

From **notifications**:

- `src/routes/+layout.svelte` (line 12)
- `src/routes/sessions/+page.svelte` (line 4)
- `src/routes/issues/+page.svelte` (line 10)
- `src/lib/components/NotificationSettingsPanel.svelte` (line 3)
- `src/lib/components/SessionCard.svelte` (line 6)

From **version-control**:

- `src/routes/+layout.svelte` (line 15)
- `src/routes/issues/+page.svelte` (line 5)

From **actions**:

- `src/routes/+layout.svelte` (line 16)
- `src/routes/issues/+page.svelte` (line 6)

### Step 2: Update cross-module imports

Inside `src/lib/modules/`, update modules that import from other modules:

- `src/lib/modules/visualization/tree-computation.ts` (or wherever the Issue import ended up): change `$lib/modules/issues/index.svelte.js` → `$lib/modules/issues`
- `src/lib/modules/visualization/types.ts` (if the Issue/WorktreeState types are imported there): same change

### Step 3: Update documentation

Update import examples in these files:

- `.mpx/ARCHITECTURE.md` — the "Import Convention" section (lines 196–204)
- `.claude/skills/mp-ui-dev/REFERENCE.md` — the import example (line 65)

Replace `from '$lib/modules/<name>/index.svelte.js'` with `from '$lib/modules/<name>'` in all examples.

### Step 4: Update ARCHITECTURE.md module structure

In `.mpx/ARCHITECTURE.md`, replace the "Module Structure" section (around lines 130–145) with:

```
src/lib/
  modules/
    actions/
      index.ts                          — barrel re-exports
      actions.context.svelte.ts         — reactive context
    board/
      index.ts                          — barrel re-exports
      board.context.svelte.ts           — reactive context
      types.ts                          — request/config types, view/theme modes
    issues/
      index.ts                          — barrel re-exports
      issues.context.svelte.ts          — reactive context
      types.ts                          — Issue, WorktreeState, request types
      serialization.ts                  — label/issue (de)serialization
    notifications/
      index.ts                          — barrel re-exports
      notifications.context.svelte.ts   — reactive context
    sessions/
      index.ts                          — barrel re-exports
      sessions.context.svelte.ts        — reactive context
    version-control/
      index.ts                          — barrel re-exports
      version-control.context.svelte.ts — reactive context
    visualization/
      index.ts                          — barrel re-exports
      types.ts                          — all visualization types
      constants.ts                      — stage/shape/tool constants
      tree-computation.ts               — computeVisualization pipeline
      forest-layout.ts                  — computeForestLayout pipeline
      testing.ts                        — test-only re-exports
```

Update the "Module Convention" section to reflect:

- Entry point: always `index.ts` (barrel re-exports only)
- Context file: `<name>.context.svelte.ts`
- Context hooks: `use<Module>()` (consumer) + `set<Module>Context()` (provider)
- Types in `types.ts` when module has 5+ exported types
- Pure helpers in named `.ts` files when context file exceeds 200 lines

Update the "Import Convention" code block:

```typescript
// Module APIs (directory import resolves to index.ts barrel)
import { useIssues, type Issue } from '$lib/modules/issues';
import { useSessions } from '$lib/modules/sessions';
import { useVersionControl } from '$lib/modules/version-control';
import { useBoard } from '$lib/modules/board';
import { useNotifications } from '$lib/modules/notifications';
import { useActions } from '$lib/modules/actions';

// Pure functions
import { computeVisualization, computeForestLayout } from '$lib/modules/visualization';
```

### Step 5: Verify no stale references

Run these checks:

1. `grep -r "index.svelte.ts" src/lib/modules/` — should return zero results (all old files deleted)
2. `grep -r "index.svelte.js'" src/` — should return zero results (all consumer imports updated)
3. `grep -r "index.svelte.js'" .mpx/` — should return zero results (docs updated)
4. `grep -r "index.svelte.js'" .claude/` — should return zero results (skill docs updated)

---

## Phase 3: Verification

The orchestrator runs:

1. `pnpm check` — Svelte/TypeScript type checking
2. `pnpm build` — full production build
3. If tests exist: `pnpm test` (visualization tests should still pass)

**Common failure causes and fixes:**

- **Missing re-export in barrel:** A symbol was exported from the old `index.svelte.ts` but not re-exported from the new `index.ts`. Fix: add the missing re-export.
- **Import path typo:** `.svelte.js` vs `.js` mismatch. Context files use `.context.svelte.js`; plain files use `.js`.
- **Circular dependency:** Unlikely with this structure, but if it occurs, the types.ts file is importing from the context file. Fix: ensure types.ts only imports from `$lib/types/generated` or is self-contained.
- **Missing type import in extracted file:** A type used in `serialization.ts` or `types.ts` wasn't imported. Fix: add the import from `$lib/types/generated` or `./types.js`.
