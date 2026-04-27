use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct LabelShapeMapping {
    pub id: String,
    pub dashboard_id: String,
    pub label_name: String,
    pub tree_shape: String,
    pub color: Option<String>,
    pub priority_order: i32,
}
