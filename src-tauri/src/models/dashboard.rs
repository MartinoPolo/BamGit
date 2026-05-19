use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "lowercase")]
pub enum DashboardType {
    Repo,
    Portfolio,
}

impl std::fmt::Display for DashboardType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DashboardType::Repo => write!(f, "repo"),
            DashboardType::Portfolio => write!(f, "portfolio"),
        }
    }
}

impl DashboardType {
    pub fn from_db(value: String) -> Result<Self, String> {
        match value.as_str() {
            "repo" => Ok(DashboardType::Repo),
            "portfolio" => Ok(DashboardType::Portfolio),
            other => Err(format!("Invalid dashboard type: {other}")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS, PartialEq)]
#[ts(export)]
#[serde(rename_all = "lowercase")]
pub enum DashboardStatus {
    Active,
    Archived,
    Deleted,
}

impl std::fmt::Display for DashboardStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DashboardStatus::Active => write!(f, "active"),
            DashboardStatus::Archived => write!(f, "archived"),
            DashboardStatus::Deleted => write!(f, "deleted"),
        }
    }
}

impl DashboardStatus {
    pub fn from_db(value: String) -> Result<Self, String> {
        match value.as_str() {
            "active" => Ok(DashboardStatus::Active),
            "archived" => Ok(DashboardStatus::Archived),
            "deleted" => Ok(DashboardStatus::Deleted),
            other => Err(format!("Invalid dashboard status: {other}")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Dashboard {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub dashboard_type: DashboardType,
    pub github_repo: Option<String>,
    pub local_folder: Option<String>,
    pub default_base_branch: Option<String>,
    pub worktree_parent_folder: Option<String>,
    pub color_palette_id: Option<String>,
    pub accent_color: Option<String>,
    pub chart_color_theme: Option<String>,
    pub default_shape: String,
    pub priorities_enabled: bool,
    pub status: DashboardStatus,
}

#[derive(Debug, Deserialize)]
pub struct CreateDashboardRequest {
    pub name: String,
    #[serde(rename = "type")]
    pub dashboard_type: DashboardType,
    pub github_repo: Option<String>,
    pub local_folder: Option<String>,
    pub default_base_branch: Option<String>,
    pub worktree_parent_folder: Option<String>,
    pub color_palette_id: Option<String>,
    pub accent_color: Option<String>,
    pub chart_color_theme: Option<String>,
}

/// Option<Option<T>>: absent key = no change, explicit null = clear the field
#[derive(Debug, Deserialize)]
pub struct UpdateDashboardRequest {
    pub id: String,
    pub name: Option<String>,
    #[serde(rename = "type")]
    pub dashboard_type: Option<DashboardType>,
    #[serde(default, deserialize_with = "deserialize_optional_nullable")]
    pub github_repo: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_optional_nullable")]
    pub local_folder: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_optional_nullable")]
    pub default_base_branch: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_optional_nullable")]
    pub worktree_parent_folder: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_optional_nullable")]
    pub color_palette_id: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_optional_nullable")]
    pub accent_color: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_optional_nullable")]
    pub chart_color_theme: Option<Option<String>>,
    pub default_shape: Option<String>,
    pub priorities_enabled: Option<bool>,
}

pub fn deserialize_optional_nullable<'de, D>(deserializer: D) -> Result<Option<Option<String>>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    // If the key is present, deserialize its value (which may be null → Some(None), or a string → Some(Some(s)))
    let value: Option<String> = Option::deserialize(deserializer)?;
    Ok(Some(value))
}

pub fn deserialize_optional_nullable_i64<'de, D>(deserializer: D) -> Result<Option<Option<i64>>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let value: Option<i64> = Option::deserialize(deserializer)?;
    Ok(Some(value))
}
