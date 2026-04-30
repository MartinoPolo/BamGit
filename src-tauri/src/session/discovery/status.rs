use super::types::{DiscoveredSessionStatus, JsonlEntry};

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
                    // Grovekeeper-managed sessions are excluded by PID, so this only fires for
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
                            block
                                .get("text")
                                .and_then(|t| t.as_str())
                                .map(|s| s.trim().ends_with('?'))
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
