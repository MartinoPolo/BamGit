use crate::models::ai_config::{McpDeleteKind, ProviderKind, SettingsScope, SymlinkInfo};
use std::path::{Path, PathBuf};
use tauri::command;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Read a file, optionally stripping JSONC comments, then parse as JSON.
fn read_json_file(path: &Path) -> Result<serde_json::Value, String> {
    if !path.exists() {
        return Ok(serde_json::Value::Object(serde_json::Map::new()));
    }
    let raw = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    let stripped = strip_jsonc_comments(&raw);
    serde_json::from_str(&stripped).map_err(|e| format!("JSON parse error in {}: {e}", path.display()))
}

/// Strip JSONC line comments (`// ...`) and block comments (`/* ... */`).
/// Does not handle comments inside strings (pragmatic approximation).
pub(crate) fn strip_jsonc_comments(src: &str) -> String {
    let mut result = String::with_capacity(src.len());
    let mut chars = src.chars().peekable();
    while let Some(ch) = chars.next() {
        match ch {
            '"' => {
                result.push(ch);
                // Walk through string literal, respecting escape sequences.
                loop {
                    match chars.next() {
                        None => break,
                        Some('\\') => {
                            result.push('\\');
                            if let Some(escaped) = chars.next() {
                                result.push(escaped);
                            }
                        }
                        Some('"') => {
                            result.push('"');
                            break;
                        }
                        Some(c) => result.push(c),
                    }
                }
            }
            '/' => match chars.peek() {
                Some('/') => {
                    // Line comment — consume until newline.
                    for c in chars.by_ref() {
                        if c == '\n' {
                            result.push('\n');
                            break;
                        }
                    }
                }
                Some('*') => {
                    // Block comment — consume until `*/`.
                    chars.next(); // consume `*`
                    loop {
                        match chars.next() {
                            None => break,
                            Some('*') => {
                                if chars.peek() == Some(&'/') {
                                    chars.next();
                                    break;
                                }
                            }
                            Some(_) => {}
                        }
                    }
                }
                _ => result.push(ch),
            },
            c => result.push(c),
        }
    }
    result
}

/// Write a JSON value to a file as pretty-printed JSON.
/// Creates parent directories if missing.
fn write_json_file(path: &Path, value: &serde_json::Value) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let serialized = serde_json::to_string_pretty(value).map_err(|e| e.to_string())?;
    std::fs::write(path, serialized).map_err(|e| e.to_string())
}

/// Read, apply a mutation, then write back a JSON file.
fn mutate_json_file<F>(path: &Path, mutate: F) -> Result<(), String>
where
    F: FnOnce(&mut serde_json::Value) -> Result<(), String>,
{
    let mut value = read_json_file(path)?;
    mutate(&mut value)?;
    write_json_file(path, &value)
}

/// Deep-merge `patch` into `target`.
/// - Objects: recurse.
/// - `null` in patch: delete the key from target.
/// - Anything else: patch value replaces target value.
fn deep_merge(target: &mut serde_json::Value, patch: serde_json::Value) {
    match (target, patch) {
        (serde_json::Value::Object(ref mut t), serde_json::Value::Object(p)) => {
            for (key, val) in p {
                if val.is_null() {
                    t.remove(&key);
                } else {
                    let entry = t.entry(key).or_insert(serde_json::Value::Null);
                    deep_merge(entry, val);
                }
            }
        }
        (target, patch) => *target = patch,
    }
}

/// Resolve symlink to its canonical target if it is a symlink.
/// Returns the resolved path (or the original path if not a symlink).
fn resolve_if_symlink(path: &Path) -> Result<PathBuf, String> {
    let meta = std::fs::symlink_metadata(path).map_err(|e| e.to_string())?;
    if meta.file_type().is_symlink() {
        std::fs::canonicalize(path).map_err(|e| e.to_string())
    } else {
        Ok(path.to_path_buf())
    }
}

/// Return the settings file path for a given provider+scope combination.
fn provider_settings_path(
    provider: ProviderKind,
    scope: SettingsScope,
    workspace_root: Option<&str>,
) -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or_else(|| "no home directory".to_string())?;

    match (provider, scope) {
        (ProviderKind::ClaudeCode, SettingsScope::User) => {
            Ok(home.join(".claude").join("settings.json"))
        }
        (ProviderKind::ClaudeCode, SettingsScope::Project) => {
            let root = workspace_root.ok_or("workspace_root required for project scope")?;
            Ok(PathBuf::from(root).join(".claude").join("settings.json"))
        }
        (ProviderKind::OpenCode, SettingsScope::User) => {
            let json_path = home.join(".config").join("opencode").join("opencode.json");
            if json_path.exists() {
                Ok(json_path)
            } else {
                Ok(home.join(".config").join("opencode").join("opencode.jsonc"))
            }
        }
        (ProviderKind::OpenCode, SettingsScope::Project) => {
            let root = workspace_root.ok_or("workspace_root required for project scope")?;
            let json_path = PathBuf::from(root).join("opencode.json");
            if json_path.exists() {
                Ok(json_path)
            } else {
                Ok(PathBuf::from(root).join("opencode.jsonc"))
            }
        }
        (ProviderKind::Codex, SettingsScope::User) => {
            Ok(home.join(".codex").join("config.toml"))
        }
        (ProviderKind::Codex, SettingsScope::Project) => {
            let root = workspace_root.ok_or("workspace_root required for project scope")?;
            Ok(PathBuf::from(root).join(".codex").join("config.toml"))
        }
        (ProviderKind::Cursor, SettingsScope::User) => {
            Ok(home.join(".cursor").join("settings.json"))
        }
        (ProviderKind::Cursor, SettingsScope::Project) => {
            let root = workspace_root.ok_or("workspace_root required for project scope")?;
            Ok(PathBuf::from(root).join(".cursor").join("settings.json"))
        }
    }
}

// ---------------------------------------------------------------------------
// TOML <-> JSON helpers
// ---------------------------------------------------------------------------

fn toml_to_json(value: toml::Value) -> serde_json::Value {
    match value {
        toml::Value::String(s) => serde_json::Value::String(s),
        toml::Value::Integer(i) => serde_json::Value::Number(i.into()),
        toml::Value::Float(f) => {
            serde_json::Number::from_f64(f)
                .map(serde_json::Value::Number)
                .unwrap_or(serde_json::Value::Null)
        }
        toml::Value::Boolean(b) => serde_json::Value::Bool(b),
        toml::Value::Array(arr) => {
            serde_json::Value::Array(arr.into_iter().map(toml_to_json).collect())
        }
        toml::Value::Table(table) => {
            let map = table
                .into_iter()
                .map(|(k, v)| (k, toml_to_json(v)))
                .collect();
            serde_json::Value::Object(map)
        }
        toml::Value::Datetime(dt) => serde_json::Value::String(dt.to_string()),
    }
}

fn json_to_toml(value: serde_json::Value) -> Result<toml::Value, String> {
    match value {
        serde_json::Value::Null => Ok(toml::Value::String(String::new())),
        serde_json::Value::Bool(b) => Ok(toml::Value::Boolean(b)),
        serde_json::Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Ok(toml::Value::Integer(i))
            } else if let Some(f) = n.as_f64() {
                Ok(toml::Value::Float(f))
            } else {
                Err(format!("Cannot convert JSON number {n} to TOML"))
            }
        }
        serde_json::Value::String(s) => Ok(toml::Value::String(s)),
        serde_json::Value::Array(arr) => {
            let items: Result<Vec<_>, _> = arr.into_iter().map(json_to_toml).collect();
            Ok(toml::Value::Array(items?))
        }
        serde_json::Value::Object(map) => {
            let mut table = toml::value::Table::new();
            for (k, v) in map {
                table.insert(k, json_to_toml(v)?);
            }
            Ok(toml::Value::Table(table))
        }
    }
}

fn read_toml_as_json(path: &Path) -> Result<serde_json::Value, String> {
    if !path.exists() {
        return Ok(serde_json::Value::Object(serde_json::Map::new()));
    }
    let raw = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    let toml_val: toml::Value = raw
        .parse()
        .map_err(|e| format!("TOML parse error in {}: {e}", path.display()))?;
    Ok(toml_to_json(toml_val))
}

fn write_json_as_toml(path: &Path, value: &serde_json::Value) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let toml_val = json_to_toml(value.clone())?;
    let serialized = toml::to_string_pretty(&toml_val).map_err(|e| e.to_string())?;
    std::fs::write(path, serialized).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

#[command]
pub async fn inspect_symlink(path: String) -> Result<SymlinkInfo, String> {
    tokio::task::spawn_blocking(move || {
        let p = Path::new(&path);
        let meta = std::fs::symlink_metadata(p).map_err(|e| e.to_string())?;
        let is_symlink = meta.file_type().is_symlink();
        if !is_symlink {
            return Ok(SymlinkInfo {
                is_symlink: false,
                resolved_path: None,
                target_exists: meta.is_file(),
            });
        }
        let resolved = std::fs::canonicalize(p).ok();
        let target_exists = resolved.as_ref().map(|r| r.exists()).unwrap_or(false);
        Ok(SymlinkInfo {
            is_symlink: true,
            resolved_path: resolved.map(|r| r.to_string_lossy().to_string()),
            target_exists,
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

#[command]
pub async fn write_ai_config_file(path: String, content: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let p = Path::new(&path);
        let resolved = if p.exists() {
            resolve_if_symlink(p)?
        } else {
            p.to_path_buf()
        };
        if let Some(parent) = resolved.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        std::fs::write(&resolved, content).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[command]
pub async fn delete_ai_config_file(path: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let p = Path::new(&path);
        let meta = std::fs::symlink_metadata(p).map_err(|e| e.to_string())?;

        if meta.file_type().is_symlink() {
            // REQ-46: resolve and delete the target, then best-effort remove the symlink.
            let resolved = std::fs::canonicalize(p).map_err(|e| e.to_string())?;
            std::fs::remove_file(&resolved).map_err(|e| e.to_string())?;
            // Best-effort symlink removal.
            let _ = std::fs::remove_file(p);
        } else {
            std::fs::remove_file(p).map_err(|e| e.to_string())?;

            // Best-effort: if this was a SKILL.md, remove the parent dir if empty.
            if p.file_name().map(|n| n == "SKILL.md").unwrap_or(false) {
                if let Some(parent) = p.parent() {
                    // Only remove if the directory is now empty.
                    let is_empty = std::fs::read_dir(parent)
                        .map(|mut d| d.next().is_none())
                        .unwrap_or(false);
                    if is_empty {
                        let _ = std::fs::remove_dir(parent);
                    }
                }
            }
        }
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[command]
pub async fn delete_hook_from_settings(
    settings_path: String,
    event_type: String,
    matcher: Option<String>,
    command: String,
) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let path = Path::new(&settings_path);
        mutate_json_file(path, |root| {
            let hooks = match root.get_mut("hooks").and_then(|h| h.as_object_mut()) {
                Some(h) => h,
                None => return Ok(()), // Nothing to do.
            };

            let event_array = match hooks.get_mut(&event_type).and_then(|e| e.as_array_mut()) {
                Some(a) => a,
                None => return Ok(()),
            };

            // Find the matcher entry.
            for matcher_entry in event_array.iter_mut() {
                let entry_matcher = matcher_entry
                    .get("matcher")
                    .and_then(|m| m.as_str())
                    .map(String::from);
                let matches = entry_matcher == matcher;
                if !matches {
                    continue;
                }
                // Found the matcher entry — remove the specific hook command.
                if let Some(hooks_arr) = matcher_entry
                    .get_mut("hooks")
                    .and_then(|h| h.as_array_mut())
                {
                    hooks_arr.retain(|h| {
                        h.get("command").and_then(|c| c.as_str()) != Some(command.as_str())
                    });
                }
                break;
            }

            // Clean up empty matchers.
            event_array.retain(|entry| {
                entry
                    .get("hooks")
                    .and_then(|h| h.as_array())
                    .map(|a| !a.is_empty())
                    .unwrap_or(true)
            });

            // Clean up empty event_type keys.
            if event_array.is_empty() {
                hooks.remove(&event_type);
            }

            Ok(())
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

#[command]
pub async fn delete_mcp_from_settings(
    file_path: String,
    kind: McpDeleteKind,
    name: String,
) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let path = Path::new(&file_path);
        mutate_json_file(path, |root| {
            match kind {
                McpDeleteKind::McpServers | McpDeleteKind::McpJsonFile => {
                    if let Some(obj) = root
                        .get_mut("mcpServers")
                        .and_then(|v| v.as_object_mut())
                    {
                        obj.remove(&name);
                    }
                }
                McpDeleteKind::EnabledPlugins => {
                    if let Some(obj) = root
                        .get_mut("enabledPlugins")
                        .and_then(|v| v.as_object_mut())
                    {
                        if obj.contains_key(&name) {
                            obj.insert(name, serde_json::Value::Bool(false));
                        }
                        // No-op if key doesn't exist.
                    }
                }
            }
            Ok(())
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

const VALID_SKILL_OVERRIDES: &[&str] = &["on", "name-only", "user-invocable-only", "off"];

#[command]
pub async fn set_skill_override(
    workspace_root: String,
    skill_name: String,
    value: String,
) -> Result<(), String> {
    if !VALID_SKILL_OVERRIDES.contains(&value.as_str()) {
        return Err(format!(
            "Invalid skill override value '{value}'. Must be one of: on, name-only, user-invocable-only, off"
        ));
    }

    tokio::task::spawn_blocking(move || {
        let settings_path = PathBuf::from(&workspace_root)
            .join(".claude")
            .join("settings.local.json");

        mutate_json_file(&settings_path, |root| {
            // Ensure root is an object.
            if !root.is_object() {
                *root = serde_json::Value::Object(serde_json::Map::new());
            }
            let root_obj = root.as_object_mut().unwrap();

            if value == "on" {
                // Remove the key — "on" is the default.
                if let Some(overrides) = root_obj
                    .get_mut("skillOverrides")
                    .and_then(|v| v.as_object_mut())
                {
                    overrides.remove(&skill_name);
                    let empty = overrides.is_empty();
                    if empty {
                        root_obj.remove("skillOverrides");
                    }
                }
            } else {
                let overrides = root_obj
                    .entry("skillOverrides")
                    .or_insert_with(|| serde_json::Value::Object(serde_json::Map::new()));
                if let Some(obj) = overrides.as_object_mut() {
                    obj.insert(skill_name, serde_json::Value::String(value));
                }
            }
            Ok(())
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

#[command]
pub async fn read_provider_settings(
    provider: ProviderKind,
    scope: SettingsScope,
    workspace_root: Option<String>,
) -> Result<serde_json::Value, String> {
    tokio::task::spawn_blocking(move || {
        let path = provider_settings_path(provider, scope, workspace_root.as_deref())?;
        if provider == ProviderKind::Codex {
            read_toml_as_json(&path)
        } else {
            read_json_file(&path)
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[command]
pub async fn write_provider_settings(
    provider: ProviderKind,
    scope: SettingsScope,
    workspace_root: Option<String>,
    patch: serde_json::Value,
) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let path = provider_settings_path(provider, scope, workspace_root.as_deref())?;

        if provider == ProviderKind::Codex {
            let mut existing = read_toml_as_json(&path)?;
            deep_merge(&mut existing, patch);
            write_json_as_toml(&path, &existing)
        } else {
            mutate_json_file(&path, |existing| {
                deep_merge(existing, patch);
                Ok(())
            })
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tempfile::TempDir;

    fn tmp_json(dir: &TempDir, name: &str, value: &serde_json::Value) -> PathBuf {
        let path = dir.path().join(name);
        std::fs::write(&path, serde_json::to_string_pretty(value).unwrap()).unwrap();
        path
    }

    // -----------------------------------------------------------------------
    // inspect_symlink — non-symlink branch (cross-platform)
    // -----------------------------------------------------------------------

    #[test]
    fn inspect_symlink_returns_not_symlink_for_regular_file() {
        let dir = TempDir::new().unwrap();
        let file = dir.path().join("regular.txt");
        std::fs::write(&file, "hello").unwrap();

        let result = tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(inspect_symlink(file.to_string_lossy().to_string()))
            .unwrap();

        assert!(!result.is_symlink);
        assert!(result.target_exists);
        assert!(result.resolved_path.is_none());
    }

    // -----------------------------------------------------------------------
    // write_creates_parent_dirs
    // -----------------------------------------------------------------------

    #[test]
    fn write_creates_parent_dirs() {
        let dir = TempDir::new().unwrap();
        let nested = dir.path().join("a").join("b").join("c.txt");

        tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(write_ai_config_file(
                nested.to_string_lossy().to_string(),
                "content".to_string(),
            ))
            .unwrap();

        assert_eq!(std::fs::read_to_string(&nested).unwrap(), "content");
    }

    // -----------------------------------------------------------------------
    // delete_removes_file
    // -----------------------------------------------------------------------

    #[test]
    fn delete_removes_file() {
        let dir = TempDir::new().unwrap();
        let file = dir.path().join("to_delete.txt");
        std::fs::write(&file, "bye").unwrap();

        tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(delete_ai_config_file(
                file.to_string_lossy().to_string(),
            ))
            .unwrap();

        assert!(!file.exists());
    }

    // -----------------------------------------------------------------------
    // delete_hook_removes_command_and_cleans_empty_arrays
    // -----------------------------------------------------------------------

    #[test]
    fn delete_hook_removes_command_and_cleans_empty_arrays() {
        let dir = TempDir::new().unwrap();
        let settings = tmp_json(
            &dir,
            "settings.json",
            &json!({
                "hooks": {
                    "PreToolUse": [
                        {
                            "matcher": "Bash",
                            "hooks": [
                                { "command": "echo hello" },
                                { "command": "echo world" }
                            ]
                        }
                    ]
                }
            }),
        );

        tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(delete_hook_from_settings(
                settings.to_string_lossy().to_string(),
                "PreToolUse".to_string(),
                Some("Bash".to_string()),
                "echo hello".to_string(),
            ))
            .unwrap();

        let result: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&settings).unwrap()).unwrap();
        let hooks_arr = result["hooks"]["PreToolUse"][0]["hooks"].as_array().unwrap();
        assert_eq!(hooks_arr.len(), 1);
        assert_eq!(hooks_arr[0]["command"], "echo world");
    }

    #[test]
    fn delete_hook_cleans_empty_matcher_and_event() {
        let dir = TempDir::new().unwrap();
        let settings = tmp_json(
            &dir,
            "settings.json",
            &json!({
                "hooks": {
                    "PostToolUse": [
                        {
                            "matcher": "Write",
                            "hooks": [{ "command": "lint" }]
                        }
                    ]
                }
            }),
        );

        tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(delete_hook_from_settings(
                settings.to_string_lossy().to_string(),
                "PostToolUse".to_string(),
                Some("Write".to_string()),
                "lint".to_string(),
            ))
            .unwrap();

        let result: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&settings).unwrap()).unwrap();
        // Both matcher entry and PostToolUse key should be gone.
        assert!(result["hooks"]["PostToolUse"].is_null());
    }

    // -----------------------------------------------------------------------
    // delete_mcp_servers_removes_entry
    // -----------------------------------------------------------------------

    #[test]
    fn delete_mcp_servers_removes_entry() {
        let dir = TempDir::new().unwrap();
        let settings = tmp_json(
            &dir,
            "settings.json",
            &json!({ "mcpServers": { "my-server": { "command": "npx" }, "other": {} } }),
        );

        tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(delete_mcp_from_settings(
                settings.to_string_lossy().to_string(),
                McpDeleteKind::McpServers,
                "my-server".to_string(),
            ))
            .unwrap();

        let result: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&settings).unwrap()).unwrap();
        assert!(result["mcpServers"]["my-server"].is_null());
        assert!(!result["mcpServers"]["other"].is_null());
    }

    // -----------------------------------------------------------------------
    // delete_enabled_plugins_sets_false_not_remove
    // -----------------------------------------------------------------------

    #[test]
    fn delete_enabled_plugins_sets_false_not_remove() {
        let dir = TempDir::new().unwrap();
        let settings = tmp_json(
            &dir,
            "settings.json",
            &json!({ "enabledPlugins": { "plugin-a": true, "plugin-b": true } }),
        );

        tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(delete_mcp_from_settings(
                settings.to_string_lossy().to_string(),
                McpDeleteKind::EnabledPlugins,
                "plugin-a".to_string(),
            ))
            .unwrap();

        let result: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&settings).unwrap()).unwrap();
        assert_eq!(result["enabledPlugins"]["plugin-a"], false);
        assert_eq!(result["enabledPlugins"]["plugin-b"], true);
    }

    // -----------------------------------------------------------------------
    // set_skill_override_writes_settings_local_json_only
    // -----------------------------------------------------------------------

    #[test]
    fn set_skill_override_writes_settings_local_json_only() {
        let dir = TempDir::new().unwrap();
        let claude_dir = dir.path().join(".claude");
        std::fs::create_dir_all(&claude_dir).unwrap();

        tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(set_skill_override(
                dir.path().to_string_lossy().to_string(),
                "my-skill".to_string(),
                "off".to_string(),
            ))
            .unwrap();

        let local_path = claude_dir.join("settings.local.json");
        assert!(local_path.exists());
        let result: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&local_path).unwrap()).unwrap();
        assert_eq!(result["skillOverrides"]["my-skill"], "off");

        // settings.json must NOT be created.
        assert!(!claude_dir.join("settings.json").exists());
    }

    // -----------------------------------------------------------------------
    // set_skill_override_with_on_removes_key
    // -----------------------------------------------------------------------

    #[test]
    fn set_skill_override_with_on_removes_key() {
        let dir = TempDir::new().unwrap();
        let claude_dir = dir.path().join(".claude");
        std::fs::create_dir_all(&claude_dir).unwrap();
        let local_path = claude_dir.join("settings.local.json");
        std::fs::write(
            &local_path,
            r#"{"skillOverrides": {"my-skill": "off", "other": "name-only"}}"#,
        )
        .unwrap();

        tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(set_skill_override(
                dir.path().to_string_lossy().to_string(),
                "my-skill".to_string(),
                "on".to_string(),
            ))
            .unwrap();

        let result: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&local_path).unwrap()).unwrap();
        // Key removed, other stays.
        assert!(result["skillOverrides"]["my-skill"].is_null());
        assert_eq!(result["skillOverrides"]["other"], "name-only");
    }

    #[test]
    fn set_skill_override_on_removes_empty_overrides_object() {
        let dir = TempDir::new().unwrap();
        let claude_dir = dir.path().join(".claude");
        std::fs::create_dir_all(&claude_dir).unwrap();
        let local_path = claude_dir.join("settings.local.json");
        std::fs::write(&local_path, r#"{"skillOverrides": {"only-skill": "off"}}"#).unwrap();

        tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(set_skill_override(
                dir.path().to_string_lossy().to_string(),
                "only-skill".to_string(),
                "on".to_string(),
            ))
            .unwrap();

        let result: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&local_path).unwrap()).unwrap();
        assert!(result["skillOverrides"].is_null());
    }

    // -----------------------------------------------------------------------
    // read_provider_settings_returns_empty_when_missing
    // -----------------------------------------------------------------------

    #[test]
    fn read_provider_settings_returns_empty_when_missing() {
        let dir = TempDir::new().unwrap();
        // Use a non-existent workspace root; the settings file won't exist.
        let result = tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(read_provider_settings(
                ProviderKind::ClaudeCode,
                SettingsScope::Project,
                Some(dir.path().to_string_lossy().to_string()),
            ))
            .unwrap();

        assert!(result.is_object());
        assert!(result.as_object().unwrap().is_empty());
    }

    // -----------------------------------------------------------------------
    // write_provider_settings_deep_merges
    // -----------------------------------------------------------------------

    #[test]
    fn write_provider_settings_deep_merges() {
        let dir = TempDir::new().unwrap();
        let claude_dir = dir.path().join(".claude");
        std::fs::create_dir_all(&claude_dir).unwrap();
        let settings_path = claude_dir.join("settings.json");
        std::fs::write(
            &settings_path,
            r#"{"env": {"FOO": "bar"}, "model": "claude-3"}"#,
        )
        .unwrap();

        tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(write_provider_settings(
                ProviderKind::ClaudeCode,
                SettingsScope::Project,
                Some(dir.path().to_string_lossy().to_string()),
                json!({"env": {"BAZ": "qux"}, "temperature": 0.5}),
            ))
            .unwrap();

        let result: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&settings_path).unwrap()).unwrap();
        // Deep merge: env object merged, not replaced.
        assert_eq!(result["env"]["FOO"], "bar");
        assert_eq!(result["env"]["BAZ"], "qux");
        assert_eq!(result["model"], "claude-3");
        assert_eq!(result["temperature"], 0.5);
    }

    // -----------------------------------------------------------------------
    // toml_round_trip_preserves_basic_types
    // -----------------------------------------------------------------------

    #[test]
    fn toml_round_trip_preserves_basic_types() {
        let original = json!({
            "name": "grovekeeper",
            "version": 1,
            "enabled": true,
            "score": 3.14,
            "tags": ["a", "b"]
        });

        let toml_val = json_to_toml(original.clone()).unwrap();
        let roundtripped = toml_to_json(toml_val);

        assert_eq!(roundtripped["name"], "grovekeeper");
        assert_eq!(roundtripped["version"], 1);
        assert_eq!(roundtripped["enabled"], true);
        assert_eq!(roundtripped["tags"][0], "a");
        // Float comparison with tolerance.
        assert!((roundtripped["score"].as_f64().unwrap() - 3.14).abs() < 0.001);
    }

    // -----------------------------------------------------------------------
    // null_in_patch_deletes_key
    // -----------------------------------------------------------------------

    #[test]
    fn null_in_patch_deletes_key() {
        let dir = TempDir::new().unwrap();
        let claude_dir = dir.path().join(".claude");
        std::fs::create_dir_all(&claude_dir).unwrap();
        let settings_path = claude_dir.join("settings.json");
        std::fs::write(&settings_path, r#"{"keep": "yes", "remove": "no"}"#).unwrap();

        tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(write_provider_settings(
                ProviderKind::ClaudeCode,
                SettingsScope::Project,
                Some(dir.path().to_string_lossy().to_string()),
                json!({"remove": null}),
            ))
            .unwrap();

        let result: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&settings_path).unwrap()).unwrap();
        assert_eq!(result["keep"], "yes");
        assert!(result["remove"].is_null()); // key deleted → serde returns Null
    }

    // -----------------------------------------------------------------------
    // Symlink on Unix
    // -----------------------------------------------------------------------

    #[cfg(unix)]
    #[test]
    fn inspect_symlink_returns_target_for_symlink() {
        let dir = TempDir::new().unwrap();
        let target = dir.path().join("target.txt");
        std::fs::write(&target, "data").unwrap();
        let link = dir.path().join("link.txt");
        std::os::unix::fs::symlink(&target, &link).unwrap();

        let result = tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(inspect_symlink(link.to_string_lossy().to_string()))
            .unwrap();

        assert!(result.is_symlink);
        assert!(result.target_exists);
        assert!(result.resolved_path.is_some());
    }
}
