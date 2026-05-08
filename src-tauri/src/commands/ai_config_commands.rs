use crate::database::connection::DatabaseState;
use crate::models::ai_config::*;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::State;

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub async fn discover_ai_config(
    state: State<'_, DatabaseState>,
    workspace_root: Option<String>,
) -> Result<AiConfigDiscoveryResult, String> {
    let custom_paths = load_custom_paths(&state)?;

    tokio::task::spawn_blocking(move || {
        run_discovery(workspace_root.as_deref(), &custom_paths)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn get_custom_discovery_paths(
    state: State<DatabaseState>,
) -> Result<Vec<CustomDiscoveryPath>, String> {
    load_custom_paths(&state)
}

#[tauri::command]
pub fn set_custom_discovery_paths(
    state: State<DatabaseState>,
    paths: Vec<CustomDiscoveryPath>,
) -> Result<(), String> {
    let json = serde_json::to_string(&paths).map_err(|e| e.to_string())?;
    let connection = state.write()?;
    connection
        .execute(
            "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?1, ?2)",
            rusqlite::params!["ai_config_custom_paths", &json],
        )
        .map_err(|e| format!("Failed to save custom paths: {e}"))?;
    Ok(())
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

fn run_discovery(
    workspace_root: Option<&str>,
    custom_paths: &[CustomDiscoveryPath],
) -> Result<AiConfigDiscoveryResult, String> {
    let user_claude_dir = user_claude_dir()?;
    let project_claude_dir = workspace_root.map(|root| PathBuf::from(root).join(".claude"));

    Ok(AiConfigDiscoveryResult {
        skills: discover_skills(&user_claude_dir, project_claude_dir.as_deref(), custom_paths),
        agents: discover_agents(&user_claude_dir, project_claude_dir.as_deref(), custom_paths),
        hooks: discover_hooks(&user_claude_dir, project_claude_dir.as_deref()),
        mcp_servers: discover_mcp_servers(&user_claude_dir, project_claude_dir.as_deref()),
        memories: discover_memories(&user_claude_dir),
        instructions: discover_instructions(
            workspace_root,
            &user_claude_dir,
            project_claude_dir.as_deref(),
        ),
    })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn user_claude_dir() -> Result<PathBuf, String> {
    dirs::home_dir()
        .map(|home| home.join(".claude"))
        .ok_or_else(|| "Could not determine home directory".to_string())
}

fn load_custom_paths(state: &State<DatabaseState>) -> Result<Vec<CustomDiscoveryPath>, String> {
    let connection = state.read()?;
    let mut statement = connection
        .prepare("SELECT value FROM app_settings WHERE key = ?1")
        .map_err(|e| format!("Failed to prepare query: {e}"))?;

    let json: Option<String> = statement
        .query_row(rusqlite::params!["ai_config_custom_paths"], |row| {
            row.get::<_, String>(0)
        })
        .ok();

    match json {
        Some(ref value) => serde_json::from_str(value).map_err(|e| e.to_string()),
        None => Ok(Vec::new()),
    }
}

// ---------------------------------------------------------------------------
// Frontmatter parsing
// ---------------------------------------------------------------------------

fn parse_frontmatter(content: &str) -> (Option<serde_yaml::Value>, String) {
    let normalized = content.replace("\r\n", "\n");

    if !normalized.starts_with("---\n") {
        return (None, content.to_string());
    }

    let after_opening = &normalized[4..];

    let closing_pos = after_opening.find("\n---\n").or_else(|| {
        if after_opening.ends_with("\n---") {
            Some(after_opening.len() - 4)
        } else {
            None
        }
    });

    match closing_pos {
        Some(pos) => {
            let yaml_str = &after_opening[..pos];
            let body_start = pos + 5; // "\n---\n".len()
            let body = if body_start <= after_opening.len() {
                after_opening[body_start..].to_string()
            } else {
                String::new()
            };

            match serde_yaml::from_str(yaml_str) {
                Ok(value) => (Some(value), body),
                Err(_) => (None, content.to_string()),
            }
        }
        None => (None, content.to_string()),
    }
}

fn yaml_string(value: &serde_yaml::Value, key: &str) -> Option<String> {
    value.get(key)?.as_str().map(|s| s.to_string())
}

fn yaml_bool(value: &serde_yaml::Value, key: &str) -> Option<bool> {
    value.get(key)?.as_bool()
}

fn yaml_string_list(value: &serde_yaml::Value, key: &str) -> Option<Vec<String>> {
    let sequence = value.get(key)?.as_sequence()?;
    Some(
        sequence
            .iter()
            .filter_map(|v| v.as_str().map(|s| s.to_string()))
            .collect(),
    )
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

fn discover_skills(
    user_claude_dir: &Path,
    project_claude_dir: Option<&Path>,
    custom_paths: &[CustomDiscoveryPath],
) -> Vec<SkillConfig> {
    let mut skills = Vec::new();

    let user_commands = user_claude_dir.join("commands");
    if user_commands.is_dir() {
        scan_skills_directory(&user_commands, ConfigSource::User, &mut skills);
    }

    if let Some(project_dir) = project_claude_dir {
        let project_commands = project_dir.join("commands");
        if project_commands.is_dir() {
            scan_skills_directory(&project_commands, ConfigSource::Project, &mut skills);
        }
    }

    for custom in custom_paths {
        let custom_path = Path::new(&custom.path);
        for subdirectory in &["commands", "skills"] {
            let directory = custom_path.join(subdirectory);
            if directory.is_dir() {
                scan_skills_directory(&directory, ConfigSource::Custom, &mut skills);
            }
        }
    }

    skills
}

fn scan_skills_directory(
    directory: &Path,
    source: ConfigSource,
    skills: &mut Vec<SkillConfig>,
) {
    let entries = match fs::read_dir(directory) {
        Ok(entries) => entries,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();

        if path.is_dir() {
            let skill_file = path.join("SKILL.md");
            if skill_file.is_file() {
                if let Some(skill) = parse_skill_file(&skill_file, &source) {
                    skills.push(skill);
                }
            }
        } else if path.extension().map_or(false, |ext| ext == "md") {
            if let Some(skill) = parse_skill_file(&path, &source) {
                skills.push(skill);
            }
        }
    }
}

fn parse_skill_file(path: &Path, source: &ConfigSource) -> Option<SkillConfig> {
    let content = fs::read_to_string(path).ok()?;
    let (frontmatter, body) = parse_frontmatter(&content);

    let file_stem = path.file_stem()?.to_string_lossy().to_string();
    let fallback_name = if file_stem == "SKILL" {
        path.parent()?.file_name()?.to_string_lossy().to_string()
    } else {
        file_stem
    };

    let (
        frontmatter_name,
        description,
        argument_hint,
        allowed_tools,
        disable_model_invocation,
        author,
        version,
        category,
    ) = if let Some(ref frontmatter) = frontmatter {
        (
            yaml_string(frontmatter, "name"),
            yaml_string(frontmatter, "description"),
            yaml_string(frontmatter, "argument-hint"),
            yaml_string_list(frontmatter, "allowed-tools"),
            yaml_bool(frontmatter, "disable-model-invocation"),
            frontmatter
                .get("metadata")
                .and_then(|metadata| yaml_string(metadata, "author")),
            frontmatter
                .get("metadata")
                .and_then(|metadata| yaml_string(metadata, "version")),
            frontmatter
                .get("metadata")
                .and_then(|metadata| yaml_string(metadata, "category")),
        )
    } else {
        (None, None, None, None, None, None, None, None)
    };

    Some(SkillConfig {
        name: frontmatter_name.unwrap_or(fallback_name),
        description,
        file_path: path.to_string_lossy().to_string(),
        source: source.clone(),
        argument_hint,
        allowed_tools,
        disable_model_invocation,
        author,
        version,
        category,
        content: body,
    })
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

fn discover_agents(
    user_claude_dir: &Path,
    project_claude_dir: Option<&Path>,
    custom_paths: &[CustomDiscoveryPath],
) -> Vec<AgentConfig> {
    let mut agents = Vec::new();

    let user_agents = user_claude_dir.join("agents");
    if user_agents.is_dir() {
        scan_agents_directory(&user_agents, ConfigSource::User, &mut agents);
    }

    if let Some(project_dir) = project_claude_dir {
        let project_agents = project_dir.join("agents");
        if project_agents.is_dir() {
            scan_agents_directory(&project_agents, ConfigSource::Project, &mut agents);
        }
    }

    for custom in custom_paths {
        let directory = Path::new(&custom.path).join("agents");
        if directory.is_dir() {
            scan_agents_directory(&directory, ConfigSource::Custom, &mut agents);
        }
    }

    agents
}

fn scan_agents_directory(
    directory: &Path,
    source: ConfigSource,
    agents: &mut Vec<AgentConfig>,
) {
    let entries = match fs::read_dir(directory) {
        Ok(entries) => entries,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().map_or(false, |ext| ext == "md") {
            if let Some(agent) = parse_agent_file(&path, &source) {
                agents.push(agent);
            }
        }
    }
}

fn parse_agent_file(path: &Path, source: &ConfigSource) -> Option<AgentConfig> {
    let content = fs::read_to_string(path).ok()?;
    let (frontmatter, body) = parse_frontmatter(&content);

    let fallback_name = path.file_stem()?.to_string_lossy().to_string();

    let (frontmatter_name, description, model, tools, color) =
        if let Some(ref frontmatter) = frontmatter {
            (
                yaml_string(frontmatter, "name"),
                yaml_string(frontmatter, "description"),
                yaml_string(frontmatter, "model"),
                yaml_string_list(frontmatter, "tools"),
                yaml_string(frontmatter, "color"),
            )
        } else {
            (None, None, None, None, None)
        };

    Some(AgentConfig {
        name: frontmatter_name.unwrap_or(fallback_name),
        description,
        file_path: path.to_string_lossy().to_string(),
        source: source.clone(),
        model,
        tools,
        color,
        content: body,
    })
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

fn discover_hooks(
    user_claude_dir: &Path,
    project_claude_dir: Option<&Path>,
) -> Vec<HookConfig> {
    let mut hooks = Vec::new();

    let user_settings = user_claude_dir.join("settings.json");
    if user_settings.is_file() {
        extract_hooks_from_settings(&user_settings, ConfigSource::User, &mut hooks);
    }

    if let Some(project_dir) = project_claude_dir {
        let project_settings = project_dir.join("settings.json");
        if project_settings.is_file() {
            extract_hooks_from_settings(&project_settings, ConfigSource::Project, &mut hooks);
        }
    }

    hooks
}

fn extract_hooks_from_settings(
    settings_path: &Path,
    source: ConfigSource,
    hooks: &mut Vec<HookConfig>,
) {
    let content = match fs::read_to_string(settings_path) {
        Ok(content) => content,
        Err(_) => return,
    };
    let json: serde_json::Value = match serde_json::from_str(&content) {
        Ok(value) => value,
        Err(_) => return,
    };

    let hooks_object = match json.get("hooks").and_then(|h| h.as_object()) {
        Some(object) => object,
        None => return,
    };

    for (event_type, matchers) in hooks_object {
        let matchers_array = match matchers.as_array() {
            Some(array) => array,
            None => continue,
        };

        for matcher_entry in matchers_array {
            let matcher = matcher_entry
                .get("matcher")
                .and_then(|m| m.as_str())
                .map(|s| s.to_string());
            let timeout = matcher_entry.get("timeout").and_then(|t| t.as_i64());

            let hook_list = match matcher_entry.get("hooks").and_then(|h| h.as_array()) {
                Some(list) => list,
                None => continue,
            };

            for hook in hook_list {
                let command = match hook.get("command").and_then(|c| c.as_str()) {
                    Some(command) => command,
                    None => continue,
                };

                let script_path = extract_script_path(command);
                let filename = script_path
                    .as_ref()
                    .and_then(|p| Path::new(p).file_name())
                    .map(|f| f.to_string_lossy().to_string())
                    .unwrap_or_else(|| command.to_string());

                let description = script_path
                    .as_ref()
                    .and_then(|p| fs::read_to_string(p).ok())
                    .and_then(|content| extract_script_description(&content));

                let file_path = script_path.unwrap_or_else(|| command.to_string());

                hooks.push(HookConfig {
                    filename,
                    file_path,
                    source: source.clone(),
                    event_type: event_type.clone(),
                    matcher: matcher.clone(),
                    timeout,
                    description,
                });
            }
        }
    }
}

fn extract_script_path(command: &str) -> Option<String> {
    let parts: Vec<&str> = command.splitn(2, char::is_whitespace).collect();
    if parts.len() == 2 {
        let path_part = parts[1].trim().trim_matches('"').trim_matches('\'');
        Some(path_part.to_string())
    } else if Path::new(parts[0]).exists() {
        Some(parts[0].to_string())
    } else {
        None
    }
}

fn extract_script_description(content: &str) -> Option<String> {
    let trimmed = content.trim();

    // JSDoc: /** ... */
    if trimmed.starts_with("/**") {
        if let Some(end) = trimmed.find("*/") {
            let jsdoc = &trimmed[3..end];
            let lines: Vec<&str> = jsdoc
                .lines()
                .map(|l| l.trim().trim_start_matches('*').trim())
                .filter(|l| !l.is_empty() && !l.starts_with('@'))
                .collect();
            if !lines.is_empty() {
                return Some(lines.join(" "));
            }
        }
    }

    // Line comments at the start of file
    let mut lines = Vec::new();
    for line in trimmed.lines() {
        let line = line.trim();
        if line.starts_with("//") {
            lines.push(line.trim_start_matches("//").trim());
        } else if line.starts_with("#!") {
            continue;
        } else if line.starts_with('#') {
            lines.push(line.trim_start_matches('#').trim());
        } else {
            break;
        }
    }

    let lines: Vec<&&str> = lines.iter().filter(|l| !l.is_empty()).collect();
    if lines.is_empty() {
        None
    } else {
        Some(lines.into_iter().copied().collect::<Vec<&str>>().join(" "))
    }
}

// ---------------------------------------------------------------------------
// MCP Servers
// ---------------------------------------------------------------------------

fn discover_mcp_servers(
    user_claude_dir: &Path,
    project_claude_dir: Option<&Path>,
) -> Vec<McpServerConfig> {
    let mut servers = Vec::new();

    let user_settings = user_claude_dir.join("settings.json");
    if user_settings.is_file() {
        extract_mcp_from_settings(&user_settings, ConfigSource::User, "claude-code", &mut servers);
    }

    if let Some(project_dir) = project_claude_dir {
        let project_settings = project_dir.join("settings.json");
        if project_settings.is_file() {
            extract_mcp_from_settings(
                &project_settings,
                ConfigSource::Project,
                "claude-code",
                &mut servers,
            );
        }
    }

    servers
}

fn extract_mcp_from_settings(
    settings_path: &Path,
    source: ConfigSource,
    provider: &str,
    servers: &mut Vec<McpServerConfig>,
) {
    let content = match fs::read_to_string(settings_path) {
        Ok(content) => content,
        Err(_) => return,
    };
    let json: serde_json::Value = match serde_json::from_str(&content) {
        Ok(value) => value,
        Err(_) => return,
    };

    if let Some(mcp_object) = json.get("mcpServers").and_then(|m| m.as_object()) {
        for (name, config) in mcp_object {
            let command = config
                .get("command")
                .and_then(|c| c.as_str())
                .map(|s| s.to_string());
            let url = config
                .get("url")
                .and_then(|u| u.as_str())
                .map(|s| s.to_string());
            let args = config.get("args").and_then(|a| a.as_array()).map(|array| {
                array
                    .iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            });
            let env_var_names = config
                .get("env")
                .and_then(|e| e.as_object())
                .map(|object| object.keys().cloned().collect());

            let transport_type = if url.is_some() {
                "sse".to_string()
            } else {
                "stdio".to_string()
            };
            let disabled = config
                .get("disabled")
                .and_then(|d| d.as_bool())
                .unwrap_or(false);

            servers.push(McpServerConfig {
                name: name.clone(),
                source: source.clone(),
                provider: provider.to_string(),
                transport_type,
                enabled: !disabled,
                command,
                url,
                args,
                env_var_names,
            });
        }
    }

    if let Some(plugins) = json.get("enabledPlugins").and_then(|p| p.as_array()) {
        for plugin in plugins {
            if let Some(name) = plugin.as_str() {
                servers.push(McpServerConfig {
                    name: name.to_string(),
                    source: source.clone(),
                    provider: provider.to_string(),
                    transport_type: "cloud".to_string(),
                    enabled: true,
                    command: None,
                    url: None,
                    args: None,
                    env_var_names: None,
                });
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Memories
// ---------------------------------------------------------------------------

fn discover_memories(user_claude_dir: &Path) -> Vec<MemoryConfig> {
    let mut memories = Vec::new();

    let projects_dir = user_claude_dir.join("projects");
    if !projects_dir.is_dir() {
        return memories;
    }

    let entries = match fs::read_dir(&projects_dir) {
        Ok(entries) => entries,
        Err(_) => return memories,
    };

    for entry in entries.flatten() {
        let memory_dir = entry.path().join("memory");
        if memory_dir.is_dir() {
            scan_memory_directory(&memory_dir, &mut memories);
        }
    }

    memories
}

fn scan_memory_directory(directory: &Path, memories: &mut Vec<MemoryConfig>) {
    let entries = match fs::read_dir(directory) {
        Ok(entries) => entries,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.extension().map_or(false, |ext| ext == "md") {
            continue;
        }
        if path.file_name().map_or(false, |f| f == "MEMORY.md") {
            continue;
        }

        if let Some(memory) = parse_memory_file(&path) {
            memories.push(memory);
        }
    }
}

fn parse_memory_file(path: &Path) -> Option<MemoryConfig> {
    let content = fs::read_to_string(path).ok()?;
    let (frontmatter, body) = parse_frontmatter(&content);

    let fallback_name = path.file_stem()?.to_string_lossy().to_string();

    let (frontmatter_name, description, memory_type) = if let Some(ref frontmatter) = frontmatter {
        (
            yaml_string(frontmatter, "name"),
            yaml_string(frontmatter, "description"),
            yaml_string(frontmatter, "type"),
        )
    } else {
        (None, None, None)
    };

    Some(MemoryConfig {
        name: frontmatter_name.unwrap_or(fallback_name),
        description,
        file_path: path.to_string_lossy().to_string(),
        memory_type,
        content: body,
    })
}

// ---------------------------------------------------------------------------
// Instructions
// ---------------------------------------------------------------------------

fn discover_instructions(
    workspace_root: Option<&str>,
    user_claude_dir: &Path,
    project_claude_dir: Option<&Path>,
) -> Vec<InstructionConfig> {
    let mut instructions = Vec::new();
    let instruction_filenames = ["CLAUDE.md", "AGENTS.md"];

    for filename in &instruction_filenames {
        let path = user_claude_dir.join(filename);
        if path.is_file() {
            if let Some(config) = parse_instruction_file(&path, ConfigSource::User) {
                instructions.push(config);
            }
        }
    }

    if let Some(project_dir) = project_claude_dir {
        for filename in &instruction_filenames {
            let path = project_dir.join(filename);
            if path.is_file() {
                if let Some(config) = parse_instruction_file(&path, ConfigSource::Project) {
                    instructions.push(config);
                }
            }
        }
    }

    if let Some(root) = workspace_root {
        let root_path = Path::new(root);
        for filename in &instruction_filenames {
            let path = root_path.join(filename);
            if path.is_file() {
                let canonical = path.to_string_lossy().to_string();
                if !instructions.iter().any(|i| i.file_path == canonical) {
                    if let Some(config) = parse_instruction_file(&path, ConfigSource::Project) {
                        instructions.push(config);
                    }
                }
            }
        }
    }

    instructions
}

fn parse_instruction_file(path: &Path, source: ConfigSource) -> Option<InstructionConfig> {
    let content = fs::read_to_string(path).ok()?;
    let metadata = fs::metadata(path).ok()?;
    let base_dir = path.parent()?;

    let resolved_content = resolve_includes(&content, base_dir);

    let last_modified = metadata.modified().ok().map(|time| {
        let datetime: chrono::DateTime<chrono::Utc> = time.into();
        datetime.to_rfc3339()
    });

    Some(InstructionConfig {
        filename: path.file_name()?.to_string_lossy().to_string(),
        file_path: path.to_string_lossy().to_string(),
        source,
        content: resolved_content,
        file_size: metadata.len(),
        last_modified,
    })
}

fn resolve_includes(content: &str, base_dir: &Path) -> String {
    let mut result = String::with_capacity(content.len());

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with('@') && !trimmed.contains(' ') {
            let include_path = base_dir.join(&trimmed[1..]);
            if include_path.is_file() {
                if let Ok(included) = fs::read_to_string(&include_path) {
                    let parent = include_path.parent().unwrap_or(base_dir);
                    let resolved = resolve_includes(&included, parent);
                    result.push_str(&resolved);
                    result.push('\n');
                    continue;
                }
            }
        }
        result.push_str(line);
        result.push('\n');
    }

    result
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::TempDir;

    #[test]
    fn parse_frontmatter_with_valid_yaml() {
        let content = "---\nname: test-skill\ndescription: A test\n---\n\nBody content here.\n";
        let (frontmatter, body) = parse_frontmatter(content);

        assert!(frontmatter.is_some());
        let frontmatter = frontmatter.unwrap();
        assert_eq!(yaml_string(&frontmatter, "name").unwrap(), "test-skill");
        assert_eq!(
            yaml_string(&frontmatter, "description").unwrap(),
            "A test"
        );
        assert!(body.contains("Body content here."));
    }

    #[test]
    fn parse_frontmatter_without_fences_returns_none() {
        let content = "Just a regular markdown file.\n";
        let (frontmatter, body) = parse_frontmatter(content);

        assert!(frontmatter.is_none());
        assert_eq!(body, content);
    }

    #[test]
    fn parse_frontmatter_with_windows_line_endings() {
        let content = "---\r\nname: test\r\n---\r\n\r\nBody.\r\n";
        let (frontmatter, body) = parse_frontmatter(content);

        assert!(frontmatter.is_some());
        assert_eq!(
            yaml_string(&frontmatter.unwrap(), "name").unwrap(),
            "test"
        );
        assert!(body.contains("Body."));
    }

    #[test]
    fn parse_frontmatter_with_malformed_yaml_returns_none() {
        let content = "---\n: invalid: yaml:\n---\n\nBody.\n";
        let (frontmatter, _body) = parse_frontmatter(content);
        assert!(frontmatter.is_none());
    }

    #[test]
    fn extract_jsdoc_description_from_script() {
        let content = "/**\n * Pre-commit gate hook.\n * Validates staged files.\n * @param {string} files\n */\nmodule.exports = ...";
        let description = extract_script_description(content);
        assert!(description.is_some());
        let desc = description.unwrap();
        assert!(desc.contains("Pre-commit gate hook."));
        assert!(desc.contains("Validates staged files."));
        assert!(!desc.contains("@param"));
    }

    #[test]
    fn extract_line_comment_description_from_script() {
        let content = "// Safety checker\n// Blocks dangerous commands\n\nconst x = 1;";
        let description = extract_script_description(content);
        assert_eq!(
            description.unwrap(),
            "Safety checker Blocks dangerous commands"
        );
    }

    #[test]
    fn extract_shell_comment_description() {
        let content = "#!/bin/bash\n# Run linter on staged files\nset -e\n";
        let description = extract_script_description(content);
        assert_eq!(description.unwrap(), "Run linter on staged files");
    }

    #[test]
    fn discover_skills_from_temp_directory() {
        let temp_dir = TempDir::new().unwrap();
        let commands_dir = temp_dir.path().join("commands");
        fs::create_dir(&commands_dir).unwrap();

        let skill_dir = commands_dir.join("my-skill");
        fs::create_dir(&skill_dir).unwrap();
        let mut file = fs::File::create(skill_dir.join("SKILL.md")).unwrap();
        writeln!(
            file,
            "---\nname: my-skill\ndescription: A test skill\n---\n\n# My Skill\n\nDoes things."
        )
        .unwrap();

        let mut direct_file = fs::File::create(commands_dir.join("quick.md")).unwrap();
        writeln!(direct_file, "# Quick command\n\nNo frontmatter.").unwrap();

        let skills = discover_skills(temp_dir.path(), None, &[]);
        assert_eq!(skills.len(), 2);

        let named_skill = skills.iter().find(|s| s.name == "my-skill").unwrap();
        assert_eq!(named_skill.description.as_deref(), Some("A test skill"));
        assert!(matches!(named_skill.source, ConfigSource::User));

        let quick_skill = skills.iter().find(|s| s.name == "quick").unwrap();
        assert!(quick_skill.description.is_none());
    }

    #[test]
    fn discover_agents_from_temp_directory() {
        let temp_dir = TempDir::new().unwrap();
        let agents_dir = temp_dir.path().join("agents");
        fs::create_dir(&agents_dir).unwrap();

        let mut file = fs::File::create(agents_dir.join("my-agent.md")).unwrap();
        writeln!(
            file,
            "---\nname: my-agent\ndescription: Test agent\nmodel: sonnet\ntools:\n  - Read\n  - Write\n---\n\n# Agent body"
        )
        .unwrap();

        let agents = discover_agents(temp_dir.path(), None, &[]);
        assert_eq!(agents.len(), 1);
        assert_eq!(agents[0].name, "my-agent");
        assert_eq!(agents[0].model.as_deref(), Some("sonnet"));
        assert_eq!(agents[0].tools.as_ref().unwrap().len(), 2);
    }

    #[test]
    fn discover_memories_skips_memory_index() {
        let temp_dir = TempDir::new().unwrap();
        let project_dir = temp_dir.path().join("projects").join("abc123");
        let memory_dir = project_dir.join("memory");
        fs::create_dir_all(&memory_dir).unwrap();

        let mut index = fs::File::create(memory_dir.join("MEMORY.md")).unwrap();
        writeln!(index, "- [entry](entry.md)").unwrap();

        let mut memory = fs::File::create(memory_dir.join("entry.md")).unwrap();
        writeln!(
            memory,
            "---\nname: test memory\ntype: feedback\ndescription: A feedback entry\n---\n\nContent."
        )
        .unwrap();

        let memories = discover_memories(temp_dir.path());
        assert_eq!(memories.len(), 1);
        assert_eq!(memories[0].name, "test memory");
        assert_eq!(memories[0].memory_type.as_deref(), Some("feedback"));
    }

    #[test]
    fn resolve_includes_expands_at_directives() {
        let temp_dir = TempDir::new().unwrap();

        let mut agents = fs::File::create(temp_dir.path().join("AGENTS.md")).unwrap();
        writeln!(agents, "# Agent instructions").unwrap();

        let content = "@AGENTS.md\n\n# Main instructions";
        let resolved = resolve_includes(content, temp_dir.path());

        assert!(resolved.contains("# Agent instructions"));
        assert!(resolved.contains("# Main instructions"));
    }

    #[test]
    fn hooks_extracted_from_settings_json() {
        let temp_dir = TempDir::new().unwrap();
        let settings = serde_json::json!({
            "hooks": {
                "PreToolUse": [
                    {
                        "matcher": "Bash",
                        "hooks": [
                            {
                                "type": "command",
                                "command": "node nonexistent.js"
                            }
                        ]
                    }
                ]
            }
        });

        let settings_path = temp_dir.path().join("settings.json");
        fs::write(&settings_path, settings.to_string()).unwrap();

        let mut hooks = Vec::new();
        extract_hooks_from_settings(&settings_path, ConfigSource::User, &mut hooks);

        assert_eq!(hooks.len(), 1);
        assert_eq!(hooks[0].event_type, "PreToolUse");
        assert_eq!(hooks[0].matcher.as_deref(), Some("Bash"));
    }

    #[test]
    fn mcp_servers_extracted_from_settings_json() {
        let temp_dir = TempDir::new().unwrap();
        let settings = serde_json::json!({
            "mcpServers": {
                "my-server": {
                    "command": "node",
                    "args": ["server.js"],
                    "env": {
                        "API_KEY": "secret"
                    }
                }
            },
            "enabledPlugins": ["plugin-a", "plugin-b"]
        });

        let settings_path = temp_dir.path().join("settings.json");
        fs::write(&settings_path, settings.to_string()).unwrap();

        let mut servers = Vec::new();
        extract_mcp_from_settings(&settings_path, ConfigSource::User, "claude-code", &mut servers);

        assert_eq!(servers.len(), 3);

        let stdio_server = servers.iter().find(|s| s.name == "my-server").unwrap();
        assert_eq!(stdio_server.transport_type, "stdio");
        assert!(stdio_server.enabled);
        assert_eq!(stdio_server.command.as_deref(), Some("node"));
        assert_eq!(
            stdio_server.env_var_names.as_ref().unwrap(),
            &["API_KEY".to_string()]
        );

        let cloud_servers: Vec<_> = servers.iter().filter(|s| s.transport_type == "cloud").collect();
        assert_eq!(cloud_servers.len(), 2);
    }
}
