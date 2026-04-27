use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum BranchStatus {
    Active,
    Local,
    RemoteGone,
    Deleted,
    Unknown,
}

impl BranchStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            BranchStatus::Active => "active",
            BranchStatus::Local => "local",
            BranchStatus::RemoteGone => "remote-gone",
            BranchStatus::Deleted => "deleted",
            BranchStatus::Unknown => "unknown",
        }
    }
}

/// Rejects branch refs starting with `-` to prevent argument injection.
pub fn is_unsafe_branch_ref(ref_name: &str) -> bool {
    ref_name.starts_with('-')
}
