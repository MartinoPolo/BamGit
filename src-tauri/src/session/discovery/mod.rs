pub mod discoverer;
pub mod jsonl_parser;
pub mod pricing;
pub mod status;
pub mod types;

#[cfg(test)]
mod tests;

use std::fs;
use std::path::Path;

pub use discoverer::SessionDiscoverer;
pub use types::{DiscoveredSession, SessionIndexEntry};

/// SQL query for PIDs of Grovekeeper-managed sessions (shared between poller and commands).
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

/// Read sessions-index.json and find metadata for a session.
pub fn read_session_index(
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

/// Derive a human-readable project name from working directory or directory name.
pub fn derive_project_name(working_directory: &str, directory_name: &str) -> String {
    if !working_directory.is_empty() {
        std::path::Path::new(working_directory)
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| directory_name.to_string())
    } else {
        directory_name.to_string()
    }
}
