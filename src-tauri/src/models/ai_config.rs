use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, TS, PartialEq, Eq, Hash)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum ProviderKind {
    ClaudeCode,
    OpenCode,
    Codex,
    Cursor,
}

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
pub struct InstalledProvider {
    pub kind: ProviderKind,
    pub installed: bool,
    pub user_dir: Option<String>,
    pub project_dir: Option<String>,
    pub binary_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct RuleConfig {
    pub filename: String,
    pub file_path: String,
    pub source: ConfigSource,
    pub provider: ProviderKind,
    pub language: Option<String>,
    pub description: Option<String>,
    pub always_apply: Option<bool>,
    pub globs: Option<Vec<String>>,
    pub content: String,
    pub deprecated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct DiscoverySource {
    pub provider: ProviderKind,
    pub label: String,
    pub path: String,
    pub source_type: ConfigSource,
}


#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SkillConfig {
    pub name: String,
    pub description: Option<String>,
    pub file_path: String,
    pub source: ConfigSource,
    pub provider: ProviderKind,
    pub argument_hint: Option<String>,
    pub allowed_tools: Option<Vec<String>>,
    pub disable_model_invocation: Option<bool>,
    pub author: Option<String>,
    pub version: Option<String>,
    pub category: Option<String>,
    pub content: String,
    pub deprecated: bool,
    /// Override from `skillOverrides` in settings.local.json.
    /// Values: "on" | "name-only" | "user-invocable-only" | "off"
    pub skill_override: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct AgentConfig {
    pub name: String,
    pub description: Option<String>,
    pub file_path: String,
    pub source: ConfigSource,
    pub provider: ProviderKind,
    pub model: Option<String>,
    pub tools: Option<Vec<String>>,
    pub color: Option<String>,
    pub content: String,
    pub deprecated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct HookConfig {
    pub filename: String,
    pub file_path: String,
    pub source: ConfigSource,
    pub provider: ProviderKind,
    pub event_type: String,
    pub matcher: Option<String>,
    #[ts(type = "number | null")]
    pub timeout: Option<i64>,
    pub description: Option<String>,
    pub deprecated: bool,
    /// The full command string from the hook entry (e.g. "node /path/to/script.js").
    pub command: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct McpServerConfig {
    pub name: String,
    pub source: ConfigSource,
    pub provider: ProviderKind,
    /// The MCP provider name (e.g. "claude-code", "cloud").
    pub provider_name: String,
    pub transport_type: String,
    pub enabled: bool,
    pub command: Option<String>,
    pub url: Option<String>,
    pub args: Option<Vec<String>>,
    pub env_var_names: Option<Vec<String>>,
    pub deprecated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct MemoryConfig {
    pub name: String,
    pub description: Option<String>,
    pub file_path: String,
    pub source: ConfigSource,
    pub provider: ProviderKind,
    pub memory_type: Option<String>,
    pub content: String,
    pub deprecated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct InstructionConfig {
    pub filename: String,
    pub file_path: String,
    pub source: ConfigSource,
    pub provider: ProviderKind,
    pub content: String,
    #[ts(type = "number")]
    pub file_size: u64,
    pub last_modified: Option<String>,
    pub deprecated: bool,
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
    pub rules: Vec<RuleConfig>,
    pub sources: Vec<DiscoverySource>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct CustomDiscoveryPath {
    pub provider: ProviderKind,
    pub label: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SymlinkInfo {
    pub is_symlink: bool,
    pub resolved_path: Option<String>,
    pub target_exists: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, TS, PartialEq, Eq)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum SettingsScope {
    User,
    Project,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum McpDeleteKind {
    /// Remove from `mcpServers` object in settings.json.
    McpServers,
    /// Set value to false in `enabledPlugins` object.
    EnabledPlugins,
    /// Remove from `mcpServers` in .mcp.json.
    McpJsonFile,
}
