# Review — Uncommitted changes on `dev`

## Actionable Checklist

### Important

- [ ] **Magic string coupling across modules** — `src/lib/tauri_mock.ts:496` + `src/lib/components/GitHubAuthWizard.svelte:71`
    - `mockInvoke` throws `"${command} requires the desktop app"`, wizard catches via `.includes('requires the desktop app')`. Silently coupled by untyped string fragment — if the error message changes, the wizard stops silently closing and shows a confusing error panel in browser mode.
    - **Fix**: Export a typed sentinel (e.g. `export class MockDesktopOnlyError extends Error {}`) from `tauri_mock.ts`, throw it instead of plain `Error`, catch with `instanceof` in the wizard.

- [ ] **Toast + handler dual behavior for TAURI_ONLY commands** — `src/lib/tauri_mock.ts:493-498`
    - Commands in both `TAURI_ONLY_COMMANDS` and `MOCK_COMMAND_HANDLERS` (e.g. `setup_worktree`, `spawn_session`) show a "not available" toast AND return mock data. Contradictory UX — user sees a warning but the call succeeds silently.
    - **Fix**: Clarify intent — if the handler exists, it means "simulate in browser mode" so skip the toast. If no handler, throw. Restructure: toast only when throwing.

- [ ] **Separate concerns in one changeset** — Design workflow changes (skills + 15 briefs + mockup restructure) are mixed with GitHub auth follow-up fixes. Zero coupling between them.
    - **Fix**: Commit separately — auth fixes in one commit, design workflow in another.

### Nice-to-Have

- [ ] **GitHubAuthWizard always mounted** — `src/routes/overview/+page.svelte:105`
    - Full component tree (6 icon imports, reactive state) initialized even when `authWizardOpen = false`. Wrap with `{#if authWizardOpen}` to defer.

- [ ] **Duplicated authWizard pattern** — `src/routes/overview/+page.svelte:18,105` + `src/routes/settings/+page.svelte`
    - Both pages independently declare `authWizardOpen` + mount `GitHubAuthWizard` with identical `onconnected` callback. Two instances is fine, but worth tracking before it spreads.

- [ ] **`github_logout` bypasses versionControl module** — `src/routes/settings/+page.svelte:190`
    - Disconnect button calls `invoke('github_logout')` directly instead of through the `versionControl` context. Leaks command name into view layer.

- [ ] **TAURI_ONLY_COMMANDS without handlers** — `src/lib/tauri_mock.ts`
    - `run_workspace_command` and `kill_workspace_process` have no mock handlers — will throw in browser mode. No callers yet, but latent trap. Add `() => null` stubs.

- [ ] **$effect cleanup ambiguity** — `src/lib/components/GitHubAuthWizard.svelte:212`
    - `clearAllTimers()` called both in effect cleanup and in `handleClose()`. Harmless double-clear but signals the effect is doing two jobs (trigger + cleanup).

## Post-Fix Review

**Fixed (3 of 8):**

- [x] Magic string coupling → extracted `MockDesktopOnlyError` to `src/lib/mock_desktop_only_error.ts`, thrown by `tauri_mock.ts`, caught with `instanceof` in wizard
- [x] GitHubAuthWizard always mounted → wrapped with `{#if authWizardOpen}` in overview page
- [x] TAURI_ONLY stubs → added `run_workspace_command` and `kill_workspace_process` handlers

**Not fixed (by design):**

- Toast + handler dual behavior — UX design decision, needs user input
- Separate concerns — commit organization, not a code fix
- Duplicated authWizard pattern — only 2 instances, premature to extract
- `github_logout` bypass — broader refactor, out of review scope
- $effect cleanup ambiguity — harmless, no functional impact

**Status: clean** — all autofix-eligible issues resolved, checks pass.
