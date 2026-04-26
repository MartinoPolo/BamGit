use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};
use ts_rs::TS;
use tokio::io::{AsyncBufReadExt, AsyncRead, BufReader};
use tokio::process::Command;
use tauri::async_runtime::JoinHandle;

use crate::database::connection::DatabaseState;

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

        Err("Could not find Git Bash. Ensure Git for Windows is installed.".into())
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

    Err(
        "Could not find mpx-claude-code scripts directory. \
         Set MPX_SCRIPTS_DIR environment variable or ensure scripts exist."
            .into(),
    )
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
        .map_err(|error| format!("Issue not found: {error}"))
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

// ─── Commands ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn setup_worktree(
    state: State<'_, DatabaseState>,
    app_handle: AppHandle,
    request: SetupWorktreeRequest,
) -> Result<String, String> {
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
        let connection = state.write();
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

    // Spawn the script
    let mut child = Command::new(&bash_path)
        .args(&args)
        .current_dir(&request.working_directory)
        .env("GROVEKEEPER", "1") // Signal to script it's being called from Grovekeeper
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|error| {
            // Revert to old state on spawn failure
            let conn = state.write();
            let _ = update_worktree_state(&conn, &request.issue_id, &old_state);
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

        let connection = state.write();
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
        let connection = state.write();
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
        let connection = state.write();
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

    let mut child = Command::new(&bash_path)
        .args(&args)
        .current_dir(&request.working_directory)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|error| {
            let conn = state.write();
            let _ = update_worktree_state(&conn, &request.issue_id, &old_state);
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
        let connection = state.write();
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
        let connection = state.write();
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
    let connection = state.write();

    let (current_state, worktree_folder): (String, Option<String>) = connection
        .query_row(
            "SELECT worktree_state, worktree_folder FROM issues WHERE id = ?1",
            [&issue_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|error| format!("Issue not found: {error}"))?;

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
    let connection = state.read();

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
