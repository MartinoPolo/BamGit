use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};
use ts_rs::TS;
use tokio::io::{AsyncBufReadExt, AsyncRead, BufReader};
use tokio::process::Command;
use tauri::async_runtime::JoinHandle;

use crate::database::connection::DatabaseState;
use super::shared::validate_hex_color;

// ─── Types ─────────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct SetupWorktreeRequest {
    pub issue_id: String,
    pub branch_name: String,
    pub color: Option<String>,
    /// Dashboard's local_folder — the main repo root where setup-worktree.sh runs
    pub working_directory: String,
    /// Base branch to record (e.g. "dev")
    pub base_branch: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RemoveWorktreeRequest {
    pub issue_id: String,
    pub branch_name: String,
    /// Dashboard's local_folder — cwd for remove-worktree.sh
    pub working_directory: String,
}

#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct WorktreeProgressPayload {
    pub issue_id: String,
    pub source: String,
    pub line: String,
}

#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct WorktreeStateChangePayload {
    pub issue_id: String,
    pub old_state: String,
    pub new_state: String,
    pub worktree_folder: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct PrunableIssue {
    pub issue_id: String,
    pub name: String,
    pub branch_name: String,
    pub worktree_folder: Option<String>,
    pub pr_state: Option<String>,
    pub github_issue_state: Option<String>,
    pub branch_status: Option<String>,
}

// ─── Bash Detection ────────────────────────────────────────────────────────────

/// Find bash executable. On Windows, use Git Bash; on Unix, use system bash.
async fn detect_bash_path() -> Result<PathBuf, String> {
    if cfg!(windows) {
        // Try git --exec-path to find Git installation
        if let Ok(output) = tokio::process::Command::new("git")
            .args(["--exec-path"])
            .output()
            .await
        {
            if output.status.success() {
                let exec_path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                // exec-path is like C:/Program Files/Git/mingw64/libexec/git-core
                // bash is at C:/Program Files/Git/bin/bash.exe
                let git_root = Path::new(&exec_path)
                    .ancestors()
                    .find(|p| p.join("bin/bash.exe").exists());
                if let Some(root) = git_root {
                    return Ok(root.join("bin/bash.exe"));
                }
            }
        }

        // Common fallback paths
        let fallbacks = [
            r"C:\Program Files\Git\bin\bash.exe",
            r"C:\Program Files (x86)\Git\bin\bash.exe",
        ];
        for path in &fallbacks {
            if Path::new(path).exists() {
                return Ok(PathBuf::from(path));
            }
        }

        Err("ERR_GIT_BASH_NOT_FOUND".into())
    } else {
        Ok(PathBuf::from("/bin/bash"))
    }
}

/// Resolve the mpx-claude-code scripts directory from environment or relative path.
fn resolve_scripts_directory() -> Result<PathBuf, String> {
    // Check environment variable first
    if let Ok(scripts_dir) = std::env::var("MPX_SCRIPTS_DIR") {
        let path = PathBuf::from(&scripts_dir);
        if path.exists() {
            return Ok(path);
        }
    }

    // Fallback: try relative to home directory
    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Some(home) = dirs::home_dir() {
        candidates.push(home.join(".claude/scripts"));
    }

    // Dev-only fallback for local development
    #[cfg(debug_assertions)]
    candidates.push(PathBuf::from("C:/_MP_projects/mpx-claude-code/scripts"));

    for candidate in &candidates {
        if candidate.join("setup-worktree.sh").exists() {
            return Ok(candidate.clone());
        }
    }

    Err("ERR_SCRIPTS_NOT_FOUND".into())
}

// ─── DB Helpers ────────────────────────────────────────────────────────────────

fn get_worktree_state(
    connection: &rusqlite::Connection,
    issue_id: &str,
) -> Result<String, String> {
    connection
        .query_row(
            "SELECT worktree_state FROM issues WHERE id = ?1",
            [issue_id],
            |row| row.get::<_, String>(0),
        )
        .map_err(|_| "ERR_ISSUE_NOT_FOUND".to_string())
}

fn update_worktree_state(
    connection: &rusqlite::Connection,
    issue_id: &str,
    new_state: &str,
) -> Result<(), String> {
    connection
        .execute(
            "UPDATE issues SET worktree_state = ?1 WHERE id = ?2",
            rusqlite::params![new_state, issue_id],
        )
        .map_err(|error| format!("Failed to update worktree state: {error}"))?;
    Ok(())
}

fn update_worktree_fields(
    connection: &rusqlite::Connection,
    issue_id: &str,
    worktree_state: &str,
    worktree_folder: Option<&str>,
    branch_name: Option<&str>,
    base_branch: Option<&str>,
) -> Result<(), String> {
    connection
        .execute(
            "UPDATE issues SET worktree_state = ?1, worktree_folder = ?2, \
             branch_name = ?3, base_branch = ?4 WHERE id = ?5",
            rusqlite::params![worktree_state, worktree_folder, branch_name, base_branch, issue_id],
        )
        .map_err(|error| format!("Failed to update worktree fields: {error}"))?;
    Ok(())
}

// ─── Event Helpers ─────────────────────────────────────────────────────────────

fn emit_state_change(
    app_handle: &AppHandle,
    issue_id: &str,
    old_state: &str,
    new_state: &str,
    worktree_folder: Option<&str>,
) {
    let _ = app_handle.emit(
        "worktree-state-change",
        WorktreeStateChangePayload {
            issue_id: issue_id.to_string(),
            old_state: old_state.to_string(),
            new_state: new_state.to_string(),
            worktree_folder: worktree_folder.map(String::from),
        },
    );
}

fn emit_progress(app_handle: &AppHandle, issue_id: &str, source: &str, line: &str) {
    let _ = app_handle.emit(
        "worktree-progress",
        WorktreeProgressPayload {
            issue_id: issue_id.to_string(),
            source: source.to_string(),
            line: line.to_string(),
        },
    );
}

/// Spawn a tokio task that reads lines from `reader` and emits progress events.
fn stream_output(
    reader: impl AsyncRead + Send + Unpin + 'static,
    app_handle: AppHandle,
    issue_id: String,
    source: &'static str,
) -> JoinHandle<()> {
    tauri::async_runtime::spawn(async move {
        let mut lines = BufReader::new(reader).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            emit_progress(&app_handle, &issue_id, source, &line);
        }
    })
}

// ─── Validation ───────────────────────────────────────────────────────────────

fn validate_path_exists(path: &str, label: &str) -> Result<std::path::PathBuf, String> {
    std::fs::canonicalize(path)
        .map_err(|e| format!("{label} path is invalid or does not exist: {e}"))
}

fn validate_branch_name(name: &str) -> Result<(), String> {
    if name.is_empty() || name.len() > 100 {
        return Err("Branch name must be 1-100 characters".to_string());
    }
    let valid = name
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '/' | '_' | '.' | '-'));
    if !valid {
        return Err(format!("Branch name contains invalid characters: {name}"));
    }
    if name.starts_with('-') || name.starts_with('.') || name.ends_with('.') || name.ends_with('/')
    {
        return Err(format!("Branch name has invalid prefix/suffix: {name}"));
    }
    if name.contains("..") || name.contains("//") {
        return Err(format!("Branch name contains invalid sequence: {name}"));
    }
    Ok(())
}

// ─── Commands ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn setup_worktree(
    state: State<'_, DatabaseState>,
    app_handle: AppHandle,
    request: SetupWorktreeRequest,
) -> Result<String, String> {
    validate_branch_name(&request.branch_name)?;

    let bash_path = detect_bash_path().await?;
    let scripts_dir = resolve_scripts_directory()?;
    let setup_script = scripts_dir.join("setup-worktree.sh");

    if !setup_script.exists() {
        return Err(format!(
            "setup-worktree.sh not found at {}",
            setup_script.display()
        ));
    }

    // Validate state transition: only setup from 'none' or 'failed'
    let old_state = {
        let connection = state.write()?;
        let current_state = get_worktree_state(&connection, &request.issue_id)?;
        if current_state != "none" && current_state != "failed" {
            return Err(format!(
                "Cannot setup worktree: current state is '{current_state}', expected 'none' or 'failed'"
            ));
        }
        update_worktree_state(&connection, &request.issue_id, "pending")?;
        current_state
    };

    emit_state_change(
        &app_handle,
        &request.issue_id,
        &old_state,
        "pending",
        None,
    );

    // Build command arguments
    let mut args = vec![
        setup_script.to_string_lossy().to_string(),
        request.branch_name.clone(),
    ];
    if let Some(ref color) = request.color {
        args.push("--color".to_string());
        args.push(color.clone());
    }

    let canonical_working_dir = validate_path_exists(&request.working_directory, "Working directory")?;

    // Spawn the script
    let mut child = Command::new(&bash_path)
        .args(&args)
        .current_dir(&canonical_working_dir)
        .env("GROVEKEEPER", "1") // Signal to script it's being called from Grovekeeper
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|error| {
            // Revert to old state on spawn failure
            if let Ok(conn) = state.write() {
                let _ = update_worktree_state(&conn, &request.issue_id, &old_state);
            }
            format!("Failed to spawn setup-worktree.sh: {error}")
        })?;

    // Stream stdout/stderr as progress events
    let stdout_handle = child
        .stdout
        .take()
        .map(|s| stream_output(s, app_handle.clone(), request.issue_id.clone(), "stdout"));
    let stderr_handle = child
        .stderr
        .take()
        .map(|s| stream_output(s, app_handle.clone(), request.issue_id.clone(), "stderr"));

    // Wait for process, then join readers so all progress lines are flushed
    let exit_status = child
        .wait()
        .await
        .map_err(|error| format!("Failed to wait for setup-worktree.sh: {error}"))?;

    if let Some(handle) = stdout_handle {
        let _ = handle.await;
    }
    if let Some(handle) = stderr_handle {
        let _ = handle.await;
    }

    if exit_status.success() {
        // Derive worktree folder path from the convention: <repo>/../worktrees/<branch_name>
        let working_dir = Path::new(&request.working_directory);
        let worktree_folder = working_dir
            .parent()
            .unwrap_or(working_dir)
            .join("worktrees")
            .join(&request.branch_name);
        let worktree_folder_str = worktree_folder.to_string_lossy().to_string();

        let connection = state.write()?;
        update_worktree_fields(
            &connection,
            &request.issue_id,
            "active",
            Some(&worktree_folder_str),
            Some(&request.branch_name),
            request.base_branch.as_deref(),
        )?;

        emit_state_change(
            &app_handle,
            &request.issue_id,
            "pending",
            "active",
            Some(&worktree_folder_str),
        );

        Ok(worktree_folder_str)
    } else {
        let exit_code = exit_status.code().unwrap_or(-1);
        let connection = state.write()?;
        update_worktree_state(&connection, &request.issue_id, "failed")?;

        emit_state_change(&app_handle, &request.issue_id, "pending", "failed", None);

        Err(format!(
            "setup-worktree.sh exited with code {exit_code}"
        ))
    }
}

#[tauri::command]
pub async fn remove_worktree(
    state: State<'_, DatabaseState>,
    app_handle: AppHandle,
    request: RemoveWorktreeRequest,
) -> Result<(), String> {
    validate_branch_name(&request.branch_name)?;

    let bash_path = detect_bash_path().await?;
    let scripts_dir = resolve_scripts_directory()?;
    let remove_script = scripts_dir.join("remove-worktree.sh");

    if !remove_script.exists() {
        return Err(format!(
            "remove-worktree.sh not found at {}",
            remove_script.display()
        ));
    }

    // Validate state: only remove from 'active' or 'failed'
    let old_state = {
        let connection = state.write()?;
        let current_state = get_worktree_state(&connection, &request.issue_id)?;
        if current_state != "active" && current_state != "failed" {
            return Err(format!(
                "Cannot remove worktree: current state is '{current_state}', expected 'active' or 'failed'"
            ));
        }
        update_worktree_state(&connection, &request.issue_id, "pending")?;
        current_state
    };

    emit_state_change(
        &app_handle,
        &request.issue_id,
        &old_state,
        "pending",
        None,
    );

    let args = vec![
        remove_script.to_string_lossy().to_string(),
        "--skip-confirmation".to_string(),
        request.branch_name.clone(),
    ];

    let canonical_working_dir = validate_path_exists(&request.working_directory, "Working directory")?;

    let mut child = Command::new(&bash_path)
        .args(&args)
        .current_dir(&canonical_working_dir)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|error| {
            if let Ok(conn) = state.write() {
                let _ = update_worktree_state(&conn, &request.issue_id, &old_state);
            }
            format!("Failed to spawn remove-worktree.sh: {error}")
        })?;

    let stdout_handle = child
        .stdout
        .take()
        .map(|s| stream_output(s, app_handle.clone(), request.issue_id.clone(), "stdout"));
    let stderr_handle = child
        .stderr
        .take()
        .map(|s| stream_output(s, app_handle.clone(), request.issue_id.clone(), "stderr"));

    let exit_status = child
        .wait()
        .await
        .map_err(|error| format!("Failed to wait for remove-worktree.sh: {error}"))?;

    if let Some(handle) = stdout_handle {
        let _ = handle.await;
    }
    if let Some(handle) = stderr_handle {
        let _ = handle.await;
    }

    if exit_status.success() {
        let connection = state.write()?;
        update_worktree_fields(
            &connection,
            &request.issue_id,
            "none",
            None,
            None,
            None,
        )?;

        emit_state_change(&app_handle, &request.issue_id, "pending", "none", None);
        Ok(())
    } else {
        let exit_code = exit_status.code().unwrap_or(-1);
        let connection = state.write()?;
        update_worktree_state(&connection, &request.issue_id, "failed")?;

        emit_state_change(&app_handle, &request.issue_id, "pending", "failed", None);
        Err(format!(
            "remove-worktree.sh exited with code {exit_code}"
        ))
    }
}

#[tauri::command]
pub fn refresh_worktree_state(
    state: State<DatabaseState>,
    app_handle: AppHandle,
    issue_id: String,
) -> Result<String, String> {
    let connection = state.write()?;

    let (current_state, worktree_folder): (String, Option<String>) = connection
        .query_row(
            "SELECT worktree_state, worktree_folder FROM issues WHERE id = ?1",
            [&issue_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|_| "ERR_ISSUE_NOT_FOUND".to_string())?;

    // If state is 'active', verify the folder still exists
    if current_state == "active" {
        if let Some(ref folder) = worktree_folder {
            if !Path::new(folder).exists() {
                update_worktree_state(&connection, &issue_id, "failed")?;
                emit_state_change(&app_handle, &issue_id, "active", "failed", None);
                return Ok("failed".to_string());
            }
        } else {
            // Active but no folder recorded — mark as failed
            update_worktree_state(&connection, &issue_id, "failed")?;
            emit_state_change(&app_handle, &issue_id, "active", "failed", None);
            return Ok("failed".to_string());
        }
    }

    // If state is 'none' but folder exists, mark as active
    if current_state == "none" {
        if let Some(ref folder) = worktree_folder {
            if Path::new(folder).exists() {
                update_worktree_state(&connection, &issue_id, "active")?;
                emit_state_change(
                    &app_handle,
                    &issue_id,
                    "none",
                    "active",
                    Some(folder),
                );
                return Ok("active".to_string());
            }
        }
    }

    Ok(current_state)
}

#[tauri::command]
pub fn get_prunable_issues(
    state: State<DatabaseState>,
    dashboard_id: String,
) -> Result<Vec<PrunableIssue>, String> {
    let connection = state.read()?;

    // Find issues with active worktrees that are fully closed:
    // PR merged + GitHub issue closed + branch gone/deleted
    let mut statement = connection
        .prepare(
            "SELECT i.id, i.name, i.branch_name, i.worktree_folder, \
                    g.pr_state, g.github_issue_state, g.branch_status \
             FROM issues i \
             JOIN git_status_cache g ON i.id = g.issue_id \
             WHERE i.dashboard_id = ?1 \
               AND i.worktree_state = 'active' \
               AND g.pr_state = 'merged' \
               AND g.github_issue_state = 'closed' \
               AND (g.branch_status IN ('remote-gone', 'deleted') OR g.branch_status IS NULL)",
        )
        .map_err(|error| format!("Failed to prepare query: {error}"))?;

    let issues = statement
        .query_map([&dashboard_id], |row| {
            Ok(PrunableIssue {
                issue_id: row.get(0)?,
                name: row.get(1)?,
                branch_name: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                worktree_folder: row.get(3)?,
                pr_state: row.get(4)?,
                github_issue_state: row.get(5)?,
                branch_status: row.get(6)?,
            })
        })
        .map_err(|error| format!("Failed to query prunable issues: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read prunable issue row: {error}"))?;

    Ok(issues)
}

// ─── Peacock Color Sync ───────────────────────────────────────────────────────

#[tauri::command]
pub fn update_peacock_color(worktree_folder: String, color: String) -> Result<(), String> {
    validate_hex_color(&color)?;

    let canonical = std::fs::canonicalize(&worktree_folder)
        .map_err(|e| format!("Worktree folder path is invalid: {e}"))?;
    let vscode_dir = canonical.join(".vscode");
    std::fs::create_dir_all(&vscode_dir)
        .map_err(|e| format!("Failed to create .vscode dir: {e}"))?;

    let settings_path = vscode_dir.join("settings.json");

    let mut settings: serde_json::Value = if settings_path.exists() {
        let content = std::fs::read_to_string(&settings_path)
            .map_err(|e| format!("Failed to read settings.json: {e}"))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse settings.json: {e}"))?
    } else {
        serde_json::json!({})
    };

    let obj = settings
        .as_object_mut()
        .ok_or_else(|| "settings.json root is not an object".to_string())?;

    obj.insert(
        "peacock.color".to_string(),
        serde_json::Value::String(color.clone()),
    );

    let foreground = compute_foreground(&color);
    let customizations = serde_json::json!({
        "titleBar.activeBackground": color,
        "titleBar.activeForeground": foreground,
        "activityBar.background": color,
        "activityBar.foreground": foreground,
        "statusBar.background": color,
        "statusBar.foreground": foreground,
    });
    obj.insert(
        "workbench.colorCustomizations".to_string(),
        customizations,
    );

    let output = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings.json: {e}"))?;
    std::fs::write(&settings_path, output)
        .map_err(|e| format!("Failed to write settings.json: {e}"))?;

    Ok(())
}

fn compute_foreground(hex_color: &str) -> &'static str {
    let r = u8::from_str_radix(&hex_color[1..3], 16).unwrap_or(0);
    let g = u8::from_str_radix(&hex_color[3..5], 16).unwrap_or(0);
    let b = u8::from_str_radix(&hex_color[5..7], 16).unwrap_or(0);
    let luminance = (0.299 * r as f64 + 0.587 * g as f64 + 0.114 * b as f64) / 255.0;
    if luminance > 0.5 {
        "#15202b"
    } else {
        "#e7e7e7"
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn update_peacock_color_creates_settings_file() {
        let tmp = TempDir::new().unwrap();
        let worktree_folder = tmp.path().to_string_lossy().to_string();

        update_peacock_color(worktree_folder.clone(), "#ff0000".to_string()).unwrap();

        let settings_path = tmp.path().join(".vscode/settings.json");
        assert!(settings_path.exists());

        let content = fs::read_to_string(&settings_path).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&content).unwrap();
        assert_eq!(parsed["peacock.color"], "#ff0000");
        assert_eq!(
            parsed["workbench.colorCustomizations"]["titleBar.activeBackground"],
            "#ff0000"
        );
    }

    #[test]
    fn update_peacock_color_preserves_existing_settings() {
        let tmp = TempDir::new().unwrap();
        let vscode_dir = tmp.path().join(".vscode");
        fs::create_dir_all(&vscode_dir).unwrap();
        fs::write(
            vscode_dir.join("settings.json"),
            r#"{"editor.fontSize": 14}"#,
        )
        .unwrap();

        let worktree_folder = tmp.path().to_string_lossy().to_string();
        update_peacock_color(worktree_folder, "#00ff00".to_string()).unwrap();

        let content = fs::read_to_string(vscode_dir.join("settings.json")).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&content).unwrap();
        assert_eq!(parsed["editor.fontSize"], 14);
        assert_eq!(parsed["peacock.color"], "#00ff00");
    }

    #[test]
    fn update_peacock_color_rejects_invalid_color() {
        let tmp = TempDir::new().unwrap();
        let worktree_folder = tmp.path().to_string_lossy().to_string();

        let result = update_peacock_color(worktree_folder, "not-a-color".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn compute_foreground_returns_dark_for_light_colors() {
        assert_eq!(compute_foreground("#ffffff"), "#15202b");
        assert_eq!(compute_foreground("#ffff00"), "#15202b");
    }

    #[test]
    fn compute_foreground_returns_light_for_dark_colors() {
        assert_eq!(compute_foreground("#000000"), "#e7e7e7");
        assert_eq!(compute_foreground("#1a1a2e"), "#e7e7e7");
    }

    #[test]
    fn valid_branch_names() {
        assert!(validate_branch_name("feature/my-branch").is_ok());
        assert!(validate_branch_name("fix_123").is_ok());
        assert!(validate_branch_name("main").is_ok());
        assert!(validate_branch_name("123-some-issue").is_ok());
    }

    #[test]
    fn invalid_branch_names() {
        assert!(validate_branch_name("").is_err());
        assert!(validate_branch_name(&"a".repeat(101)).is_err());
        assert!(validate_branch_name("branch;rm -rf /").is_err());
        assert!(validate_branch_name("../escape").is_err());
        assert!(validate_branch_name("-leading-dash").is_err());
        assert!(validate_branch_name("trailing.").is_err());
    }
}
