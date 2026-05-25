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
            type TEXT NOT NULL CHECK (type IN ('repo')),
            github_repo TEXT,
            local_folder TEXT,
            default_base_branch TEXT,
            worktree_parent_folder TEXT,
            color_palette_id TEXT REFERENCES color_palettes(id),
            accent_color TEXT,
            chart_color_theme TEXT,
            default_shape TEXT NOT NULL DEFAULT 'cherry',
            priorities_enabled INTEGER NOT NULL DEFAULT 1,
            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted'))
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
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            character_pack_id TEXT,
            character_avatar TEXT,
            is_sound_muted INTEGER NOT NULL DEFAULT 0
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
            issue_id TEXT REFERENCES issues(id) ON DELETE SET NULL,
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
            issue_id TEXT PRIMARY KEY REFERENCES issues(id) ON DELETE CASCADE,
            branch_status TEXT,
            pr_state TEXT CHECK (pr_state IN ('draft', 'open', 'review-requested', 'changes-requested', 'approved', 'ready-to-merge', 'merged', 'closed')),
            pr_number INTEGER,
            pr_url TEXT,
            github_issue_state TEXT,
            behind_base_count INTEGER,
            merge_conflict INTEGER,
            has_local_changes INTEGER,
            ahead_remote_count INTEGER,
            fetched_at TEXT,
            pr_ci_status TEXT CHECK (pr_ci_status IN ('passed', 'failed', 'running') OR pr_ci_status IS NULL)
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

        CREATE TABLE IF NOT EXISTS user_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workspace_settings (
            dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            PRIMARY KEY (dashboard_id, key)
        );

        CREATE TABLE IF NOT EXISTS issue_dependencies (
            id TEXT PRIMARY KEY,
            blocker_issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
            blocked_issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
            UNIQUE(blocker_issue_id, blocked_issue_id)
        );

        CREATE TABLE IF NOT EXISTS session_metrics (
            session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
            provider TEXT NOT NULL,
            model TEXT,
            input_tokens INTEGER NOT NULL DEFAULT 0,
            output_tokens INTEGER NOT NULL DEFAULT 0,
            cache_read_tokens INTEGER NOT NULL DEFAULT 0,
            cache_write_tokens INTEGER NOT NULL DEFAULT 0,
            cost_usd REAL NOT NULL DEFAULT 0.0,
            duration_seconds REAL,
            turn_count INTEGER NOT NULL DEFAULT 0,
            tool_call_count INTEGER NOT NULL DEFAULT 0,
            one_shot_turns INTEGER NOT NULL DEFAULT 0,
            edit_turns INTEGER NOT NULL DEFAULT 0,
            retry_count INTEGER NOT NULL DEFAULT 0,
            started_at TEXT NOT NULL,
            ended_at TEXT,
            imported INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS turn_metrics (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
            turn_index INTEGER NOT NULL,
            category TEXT NOT NULL DEFAULT 'general',
            model TEXT,
            input_tokens INTEGER NOT NULL DEFAULT 0,
            output_tokens INTEGER NOT NULL DEFAULT 0,
            cache_read_tokens INTEGER NOT NULL DEFAULT 0,
            cache_write_tokens INTEGER NOT NULL DEFAULT 0,
            cost_usd REAL NOT NULL DEFAULT 0.0,
            has_edits INTEGER NOT NULL DEFAULT 0,
            retry_count INTEGER NOT NULL DEFAULT 0,
            tool_call_count INTEGER NOT NULL DEFAULT 0,
            timestamp TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS tool_usage (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
            turn_id TEXT REFERENCES turn_metrics(id) ON DELETE CASCADE,
            tool_name TEXT NOT NULL,
            is_error INTEGER NOT NULL DEFAULT 0,
            duration_seconds REAL,
            timestamp TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS achievements (
            kind TEXT PRIMARY KEY,
            progress INTEGER NOT NULL DEFAULT 0,
            unlocked_at TEXT
        );

        CREATE TABLE IF NOT EXISTS import_history (
            dedup_key TEXT PRIMARY KEY,
            provider TEXT NOT NULL,
            imported_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS workspace_commands (
            id TEXT PRIMARY KEY,
            dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            category TEXT NOT NULL CHECK (category IN ('server', 'check')),
            name TEXT NOT NULL,
            command TEXT NOT NULL,
            port_pattern TEXT,
            expected_exit_code INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0,
            mode TEXT NOT NULL DEFAULT 'headless' CHECK (mode IN ('headless', 'terminal')),
            restart_policy TEXT NOT NULL DEFAULT 'never' CHECK (restart_policy IN ('never', 'on_failure', 'always')),
            max_restart_count INTEGER NOT NULL DEFAULT 3 CHECK (max_restart_count >= 0),
            backoff_base_delay_ms INTEGER NOT NULL DEFAULT 1000 CHECK (backoff_base_delay_ms >= 0),
            timeout_seconds INTEGER
        );

        CREATE TABLE IF NOT EXISTS model_pricing_cache (
            model_id TEXT PRIMARY KEY,
            input_cost_per_token REAL NOT NULL,
            output_cost_per_token REAL NOT NULL,
            cache_read_cost_per_token REAL,
            cache_write_cost_per_token REAL,
            fast_mode_multiplier REAL,
            source TEXT NOT NULL DEFAULT 'litellm'
                CHECK (source IN ('user', 'litellm', 'openrouter')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS character_packs (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            language TEXT,
            avatar_path TEXT,
            is_bundled INTEGER NOT NULL DEFAULT 0,
            is_enabled INTEGER NOT NULL DEFAULT 1,
            is_complete INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS character_event_sounds (
            id TEXT PRIMARY KEY,
            character_pack_id TEXT NOT NULL REFERENCES character_packs(id) ON DELETE CASCADE,
            event_type TEXT NOT NULL,
            sound_file TEXT NOT NULL,
            label TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            UNIQUE(character_pack_id, event_type, sound_file)
        );

        CREATE INDEX IF NOT EXISTS idx_character_event_sounds_pack ON character_event_sounds(character_pack_id);

        CREATE INDEX IF NOT EXISTS idx_issues_dashboard_id ON issues(dashboard_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_issue_id ON sessions(issue_id);
        CREATE INDEX IF NOT EXISTS idx_issue_dependencies_blocker ON issue_dependencies(blocker_issue_id);
        CREATE INDEX IF NOT EXISTS idx_issue_dependencies_blocked ON issue_dependencies(blocked_issue_id);
        CREATE INDEX IF NOT EXISTS idx_session_metrics_started_at ON session_metrics(started_at);
        CREATE INDEX IF NOT EXISTS idx_session_metrics_provider ON session_metrics(provider);
        CREATE INDEX IF NOT EXISTS idx_turn_metrics_session_id ON turn_metrics(session_id);
        CREATE INDEX IF NOT EXISTS idx_turn_metrics_category ON turn_metrics(category);
        CREATE INDEX IF NOT EXISTS idx_tool_usage_session_id ON tool_usage(session_id);
        CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_name ON tool_usage(tool_name);
        CREATE INDEX IF NOT EXISTS idx_workspace_commands_dashboard ON workspace_commands(dashboard_id);
        CREATE INDEX IF NOT EXISTS idx_turn_metrics_timestamp ON turn_metrics(timestamp);
        CREATE INDEX IF NOT EXISTS idx_tool_usage_timestamp ON tool_usage(timestamp);
        CREATE INDEX IF NOT EXISTS idx_session_metrics_cost_usd ON session_metrics(cost_usd DESC);

        COMMIT;
        ",
    )?;

    Ok(())
}
