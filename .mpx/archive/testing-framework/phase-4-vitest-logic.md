# Phase 4 — Vitest Unit & Browser Tests: Logic Gaps

**Status**: Not started
**Pre-requisite**: None (independent of Storybook phases)
**Estimated sub-agents**: 7
**Run after**: Can run in parallel with Phases 1–3
**Run before**: Nothing

---

## Context

Read `.mpx/testing-framework/CONVENTIONS.md` for general conventions. The conflict reporting format in §4 applies here too.

This phase fills critical gaps in Vitest test coverage for TypeScript/Svelte business logic. The current coverage baseline is ~46 test files. Target: 80% coverage threshold (already enforced in `vite.config.ts`).

### Test layers in this project

| Layer                     | Command                         | When to use                                                        |
| ------------------------- | ------------------------------- | ------------------------------------------------------------------ |
| `server` (Node.js)        | `pnpm test -- --project=server` | Pure TS functions: sorting, filtering, data transformation, no DOM |
| `client` (Vitest browser) | `pnpm test -- --project=client` | Svelte components, DOM interactions: use `vitest-browser-svelte`   |

For context-based tests (functions that call `$state`, `$derived`, context factories): use `client` project.
For pure functions (no Svelte, no DOM): use `server` project.

### File naming

- Server tests: `src/lib/modules/foo/bar.test.ts`
- Browser/component tests: `src/lib/components/foo/bar.svelte.test.ts`
- Follow the pattern in existing tests.

### Pattern reference

Pure function test (server):

```ts
import { describe, it, expect } from 'vitest';
import { sortIssues } from './sort.js';

describe('sortIssues', () => {
	it('sorts by priority descending', () => {
		const issues = [makeIssue({ priority: 'low' }), makeIssue({ priority: 'top' })];
		const sorted = sortIssues(issues, 'priority');
		expect(sorted[0].priority).toBe('top');
		expect(sorted[1].priority).toBe('low');
	});
});
```

Browser component test (client):

```ts
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import MyComponent from './MyComponent.svelte';

describe('MyComponent', () => {
	it('renders and handles click', async () => {
		const onAction = vi.fn();
		await render(MyComponent, { props: { value: 'test', onAction } });
		const button = page.getByRole('button');
		await button.click();
		expect(onAction).toHaveBeenCalledWith('test');
	});
});
```

---

## Sub-agent Tasks

### Sub-agent 1 — IssuesContext Mutations

**Location**: `src/lib/modules/issues/issues.context.svelte.ts`
**Test file to create**: `src/lib/modules/issues/issues_mutations.svelte.test.ts`
**Test layer**: `client` (uses Svelte context, needs browser environment)
**Priority**: 🔴 Critical

> **File naming note**: The `client` vitest project includes `src/**/*.svelte.{test,spec}.{js,ts}`. The test file **must** end in `.svelte.test.ts` to be routed to the browser project. A plain `.test.ts` file would be picked up by the `server` (Node) project instead.

> **`invoke()` mocking**: `tauri_mock.ts` is a browser dev-mode interceptor, not a vitest setup file. In vitest tests, mock `@tauri-apps/api/core` explicitly: `vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }))`.

> **Reactive state note**: `addIssue()`, `updateIssue()`, `archiveIssue()`, and `removeIssue()` call `invoke()` and return the result, but they do **not** automatically update the local reactive `issues[]` array. The caller is responsible for refreshing. Test the serialization/deserialization behavior and the invoke call shape, not automatic local state updates.

**What to test**:

```ts
describe('IssuesContext — addIssue', () => {
    it('serializes labels array to JSON string before calling invoke', async () => {
        // invoke('create_issue') should receive labels as a JSON string
    });
    it('returns the created issue with labels deserialized from JSON string', async () => {
        // The returned issue.labels should be parsed back to array
    });
});

describe('IssuesContext — updateIssue', () => {
    it('partial update: only changed fields are passed to invoke', async () => { ... });
});

describe('IssuesContext — archiveIssue', () => {
    it('calls invoke with correct issue id and status change', async () => { ... });
});

describe('IssuesContext — removeIssue', () => {
    it('calls invoke with correct issue id', async () => { ... });
});
```

---

### Sub-agent 2 — Issue Sorting Derivations

**Location**: `src/lib/modules/issues/issues.context.svelte.ts` (the `sortedIssues` derived state)
**Test file to create**: `src/lib/modules/issues/issues_sorting.test.ts`
**Test layer**: `server` (sorting logic is pure TS, extract the sort function if needed)
**Priority**: 🟠 High

**What exists**: Priority ordering constants tested (2 tests). No tests for the actual sorting derivation.

**What to test**:

```ts
describe('sortIssues by priority', () => {
    it('orders: top > high > medium > low > lowest > null', () => { ... });
    it('issues with null priority sort to the end', () => { ... });
    it('stable sort: equal priorities maintain relative order', () => { ... });
});

describe('sortIssues by name', () => {
    it('sorts A-Z case-insensitive', () => { ... });
    it('handles unicode characters correctly via localeCompare', () => { ... });
    it('empty string sorts before non-empty', () => { ... });
});

describe('sortIssues by date', () => {
    it('sorts by sort_order ascending', () => { ... });
    it('when sort_order equal, sorts by created_at ascending', () => { ... });
});

describe('activeIssues / archivedIssues filters', () => {
    it('activeIssues excludes status=archived', () => { ... });
    it('archivedIssues excludes status=active', () => { ... });
    it('both derived arrays react to status change', () => { ... });
});
```

**Implementation note**: If the sorting function is embedded in `$derived` in the context, extract it to a pure helper function in a `sort.ts` file first (this is a minor refactor that improves testability). Then test the pure function.

---

### Sub-agent 3 — Session State Machine & Events

**Location**: `src/lib/modules/sessions/session_events.ts` (or similar)
**Existing tests**: `src/lib/modules/sessions/session_events.test.ts` (22 tests — read them first!)
**Test file to create**: `src/lib/modules/sessions/sessions_context.svelte.test.ts`
**Test layer**: `client`
**Priority**: 🟠 High

> **File naming note**: Must end in `.svelte.test.ts` to be routed to the `client` browser project.

> **`setSessionsContext` parameter**: `setSessionsContext(notifications: NotificationsApi)` requires a mandatory argument. Pass a no-op mock: `{ addPending: () => {}, clearPending: () => {} }`.

> **Do NOT duplicate**: message truncation (200 chars), cost/token accumulation, and notification action mapping (needs-input/running/errored/finished state transitions) are **already fully tested** in `session_events.test.ts`. Those tests cover `computeSessionEventEffects()` which is the implementation. Do not re-test the same logic at the context layer.

**What exists**: Session event parsing well-tested. Context integration (derived values) not tested.

**Read first**:

- `src/lib/modules/sessions/sessions.context.svelte.ts`
- `src/lib/modules/sessions/session_events.test.ts` (do not duplicate)

**What to add**:

```ts
describe('SessionsContext — derived state', () => {
    it('activeSessions excludes sessions with state=finished or errored', () => { ... });
    it('finishedSessions includes state=finished', () => { ... });
    it('sessionsByIssueId groups sessions correctly, excludes null issue_id', () => { ... });
});
```

---

### Sub-agent 4 — Usage Dashboard Filtering

**Location**: `src/lib/modules/usage/usage.context.svelte.ts` and `url_state.ts`
**Existing tests**: `src/lib/modules/usage/url_state.test.ts` (15+ tests — read them first!)
**Test file to create**: `src/lib/modules/usage/usage_filtering.test.ts`
**Test layer**: `server` for pure filter logic, `client` for context + timer tests
**Priority**: 🟡 Medium

**Read first**: `src/lib/modules/usage/usage.context.svelte.ts` and the existing url_state tests.

**What to add**:

```ts
describe('UsageContext — query building', () => {
    it('period=custom passes from/to dates to invoke', () => { ... });
    it('period=7d does NOT pass from/to dates', () => { ... });
    it('scope=workspace passes the current dashboardId', () => { ... });
    it('scope=global does NOT pass dashboardId', () => { ... });
    it('groupBy=none is omitted from the query (not passed as "none")', () => { ... });
    it('groupBy=provider is included in the query', () => { ... });
});

describe('UsageContext — freshness state transitions', () => {
    it('initial state is loading', () => { ... });
    it('data received → state becomes fresh', () => { ... });
    it('after 60s with no refresh, fresh → idle (use vi.useFakeTimers)', () => { ... });
    it('after another 60s (120s total), idle → stale', () => { ... });
    it('refreshing while stale → back to loading → fresh', () => { ... });
});

describe('UsageContext — timer cleanup', () => {
    it('both timers are cleared on context destroy', () => { ... }); // use vi.useFakeTimers
});
```

**Note**: Use `vi.useFakeTimers()` / `vi.advanceTimersByTime(60001)` for timer tests.

---

### Sub-agent 5 — Dependency Graph Filters

**Location**: `src/lib/modules/dependency-graph/`
**Existing tests**: `src/lib/modules/dependency-graph/filters.test.ts` — 9 tests exist (including `afkOnly AND area` combined filtering and case-insensitive `labelSearch` — read the file before adding tests to avoid duplication)
**Test file to expand**: Add more cases to the existing file
**Test layer**: `server`
**Priority**: 🟡 Medium

**Read first**: `src/lib/modules/dependency-graph/filters.ts` and `filters.test.ts`.

**What to add** (check existing tests first and add only what is genuinely missing):

```ts
describe('DependencyGraph filters — additional coverage', () => {
    it('area filter is exact match, not substring', () => { ... });
    it('showClosed=false with labelSearch still hides archived non-matching', () => { ... });
    it('empty labelSearch matches all labels', () => { ... });
});

describe('DependencyGraph — cycle detection guard', () => {
    // Note: cycle detection lives in the Rust backend (covered in Phase 5)
    // Only test here if there is a client-side guard
    it('adding A→B when B→A exists is rejected', () => { ... }); // if applicable
});
```

---

### Sub-agent 6 — Board Selection & URL State

**Location**: `src/lib/modules/board/`
**Existing tests**: `url_state.test.ts` (8 tests), `selection.test.ts` (8 tests), `board.test.ts`
**Read first**: All three test files + source files
**Test file to expand**: Identify gaps after reading
**Test layer**: `server`
**Priority**: 🟡 Medium

**Look for gaps**:

```ts
// url_state gaps
describe('Board URL state — edge cases', () => {
    it('unknown tab value in URL falls back to default tab', () => { ... });
    it('invalid issue ID in URL is accepted (validation is UI-level)', () => { ... });
    it('both issue and tab present serialize/deserialize correctly', () => { ... });
});

// selection gaps
describe('Board selection — restoreFromUrl', () => {
    it('restores issue + tab from URL state', () => { ... });
    it('null activeIssueId clears selection', () => { ... });
});

// board context gaps
describe('Board — palette assignment', () => {
    it('dashboard without palette gets next available color', () => { ... });
    it('multiple dashboards get different colors', () => { ... });
});
```

---

### Sub-agent 7 — AI Config TypeScript Logic

**Location**: `src/lib/modules/ai-config/`
**Existing tests**: None
**Test file to create**: `src/lib/modules/ai-config/ai_config.test.ts`
**Test layer**: `server`
**Priority**: 🟠 High

**Read first**: All files in `src/lib/modules/ai-config/` before writing anything.

> **Important**: Most AI config logic (discovery, skill override merging, MCP transport inference, provider capability matrix) lives in the **Rust backend** (`src-tauri/src/commands/ai_config_commands.rs`) and is covered by Phase 5. The TypeScript module is primarily a thin display layer. If the only client-side logic consists of display helpers (`getItemTitle`, `getItemDescription`, `getItemFilePath` etc.), note this in the Findings Report and write minimal tests for those helpers. Do NOT write tests for behavior that is actually implemented in Rust.

**If any meaningful client-side logic exists** (e.g., form validation, local state transformation, URL param serialization), write tests for that. Adapt the following based on what you actually find:

```ts
describe('AI Config — display helpers', () => {
    // Test any getItemTitle(), getItemDescription() etc. pure functions
    it('returns the item title for a skill', () => { ... });
    it('returns "(unnamed)" for items with no title', () => { ... });
});

// Only add these if the logic genuinely exists in TypeScript:
describe('AI Config — URL state', () => {
    // If there is URL param serialization/deserialization on the client side
    it('encodes provider filter in URL params', () => { ... });
});
```

---

## Conflict Reporting

After all sub-agents complete, the orchestrating agent must:

1. Collect all Findings Reports
2. Identify any violations found (incorrect logic, untested mutations, broken derivations)
3. Summarize bugs discovered during test writing
4. Present consolidated report with: what was tested, what was deferred, what bugs were found and fixed

---

## Completion Criteria

- All test files created
- `pnpm test` passes at 80%+ coverage threshold
- `pnpm check:all` passes
- Consolidated Findings Report produced
