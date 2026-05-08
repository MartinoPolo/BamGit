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
             (event_type, sound_enabled, sound_file, toast_enabled, window_flash_enabled) \
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![
                config.event_type,
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
        "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('startup_behavior', 'overview');",
    )?;

    seed_grovekeeper_workspace(connection)?;

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
