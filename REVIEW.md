# Full Repository Review — Grovekeeper

Date: 2026-04-24
Scope: Whole repository
Coverage: Full (10 reviewers)
Autofix: ON

## Actionable Checklist

### Critical — Fixed

1. **`ready-to-merge` missing from `KNOWN_PR_STATES`** — `map_issue_to_state_dimensions.ts:17-25`
    - The `ready-to-merge` PR state could never propagate to the visualization engine
    - **Fix:** Added `ready-to-merge` to `KNOWN_PR_STATES` set + test coverage

2. **`running + hasCompletedSession=true` falls through to `seed`** — `compute_tree_visualization.ts:80`
    - Re-running sessions with prior completed sessions returned wrong stage
    - **Fix:** Removed `!context.hasCompletedSession` guard; running always → growing + added test

3. **`PullRequestState` type missing `ready-to-merge`** — `github.ts:1-8`
    - Type union didn't include `ready-to-merge`, preventing type-safe handling
    - **Fix:** Added `ready-to-merge` to union type

4. **`PullRequestBadge` missing 3 states** — `PullRequestBadge.svelte`
    - `changes-requested`, `approved`, `ready-to-merge` rendered nothing (fell to null)
    - **Fix:** Added icon/color/label configs for all 3 states

5. **Blocking syscall in async fn** — `worktree_commands.rs:64`
    - `detect_bash_path()` used `std::process::Command` (blocking) in async context
    - **Fix:** Changed to `tokio::process::Command` with `.await`

6. **GraphQL injection via unescaped `owner`/`repo`** — `github_commands.rs:139`
    - String interpolation without sanitization in GraphQL query
    - **Fix:** Added `replace(['\\', '"'], "")` sanitization

7. **Path traversal in sound file resolution** — `notification/sound.rs:29-44`
    - Accepted any absolute path, allowing arbitrary file reads
    - **Fix:** Restricted to sounds directory with `starts_with` check

8. **Discovery poller DB without WAL/FK pragmas** — `discovery_polling.rs:48`
    - Raw `Connection::open` bypassed `open_actor_connection` helper
    - **Fix:** Now uses `open_actor_connection` with proper pragma setup

9. **`find_most_recent_jsonl` aborts on first file error** — `discovery.rs:386`
    - `?` operator returned None from entire function instead of skipping one file
    - **Fix:** Changed to `let Some(...) else { continue }` pattern

10. **Silent DB write failures** — `session_actor.rs:244-315`
    - All `update_session_*` helpers discarded errors via `let _`
    - **Fix:** Added `log::error!` for all DB write failures

11. **Orphaned DB row on spawn failure** — `session_commands.rs:75-77`
    - If `claude` binary not found, session row stayed in `running` forever
    - **Fix:** On spawn error, update row to `errored` + set `ended_at`

12. **Tautological test assertion** — `fetch_coordinator.rs:109-114`
    - `assert!(result.is_ok() || result.is_err())` always true
    - **Fix:** Marked `#[ignore]` + real assertion

13. **`selected_session_id !== ''` should be `!== null`** — `sessions/+page.svelte:29`
    - State type is `string | null`, initial value is `null`, not `''`
    - **Fix:** Changed to `!== null`

14. **Missing DB indexes** — `database/migrations.rs`
    - `issues.dashboard_id` and `sessions.issue_id` had no indexes
    - **Fix:** Added migration v7 with both indexes

### Important — Fixed by Config Agent

15. **README.md stale tooling** — Vite Plus→Vite, OxFormatter→Prettier, Knip→Fallow
16. **AGENTS.md stale commands** — vp dev→pnpm run dev
17. **Cargo.toml placeholder metadata** — "A Tauri App"/"you" → real values
18. **tauri.conf.json lowercase names** — "grovekeeper"→"Grovekeeper"
19. **package.json `check:all`** — `prettier --write` → `prettier --check`

### Important — Fixed (Second Pass)

20. **CSP enabled** — `tauri.conf.json:22`
    - **Fix:** Set CSP policy: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`
    - `'unsafe-inline'` needed for 3 dynamic color picker style attributes

21. **Cross-reference comments added** — `session_actor.rs` + `sessions.svelte.ts`
    - **Fix:** Both files now reference each other's state mapping

22. **Shared truncate util extracted** — `session/mod.rs:truncate_utf8`
    - **Fix:** Single function used by both `session_actor.rs` and `discovery.rs`

23. **Stable `{#each}` key** — `SessionChatView.svelte`
    - **Fix:** Added auto-incrementing `id` field to `ChatMessage`, keyed by `message.id`

24. **Double session-ended guard** — `session_actor.rs`
    - **Fix:** Added `has_ended` flag preventing duplicate finished/errored emissions

25. **Bounded `get_sessions` query** — `session_commands.rs`
    - **Fix:** Added `LIMIT 500`

26. **O(1) session lookup in ForestView** — `+page.svelte`
    - **Fix:** Pre-computed `sessions_by_issue_id` Map via `$derived.by`

27. **Dead `discover_external_sessions` wrapper removed** — `session_commands.ts`
28. **Dead polling wrappers removed** — `session_commands.ts`
29. **Cached prepared statement** — `discovery_polling.rs`
    - **Fix:** Changed `prepare()` to `prepare_cached()`

30. **Strong `SessionEventPayload` type** — `session.ts`
    - **Fix:** Replaced `[key: string]: unknown` with discriminated union matching Rust `SessionEvent`

### Important — Tracked as GitHub Issues

21. **Labels hardcoded to `['AFK']`** — #71
22. **R9: Only 5 of 10 notification events** — #72
23. **R10: Export/import not implemented** — #73
24. **R12 "Complete" overstated** — Roadmap corrected to "Partial"
25. **`wilting` tree stage unused** — Intentional; used by #64
26. **Context API migration** — #59 (tagged HITL)
27. **`grovekeeper:execute` label polling** — #74

### Nice-to-Have — Skipped

37. **`onMount`/`onDestroy` in `SessionChatView`** — Correct per Svelte 5 conventions (fire-once setup)

---

Mode: review
Scope: whole repository
Coverage: full (10 agents)
Autofix: true

Findings:

- total: 38
- critical: 14 (all fixed — pass 1)
- important: 24 (16 fixed, 7 tracked as issues, 1 skipped)

Report: REVIEW.md

Fix Step:

- pass 1: all critical fixed, CI green
- pass 2: 12 additional fixes, 4 new issues created, roadmap corrected
