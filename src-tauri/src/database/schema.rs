use rusqlite::Connection;

pub fn create_tables(connection: &Connection) -> Result<(), rusqlite::Error> {
    connection.execute_batch(
        "
        BEGIN;

        CREATE TABLE IF NOT EXISTS color_palettes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            colors TEXT NOT NULL,
            is_built_in INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS dashboards (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('repo', 'portfolio')),
            github_repo TEXT,
            local_folder TEXT,
            default_base_branch TEXT,
            worktree_parent_folder TEXT,
            color_palette_id TEXT REFERENCES color_palettes(id),
            accent_color TEXT,
            default_shape TEXT NOT NULL DEFAULT 'cherry',
            priorities_enabled INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS issues (
            id TEXT PRIMARY KEY,
            dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            priority TEXT CHECK (priority IN ('lowest', 'low', 'medium', 'high', 'top')),
            color TEXT,
            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
            github_issue_url TEXT,
            github_issue_number INTEGER,
            branch_name TEXT,
            base_branch TEXT,
            worktree_folder TEXT,
            worktree_state TEXT DEFAULT 'none' CHECK (worktree_state IN ('none', 'pending', 'active', 'failed', 'removing', 'removed')),
            parent_issue_id TEXT REFERENCES issues(id) ON DELETE SET NULL,
            editor_folder TEXT,
            dev_server_command TEXT,
            dev_server_port INTEGER,
            dev_server_pid INTEGER,
            browser_url TEXT,
            labels TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS portfolio_dashboard_pointers (
            id TEXT PRIMARY KEY,
            portfolio_dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            repo_dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            sort_order INTEGER NOT NULL DEFAULT 0,
            UNIQUE(portfolio_dashboard_id, repo_dashboard_id)
        );

        CREATE TABLE IF NOT EXISTS label_shape_mappings (
            id TEXT PRIMARY KEY,
            dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            label_name TEXT NOT NULL,
            tree_shape TEXT NOT NULL,
            color TEXT,
            priority_order INTEGER NOT NULL DEFAULT 0,
            UNIQUE(dashboard_id, label_name)
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            issue_id TEXT REFERENCES issues(id),
            provider TEXT NOT NULL DEFAULT 'claude-code',
            state TEXT NOT NULL DEFAULT 'running'
                CHECK (state IN ('running', 'needs-input', 'needs-review', 'paused', 'finished', 'errored')),
            pid INTEGER,
            cli_session_id TEXT,
            started_at TEXT NOT NULL DEFAULT (datetime('now')),
            ended_at TEXT,
            cost_usd REAL,
            token_count INTEGER,
            original_intent TEXT,
            last_prompt TEXT,
            last_response_summary TEXT,
            execution_phase TEXT NOT NULL DEFAULT 'none'
                CHECK (execution_phase IN ('none', 'analyzing', 'tdd', 'reviewing', 'verifying', 'committing')),
            source TEXT NOT NULL DEFAULT 'spawned'
                CHECK (source IN ('spawned', 'adopted')),
            working_directory TEXT
        );

        CREATE TABLE IF NOT EXISTS actions (
            id TEXT PRIMARY KEY,
            dashboard_id TEXT REFERENCES dashboards(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            icon TEXT,
            command_template TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            visible INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS notification_config (
            event_type TEXT PRIMARY KEY,
            importance_tier TEXT NOT NULL DEFAULT 'normal'
                CHECK (importance_tier IN ('critical', 'important', 'normal')),
            sound_enabled INTEGER NOT NULL DEFAULT 0,
            sound_file TEXT,
            toast_enabled INTEGER NOT NULL DEFAULT 0,
            window_flash_enabled INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS sound_volume_overrides (
            event_type TEXT NOT NULL,
            sound_file TEXT NOT NULL,
            volume REAL NOT NULL DEFAULT 1.0,
            PRIMARY KEY (event_type, sound_file)
        );

        CREATE TABLE IF NOT EXISTS git_status_cache (
            issue_id TEXT PRIMARY KEY REFERENCES issues(id),
            branch_status TEXT,
            pr_state TEXT CHECK (pr_state IN ('draft', 'open', 'review-requested', 'changes-requested', 'approved', 'ready-to-merge', 'merged', 'closed')),
            pr_number INTEGER,
            pr_url TEXT,
            github_issue_state TEXT,
            behind_base_count INTEGER,
            merge_conflict INTEGER,
            has_local_changes INTEGER,
            ahead_remote_count INTEGER,
            fetched_at TEXT
        );

        CREATE TABLE IF NOT EXISTS keyboard_shortcuts (
            action_id TEXT PRIMARY KEY,
            binding TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS window_workspace_bindings (
            window_label TEXT PRIMARY KEY,
            dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            window_x INTEGER,
            window_y INTEGER,
            window_width INTEGER,
            window_height INTEGER
        );

        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS issue_dependencies (
            id TEXT PRIMARY KEY,
            blocker_issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
            blocked_issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
            UNIQUE(blocker_issue_id, blocked_issue_id)
        );

        CREATE TABLE IF NOT EXISTS deleted_assigned_issues (
            id TEXT PRIMARY KEY,
            dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            github_issue_number INTEGER NOT NULL,
            deleted_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(dashboard_id, github_issue_number)
        );

        CREATE INDEX IF NOT EXISTS idx_issues_dashboard_id ON issues(dashboard_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_issue_id ON sessions(issue_id);
        CREATE INDEX IF NOT EXISTS idx_issue_dependencies_blocker ON issue_dependencies(blocker_issue_id);
        CREATE INDEX IF NOT EXISTS idx_issue_dependencies_blocked ON issue_dependencies(blocked_issue_id);
        CREATE INDEX IF NOT EXISTS idx_deleted_assigned_issues_dashboard ON deleted_assigned_issues(dashboard_id);

        COMMIT;
        ",
    )?;

    Ok(())
}
