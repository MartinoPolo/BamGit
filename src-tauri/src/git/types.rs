use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeInfo {
    pub path: String,
    pub head_commit: Option<String>,
    pub branch: Option<String>,
    pub is_bare: bool,
}

/// Rejects branch refs starting with `-` to prevent argument injection.
pub fn is_unsafe_branch_ref(ref_name: &str) -> bool {
    ref_name.starts_with('-')
}
