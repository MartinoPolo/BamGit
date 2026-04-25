use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LabelShapeMapping {
    pub id: String,
    pub dashboard_id: String,
    pub label_name: String,
    pub tree_shape: String,
    pub color: Option<String>,
    pub priority_order: i32,
}
