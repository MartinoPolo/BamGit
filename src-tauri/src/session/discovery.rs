use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use serde::{Deserialize, Serialize};
use sysinfo::{ProcessRefreshKind, System, UpdateKind};

/// Status of an externally-discovered Claude Code session.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DiscoveredSessionStatus {
    Working,
    NeedsAttention,
    Idle,
    Finished,
    Unknown,
}

/// An externally-launched Claude Code session detected via process scanning + JSONL.
#[derive(Debug, Clone, Serialize, Deserialize)]
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

/// Per-model pricing (USD per million tokens).
struct ModelPricing {
    input: f64,
    output: f64,
    cache_write: f64,
    cache_read: f64,
}

/// Session metadata from sessions-index.json.
#[derive(Debug, Clone, Deserialize)]
struct SessionIndexEntry {
    #[serde(rename = "sessionId")]
    session_id: Option<String>,
    #[serde(rename = "projectPath")]
    project_path: Option<String>,
    #[serde(rename = "lastMessageSummary")]
    last_message_summary: Option<String>,
    #[serde(rename = "numMessages")]
    num_messages: Option<u32>,
    #[serde(rename = "gitBranch")]
    git_branch: Option<String>,
}

/// Detects externally-launched Claude Code sessions.
pub struct SessionDiscoverer {
    system: System,
    claude_projects_directory: PathBuf,
    claude_sessions_directory: PathBuf,
}

impl SessionDiscoverer {
    pub fn new() -> Self {
        let home_directory = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
        let claude_directory = home_directory.join(".claude");

        Self {
            system: System::new(),
            claude_projects_directory: claude_directory.join("projects"),
            claude_sessions_directory: claude_directory.join("sessions"),
        }
    }

    /// Discover all running Claude Code sessions not managed by BamGit.
    /// `excluded_pids` are PIDs of sessions already managed by BamGit.
    pub fn discover_sessions(&mut self, excluded_pids: &[u32]) -> Vec<DiscoveredSession> {
        // Refresh processes
        self.system.refresh_processes_specifics(
            sysinfo::ProcessesToUpdate::All,
            true,
            ProcessRefreshKind::new()
                .with_cmd(UpdateKind::Always)
                .with_cwd(UpdateKind::Always),
        );

        let claude_processes = self.find_claude_processes(excluded_pids);
        if claude_processes.is_empty() {
            return Vec::new();
        }

        let mut discovered = Vec::new();

        for process_info in &claude_processes {
            if let Some(session) = self.match_process_to_session(process_info) {
                discovered.push(session);
            }
        }

        discovered
    }

    /// Find running Claude processes, filtering out excluded PIDs.
    fn find_claude_processes(&self, excluded_pids: &[u32]) -> Vec<ProcessInfo> {
        let mut processes = Vec::new();

        for (pid, process) in self.system.processes() {
            let name = process.name().to_string_lossy().to_lowercase();
            if !name.contains("claude") {
                continue;
            }

            let pid_u32 = pid.as_u32();
            if excluded_pids.contains(&pid_u32) {
                continue;
            }

            // Check command args for "claude" CLI (not electron/helper processes)
            let cmd: Vec<String> = process.cmd().iter().map(|s| s.to_string_lossy().to_string()).collect();
            let is_cli_process = cmd.iter().any(|arg| {
                arg.ends_with("claude.exe") || arg.ends_with("claude") || arg.contains("@anthropic-ai/claude-code")
            });
            if !is_cli_process && cmd.len() > 1 {
                continue;
            }

            let cwd = process.cwd().map(|p| p.to_path_buf());
            let start_time = process.start_time();

            processes.push(ProcessInfo {
                pid: pid_u32,
                cwd,
                start_time,
            });
        }

        processes
    }

    /// Try to match a running process to a JSONL session file.
    fn match_process_to_session(&self, process_info: &ProcessInfo) -> Option<DiscoveredSession> {
        // Strategy 1: Check ~/.claude/sessions/{pid}.json for authoritative session ID
        let session_metadata_path = self
            .claude_sessions_directory
            .join(format!("{}.json", process_info.pid));

        if let Some(session) =
            self.try_match_via_pid_metadata(&session_metadata_path, process_info)
        {
            return Some(session);
        }

        // Strategy 2: Heuristic matching via CWD → project directory → recent JSONL
        if let Some(ref cwd) = process_info.cwd {
            if let Some(session) = self.try_match_via_cwd(cwd, process_info) {
                return Some(session);
            }
        }

        None
    }

    /// Match via ~/.claude/sessions/{pid}.json metadata file.
    fn try_match_via_pid_metadata(
        &self,
        metadata_path: &Path,
        process_info: &ProcessInfo,
    ) -> Option<DiscoveredSession> {
        let content = fs::read_to_string(metadata_path).ok()?;
        let metadata: serde_json::Value = serde_json::from_str(&content).ok()?;
        let session_id = metadata.get("sessionId")?.as_str()?;

        // Find the JSONL file for this session across project directories
        self.find_session_jsonl(session_id, process_info)
    }

    /// Find a JSONL file matching a session ID across all project directories.
    fn find_session_jsonl(
        &self,
        session_id: &str,
        process_info: &ProcessInfo,
    ) -> Option<DiscoveredSession> {
        let project_directories = fs::read_dir(&self.claude_projects_directory).ok()?;

        for entry in project_directories.flatten() {
            if !entry.file_type().ok()?.is_dir() {
                continue;
            }

            let jsonl_path = entry.path().join(format!("{session_id}.jsonl"));
            if jsonl_path.exists() {
                let project_directory_name = entry.file_name().to_string_lossy().to_string();
                return self.build_discovered_session(
                    &jsonl_path,
                    &project_directory_name,
                    session_id,
                    process_info,
                );
            }
        }

        None
    }

    /// Heuristic: match process CWD to an encoded project directory name.
    fn try_match_via_cwd(
        &self,
        cwd: &Path,
        process_info: &ProcessInfo,
    ) -> Option<DiscoveredSession> {
        let encoded = encode_path_for_matching(&cwd.to_string_lossy());
        let project_directory = self.claude_projects_directory.join(&encoded);

        if !project_directory.exists() {
            return None;
        }

        // Find the most recently modified .jsonl file in this project directory
        let most_recent = find_most_recent_jsonl(&project_directory, process_info.start_time)?;
        let session_id = most_recent
            .file_stem()?
            .to_string_lossy()
            .to_string();

        self.build_discovered_session(
            &most_recent,
            &encoded,
            &session_id,
            process_info,
        )
    }

    /// Build a DiscoveredSession from a JSONL file path + process info.
    fn build_discovered_session(
        &self,
        jsonl_path: &Path,
        project_directory_name: &str,
        session_id: &str,
        process_info: &ProcessInfo,
    ) -> Option<DiscoveredSession> {
        let entries = parse_last_n_entries(jsonl_path, STATUS_CONTEXT_ENTRY_COUNT);
        let status = determine_session_status(&entries);

        // Extract cost/tokens from full file
        let (cost_usd, token_count) = extract_cost_from_jsonl(jsonl_path);

        // Read sessions-index.json for metadata
        let project_directory = jsonl_path.parent()?;
        let index_metadata = read_session_index(project_directory, session_id);

        let first_prompt = index_metadata
            .as_ref()
            .and_then(|m| m.last_message_summary.clone())
            .or_else(|| extract_first_user_prompt(&entries));

        let git_branch = index_metadata
            .as_ref()
            .and_then(|m| m.git_branch.clone());

        let message_count = index_metadata
            .as_ref()
            .and_then(|m| m.num_messages)
            .unwrap_or_else(|| count_messages(&entries));

        let latest_message = extract_latest_message(&entries);

        let modified_at = fs::metadata(jsonl_path)
            .ok()
            .and_then(|m| m.modified().ok())
            .and_then(|t| {
                let duration = t.duration_since(SystemTime::UNIX_EPOCH).ok()?;
                let datetime = chrono::DateTime::from_timestamp(
                    duration.as_secs() as i64,
                    duration.subsec_nanos(),
                );
                datetime.map(|dt| dt.to_rfc3339())
            });

        let working_directory = process_info
            .cwd
            .as_ref()
            .map(|p| p.to_string_lossy().to_string())
            .or_else(|| {
                index_metadata
                    .as_ref()
                    .and_then(|m| m.project_path.clone())
            })
            .unwrap_or_default();

        let project_name = derive_project_name(&working_directory, project_directory_name);

        Some(DiscoveredSession {
            id: format!("{project_directory_name}/{session_id}"),
            pid: process_info.pid,
            working_directory,
            project_directory_name: project_directory_name.to_string(),
            session_id: session_id.to_string(),
            project_name,
            status,
            first_prompt,
            git_branch,
            message_count,
            cost_usd,
            token_count,
            latest_message,
            modified_at,
        })
    }
}

/// Info about a running Claude process.
#[derive(Debug)]
struct ProcessInfo {
    pid: u32,
    cwd: Option<PathBuf>,
    start_time: u64,
}

// ─── Pure Functions (testable without system access) ─────────────────────────

/// How many recent JSONL entries to parse for status determination.
const STATUS_CONTEXT_ENTRY_COUNT: usize = 20;

/// SQL query for PIDs of BamGit-managed sessions (shared between poller and commands).
pub const MANAGED_PIDS_QUERY: &str =
    "SELECT pid FROM sessions WHERE pid IS NOT NULL \
     AND state IN ('running', 'needs-input', 'needs-review', 'paused')";

/// Encode a filesystem path the same way Claude Code does for project directory names.
/// Non-alphanumeric characters (except separators) are replaced with dashes.
pub fn encode_path_for_matching(path: &str) -> String {
    path.chars()
        .map(|c| {
            if c.is_alphanumeric() {
                c
            } else {
                '-'
            }
        })
        .collect()
}

/// Find the most recently modified .jsonl file in a directory,
/// filtering to files modified after the process start time (with 5s buffer).
fn find_most_recent_jsonl(directory: &Path, process_start_time: u64) -> Option<PathBuf> {
    let mut best: Option<(PathBuf, SystemTime)> = None;

    let entries = fs::read_dir(directory).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("jsonl") {
            continue;
        }

        // Skip agent-*.jsonl files
        let filename = path.file_stem()?.to_string_lossy();
        if filename.starts_with("agent-") {
            continue;
        }

        let metadata = fs::metadata(&path).ok()?;
        let modified = metadata.modified().ok()?;
        let modified_secs = modified
            .duration_since(SystemTime::UNIX_EPOCH)
            .ok()?
            .as_secs();

        // Session JSONL must be modified after process started (with 5s buffer)
        if process_start_time > 0 && modified_secs + 5 < process_start_time {
            continue;
        }

        if best.as_ref().map_or(true, |(_, best_time)| modified > *best_time) {
            best = Some((path, modified));
        }
    }

    best.map(|(path, _)| path)
}

/// Parse the last N entries from a JSONL file.
/// Reads the full file and returns the tail — acceptable for session files which are typically small.
pub fn parse_last_n_entries(path: &Path, count: usize) -> Vec<JsonlEntry> {
    let file = match fs::File::open(path) {
        Ok(f) => f,
        Err(_) => return Vec::new(),
    };

    let reader = BufReader::new(file);
    let mut all_entries: Vec<JsonlEntry> = Vec::new();

    for line in reader.lines() {
        let line = match line {
            Ok(l) if !l.trim().is_empty() => l,
            _ => continue,
        };

        if let Ok(value) = serde_json::from_str::<serde_json::Value>(&line) {
            let entry_type = value
                .get("type")
                .and_then(|t| t.as_str())
                .unwrap_or("unknown")
                .to_string();

            let timestamp = value
                .get("timestamp")
                .and_then(|t| t.as_str())
                .map(|s| s.to_string());

            all_entries.push(JsonlEntry {
                entry_type,
                timestamp,
                content: value,
            });
        }
    }

    // Return last N entries
    if all_entries.len() > count {
        all_entries.split_off(all_entries.len() - count)
    } else {
        all_entries
    }
}

/// Determine session status from the last JSONL entries.
pub fn determine_session_status(entries: &[JsonlEntry]) -> DiscoveredSessionStatus {
    if entries.is_empty() {
        return DiscoveredSessionStatus::Unknown;
    }

    // Find the last meaningful entry (User or Assistant, skip others)
    let last_meaningful = entries
        .iter()
        .rev()
        .find(|e| e.entry_type == "user" || e.entry_type == "assistant");

    let Some(last_entry) = last_meaningful else {
        return DiscoveredSessionStatus::Unknown;
    };

    let now = chrono::Utc::now();
    let entry_age_seconds = last_entry
        .timestamp
        .as_ref()
        .and_then(|ts| chrono::DateTime::parse_from_rfc3339(ts).ok())
        .map(|dt| (now - dt.to_utc()).num_seconds())
        .unwrap_or(i64::MAX);

    match last_entry.entry_type.as_str() {
        "user" => {
            // User sent something — Claude should be working
            let is_tool_result = last_entry
                .content
                .get("message")
                .and_then(|m| m.get("content"))
                .map(|c| {
                    if let Some(arr) = c.as_array() {
                        arr.iter().any(|block| {
                            block.get("type").and_then(|t| t.as_str()) == Some("tool_result")
                        })
                    } else {
                        false
                    }
                })
                .unwrap_or(false);

            if is_tool_result || entry_age_seconds < 30 {
                DiscoveredSessionStatus::Working
            } else {
                DiscoveredSessionStatus::Idle
            }
        }
        "assistant" => {
            let message = &last_entry.content.get("message");

            // Check for pending AskUserQuestion tool → NeedsAttention
            let has_pending_question = message
                .and_then(|m| m.get("content"))
                .and_then(|c| c.as_array())
                .map(|blocks| {
                    blocks.iter().any(|block| {
                        block.get("type").and_then(|t| t.as_str()) == Some("tool_use")
                            && block.get("name").and_then(|n| n.as_str())
                                == Some("AskUserQuestion")
                    })
                })
                .unwrap_or(false);

            if has_pending_question {
                return DiscoveredSessionStatus::NeedsAttention;
            }

            // Check for tool_use blocks
            let has_tool_use = message
                .and_then(|m| m.get("content"))
                .and_then(|c| c.as_array())
                .map(|blocks| {
                    blocks
                        .iter()
                        .any(|block| {
                            block.get("type").and_then(|t| t.as_str()) == Some("tool_use")
                        })
                })
                .unwrap_or(false);

            let stop_reason = message
                .and_then(|m| m.get("stop_reason"))
                .and_then(|s| s.as_str())
                .unwrap_or("");

            if has_tool_use {
                if stop_reason == "tool_use" {
                    // External sessions typically run in interactive mode with tool approval.
                    // BamGit-managed sessions are excluded by PID, so this only fires for
                    // external ones that likely need user permission.
                    return DiscoveredSessionStatus::NeedsAttention;
                }
                if stop_reason == "end_turn" {
                    return DiscoveredSessionStatus::Idle;
                }
            }

            // Check if message ends with question
            let ends_with_question = message
                .and_then(|m| m.get("content"))
                .and_then(|c| c.as_array())
                .and_then(|blocks| {
                    blocks.iter().rev().find_map(|block| {
                        if block.get("type").and_then(|t| t.as_str()) == Some("text") {
                            block.get("text").and_then(|t| t.as_str()).map(|s| s.trim().ends_with('?'))
                        } else {
                            None
                        }
                    })
                })
                .unwrap_or(false);

            if ends_with_question && stop_reason == "end_turn" {
                return DiscoveredSessionStatus::NeedsAttention;
            }

            // Recent → Working, stale → Idle
            if entry_age_seconds < 20 {
                DiscoveredSessionStatus::Working
            } else {
                DiscoveredSessionStatus::Idle
            }
        }
        _ => DiscoveredSessionStatus::Unknown,
    }
}

/// Extract total cost and token count from a JSONL file by scanning all assistant messages.
pub fn extract_cost_from_jsonl(path: &Path) -> (f64, u64) {
    let file = match fs::File::open(path) {
        Ok(f) => f,
        Err(_) => return (0.0, 0),
    };

    let reader = BufReader::new(file);
    let mut total_cost = 0.0_f64;
    let mut total_tokens = 0_u64;

    for line in reader.lines() {
        let line = match line {
            Ok(l) if !l.trim().is_empty() => l,
            _ => continue,
        };

        if let Some(usage) = parse_usage_from_line(&line) {
            let pricing = get_model_pricing(&usage.model);
            let cost = calculate_cost(&usage, &pricing);
            total_cost += cost;
            total_tokens += usage.input_tokens + usage.output_tokens;
        }
    }

    (total_cost, total_tokens)
}

/// Parse usage data from a single JSONL line (only assistant messages).
fn parse_usage_from_line(line: &str) -> Option<UsageData> {
    let value: serde_json::Value = serde_json::from_str(line).ok()?;

    if value.get("type")?.as_str()? != "assistant" {
        return None;
    }

    let message = value.get("message")?;
    let usage = message.get("usage")?;
    let model = message
        .get("model")
        .and_then(|m| m.as_str())
        .unwrap_or("unknown")
        .to_string();

    Some(UsageData {
        input_tokens: usage
            .get("input_tokens")
            .and_then(|v| v.as_u64())
            .unwrap_or(0),
        output_tokens: usage
            .get("output_tokens")
            .and_then(|v| v.as_u64())
            .unwrap_or(0),
        cache_creation_input_tokens: usage
            .get("cache_creation_input_tokens")
            .and_then(|v| v.as_u64())
            .unwrap_or(0),
        cache_read_input_tokens: usage
            .get("cache_read_input_tokens")
            .and_then(|v| v.as_u64())
            .unwrap_or(0),
        model,
    })
}

/// Get pricing for a model by prefix matching.
fn get_model_pricing(model: &str) -> ModelPricing {
    if model.starts_with("claude-sonnet") {
        ModelPricing {
            input: 3.0,
            output: 15.0,
            cache_write: 3.75,
            cache_read: 0.30,
        }
    } else if model.starts_with("claude-opus-4-5") || model.starts_with("claude-opus-4-6") {
        ModelPricing {
            input: 5.0,
            output: 25.0,
            cache_write: 6.25,
            cache_read: 0.50,
        }
    } else if model.starts_with("claude-opus") {
        ModelPricing {
            input: 15.0,
            output: 75.0,
            cache_write: 18.75,
            cache_read: 1.50,
        }
    } else if model.starts_with("claude-haiku-4-5") {
        ModelPricing {
            input: 1.0,
            output: 5.0,
            cache_write: 1.25,
            cache_read: 0.10,
        }
    } else if model.starts_with("claude-haiku") {
        ModelPricing {
            input: 0.80,
            output: 4.0,
            cache_write: 1.0,
            cache_read: 0.08,
        }
    } else {
        // Default: Sonnet pricing
        ModelPricing {
            input: 3.0,
            output: 15.0,
            cache_write: 3.75,
            cache_read: 0.30,
        }
    }
}

/// Calculate USD cost from usage data and pricing.
fn calculate_cost(usage: &UsageData, pricing: &ModelPricing) -> f64 {
    let per_million = 1_000_000.0;
    (usage.input_tokens as f64 * pricing.input
        + usage.output_tokens as f64 * pricing.output
        + usage.cache_creation_input_tokens as f64 * pricing.cache_write
        + usage.cache_read_input_tokens as f64 * pricing.cache_read)
        / per_million
}

/// Read sessions-index.json and find metadata for a session.
fn read_session_index(
    project_directory: &Path,
    session_id: &str,
) -> Option<SessionIndexEntry> {
    let index_path = project_directory.join("sessions-index.json");
    let content = fs::read_to_string(&index_path).ok()?;
    let entries: Vec<SessionIndexEntry> = serde_json::from_str(&content).ok()?;

    entries
        .into_iter()
        .find(|e| e.session_id.as_deref() == Some(session_id))
}

/// Extract text content from a JSONL message's content field.
/// Handles both string content and array-of-blocks content formats.
/// When `reverse` is true, searches blocks from the end (for latest message).
fn extract_text_from_message(entry: &JsonlEntry, reverse: bool) -> Option<String> {
    let message = entry.content.get("message")?;
    let content = message.get("content")?;

    if let Some(text) = content.as_str() {
        return Some(truncate_string(text, 200));
    }

    let arr = content.as_array()?;
    let find_text_block = |block: &serde_json::Value| -> Option<String> {
        if block.get("type")?.as_str()? == "text" {
            Some(truncate_string(block.get("text")?.as_str()?, 200))
        } else {
            None
        }
    };

    if reverse {
        arr.iter().rev().find_map(find_text_block)
    } else {
        arr.iter().find_map(find_text_block)
    }
}

/// Extract the first user prompt from JSONL entries.
fn extract_first_user_prompt(entries: &[JsonlEntry]) -> Option<String> {
    entries
        .iter()
        .find(|e| e.entry_type == "user")
        .and_then(|e| extract_text_from_message(e, false))
}

/// Extract the latest user or assistant text message.
fn extract_latest_message(entries: &[JsonlEntry]) -> Option<String> {
    entries
        .iter()
        .rev()
        .find(|e| e.entry_type == "user" || e.entry_type == "assistant")
        .and_then(|e| extract_text_from_message(e, true))
}

/// Count user and assistant messages in entries.
fn count_messages(entries: &[JsonlEntry]) -> u32 {
    entries
        .iter()
        .filter(|e| e.entry_type == "user" || e.entry_type == "assistant")
        .count() as u32
}

/// Derive a human-readable project name from working directory or directory name.
fn derive_project_name(working_directory: &str, directory_name: &str) -> String {
    if !working_directory.is_empty() {
        Path::new(working_directory)
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| directory_name.to_string())
    } else {
        directory_name.to_string()
    }
}

/// Truncate a string to max_len characters.
fn truncate_string(text: &str, max_len: usize) -> String {
    if text.chars().count() <= max_len {
        text.to_string()
    } else {
        let truncated: String = text.chars().take(max_len - 3).collect();
        format!("{truncated}...")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::TempDir;

    // ─── Path Encoding ───────────────────────────────────────────────

    #[test]
    fn encode_path_replaces_non_alphanumeric_with_dashes() {
        assert_eq!(
            encode_path_for_matching("C:\\Users\\snapy\\Projects\\BamGit"),
            "C--Users-snapy-Projects-BamGit"
        );
    }

    #[test]
    fn encode_path_preserves_alphanumeric_characters() {
        assert_eq!(encode_path_for_matching("myproject123"), "myproject123");
    }

    #[test]
    fn encode_path_handles_unix_paths() {
        assert_eq!(
            encode_path_for_matching("/home/user/projects/app"),
            "-home-user-projects-app"
        );
    }

    // ─── JSONL Parsing ───────────────────────────────────────────────

    fn write_jsonl_file(dir: &Path, filename: &str, lines: &[&str]) -> PathBuf {
        let path = dir.join(filename);
        let mut file = fs::File::create(&path).unwrap();
        for line in lines {
            writeln!(file, "{line}").unwrap();
        }
        path
    }

    #[test]
    fn parse_last_n_entries_returns_last_n_from_file() {
        let tmp = TempDir::new().unwrap();
        let path = write_jsonl_file(
            tmp.path(),
            "test.jsonl",
            &[
                r#"{"type":"user","timestamp":"2026-01-01T00:00:00Z","message":{"role":"user","content":"first"}}"#,
                r#"{"type":"assistant","timestamp":"2026-01-01T00:00:01Z","message":{"role":"assistant","content":[{"type":"text","text":"response"}]}}"#,
                r#"{"type":"user","timestamp":"2026-01-01T00:00:02Z","message":{"role":"user","content":"second"}}"#,
            ],
        );

        let entries = parse_last_n_entries(&path, 2);
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].entry_type, "assistant");
        assert_eq!(entries[1].entry_type, "user");
    }

    #[test]
    fn parse_last_n_entries_returns_all_if_fewer_than_n() {
        let tmp = TempDir::new().unwrap();
        let path = write_jsonl_file(
            tmp.path(),
            "test.jsonl",
            &[r#"{"type":"user","timestamp":"2026-01-01T00:00:00Z","message":{"role":"user","content":"hello"}}"#],
        );

        let entries = parse_last_n_entries(&path, 20);
        assert_eq!(entries.len(), 1);
    }

    #[test]
    fn parse_last_n_entries_handles_missing_file() {
        let entries = parse_last_n_entries(Path::new("/nonexistent/file.jsonl"), 20);
        assert!(entries.is_empty());
    }

    #[test]
    fn parse_last_n_entries_skips_invalid_json_lines() {
        let tmp = TempDir::new().unwrap();
        let path = write_jsonl_file(
            tmp.path(),
            "test.jsonl",
            &[
                r#"{"type":"user","timestamp":"2026-01-01T00:00:00Z","message":{"role":"user","content":"hello"}}"#,
                "this is not json",
                r#"{"type":"assistant","timestamp":"2026-01-01T00:00:01Z","message":{"role":"assistant","content":[]}}"#,
            ],
        );

        let entries = parse_last_n_entries(&path, 20);
        assert_eq!(entries.len(), 2);
    }

    // ─── Status Determination ────────────────────────────────────────

    fn make_entry(entry_type: &str, timestamp: &str, content: serde_json::Value) -> JsonlEntry {
        JsonlEntry {
            entry_type: entry_type.to_string(),
            timestamp: Some(timestamp.to_string()),
            content,
        }
    }

    #[test]
    fn status_unknown_for_empty_entries() {
        assert_eq!(
            determine_session_status(&[]),
            DiscoveredSessionStatus::Unknown
        );
    }

    #[test]
    fn status_working_for_recent_user_message() {
        let now = chrono::Utc::now().to_rfc3339();
        let entries = vec![make_entry(
            "user",
            &now,
            serde_json::json!({"type":"user","message":{"role":"user","content":"do something"}}),
        )];

        assert_eq!(
            determine_session_status(&entries),
            DiscoveredSessionStatus::Working
        );
    }

    #[test]
    fn status_idle_for_old_user_message() {
        let entries = vec![make_entry(
            "user",
            "2024-01-01T00:00:00Z",
            serde_json::json!({"type":"user","message":{"role":"user","content":"old message"}}),
        )];

        assert_eq!(
            determine_session_status(&entries),
            DiscoveredSessionStatus::Idle
        );
    }

    #[test]
    fn status_needs_attention_for_ask_user_question_tool() {
        let entries = vec![make_entry(
            "assistant",
            "2024-01-01T00:00:00Z",
            serde_json::json!({
                "type": "assistant",
                "message": {
                    "role": "assistant",
                    "content": [
                        {"type": "tool_use", "name": "AskUserQuestion", "id": "t1", "input": {"question": "What do you want?"}}
                    ],
                    "stop_reason": "tool_use"
                }
            }),
        )];

        assert_eq!(
            determine_session_status(&entries),
            DiscoveredSessionStatus::NeedsAttention
        );
    }

    #[test]
    fn status_needs_attention_for_pending_tool_use() {
        let entries = vec![make_entry(
            "assistant",
            "2024-01-01T00:00:00Z",
            serde_json::json!({
                "type": "assistant",
                "message": {
                    "role": "assistant",
                    "content": [
                        {"type": "tool_use", "name": "Bash", "id": "t1", "input": {"command": "ls"}}
                    ],
                    "stop_reason": "tool_use"
                }
            }),
        )];

        assert_eq!(
            determine_session_status(&entries),
            DiscoveredSessionStatus::NeedsAttention
        );
    }

    #[test]
    fn status_idle_for_assistant_end_turn_with_tool_use() {
        let entries = vec![make_entry(
            "assistant",
            "2024-01-01T00:00:00Z",
            serde_json::json!({
                "type": "assistant",
                "message": {
                    "role": "assistant",
                    "content": [
                        {"type": "tool_use", "name": "Bash", "id": "t1", "input": {}}
                    ],
                    "stop_reason": "end_turn"
                }
            }),
        )];

        assert_eq!(
            determine_session_status(&entries),
            DiscoveredSessionStatus::Idle
        );
    }

    #[test]
    fn status_needs_attention_for_question_ending_message() {
        let entries = vec![make_entry(
            "assistant",
            "2024-01-01T00:00:00Z",
            serde_json::json!({
                "type": "assistant",
                "message": {
                    "role": "assistant",
                    "content": [
                        {"type": "text", "text": "Would you like me to proceed?"}
                    ],
                    "stop_reason": "end_turn"
                }
            }),
        )];

        assert_eq!(
            determine_session_status(&entries),
            DiscoveredSessionStatus::NeedsAttention
        );
    }

    #[test]
    fn status_working_for_recent_assistant_message() {
        let now = chrono::Utc::now().to_rfc3339();
        let entries = vec![make_entry(
            "assistant",
            &now,
            serde_json::json!({
                "type": "assistant",
                "message": {
                    "role": "assistant",
                    "content": [
                        {"type": "text", "text": "I'm working on it."}
                    ],
                    "stop_reason": "end_turn"
                }
            }),
        )];

        assert_eq!(
            determine_session_status(&entries),
            DiscoveredSessionStatus::Working
        );
    }

    // ─── Cost Extraction ─────────────────────────────────────────────

    #[test]
    fn extract_cost_from_assistant_messages() {
        let tmp = TempDir::new().unwrap();
        let path = write_jsonl_file(
            tmp.path(),
            "session.jsonl",
            &[
                r#"{"type":"user","timestamp":"2026-01-01T00:00:00Z","message":{"role":"user","content":"hello"}}"#,
                r#"{"type":"assistant","timestamp":"2026-01-01T00:00:01Z","message":{"model":"claude-sonnet-4-20250514","role":"assistant","content":[{"type":"text","text":"hi"}],"stop_reason":"end_turn","usage":{"input_tokens":1000,"output_tokens":500,"cache_creation_input_tokens":0,"cache_read_input_tokens":0}}}"#,
            ],
        );

        let (cost, tokens) = extract_cost_from_jsonl(&path);

        // Sonnet: 1000 * 3.0/1M + 500 * 15.0/1M = 0.003 + 0.0075 = 0.0105
        assert!((cost - 0.0105).abs() < 0.0001);
        assert_eq!(tokens, 1500);
    }

    #[test]
    fn extract_cost_handles_cache_tokens() {
        let tmp = TempDir::new().unwrap();
        let path = write_jsonl_file(
            tmp.path(),
            "session.jsonl",
            &[
                r#"{"type":"assistant","timestamp":"2026-01-01T00:00:01Z","message":{"model":"claude-sonnet-4-20250514","role":"assistant","content":[],"usage":{"input_tokens":100,"output_tokens":50,"cache_creation_input_tokens":200,"cache_read_input_tokens":300}}}"#,
            ],
        );

        let (cost, tokens) = extract_cost_from_jsonl(&path);

        // 100*3.0 + 50*15.0 + 200*3.75 + 300*0.30 = 300+750+750+90 = 1890 / 1M = 0.00189
        assert!((cost - 0.00189).abs() < 0.00001);
        assert_eq!(tokens, 150); // Only input + output count
    }

    #[test]
    fn extract_cost_sums_across_multiple_messages() {
        let tmp = TempDir::new().unwrap();
        let path = write_jsonl_file(
            tmp.path(),
            "session.jsonl",
            &[
                r#"{"type":"assistant","timestamp":"2026-01-01T00:00:01Z","message":{"model":"claude-sonnet-4-20250514","role":"assistant","content":[],"usage":{"input_tokens":1000,"output_tokens":500,"cache_creation_input_tokens":0,"cache_read_input_tokens":0}}}"#,
                r#"{"type":"user","timestamp":"2026-01-01T00:00:02Z","message":{"role":"user","content":"more"}}"#,
                r#"{"type":"assistant","timestamp":"2026-01-01T00:00:03Z","message":{"model":"claude-sonnet-4-20250514","role":"assistant","content":[],"usage":{"input_tokens":2000,"output_tokens":1000,"cache_creation_input_tokens":0,"cache_read_input_tokens":0}}}"#,
            ],
        );

        let (cost, tokens) = extract_cost_from_jsonl(&path);

        // Message 1: 1000*3 + 500*15 = 10500 / 1M = 0.0105
        // Message 2: 2000*3 + 1000*15 = 21000 / 1M = 0.021
        // Total: 0.0315
        assert!((cost - 0.0315).abs() < 0.0001);
        assert_eq!(tokens, 4500);
    }

    #[test]
    fn extract_cost_from_missing_file_returns_zero() {
        let (cost, tokens) = extract_cost_from_jsonl(Path::new("/nonexistent.jsonl"));
        assert_eq!(cost, 0.0);
        assert_eq!(tokens, 0);
    }

    // ─── Model Pricing ───────────────────────────────────────────────

    #[test]
    fn pricing_for_opus_new() {
        let pricing = get_model_pricing("claude-opus-4-6-20260401");
        assert_eq!(pricing.input, 5.0);
        assert_eq!(pricing.output, 25.0);
    }

    #[test]
    fn pricing_for_sonnet() {
        let pricing = get_model_pricing("claude-sonnet-4-20250514");
        assert_eq!(pricing.input, 3.0);
        assert_eq!(pricing.output, 15.0);
    }

    #[test]
    fn pricing_for_haiku_new() {
        let pricing = get_model_pricing("claude-haiku-4-5-20251001");
        assert_eq!(pricing.input, 1.0);
        assert_eq!(pricing.output, 5.0);
    }

    #[test]
    fn pricing_for_unknown_model_defaults_to_sonnet() {
        let pricing = get_model_pricing("gpt-4o");
        assert_eq!(pricing.input, 3.0);
    }

    // ─── Helper Functions ────────────────────────────────────────────

    #[test]
    fn truncate_string_leaves_short_strings_unchanged() {
        assert_eq!(truncate_string("hello", 10), "hello");
    }

    #[test]
    fn truncate_string_truncates_long_strings() {
        let long = "a".repeat(300);
        let truncated = truncate_string(&long, 200);
        assert_eq!(truncated.chars().count(), 200);
        assert!(truncated.ends_with("..."));
    }

    #[test]
    fn derive_project_name_from_working_directory() {
        assert_eq!(
            derive_project_name("C:\\Users\\snapy\\Projects\\BamGit", "some-hash"),
            "BamGit"
        );
    }

    #[test]
    fn derive_project_name_falls_back_to_directory_name() {
        assert_eq!(derive_project_name("", "encoded-name"), "encoded-name");
    }

    #[test]
    fn extract_first_user_prompt_from_entries() {
        let entries = vec![
            make_entry(
                "assistant",
                "2026-01-01T00:00:00Z",
                serde_json::json!({"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"system"}]}}),
            ),
            make_entry(
                "user",
                "2026-01-01T00:00:01Z",
                serde_json::json!({"type":"user","message":{"role":"user","content":"fix the bug"}}),
            ),
        ];

        assert_eq!(
            extract_first_user_prompt(&entries),
            Some("fix the bug".to_string())
        );
    }

    #[test]
    fn count_messages_counts_user_and_assistant_only() {
        let entries = vec![
            make_entry("user", "2026-01-01T00:00:00Z", serde_json::json!({})),
            make_entry("assistant", "2026-01-01T00:00:01Z", serde_json::json!({})),
            make_entry("summary", "2026-01-01T00:00:02Z", serde_json::json!({})),
            make_entry("user", "2026-01-01T00:00:03Z", serde_json::json!({})),
        ];

        assert_eq!(count_messages(&entries), 3);
    }

    // ─── Session Index ───────────────────────────────────────────────

    #[test]
    fn read_session_index_finds_matching_session() {
        let tmp = TempDir::new().unwrap();
        let index_content = serde_json::json!([
            {"sessionId": "abc-123", "projectPath": "/home/user/project", "numMessages": 5, "gitBranch": "main"},
            {"sessionId": "def-456", "projectPath": "/home/user/other", "numMessages": 3}
        ]);
        fs::write(
            tmp.path().join("sessions-index.json"),
            index_content.to_string(),
        )
        .unwrap();

        let result = read_session_index(tmp.path(), "abc-123");
        assert!(result.is_some());
        let entry = result.unwrap();
        assert_eq!(entry.git_branch.as_deref(), Some("main"));
        assert_eq!(entry.num_messages, Some(5));
    }

    #[test]
    fn read_session_index_returns_none_for_missing_session() {
        let tmp = TempDir::new().unwrap();
        let index_content = serde_json::json!([
            {"sessionId": "abc-123", "projectPath": "/home/user/project"}
        ]);
        fs::write(
            tmp.path().join("sessions-index.json"),
            index_content.to_string(),
        )
        .unwrap();

        assert!(read_session_index(tmp.path(), "nonexistent").is_none());
    }

    #[test]
    fn read_session_index_returns_none_for_missing_file() {
        let tmp = TempDir::new().unwrap();
        assert!(read_session_index(tmp.path(), "abc-123").is_none());
    }

    // ─── Most Recent JSONL ───────────────────────────────────────────

    #[test]
    fn find_most_recent_jsonl_skips_agent_files() {
        let tmp = TempDir::new().unwrap();
        write_jsonl_file(tmp.path(), "agent-test.jsonl", &[r#"{"type":"user"}"#]);
        write_jsonl_file(tmp.path(), "abc-123.jsonl", &[r#"{"type":"user"}"#]);

        let result = find_most_recent_jsonl(tmp.path(), 0);
        assert!(result.is_some());
        let filename = result.unwrap().file_stem().unwrap().to_string_lossy().to_string();
        assert_eq!(filename, "abc-123");
    }

    #[test]
    fn find_most_recent_jsonl_returns_none_for_empty_directory() {
        let tmp = TempDir::new().unwrap();
        assert!(find_most_recent_jsonl(tmp.path(), 0).is_none());
    }

    // ─── User Prompt Extraction (content as array) ───────────────────

    #[test]
    fn extract_first_user_prompt_from_content_array() {
        let entries = vec![make_entry(
            "user",
            "2026-01-01T00:00:00Z",
            serde_json::json!({
                "type": "user",
                "message": {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "fix the login page"}
                    ]
                }
            }),
        )];

        assert_eq!(
            extract_first_user_prompt(&entries),
            Some("fix the login page".to_string())
        );
    }
}
