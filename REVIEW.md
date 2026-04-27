# Architecture Rewrite Review

Full six-dimension review of the deep module architecture rewrite.

## Actionable Checklist

### Critical

- [x] **`DatabaseState::read()`/`write()` panic on failure** — `src-tauri/src/database/connection.rs:17,21`. Both methods use `.expect()` which panics the Tauri process on pool exhaustion or mutex poisoning. A poisoned mutex (from any prior panic while holding the write guard) makes every subsequent `write()` call crash the app permanently until restart. Change signatures to return `Result<..., String>` and propagate with `?` in the ~60 command call sites.

### Important

- [x] **`serializeLabels` unsound type cast** — `src/lib/modules/issues/index.svelte.ts:121-126`. `return undefined as unknown as string | null` bypasses the type system to smuggle `undefined` through a `string | null` return type. Fix: change return type to `string | null | undefined`, or inline the serialization at call sites using conditional spread.

- [x] **`SvelteMap` / `Map` type mismatch in reactive state** — `src/lib/modules/issues/index.svelte.ts:152` and `src/lib/modules/version-control/index.svelte.ts:26,35`. State variables are typed as `Map<K,V>` but initialized with `new Map()` (non-reactive) while mutations create `SvelteMap` instances. The initial read before any mutation won't track reactivity. Declare as `$state<SvelteMap<K,V>>(new SvelteMap())` consistently.

- [x] **`SvelteMap` full-copy on every event** — `src/lib/modules/issues/index.svelte.ts:192`, `src/lib/modules/notifications/index.svelte.ts:90,99`. Each `worktree-progress` event (dozens per second during setup) copies the entire map via `new SvelteMap(existing)`. Since `SvelteMap` is itself reactive, in-place `.set()`/`.delete()` on the existing instance triggers reactivity without a full copy.

- [x] **`$effect` used for one-shot (should be `onMount`)** — `src/routes/issues/+page.svelte:88-90`. `$effect(() => { versionControlStore.checkAvailability(); })` has no reactive dependencies, runs once on mount. Use `onMount` per Svelte 5 conventions.

- [x] **`onMount` listen race in sessions** — `src/lib/modules/sessions/index.svelte.ts:63-78`. If the layout component is destroyed before both async `listen()` calls resolve, the listeners leak (resolve after `onDestroy` fires). Use an `AbortController`-style cancelled flag: check after each `await listen()` and clean up immediately if cancelled.

- [x] **`getNotificationDotColor` O(sessions) per issue** — `src/routes/issues/+page.svelte:35-49`. Iterates all `sessionStore.sessions` for each issue card. Use `sessionStore.sessionsByIssueId.get(issueId)` instead to iterate only that issue's sessions.

- [x] **`getChildren` O(n) per parent in render loop** — `src/lib/modules/issues/index.svelte.ts:177-179`. Linear scan of `activeIssues` called per parent during render. Replace with a `$derived` map keyed by `parent_issue_id` built in a single O(n) pass.

- [x] **`loadAssignedIssues` silently swallows errors** — `src/lib/modules/version-control/index.svelte.ts:169-178`. Only `console.error`; no `error` state set. Every other method in this module sets `error`. Add `error = String(err)` in the catch block.

- [x] **`GitHubStatusCache` is a dead generated type** — `src/lib/types/generated/GitHubStatusCache.ts`. Identical shape to `GitStatusCache`, unreferenced in frontend. Remove `#[derive(TS)]` + `#[ts(export)]` from `GitHubStatusCache` in `src-tauri/src/models/github.rs:61-62`.

- [x] **`computeVisualization` discards context parameter** — `src/lib/modules/visualization/index.ts:591`. Passes `undefined` for `context` to `computeTreeVisualization`, meaning `hasCompletedSession`, `hasCommitsOnBranch`, `sessionCount`, etc., all default to zero. Either add a `context` parameter or document the limitation.

- [x] **Label color CSS injection** — `src/lib/components/IssueCard.svelte` (style binding). GitHub label `color` from `gh` CLI is rendered in inline CSS without hex format validation. Add a regex guard (`/^#[0-9a-fA-F]{6}$/`) in `deserializeLabels` or the Rust `parse_label_nodes_to_json`.

- [x] **`VersionControlState` struct not created — `stateMap` typed as `GitStatusCache`** — `src/lib/modules/version-control/index.svelte.ts:35`. The spec required a new Rust `VersionControlState` merging both cache types. The implementation reuses `GitStatusCache` directly. The frontend merge is complete (single `stateMap`), but the Rust-side unification was skipped. Two structurally identical types (`GitStatusCache` and `GitHubStatusCache`) still exist in the Rust model layer. Consider either creating the unified struct or removing `GitHubStatusCache` and using `GitStatusCache` everywhere.

- [x] **Visualization module exports internal symbols** — `src/lib/modules/visualization/index.ts`. `TREE_STAGES`, `POTTED_PLANT_STAGES`, `TOOL_TYPES`, `StateDimensions`, `aggregateSessionState`, `mapIssueToStateDimensions`, and `computeTreeVisualization` are all exported despite the deep-module goal of 2 entry points. These are consumed only by the test file. Consider re-exporting them from a `testing.ts` sub-module or using `@internal` annotations.

- [x] **`handleSessionEvent`/`handleDiscoveredSessionsUpdate` on public context** — `src/lib/modules/sessions/index.svelte.ts:181-182`. These internal event handlers are part of the returned context object, accessible to any `useSessions()` consumer. The event listener wiring in `setSessionsContext` should close over factory internals instead of calling methods on the public object.

- [x] **`ForestLayoutResult` not exported** — `src/lib/modules/visualization/index.ts:646`. Declared as `interface` (not `export interface`). Callers must use `ReturnType<typeof computeForestLayout>` instead of the named type.

### Nice-to-Have

- [x] **`load`/`refresh` near-duplication** — sessions, actions, board modules each have `load*()` (sets loading flag) and `refresh()` (skips loading flag) methods making the same IPC call. Consider extracting a shared `fetchAndSet(showLoading: boolean)` helper.

- [x] **Rust enum `as_str`/`FromSql`/`ToSql` boilerplate** — `SessionState`, `ExecutionPhase`, `SessionSource`, `PullRequestState` each manually implement 30+ lines of identical patterns. A macro (`impl_sql_enum!`) would eliminate duplication.

- [x] **`NotificationConfig.event_type` is `String` in Rust** — `src-tauri/src/models/notification.rs:32`. The typed `NotificationEventType` enum exists but the DB model uses raw `String`. Use the enum with `FromSql`/`ToSql` for compile-time safety.

- [x] **Notifications module has no `error` state** — `src/lib/modules/notifications/index.svelte.ts`. Only module without a reactive `error` field. Add `let error = $state<string | null>(null)`.

- [x] **`syncAll` null return ambiguity** — `src/lib/modules/version-control/index.svelte.ts:91-125`. Returns `null` for both "already syncing" and "actual error" — callers can't distinguish. Consider a discriminated result type.

- [x] **`issues.cleanup()` never called** — `src/lib/modules/issues/index.svelte.ts:343`. `stopWorktreeListeners()` is exposed but never invoked from layout `onDestroy`. Either wire it up or remove the dead method.

- [x] **`issues/+page.svelte` at 376 lines (spec target: ~150-200)** — Script block is 262 lines of thin event handler wrappers. The handlers follow a repetitive try/catch/console.error pattern that could be factored out.

- [x] **`refreshAllForDashboard` makes N+1 IPC round trips** — `src/lib/modules/version-control/index.svelte.ts:139-158`. Fetches all statuses, then fires N parallel `refresh_git_status` calls. Consider a batch Tauri command when N grows large.

- [x] **`TREE_SHAPES` private but externally needed** — `src/lib/modules/visualization/index.ts:35-50`. Not exported, but used to build `DEFAULT_LABEL_MAPPINGS`. Consumers needing custom `LabelShapeMappingEntry` must use raw strings.

- [x] **Migration error masking** — `src-tauri/src/database/migrations.rs:247,380`. If `PRAGMA foreign_keys = ON` fails after a migration error, the original error is lost. Combine both errors in the message.

- [x] **`spawnSession` returns `Promise<string>` not `Promise<Session>`** — `src/lib/modules/sessions/index.svelte.ts:213`. Returns session ID, not the full Session object. Callers must call `refresh()` afterwards. Consider fetching and returning the full Session.

- [x] **`reorderIssues` missing from Issues module** — `src/lib/modules/issues/index.svelte.ts`. No `reorderIssues(ids: string[])` method despite being in the module's planned interface. **Skipped**: no `reorder_issues` Rust command exists in `src-tauri/src/`. Only `reorder_actions` is implemented. Frontend method cannot be added without the backend command.
