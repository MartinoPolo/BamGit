# PRD Review: PRD-89 — Issue Management & Creation

Generated: 2026-05-07 | Sub-issues: #131, #132, #133, #134, #135, #136, #148, #169, #172, #173, #174, #181, #187, #198, #204 | PRs: #138, #141, #142, #144, #145, #146, #149, #170, #175, #177, #182, #185, #189, #190, #201, #211

## Summary

PRD #89 delivered the full issue management system across 16 PRs and 15 sub-issues (~140 files changed). The implementation is comprehensive — creation wizard, color system, issue cards, assigned issues panel, quick ideas, lifecycle dialogs, and batch selection are all functional. Review found 3 critical (security + error handling), 12 important, and 6 minor items after confidence evaluation. All critical and most important items have been resolved.

## Critical — All Resolved

### 1. Security — GraphQL injection via `branch_name` in bulk sync query

- [x] **File:** src-tauri/src/commands/github_commands.rs:139
- **Finding:** `branch_name` values interpolated with only `"` and `\` escaped; `{` and `}` could break GraphQL context.
- **Fix applied:** Added `{`/`}` escaping + `validate_branch_name_chars` in `update_issue`.

### 2. Security — Path traversal in worktree and Peacock commands

- [x] **File:** src-tauri/src/commands/worktree_commands.rs:303, :429, :583
- **Finding:** `working_directory` and `worktree_folder` accepted without canonicalization.
- **Fix applied:** Added `validate_path_exists` using `std::fs::canonicalize` in all 3 commands.

### 3. Error Handling — Wizard submission: orphaned issue + stuck `isSubmitting`

- [x] **File:** src/lib/components/creation-wizard/CreationWizard.svelte:187-229
- **Finding:** `onUpdate` failure left duplicate-prone wizard open; `isSubmitting` never reset on worktree path.
- **Fix applied:** Inner try/catch for `onUpdate`, `finally { isSubmitting = false; }`.

## Important — Resolved

### 4. Error Handling — `handleAction` swallows all errors silently

- [x] **File:** src/routes/+page.svelte:196-209
- **Fix applied:** Added toast notification on catch via `toastsCtx.show()`.

### 5. Error Handling — No timeout on `gh` CLI invocations

- [x] **File:** src-tauri/src/commands/github_commands.rs:82-102
- **Fix applied:** Wrapped with `tokio::time::timeout(Duration::from_secs(30), ...)`.

### 6. Error Handling — Partial-prune leaves dialog open

- [x] **File:** src/routes/+page.svelte:445-468
- **Fix applied:** Moved `pruneDialogOpen = false` to `finally` block.

### 12. Code Quality — Near-duplicate `handleRemoveWorktree` functions

- [x] **File:** src/routes/+page.svelte:348, :389
- **Fix applied:** Deleted `handleRemoveWorktreeForIssue`, unified to `handleRemoveWorktree`.

### 13. Code Quality — `isDarkMode` prop threaded through 5 layers, never used

- [x] **File:** src/lib/components/color-picker/color_picker_types.ts + 6 call sites + Storybook
- **Fix applied:** Removed from all interfaces, components, and stories.

### 15. Code Quality — `resolveGlowOverlay` returns identical objects for hover and active

- [x] **File:** src/lib/modules/visualization/forest_interaction.ts:17-35
- **Fix applied:** Merged hover/active branches into single `||` condition.

### 18. Spec — Priority-colored left border (intentionally dropped)

- [x] **File:** src/lib/components/issue_card_utils.ts
- **Fix applied:** Deleted dead `getPriorityBorderClass` and `PRIORITY_BORDER_CLASSES` + tests.

### 19. Spec — Collapse/expand toggle (intentionally dropped)

- [x] **File:** src/lib/components/IssueCard.svelte + issue_card_utils.ts
- **Fix applied:** Removed `issueExpandedStates`, `isExpandedStates`, `persistedExpanded` + tests.

### 20. Spec — Initial assigned issues load is 20, not 10

- [x] **File:** src/lib/modules/version-control/version_control.context.svelte.ts:185
- **Fix applied:** Changed to 10.

### 22. Cleanup — `issue_detail_utils.ts` never imported in production

- [x] **Files deleted:** issue_detail_utils.ts + issue_detail_utils.test.ts

### 23. Cleanup — `computeSelectAllCheckboxState` never used in production

- [x] **File:** src/lib/components/batch_selection_utils.ts
- **Fix applied:** Removed function, type, and test block.

### 29. Spec — Responsive badge compaction

- [x] **File:** src/lib/components/IssueCard.svelte
- **Fix applied:** Labels show first 3 with "+N" overflow badge and tooltip listing hidden labels.

### 31. Spec — Smart naming takes 4 words, spec says ~5

- [x] **File:** src/lib/modules/creation-wizard/smart_naming.ts:126
- **Fix applied:** Changed to `words.slice(0, 5)` + updated 10 test expectations.

### 34. Code Quality — Unsafe `.unwrap()` on filtered `Option`

- [x] **File:** src-tauri/src/commands/github_commands.rs:564
- **Fix applied:** Replaced with `filter_map`.

### 36. Performance — `onpointermove` updates `isModifierHeld` on every pixel

- [x] **File:** src/lib/components/IssueCardList.svelte:219
- **Fix applied:** Added change guard `if (next !== isModifierHeld)`.

### 38-41. Cleanup — Over-exported types

- [x] **Files:** creation-wizard/index.ts, types.ts, issues/index.ts
- **Fix applied:** Removed `WizardResult`, `WizardStep`, `WizardFormData`, `SearchedGithubIssue` re-export, `SortMode`, `IssueStatus`.

## Important — Dropped (LOW confidence after verification)

### 7. `startWorktreeListeners` failure blocks issue list

- **Dropped:** `listen()` is a Tauri API that registers callbacks — unlikely to throw. Issues already loaded before listener setup.

### 8. `getVisualization` recomputes on every render

- **Dropped:** `computeVisualization` is lightweight (milliseconds). Impact negligible at current scale (~20 issues).

### 9. `childrenByParentId` computed in both ForestView and issues context

- **Dropped:** Different data sets — ForestView uses `allIssues`, context uses `activeIssues`. Not a true DRY violation.

### 10. `worktree-state-change` replaces entire issues array

- **Dropped:** Standard Svelte reactivity pattern. `$state()` arrays require replacement to trigger updates.

### 11. `getDerivedActions` called per-card on every render

- **Dropped:** Lightweight object construction + function call. No measurable impact.

### 16. `:global()` card state classes leak into global stylesheet

- **Dropped:** Class names are specific enough (`card-state-active-ic`) that collision is extremely unlikely.

### 17. `$derived` sort allocates new array on every reactive update

- **Dropped:** Standard `[...arr].sort()` pattern. Correct and idiomatic Svelte.

### 21. CreationWizard owns submission logic that belongs in context

- **Dropped:** Architecture concern — deferred per user direction.

### 24. `+page.svelte` is a God File

- **Dropped:** Architecture concern — deferred per user direction.

### 26. `autoAdvanceWithNotice` timer never cancelled

- **Dropped:** `skipNotice` guard prevents stale execution. Timer fires but does nothing when wizard is closed.

## Minor — Dropped / Deferred

### 14. Duplicated label badge inline styles — deferred (complex to extract, low impact)

### 25. Quick-action buttons mis-wired — tracked as **#229** (AFK issue created)

### 27. Toggle to revert — dropped per user direction

### 28. Info tooltip on hover — dropped per user direction

### 30. Rename dialog state migration — dropped (outdated spec, rename should not change branch)

### 32-33, 35, 37, 42-43 — deferred (low priority cleanup)

## Documentation Updates — All Resolved

- [x] `.mpx/VOCABULARY.md` — Fixed "highest" → "top"; added Creation Wizard, Quick Ideas, Canopy Color Adaptation, Assigned Issues Panel
- [x] `.mpx/ROADMAP.md` — Updated PRD #89 to "Complete"; updated metrics (83 commands, 14 tables, 16 modules, 5 routes)
- [x] `.mpx/REQUIREMENTS.md` — Updated smart naming spec
- [x] `README.md` — Added `quick-ideas/` route; added `creation-wizard/` and `raw-requirements/` modules

## Unresolved Items

### Already Tracked

- #92 — Quick Ideas "Process" button stub (blocked on PRD #90)
- #91 — PRD sub-issues count via GitHub GraphQL
- #203 — IssueCard tree thumbnail placeholder
- #90, #91 — Context menu Open GitHub / Open Worktree / Start Session handlers
- #229 — IssueCard quick-action buttons mis-wired (created during this review)

## Architecture Promotion Candidates

- **+page.svelte God File decomposition** — 663 lines, 32 functions, 6 responsibilities. Recommended for future `/mp-architecture-review`.
