# Review: PRD #88 & #89 — Execution Plan

**Scope:** PRs #124–#146 (merged into dev)
**Health:** fallow 99/A, 0 dead code, 0 duplication, maintainability 92.4

---

## Important (14 items)

### Performance

1. **Full forest re-layout on any single issue change** — `ForestView.svelte:70-121`
    - Inline arrow props (`getGitStatus`, `getSessionsForIssue`) from `+page.svelte` are recreated each render, invalidating the entire `entries` derivation.
    - **Fix:** Stabilize callback props via context-accessor functions instead of inline lambdas.

2. **O(n²) collision pass on every viewport resize** — `forest_layout.ts:88-144`
    - `enforceMinimumSpacing` O(n² × 10) triggered on every pixel of resize via `bind:clientWidth/clientHeight`.
    - **Fix:** Debounce viewport dimensions (100ms or rAF gate) before feeding into the layout derivation.

3. **Worktree-progress event rebuilds array via spread** — `issues.context.svelte.ts:100-103`
    - `[...existing, line]` per log line = O(n²) total allocation during worktree streaming.
    - **Fix:** Use mutable `.push()` on a `$state<string[]>` array, or `$state.raw` + reassign at intervals.

### Error Handling

4. **Silent failure after issue create — no double-click guard** — `CreationWizard.svelte:107-127`
    - `catch` only `console.error`s; no `isSubmitting` flag; rapid clicks create duplicates.
    - **Fix:** Add `isSubmitting` $state flag, disable button while submitting, surface error toast.

5. **Race condition in `startWorktreeListeners`** — `issues.context.svelte.ts:96-129`
    - Rapid `loadIssues` calls leak a live Tauri listener that's never unregistered.
    - **Fix:** Use `Promise.all` for both listen calls, or generation counter to discard stale registrations.

6. **`openUrl` errors silently swallowed** — `AssignedIssuesPanel.svelte:51-55`
    - Async function with no try/catch; throws in mock mode.
    - **Fix:** Wrap in try/catch with toast or silent catch.

### Code Quality

7. **Duplicated label color normalization** — `AssignedIssuesPanel.svelte:80-86`, `IssueDetail.svelte:90-96`, `IssueCard.svelte:402`
    - `startsWith('#') ? color : '#' + color` repeated; `deserializeLabels` already guarantees `#` prefix.
    - **Fix:** Remove the defensive normalization (serialization guarantees it).

8. **Duplicated PaneResizer markup** — `Resizer.svelte:26-30`, `WorkspaceDashboardLayout.svelte:46-50`
    - Identical resizer handle visual duplicated.
    - **Fix:** Extract shared `StyledPaneResizer.svelte` component.

9. **Two GitHub availability props** — `WorkspaceBottomPanel.svelte:38,49`
    - `ghAvailable` and `isGhAvailable` = same boolean, different names.
    - **Fix:** Consolidate to single `ghAvailable` prop.

10. **`PRIORITY_BADGE_CLASSES` missing `medium`** — `issue_card_utils.ts:15-20`
    - `Partial<Record>` silently returns `undefined` for medium; inconsistent with complete `PRIORITY_BORDER_CLASSES`.
    - **Fix:** Add `medium: null` explicitly with `satisfies Record<...>` for exhaustiveness.

### Best Practices

11. **`$effect` for state reset + focus-on-mount** — `StepGithubSearch.svelte:29-40`, `StepIssueName.svelte:19-25`
    - Three effects that should be cleaner:
        - Line 30: Replace `previousDisplayLength` closure with `void displayItems.length; untrack(() => { selectedIndex = 0; })`
        - Line 38: Convert to `onMount` (focus fires once)
        - `StepIssueName:19`: Convert to `onMount` (focus fires once)

12. **Unsafe `as` type assertions at IPC boundary** — `serialization.ts:35-37`, `issues.context.svelte.ts:119`
    - `raw.priority as IssuePriority`, `newState as WorktreeState` — no runtime validation.
    - **Fix:** Add narrow guards (check value is in allowed set) before casting.

### Security

13. **No backend validation of `branch_name`** — `worktree_commands.rs:266-278`
    - Frontend sanitizes via `toGitSafeSlug`, but Rust accepts raw String from IPC.
    - **Fix:** Validate in Rust: `^[a-zA-Z0-9/_.-]+$`, max 100 chars.

14. **Path traversal via `local_folder`** — `raw_requirements_commands.rs:11-27`
    - `PathBuf::from(local_folder).join(".mpx")` — absolute path bypasses containment.
    - **Fix:** Canonicalize and assert path starts within allowed workspace root.

---

## Nice-to-Have (HIGH confidence only — 10 items)

| #   | Finding                                                  | Resolution                                                        | File                                                       |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| N1  | `entries.map(e => e.layoutItem)` fresh array in $derived | Extract to separate `$derived`                                    | `ForestView.svelte:117`                                    |
| N2  | `save()` failure loses data silently                     | Add error $state to context, surface inline error in modal        | `raw_requirements.context.svelte.ts:57-68`                 |
| N3  | `worktreeProgressState` not reset on Escape close        | Reset in `handleOpenChange(false)`                                | `CreationWizard.svelte:31`                                 |
| N4  | `ForestWorktreeState` type alias = `WorktreeState`       | Remove alias, use `WorktreeState` directly                        | `visualization/types.ts:22`                                |
| N5  | Magic `'HITL'`/`'AFK'` strings in 2 locations            | Extract to `SPECIAL_LABELS` const in `visualization/constants.ts` | `tree_computation.ts:201`, `DependencyGraphNode.svelte:18` |
| N6  | `handleContextMenuAction` silently ignores unimplemented | Convert to `switch` with explicit cases                           | `ForestView.svelte:218-233`                                |
| N7  | Duplicated `PrdOverview` render block                    | Compute `showPrdOverview` boolean, render once                    | `WorkspaceBottomPanel.svelte:165,272`                      |
| N8  | Unsafe cast `item as SearchedGithubIssue`                | Create shared `GithubIssueBase` interface, narrow param type      | `StepGithubSearch.svelte:50,115`                           |
| N9  | `wilting` stage not in PRD spec                          | Add to PRD #88 body as addendum (spec update only)                | PRD #88                                                    |
| N10 | djb2 hash called "mulberry32" in PRD                     | Update PRD wording to "deterministic seed hash"                   | PRD #88                                                    |

---

## Skipped (LOW confidence / not actionable)

- `isDarkMode` prop removal + color row-reorder: needs new algorithm design, would break grid layout
- `autoAdvanceWithNotice` timer: timer ID scope unclear, low-severity edge case
- `ForestContextMenu` focus on open: all items currently disabled, focusing disabled items confuses screen readers
- `PrdOverview.svelte` i18n: strings need paraglide key design, not a quick fix
- SvelteMap inside `$derived.by`: enforced by `svelte/prefer-svelte-reactivity` lint rule, overhead negligible
