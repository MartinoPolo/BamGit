use regex::Regex;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use uuid::Uuid;

use crate::database::connection::DatabaseState;
use crate::models::workspace_command::{CommandCategory, CommandMode, RestartPolicy};
use crate::process::lifecycle::{backoff_delay, resolve_timeout, should_restart, MAX_RESTARTS};
use crate::process::manager::{ProcessManager, ProcessStatus, RunningProcess};

#[tauri::command]
pub async fn run_workspace_command(
    state: State<'_, DatabaseState>,
    process_manager: State<'_, ProcessManager>,
    app_handle: AppHandle,
    command_id: String,
    issue_id: String,
) -> Result<Option<RunningProcess>, String> {
    let (
        command_str,
        name,
        category,
        port_pattern,
        expected_exit_code,
        working_directory,
        mode,
        restart_policy,
        timeout_seconds,
    ) = {
        let connection = state.read()?;

        connection
            .query_row(
                "SELECT wc.command, wc.name, wc.category, wc.port_pattern, wc.expected_exit_code, \
                 COALESCE(i.worktree_folder, d.local_folder), wc.mode, wc.restart_policy, wc.timeout_seconds \
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
                        row.get::<_, String>(6)?,
                        row.get::<_, String>(7)?,
                        row.get::<_, Option<i64>>(8)?,
                    ))
                },
            )
            .map_err(|_| "ERR_COMMAND_OR_ISSUE_NOT_FOUND".to_string())?
    };

    let working_dir = working_directory
        .ok_or_else(|| "No working directory available for this issue".to_string())?;

    let mode = CommandMode::from_db(mode).map_err(|error| format!("Invalid mode in DB: {error}"))?;
    let restart_policy = RestartPolicy::from_db(restart_policy)
        .map_err(|error| format!("Invalid restart_policy in DB: {error}"))?;

    // Terminal mode: open in external terminal, no process tracking
    if mode == CommandMode::Terminal {
        let tab_color = {
            let connection = state.read()?;
            connection
                .query_row(
                    "SELECT d.accent_color FROM dashboards d \
                     JOIN issues i ON i.dashboard_id = d.id \
                     WHERE i.id = ?1",
                    [&issue_id],
                    |row| row.get::<_, Option<String>>(0),
                )
                .unwrap_or(None)
        };
        crate::commands::terminal_commands::open_terminal_with_command(
            &working_dir,
            &command_str,
            tab_color.as_deref(),
        )?;
        return Ok(None);
    }

    // Headless mode: spawn, track, with optional timeout + restart
    let process_id = Uuid::new_v4().to_string();
    let category_enum = CommandCategory::from_db(category.clone())
        .map_err(|error| format!("Invalid category in DB: {error}"))?;
    let is_server = category_enum == CommandCategory::Server;
    let timeout_duration = resolve_timeout(&category_enum, timeout_seconds);

    let task_process_id = process_id.clone();
    let task_pm = process_manager.inner().clone();
    let task_app = app_handle.clone();
    let task_expected_exit_code = expected_exit_code;
    let task_command_str = command_str;
    let task_working_dir = working_dir;
    let task_restart_policy = restart_policy;
    // Compile once — avoids per-line recompilation
    let compiled_port_regex = port_pattern.as_deref().and_then(|p| Regex::new(p).ok());

    let join_handle = tokio::spawn(async move {
        let mut restart_count = 0u32;
        let mut stderr_handle: Option<tokio::task::JoinHandle<()>> = None;

        loop {
            if let Some(handle) = stderr_handle.take() {
                handle.abort();
            }

            let spawn_result = {
                #[cfg(target_os = "windows")]
                {
                    tokio::process::Command::new("cmd")
                        .args(["/C", &task_command_str])
                        .current_dir(&task_working_dir)
                        .stdout(std::process::Stdio::piped())
                        .stderr(std::process::Stdio::piped())
                        .kill_on_drop(true)
                        .spawn()
                }
                #[cfg(not(target_os = "windows"))]
                {
                    tokio::process::Command::new("sh")
                        .args(["-c", &task_command_str])
                        .current_dir(&task_working_dir)
                        .stdout(std::process::Stdio::piped())
                        .stderr(std::process::Stdio::piped())
                        .kill_on_drop(true)
                        .spawn()
                }
            };

            let mut child = match spawn_result {
                Ok(child) => child,
                Err(error) => {
                    eprintln!("Failed to spawn process: {error}");
                    task_pm.set_status(&task_process_id, ProcessStatus::Failed);
                    let _ = task_pm.flush_log(&task_process_id);
                    let _ = task_app.emit(
                        "process-exited",
                        (&task_process_id, &ProcessStatus::Failed),
                    );
                    break;
                }
            };

            let pid = child.id().unwrap_or(0);
            task_pm.set_pid(&task_process_id, pid);

            let stdout = child.stdout.take();
            let stderr = child.stderr.take();

            // Spawn stderr reader for this child iteration
            if let Some(stderr) = stderr {
                let stderr_pm = task_pm.clone();
                let stderr_process_id = task_process_id.clone();
                let stderr_app = task_app.clone();
                stderr_handle = Some(tokio::spawn(async move {
                    let reader = BufReader::new(stderr);
                    let mut lines = reader.lines();
                    while let Ok(Some(line)) = lines.next_line().await {
                        stderr_pm
                            .append_log(&stderr_process_id, format!("[stderr] {line}"));
                        let _ = stderr_app
                            .emit("process-output", (&stderr_process_id, "stderr", &line));
                    }
                }));
            }

            // Read stdout
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
                                let _ = task_app
                                    .emit("process-port-detected", (&task_process_id, port));
                            }
                        }
                    }

                    let _ =
                        task_app.emit("process-output", (&task_process_id, "stdout", &line));
                }
            }

            // Wait for exit with optional timeout
            let (is_timeout, exit_code) = if let Some(duration) = timeout_duration {
                match tokio::time::timeout(duration, child.wait()).await {
                    Ok(Ok(status)) => (false, status.code()),
                    Ok(Err(_)) => (false, None),
                    Err(_) => {
                        // Timeout: kill the child
                        let _ = child.kill().await;
                        (true, None)
                    }
                }
            } else {
                match child.wait().await {
                    Ok(status) => (false, status.code()),
                    Err(_) => (false, None),
                }
            };

            let final_status = if is_timeout {
                ProcessStatus::Timeout
            } else if !is_server {
                match exit_code {
                    Some(code) if code == task_expected_exit_code as i32 => ProcessStatus::Passed,
                    _ => ProcessStatus::Failed,
                }
            } else {
                ProcessStatus::Stopped
            };

            task_pm.flush_log(&task_process_id);

            if should_restart(
                &task_restart_policy,
                exit_code,
                is_timeout,
                restart_count,
            ) {
                restart_count += 1;
                task_pm.set_restart_count(&task_process_id, restart_count);
                task_pm.set_status(&task_process_id, ProcessStatus::Running);
                let _ = task_app.emit(
                    "process-restarted",
                    (&task_process_id, restart_count, MAX_RESTARTS),
                );
                tokio::time::sleep(backoff_delay(restart_count - 1)).await;
                continue;
            }

            task_pm.set_status(&task_process_id, final_status.clone());
            let _ = task_app.emit("process-exited", (&task_process_id, &final_status));
            break;
        }
    });

    process_manager
        .register(
            process_id.clone(),
            command_id,
            issue_id,
            category,
            name,
            0, // PID is set inside the task once child spawns
            join_handle.abort_handle(),
        )
        .map_err(|err| format!("Failed to create process log file: {err}"))?;

    let info = process_manager
        .list_processes()
        .into_iter()
        .find(|p| p.process_id == process_id)
        .ok_or_else(|| "Failed to retrieve registered process".to_string())?;

    Ok(Some(info))
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

#[tauri::command]
pub fn get_full_process_logs(
    process_manager: State<ProcessManager>,
    process_id: String,
) -> Result<String, String> {
    process_manager
        .get_full_logs(&process_id)
        .ok_or_else(|| "ERR_PROCESS_NOT_FOUND".to_string())
}
