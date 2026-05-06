use std::path::PathBuf;

use async_trait::async_trait;
use serde_json::Value;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::mpsc;

use super::codex_event_parser::CodexEventParser;
use super::provider::{
    ApprovalDecision, ProviderAdapter, ProviderCapabilities, ProviderError, SessionEvent,
    SessionHandle, SessionTransport, SpawnConfig,
};

pub struct CodexProvider;

impl CodexProvider {
    pub fn new() -> Self {
        Self
    }

    fn build_exec_command(
        prompt: &str,
        working_directory: &PathBuf,
        model: &Option<String>,
        sandbox: &Option<String>,
        resume_thread_id: Option<&str>,
    ) -> Command {
        let mut cmd = Command::new("codex");

        if let Some(thread_id) = resume_thread_id {
            cmd.arg("exec").arg("resume").arg(thread_id);
        } else {
            cmd.arg("exec").arg(prompt);
        }

        cmd.arg("--json");

        if let Some(ref model) = model {
            cmd.arg("--model").arg(model);
        }

        if let Some(ref sandbox) = sandbox {
            cmd.arg("--sandbox").arg(sandbox);
        }

        cmd.current_dir(working_directory);

        cmd.stdin(std::process::Stdio::piped());
        cmd.stdout(std::process::Stdio::piped());
        cmd.stderr(std::process::Stdio::piped());

        #[cfg(windows)]
        {
            cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
        }

        cmd
    }

    fn spawn_stdout_reader(
        stdout: tokio::process::ChildStdout,
        event_sender: mpsc::Sender<SessionEvent>,
        thread_id_sender: Option<tokio::sync::oneshot::Sender<String>>,
    ) {
        tokio::spawn(async move {
            let mut parser = CodexEventParser::new();
            let mut reader = BufReader::new(stdout).lines();
            let mut thread_id_tx = thread_id_sender;

            while let Ok(Some(line)) = reader.next_line().await {
                if let Ok(raw) = serde_json::from_str::<Value>(&line) {
                    if raw.get("type").and_then(|v| v.as_str()) == Some("thread.started") {
                        if let Some(id) = raw.get("thread_id").and_then(|v| v.as_str()) {
                            if let Some(tx) = thread_id_tx.take() {
                                let _ = tx.send(id.to_string());
                            }
                        }
                    }

                    match parser.map_event(&raw) {
                        Ok(events) => {
                            for event in events {
                                if event_sender.send(event).await.is_err() {
                                    return;
                                }
                            }
                        }
                        Err(e) => log::warn!("Codex parse error: {e}"),
                    }
                }
            }
        });
    }

    fn spawn_stderr_reader(
        stderr: tokio::process::ChildStderr,
        event_sender: mpsc::Sender<SessionEvent>,
    ) {
        tokio::spawn(async move {
            let mut reader = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let raw_event = SessionEvent::Raw {
                    source: "stderr".into(),
                    data: Value::String(line),
                };
                if event_sender.send(raw_event).await.is_err() {
                    return;
                }
            }
        });
    }
}

#[async_trait]
impl ProviderAdapter for CodexProvider {
    async fn spawn(
        &self,
        config: SpawnConfig,
    ) -> Result<(SessionHandle, mpsc::Receiver<SessionEvent>), ProviderError> {
        let sandbox = config.permission_mode.clone();
        let model = config.model.clone();
        let working_directory = config.working_directory.clone();

        let mut cmd = Self::build_exec_command(
            &config.prompt,
            &working_directory,
            &model,
            &sandbox,
            config.resume_session_id.as_deref(),
        );

        for (key, value) in &config.env_vars {
            cmd.env(key, value);
        }

        let mut child = cmd.spawn().map_err(|e| {
            ProviderError::SpawnFailed(format!("Failed to spawn codex CLI: {e}"))
        })?;

        let pid = child.id().unwrap_or(0);
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| ProviderError::SpawnFailed("Failed to capture stdout".into()))?;
        let stderr = child.stderr.take();

        let (event_sender, event_receiver) = mpsc::channel::<SessionEvent>(256);

        // Channel to receive thread_id from the stdout reader
        let (thread_id_tx, thread_id_rx) = tokio::sync::oneshot::channel::<String>();

        Self::spawn_stdout_reader(stdout, event_sender.clone(), Some(thread_id_tx));

        if let Some(stderr) = stderr {
            Self::spawn_stderr_reader(stderr, event_sender.clone());
        }

        // Wait briefly for thread_id (non-blocking fallback if not received)
        let thread_id = tokio::time::timeout(
            std::time::Duration::from_secs(5),
            thread_id_rx,
        )
        .await
        .ok()
        .and_then(|r| r.ok());

        let handle = SessionHandle {
            child,
            pid,
            transport: SessionTransport::CodexExec {
                thread_id,
                event_sender,
                working_directory,
                model,
                sandbox,
            },
        };

        Ok((handle, event_receiver))
    }

    async fn send_turn(
        &self,
        handle: &mut SessionHandle,
        message: &str,
    ) -> Result<(), ProviderError> {
        let SessionTransport::CodexExec {
            thread_id,
            event_sender,
            working_directory,
            model,
            sandbox,
        } = &handle.transport
        else {
            return Err(ProviderError::NotRunning);
        };

        let tid = thread_id
            .as_deref()
            .ok_or(ProviderError::NotRunning)?;

        let mut cmd = Self::build_exec_command(
            message,
            working_directory,
            model,
            sandbox,
            Some(tid),
        );

        let mut new_child = cmd.spawn().map_err(|e| {
            ProviderError::SpawnFailed(format!("Failed to spawn codex resume: {e}"))
        })?;

        let new_pid = new_child.id().unwrap_or(0);
        let stdout = new_child
            .stdout
            .take()
            .ok_or_else(|| ProviderError::SpawnFailed("Failed to capture stdout".into()))?;
        let stderr = new_child.stderr.take();

        let sender = event_sender.clone();

        Self::spawn_stdout_reader(stdout, sender.clone(), None);

        if let Some(stderr) = stderr {
            Self::spawn_stderr_reader(stderr, sender);
        }

        let _ = handle.child.kill().await;
        handle.child = new_child;
        handle.pid = new_pid;

        Ok(())
    }

    async fn respond_to_request(
        &self,
        _handle: &mut SessionHandle,
        _request_id: &str,
        _decision: &ApprovalDecision,
    ) -> Result<(), ProviderError> {
        // Codex exec mode handles approvals via --sandbox flag, not interactive prompts
        Err(ProviderError::NotRunning)
    }

    async fn respond_to_user_input(
        &self,
        _handle: &mut SessionHandle,
        _request_id: &str,
        _answers: &Value,
    ) -> Result<(), ProviderError> {
        Err(ProviderError::NotRunning)
    }

    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            supports_spawn: true,
            supports_discovery: false,
            supports_mid_session_mode_switch: false,
            supports_mid_session_model_switch: false,
            supported_image_types: vec![],
            available_permission_modes: vec![
                "read-only".into(),
                "workspace-write".into(),
                "danger-full-access".into(),
            ],
        }
    }

    async fn interrupt(&self, handle: &mut SessionHandle) -> Result<(), ProviderError> {
        let _ = handle.child.kill().await;
        Ok(())
    }

    async fn terminate(&self, handle: &mut SessionHandle) -> Result<(), ProviderError> {
        handle.child.kill().await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn codex_capabilities_returns_correct_values() {
        let provider = CodexProvider::new();
        let caps = provider.capabilities();
        assert!(caps.supports_spawn);
        assert!(!caps.supports_discovery);
        assert!(!caps.supports_mid_session_mode_switch);
        assert!(!caps.supports_mid_session_model_switch);
        assert!(caps.supported_image_types.is_empty());
        assert_eq!(
            caps.available_permission_modes,
            vec!["read-only", "workspace-write", "danger-full-access"]
        );
    }

    #[test]
    fn build_exec_command_basic() {
        let cmd = CodexProvider::build_exec_command(
            "hello world",
            &PathBuf::from("/tmp"),
            &None,
            &None,
            None,
        );
        let prog = cmd.as_std().get_program().to_str().unwrap();
        assert_eq!(prog, "codex");

        let args: Vec<&str> = cmd
            .as_std()
            .get_args()
            .filter_map(|a| a.to_str())
            .collect();
        assert_eq!(args, vec!["exec", "hello world", "--json"]);
    }

    #[test]
    fn build_exec_command_with_model_and_sandbox() {
        let cmd = CodexProvider::build_exec_command(
            "fix bug",
            &PathBuf::from("/tmp"),
            &Some("gpt-4.1".into()),
            &Some("workspace-write".into()),
            None,
        );
        let args: Vec<&str> = cmd
            .as_std()
            .get_args()
            .filter_map(|a| a.to_str())
            .collect();
        assert!(args.contains(&"--model"));
        assert!(args.contains(&"gpt-4.1"));
        assert!(args.contains(&"--sandbox"));
        assert!(args.contains(&"workspace-write"));
    }

    #[test]
    fn build_exec_command_resume() {
        let cmd = CodexProvider::build_exec_command(
            "continue",
            &PathBuf::from("/tmp"),
            &None,
            &None,
            Some("thread-abc-123"),
        );
        let args: Vec<&str> = cmd
            .as_std()
            .get_args()
            .filter_map(|a| a.to_str())
            .collect();
        assert_eq!(args[0], "exec");
        assert_eq!(args[1], "resume");
        assert_eq!(args[2], "thread-abc-123");
        assert!(args.contains(&"--json"));
    }

    #[tokio::test]
    async fn respond_to_request_returns_not_running() {
        let provider = CodexProvider::new();
        let child = tokio::process::Command::new("cmd")
            .args(["/C", "echo test"])
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .unwrap();
        let pid = child.id().unwrap_or(0);
        let (tx, _rx) = mpsc::channel(1);
        let mut handle = SessionHandle {
            child,
            pid,
            transport: SessionTransport::CodexExec {
                thread_id: None,
                event_sender: tx,
                working_directory: PathBuf::from("."),
                model: None,
                sandbox: None,
            },
        };

        let result = provider
            .respond_to_request(&mut handle, "req_x", &ApprovalDecision::Allow)
            .await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "session not running");
    }

    #[tokio::test]
    async fn respond_to_user_input_returns_not_running() {
        let provider = CodexProvider::new();
        let child = tokio::process::Command::new("cmd")
            .args(["/C", "echo test"])
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .unwrap();
        let pid = child.id().unwrap_or(0);
        let (tx, _rx) = mpsc::channel(1);
        let mut handle = SessionHandle {
            child,
            pid,
            transport: SessionTransport::CodexExec {
                thread_id: None,
                event_sender: tx,
                working_directory: PathBuf::from("."),
                model: None,
                sandbox: None,
            },
        };

        let result = provider
            .respond_to_user_input(&mut handle, "req_y", &serde_json::json!({}))
            .await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "session not running");
    }
}
