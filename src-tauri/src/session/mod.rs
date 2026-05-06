pub mod acp_json_rpc;
pub mod claude_code_provider;
pub mod codex_event_parser;
pub mod codex_provider;
pub mod cursor_event_parser;
pub mod cursor_provider;
pub mod discovery;
pub mod discovery_polling;
pub mod manager;
pub mod opencode_event_parser;
pub mod opencode_provider;
pub mod protocol_parser;
pub mod provider;
pub mod session_actor;

pub fn truncate_utf8(text: &str, max_chars: usize) -> String {
    if text.chars().count() <= max_chars {
        return text.to_string();
    }
    let truncated: String = text.chars().take(max_chars - 3).collect();
    format!("{truncated}...")
}
