use regex::Regex;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use uuid::Uuid;

use crate::database::connection::DatabaseState;
use crate::process::manager::{ProcessManager, ProcessStatus, RunningProcess};

#[tauri::command]
pub async fn run_workspace_command(
    state: State<'_, DatabaseState>,
    process_manager: State<'_, ProcessManager>,
    app_handle: AppHandle,
    command_id: String,
    issue_id: String,
) -> Result<RunningProcess, String> {
    let (command_str, name, category, port_pattern, expected_exit_code, working_directory) = {
        let connection = state.read()?;

        let row = connection
            .query_row(
                "SELECT wc.command, wc.name, wc.category, wc.port_pattern, wc.expected_exit_code, \
                 COALESCE(i.worktree_folder, d.local_folder) \
                 FROM workspace_commands wc \
                 JOIN issues i ON i.id = ?2 \
                 JOIN dashboards d ON i.dashboard_id = d.id \
                 WHERE wc.id = ?1",
                rusqlite::params![command_id, issue_id],
                |row| {
                    Ok((
                        row.get::<_, String>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?,
                        row.get::<_, Option<String>>(3)?,
                        row.get::<_, i64>(4)?,
                        row.get::<_, Option<String>>(5)?,
                    ))
                },
            )
            .map_err(|_| "ERR_COMMAND_OR_ISSUE_NOT_FOUND".to_string())?;

        row
    };

    let working_dir = working_directory
        .ok_or_else(|| "No working directory available for this issue".to_string())?;

    let process_id = Uuid::new_v4().to_string();
    let is_server = category == "server";

    #[cfg(target_os = "windows")]
    let mut child = tokio::process::Command::new("cmd")
        .args(["/C", &command_str])
        .current_dir(&working_dir)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|error| format!("Failed to spawn process: {error}"))?;

    #[cfg(not(target_os = "windows"))]
    let mut child = tokio::process::Command::new("sh")
        .args(["-c", &command_str])
        .current_dir(&working_dir)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|error| format!("Failed to spawn process: {error}"))?;

    let pid = child.id().unwrap_or(0);
    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    let task_process_id = process_id.clone();
    let task_pm = process_manager.inner().clone();
    let task_app = app_handle.clone();
    let task_expected_exit_code = expected_exit_code;
    // Compile once, move into task — avoids per-line recompilation
    let compiled_port_regex = port_pattern.as_deref().and_then(|p| Regex::new(p).ok());

    let join_handle = tokio::spawn(async move {
        if let Some(stdout) = stdout {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                task_pm.append_log(&task_process_id, line.clone());

                if let Some(ref regex) = compiled_port_regex {
                    if let Some(captures) = regex.captures(&line) {
                        if let Some(port) = captures
                            .get(1)
                            .and_then(|m| m.as_str().parse::<u16>().ok())
                        {
                            task_pm.set_port(&task_process_id, port);
                            let _ =
                                task_app.emit("process-port-detected", (&task_process_id, port));
                        }
                    }
                }

                let _ = task_app.emit("process-output", (&task_process_id, &line));
            }
        }

        let exit_status = child.wait().await;

        let final_status = match exit_status {
            Ok(status) => {
                if !is_server && status.code() == Some(task_expected_exit_code as i32) {
                    ProcessStatus::Passed
                } else if !is_server {
                    ProcessStatus::Failed
                } else {
                    ProcessStatus::Stopped
                }
            }
            Err(_) => ProcessStatus::Failed,
        };

        task_pm.set_status(&task_process_id, final_status.clone());
        let _ = task_app.emit("process-exited", (&task_process_id, &final_status));
    });

    if let Some(stderr) = stderr {
        let stderr_pm = process_manager.inner().clone();
        let stderr_process_id = process_id.clone();
        let stderr_app = app_handle.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                stderr_pm.append_log(&stderr_process_id, format!("[stderr] {line}"));
                let _ = stderr_app.emit("process-output", (&stderr_process_id, &line));
            }
        });
    }

    process_manager.register(
        process_id.clone(),
        command_id,
        issue_id,
        category,
        name,
        pid,
        join_handle.abort_handle(),
    );

    let info = process_manager
        .list_processes()
        .into_iter()
        .find(|p| p.process_id == process_id)
        .ok_or_else(|| "Failed to retrieve registered process".to_string())?;

    Ok(info)
}

#[tauri::command]
pub fn kill_workspace_process(
    process_manager: State<ProcessManager>,
    process_id: String,
) -> Result<(), String> {
    if process_manager.kill_process(&process_id) {
        Ok(())
    } else {
        Err("ERR_PROCESS_NOT_FOUND".to_string())
    }
}

#[tauri::command]
pub fn get_running_processes(
    process_manager: State<ProcessManager>,
) -> Result<Vec<RunningProcess>, String> {
    Ok(process_manager.list_processes())
}

#[tauri::command]
pub fn get_processes_for_issue(
    process_manager: State<ProcessManager>,
    issue_id: String,
) -> Result<Vec<RunningProcess>, String> {
    Ok(process_manager.list_processes_for_issue(&issue_id))
}

#[tauri::command]
pub fn get_process_logs(
    process_manager: State<ProcessManager>,
    process_id: String,
) -> Result<Vec<String>, String> {
    process_manager
        .get_process_logs(&process_id)
        .ok_or_else(|| "ERR_PROCESS_NOT_FOUND".to_string())
}
