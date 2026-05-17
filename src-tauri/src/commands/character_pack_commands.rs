use tauri::{Manager, State};

use crate::database::connection::DatabaseState;
use crate::models::character_pack::{
    BulkImportRequest, CharacterEventSound, CharacterPack, CharacterPackWithSounds,
    CreateCharacterPackRequest, FolderScanResult, DetectedCharacter, ProposedMapping,
    SaveCharacterPackSoundsRequest, ScannedSound, UpdateCharacterPackRequest,
};
use uuid::Uuid;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CHARACTER_PACK_SELECT: &str =
    "SELECT id, name, display_name, language, avatar_path, is_bundled, is_enabled, is_complete, created_at FROM character_packs";

fn row_to_character_pack(row: &rusqlite::Row<'_>) -> rusqlite::Result<CharacterPack> {
    Ok(CharacterPack {
        id: row.get(0)?,
        name: row.get(1)?,
        display_name: row.get(2)?,
        language: row.get(3)?,
        avatar_path: row.get(4)?,
        is_bundled: row.get(5)?,
        is_enabled: row.get(6)?,
        is_complete: row.get(7)?,
        created_at: row.get(8)?,
    })
}

fn row_to_character_event_sound(row: &rusqlite::Row<'_>) -> rusqlite::Result<CharacterEventSound> {
    Ok(CharacterEventSound {
        id: row.get(0)?,
        character_pack_id: row.get(1)?,
        event_type: row.get(2)?,
        sound_file: row.get(3)?,
        label: row.get(4)?,
        sort_order: row.get(5)?,
    })
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_character_packs(db: State<'_, DatabaseState>) -> Result<Vec<CharacterPack>, String> {
    let conn = db.read()?;
    let mut stmt = conn
        .prepare(&format!(
            "{CHARACTER_PACK_SELECT} ORDER BY is_bundled DESC, created_at ASC"
        ))
        .map_err(|e| e.to_string())?;
    let packs = stmt
        .query_map([], |row| row_to_character_pack(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(packs)
}

#[tauri::command]
pub fn get_character_pack_with_sounds(
    db: State<'_, DatabaseState>,
    pack_id: String,
) -> Result<CharacterPackWithSounds, String> {
    let conn = db.read()?;
    let pack = conn
        .query_row(
            &format!("{CHARACTER_PACK_SELECT} WHERE id = ?1"),
            [&pack_id],
            |row| row_to_character_pack(row),
        )
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, character_pack_id, event_type, sound_file, label, sort_order \
             FROM character_event_sounds \
             WHERE character_pack_id = ?1 \
             ORDER BY event_type, sort_order",
        )
        .map_err(|e| e.to_string())?;
    let sounds = stmt
        .query_map([&pack_id], |row| row_to_character_event_sound(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(CharacterPackWithSounds { pack, sounds })
}

#[tauri::command]
pub fn create_character_pack(
    db: State<'_, DatabaseState>,
    request: CreateCharacterPackRequest,
) -> Result<CharacterPack, String> {
    let id = Uuid::new_v4().to_string();

    {
        let conn = db.write()?;
        conn.execute(
            "INSERT INTO character_packs (id, name, display_name, language) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![id, request.name, request.display_name, request.language],
        )
        .map_err(|e| e.to_string())?;
    }

    let conn = db.read()?;
    conn.query_row(
        &format!("{CHARACTER_PACK_SELECT} WHERE id = ?1"),
        [&id],
        |row| row_to_character_pack(row),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_character_pack(
    db: State<'_, DatabaseState>,
    request: UpdateCharacterPackRequest,
) -> Result<CharacterPack, String> {
    {
        let conn = db.write()?;

        let is_bundled: bool = conn
            .query_row(
                "SELECT is_bundled FROM character_packs WHERE id = ?1",
                [&request.id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        if is_bundled {
            return Err("Cannot edit bundled character packs".to_owned());
        }

        if let Some(name) = &request.name {
            conn.execute(
                "UPDATE character_packs SET name = ?1 WHERE id = ?2",
                rusqlite::params![name, request.id],
            )
            .map_err(|e| e.to_string())?;
        }
        if let Some(display_name) = &request.display_name {
            conn.execute(
                "UPDATE character_packs SET display_name = ?1 WHERE id = ?2",
                rusqlite::params![display_name, request.id],
            )
            .map_err(|e| e.to_string())?;
        }
        if let Some(language) = &request.language {
            conn.execute(
                "UPDATE character_packs SET language = ?1 WHERE id = ?2",
                rusqlite::params![language, request.id],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    let conn = db.read()?;
    conn.query_row(
        &format!("{CHARACTER_PACK_SELECT} WHERE id = ?1"),
        [&request.id],
        |row| row_to_character_pack(row),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_character_pack(
    db: State<'_, DatabaseState>,
    app: tauri::AppHandle,
    pack_id: String,
) -> Result<(), String> {
    let pack_name: String;

    {
        let conn = db.write()?;

        let (is_bundled, name): (bool, String) = conn
            .query_row(
                "SELECT is_bundled, name FROM character_packs WHERE id = ?1",
                [&pack_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .map_err(|e| e.to_string())?;
        if is_bundled {
            return Err("Cannot delete bundled character packs".to_owned());
        }
        pack_name = name;

        // Reset issues using this pack to no character
        conn.execute(
            "UPDATE issues SET character_pack_id = NULL, character_avatar = NULL WHERE character_pack_id = ?1",
            [&pack_id],
        )
        .map_err(|e| e.to_string())?;

        // Delete pack (cascade deletes event sounds)
        conn.execute("DELETE FROM character_packs WHERE id = ?1", [&pack_id])
            .map_err(|e| e.to_string())?;
    }

    // Clean up sound files
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let pack_dir = app_data.join("sound-packs").join(&pack_name);
    if pack_dir.exists() {
        let _ = std::fs::remove_dir_all(&pack_dir);
    }

    Ok(())
}

#[tauri::command]
pub fn toggle_character_pack_enabled(
    db: State<'_, DatabaseState>,
    pack_id: String,
    enabled: bool,
) -> Result<(), String> {
    let conn = db.write()?;

    if enabled {
        let is_complete: bool = conn
            .query_row(
                "SELECT is_complete FROM character_packs WHERE id = ?1",
                [&pack_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        if !is_complete {
            return Err("Cannot enable incomplete character pack".to_owned());
        }
    }

    conn.execute(
        "UPDATE character_packs SET is_enabled = ?1 WHERE id = ?2",
        rusqlite::params![enabled, pack_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Sound assignments ────────────────────────────────────────────────────────

const CRITICAL_EVENTS: [&str; 2] = ["session.needs-input", "session.end"];

fn all_critical_events_present(assignments: &[crate::models::character_pack::SoundAssignment]) -> bool {
    CRITICAL_EVENTS
        .iter()
        .all(|event| assignments.iter().any(|a| a.event_type == *event))
}

#[tauri::command]
pub fn save_character_pack_sounds(
    db: State<'_, DatabaseState>,
    request: SaveCharacterPackSoundsRequest,
) -> Result<(), String> {
    let conn = db.write()?;

    // Delete existing assignments
    conn.execute(
        "DELETE FROM character_event_sounds WHERE character_pack_id = ?1",
        [&request.character_pack_id],
    )
    .map_err(|e| e.to_string())?;

    // Insert new assignments
    for assignment in &request.assignments {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO character_event_sounds (id, character_pack_id, event_type, sound_file, label, sort_order) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                id,
                request.character_pack_id,
                assignment.event_type,
                assignment.sound_file,
                assignment.label,
                assignment.sort_order
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    let all_critical_filled = all_critical_events_present(&request.assignments);

    conn.execute(
        "UPDATE character_packs SET is_complete = ?1 WHERE id = ?2",
        rusqlite::params![all_critical_filled, request.character_pack_id],
    )
    .map_err(|e| e.to_string())?;

    // Auto-disable if not complete
    if !all_critical_filled {
        conn.execute(
            "UPDATE character_packs SET is_enabled = 0 WHERE id = ?1 AND is_enabled = 1",
            [&request.character_pack_id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn upload_character_avatar(
    db: State<'_, DatabaseState>,
    app: tauri::AppHandle,
    pack_id: String,
    image_data: Vec<u8>,
) -> Result<String, String> {
    let img = image::load_from_memory(&image_data).map_err(|e| format!("Invalid image: {e}"))?;
    let resized = img.resize_to_fill(128, 128, image::imageops::FilterType::Lanczos3);

    let pack_name: String = {
        let conn = db.read()?;
        conn.query_row(
            "SELECT name FROM character_packs WHERE id = ?1",
            [&pack_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?
    };

    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let pack_dir = app_data.join("sound-packs").join(&pack_name);
    std::fs::create_dir_all(&pack_dir).map_err(|e| e.to_string())?;

    let avatar_path = pack_dir.join("avatar.webp");
    resized
        .save_with_format(&avatar_path, image::ImageFormat::WebP)
        .map_err(|e| format!("Failed to save avatar: {e}"))?;

    let relative_path = format!("{pack_name}/avatar.webp");

    {
        let conn = db.write()?;
        conn.execute(
            "UPDATE character_packs SET avatar_path = ?1 WHERE id = ?2",
            rusqlite::params![relative_path, pack_id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(relative_path)
}

// ─── Folder scanning ──────────────────────────────────────────────────────────

#[tauri::command]
pub fn scan_folder_for_characters(folder_path: String) -> Result<FolderScanResult, String> {
    use walkdir::WalkDir;

    let root = std::path::Path::new(&folder_path);
    if !root.is_dir() {
        return Err(format!("Not a directory: {folder_path}"));
    }

    let audio_extensions = ["wav", "mp3", "ogg", "flac"];
    let mut characters: Vec<DetectedCharacter> = Vec::new();

    // Walk the directory tree, looking for folders that contain audio files
    for entry in WalkDir::new(root).min_depth(1).max_depth(3) {
        let entry = entry.map_err(|e| e.to_string())?;
        if !entry.file_type().is_dir() {
            continue;
        }

        let dir_path = entry.path();
        let sounds: Vec<ScannedSound> = std::fs::read_dir(dir_path)
            .map_err(|e| e.to_string())?
            .filter_map(|e| e.ok())
            .filter(|e| {
                e.path()
                    .extension()
                    .and_then(|ext| ext.to_str())
                    .map(|ext| audio_extensions.contains(&ext.to_lowercase().as_str()))
                    .unwrap_or(false)
            })
            .map(|e| {
                let path = e.path();
                let file_name = e.file_name().to_string_lossy().into_owned();
                let full_path = path.to_string_lossy().into_owned();
                let relative_path = path
                    .strip_prefix(root)
                    .unwrap_or(&path)
                    .to_string_lossy()
                    .into_owned();
                ScannedSound {
                    file_name,
                    relative_path,
                    full_path,
                    duration_ms: None,
                }
            })
            .collect();

        if sounds.is_empty() {
            continue;
        }

        let folder_name = dir_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned();
        let parent_folder = dir_path.parent().and_then(|p| {
            if p == root {
                None
            } else {
                p.file_name()
                    .map(|n| n.to_string_lossy().into_owned())
            }
        });

        let proposed_mappings = auto_map_sounds(&sounds);

        characters.push(DetectedCharacter {
            folder_name,
            folder_path: dir_path.to_string_lossy().into_owned(),
            parent_folder,
            sounds,
            proposed_mappings,
        });
    }

    let total_sounds = characters.iter().map(|c| c.sounds.len()).sum();

    Ok(FolderScanResult {
        root_folder: folder_path,
        characters,
        total_sounds,
    })
}

// ─── Auto-mapping ─────────────────────────────────────────────────────────────

fn auto_map_sounds(sounds: &[ScannedSound]) -> Vec<ProposedMapping> {
    sounds
        .iter()
        .filter_map(|sound| {
            let stem = sound
                .file_name
                .rsplit_once('.')
                .map(|(s, _)| s)
                .unwrap_or(&sound.file_name)
                .to_lowercase();

            match_wc3_pattern(&stem).map(|(event_type, confidence)| ProposedMapping {
                sound_file: sound.file_name.clone(),
                event_type: event_type.to_owned(),
                confidence,
            })
        })
        .collect()
}

fn match_wc3_pattern(stem: &str) -> Option<(&'static str, f64)> {
    // WC3 filename patterns → notification event types
    if stem.starts_with("what") {
        // What1, What2, ... → session.needs-input (critical)
        return Some(("session.needs-input", 0.9));
    }
    if stem.starts_with("yesattack") {
        // YesAttack1, ... → task.complete (check before "yes" prefix)
        return Some(("task.complete", 0.8));
    }
    if stem.starts_with("yes") {
        // Yes1, Yes2, ... → task.acknowledge
        return Some(("task.acknowledge", 0.85));
    }
    if stem.starts_with("ready") {
        // Ready1, ... → session.start
        return Some(("session.start", 0.85));
    }
    if stem.starts_with("death") {
        // Death1, ... → session.error
        return Some(("session.error", 0.85));
    }
    if stem.starts_with("pissed") {
        // Pissed1, ... → resource.limit
        return Some(("resource.limit", 0.7));
    }
    if stem.starts_with("warcry") {
        // Warcry1, ... → pr.ready
        return Some(("pr.ready", 0.6));
    }
    if stem.starts_with("build") {
        // Build → task.complete alternate
        return Some(("task.complete", 0.5));
    }
    None
}

// ─── Bulk import ──────────────────────────────────────────────────────────────

#[tauri::command]
pub fn bulk_import_characters(
    db: State<'_, DatabaseState>,
    app: tauri::AppHandle,
    request: BulkImportRequest,
) -> Result<Vec<CharacterPack>, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let mut created_packs = Vec::new();

    for character in &request.characters {
        let id = Uuid::new_v4().to_string();
        let source_dir = std::path::Path::new(&character.folder_path);
        let target_dir = app_data.join("sound-packs").join(&character.name);

        // Copy sound files
        std::fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
        for assignment in &character.assignments {
            let source_file = source_dir.join(&assignment.sound_file);
            if source_file.exists() {
                std::fs::copy(&source_file, target_dir.join(&assignment.sound_file))
                    .map_err(|e| format!("Failed to copy {}: {e}", assignment.sound_file))?;
            }
        }

        let is_complete = CRITICAL_EVENTS
            .iter()
            .all(|event| character.assignments.iter().any(|a| a.event_type == *event));

        {
            let conn = db.write()?;

            // Insert pack
            conn.execute(
                "INSERT INTO character_packs (id, name, display_name, language, is_complete) VALUES (?1, ?2, ?3, ?4, ?5)",
                rusqlite::params![id, character.name, character.display_name, character.language, is_complete],
            )
            .map_err(|e| e.to_string())?;

            // Insert sound assignments
            for assignment in &character.assignments {
                let sound_id = Uuid::new_v4().to_string();
                conn.execute(
                    "INSERT INTO character_event_sounds (id, character_pack_id, event_type, sound_file, label, sort_order) \
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    rusqlite::params![
                        sound_id,
                        id,
                        assignment.event_type,
                        assignment.sound_file,
                        assignment.label,
                        assignment.sort_order
                    ],
                )
                .map_err(|e| e.to_string())?;
            }
        }

        let pack = {
            let conn = db.read()?;
            conn.query_row(
                &format!("{CHARACTER_PACK_SELECT} WHERE id = ?1"),
                [&id],
                |row| row_to_character_pack(row),
            )
            .map_err(|e| e.to_string())?
        };

        created_packs.push(pack);
    }

    Ok(created_packs)
}

// ─── Import sound files from folder ──────────────────────────────────────────

#[tauri::command]
pub fn import_sound_files(
    app: tauri::AppHandle,
    pack_id: String,
    pack_name: String,
    source_paths: Vec<String>,
) -> Result<Vec<ScannedSound>, String> {
    // pack_id is intentionally unused here — the directory is keyed by pack_name
    // to match the existing sound pack file layout convention.
    let _ = pack_id;

    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let target_dir = app_data.join("sound-packs").join(&pack_name);
    std::fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

    let audio_extensions = ["wav", "mp3", "ogg", "flac"];
    let mut imported = Vec::new();

    for source_path in &source_paths {
        let source = std::path::Path::new(source_path);

        if source.is_file() {
            let ext = source
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_lowercase();
            if !audio_extensions.contains(&ext.as_str()) {
                continue;
            }
            let file_name = source
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .into_owned();
            let target = target_dir.join(&file_name);
            std::fs::copy(source, &target).map_err(|e| e.to_string())?;
            imported.push(ScannedSound {
                file_name: file_name.clone(),
                relative_path: format!("{pack_name}/{file_name}"),
                full_path: target.to_string_lossy().into_owned(),
                duration_ms: None,
            });
        } else if source.is_dir() {
            for entry in std::fs::read_dir(source).map_err(|e| e.to_string())? {
                let entry = entry.map_err(|e| e.to_string())?;
                let path = entry.path();
                if !path.is_file() {
                    continue;
                }
                let ext = path
                    .extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("")
                    .to_lowercase();
                if !audio_extensions.contains(&ext.as_str()) {
                    continue;
                }
                let file_name = path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .into_owned();
                let target = target_dir.join(&file_name);
                std::fs::copy(&path, &target).map_err(|e| e.to_string())?;
                imported.push(ScannedSound {
                    file_name: file_name.clone(),
                    relative_path: format!("{pack_name}/{file_name}"),
                    full_path: target.to_string_lossy().into_owned(),
                    duration_ms: None,
                });
            }
        }
    }

    Ok(imported)
}
