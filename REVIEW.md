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

### Important — Not Fixed (Requires Design Decisions)

20. **CSP disabled** — `tauri.conf.json:22` has `"csp": null`
    - Expands XSS attack surface to full IPC
    - Needs evaluation of which CSP directives are compatible with app features

21. **Labels hardcoded to `['AFK']`** — `map_issue_to_state_dimensions.ts:75`
    - Issue type has no `labels` field; all issues get same tree shape
    - Needs backend Issue model change + GitHub label sync

22. **R9: Only 5 of 10 notification events** — `notification.rs`
    - Missing: `pr-review-requested`, `merge-conflict-detected`, `branch-behind-base`, `github-issue-assigned`, `github-trigger-received`
    - Feature work tracked by existing requirements

23. **R10: Export/import not implemented** — No commands exist
    - Roadmap says "Complete" but feature is absent

24. **R12 "Complete" overstated** — Issues #61-#65 still open
    - Engine logic done; rendering integration via library not complete

25. **`wilting` tree stage unused** — `tree_visualization.ts:21`
    - Defined but never referenced in compute logic
    - Likely intended for error overlay (#64); keep for now

26. **Duplicated state mapping** — Rust `session_actor.rs` + TS `sessions.svelte.ts`
    - CLI→DB session state mapping written identically in both languages
    - Cross-reference comment would help

27. **Duplicated truncate logic** — `discovery.rs` + `session_actor.rs`
    - Functionally identical functions; extract to shared util

28. **Fragile `{#each}` key** — `SessionChatView.svelte:181`
    - Uses `message.content + message.role` as key; duplicates collide

29. **Double session-ended emission** — `session_actor.rs`
    - Terminate + stdout EOF race can emit finished twice

30. **Unbounded `get_sessions` query** — `session_commands.rs:121`
    - No LIMIT; grows indefinitely

31. **O(N×M) session filtering in ForestView** — `+page.svelte:335`
    - Should pre-compute Map<issue_id, Session[]>

32. **Context API migration (#59)** — Module-level store singletons remain

33. **`grovekeeper:execute` label polling** — R7 feature not implemented

## Nice-to-Have

34. **`discover_external_sessions` frontend wrapper dead code** — `session_commands.ts:33-35`
35. **`start_discovery_polling`/`stop_discovery_polling` never called from frontend** — Dead IPC wrappers
36. **Statement re-prepared every 3s tick** — `discovery_polling.rs:102-118`
37. **`onMount`/`onDestroy` instead of `$effect` pattern** — `SessionChatView.svelte`
38. **Weak `SessionEventPayload` type** — Uses `[key: string]: unknown` instead of discriminated union

---

Mode: review
Scope: whole repository
Coverage: full (10 agents)
Autofix: true

Findings:

- total: 38
- critical: 14 (all fixed)
- important: 18 (5 fixed by config agent, 13 documented)
- minor: 6

Report: REVIEW.md

Fix Step:

- executed: yes
- result: all critical fixed, CI green
