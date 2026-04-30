use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// A custom key binding for a named action, stored in SQLite.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct KeyboardShortcut {
    pub action_id: String,
    pub binding: String,
}

pub const KEYBOARD_SHORTCUT_SELECT_COLUMNS: &str = "action_id, binding";

pub fn row_to_keyboard_shortcut(
    row: &rusqlite::Row,
) -> Result<KeyboardShortcut, rusqlite::Error> {
    Ok(KeyboardShortcut {
        action_id: row.get(0)?,
        binding: row.get(1)?,
    })
}

/// Request to insert or replace a custom key binding.
#[derive(Debug, Deserialize)]
pub struct UpsertCustomBindingRequest {
    pub action_id: String,
    pub binding: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serde_round_trip() {
        let shortcut = KeyboardShortcut {
            action_id: "action.save".into(),
            binding: "Ctrl+S".into(),
        };
        let json = serde_json::to_string(&shortcut).unwrap();
        let deserialized: KeyboardShortcut = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.action_id, shortcut.action_id);
        assert_eq!(deserialized.binding, shortcut.binding);
    }

    #[test]
    fn upsert_request_deserializes() {
        let json = r#"{"action_id":"action.open","binding":"Ctrl+O"}"#;
        let request: UpsertCustomBindingRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.action_id, "action.open");
        assert_eq!(request.binding, "Ctrl+O");
    }
}
