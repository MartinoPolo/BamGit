use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Action {
    pub id: String,
    pub dashboard_id: Option<String>,
    pub name: String,
    pub icon: Option<String>,
    pub command_template: String,
    pub sort_order: i64,
    pub visible: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateActionRequest {
    pub dashboard_id: Option<String>,
    pub name: String,
    pub icon: Option<String>,
    pub command_template: String,
    pub sort_order: Option<i64>,
    pub visible: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateActionRequest {
    pub id: String,
    pub name: Option<String>,
    pub icon: Option<Option<String>>,
    pub command_template: Option<String>,
    pub sort_order: Option<i64>,
    pub visible: Option<bool>,
}
