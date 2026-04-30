use std::fs;
use std::io::{BufRead, BufReader};
use std::path::Path;

use super::pricing::{calculate_cost, get_model_pricing};
use super::types::{JsonlEntry, UsageData};

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

/// Extract text content from a JSONL message's content field.
/// Handles both string content and array-of-blocks content formats.
/// When `reverse` is true, searches blocks from the end (for latest message).
pub fn extract_text_from_message(entry: &JsonlEntry, reverse: bool) -> Option<String> {
    let message = entry.content.get("message")?;
    let content = message.get("content")?;

    if let Some(text) = content.as_str() {
        return Some(crate::session::truncate_utf8(text, 200));
    }

    let arr = content.as_array()?;
    let find_text_block = |block: &serde_json::Value| -> Option<String> {
        if block.get("type")?.as_str()? == "text" {
            Some(crate::session::truncate_utf8(
                block.get("text")?.as_str()?,
                200,
            ))
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
pub fn extract_first_user_prompt(entries: &[JsonlEntry]) -> Option<String> {
    entries
        .iter()
        .find(|e| e.entry_type == "user")
        .and_then(|e| extract_text_from_message(e, false))
}

/// Extract the latest user or assistant text message.
pub fn extract_latest_message(entries: &[JsonlEntry]) -> Option<String> {
    entries
        .iter()
        .rev()
        .find(|e| e.entry_type == "user" || e.entry_type == "assistant")
        .and_then(|e| extract_text_from_message(e, true))
}

/// Count user and assistant messages in entries.
pub fn count_messages(entries: &[JsonlEntry]) -> u32 {
    entries
        .iter()
        .filter(|e| e.entry_type == "user" || e.entry_type == "assistant")
        .count() as u32
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
pub fn parse_usage_from_line(line: &str) -> Option<UsageData> {
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
