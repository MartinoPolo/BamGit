use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct WindowWorkspaceBinding {
    pub window_label: String,
    pub dashboard_id: String,
    pub window_x: Option<i32>,
    pub window_y: Option<i32>,
    pub window_width: Option<i32>,
    pub window_height: Option<i32>,
}
