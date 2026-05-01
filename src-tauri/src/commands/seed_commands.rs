use rusqlite::{params, Connection};
use tauri::State;

use crate::database::connection::DatabaseState;
use crate::database::migrations::seed_label_shape_mappings_for_dashboard;

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
}

struct DemoGitCache {
    issue_index: u32,
    branch_status: &'static str,
    pr_state: Option<&'static str>,
    pr_number: Option<i32>,
    behind_base_count: i32,
    merge_conflict: bool,
}

struct DemoSession {
    index: u32,
    issue_index: u32,
    state: &'static str,
    execution_phase: &'static str,
}

const DEMO_ISSUES: &[DemoIssue] = &[
    DemoIssue { index: 0, name: "PRD: Forest Visualization", worktree_state: "none", branch_name: None, base_branch: None, parent_index: None, labels: r##"[{"name":"prd","color":"#ff6b6b"}]"##, status: "active" },
    DemoIssue { index: 1, name: "Seed: Just an idea", worktree_state: "none", branch_name: None, base_branch: None, parent_index: Some(0), labels: r##"[{"name":"task","color":"#22c55e"},{"name":"AFK","color":"#6366f1"}]"##, status: "active" },
    DemoIssue { index: 2, name: "Sprouting: Worktree pending", worktree_state: "pending", branch_name: None, base_branch: None, parent_index: Some(0), labels: r##"[{"name":"feature","color":"#3b82f6"}]"##, status: "active" },
    DemoIssue { index: 3, name: "Sprouting: Worktree failed", worktree_state: "failed", branch_name: None, base_branch: None, parent_index: Some(0), labels: r##"[{"name":"bug","color":"#ef4444"}]"##, status: "active" },
    DemoIssue { index: 4, name: "Sapling: Ready to work", worktree_state: "active", branch_name: Some("4-sapling-ready"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"feature","color":"#3b82f6"}]"##, status: "active" },
    DemoIssue { index: 5, name: "Growing: Session running", worktree_state: "active", branch_name: Some("5-growing-running"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"task","color":"#22c55e"}]"##, status: "active" },
    DemoIssue { index: 6, name: "Growing: Needs input", worktree_state: "active", branch_name: Some("6-growing-input"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"task","color":"#22c55e"},{"name":"HITL","color":"#f59e0b"}]"##, status: "active" },
    DemoIssue { index: 7, name: "Growing: Session errored", worktree_state: "active", branch_name: Some("7-growing-errored"), base_branch: Some("main"), parent_index: Some(5), labels: r##"[{"name":"bug","color":"#ef4444"}]"##, status: "active" },
    DemoIssue { index: 8, name: "Growing: Session paused", worktree_state: "active", branch_name: Some("8-growing-paused"), base_branch: Some("main"), parent_index: Some(5), labels: r##"[{"name":"refactor","color":"#8b5cf6"}]"##, status: "active" },
    DemoIssue { index: 9, name: "Leafy: Commits no PR", worktree_state: "active", branch_name: Some("9-leafy-commits"), base_branch: Some("main"), parent_index: Some(5), labels: r##"[{"name":"feature","color":"#3b82f6"}]"##, status: "active" },
    DemoIssue { index: 10, name: "Leafy: Draft PR", worktree_state: "active", branch_name: Some("10-leafy-draft"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"documentation","color":"#06b6d4"}]"##, status: "active" },
    DemoIssue { index: 11, name: "Flowering: PR open", worktree_state: "active", branch_name: Some("11-flowering-open"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"feature","color":"#3b82f6"}]"##, status: "active" },
    DemoIssue { index: 12, name: "Flowering: Review requested", worktree_state: "active", branch_name: Some("12-flowering-review"), base_branch: Some("main"), parent_index: Some(7), labels: r##"[{"name":"infrastructure","color":"#64748b"}]"##, status: "active" },
    DemoIssue { index: 13, name: "Seasonal: Changes requested", worktree_state: "active", branch_name: Some("13-seasonal-changes"), base_branch: Some("main"), parent_index: Some(7), labels: r##"[{"name":"bug","color":"#ef4444"}]"##, status: "active" },
    DemoIssue { index: 14, name: "Fruiting: Approved", worktree_state: "active", branch_name: Some("14-fruiting-approved"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"feature","color":"#3b82f6"}]"##, status: "active" },
    DemoIssue { index: 15, name: "Fruiting: Ready to merge", worktree_state: "active", branch_name: Some("15-fruiting-ready"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"task","color":"#22c55e"}]"##, status: "active" },
    DemoIssue { index: 16, name: "Wilting: PR closed", worktree_state: "active", branch_name: Some("16-wilting-closed"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"bug","color":"#ef4444"}]"##, status: "active" },
    DemoIssue { index: 17, name: "Bare: PR merged", worktree_state: "active", branch_name: Some("17-bare-merged"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"feature","color":"#3b82f6"}]"##, status: "active" },
    DemoIssue { index: 18, name: "Dead: Branch deleted", worktree_state: "active", branch_name: Some("18-dead-deleted"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"task","color":"#22c55e"}]"##, status: "active" },
    DemoIssue { index: 19, name: "Dead: Remote gone", worktree_state: "active", branch_name: Some("19-dead-remote-gone"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"refactor","color":"#8b5cf6"}]"##, status: "active" },
    DemoIssue { index: 20, name: "Stump: Archived", worktree_state: "removed", branch_name: Some("20-stump-archived"), base_branch: Some("main"), parent_index: Some(0), labels: r##"[{"name":"task","color":"#22c55e"}]"##, status: "archived" },
];

const DEMO_GIT_CACHES: &[DemoGitCache] = &[
    DemoGitCache { issue_index: 4, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false },
    DemoGitCache { issue_index: 5, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false },
    DemoGitCache { issue_index: 6, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false },
    DemoGitCache { issue_index: 7, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false },
    DemoGitCache { issue_index: 8, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false },
    DemoGitCache { issue_index: 9, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false },
    DemoGitCache { issue_index: 10, branch_status: "active", pr_state: Some("draft"), pr_number: Some(110), behind_base_count: 0, merge_conflict: false },
    DemoGitCache { issue_index: 11, branch_status: "active", pr_state: Some("open"), pr_number: Some(111), behind_base_count: 3, merge_conflict: false },
    DemoGitCache { issue_index: 12, branch_status: "active", pr_state: Some("review-requested"), pr_number: Some(112), behind_base_count: 0, merge_conflict: false },
    DemoGitCache { issue_index: 13, branch_status: "active", pr_state: Some("changes-requested"), pr_number: Some(113), behind_base_count: 0, merge_conflict: true },
    DemoGitCache { issue_index: 14, branch_status: "active", pr_state: Some("approved"), pr_number: Some(114), behind_base_count: 0, merge_conflict: false },
    DemoGitCache { issue_index: 15, branch_status: "active", pr_state: Some("ready-to-merge"), pr_number: Some(115), behind_base_count: 0, merge_conflict: false },
    DemoGitCache { issue_index: 16, branch_status: "active", pr_state: Some("closed"), pr_number: Some(116), behind_base_count: 0, merge_conflict: false },
    DemoGitCache { issue_index: 17, branch_status: "active", pr_state: Some("merged"), pr_number: Some(117), behind_base_count: 0, merge_conflict: false },
    DemoGitCache { issue_index: 18, branch_status: "deleted", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false },
    DemoGitCache { issue_index: 19, branch_status: "remote-gone", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false },
    DemoGitCache { issue_index: 20, branch_status: "active", pr_state: None, pr_number: None, behind_base_count: 0, merge_conflict: false },
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

    // Delete non-cascading children first (sessions and git_status_cache lack ON DELETE CASCADE)
    transaction
        .execute(
            "DELETE FROM sessions WHERE issue_id IN (SELECT id FROM issues WHERE dashboard_id = ?1)",
            params![DEMO_DASHBOARD_ID],
        )
        .map_err(|error| format!("Failed to delete sessions: {error}"))?;

    transaction
        .execute(
            "DELETE FROM git_status_cache WHERE issue_id IN (SELECT id FROM issues WHERE dashboard_id = ?1)",
            params![DEMO_DASHBOARD_ID],
        )
        .map_err(|error| format!("Failed to delete git_status_cache: {error}"))?;

    // Cascade handles issues, label_shape_mappings, actions
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
                "INSERT INTO issues (id, dashboard_id, name, worktree_state, branch_name, base_branch, parent_issue_id, labels, status, sort_order) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
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
                ],
            )
            .map_err(|error| format!("Failed to insert issue {}: {error}", issue.index))?;
    }

    // Insert git_status_cache entries
    for cache in DEMO_GIT_CACHES {
        let issue_id = format!("demo-issue-{}", cache.issue_index);

        transaction
            .execute(
                "INSERT INTO git_status_cache (issue_id, branch_status, pr_state, pr_number, behind_base_count, merge_conflict) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    issue_id,
                    cache.branch_status,
                    cache.pr_state,
                    cache.pr_number,
                    cache.behind_base_count,
                    cache.merge_conflict,
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
    fn seed_creates_21_issues() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM issues WHERE dashboard_id = ?1",
                [DEMO_DASHBOARD_ID],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 21);

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
        assert_eq!(count, 17);

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
    fn seed_creates_three_depth_levels() {
        let mut connection = setup_test_database();
        seed_demo_data(&mut connection).unwrap();

        // issue-7's parent is issue-5
        let parent: String = connection
            .query_row(
                "SELECT parent_issue_id FROM issues WHERE id = 'demo-issue-7'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(parent, "demo-issue-5");

        // issue-5's parent is issue-0
        let parent: String = connection
            .query_row(
                "SELECT parent_issue_id FROM issues WHERE id = 'demo-issue-5'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(parent, "demo-issue-0");

        // issue-12's parent is issue-7
        let parent: String = connection
            .query_row(
                "SELECT parent_issue_id FROM issues WHERE id = 'demo-issue-12'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(parent, "demo-issue-7");
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
        assert_eq!(issue_count, 21);

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
        assert_eq!(git_cache_count, 17);

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
