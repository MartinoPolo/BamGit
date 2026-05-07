use std::collections::HashMap;
use std::path::Path;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// A sound entry within a category.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SoundEntry {
    pub file: String,
    pub label: String,
}

/// Grovekeeper-native sound pack manifest (grovekeeper.json).
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct GrovekeeperManifest {
    pub name: String,
    pub display_name: String,
    pub version: String,
    pub author: String,
    pub avatar: Option<String>,
    pub categories: HashMap<String, Vec<SoundEntry>>,
}

/// CESP v1.0 manifest (openpeon.json) — peon-ping compatible format.
#[derive(Debug, Clone, Deserialize)]
pub struct CespManifest {
    #[allow(dead_code)]
    pub cesp_version: String,
    pub name: String,
    pub display_name: String,
    pub categories: HashMap<String, Vec<CespSoundEntry>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CespSoundEntry {
    pub file: String,
    pub label: Option<String>,
}

/// Summary of an installed sound pack (for frontend listing).
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SoundPackInfo {
    pub name: String,
    pub display_name: String,
    pub version: String,
    pub author: String,
    pub avatar: Option<String>,
    pub event_count: usize,
    pub path: String,
}

/// Map CESP category names to Grovekeeper event type strings.
fn cesp_category_to_grovekeeper(cesp_category: &str) -> Option<&'static str> {
    match cesp_category {
        "session.start" => Some("session.start"),
        "session.end" => Some("session.end"),
        "task.acknowledge" => Some("task.acknowledge"),
        "task.complete" => Some("task.complete"),
        "task.error" => Some("session.error"),
        "input.required" => Some("session.needs-input"),
        "resource.limit" => Some("resource.limit"),
        // task.progress and user.spam are unmapped
        _ => None,
    }
}

/// Convert a CESP manifest to a Grovekeeper manifest.
pub fn cesp_to_grovekeeper(cesp: &CespManifest) -> GrovekeeperManifest {
    let mut categories: HashMap<String, Vec<SoundEntry>> = HashMap::new();

    for (cesp_category, sounds) in &cesp.categories {
        if let Some(gk_category) = cesp_category_to_grovekeeper(cesp_category) {
            let entries: Vec<SoundEntry> = sounds
                .iter()
                .map(|sound| SoundEntry {
                    file: sound.file.clone(),
                    label: sound
                        .label
                        .clone()
                        .unwrap_or_else(|| sound.file.clone()),
                })
                .collect();
            categories
                .entry(gk_category.to_owned())
                .or_default()
                .extend(entries);
        }
    }

    GrovekeeperManifest {
        name: cesp.name.clone(),
        display_name: cesp.display_name.clone(),
        version: "1.0.0".to_owned(),
        author: String::new(),
        avatar: None,
        categories,
    }
}

/// Load a manifest from a pack directory (checks grovekeeper.json first, then openpeon.json).
pub fn load_manifest(pack_directory: &Path) -> Result<GrovekeeperManifest, String> {
    let gk_manifest_path = pack_directory.join("grovekeeper.json");
    if gk_manifest_path.exists() {
        let content = std::fs::read_to_string(&gk_manifest_path)
            .map_err(|error| format!("Failed to read manifest: {error}"))?;
        return serde_json::from_str::<GrovekeeperManifest>(&content)
            .map_err(|error| format!("Invalid grovekeeper.json: {error}"));
    }

    let cesp_manifest_path = pack_directory.join("openpeon.json");
    if cesp_manifest_path.exists() {
        let content = std::fs::read_to_string(&cesp_manifest_path)
            .map_err(|error| format!("Failed to read CESP manifest: {error}"))?;
        let cesp: CespManifest = serde_json::from_str(&content)
            .map_err(|error| format!("Invalid openpeon.json: {error}"))?;
        return Ok(cesp_to_grovekeeper(&cesp));
    }

    Err(format!(
        "No manifest found in {}",
        pack_directory.display()
    ))
}

/// Discover all installed sound packs from both resource dir and app_data dir.
pub fn discover_packs(
    resource_directory: &Path,
    app_data_directory: &Path,
) -> Vec<SoundPackInfo> {
    let mut packs = Vec::new();

    // Bundled packs (in resources/sounds/)
    let bundled_dir = resource_directory.join("sounds");
    scan_pack_directory(&bundled_dir, &mut packs);

    // User-installed packs (in app_data_dir/sound-packs/)
    let user_dir = app_data_directory.join("sound-packs");
    scan_pack_directory(&user_dir, &mut packs);

    packs
}

fn scan_pack_directory(parent_directory: &Path, packs: &mut Vec<SoundPackInfo>) {
    let entries = match std::fs::read_dir(parent_directory) {
        Ok(entries) => entries,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        if let Ok(manifest) = load_manifest(&path) {
            let event_count: usize = manifest.categories.values().map(|v| v.len()).sum();
            packs.push(SoundPackInfo {
                name: manifest.name,
                display_name: manifest.display_name,
                version: manifest.version,
                author: manifest.author,
                avatar: manifest.avatar,
                event_count,
                path: path.to_string_lossy().into_owned(),
            });
        }
    }
}

/// Install a sound pack from a source directory into the user's pack directory.
pub fn install_pack(
    source_directory: &Path,
    app_data_directory: &Path,
) -> Result<SoundPackInfo, String> {
    let manifest = load_manifest(source_directory)?;
    let target_directory = app_data_directory
        .join("sound-packs")
        .join(&manifest.name);

    if target_directory.exists() {
        return Err(format!("Pack '{}' is already installed", manifest.name));
    }

    copy_directory_recursive(source_directory, &target_directory)
        .map_err(|error| format!("Failed to install pack: {error}"))?;

    let event_count: usize = manifest.categories.values().map(|v| v.len()).sum();
    Ok(SoundPackInfo {
        name: manifest.name,
        display_name: manifest.display_name,
        version: manifest.version,
        author: manifest.author,
        avatar: manifest.avatar,
        event_count,
        path: target_directory.to_string_lossy().into_owned(),
    })
}

/// Remove an installed sound pack.
pub fn remove_pack(pack_name: &str, app_data_directory: &Path) -> Result<(), String> {
    let pack_directory = app_data_directory.join("sound-packs").join(pack_name);
    if !pack_directory.exists() {
        return Err(format!("Pack '{pack_name}' not found"));
    }

    // Only allow removing user-installed packs (in app_data_dir)
    if !pack_directory.starts_with(app_data_directory.join("sound-packs")) {
        return Err("Cannot remove bundled packs".to_owned());
    }

    std::fs::remove_dir_all(&pack_directory)
        .map_err(|error| format!("Failed to remove pack: {error}"))
}

fn copy_directory_recursive(source: &Path, destination: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(destination)?;
    for entry in std::fs::read_dir(source)? {
        let entry = entry?;
        let target = destination.join(entry.file_name());
        if entry.file_type()?.is_dir() {
            copy_directory_recursive(&entry.path(), &target)?;
        } else {
            std::fs::copy(entry.path(), target)?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn cesp_category_mapping() {
        assert_eq!(
            cesp_category_to_grovekeeper("session.start"),
            Some("session.start")
        );
        assert_eq!(
            cesp_category_to_grovekeeper("task.error"),
            Some("session.error")
        );
        assert_eq!(
            cesp_category_to_grovekeeper("input.required"),
            Some("session.needs-input")
        );
        assert_eq!(cesp_category_to_grovekeeper("task.progress"), None);
        assert_eq!(cesp_category_to_grovekeeper("user.spam"), None);
    }

    #[test]
    fn load_grovekeeper_manifest() {
        let temp_dir = tempfile::tempdir().unwrap();
        let manifest = r#"{
            "name": "grove",
            "display_name": "Grove",
            "version": "1.0.0",
            "author": "Grovekeeper",
            "avatar": null,
            "categories": {
                "session.start": [{"file": "start.wav", "label": "Start"}]
            }
        }"#;
        fs::write(temp_dir.path().join("grovekeeper.json"), manifest).unwrap();

        let result = load_manifest(temp_dir.path());
        assert!(result.is_ok());
        let manifest = result.unwrap();
        assert_eq!(manifest.name, "grove");
        assert_eq!(manifest.categories.len(), 1);
    }

    #[test]
    fn load_cesp_manifest_converts_correctly() {
        let temp_dir = tempfile::tempdir().unwrap();
        let manifest = r#"{
            "cesp_version": "1.0",
            "name": "peon",
            "display_name": "Peon Pack",
            "categories": {
                "input.required": [{"file": "work.wav", "label": "Work work"}],
                "task.progress": [{"file": "progress.wav"}]
            }
        }"#;
        fs::write(temp_dir.path().join("openpeon.json"), manifest).unwrap();

        let result = load_manifest(temp_dir.path());
        assert!(result.is_ok());
        let manifest = result.unwrap();
        assert_eq!(manifest.name, "peon");
        // task.progress is unmapped so only input.required → session.needs-input
        assert_eq!(manifest.categories.len(), 1);
        assert!(manifest.categories.contains_key("session.needs-input"));
    }

    #[test]
    fn discover_packs_finds_installed() {
        let resource_dir = tempfile::tempdir().unwrap();
        let grove_dir = resource_dir.path().join("sounds").join("grove");
        fs::create_dir_all(&grove_dir).unwrap();
        let manifest = r#"{
            "name": "grove",
            "display_name": "Grove",
            "version": "1.0.0",
            "author": "Grovekeeper",
            "avatar": null,
            "categories": {}
        }"#;
        fs::write(grove_dir.join("grovekeeper.json"), manifest).unwrap();

        let app_data = tempfile::tempdir().unwrap();
        let packs = discover_packs(resource_dir.path(), app_data.path());
        assert_eq!(packs.len(), 1);
        assert_eq!(packs[0].name, "grove");
    }

    #[test]
    fn install_and_remove_pack() {
        let source_dir = tempfile::tempdir().unwrap();
        let manifest = r#"{
            "name": "test-pack",
            "display_name": "Test Pack",
            "version": "1.0.0",
            "author": "Test",
            "avatar": null,
            "categories": {}
        }"#;
        fs::write(source_dir.path().join("grovekeeper.json"), manifest).unwrap();
        fs::write(source_dir.path().join("test.wav"), b"fake").unwrap();

        let app_data = tempfile::tempdir().unwrap();

        let result = install_pack(source_dir.path(), app_data.path());
        assert!(result.is_ok());

        let pack_dir = app_data.path().join("sound-packs").join("test-pack");
        assert!(pack_dir.exists());
        assert!(pack_dir.join("grovekeeper.json").exists());
        assert!(pack_dir.join("test.wav").exists());

        let result = remove_pack("test-pack", app_data.path());
        assert!(result.is_ok());
        assert!(!pack_dir.exists());
    }
}
