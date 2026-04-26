use rusqlite::types::{FromSql, FromSqlError, FromSqlResult, ToSql, ToSqlOutput, ValueRef};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum SessionState {
    Running,
    NeedsInput,
    NeedsReview,
    Paused,
    Finished,
    Errored,
}

impl SessionState {
    pub fn as_str(&self) -> &'static str {
        match self {
            SessionState::Running => "running",
            SessionState::NeedsInput => "needs-input",
            SessionState::NeedsReview => "needs-review",
            SessionState::Paused => "paused",
            SessionState::Finished => "finished",
            SessionState::Errored => "errored",
        }
    }
}

impl FromSql for SessionState {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        let text = value.as_str()?;
        match text {
            "running" => Ok(SessionState::Running),
            "needs-input" => Ok(SessionState::NeedsInput),
            "needs-review" => Ok(SessionState::NeedsReview),
            "paused" => Ok(SessionState::Paused),
            "finished" => Ok(SessionState::Finished),
            "errored" => Ok(SessionState::Errored),
            other => Err(FromSqlError::Other(
                format!("Unknown SessionState: {other}").into(),
            )),
        }
    }
}

impl ToSql for SessionState {
    fn to_sql(&self) -> rusqlite::Result<ToSqlOutput<'_>> {
        Ok(ToSqlOutput::from(self.as_str()))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum ExecutionPhase {
    None,
    Analyzing,
    Tdd,
    Reviewing,
    Verifying,
    Committing,
}

impl ExecutionPhase {
    pub fn as_str(&self) -> &'static str {
        match self {
            ExecutionPhase::None => "none",
            ExecutionPhase::Analyzing => "analyzing",
            ExecutionPhase::Tdd => "tdd",
            ExecutionPhase::Reviewing => "reviewing",
            ExecutionPhase::Verifying => "verifying",
            ExecutionPhase::Committing => "committing",
        }
    }
}

impl FromSql for ExecutionPhase {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        let text = value.as_str()?;
        match text {
            "none" => Ok(ExecutionPhase::None),
            "analyzing" => Ok(ExecutionPhase::Analyzing),
            "tdd" => Ok(ExecutionPhase::Tdd),
            "reviewing" => Ok(ExecutionPhase::Reviewing),
            "verifying" => Ok(ExecutionPhase::Verifying),
            "committing" => Ok(ExecutionPhase::Committing),
            other => Err(FromSqlError::Other(
                format!("Unknown ExecutionPhase: {other}").into(),
            )),
        }
    }
}

impl ToSql for ExecutionPhase {
    fn to_sql(&self) -> rusqlite::Result<ToSqlOutput<'_>> {
        Ok(ToSqlOutput::from(self.as_str()))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum SessionSource {
    Spawned,
    Adopted,
}

impl SessionSource {
    pub fn as_str(&self) -> &'static str {
        match self {
            SessionSource::Spawned => "spawned",
            SessionSource::Adopted => "adopted",
        }
    }
}

impl FromSql for SessionSource {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        let text = value.as_str()?;
        match text {
            "spawned" => Ok(SessionSource::Spawned),
            "adopted" => Ok(SessionSource::Adopted),
            other => Err(FromSqlError::Other(
                format!("Unknown SessionSource: {other}").into(),
            )),
        }
    }
}

impl ToSql for SessionSource {
    fn to_sql(&self) -> rusqlite::Result<ToSqlOutput<'_>> {
        Ok(ToSqlOutput::from(self.as_str()))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Session {
    pub id: String,
    pub issue_id: Option<String>,
    pub provider: String,
    pub state: SessionState,
    #[ts(type = "number | null")]
    pub pid: Option<i64>,
    pub session_file_path: Option<String>,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub cost_usd: Option<f64>,
    #[ts(type = "number | null")]
    pub token_count: Option<i64>,
    pub original_intent: Option<String>,
    pub last_prompt: Option<String>,
    pub last_response_summary: Option<String>,
    pub execution_phase: ExecutionPhase,
    pub source: SessionSource,
    pub working_directory: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SpawnSessionRequest {
    pub prompt: String,
    pub working_directory: String,
    pub issue_id: Option<String>,
    pub permission_mode: Option<String>,
    pub model: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn session_state_serde_round_trip() {
        let json = "\"needs-input\"";
        let deserialized: SessionState = serde_json::from_str(json).unwrap();
        assert_eq!(deserialized, SessionState::NeedsInput);
        let serialized = serde_json::to_string(&deserialized).unwrap();
        assert_eq!(serialized, "\"needs-input\"");
    }

    #[test]
    fn execution_phase_serde_round_trip() {
        let json = "\"tdd\"";
        let deserialized: ExecutionPhase = serde_json::from_str(json).unwrap();
        assert_eq!(deserialized, ExecutionPhase::Tdd);
        let serialized = serde_json::to_string(&deserialized).unwrap();
        assert_eq!(serialized, "\"tdd\"");
    }

    #[test]
    fn session_source_serde_round_trip() {
        let json = "\"spawned\"";
        let deserialized: SessionSource = serde_json::from_str(json).unwrap();
        assert_eq!(deserialized, SessionSource::Spawned);
        let serialized = serde_json::to_string(&deserialized).unwrap();
        assert_eq!(serialized, "\"spawned\"");
    }

    #[test]
    fn invalid_session_state_deserialization_returns_error() {
        let json = "\"invalid-state\"";
        let result = serde_json::from_str::<SessionState>(json);
        assert!(result.is_err());
    }
}
