use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Status of an externally-discovered Claude Code session.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum DiscoveredSessionStatus {
    Working,
    NeedsAttention,
    Idle,
    Finished,
    Unknown,
}

/// An externally-launched Claude Code session detected via process scanning + JSONL.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct DiscoveredSession {
    /// Composite key: "{project_dir_name}/{session_uuid}"
    pub id: String,
    pub pid: u32,
    pub working_directory: String,
    pub project_directory_name: String,
    pub session_id: String,
    pub project_name: String,
    pub status: DiscoveredSessionStatus,
    pub first_prompt: Option<String>,
    pub git_branch: Option<String>,
    pub message_count: u32,
    pub cost_usd: f64,
    #[ts(type = "number")]
    pub token_count: u64,
    pub latest_message: Option<String>,
    pub modified_at: Option<String>,
}

/// Minimal JSONL entry for status/cost determination.
#[derive(Debug, Clone)]
pub struct JsonlEntry {
    pub entry_type: String,
    pub timestamp: Option<String>,
    pub content: serde_json::Value,
}

/// Token usage from an assistant message.
#[derive(Debug, Clone, Default)]
pub struct UsageData {
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cache_creation_input_tokens: u64,
    pub cache_read_input_tokens: u64,
    pub model: String,
}

/// Session metadata from sessions-index.json.
#[derive(Debug, Clone, Deserialize)]
pub struct SessionIndexEntry {
    #[serde(rename = "sessionId")]
    pub session_id: Option<String>,
    #[serde(rename = "projectPath")]
    pub project_path: Option<String>,
    #[serde(rename = "lastMessageSummary")]
    pub last_message_summary: Option<String>,
    #[serde(rename = "numMessages")]
    pub num_messages: Option<u32>,
    #[serde(rename = "gitBranch")]
    pub git_branch: Option<String>,
}

/// Info about a running Claude process.
#[derive(Debug)]
pub struct ProcessInfo {
    pub pid: u32,
    pub cwd: Option<std::path::PathBuf>,
    pub start_time: u64,
}
