use rusqlite::{params, Connection};
use tauri::State;

use crate::database::connection::DatabaseState;
use crate::database::defaults::seed_label_shape_mappings_for_dashboard;

const DEMO_DASHBOARD_ID: &str = "demo-forest-workspace";

struct DemoIssue {
    index: u32,
    name: &'static str,
    worktree_state: &'static str,
    branch_name: Option<&'static str>,
    base_branch: Option<&'static str>,
    parent_index: Option<u32>,
    labels: &'static str,
    status: &'static str,
    color: Option<&'static str>,
    github_issue_number: Option<i32>,
    github_issue_url: Option<&'static str>,
    priority: Option<&'static str>,
}

struct DemoGitCache {
    issue_index: u32,
    branch_status: &'static str,
    pr_state: Option<&'static str>,
    pr_number: Option<i32>,
    behind_base_count: i32,
    merge_conflict: bool,
    github_issue_state: Option<&'static str>,
    has_local_changes: bool,
    ahead_remote_count: i32,
}

struct DemoDependency {
    blocker_index: u32,
    blocked_index: u32,
}

struct DemoSession {
    index: u32,
    issue_index: u32,
    state: &'static str,
    execution_phase: &'static str,
}

const DEMO_ISSUES: &[DemoIssue] = &[
    // === PRD 1: Forest Visualization (index 0) ===
    DemoIssue { index: 0, name: "PRD: Forest Visualization", worktree_state: "none", branch_name: None, base_branch: None, parent_index: None, labels: r##"[{"name":"prd","color":"#ff6b6b"}]"##, status: "active", color: Some("#e6194b"), github_issue_number: Some(100), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/100"), priority: Some("top") },
    DemoIssue { index: 1, name: "Seed: Just an idea", worktree_state: "none", branch_name: None, base_branch: None, parent_index: Some(0), labels: r##"[{"name":"task","color":"#22c55e"},{"name":"AFK","color":"#6366f1"}]"##, status: "active", color: Some("#3cb44b"), github_issue_number: Some(101), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/101"), priority: Some("low") },
    DemoIssue { index: 2, name: "Sprouting: Worktree pending", worktree_state: "pending", branch_name: None, base_branch: None, parent_index: Some(0), labels: r##"[{"name":"feature","color":"#3b82f6"}]"##, status: "active", color: Some("#ffe119"), github_issue_number: Some(102), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/102"), priority: Some("medium") },
    DemoIssue { index: 3, name: "Sprouting: Worktree failed", worktree_state: "failed", branch_name: None, base_branch: None, parent_index: Some(0), labels: r##"[{"name":"bug","color":"#ef4444"}]"##, status: "active", color: Some("#4363d8"), github_issue_number: Some(103), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/103"), priority: Some("high") },
    DemoIssue { index: 4, name: "Sapling: Ready to work", worktree_state: "active", branch_name: Some("4-sapling-ready"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"feature","color":"#3b82f6"}]"##, status: "active", color: Some("#f58231"), github_issue_number: Some(104), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/104"), priority: Some("medium") },
    DemoIssue { index: 5, name: "Growing: Session running", worktree_state: "active", branch_name: Some("5-growing-running"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"task","color":"#22c55e"}]"##, status: "active", color: Some("#911eb4"), github_issue_number: Some(105), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/105"), priority: Some("high") },
    DemoIssue { index: 6, name: "Growing: Needs input", worktree_state: "active", branch_name: Some("6-growing-input"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"task","color":"#22c55e"},{"name":"HITL","color":"#f59e0b"}]"##, status: "active", color: Some("#42d4f4"), github_issue_number: Some(106), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/106"), priority: Some("medium") },
    DemoIssue { index: 7, name: "Growing: Session errored", worktree_state: "active", branch_name: Some("7-growing-errored"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"bug","color":"#ef4444"}]"##, status: "active", color: Some("#f032e6"), github_issue_number: Some(107), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/107"), priority: Some("high") },
    DemoIssue { index: 8, name: "Growing: Session paused", worktree_state: "active", branch_name: Some("8-growing-paused"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"refactor","color":"#8b5cf6"}]"##, status: "active", color: Some("#bfef45"), github_issue_number: Some(108), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/108"), priority: Some("low") },
    DemoIssue { index: 9, name: "Leafy: Commits no PR", worktree_state: "active", branch_name: Some("9-leafy-commits"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"feature","color":"#3b82f6"}]"##, status: "active", color: Some("#fabed4"), github_issue_number: Some(109), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/109"), priority: Some("medium") },
    DemoIssue { index: 10, name: "Leafy: Draft PR", worktree_state: "active", branch_name: Some("10-leafy-draft"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"documentation","color":"#06b6d4"}]"##, status: "active", color: Some("#469990"), github_issue_number: Some(110), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/110"), priority: Some("lowest") },
    DemoIssue { index: 11, name: "Flowering: PR open", worktree_state: "active", branch_name: Some("11-flowering-open"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"feature","color":"#3b82f6"}]"##, status: "active", color: Some("#dcbeff"), github_issue_number: Some(111), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/111"), priority: Some("high") },
    DemoIssue { index: 12, name: "Flowering: Review requested", worktree_state: "active", branch_name: Some("12-flowering-review"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"infrastructure","color":"#64748b"}]"##, status: "active", color: Some("#9a6324"), github_issue_number: Some(112), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/112"), priority: Some("medium") },
    DemoIssue { index: 13, name: "Seasonal: Changes requested", worktree_state: "active", branch_name: Some("13-seasonal-changes"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"bug","color":"#ef4444"}]"##, status: "active", color: Some("#fffac8"), github_issue_number: Some(113), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/113"), priority: Some("top") },
    DemoIssue { index: 14, name: "Fruiting: Approved", worktree_state: "active", branch_name: Some("14-fruiting-approved"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"feature","color":"#3b82f6"}]"##, status: "active", color: Some("#800000"), github_issue_number: Some(114), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/114"), priority: Some("medium") },
    DemoIssue { index: 15, name: "Fruiting: Ready to merge", worktree_state: "active", branch_name: Some("15-fruiting-ready"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"task","color":"#22c55e"}]"##, status: "active", color: Some("#aaffc3"), github_issue_number: Some(115), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/115"), priority: Some("low") },
    DemoIssue { index: 16, name: "Wilting: PR closed", worktree_state: "active", branch_name: Some("16-wilting-closed"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"bug","color":"#ef4444"}]"##, status: "active", color: Some("#808000"), github_issue_number: Some(116), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/116"), priority: None },
    DemoIssue { index: 17, name: "Bare: PR merged", worktree_state: "active", branch_name: Some("17-bare-merged"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"feature","color":"#3b82f6"}]"##, status: "active", color: Some("#ffd8b1"), github_issue_number: Some(117), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/117"), priority: None },
    DemoIssue { index: 18, name: "Dead: Branch deleted", worktree_state: "active", branch_name: Some("18-dead-deleted"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"task","color":"#22c55e"}]"##, status: "active", color: Some("#000075"), github_issue_number: Some(118), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/118"), priority: Some("lowest") },
    DemoIssue { index: 19, name: "Dead: Remote gone", worktree_state: "active", branch_name: Some("19-dead-remote-gone"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"refactor","color":"#8b5cf6"}]"##, status: "active", color: Some("#a9a9a9"), github_issue_number: Some(119), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/119"), priority: None },
    DemoIssue { index: 20, name: "Stump: Archived", worktree_state: "removed", branch_name: Some("20-stump-archived"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"task","color":"#22c55e"}]"##, status: "archived", color: Some("#ffffff"), github_issue_number: Some(120), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/120"), priority: None },
    // === PRD 2: Session Management (index 21) ===
    DemoIssue { index: 21, name: "PRD: Session Management", worktree_state: "none", branch_name: None, base_branch: None, parent_index: None, labels: r##"[{"name":"prd","color":"#ff6b6b"}]"##, status: "active", color: Some("#7fdbca"), github_issue_number: Some(200), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/200"), priority: Some("top") },
    DemoIssue { index: 22, name: "Session: Auto-recovery", worktree_state: "active", branch_name: Some("22-session-recovery"), base_branch: Some("main"), parent_index: Some(21), labels: r##"[{"name":"feature","color":"#3b82f6"}]"##, status: "active", color: Some("#c7b198"), github_issue_number: Some(201), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/201"), priority: Some("high") },
    DemoIssue { index: 23, name: "Session: Timeout handling", worktree_state: "active", branch_name: Some("23-session-timeout"), base_branch: Some("main"), parent_index: Some(21), labels: r##"[{"name":"task","color":"#22c55e"}]"##, status: "active", color: Some("#e8a2c4"), github_issue_number: Some(202), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/202"), priority: Some("medium") },
    DemoIssue { index: 24, name: "Session: Metrics dashboard", worktree_state: "active", branch_name: Some("24-session-metrics"), base_branch: Some("main"), parent_index: Some(21), labels: r##"[{"name":"documentation","color":"#06b6d4"}]"##, status: "active", color: Some("#b4d455"), github_issue_number: Some(203), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/203"), priority: Some("low") },
    // === Issue with worktree_state "removing" ===
    DemoIssue { index: 25, name: "Uprooting: Worktree cleanup", worktree_state: "removing", branch_name: Some("25-uprooting-cleanup"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"infrastructure","color":"#64748b"}]"##, status: "active", color: Some("#d4a574"), github_issue_number: Some(121), github_issue_url: Some("https://github.com/demo/grovekeeper-forest/issues/121"), priority: Some("medium") },
];

const DEMO_DEPENDENCIES: &[DemoDependency] = &[
    DemoDependency { blocker_index: 1, blocked_index: 2 },
    DemoDependency { blocker_index: 1, blocked_index: 3 },
    DemoDependency { blocker_index: 2, blocked_index: 4 },
    DemoDependency { blocker_index: 3, blocked_index: 4 },
    DemoDependency { blocker_index: 4, blocked_index: 5 },
    DemoDependency { blocker_index: 5, blocked_index: 9 },
    DemoDependency { blocker_index: 5, blocked_index: 10 },
    DemoDependency { blocker_index: 5, blocked_index: 11 },
    DemoDependency { blocker_index: 6, blocked_index: 7 },
    DemoDependency { blocker_index: 6, blocked_index: 8 },
    DemoDependency { blocker_index: 11, blocked_index: 14 },
    DemoDependency { blocker_index: 14, blocked_index: 15 },
];

const DEMO_GIT_CACHES: &[DemoGitCache] = &[
    // Issue 4 (Sapling: Ready to work) — local changes, no PR: tests action level #4
    DemoGitCache { issue_index: 4, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: true, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 5, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 6, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 7, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 8, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    // Issue 9 (Leafy: Commits no PR) — ahead of remote, no PR: tests action level #6
    DemoGitCache { issue_index: 9, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 2 },
    DemoGitCache { issue_index: 10, branch_status: "active", pr_state: Some("draft"), pr_number: Some(110), behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 11, branch_status: "active", pr_state: Some("open"), pr_number: Some(111), behind_base_count: 3, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 12, branch_status: "active", pr_state: Some("review-requested"), pr_number: Some(112), behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 13, branch_status: "active", pr_state: Some("changes-requested"), pr_number: Some(113), behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 14, branch_status: "active", pr_state: Some("approved"), pr_number: Some(114), behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 15, branch_status: "active", pr_state: Some("ready-to-merge"), pr_number: Some(115), behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    // Issue 16 (Wilting: PR closed) — github issue still open, PR closed
    DemoGitCache { issue_index: 16, branch_status: "active", pr_state: Some("closed"), pr_number: Some(116), behind_base_count: 0, merge_conflict: false, github_issue_state: Some("closed"), has_local_changes: false, ahead_remote_count: 0 },
    // Issue 17 (Bare: PR merged) — github issue closed + PR merged = "Done" state
    DemoGitCache { issue_index: 17, branch_status: "active", pr_state: Some("merged"), pr_number: Some(117), behind_base_count: 0, merge_conflict: false, github_issue_state: Some("closed"), has_local_changes: false, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 18, branch_status: "deleted", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 19, branch_status: "remote-gone", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 20, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 22, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 23, branch_status: "active", pr_state: Some("open"), pr_number: Some(202), behind_base_count: 1, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 24, branch_status: "active", pr_state: Some("draft"), pr_number: Some(203), behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
    DemoGitCache { issue_index: 25, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false, github_issue_state: Some("open"), has_local_changes: false, ahead_remote_count: 0 },
];

const DEMO_SESSIONS: &[DemoSession] = &[
    DemoSession { index: 5, issue_index: 5, state: "running", execution_phase: "tdd" },
    DemoSession { index: 6, issue_index: 6, state: "needs-input", execution_phase: "analyzing" },
    DemoSession { index: 7, issue_index: 7, state: "errored", execution_phase: "verifying" },
    DemoSession { index: 8, issue_index: 8, state: "paused", execution_phase: "none" },
    DemoSession { index: 9, issue_index: 9, state: "finished", execution_phase: "none" },
];

fn delete_demo_data(connection: &mut Connection) -> Result<(), String> {
    let transaction = connection
        .transaction()
        .map_err(|error| format!("Failed to start transaction: {error}"))?;

    // Sessions use ON DELETE SET NULL (not CASCADE) — delete explicitly to avoid orphans
    transaction
        .execute(
            "DELETE FROM sessions WHERE issue_id IN (SELECT id FROM issues WHERE dashboard_id = ?1)",
            params![DEMO_DASHBOARD_ID],
        )
        .map_err(|error| format!("Failed to delete sessions: {error}"))?;

    // git_status_cache and issues cascade from dashboard delete
    transaction
        .execute(
            "DELETE FROM dashboards WHERE id = ?1",
            params![DEMO_DASHBOARD_ID],
        )
        .map_err(|error| format!("Failed to delete dashboard: {error}"))?;

    transaction
        .commit()
        .map_err(|error| format!("Failed to commit transaction: {error}"))?;

    Ok(())
}

fn seed_demo_data(connection: &mut Connection) -> Result<String, String> {
    // Idempotent: clean up first
    delete_demo_data(connection)?;

    let transaction = connection
        .transaction()
        .map_err(|error| format!("Failed to start transaction: {error}"))?;

    // Insert dashboard
    transaction
        .execute(
            "INSERT INTO dashboards (id, name, type, github_repo, default_base_branch) \
             VALUES (?1, ?2, 'repo', ?3, ?4)",
            params![
                DEMO_DASHBOARD_ID,
                "\u{1f332} Forest Demo",
                "demo/grovekeeper-forest",
                "main",
            ],
        )
        .map_err(|error| format!("Failed to insert dashboard: {error}"))?;

    // Insert issues — parent issues first (index 0), then children
    for issue in DEMO_ISSUES {
        let id = format!("demo-issue-{}", issue.index);
        let parent_id = issue.parent_index.map(|idx| format!("demo-issue-{idx}"));

        transaction
            .execute(
                "INSERT INTO issues (id, dashboard_id, name, worktree_state, branch_name, base_branch, parent_issue_id, labels, status, sort_order, color, github_issue_number, github_issue_url, priority) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
                params![
                    id,
                    DEMO_DASHBOARD_ID,
                    issue.name,
                    issue.worktree_state,
                    issue.branch_name,
                    issue.base_branch,
                    parent_id,
                    issue.labels,
                    issue.status,
                    issue.index,
                    issue.color,
                    issue.github_issue_number,
                    issue.github_issue_url,
                    issue.priority,
                ],
            )
            .map_err(|error| format!("Failed to insert issue {}: {error}", issue.index))?;
    }

    // Insert git_status_cache entries
    for cache in DEMO_GIT_CACHES {
        let issue_id = format!("demo-issue-{}", cache.issue_index);

        transaction
            .execute(
                "INSERT INTO git_status_cache (issue_id, branch_status, pr_state, pr_number, behind_base_count, merge_conflict, github_issue_state, has_local_changes, ahead_remote_count) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    issue_id,
                    cache.branch_status,
                    cache.pr_state,
                    cache.pr_number,
                    cache.behind_base_count,
                    cache.merge_conflict,
                    cache.github_issue_state,
                    cache.has_local_changes,
                    cache.ahead_remote_count,
                ],
            )
            .map_err(|error| format!("Failed to insert git_status_cache for issue {}: {error}", cache.issue_index))?;
    }

    // Insert sessions
    for session in DEMO_SESSIONS {
        let session_id = format!("demo-session-{}", session.index);
        let issue_id = format!("demo-issue-{}", session.issue_index);

        transaction
            .execute(
                "INSERT INTO sessions (id, issue_id, state, execution_phase) \
                 VALUES (?1, ?2, ?3, ?4)",
                params![session_id, issue_id, session.state, session.execution_phase],
            )
            .map_err(|error| format!("Failed to insert session {}: {error}", session.index))?;
    }

    // Insert dependency edges
    for dependency in DEMO_DEPENDENCIES {
        let id = format!(
            "demo-dep-{}-{}",
            dependency.blocker_index, dependency.blocked_index
        );
        let blocker_id = format!("demo-issue-{}", dependency.blocker_index);
        let blocked_id = format!("demo-issue-{}", dependency.blocked_index);

        transaction
            .execute(
                "INSERT INTO issue_dependencies (id, blocker_issue_id, blocked_issue_id) \
                 VALUES (?1, ?2, ?3)",
                params![id, blocker_id, blocked_id],
            )
            .map_err(|error| {
                format!(
                    "Failed to insert dependency {}->{}: {error}",
                    dependency.blocker_index, dependency.blocked_index
                )
            })?;
    }

    // Seed label shape mappings
    seed_label_shape_mappings_for_dashboard(&transaction, DEMO_DASHBOARD_ID)
        .map_err(|error| format!("Failed to seed label shape mappings: {error}"))?;

    transaction
        .commit()
        .map_err(|error| format!("Failed to commit transaction: {error}"))?;

    Ok(DEMO_DASHBOARD_ID.to_string())
}

#[tauri::command]
pub fn seed_demo_workspace(state: State<DatabaseState>) -> Result<String, String> {
    let mut connection = state.write()?;
    seed_demo_data(&mut connection)
}

#[tauri::command]
pub fn delete_demo_workspace(state: State<DatabaseState>) -> Result<(), String> {
    let mut connection = state.write()?;
    delete_demo_data(&mut connection)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::test_helpers::setup_test_database;

    #[test]
    fn seed_creates_dashboard() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        let (id, name, dashboard_type): (String, String, String) = connection
            .query_row(
                "SELECT id, name, type FROM dashboards WHERE id = ?1",
                [DEMO_DASHBOARD_ID],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();

        assert_eq!(id, DEMO_DASHBOARD_ID);
        assert_eq!(name, "\u{1f332} Forest Demo");
        assert_eq!(dashboard_type, "repo");

        let count: i64 = connection
            .query_row("SELECT COUNT(*) FROM dashboards", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn seed_creates_26_issues() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM issues WHERE dashboard_id = ?1",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 26);

        // Spot-check PRD parent
        let (name, worktree_state): (String, String) = connection
            .query_row(
                "SELECT name, worktree_state FROM issues WHERE id = 'demo-issue-0'",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap();
        assert_eq!(name, "PRD: Forest Visualization");
        assert_eq!(worktree_state, "none");

        // Spot-check a growing issue
        let (name, worktree_state): (String, String) = connection
            .query_row(
                "SELECT name, worktree_state FROM issues WHERE id = 'demo-issue-5'",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap();
        assert_eq!(name, "Growing: Session running");
        assert_eq!(worktree_state, "active");

        // Spot-check archived stump
        let (name, status, worktree_state): (String, String, String) = connection
            .query_row(
                "SELECT name, status, worktree_state FROM issues WHERE id = 'demo-issue-20'",
                [],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();
        assert_eq!(name, "Stump: Archived");
        assert_eq!(status, "archived");
        assert_eq!(worktree_state, "removed");
    }

    #[test]
    fn seed_creates_git_status_cache_entries() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM git_status_cache g \
                 JOIN issues i ON g.issue_id = i.id \
                 WHERE i.dashboard_id = ?1",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 21);

        // Spot-check draft PR
        let pr_state: String = connection
            .query_row(
                "SELECT pr_state FROM git_status_cache WHERE issue_id = 'demo-issue-10'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(pr_state, "draft");

        // Spot-check ready-to-merge
        let pr_state: String = connection
            .query_row(
                "SELECT pr_state FROM git_status_cache WHERE issue_id = 'demo-issue-15'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(pr_state, "ready-to-merge");

        // Spot-check deleted branch
        let branch_status: String = connection
            .query_row(
                "SELECT branch_status FROM git_status_cache WHERE issue_id = 'demo-issue-18'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(branch_status, "deleted");
    }

    #[test]
    fn seed_creates_sessions() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM sessions s \
                 JOIN issues i ON s.issue_id = i.id \
                 WHERE i.dashboard_id = ?1",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 5);

        // Spot-check running session
        let (state, execution_phase): (String, String) = connection
            .query_row(
                "SELECT state, execution_phase FROM sessions WHERE id = 'demo-session-5'",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap();
        assert_eq!(state, "running");
        assert_eq!(execution_phase, "tdd");

        // Spot-check errored session
        let state: String = connection
            .query_row(
                "SELECT state FROM sessions WHERE id = 'demo-session-7'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(state, "errored");
    }

    #[test]
    fn seed_creates_label_shape_mappings() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM label_shape_mappings WHERE dashboard_id = ?1",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 9);
    }

    #[test]
    fn seed_all_session_state_cards_are_direct_prd_children() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        // IssueCardGrid only renders 2 levels (PRD + direct children).
        // Issues 7, 8, 9 were previously grandchildren of issue-0 via issue-5;
        // they are now direct children of issue-0 so they render in the grid.
        for index in [7, 8, 9, 12, 13] {
            let parent: String = connection
                .query_row(
                    &format!("SELECT parent_issue_id FROM issues WHERE id = 'demo-issue-{index}'"),
                    [],
                    |row| row.get(0),
                )
                .unwrap();
            assert_eq!(
                parent, "demo-issue-0",
                "demo-issue-{index} should be a direct child of demo-issue-0"
            );
        }

        // issue-5 (Growing: Session running) remains a direct child of issue-0
        let parent: String = connection
            .query_row(
                "SELECT parent_issue_id FROM issues WHERE id = 'demo-issue-5'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(parent, "demo-issue-0");
    }

    #[test]
    fn seed_creates_dependency_edges() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM issue_dependencies d \
                 JOIN issues i ON d.blocker_issue_id = i.id \
                 WHERE i.dashboard_id = ?1",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 12);

        // Spot-check: issue-1 blocks issue-2
        let blocker: String = connection
            .query_row(
                "SELECT blocker_issue_id FROM issue_dependencies WHERE blocked_issue_id = 'demo-issue-2'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(blocker, "demo-issue-1");
    }

    #[test]
    fn seed_is_idempotent() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();
        seed_demo_data(&mut connection).unwrap();

        let dashboard_count: i64 = connection
            .query_row("SELECT COUNT(*) FROM dashboards", [], |row| row.get(0))
            .unwrap();
        assert_eq!(dashboard_count, 1);

        let issue_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM issues WHERE dashboard_id = ?1",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(issue_count, 26);

        let session_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM sessions s JOIN issues i ON s.issue_id = i.id WHERE i.dashboard_id = ?1",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(session_count, 5);

        let git_cache_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM git_status_cache g JOIN issues i ON g.issue_id = i.id WHERE i.dashboard_id = ?1",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(git_cache_count, 21);

        let dependency_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM issue_dependencies d \
                 JOIN issues i ON d.blocker_issue_id = i.id \
                 WHERE i.dashboard_id = ?1",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(dependency_count, 12);

        let mapping_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM label_shape_mappings WHERE dashboard_id = ?1",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(mapping_count, 9);
    }

    #[test]
    fn delete_removes_all_demo_data_with_no_orphans() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();
        delete_demo_data(&mut connection).unwrap();

        let dashboard_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM dashboards WHERE id = ?1",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(dashboard_count, 0);

        let issue_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM issues WHERE dashboard_id = ?1",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(issue_count, 0);

        // These don't cascade — must be explicitly cleaned
        let session_count: i64 = connection
            .query_row("SELECT COUNT(*) FROM sessions", [], |row| row.get(0))
            .unwrap();
        assert_eq!(session_count, 0);

        let git_cache_count: i64 = connection
            .query_row("SELECT COUNT(*) FROM git_status_cache", [], |row| row.get(0))
            .unwrap();
        assert_eq!(git_cache_count, 0);

        let mapping_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM label_shape_mappings WHERE dashboard_id = ?1",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(mapping_count, 0);
    }

    #[test]
    fn seed_returns_dashboard_id() {
        let mut connection = setup_test_database();
        let result = seed_demo_data(&mut connection).unwrap();
        assert_eq!(result, DEMO_DASHBOARD_ID);
    }

    #[test]
    fn seed_all_issues_have_unique_colors() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        let mut statement = connection
            .prepare(
                "SELECT color FROM issues WHERE dashboard_id = ?1",
            )
            .unwrap();
        let colors: Vec<String> = statement
            .query_map([DEMO_DASHBOARD_ID], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<String>, _>>()
            .unwrap();

        assert_eq!(colors.len(), 26, "all 26 issues should have a color");

        let unique: std::collections::HashSet<&str> =
            colors.iter().map(|c| c.as_str()).collect();
        assert_eq!(unique.len(), 26, "all colors should be distinct");
    }

    #[test]
    fn seed_all_issues_have_unique_github_issue_numbers() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        let mut statement = connection
            .prepare(
                "SELECT github_issue_number FROM issues WHERE dashboard_id = ?1",
            )
            .unwrap();
        let numbers: Vec<i32> = statement
            .query_map([DEMO_DASHBOARD_ID], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<i32>, _>>()
            .unwrap();

        assert_eq!(numbers.len(), 26, "all 26 issues should have a github_issue_number");

        let unique: std::collections::HashSet<i32> = numbers.iter().copied().collect();
        assert_eq!(unique.len(), 26, "all github_issue_numbers should be distinct");
    }

    #[test]
    fn seed_all_issues_have_github_issue_urls_containing_number() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        let mut statement = connection
            .prepare(
                "SELECT github_issue_url, github_issue_number FROM issues WHERE dashboard_id = ?1",
            )
            .unwrap();
        let rows: Vec<(String, i32)> = statement
            .query_map([DEMO_DASHBOARD_ID], |row| Ok((row.get(0)?, row.get(1)?)))
            .unwrap()
            .collect::<Result<Vec<(String, i32)>, _>>()
            .unwrap();

        assert_eq!(rows.len(), 26);
        for (url, number) in &rows {
            assert!(
                url.contains(&number.to_string()),
                "URL '{url}' should contain issue number {number}"
            );
        }
    }

    #[test]
    fn seed_issues_have_all_five_priority_values() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        let mut statement = connection
            .prepare(
                "SELECT DISTINCT priority FROM issues WHERE dashboard_id = ?1 AND priority IS NOT NULL",
            )
            .unwrap();
        let priorities: Vec<String> = statement
            .query_map([DEMO_DASHBOARD_ID], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<String>, _>>()
            .unwrap();

        let priority_set: std::collections::HashSet<&str> =
            priorities.iter().map(|p| p.as_str()).collect();
        for expected in &["lowest", "low", "medium", "high", "top"] {
            assert!(
                priority_set.contains(expected),
                "priority '{expected}' should be represented"
            );
        }
    }

    #[test]
    fn seed_issues_have_some_null_priorities() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        let null_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM issues WHERE dashboard_id = ?1 AND priority IS NULL",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert!(
            null_count >= 1,
            "at least one issue should have null priority, got {null_count}"
        );
    }

    #[test]
    fn seed_creates_two_prd_groups_with_children() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        // First PRD has at least 3 direct children
        let prd0_children: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM issues WHERE parent_issue_id = 'demo-issue-0'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(
            prd0_children >= 3,
            "PRD demo-issue-0 should have at least 3 children, got {prd0_children}"
        );

        // Second PRD has at least 3 direct children
        let prd21_children: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM issues WHERE parent_issue_id = 'demo-issue-21'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(
            prd21_children >= 3,
            "PRD demo-issue-21 should have at least 3 children, got {prd21_children}"
        );

        // Both PRDs have 'prd' label
        let prd0_labels: String = connection
            .query_row(
                "SELECT labels FROM issues WHERE id = 'demo-issue-0'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(prd0_labels.contains("prd"), "PRD 0 labels should contain 'prd'");

        let prd21_labels: String = connection
            .query_row(
                "SELECT labels FROM issues WHERE id = 'demo-issue-21'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(prd21_labels.contains("prd"), "PRD 21 labels should contain 'prd'");
    }

    #[test]
    fn seed_has_one_removing_worktree_state() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM issues WHERE dashboard_id = ?1 AND worktree_state = 'removing'",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1, "exactly one issue should have worktree_state 'removing'");
    }

    #[test]
    fn hitl_label_is_assigned_to_issue_6() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        let labels: String = connection
            .query_row(
                "SELECT labels FROM issues WHERE id = 'demo-issue-6'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(
            labels.contains("HITL"),
            "demo-issue-6 labels should contain HITL, got: {labels}"
        );
    }
}
