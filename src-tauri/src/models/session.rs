use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub issue_id: Option<String>,
    pub provider: String,
    pub state: String,
    pub pid: Option<i64>,
    pub session_file_path: Option<String>,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub cost_usd: Option<f64>,
    pub token_count: Option<i64>,
    pub original_intent: Option<String>,
    pub last_prompt: Option<String>,
    pub last_response_summary: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SpawnSessionRequest {
    pub prompt: String,
    pub working_directory: String,
    pub issue_id: Option<String>,
    pub permission_mode: Option<String>,
    pub model: Option<String>,
}
