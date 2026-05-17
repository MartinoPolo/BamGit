use crate::commands::ai_config_mutations;
use crate::commands::ai_config_providers;
use crate::database::connection::DatabaseState;
use crate::models::ai_config::*;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::State;

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub async fn discover_ai_config(
    state: State<'_, DatabaseState>,
    provider: ProviderKind,
    workspace_root: Option<String>,
) -> Result<AiConfigDiscoveryResult, String> {
    let custom_paths = load_custom_paths(&state)?;

    tokio::task::spawn_blocking(move || {
        run_discovery(provider, workspace_root.as_deref(), &custom_paths)
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
            "INSERT OR REPLACE INTO user_settings (key, value) VALUES (?1, ?2)",
            rusqlite::params!["ai_config_custom_paths", &json],
        )
        .map_err(|e| format!("Failed to save custom paths: {e}"))?;
    Ok(())
}

#[tauri::command]
pub async fn detect_installed_providers() -> Result<Vec<InstalledProvider>, String> {
    tokio::task::spawn_blocking(detect_providers_blocking)
        .await
        .map_err(|e| e.to_string())?
}

// ---------------------------------------------------------------------------
// Provider detection
// ---------------------------------------------------------------------------

fn detect_providers_blocking() -> Result<Vec<InstalledProvider>, String> {
    let home = dirs::home_dir().ok_or_else(|| "no home dir".to_string())?;

    let providers = [
        (ProviderKind::ClaudeCode, "claude", home.join(".claude")),
        (
            ProviderKind::OpenCode,
            "opencode",
            home.join(".config").join("opencode"),
        ),
        (ProviderKind::Codex, "codex", home.join(".codex")),
        (ProviderKind::Cursor, "cursor", home.join(".cursor")),
    ];

    let mut result = Vec::with_capacity(providers.len());
    for (kind, binary, user_dir) in providers {
        // Cursor ships as either `cursor` or `cursor-agent` depending on platform/version.
        let binary_path = if kind == ProviderKind::Cursor {
            which::which("cursor")
                .or_else(|_| which::which("cursor-agent"))
                .ok()
                .map(|p| p.to_string_lossy().to_string())
        } else {
            which::which(binary)
                .ok()
                .map(|p| p.to_string_lossy().to_string())
        };
        // Provider is "installed" if we found its binary OR its user dir exists.
        let user_dir_exists = user_dir.is_dir();
        let installed = binary_path.is_some() || user_dir_exists;
        result.push(InstalledProvider {
            kind,
            installed,
            user_dir: if user_dir_exists {
                Some(user_dir.to_string_lossy().to_string())
            } else {
                None
            },
            project_dir: None,
            binary_path,
        });
    }
    Ok(result)
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

fn run_discovery(
    provider: ProviderKind,
    workspace_root: Option<&str>,
    custom_paths: &[CustomDiscoveryPath],
) -> Result<AiConfigDiscoveryResult, String> {
    let workspace_path = workspace_root.map(Path::new);
    let dirs = ai_config_providers::provider_dirs(provider, workspace_path);

    // Only custom paths matching this provider.
    let provider_custom_paths: Vec<&CustomDiscoveryPath> =
        custom_paths.iter().filter(|p| p.provider == provider).collect();

    let mut sources: Vec<DiscoverySource> = Vec::new();

    // Per-provider capability matrix (which tabs are supported).
    let caps = provider_capabilities(provider);

    let skills = if caps.skills {
        discover_skills(provider, workspace_path, &dirs, &provider_custom_paths, &mut sources)
    } else {
        Vec::new()
    };

    let agents = if caps.agents {
        discover_agents(provider, &dirs, &provider_custom_paths, &mut sources)
    } else {
        Vec::new()
    };

    let hooks = if caps.hooks {
        discover_hooks(provider, &dirs, &mut sources)
    } else {
        Vec::new()
    };

    let mcp_servers = if caps.mcp_servers {
        discover_mcp_servers(provider, workspace_path, &dirs, &provider_custom_paths, &mut sources)
    } else {
        Vec::new()
    };

    let rules = if caps.rules {
        discover_rules(provider, &dirs, &provider_custom_paths, &mut sources)
    } else {
        Vec::new()
    };

    let memories = if caps.memories {
        discover_memories(provider, &dirs, &mut sources)
    } else {
        Vec::new()
    };

    let instructions = if caps.instructions {
        discover_instructions(provider, workspace_root, &dirs, &provider_custom_paths, &mut sources)
    } else {
        Vec::new()
    };

    Ok(AiConfigDiscoveryResult {
        skills,
        agents,
        hooks,
        mcp_servers,
        memories,
        instructions,
        rules,
        sources,
    })
}

struct DiscoveryCapabilities {
    skills: bool,
    agents: bool,
    hooks: bool,
    mcp_servers: bool,
    rules: bool,
    memories: bool,
    instructions: bool,
}

fn provider_capabilities(provider: ProviderKind) -> DiscoveryCapabilities {
    match provider {
        ProviderKind::ClaudeCode => DiscoveryCapabilities {
            skills: true,
            agents: true,
            hooks: true,
            mcp_servers: true,
            rules: true,
            memories: true,
            instructions: true,
        },
        ProviderKind::OpenCode => DiscoveryCapabilities {
            skills: true,
            agents: true,
            hooks: false,
            mcp_servers: true,
            rules: true,
            memories: false,
            instructions: true,
        },
        ProviderKind::Codex => DiscoveryCapabilities {
            skills: true,
            agents: true,
            hooks: true,
            mcp_servers: true,
            rules: false,
            memories: true,
            instructions: true,
        },
        ProviderKind::Cursor => DiscoveryCapabilities {
            skills: true,
            agents: false,
            hooks: false,
            mcp_servers: true,
            rules: true,
            memories: false,
            instructions: true,
        },
    }
}

// ---------------------------------------------------------------------------
// Source recording helpers
// ---------------------------------------------------------------------------

/// Push a `DiscoverySource` to `sources` only if `(provider, path, source_type)` is not
/// already present, and only if `count > 0`.
fn record_source_if_items(
    sources: &mut Vec<DiscoverySource>,
    provider: ProviderKind,
    label: &str,
    path: &Path,
    source_type: ConfigSource,
    count: usize,
) {
    if count == 0 {
        return;
    }
    let path_str = path.to_string_lossy().to_string();
    let already_present = sources
        .iter()
        .any(|s| s.provider == provider && s.path == path_str && matches_source_type(&s.source_type, &source_type));
    if !already_present {
        sources.push(DiscoverySource {
            provider,
            label: label.to_string(),
            path: path_str,
            source_type,
        });
    }
}

fn matches_source_type(a: &ConfigSource, b: &ConfigSource) -> bool {
    matches!(
        (a, b),
        (ConfigSource::User, ConfigSource::User)
            | (ConfigSource::Project, ConfigSource::Project)
            | (ConfigSource::Custom, ConfigSource::Custom)
    )
}

// ---------------------------------------------------------------------------
// Settings file helpers (REQ-5)
// ---------------------------------------------------------------------------

/// Returns (path, source) pairs for settings files in `dir`.
fn read_settings_files(dir: &Path, source: ConfigSource) -> Vec<(PathBuf, ConfigSource)> {
    [
        dir.join("settings.json"),
        dir.join("settings.local.json"),
    ]
    .into_iter()
    .filter(|p| p.is_file())
    .map(|p| (p, source.clone()))
    .collect()
}

// ---------------------------------------------------------------------------
// Deprecated detection helper
// ---------------------------------------------------------------------------

fn is_deprecated_path(path: &Path) -> bool {
    path.file_name()
        .and_then(|name| name.to_str())
        .map(|name| name.to_lowercase().contains(".deprecated."))
        .unwrap_or(false)
}

fn is_deprecated(path: &Path, frontmatter: Option<&serde_yaml::Value>) -> bool {
    if is_deprecated_path(path) {
        return true;
    }
    frontmatter
        .and_then(|fm| yaml_bool(fm, "deprecated"))
        .unwrap_or(false)
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

/// Extract the first non-empty non-heading line from markdown body as a description fallback.
fn first_content_line(body: &str) -> Option<String> {
    body.lines()
        .map(|l| l.trim())
        .find(|l| !l.is_empty() && !l.starts_with('#'))
        .map(|l| l.to_string())
}

// ---------------------------------------------------------------------------
// Skills (REQ-1, REQ-7..14, REQ-48..51)
// ---------------------------------------------------------------------------

fn discover_skills(
    provider: ProviderKind,
    workspace_root: Option<&Path>,
    dirs: &ai_config_providers::ProviderDirs,
    custom_paths: &[&CustomDiscoveryPath],
    sources: &mut Vec<DiscoverySource>,
) -> Vec<SkillConfig> {
    let mut skills: Vec<SkillConfig> = Vec::new();

    // Collect skill_overrides from settings.local.json files (project wins over user).
    let overrides = collect_skill_overrides(provider, dirs, workspace_root);

    // User-level dirs: primary skills/ then legacy commands/ (Claude Code only).
    if let Some(ref user_dir) = dirs.user {
        for subdir in skills_subdirs(provider) {
            let dir = user_dir.join(subdir);
            if dir.is_dir() {
                let before = skills.len();
                scan_skills_directory(&dir, ConfigSource::User, provider, &mut skills);
                record_source_if_items(sources, provider, "User", &dir, ConfigSource::User, skills.len() - before);
            }
        }
    }

    // Project-level dirs.
    if let Some(ref project_dir) = dirs.project {
        for subdir in skills_subdirs(provider) {
            let dir = project_dir.join(subdir);
            if dir.is_dir() {
                let before = skills.len();
                scan_skills_directory(&dir, ConfigSource::Project, provider, &mut skills);
                record_source_if_items(sources, provider, "Project", &dir, ConfigSource::Project, skills.len() - before);
            }
        }
    }

    // Compat project dirs (cross-provider).
    for compat_dir in &dirs.compat_project {
        if compat_dir.is_dir() {
            let before = skills.len();
            scan_skills_directory(compat_dir, ConfigSource::Project, provider, &mut skills);
            record_source_if_items(sources, provider, "Project (compat)", compat_dir, ConfigSource::Project, skills.len() - before);
        }
    }

    // Custom paths: scan both skills/ and commands/ subdirs.
    for custom in custom_paths {
        let custom_path = Path::new(&custom.path);
        for subdir in &["skills", "commands"] {
            let dir = custom_path.join(subdir);
            if dir.is_dir() {
                let before = skills.len();
                scan_skills_directory(&dir, ConfigSource::Custom, provider, &mut skills);
                record_source_if_items(sources, provider, &custom.label, &dir, ConfigSource::Custom, skills.len() - before);
            }
        }
    }

    // Apply skill_overrides (project-level wins over user-level).
    for skill in &mut skills {
        if let Some(override_value) = overrides.get(&skill.name) {
            skill.skill_override = Some(override_value.clone());
        }
    }

    skills
}

/// Which subdirs to scan for skills, in priority order.
fn skills_subdirs(provider: ProviderKind) -> &'static [&'static str] {
    match provider {
        // skills/ is primary; commands/ is legacy fallback.
        ProviderKind::ClaudeCode => &["skills", "commands"],
        ProviderKind::OpenCode => &["skills"],
        ProviderKind::Codex => &["skills"],
        ProviderKind::Cursor => &["skills"],
    }
}

/// Read `skillOverrides` from settings.local.json (user + project).
/// Project overrides win — last-write-wins by iterating user then project.
fn collect_skill_overrides(
    provider: ProviderKind,
    dirs: &ai_config_providers::ProviderDirs,
    _workspace_root: Option<&Path>,
) -> HashMap<String, String> {
    let mut overrides: HashMap<String, String> = HashMap::new();

    // Only Claude Code uses settings.local.json skillOverrides per spec.
    if provider != ProviderKind::ClaudeCode {
        return overrides;
    }

    let dirs_to_check: Vec<&PathBuf> = dirs
        .user
        .iter()
        .chain(dirs.project.iter())
        .collect();

    for dir in dirs_to_check {
        let local_settings = dir.join("settings.local.json");
        if !local_settings.is_file() {
            continue;
        }
        let content = match fs::read_to_string(&local_settings) {
            Ok(c) => c,
            Err(_) => continue,
        };
        let json: serde_json::Value = match serde_json::from_str(&content) {
            Ok(v) => v,
            Err(_) => continue,
        };
        if let Some(skill_overrides_obj) = json.get("skillOverrides").and_then(|v| v.as_object()) {
            for (name, value) in skill_overrides_obj {
                if let Some(val_str) = value.as_str() {
                    overrides.insert(name.clone(), val_str.to_string());
                }
            }
        }
    }

    overrides
}

fn scan_skills_directory(
    directory: &Path,
    source: ConfigSource,
    provider: ProviderKind,
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
                if let Some(skill) = parse_skill_file(&skill_file, &source, provider) {
                    skills.push(skill);
                }
            }
        } else if path.extension().is_some_and(|ext| ext == "md") {
            if let Some(skill) = parse_skill_file(&path, &source, provider) {
                skills.push(skill);
            }
        }
    }
}

fn parse_skill_file(
    path: &Path,
    source: &ConfigSource,
    provider: ProviderKind,
) -> Option<SkillConfig> {
    let content = fs::read_to_string(path).ok()?;
    let (frontmatter, body) = parse_frontmatter(&content);

    let file_stem = path.file_stem()?.to_string_lossy().to_string();
    let fallback_name = if file_stem == "SKILL" {
        path.parent()?.file_name()?.to_string_lossy().to_string()
    } else {
        file_stem
    };

    let deprecated = is_deprecated(path, frontmatter.as_ref());

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
        provider,
        argument_hint,
        allowed_tools,
        disable_model_invocation,
        author,
        version,
        category,
        content: body,
        deprecated,
        skill_override: None, // Applied after all skills are collected
    })
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

fn discover_agents(
    provider: ProviderKind,
    dirs: &ai_config_providers::ProviderDirs,
    custom_paths: &[&CustomDiscoveryPath],
    sources: &mut Vec<DiscoverySource>,
) -> Vec<AgentConfig> {
    let mut agents = Vec::new();

    if let Some(ref user_dir) = dirs.user {
        let dir = user_dir.join("agents");
        if dir.is_dir() {
            let before = agents.len();
            scan_agents_directory(&dir, ConfigSource::User, provider, &mut agents);
            record_source_if_items(sources, provider, "User", &dir, ConfigSource::User, agents.len() - before);
        }
    }

    if let Some(ref project_dir) = dirs.project {
        let dir = project_dir.join("agents");
        if dir.is_dir() {
            let before = agents.len();
            scan_agents_directory(&dir, ConfigSource::Project, provider, &mut agents);
            record_source_if_items(sources, provider, "Project", &dir, ConfigSource::Project, agents.len() - before);
        }
    }

    for custom in custom_paths {
        let dir = Path::new(&custom.path).join("agents");
        if dir.is_dir() {
            let before = agents.len();
            scan_agents_directory(&dir, ConfigSource::Custom, provider, &mut agents);
            record_source_if_items(sources, provider, &custom.label, &dir, ConfigSource::Custom, agents.len() - before);
        }
    }

    agents
}

fn scan_agents_directory(
    directory: &Path,
    source: ConfigSource,
    provider: ProviderKind,
    agents: &mut Vec<AgentConfig>,
) {
    let entries = match fs::read_dir(directory) {
        Ok(entries) => entries,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().is_some_and(|ext| ext == "md") {
            if let Some(agent) = parse_agent_file(&path, &source, provider) {
                agents.push(agent);
            }
        }
    }
}

fn parse_agent_file(
    path: &Path,
    source: &ConfigSource,
    provider: ProviderKind,
) -> Option<AgentConfig> {
    let content = fs::read_to_string(path).ok()?;
    let (frontmatter, body) = parse_frontmatter(&content);

    let fallback_name = path.file_stem()?.to_string_lossy().to_string();
    let deprecated = is_deprecated(path, frontmatter.as_ref());

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
        provider,
        model,
        tools,
        color,
        content: body,
        deprecated,
    })
}

// ---------------------------------------------------------------------------
// Hooks (REQ-5)
// ---------------------------------------------------------------------------

fn discover_hooks(
    provider: ProviderKind,
    dirs: &ai_config_providers::ProviderDirs,
    sources: &mut Vec<DiscoverySource>,
) -> Vec<HookConfig> {
    // Per capability matrix: only ClaudeCode and Codex support hooks.
    // Codex hooks are in TOML — left as a future follow-up (no TOML hook parsing yet).
    match provider {
        ProviderKind::ClaudeCode => discover_claude_hooks(dirs, sources),
        ProviderKind::Codex => {
            // TODO: Codex hooks are in ~/.codex/config.toml under [hooks] section.
            // TOML hook parsing is deferred to a follow-up issue.
            Vec::new()
        }
        ProviderKind::OpenCode | ProviderKind::Cursor => Vec::new(),
    }
}

fn discover_claude_hooks(
    dirs: &ai_config_providers::ProviderDirs,
    sources: &mut Vec<DiscoverySource>,
) -> Vec<HookConfig> {
    let mut hooks = Vec::new();

    if let Some(ref user_dir) = dirs.user {
        for (path, _) in read_settings_files(user_dir, ConfigSource::User) {
            let before = hooks.len();
            extract_hooks_from_settings(&path, ConfigSource::User, ProviderKind::ClaudeCode, &mut hooks);
            record_source_if_items(sources, ProviderKind::ClaudeCode, "User", &path, ConfigSource::User, hooks.len() - before);
        }
    }

    if let Some(ref project_dir) = dirs.project {
        for (path, _) in read_settings_files(project_dir, ConfigSource::Project) {
            let before = hooks.len();
            extract_hooks_from_settings(&path, ConfigSource::Project, ProviderKind::ClaudeCode, &mut hooks);
            record_source_if_items(sources, ProviderKind::ClaudeCode, "Project", &path, ConfigSource::Project, hooks.len() - before);
        }
    }

    hooks
}

fn extract_hooks_from_settings(
    settings_path: &Path,
    source: ConfigSource,
    provider: ProviderKind,
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
                    provider,
                    event_type: event_type.clone(),
                    matcher: matcher.clone(),
                    timeout,
                    description,
                    deprecated: false,
                    command: command.to_string(),
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

    // Line comments at the start of file.
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
// MCP Servers (REQ-2, REQ-3, REQ-5)
// ---------------------------------------------------------------------------

fn discover_mcp_servers(
    provider: ProviderKind,
    workspace_root: Option<&Path>,
    dirs: &ai_config_providers::ProviderDirs,
    // Reserved for future: custom-path MCP scanning not yet specified.
    _custom_paths: &[&CustomDiscoveryPath],
    sources: &mut Vec<DiscoverySource>,
) -> Vec<McpServerConfig> {
    match provider {
        ProviderKind::ClaudeCode => {
            discover_claude_mcp_servers(workspace_root, dirs, sources)
        }
        ProviderKind::OpenCode => discover_opencode_mcp_servers(workspace_root, dirs, sources),
        ProviderKind::Codex => discover_codex_mcp_servers(workspace_root, dirs, sources),
        ProviderKind::Cursor => discover_cursor_mcp_servers(workspace_root, dirs, sources),
    }
}

fn discover_claude_mcp_servers(
    workspace_root: Option<&Path>,
    dirs: &ai_config_providers::ProviderDirs,
    sources: &mut Vec<DiscoverySource>,
) -> Vec<McpServerConfig> {
    let mut servers = Vec::new();

    // settings.json + settings.local.json (user then project).
    if let Some(ref user_dir) = dirs.user {
        for (path, _) in read_settings_files(user_dir, ConfigSource::User) {
            let before = servers.len();
            extract_mcp_from_claude_settings(&path, ConfigSource::User, ProviderKind::ClaudeCode, &mut servers);
            record_source_if_items(sources, ProviderKind::ClaudeCode, "User", &path, ConfigSource::User, servers.len() - before);
        }
    }

    if let Some(ref project_dir) = dirs.project {
        for (path, _) in read_settings_files(project_dir, ConfigSource::Project) {
            let before = servers.len();
            extract_mcp_from_claude_settings(&path, ConfigSource::Project, ProviderKind::ClaudeCode, &mut servers);
            record_source_if_items(sources, ProviderKind::ClaudeCode, "Project", &path, ConfigSource::Project, servers.len() - before);
        }
    }

    // .mcp.json at workspace root (REQ-3).
    if let Some(root) = workspace_root {
        let mcp_json = root.join(".mcp.json");
        if mcp_json.is_file() {
            let before = servers.len();
            extract_mcp_from_mcp_json(&mcp_json, ConfigSource::Project, ProviderKind::ClaudeCode, &mut servers);
            record_source_if_items(sources, ProviderKind::ClaudeCode, "Project (.mcp.json)", &mcp_json, ConfigSource::Project, servers.len() - before);
        }
    }

    servers
}

fn extract_mcp_from_claude_settings(
    settings_path: &Path,
    source: ConfigSource,
    provider: ProviderKind,
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

    // mcpServers object.
    if let Some(mcp_object) = json.get("mcpServers").and_then(|m| m.as_object()) {
        for (name, config) in mcp_object {
            servers.push(build_mcp_server_from_json(name, config, source.clone(), provider, "claude-code"));
        }
    }

    // enabledPlugins as object {name: bool} (REQ-2).
    if let Some(plugins_obj) = json.get("enabledPlugins").and_then(|p| p.as_object()) {
        for (name, enabled_val) in plugins_obj {
            if enabled_val.as_bool() == Some(true) {
                servers.push(McpServerConfig {
                    name: name.clone(),
                    source: source.clone(),
                    provider,
                    provider_name: "cloud".to_string(),
                    transport_type: "cloud".to_string(),
                    enabled: true,
                    command: None,
                    url: None,
                    args: None,
                    env_var_names: None,
                    deprecated: false,
                });
            }
        }
    }
}

fn extract_mcp_from_mcp_json(
    mcp_path: &Path,
    source: ConfigSource,
    provider: ProviderKind,
    servers: &mut Vec<McpServerConfig>,
) {
    let content = match fs::read_to_string(mcp_path) {
        Ok(c) => c,
        Err(_) => return,
    };
    let json: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(_) => return,
    };
    // Schema: root key "mcpServers" → map of name → server config.
    if let Some(mcp_object) = json.get("mcpServers").and_then(|m| m.as_object()) {
        for (name, config) in mcp_object {
            servers.push(build_mcp_server_from_json(name, config, source.clone(), provider, "claude-code"));
        }
    }
}

fn build_mcp_server_from_json(
    name: &str,
    config: &serde_json::Value,
    source: ConfigSource,
    provider: ProviderKind,
    provider_name: &str,
) -> McpServerConfig {
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
    } else if config
        .get("transport")
        .and_then(|t| t.as_str())
        == Some("http")
    {
        "http".to_string()
    } else {
        "stdio".to_string()
    };

    let disabled = config
        .get("disabled")
        .and_then(|d| d.as_bool())
        .unwrap_or(false);

    McpServerConfig {
        name: name.to_string(),
        source,
        provider,
        provider_name: provider_name.to_string(),
        transport_type,
        enabled: !disabled,
        command,
        url,
        args,
        env_var_names,
        deprecated: false,
    }
}

fn discover_opencode_mcp_servers(
    workspace_root: Option<&Path>,
    dirs: &ai_config_providers::ProviderDirs,
    sources: &mut Vec<DiscoverySource>,
) -> Vec<McpServerConfig> {
    let mut servers = Vec::new();

    // User: ~/.config/opencode/opencode.json
    if let Some(ref user_dir) = dirs.user {
        for filename in &["opencode.json", "opencode.jsonc"] {
            let path = user_dir.join(filename);
            if path.is_file() {
                let before = servers.len();
                extract_mcp_from_opencode_config(&path, ConfigSource::User, &mut servers);
                record_source_if_items(sources, ProviderKind::OpenCode, "User", &path, ConfigSource::User, servers.len() - before);
            }
        }
    }

    // Project: opencode.json or opencode.jsonc at workspace root.
    if let Some(root) = workspace_root {
        for filename in &["opencode.json", "opencode.jsonc"] {
            let path = root.join(filename);
            if path.is_file() {
                let before = servers.len();
                extract_mcp_from_opencode_config(&path, ConfigSource::Project, &mut servers);
                record_source_if_items(sources, ProviderKind::OpenCode, "Project", &path, ConfigSource::Project, servers.len() - before);
            }
        }
    }

    servers
}

fn extract_mcp_from_opencode_config(
    config_path: &Path,
    source: ConfigSource,
    servers: &mut Vec<McpServerConfig>,
) {
    let content = match fs::read_to_string(config_path) {
        Ok(c) => c,
        Err(_) => return,
    };
    // Strip JSONC line comments before parsing (simple heuristic).
    let stripped = ai_config_mutations::strip_jsonc_comments(&content);
    let json: serde_json::Value = match serde_json::from_str(&stripped) {
        Ok(v) => v,
        Err(_) => return,
    };
    if let Some(mcp_obj) = json.get("mcp").and_then(|m| m.as_object()) {
        for (name, config) in mcp_obj {
            servers.push(build_mcp_server_from_json(name, config, source.clone(), ProviderKind::OpenCode, "opencode"));
        }
    }
}

fn discover_codex_mcp_servers(
    workspace_root: Option<&Path>,
    dirs: &ai_config_providers::ProviderDirs,
    sources: &mut Vec<DiscoverySource>,
) -> Vec<McpServerConfig> {
    let mut servers = Vec::new();

    // User: ~/.codex/config.toml
    if let Some(ref user_dir) = dirs.user {
        let config_path = user_dir.join("config.toml");
        if config_path.is_file() {
            let before = servers.len();
            extract_mcp_from_codex_toml(&config_path, ConfigSource::User, &mut servers);
            record_source_if_items(sources, ProviderKind::Codex, "User", &config_path, ConfigSource::User, servers.len() - before);
        }
    }

    // Project: <workspace>/.codex/config.toml
    if let Some(root) = workspace_root {
        let config_path = root.join(".codex").join("config.toml");
        if config_path.is_file() {
            let before = servers.len();
            extract_mcp_from_codex_toml(&config_path, ConfigSource::Project, &mut servers);
            record_source_if_items(sources, ProviderKind::Codex, "Project", &config_path, ConfigSource::Project, servers.len() - before);
        }
    }

    servers
}

fn extract_mcp_from_codex_toml(
    config_path: &Path,
    source: ConfigSource,
    servers: &mut Vec<McpServerConfig>,
) {
    let content = match fs::read_to_string(config_path) {
        Ok(c) => c,
        Err(_) => return,
    };
    let toml_value: toml::Value = match toml::from_str(&content) {
        Ok(v) => v,
        Err(_) => return,
    };
    let mcp_table = match toml_value.get("mcp_servers").and_then(|v| v.as_table()) {
        Some(t) => t,
        None => return,
    };
    for (name, config) in mcp_table {
        let command = config
            .get("command")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let url = config
            .get("url")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let transport_str = config
            .get("transport")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let transport_type = if transport_str == "http" {
            "http".to_string()
        } else if url.is_some() {
            "sse".to_string()
        } else {
            "stdio".to_string()
        };
        let args = config
            .get("args")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect());
        let env_var_names = config
            .get("env")
            .and_then(|v| v.as_table())
            .map(|t| t.keys().cloned().collect());

        servers.push(McpServerConfig {
            name: name.clone(),
            source: source.clone(),
            provider: ProviderKind::Codex,
            provider_name: "codex".to_string(),
            transport_type,
            enabled: true,
            command,
            url,
            args,
            env_var_names,
            deprecated: false,
        });
    }
}

fn discover_cursor_mcp_servers(
    workspace_root: Option<&Path>,
    dirs: &ai_config_providers::ProviderDirs,
    sources: &mut Vec<DiscoverySource>,
) -> Vec<McpServerConfig> {
    let mut servers = Vec::new();

    // User: ~/.cursor/mcp.json
    if let Some(ref user_dir) = dirs.user {
        let path = user_dir.join("mcp.json");
        if path.is_file() {
            let before = servers.len();
            extract_mcp_from_mcp_json_cursor(&path, ConfigSource::User, &mut servers);
            record_source_if_items(sources, ProviderKind::Cursor, "User", &path, ConfigSource::User, servers.len() - before);
        }
    }

    // Project: <workspace>/.cursor/mcp.json
    if let Some(root) = workspace_root {
        let path = root.join(".cursor").join("mcp.json");
        if path.is_file() {
            let before = servers.len();
            extract_mcp_from_mcp_json_cursor(&path, ConfigSource::Project, &mut servers);
            record_source_if_items(sources, ProviderKind::Cursor, "Project", &path, ConfigSource::Project, servers.len() - before);
        }
    }

    servers
}

fn extract_mcp_from_mcp_json_cursor(
    mcp_path: &Path,
    source: ConfigSource,
    servers: &mut Vec<McpServerConfig>,
) {
    let content = match fs::read_to_string(mcp_path) {
        Ok(c) => c,
        Err(_) => return,
    };
    let json: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(_) => return,
    };
    if let Some(mcp_object) = json.get("mcpServers").and_then(|m| m.as_object()) {
        for (name, config) in mcp_object {
            servers.push(build_mcp_server_from_json(name, config, source.clone(), ProviderKind::Cursor, "cursor"));
        }
    }
}

// ---------------------------------------------------------------------------
// Rules (REQ-4, REQ-19, REQ-20)
// ---------------------------------------------------------------------------

fn discover_rules(
    provider: ProviderKind,
    dirs: &ai_config_providers::ProviderDirs,
    custom_paths: &[&CustomDiscoveryPath],
    sources: &mut Vec<DiscoverySource>,
) -> Vec<RuleConfig> {
    let mut rules = Vec::new();

    match provider {
        ProviderKind::ClaudeCode => {
            let extension = "md";
            scan_rules_dirs(provider, dirs, custom_paths, extension, sources, &mut rules);
        }
        ProviderKind::OpenCode => {
            let extension = "md";
            scan_rules_dirs(provider, dirs, custom_paths, extension, sources, &mut rules);
        }
        ProviderKind::Cursor => {
            let extension = "mdc";
            scan_rules_dirs(provider, dirs, custom_paths, extension, sources, &mut rules);
        }
        ProviderKind::Codex => {
            // Codex has no rules concept.
        }
    }

    rules
}

fn scan_rules_dirs(
    provider: ProviderKind,
    dirs: &ai_config_providers::ProviderDirs,
    custom_paths: &[&CustomDiscoveryPath],
    extension: &str,
    sources: &mut Vec<DiscoverySource>,
    rules: &mut Vec<RuleConfig>,
) {
    if let Some(ref user_dir) = dirs.user {
        let rules_dir = user_dir.join("rules");
        if rules_dir.is_dir() {
            let before = rules.len();
            scan_rules_directory(&rules_dir, ConfigSource::User, provider, extension, rules);
            record_source_if_items(sources, provider, "User", &rules_dir, ConfigSource::User, rules.len() - before);
        }
    }

    if let Some(ref project_dir) = dirs.project {
        let rules_dir = project_dir.join("rules");
        if rules_dir.is_dir() {
            let before = rules.len();
            scan_rules_directory(&rules_dir, ConfigSource::Project, provider, extension, rules);
            record_source_if_items(sources, provider, "Project", &rules_dir, ConfigSource::Project, rules.len() - before);
        }
    }

    for custom in custom_paths {
        let rules_dir = Path::new(&custom.path).join("rules");
        if rules_dir.is_dir() {
            let before = rules.len();
            scan_rules_directory(&rules_dir, ConfigSource::Custom, provider, extension, rules);
            record_source_if_items(sources, provider, &custom.label, &rules_dir, ConfigSource::Custom, rules.len() - before);
        }
    }
}

fn scan_rules_directory(
    directory: &Path,
    source: ConfigSource,
    provider: ProviderKind,
    extension: &str,
    rules: &mut Vec<RuleConfig>,
) {
    let entries = match fs::read_dir(directory) {
        Ok(entries) => entries,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().is_some_and(|ext| ext == extension) {
            if let Some(rule) = parse_rule_file(&path, &source, provider) {
                rules.push(rule);
            }
        }
    }
}

fn parse_rule_file(
    path: &Path,
    source: &ConfigSource,
    provider: ProviderKind,
) -> Option<RuleConfig> {
    let content = fs::read_to_string(path).ok()?;
    let (frontmatter, body) = parse_frontmatter(&content);
    let filename = path.file_name()?.to_string_lossy().to_string();
    let deprecated = is_deprecated(path, frontmatter.as_ref());

    // Language from filename stem (e.g. "typescript.md" → "typescript").
    let language = infer_language_from_filename(path);

    let (description, always_apply, globs) = if let Some(ref fm) = frontmatter {
        (
            yaml_string(fm, "description"),
            yaml_bool(fm, "alwaysApply"),
            yaml_string_list(fm, "globs"),
        )
    } else {
        (None, None, None)
    };

    // Fallback description from first non-empty content line.
    let description = description.or_else(|| first_content_line(&body));

    Some(RuleConfig {
        filename,
        file_path: path.to_string_lossy().to_string(),
        source: source.clone(),
        provider,
        language,
        description,
        always_apply,
        globs,
        content: body,
        deprecated,
    })
}

/// Infer a programming language from the rule filename stem.
/// Returns `Some("typescript")` for `typescript.md`, etc.
/// Returns `None` if the stem doesn't match a known language or looks like a
/// general rule name (e.g. "style-guide", "general").
fn infer_language_from_filename(path: &Path) -> Option<String> {
    let stem = path.file_stem()?.to_string_lossy().to_lowercase();
    // Known language identifiers — extend as needed.
    const KNOWN_LANGUAGES: &[&str] = &[
        "rust", "typescript", "javascript", "python", "go", "java", "kotlin",
        "swift", "cpp", "c", "csharp", "ruby", "php", "scala", "haskell",
        "elixir", "clojure", "lua", "dart", "sql", "html", "css", "svelte",
        "vue", "react", "jsx", "tsx",
    ];
    if KNOWN_LANGUAGES.contains(&stem.as_str()) {
        Some(stem.to_string())
    } else {
        None
    }
}

// ---------------------------------------------------------------------------
// Memories
// ---------------------------------------------------------------------------

fn discover_memories(
    provider: ProviderKind,
    dirs: &ai_config_providers::ProviderDirs,
    sources: &mut Vec<DiscoverySource>,
) -> Vec<MemoryConfig> {
    match provider {
        ProviderKind::ClaudeCode => discover_claude_memories(dirs, sources),
        ProviderKind::Codex => {
            // TODO: Codex memory scanning (e.g. ~/.codex/projects/*/memory/) can be
            // added as a follow-up. Directories don't exist on most installs yet.
            Vec::new()
        }
        ProviderKind::OpenCode | ProviderKind::Cursor => Vec::new(),
    }
}

fn discover_claude_memories(
    dirs: &ai_config_providers::ProviderDirs,
    sources: &mut Vec<DiscoverySource>,
) -> Vec<MemoryConfig> {
    let mut memories = Vec::new();

    let user_dir = match dirs.user {
        Some(ref d) => d,
        None => return memories,
    };

    let projects_dir = user_dir.join("projects");
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
            let before = memories.len();
            scan_memory_directory(&memory_dir, ConfigSource::User, &mut memories);
            record_source_if_items(sources, ProviderKind::ClaudeCode, "User", &memory_dir, ConfigSource::User, memories.len() - before);
        }
    }

    memories
}

fn scan_memory_directory(directory: &Path, source: ConfigSource, memories: &mut Vec<MemoryConfig>) {
    let entries = match fs::read_dir(directory) {
        Ok(entries) => entries,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().is_none_or(|ext| ext != "md") {
            continue;
        }
        if path.file_name().is_some_and(|f| f == "MEMORY.md") {
            continue;
        }

        if let Some(memory) = parse_memory_file(&path, source.clone()) {
            memories.push(memory);
        }
    }
}

fn parse_memory_file(path: &Path, source: ConfigSource) -> Option<MemoryConfig> {
    let content = fs::read_to_string(path).ok()?;
    let (frontmatter, body) = parse_frontmatter(&content);

    let fallback_name = path.file_stem()?.to_string_lossy().to_string();
    let deprecated = is_deprecated(path, frontmatter.as_ref());

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
        source,
        provider: ProviderKind::ClaudeCode,
        memory_type,
        content: body,
        deprecated,
    })
}

// ---------------------------------------------------------------------------
// Instructions
// ---------------------------------------------------------------------------

fn discover_instructions(
    provider: ProviderKind,
    workspace_root: Option<&str>,
    dirs: &ai_config_providers::ProviderDirs,
    _custom_paths: &[&CustomDiscoveryPath],
    sources: &mut Vec<DiscoverySource>,
) -> Vec<InstructionConfig> {
    let mut instructions = Vec::new();
    let filenames = instruction_filenames(provider);

    if let Some(ref user_dir) = dirs.user {
        for filename in filenames {
            let path = user_dir.join(filename);
            if path.is_file() {
                if let Some(config) = parse_instruction_file(&path, ConfigSource::User, provider) {
                    let before_len = instructions.len();
                    instructions.push(config);
                    record_source_if_items(sources, provider, "User", user_dir, ConfigSource::User, instructions.len() - before_len);
                }
            }
        }
    }

    if let Some(ref project_dir) = dirs.project {
        for filename in filenames {
            let path = project_dir.join(filename);
            if path.is_file() {
                if let Some(config) = parse_instruction_file(&path, ConfigSource::Project, provider) {
                    let before_len = instructions.len();
                    instructions.push(config);
                    record_source_if_items(sources, provider, "Project", project_dir, ConfigSource::Project, instructions.len() - before_len);
                }
            }
        }
    }

    // Also check workspace root directly for instruction files.
    if let Some(root) = workspace_root {
        let root_path = Path::new(root);
        for filename in filenames {
            let path = root_path.join(filename);
            if path.is_file() {
                let canonical = path.to_string_lossy().to_string();
                if !instructions.iter().any(|i| i.file_path == canonical) {
                    if let Some(config) = parse_instruction_file(&path, ConfigSource::Project, provider) {
                        let before_len = instructions.len();
                        instructions.push(config);
                        record_source_if_items(sources, provider, "Project (root)", root_path, ConfigSource::Project, instructions.len() - before_len);
                    }
                }
            }
        }
    }

    instructions
}

fn instruction_filenames(provider: ProviderKind) -> &'static [&'static str] {
    match provider {
        ProviderKind::ClaudeCode => &["CLAUDE.md", "AGENTS.md"],
        ProviderKind::OpenCode => &["AGENTS.md", "OPENCODE.md"],
        ProviderKind::Codex => &["AGENTS.md", "CODEX.md"],
        ProviderKind::Cursor => &["AGENTS.md", ".cursorrules"],
    }
}

fn parse_instruction_file(
    path: &Path,
    source: ConfigSource,
    provider: ProviderKind,
) -> Option<InstructionConfig> {
    let content = fs::read_to_string(path).ok()?;
    let metadata = fs::metadata(path).ok()?;
    let base_dir = path.parent()?;

    let resolved_content = resolve_includes(&content, base_dir);
    let deprecated = is_deprecated_path(path);

    let last_modified = metadata.modified().ok().map(|time| {
        let datetime: chrono::DateTime<chrono::Utc> = time.into();
        datetime.to_rfc3339()
    });

    Some(InstructionConfig {
        filename: path.file_name()?.to_string_lossy().to_string(),
        file_path: path.to_string_lossy().to_string(),
        source,
        provider,
        content: resolved_content,
        file_size: metadata.len(),
        last_modified,
        deprecated,
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
// DB helpers
// ---------------------------------------------------------------------------

fn load_custom_paths(state: &State<DatabaseState>) -> Result<Vec<CustomDiscoveryPath>, String> {
    let connection = state.read()?;
    let mut statement = connection
        .prepare("SELECT value FROM user_settings WHERE key = ?1")
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
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::TempDir;

    // -----------------------------------------------------------------------
    // Frontmatter
    // -----------------------------------------------------------------------

    #[test]
    fn parse_frontmatter_with_valid_yaml() {
        let content = "---\nname: test-skill\ndescription: A test\n---\n\nBody content here.\n";
        let (frontmatter, body) = parse_frontmatter(content);

        assert!(frontmatter.is_some());
        let frontmatter = frontmatter.unwrap();
        assert_eq!(yaml_string(&frontmatter, "name").unwrap(), "test-skill");
        assert_eq!(yaml_string(&frontmatter, "description").unwrap(), "A test");
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
        assert_eq!(yaml_string(&frontmatter.unwrap(), "name").unwrap(), "test");
        assert!(body.contains("Body."));
    }

    #[test]
    fn parse_frontmatter_with_malformed_yaml_returns_none() {
        let content = "---\n: invalid: yaml:\n---\n\nBody.\n";
        let (frontmatter, _body) = parse_frontmatter(content);
        assert!(frontmatter.is_none());
    }

    // -----------------------------------------------------------------------
    // Script description extraction
    // -----------------------------------------------------------------------

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

    // -----------------------------------------------------------------------
    // Skills (REQ-1)
    // -----------------------------------------------------------------------

    #[test]
    fn discover_skills_from_temp_directory() {
        let temp_dir = TempDir::new().unwrap();
        // Use skills/ (primary) dir.
        let skills_dir = temp_dir.path().join("skills");
        fs::create_dir(&skills_dir).unwrap();

        let skill_dir = skills_dir.join("my-skill");
        fs::create_dir(&skill_dir).unwrap();
        let mut file = fs::File::create(skill_dir.join("SKILL.md")).unwrap();
        writeln!(
            file,
            "---\nname: my-skill\ndescription: A test skill\n---\n\n# My Skill\n\nDoes things."
        )
        .unwrap();

        let mut direct_file = fs::File::create(skills_dir.join("quick.md")).unwrap();
        writeln!(direct_file, "# Quick command\n\nNo frontmatter.").unwrap();

        let dirs = ai_config_providers::ProviderDirs {
            user: Some(temp_dir.path().to_path_buf()),
            project: None,
            compat_project: vec![],
        };
        let mut sources = Vec::new();
        let skills = discover_skills(
            ProviderKind::ClaudeCode,
            None,
            &dirs,
            &[],
            &mut sources,
        );
        assert_eq!(skills.len(), 2);

        let named_skill = skills.iter().find(|s| s.name == "my-skill").unwrap();
        assert_eq!(named_skill.description.as_deref(), Some("A test skill"));
        assert!(matches!(named_skill.source, ConfigSource::User));
        assert!(!named_skill.deprecated);

        let quick_skill = skills.iter().find(|s| s.name == "quick").unwrap();
        assert!(quick_skill.description.is_none());
        assert!(quick_skill.skill_override.is_none());
    }

    #[test]
    fn discover_skills_scans_skills_directory_not_just_commands() {
        let temp_dir = TempDir::new().unwrap();

        // Create skills/ directory (primary — REQ-1).
        let skills_dir = temp_dir.path().join("skills");
        fs::create_dir(&skills_dir).unwrap();
        let mut skill_file = fs::File::create(skills_dir.join("new-style.md")).unwrap();
        writeln!(skill_file, "---\nname: new-style\n---\n\nNew style skill.").unwrap();

        // Create commands/ directory (legacy fallback — REQ-1).
        let commands_dir = temp_dir.path().join("commands");
        fs::create_dir(&commands_dir).unwrap();
        let mut cmd_file = fs::File::create(commands_dir.join("legacy.md")).unwrap();
        writeln!(cmd_file, "# Legacy command").unwrap();

        let dirs = ai_config_providers::ProviderDirs {
            user: Some(temp_dir.path().to_path_buf()),
            project: None,
            compat_project: vec![],
        };
        let mut sources = Vec::new();
        let skills = discover_skills(
            ProviderKind::ClaudeCode,
            None,
            &dirs,
            &[],
            &mut sources,
        );

        // Both skills/ and commands/ should be scanned.
        assert_eq!(skills.len(), 2);
        assert!(skills.iter().any(|s| s.name == "new-style"));
        assert!(skills.iter().any(|s| s.name == "legacy"));
    }

    // -----------------------------------------------------------------------
    // Agents
    // -----------------------------------------------------------------------

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

        let dirs = ai_config_providers::ProviderDirs {
            user: Some(temp_dir.path().to_path_buf()),
            project: None,
            compat_project: vec![],
        };
        let mut sources = Vec::new();
        let agents = discover_agents(ProviderKind::ClaudeCode, &dirs, &[], &mut sources);
        assert_eq!(agents.len(), 1);
        assert_eq!(agents[0].name, "my-agent");
        assert_eq!(agents[0].model.as_deref(), Some("sonnet"));
        assert_eq!(agents[0].tools.as_ref().unwrap().len(), 2);
        assert!(!agents[0].deprecated);
    }

    // -----------------------------------------------------------------------
    // Memories
    // -----------------------------------------------------------------------

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

        let dirs = ai_config_providers::ProviderDirs {
            user: Some(temp_dir.path().to_path_buf()),
            project: None,
            compat_project: vec![],
        };
        let mut sources = Vec::new();
        let memories = discover_memories(ProviderKind::ClaudeCode, &dirs, &mut sources);
        assert_eq!(memories.len(), 1);
        assert_eq!(memories[0].name, "test memory");
        assert_eq!(memories[0].memory_type.as_deref(), Some("feedback"));
        assert!(!memories[0].deprecated);
    }

    // -----------------------------------------------------------------------
    // Instructions
    // -----------------------------------------------------------------------

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

    // -----------------------------------------------------------------------
    // Hooks (REQ-5)
    // -----------------------------------------------------------------------

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
        extract_hooks_from_settings(
            &settings_path,
            ConfigSource::User,
            ProviderKind::ClaudeCode,
            &mut hooks,
        );

        assert_eq!(hooks.len(), 1);
        assert_eq!(hooks[0].event_type, "PreToolUse");
        assert_eq!(hooks[0].matcher.as_deref(), Some("Bash"));
        assert!(!hooks[0].deprecated);
    }

    #[test]
    fn settings_local_json_hooks_visible() {
        let temp_dir = TempDir::new().unwrap();

        // Write hooks into settings.local.json only.
        let local_settings = serde_json::json!({
            "hooks": {
                "PostToolUse": [
                    {
                        "matcher": "Write",
                        "hooks": [
                            {
                                "type": "command",
                                "command": "node post-write.js"
                            }
                        ]
                    }
                ]
            }
        });
        let local_path = temp_dir.path().join("settings.local.json");
        fs::write(&local_path, local_settings.to_string()).unwrap();

        // No settings.json — only local.
        let dirs = ai_config_providers::ProviderDirs {
            user: Some(temp_dir.path().to_path_buf()),
            project: None,
            compat_project: vec![],
        };
        let mut sources = Vec::new();
        let hooks = discover_hooks(ProviderKind::ClaudeCode, &dirs, &mut sources);

        assert_eq!(hooks.len(), 1);
        assert_eq!(hooks[0].event_type, "PostToolUse");
        assert_eq!(hooks[0].matcher.as_deref(), Some("Write"));
    }

    // -----------------------------------------------------------------------
    // MCP Servers (REQ-2, REQ-3)
    // -----------------------------------------------------------------------

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
            "enabledPlugins": { "plugin-a": true, "plugin-b": true }
        });

        let settings_path = temp_dir.path().join("settings.json");
        fs::write(&settings_path, settings.to_string()).unwrap();

        let mut servers = Vec::new();
        extract_mcp_from_claude_settings(
            &settings_path,
            ConfigSource::User,
            ProviderKind::ClaudeCode,
            &mut servers,
        );

        assert_eq!(servers.len(), 3);

        let stdio_server = servers.iter().find(|s| s.name == "my-server").unwrap();
        assert_eq!(stdio_server.transport_type, "stdio");
        assert!(stdio_server.enabled);
        assert_eq!(stdio_server.command.as_deref(), Some("node"));
        assert_eq!(
            stdio_server.env_var_names.as_ref().unwrap(),
            &["API_KEY".to_string()]
        );

        let cloud_servers: Vec<_> = servers
            .iter()
            .filter(|s| s.transport_type == "cloud")
            .collect();
        assert_eq!(cloud_servers.len(), 2);
    }

    #[test]
    fn mcp_enabled_plugins_parsed_as_object() {
        // REQ-2: enabledPlugins is object {name: bool}, not array.
        let temp_dir = TempDir::new().unwrap();
        let settings = serde_json::json!({
            "enabledPlugins": {
                "enabled-plugin": true,
                "disabled-plugin": false,
                "another-enabled": true
            }
        });
        let path = temp_dir.path().join("settings.json");
        fs::write(&path, settings.to_string()).unwrap();

        let mut servers = Vec::new();
        extract_mcp_from_claude_settings(&path, ConfigSource::User, ProviderKind::ClaudeCode, &mut servers);

        // Only entries with value == true should appear.
        assert_eq!(servers.len(), 2);
        assert!(servers.iter().any(|s| s.name == "enabled-plugin"));
        assert!(servers.iter().any(|s| s.name == "another-enabled"));
        assert!(!servers.iter().any(|s| s.name == "disabled-plugin"));
    }

    #[test]
    fn mcp_extracted_from_mcp_json_file() {
        // REQ-3: .mcp.json at workspace root.
        let temp_dir = TempDir::new().unwrap();
        let mcp_json = serde_json::json!({
            "mcpServers": {
                "workspace-server": {
                    "command": "python",
                    "args": ["-m", "mcp_server"]
                }
            }
        });
        let mcp_path = temp_dir.path().join(".mcp.json");
        fs::write(&mcp_path, mcp_json.to_string()).unwrap();

        let mut servers = Vec::new();
        extract_mcp_from_mcp_json(
            &mcp_path,
            ConfigSource::Project,
            ProviderKind::ClaudeCode,
            &mut servers,
        );

        assert_eq!(servers.len(), 1);
        assert_eq!(servers[0].name, "workspace-server");
        assert_eq!(servers[0].transport_type, "stdio");
        assert!(matches!(servers[0].source, ConfigSource::Project));
    }

    // -----------------------------------------------------------------------
    // Rules (REQ-4, REQ-19, REQ-20)
    // -----------------------------------------------------------------------

    #[test]
    fn discover_rules_finds_claude_rules_with_language() {
        let temp_dir = TempDir::new().unwrap();
        let rules_dir = temp_dir.path().join("rules");
        fs::create_dir(&rules_dir).unwrap();

        // A rule named after a language — should get language set.
        let mut ts_rule = fs::File::create(rules_dir.join("typescript.md")).unwrap();
        writeln!(ts_rule, "# TypeScript rules\n\nUse strict mode.").unwrap();

        // A general rule — no language.
        let mut general_rule = fs::File::create(rules_dir.join("style-guide.md")).unwrap();
        writeln!(
            general_rule,
            "---\ndescription: General style guide\n---\n\nContent."
        )
        .unwrap();

        let dirs = ai_config_providers::ProviderDirs {
            user: Some(temp_dir.path().to_path_buf()),
            project: None,
            compat_project: vec![],
        };
        let mut sources = Vec::new();
        let rules = discover_rules(ProviderKind::ClaudeCode, &dirs, &[], &mut sources);

        assert_eq!(rules.len(), 2);

        let ts = rules.iter().find(|r| r.filename == "typescript.md").unwrap();
        assert_eq!(ts.language.as_deref(), Some("typescript"));

        let guide = rules.iter().find(|r| r.filename == "style-guide.md").unwrap();
        assert!(guide.language.is_none());
        assert_eq!(guide.description.as_deref(), Some("General style guide"));
    }

    #[test]
    fn discover_rules_parses_cursor_mdc_frontmatter() {
        // REQ-19, REQ-20: Cursor .mdc rules with YAML frontmatter.
        let temp_dir = TempDir::new().unwrap();
        let rules_dir = temp_dir.path().join("rules");
        fs::create_dir(&rules_dir).unwrap();

        let mut mdc_file = fs::File::create(rules_dir.join("always-on.mdc")).unwrap();
        writeln!(
            mdc_file,
            "---\nalwaysApply: true\nglobs:\n  - \"**/*.ts\"\n  - \"**/*.tsx\"\ndescription: Always apply TS rules\n---\n\nContent here."
        )
        .unwrap();

        let dirs = ai_config_providers::ProviderDirs {
            user: Some(temp_dir.path().to_path_buf()),
            project: None,
            compat_project: vec![],
        };
        let mut sources = Vec::new();
        let rules = discover_rules(ProviderKind::Cursor, &dirs, &[], &mut sources);

        assert_eq!(rules.len(), 1);
        let rule = &rules[0];
        assert_eq!(rule.filename, "always-on.mdc");
        assert_eq!(rule.always_apply, Some(true));
        assert_eq!(
            rule.globs.as_ref().unwrap(),
            &["**/*.ts".to_string(), "**/*.tsx".to_string()]
        );
        assert_eq!(rule.description.as_deref(), Some("Always apply TS rules"));
    }

    // -----------------------------------------------------------------------
    // Deprecated detection (REQ-32)
    // -----------------------------------------------------------------------

    #[test]
    fn deprecated_skill_detected_by_filename() {
        let temp_dir = TempDir::new().unwrap();
        let skills_dir = temp_dir.path().join("skills");
        fs::create_dir(&skills_dir).unwrap();

        let mut file = fs::File::create(skills_dir.join("old-thing.deprecated.md")).unwrap();
        writeln!(file, "# Old skill").unwrap();

        let dirs = ai_config_providers::ProviderDirs {
            user: Some(temp_dir.path().to_path_buf()),
            project: None,
            compat_project: vec![],
        };
        let mut sources = Vec::new();
        let skills = discover_skills(ProviderKind::ClaudeCode, None, &dirs, &[], &mut sources);

        assert_eq!(skills.len(), 1);
        assert!(skills[0].deprecated);
    }

    #[test]
    fn deprecated_skill_detected_by_frontmatter() {
        let temp_dir = TempDir::new().unwrap();
        let skills_dir = temp_dir.path().join("skills");
        fs::create_dir(&skills_dir).unwrap();

        let mut file = fs::File::create(skills_dir.join("old-skill.md")).unwrap();
        writeln!(file, "---\nname: old-skill\ndeprecated: true\n---\n\nContent.").unwrap();

        let dirs = ai_config_providers::ProviderDirs {
            user: Some(temp_dir.path().to_path_buf()),
            project: None,
            compat_project: vec![],
        };
        let mut sources = Vec::new();
        let skills = discover_skills(ProviderKind::ClaudeCode, None, &dirs, &[], &mut sources);

        assert_eq!(skills.len(), 1);
        assert!(skills[0].deprecated);
    }

    // -----------------------------------------------------------------------
    // Skill overrides (REQ-48..51)
    // -----------------------------------------------------------------------

    #[test]
    fn skill_override_from_settings_local() {
        let temp_dir = TempDir::new().unwrap();
        let skills_dir = temp_dir.path().join("skills");
        fs::create_dir(&skills_dir).unwrap();

        let mut skill_file = fs::File::create(skills_dir.join("my-skill.md")).unwrap();
        writeln!(skill_file, "# My skill").unwrap();

        // Write settings.local.json with skillOverrides.
        let local_settings = serde_json::json!({
            "skillOverrides": {
                "my-skill": "name-only"
            }
        });
        fs::write(
            temp_dir.path().join("settings.local.json"),
            local_settings.to_string(),
        )
        .unwrap();

        let dirs = ai_config_providers::ProviderDirs {
            user: Some(temp_dir.path().to_path_buf()),
            project: None,
            compat_project: vec![],
        };
        let mut sources = Vec::new();
        let skills = discover_skills(
            ProviderKind::ClaudeCode,
            None,
            &dirs,
            &[],
            &mut sources,
        );

        assert_eq!(skills.len(), 1);
        assert_eq!(skills[0].skill_override.as_deref(), Some("name-only"));
    }

    // -----------------------------------------------------------------------
    // Source recording
    // -----------------------------------------------------------------------

    #[test]
    fn sources_recorded_when_items_found() {
        let temp_dir = TempDir::new().unwrap();
        let skills_dir = temp_dir.path().join("skills");
        fs::create_dir(&skills_dir).unwrap();
        let mut f = fs::File::create(skills_dir.join("a.md")).unwrap();
        writeln!(f, "# Skill A").unwrap();

        let dirs = ai_config_providers::ProviderDirs {
            user: Some(temp_dir.path().to_path_buf()),
            project: None,
            compat_project: vec![],
        };
        let mut sources = Vec::new();
        let skills = discover_skills(ProviderKind::ClaudeCode, None, &dirs, &[], &mut sources);

        assert_eq!(skills.len(), 1);
        assert!(!sources.is_empty());
        assert!(sources.iter().any(|s| matches!(s.source_type, ConfigSource::User)));
    }

    #[test]
    fn sources_not_recorded_when_directory_empty() {
        let temp_dir = TempDir::new().unwrap();
        // Create the skills dir but put nothing in it.
        fs::create_dir(temp_dir.path().join("skills")).unwrap();

        let dirs = ai_config_providers::ProviderDirs {
            user: Some(temp_dir.path().to_path_buf()),
            project: None,
            compat_project: vec![],
        };
        let mut sources = Vec::new();
        let skills = discover_skills(ProviderKind::ClaudeCode, None, &dirs, &[], &mut sources);

        assert!(skills.is_empty());
        assert!(sources.is_empty());
    }
}
