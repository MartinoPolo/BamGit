use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct IssueDependency {
    pub id: String,
    pub blocker_issue_id: String,
    pub blocked_issue_id: String,
}
