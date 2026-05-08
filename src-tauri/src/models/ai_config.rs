use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum ConfigSource {
    User,
    Project,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SkillConfig {
    pub name: String,
    pub description: Option<String>,
    pub file_path: String,
    pub source: ConfigSource,
    pub argument_hint: Option<String>,
    pub allowed_tools: Option<Vec<String>>,
    pub disable_model_invocation: Option<bool>,
    pub author: Option<String>,
    pub version: Option<String>,
    pub category: Option<String>,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct AgentConfig {
    pub name: String,
    pub description: Option<String>,
    pub file_path: String,
    pub source: ConfigSource,
    pub model: Option<String>,
    pub tools: Option<Vec<String>>,
    pub color: Option<String>,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct HookConfig {
    pub filename: String,
    pub file_path: String,
    pub source: ConfigSource,
    pub event_type: String,
    pub matcher: Option<String>,
    #[ts(type = "number | null")]
    pub timeout: Option<i64>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct McpServerConfig {
    pub name: String,
    pub source: ConfigSource,
    pub provider: String,
    pub transport_type: String,
    pub enabled: bool,
    pub command: Option<String>,
    pub url: Option<String>,
    pub args: Option<Vec<String>>,
    pub env_var_names: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct MemoryConfig {
    pub name: String,
    pub description: Option<String>,
    pub file_path: String,
    pub memory_type: Option<String>,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct InstructionConfig {
    pub filename: String,
    pub file_path: String,
    pub source: ConfigSource,
    pub content: String,
    #[ts(type = "number")]
    pub file_size: u64,
    pub last_modified: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct AiConfigDiscoveryResult {
    pub skills: Vec<SkillConfig>,
    pub agents: Vec<AgentConfig>,
    pub hooks: Vec<HookConfig>,
    pub mcp_servers: Vec<McpServerConfig>,
    pub memories: Vec<MemoryConfig>,
    pub instructions: Vec<InstructionConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct CustomDiscoveryPath {
    pub label: String,
    pub path: String,
}
