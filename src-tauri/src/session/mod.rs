pub mod claude_code_provider;
pub mod discovery;
pub mod discovery_polling;
pub mod manager;
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
