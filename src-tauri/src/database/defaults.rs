use rusqlite::Connection;

pub const DEFAULT_TREE_SHAPE: &str = "cherry";

const DEFAULT_LABEL_SHAPE_MAPPINGS: &[(&str, &str, i32)] = &[
    ("prd", "apple", 0),
    ("epic", "baobab", 1),
    ("bug", "maple", 2),
    ("feature", "oak", 3),
    ("task", "pine", 4),
    ("documentation", "willow", 5),
    ("refactor", "birch", 6),
    ("infrastructure", "cypress", 7),
    ("ci", "cypress", 8),
];

pub fn seed_label_shape_mappings_for_dashboard(
    connection: &Connection,
    dashboard_id: &str,
) -> Result<(), rusqlite::Error> {
    for (label_name, tree_shape, priority_order) in DEFAULT_LABEL_SHAPE_MAPPINGS {
        let id = uuid::Uuid::new_v4().to_string();
        connection.execute(
            "INSERT OR IGNORE INTO label_shape_mappings \
             (id, dashboard_id, label_name, tree_shape, priority_order) \
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![id, dashboard_id, label_name, tree_shape, priority_order],
        )?;
    }
    Ok(())
}

pub fn seed_defaults(connection: &Connection) -> Result<(), rusqlite::Error> {
    use crate::models::notification::NotificationConfig;
    for config in NotificationConfig::defaults() {
        connection.execute(
            "INSERT OR IGNORE INTO notification_config \
             (event_type, importance_tier, sound_enabled, sound_file, toast_enabled, window_flash_enabled) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                config.event_type,
                config.importance_tier,
                config.sound_enabled,
                config.sound_file,
                config.toast_enabled,
                config.window_flash_enabled,
            ],
        )?;
    }

    crate::commands::color_palette_commands::seed_built_in_palettes_with_connection(connection)
        .map_err(|error| {
            rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_ERROR),
                Some(error),
            )
        })?;

    connection.execute_batch(
        "INSERT OR IGNORE INTO user_settings (key, value) VALUES ('startup_behavior', 'overview');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('chart_color_theme', 'monochrome');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('theme_mode', 'system');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('accent_color', 'moss');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('username', 'User');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('user_initials', 'U');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('language', 'en');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('issue_card_variant', 'refined-horizon');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('issue_card_button_color', 'issue-color');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('issue_card_priority_position', 'header-right');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('issue_card_badge_style', 'subtle');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('issue_card_label_tint', '20');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('issue_card_overlay_glow', '150');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('issue_card_gradient_reach', '60');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('issue_card_color_saturation', '150');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('issue_card_header_saturation', '85');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('issue_card_radial_intensity', '75');
         INSERT OR IGNORE INTO user_settings (key, value) VALUES ('editor_command', 'code');",
    )?;
    connection.execute(
        "INSERT OR IGNORE INTO user_settings (key, value) VALUES ('notification_volume', ?1)",
        rusqlite::params![crate::notification::DEFAULT_NOTIFICATION_VOLUME.to_string()],
    )?;

    seed_grovekeeper_workspace(connection)?;
    seed_fast_mode_multipliers(connection)?;

    Ok(())
}

fn seed_fast_mode_multipliers(connection: &Connection) -> Result<(), rusqlite::Error> {
    for (model_id, multiplier) in &[("claude-opus-4-7", 6.0), ("claude-opus-4-6", 6.0)] {
        connection.execute(
            "INSERT OR IGNORE INTO model_pricing_cache \
             (model_id, input_cost_per_token, output_cost_per_token, fast_mode_multiplier, source) \
             VALUES (?1, 0.0, 0.0, ?2, 'litellm')",
            rusqlite::params![model_id, multiplier],
        )?;
    }
    Ok(())
}

const GROVEKEEPER_DASHBOARD_ID: &str = "seed-grovekeeper";

fn seed_grovekeeper_workspace(connection: &Connection) -> Result<(), rusqlite::Error> {
    connection.execute(
        "INSERT OR IGNORE INTO dashboards \
         (id, name, type, github_repo, local_folder, default_base_branch, worktree_parent_folder, default_shape) \
         VALUES (?1, ?2, 'repo', ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![
            GROVEKEEPER_DASHBOARD_ID,
            "Grovekeeper",
            "MartinoPolo/Grovekeeper",
            "C:/_MP_projects/Grovekeeper",
            "dev",
            "C:/_MP_projects/worktrees",
            DEFAULT_TREE_SHAPE,
        ],
    )?;

    seed_label_shape_mappings_for_dashboard(connection, GROVEKEEPER_DASHBOARD_ID)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use crate::database::test_helpers::setup_test_database;
    use super::seed_defaults;

    const EXPECTED_SETTING_KEYS: &[&str] = &[
        "startup_behavior",
        "chart_color_theme",
        "theme_mode",
        "accent_color",
        "username",
        "user_initials",
        "language",
        "notification_volume",
        "issue_card_variant",
        "issue_card_button_color",
        "issue_card_priority_position",
        "issue_card_badge_style",
        "issue_card_label_tint",
        "issue_card_overlay_glow",
        "issue_card_gradient_reach",
        "issue_card_color_saturation",
        "issue_card_header_saturation",
        "issue_card_radial_intensity",
        "editor_command",
    ];

    #[test]
    fn seed_defaults_inserts_all_setting_keys() {
        let connection = setup_test_database();
        seed_defaults(&connection).unwrap();

        let mut statement = connection
            .prepare("SELECT key FROM user_settings ORDER BY key")
            .unwrap();
        let seeded_keys: Vec<String> = statement
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        for expected_key in EXPECTED_SETTING_KEYS {
            assert!(
                seeded_keys.contains(&expected_key.to_string()),
                "Missing seed default for key: {expected_key}"
            );
        }
    }

    #[test]
    fn seed_defaults_is_idempotent() {
        let connection = setup_test_database();
        seed_defaults(&connection).unwrap();
        seed_defaults(&connection).unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(DISTINCT key) FROM user_settings",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert!(count >= EXPECTED_SETTING_KEYS.len() as i64);
    }
}
