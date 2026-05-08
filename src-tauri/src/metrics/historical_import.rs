use std::path::{Path, PathBuf};

use rusqlite::Connection;
use serde::Deserialize;
use serde_json::Value;

use crate::metrics::classifier;
use crate::models::metrics::ActivityCategory;

pub struct ImportResult {
    pub sessions_imported: u64,
    pub sessions_skipped: u64,
    pub turns_imported: u64,
    pub tool_calls_imported: u64,
}

impl ImportResult {
    fn empty() -> Self {
        Self {
            sessions_imported: 0,
            sessions_skipped: 0,
            turns_imported: 0,
            tool_calls_imported: 0,
        }
    }

    fn merge(&mut self, other: &ImportResult) {
        self.sessions_imported += other.sessions_imported;
        self.sessions_skipped += other.sessions_skipped;
        self.turns_imported += other.turns_imported;
        self.tool_calls_imported += other.tool_calls_imported;
    }
}

pub struct ProviderImportResult {
    pub provider: String,
    pub result: ImportResult,
}

pub fn import_all_providers(conn: &Connection) -> Vec<ProviderImportResult> {
    let mut results = Vec::new();

    results.push(ProviderImportResult {
        provider: "claude-code".to_string(),
        result: import_claude_code_sessions(conn),
    });

    results.push(ProviderImportResult {
        provider: "cursor".to_string(),
        result: import_cursor_sessions(conn),
    });

    results.push(ProviderImportResult {
        provider: "codex".to_string(),
        result: import_codex_sessions(conn),
    });

    results
}

fn import_claude_code_sessions(conn: &Connection) -> ImportResult {
    let mut result = ImportResult::empty();

    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return result,
    };

    let projects_dir = home.join(".claude").join("projects");
    if !projects_dir.exists() {
        return result;
    }

    let session_files = discover_jsonl_files(&projects_dir);

    for file_path in &session_files {
        match import_single_claude_session(conn, file_path) {
            Ok(r) => result.merge(&r),
            Err(e) => log::warn!("Failed to import {}: {e}", file_path.display()),
        }
    }

    result
}

fn discover_jsonl_files(base_dir: &Path) -> Vec<PathBuf> {
    let mut files = Vec::new();

    let walker = walkdir::WalkDir::new(base_dir)
        .max_depth(5)
        .follow_links(false);

    for entry in walker.into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            if let Some(ext) = entry.path().extension() {
                if ext == "jsonl" {
                    files.push(entry.path().to_path_buf());
                }
            }
        }
    }

    files
}

fn import_single_claude_session(conn: &Connection, path: &Path) -> Result<ImportResult, Box<dyn std::error::Error>> {
    let mut result = ImportResult::empty();

    let content = std::fs::read_to_string(path)?;
    if content.is_empty() {
        return Ok(result);
    }

    let session_id_from_path = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown")
        .to_string();

    let dedup_key = format!("claude:{session_id_from_path}");
    let already_imported: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM import_history WHERE dedup_key = ?1",
        [&dedup_key],
        |row| row.get(0),
    ).unwrap_or(false);

    if already_imported {
        result.sessions_skipped += 1;
        return Ok(result);
    }

    let lines: Vec<&str> = content.lines().collect();
    if lines.is_empty() {
        return Ok(result);
    }

    let mut turns: Vec<ParsedTurn> = Vec::new();
    let mut current_tool_names: Vec<String> = Vec::new();
    let mut current_user_message = String::new();
    let mut session_model = String::new();
    let mut total_input_tokens: u64 = 0;
    let mut total_output_tokens: u64 = 0;
    let mut total_cache_read: u64 = 0;
    let mut total_cache_write: u64 = 0;
    let mut total_cost: f64 = 0.0;
    let mut session_start: Option<String> = None;
    let mut session_end: Option<String> = None;
    let mut all_tool_calls: Vec<(String, bool)> = Vec::new();

    for line in &lines {
        let entry: Value = match serde_json::from_str(line) {
            Ok(v) => v,
            Err(_) => continue,
        };

        let entry_type = entry.get("type").and_then(|v| v.as_str()).unwrap_or("");

        match entry_type {
            "system" | "init" => {
                if let Some(model) = entry.get("model").and_then(|v| v.as_str()) {
                    session_model = model.to_string();
                }
            }
            "user" | "human" => {
                if !current_tool_names.is_empty() || !current_user_message.is_empty() {
                    let tool_refs: Vec<&str> = current_tool_names.iter().map(|s| s.as_str()).collect();
                    let category = classifier::classify_turn(&tool_refs, &current_user_message);
                    let retries = classifier::count_retries(&tool_refs);
                    let has_edits = current_tool_names.iter().any(|t| {
                        matches!(t.as_str(), "Edit" | "Write" | "FileEditTool" | "FileWriteTool" | "NotebookEdit")
                    });
                    turns.push(ParsedTurn {
                        category,
                        tool_names: std::mem::take(&mut current_tool_names),
                        has_edits,
                        retry_count: retries,
                    });
                }

                current_user_message = extract_text_content(&entry);
                current_tool_names.clear();
            }
            "assistant" => {
                if let Some(content) = entry.get("message").and_then(|m| m.get("content")).and_then(|c| c.as_array()) {
                    for block in content {
                        if block.get("type").and_then(|v| v.as_str()) == Some("tool_use") {
                            if let Some(name) = block.get("name").and_then(|v| v.as_str()) {
                                current_tool_names.push(name.to_string());
                                all_tool_calls.push((name.to_string(), false));
                            }
                        }
                    }
                }

                if session_start.is_none() {
                    session_start = entry.get("timestamp").and_then(|v| v.as_str()).map(|s| s.to_string());
                }
                session_end = entry.get("timestamp").and_then(|v| v.as_str()).map(|s| s.to_string());
            }
            "result" => {
                if let Some(usage) = entry.get("usage") {
                    total_input_tokens += usage.get("input_tokens").and_then(|v| v.as_u64()).unwrap_or(0);
                    total_output_tokens += usage.get("output_tokens").and_then(|v| v.as_u64()).unwrap_or(0);
                    total_cache_read += usage.get("cache_read_input_tokens").and_then(|v| v.as_u64()).unwrap_or(0);
                    total_cache_write += usage.get("cache_creation_input_tokens").and_then(|v| v.as_u64()).unwrap_or(0);
                }
                total_cost += entry.get("total_cost_usd")
                    .or_else(|| entry.get("cost_usd"))
                    .and_then(|v| v.as_f64())
                    .unwrap_or(0.0);
            }
            _ => {}
        }
    }

    if !current_tool_names.is_empty() || !current_user_message.is_empty() {
        let tool_refs: Vec<&str> = current_tool_names.iter().map(|s| s.as_str()).collect();
        let category = classifier::classify_turn(&tool_refs, &current_user_message);
        let retries = classifier::count_retries(&tool_refs);
        let has_edits = current_tool_names.iter().any(|t| {
            matches!(t.as_str(), "Edit" | "Write" | "FileEditTool" | "FileWriteTool" | "NotebookEdit")
        });
        turns.push(ParsedTurn {
            category,
            tool_names: current_tool_names,
            has_edits,
            retry_count: retries,
        });
    }

    if turns.is_empty() && total_input_tokens == 0 {
        return Ok(result);
    }

    let grovekeeper_session_id = format!("imported-{session_id_from_path}");
    let one_shot_turns: i64 = turns.iter().filter(|t| t.has_edits && t.retry_count == 0).count() as i64;
    let edit_turns: i64 = turns.iter().filter(|t| t.has_edits).count() as i64;
    let total_retries: i64 = turns.iter().map(|t| t.retry_count as i64).sum();
    let start = session_start.as_deref().unwrap_or("1970-01-01T00:00:00Z");
    let end = session_end.as_deref();

    let duration = compute_duration_seconds(start, end);

    conn.execute(
        "INSERT OR IGNORE INTO sessions \
         (id, provider, state, started_at, ended_at, cost_usd, token_count, source) \
         VALUES (?1, 'claude-code', 'finished', ?2, ?3, ?4, ?5, 'adopted')",
        rusqlite::params![
            grovekeeper_session_id,
            start,
            end,
            total_cost,
            (total_input_tokens + total_output_tokens) as i64,
        ],
    )?;

    conn.execute(
        "INSERT OR IGNORE INTO session_metrics \
         (session_id, provider, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, \
          cost_usd, duration_seconds, turn_count, tool_call_count, one_shot_turns, edit_turns, retry_count, \
          started_at, ended_at, imported) \
         VALUES (?1, 'claude-code', ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, 1)",
        rusqlite::params![
            grovekeeper_session_id,
            session_model,
            total_input_tokens as i64,
            total_output_tokens as i64,
            total_cache_read as i64,
            total_cache_write as i64,
            total_cost,
            duration,
            turns.len() as i64,
            all_tool_calls.len() as i64,
            one_shot_turns,
            edit_turns,
            total_retries,
            start,
            end,
        ],
    )?;

    for (turn_idx, turn) in turns.iter().enumerate() {
        let turn_id = format!("{grovekeeper_session_id}-turn-{turn_idx}");
        conn.execute(
            "INSERT OR IGNORE INTO turn_metrics \
             (id, session_id, turn_index, category, has_edits, retry_count, tool_call_count) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![
                turn_id,
                grovekeeper_session_id,
                turn_idx as i64,
                turn.category.as_str(),
                turn.has_edits as i64,
                turn.retry_count as i64,
                turn.tool_names.len() as i64,
            ],
        )?;
        result.turns_imported += 1;

        for tool_name in &turn.tool_names {
            let tool_id = uuid::Uuid::new_v4().to_string();
            conn.execute(
                "INSERT OR IGNORE INTO tool_usage (id, session_id, turn_id, tool_name) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![tool_id, grovekeeper_session_id, turn_id, tool_name],
            )?;
            result.tool_calls_imported += 1;
        }
    }

    conn.execute(
        "INSERT OR IGNORE INTO import_history (dedup_key, provider) VALUES (?1, 'claude-code')",
        [&dedup_key],
    )?;

    result.sessions_imported += 1;
    Ok(result)
}

fn import_cursor_sessions(conn: &Connection) -> ImportResult {
    let mut result = ImportResult::empty();

    let cursor_db_path = get_cursor_db_path();
    let cursor_db_path = match cursor_db_path {
        Some(p) if p.exists() => p,
        _ => return result,
    };

    let cursor_conn = match rusqlite::Connection::open_with_flags(
        &cursor_db_path,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
    ) {
        Ok(c) => c,
        Err(e) => {
            log::warn!("Failed to open Cursor DB: {e}");
            return result;
        }
    };

    let mut stmt = match cursor_conn.prepare(
        "SELECT key, value FROM cursorDiskKV WHERE key LIKE 'bubbleId:%'"
    ) {
        Ok(s) => s,
        Err(e) => {
            log::warn!("Failed to query Cursor DB: {e}");
            return result;
        }
    };

    let mut conversations: std::collections::HashMap<String, Vec<CursorBubble>> = std::collections::HashMap::new();

    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    });

    if let Ok(rows) = rows {
        for row in rows.flatten() {
            let (_key, value) = row;
            if let Ok(bubble) = serde_json::from_str::<CursorBubble>(&value) {
                let conv_id = bubble.conversation_id.clone().unwrap_or_default();
                conversations.entry(conv_id).or_default().push(bubble);
            }
        }
    }

    for (conv_id, bubbles) in &conversations {
        let dedup_key = format!("cursor:{conv_id}");
        let already_imported: bool = conn.query_row(
            "SELECT COUNT(*) > 0 FROM import_history WHERE dedup_key = ?1",
            [&dedup_key],
            |row| row.get(0),
        ).unwrap_or(false);

        if already_imported {
            result.sessions_skipped += 1;
            continue;
        }

        let session_id = format!("imported-cursor-{conv_id}");
        let total_input: u64 = bubbles.iter().map(|b| b.token_count.as_ref().and_then(|tc| tc.input_tokens).unwrap_or(0)).sum();
        let total_output: u64 = bubbles.iter().map(|b| b.token_count.as_ref().and_then(|tc| tc.output_tokens).unwrap_or(0)).sum();
        let model = bubbles.first().and_then(|b| b.model_info.as_ref()).and_then(|m| m.model_name.clone()).unwrap_or_default();
        let started = bubbles.iter().filter_map(|b| b.created_at.as_deref()).min().unwrap_or("").to_string();
        let ended = bubbles.iter().filter_map(|b| b.created_at.as_deref()).max().map(|s| s.to_string());

        let _ = conn.execute(
            "INSERT OR IGNORE INTO sessions \
             (id, provider, state, started_at, ended_at, cost_usd, token_count, source) \
             VALUES (?1, 'cursor', 'finished', ?2, ?3, 0.0, ?4, 'adopted')",
            rusqlite::params![session_id, started, ended, (total_input + total_output) as i64],
        );

        let _ = conn.execute(
            "INSERT OR IGNORE INTO session_metrics \
             (session_id, provider, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, \
              cost_usd, turn_count, tool_call_count, started_at, ended_at, imported) \
             VALUES (?1, 'cursor', ?2, ?3, ?4, 0, 0, 0.0, ?5, 0, ?6, ?7, 1)",
            rusqlite::params![
                session_id,
                model,
                total_input as i64,
                total_output as i64,
                bubbles.len() as i64,
                started,
                ended,
            ],
        );

        let _ = conn.execute(
            "INSERT OR IGNORE INTO import_history (dedup_key, provider) VALUES (?1, 'cursor')",
            [&dedup_key],
        );

        result.sessions_imported += 1;
    }

    result
}

fn import_codex_sessions(conn: &Connection) -> ImportResult {
    let mut result = ImportResult::empty();

    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return result,
    };

    let sessions_dir = home.join(".codex").join("sessions");
    if !sessions_dir.exists() {
        return result;
    }

    let session_files = discover_jsonl_files(&sessions_dir);

    for file_path in &session_files {
        match import_single_codex_session(conn, file_path) {
            Ok(r) => result.merge(&r),
            Err(e) => log::warn!("Failed to import Codex session {}: {e}", file_path.display()),
        }
    }

    result
}

fn import_single_codex_session(conn: &Connection, path: &Path) -> Result<ImportResult, Box<dyn std::error::Error>> {
    let mut result = ImportResult::empty();

    let content = std::fs::read_to_string(path)?;
    let first_line = content.lines().next().unwrap_or("");
    let first_entry: Value = serde_json::from_str(first_line)?;

    if first_entry.get("type").and_then(|v| v.as_str()) != Some("session_meta") {
        return Ok(result);
    }

    let originator = first_entry
        .get("payload")
        .and_then(|p| p.get("originator"))
        .and_then(|v| v.as_str())
        .unwrap_or("");

    if !originator.starts_with("codex") {
        return Ok(result);
    }

    let session_id_raw = first_entry
        .get("payload")
        .and_then(|p| p.get("session_id"))
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let dedup_key = format!("codex:{session_id_raw}");
    let already_imported: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM import_history WHERE dedup_key = ?1",
        [&dedup_key],
        |row| row.get(0),
    ).unwrap_or(false);

    if already_imported {
        result.sessions_skipped += 1;
        return Ok(result);
    }

    let mut total_input: u64 = 0;
    let mut total_output: u64 = 0;
    let mut tool_names: Vec<String> = Vec::new();
    let mut model = String::new();
    let mut started_at: Option<String> = None;

    for line in content.lines().skip(1) {
        let entry: Value = match serde_json::from_str(line) {
            Ok(v) => v,
            Err(_) => continue,
        };

        let entry_type = entry.get("type").and_then(|v| v.as_str()).unwrap_or("");

        match entry_type {
            "turn_context" => {
                if let Some(m) = entry.get("model").and_then(|v| v.as_str()) {
                    model = m.to_string();
                }
            }
            "event_msg" => {
                if entry.get("event_type").and_then(|v| v.as_str()) == Some("token_count") {
                    if let Some(info) = entry.get("info").and_then(|i| i.get("last_token_usage")) {
                        total_input += info.get("input_tokens").and_then(|v| v.as_u64()).unwrap_or(0);
                        total_output += info.get("output_tokens").and_then(|v| v.as_u64()).unwrap_or(0);
                    }
                }
                if started_at.is_none() {
                    started_at = entry.get("timestamp").and_then(|v| v.as_str()).map(|s| s.to_string());
                }
            }
            "response_item" => {
                if entry.get("item_type").and_then(|v| v.as_str()) == Some("function_call") {
                    if let Some(name) = entry.get("name").and_then(|v| v.as_str()) {
                        let mapped = match name {
                            "exec_command" => "Bash",
                            "read_file" => "Read",
                            "write_file" | "apply_diff" | "apply_patch" => "Edit",
                            "spawn_agent" | "close_agent" | "wait_agent" => "Agent",
                            "read_dir" => "Glob",
                            other => other,
                        };
                        tool_names.push(mapped.to_string());
                    }
                }
            }
            _ => {}
        }
    }

    let grovekeeper_session_id = format!("imported-codex-{session_id_raw}");
    let start = started_at.as_deref().unwrap_or("1970-01-01T00:00:00Z");

    conn.execute(
        "INSERT OR IGNORE INTO sessions \
         (id, provider, state, started_at, cost_usd, token_count, source) \
         VALUES (?1, 'codex', 'finished', ?2, 0.0, ?3, 'adopted')",
        rusqlite::params![grovekeeper_session_id, start, (total_input + total_output) as i64],
    )?;

    conn.execute(
        "INSERT OR IGNORE INTO session_metrics \
         (session_id, provider, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, \
          cost_usd, turn_count, tool_call_count, started_at, imported) \
         VALUES (?1, 'codex', ?2, ?3, ?4, 0, 0, 0.0, 0, ?5, ?6, 1)",
        rusqlite::params![
            grovekeeper_session_id,
            model,
            total_input as i64,
            total_output as i64,
            tool_names.len() as i64,
            start,
        ],
    )?;

    for tool_name in &tool_names {
        let tool_id = uuid::Uuid::new_v4().to_string();
        conn.execute(
            "INSERT OR IGNORE INTO tool_usage (id, session_id, tool_name) VALUES (?1, ?2, ?3)",
            rusqlite::params![tool_id, grovekeeper_session_id, tool_name],
        )?;
        result.tool_calls_imported += 1;
    }

    conn.execute(
        "INSERT OR IGNORE INTO import_history (dedup_key, provider) VALUES (?1, 'codex')",
        [&dedup_key],
    )?;

    result.sessions_imported += 1;
    Ok(result)
}

struct ParsedTurn {
    category: ActivityCategory,
    tool_names: Vec<String>,
    has_edits: bool,
    retry_count: u32,
}

#[derive(Deserialize)]
struct CursorBubble {
    #[serde(rename = "conversationId")]
    conversation_id: Option<String>,
    #[serde(rename = "createdAt")]
    created_at: Option<String>,
    #[serde(rename = "tokenCount")]
    token_count: Option<CursorTokenCount>,
    #[serde(rename = "modelInfo")]
    model_info: Option<CursorModelInfo>,
}

#[derive(Deserialize)]
struct CursorTokenCount {
    #[serde(rename = "inputTokens")]
    input_tokens: Option<u64>,
    #[serde(rename = "outputTokens")]
    output_tokens: Option<u64>,
}

#[derive(Deserialize)]
struct CursorModelInfo {
    #[serde(rename = "modelName")]
    model_name: Option<String>,
}

fn extract_text_content(entry: &Value) -> String {
    if let Some(text) = entry.get("message").and_then(|m| m.get("content")).and_then(|c| c.as_str()) {
        return text.to_string();
    }
    if let Some(content) = entry.get("message").and_then(|m| m.get("content")).and_then(|c| c.as_array()) {
        for block in content {
            if block.get("type").and_then(|v| v.as_str()) == Some("text") {
                if let Some(text) = block.get("text").and_then(|v| v.as_str()) {
                    return text.to_string();
                }
            }
        }
    }
    String::new()
}

fn get_cursor_db_path() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        std::env::var("APPDATA").ok().map(|appdata| {
            PathBuf::from(appdata)
                .join("Cursor")
                .join("User")
                .join("globalStorage")
                .join("state.vscdb")
        })
    }
    #[cfg(target_os = "macos")]
    {
        dirs::home_dir().map(|h| {
            h.join("Library")
                .join("Application Support")
                .join("Cursor")
                .join("User")
                .join("globalStorage")
                .join("state.vscdb")
        })
    }
    #[cfg(target_os = "linux")]
    {
        dirs::home_dir().map(|h| {
            h.join(".config")
                .join("Cursor")
                .join("User")
                .join("globalStorage")
                .join("state.vscdb")
        })
    }
}

fn compute_duration_seconds(start: &str, end: Option<&str>) -> Option<f64> {
    let end = end?;
    let start_dt = chrono::NaiveDateTime::parse_from_str(start, "%Y-%m-%dT%H:%M:%S%.fZ")
        .or_else(|_| chrono::NaiveDateTime::parse_from_str(start, "%Y-%m-%d %H:%M:%S"))
        .ok()?;
    let end_dt = chrono::NaiveDateTime::parse_from_str(end, "%Y-%m-%dT%H:%M:%S%.fZ")
        .or_else(|_| chrono::NaiveDateTime::parse_from_str(end, "%Y-%m-%d %H:%M:%S"))
        .ok()?;
    Some((end_dt - start_dt).num_seconds() as f64)
}
