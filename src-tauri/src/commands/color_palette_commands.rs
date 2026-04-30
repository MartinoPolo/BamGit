use rusqlite::Row;
use tauri::State;
use uuid::Uuid;

use crate::database::connection::DatabaseState;
use crate::models::color_palette::{
    ColorPalette, CreateColorPaletteRequest, UpdateColorPaletteRequest,
};

const DEFAULT_PALETTE_ID: &str = "palette-vivid";
const PALETTE_SELECT_COLUMNS: &str = "id, name, colors, is_built_in";

fn row_to_color_palette(row: &Row) -> Result<ColorPalette, rusqlite::Error> {
    let colors_json: String = row.get(2)?;
    let colors: Vec<String> = serde_json::from_str(&colors_json).map_err(|error| {
        rusqlite::Error::FromSqlConversionFailure(
            2,
            rusqlite::types::Type::Text,
            Box::new(error),
        )
    })?;

    Ok(ColorPalette {
        id: row.get(0)?,
        name: row.get(1)?,
        colors,
        is_built_in: row.get::<_, i32>(3)? != 0,
    })
}

/// Built-in palette definitions. Each tuple: (id, name, colors).
/// Using fixed UUIDs so seeding is idempotent.
const BUILT_IN_PALETTES: &[(&str, &str, &[&str])] = &[
    (
        "palette-vivid",
        "Vivid",
        &[
            "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
            "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
            "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
            "#ec4899", "#f43f5e", "#fb923c", "#34d399", "#818cf8",
        ],
    ),
    (
        "palette-pastel",
        "Pastel",
        &[
            "#fca5a5", "#fdba74", "#fcd34d", "#fde047", "#bef264",
            "#86efac", "#6ee7b7", "#5eead4", "#67e8f9", "#7dd3fc",
            "#93c5fd", "#a5b4fc", "#c4b5fd", "#d8b4fe", "#f0abfc",
            "#f9a8d4", "#fda4af", "#fed7aa", "#a7f3d0", "#c7d2fe",
        ],
    ),
    (
        "palette-muted",
        "Muted",
        &[
            "#b91c1c", "#c2410c", "#b45309", "#a16207", "#4d7c0f",
            "#15803d", "#047857", "#0f766e", "#0e7490", "#0369a1",
            "#1d4ed8", "#4338ca", "#6d28d9", "#7e22ce", "#a21caf",
            "#be185d", "#be123c", "#9a3412", "#065f46", "#3730a3",
        ],
    ),
];

/// Seed built-in palettes (used by migration v5). Idempotent via INSERT OR IGNORE.
pub fn seed_built_in_palettes_with_connection(
    connection: &rusqlite::Connection,
) -> Result<(), String> {
    for (id, name, colors) in BUILT_IN_PALETTES {
        let colors_json =
            serde_json::to_string(colors).map_err(|error| format!("JSON error: {error}"))?;

        connection
            .execute(
                "INSERT OR IGNORE INTO color_palettes (id, name, colors, is_built_in) \
                 VALUES (?1, ?2, ?3, 1)",
                rusqlite::params![id, name, colors_json],
            )
            .map_err(|error| format!("Failed to seed palette '{name}': {error}"))?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_all_color_palettes(state: State<DatabaseState>) -> Result<Vec<ColorPalette>, String> {
    let connection = state.read()?;

    let query = format!(
        "SELECT {PALETTE_SELECT_COLUMNS} FROM color_palettes ORDER BY is_built_in DESC, name"
    );
    let mut statement = connection
        .prepare(&query)
        .map_err(|error| format!("Failed to prepare query: {error}"))?;

    let palettes = statement
        .query_map([], |row| row_to_color_palette(row))
        .map_err(|error| format!("Failed to query palettes: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read palette row: {error}"))?;

    Ok(palettes)
}

#[tauri::command]
pub fn get_color_palette(state: State<DatabaseState>, id: String) -> Result<ColorPalette, String> {
    let connection = state.read()?;

    let query = format!("SELECT {PALETTE_SELECT_COLUMNS} FROM color_palettes WHERE id = ?1");
    connection
        .query_row(&query, [&id], |row| row_to_color_palette(row))
        .map_err(|error| format!("Color palette not found: {error}"))
}

#[tauri::command]
pub fn create_color_palette(
    state: State<DatabaseState>,
    request: CreateColorPaletteRequest,
) -> Result<ColorPalette, String> {
    let connection = state.write()?;
    let id = Uuid::new_v4().to_string();

    let colors_json =
        serde_json::to_string(&request.colors).map_err(|error| format!("JSON error: {error}"))?;

    connection
        .execute(
            "INSERT INTO color_palettes (id, name, colors, is_built_in) \
             VALUES (?1, ?2, ?3, 0)",
            rusqlite::params![id, request.name, colors_json],
        )
        .map_err(|error| format!("Failed to create palette: {error}"))?;

    Ok(ColorPalette {
        id,
        name: request.name,
        colors: request.colors,
        is_built_in: false,
    })
}

#[tauri::command]
pub fn update_color_palette(
    state: State<DatabaseState>,
    request: UpdateColorPaletteRequest,
) -> Result<ColorPalette, String> {
    let connection = state.write()?;

    let query = format!("SELECT {PALETTE_SELECT_COLUMNS} FROM color_palettes WHERE id = ?1");
    let existing = connection
        .query_row(&query, [&request.id], |row| row_to_color_palette(row))
        .map_err(|error| format!("Color palette not found: {error}"))?;

    if existing.is_built_in {
        return Err("ERR_PALETTE_BUILTIN".to_string());
    }

    let name = request.name.unwrap_or(existing.name);
    let colors = request.colors.unwrap_or(existing.colors);
    let colors_json =
        serde_json::to_string(&colors).map_err(|error| format!("JSON error: {error}"))?;

    connection
        .execute(
            "UPDATE color_palettes SET name = ?1, colors = ?2 WHERE id = ?3",
            rusqlite::params![name, colors_json, existing.id],
        )
        .map_err(|error| format!("Failed to update palette: {error}"))?;

    Ok(ColorPalette {
        id: existing.id,
        name,
        colors,
        is_built_in: false,
    })
}

#[tauri::command]
pub fn delete_color_palette(state: State<DatabaseState>, id: String) -> Result<(), String> {
    let connection = state.write()?;

    // Check if built-in
    let is_built_in: i32 = connection
        .query_row(
            "SELECT is_built_in FROM color_palettes WHERE id = ?1",
            [&id],
            |row| row.get(0),
        )
        .map_err(|error| format!("Color palette not found: {error}"))?;

    if is_built_in != 0 {
        return Err("ERR_PALETTE_BUILTIN_DELETE".to_string());
    }

    // Check if in use by any dashboard
    let usage_count: i32 = connection
        .query_row(
            "SELECT COUNT(*) FROM dashboards WHERE color_palette_id = ?1",
            [&id],
            |row| row.get(0),
        )
        .map_err(|error| format!("Failed to check palette usage: {error}"))?;

    if usage_count > 0 {
        return Err(format!("ERR_PALETTE_IN_USE:{usage_count}"));
    }

    let rows_affected = connection
        .execute("DELETE FROM color_palettes WHERE id = ?1", [&id])
        .map_err(|error| format!("Failed to delete palette: {error}"))?;

    if rows_affected == 0 {
        return Err("ERR_PALETTE_NOT_FOUND".to_string());
    }

    Ok(())
}

/// Returns the next available color from the dashboard's palette that isn't already
/// assigned to an active issue. Wraps around if all colors are used.
#[tauri::command]
pub fn get_next_available_color(
    state: State<DatabaseState>,
    dashboard_id: String,
) -> Result<String, String> {
    let connection = state.read()?;

    // Get dashboard's palette ID
    let palette_id: Option<String> = connection
        .query_row(
            "SELECT color_palette_id FROM dashboards WHERE id = ?1",
            [&dashboard_id],
            |row| row.get(0),
        )
        .map_err(|_| "ERR_DASHBOARD_NOT_FOUND".to_string())?;

    // Default to vivid if no palette assigned
    let palette_id = palette_id.unwrap_or_else(|| DEFAULT_PALETTE_ID.to_string());

    // Get palette colors
    let colors_json: String = connection
        .query_row(
            "SELECT colors FROM color_palettes WHERE id = ?1",
            [&palette_id],
            |row| row.get(0),
        )
        .map_err(|error| format!("Palette not found: {error}"))?;

    let palette_colors: Vec<String> =
        serde_json::from_str(&colors_json).map_err(|error| format!("JSON error: {error}"))?;

    if palette_colors.is_empty() {
        return Err("ERR_PALETTE_EMPTY".to_string());
    }

    // Get colors already used by active issues in this dashboard
    let mut statement = connection
        .prepare(
            "SELECT color FROM issues WHERE dashboard_id = ?1 AND status = 'active' AND color IS NOT NULL",
        )
        .map_err(|error| format!("Failed to prepare query: {error}"))?;

    let used_colors: Vec<String> = statement
        .query_map([&dashboard_id], |row| row.get(0))
        .map_err(|error| format!("Failed to query used colors: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read color row: {error}"))?;

    // Find first palette color not in use
    for color in &palette_colors {
        if !used_colors.iter().any(|used| used.eq_ignore_ascii_case(color)) {
            return Ok(color.clone());
        }
    }

    // All colors used — wrap around using count modulo palette size
    let index = used_colors.len() % palette_colors.len();
    Ok(palette_colors[index].clone())
}
