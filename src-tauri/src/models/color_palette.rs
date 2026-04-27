use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ColorPalette {
    pub id: String,
    pub name: String,
    /// JSON array of hex color strings, e.g. ["#ef4444", "#f97316"]
    pub colors: Vec<String>,
    pub is_built_in: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateColorPaletteRequest {
    pub name: String,
    pub colors: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateColorPaletteRequest {
    pub id: String,
    pub name: Option<String>,
    pub colors: Option<Vec<String>>,
}
