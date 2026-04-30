use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

use tempfile::TempDir;

use super::discoverer::find_most_recent_jsonl;
use super::jsonl_parser::{
    count_messages, extract_cost_from_jsonl, extract_first_user_prompt, parse_last_n_entries,
};
use super::{derive_project_name, encode_path_for_matching, read_session_index};
use super::pricing::get_model_pricing;
use super::status::determine_session_status;
use super::types::{DiscoveredSessionStatus, JsonlEntry};

// ─── Path Encoding ───────────────────────────────────────────────

#[test]
fn encode_path_replaces_non_alphanumeric_with_dashes() {
    assert_eq!(
        encode_path_for_matching("C:\\Users\\snapy\\Projects\\Grovekeeper"),
        "C--Users-snapy-Projects-Grovekeeper"
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
fn truncate_utf8_leaves_short_strings_unchanged() {
    assert_eq!(crate::session::truncate_utf8("hello", 10), "hello");
}

#[test]
fn truncate_utf8_truncates_long_strings() {
    let long = "a".repeat(300);
    let truncated = crate::session::truncate_utf8(&long, 200);
    assert_eq!(truncated.chars().count(), 200);
    assert!(truncated.ends_with("..."));
}

#[test]
fn derive_project_name_from_working_directory() {
    assert_eq!(
        derive_project_name("C:\\Users\\snapy\\Projects\\Grovekeeper", "some-hash"),
        "Grovekeeper"
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
    let filename = result
        .unwrap()
        .file_stem()
        .unwrap()
        .to_string_lossy()
        .to_string();
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
