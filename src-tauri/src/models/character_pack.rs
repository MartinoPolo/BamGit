use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct CharacterPack {
    pub id: String,
    pub name: String,
    pub display_name: String,
    pub language: Option<String>,
    pub avatar_path: Option<String>,
    pub is_bundled: bool,
    pub is_enabled: bool,
    pub is_complete: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct CharacterEventSound {
    pub id: String,
    pub character_pack_id: String,
    pub event_type: String,
    pub sound_file: String,
    pub label: Option<String>,
    #[ts(type = "number")]
    pub sort_order: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct CharacterPackWithSounds {
    #[serde(flatten)]
    pub pack: CharacterPack,
    pub sounds: Vec<CharacterEventSound>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCharacterPackRequest {
    pub name: String,
    pub display_name: String,
    pub language: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCharacterPackRequest {
    pub id: String,
    pub display_name: Option<String>,
    pub language: Option<Option<String>>,
}

#[derive(Debug, Deserialize)]
pub struct SaveCharacterPackSoundsRequest {
    pub character_pack_id: String,
    pub assignments: Vec<SoundAssignment>,
}

#[derive(Debug, Deserialize)]
pub struct SoundAssignment {
    pub event_type: String,
    pub sound_file: String,
    pub label: Option<String>,
    pub sort_order: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ScannedSound {
    pub file_name: String,
    pub relative_path: String,
    pub full_path: String,
    #[ts(type = "number | null")]
    pub duration_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct DetectedCharacter {
    pub folder_name: String,
    pub folder_path: String,
    pub parent_folder: Option<String>,
    pub sounds: Vec<ScannedSound>,
    pub proposed_mappings: Vec<ProposedMapping>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ProposedMapping {
    pub sound_file: String,
    pub event_type: String,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct FolderScanResult {
    pub root_folder: String,
    pub characters: Vec<DetectedCharacter>,
    #[ts(type = "number")]
    pub total_sounds: usize,
}

#[derive(Debug, Deserialize)]
pub struct BulkImportRequest {
    pub characters: Vec<BulkImportCharacter>,
}

#[derive(Debug, Deserialize)]
pub struct BulkImportCharacter {
    pub folder_path: String,
    pub name: String,
    pub display_name: String,
    pub language: Option<String>,
    pub assignments: Vec<SoundAssignment>,
}
