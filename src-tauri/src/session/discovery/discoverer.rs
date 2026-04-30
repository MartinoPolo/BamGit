use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use sysinfo::{ProcessRefreshKind, System, UpdateKind};

use super::jsonl_parser::{
    count_messages, extract_cost_from_jsonl, extract_first_user_prompt, extract_latest_message,
    parse_last_n_entries,
};
use super::status::determine_session_status;
use super::types::{DiscoveredSession, ProcessInfo, SessionIndexEntry};
use super::{derive_project_name, encode_path_for_matching, read_session_index};

/// How many recent JSONL entries to parse for status determination.
const STATUS_CONTEXT_ENTRY_COUNT: usize = 20;

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

    /// Discover all running Claude Code sessions not managed by Grovekeeper.
    /// `excluded_pids` are PIDs of sessions already managed by Grovekeeper.
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
            let cmd: Vec<String> = process
                .cmd()
                .iter()
                .map(|s| s.to_string_lossy().to_string())
                .collect();
            let is_cli_process = cmd.iter().any(|arg| {
                arg.ends_with("claude.exe")
                    || arg.ends_with("claude")
                    || arg.contains("@anthropic-ai/claude-code")
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
    fn match_process_to_session(
        &self,
        process_info: &ProcessInfo,
    ) -> Option<DiscoveredSession> {
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
        let session_id = most_recent.file_stem()?.to_string_lossy().to_string();

        self.build_discovered_session(&most_recent, &encoded, &session_id, process_info)
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
            .and_then(|m: &SessionIndexEntry| m.last_message_summary.clone())
            .or_else(|| extract_first_user_prompt(&entries));

        let git_branch = index_metadata.as_ref().and_then(|m| m.git_branch.clone());

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

/// Find the most recently modified .jsonl file in a directory,
/// filtering to files modified after the process start time (with 5s buffer).
pub fn find_most_recent_jsonl(directory: &Path, process_start_time: u64) -> Option<PathBuf> {
    let mut best: Option<(PathBuf, SystemTime)> = None;

    let entries = fs::read_dir(directory).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("jsonl") {
            continue;
        }

        // Skip agent-*.jsonl files
        let Some(stem) = path.file_stem() else {
            continue;
        };
        if stem.to_string_lossy().starts_with("agent-") {
            continue;
        }

        let Some(metadata) = fs::metadata(&path).ok() else {
            continue;
        };
        let Some(modified) = metadata.modified().ok() else {
            continue;
        };
        let Some(modified_secs) = modified
            .duration_since(SystemTime::UNIX_EPOCH)
            .ok()
            .map(|d| d.as_secs())
        else {
            continue;
        };

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
