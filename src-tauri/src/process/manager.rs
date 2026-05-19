use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct RunningProcess {
    pub process_id: String,
    pub command_id: String,
    pub issue_id: String,
    pub category: String,
    pub name: String,
    pub pid: u32,
    pub port: Option<u16>,
    pub status: ProcessStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS, PartialEq)]
#[ts(export)]
#[serde(rename_all = "lowercase")]
pub enum ProcessStatus {
    Running,
    Passed,
    Failed,
    Timeout,
    Stopped,
}

struct TrackedProcess {
    info: RunningProcess,
    abort_handle: tokio::task::AbortHandle,
    log_buffer: Vec<String>,
    log_file_path: std::path::PathBuf,
    log_writer: std::io::BufWriter<std::fs::File>,
}

impl std::fmt::Debug for TrackedProcess {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("TrackedProcess")
            .field("info", &self.info)
            .field("log_buffer_len", &self.log_buffer.len())
            .field("log_file_path", &self.log_file_path)
            .finish()
    }
}

const MAX_LOG_LINES: usize = 1000;

#[derive(Clone)]
pub struct ProcessManager {
    processes: Arc<Mutex<HashMap<String, TrackedProcess>>>,
}

impl ProcessManager {
    pub fn new() -> Self {
        Self {
            processes: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn list_processes(&self) -> Vec<RunningProcess> {
        let guard = self.processes.lock().unwrap();
        guard.values().map(|p| p.info.clone()).collect()
    }

    pub fn list_processes_for_issue(&self, issue_id: &str) -> Vec<RunningProcess> {
        let guard = self.processes.lock().unwrap();
        guard
            .values()
            .filter(|p| p.info.issue_id == issue_id)
            .map(|p| p.info.clone())
            .collect()
    }

    pub fn get_process_logs(&self, process_id: &str) -> Option<Vec<String>> {
        let guard = self.processes.lock().unwrap();
        guard.get(process_id).map(|p| p.log_buffer.clone())
    }

    pub fn append_log(&self, process_id: &str, line: String) {
        use std::io::Write;
        let mut guard = self.processes.lock().unwrap();
        if let Some(tracked) = guard.get_mut(process_id) {
            if let Err(err) = writeln!(tracked.log_writer, "{line}") {
                eprintln!("Failed to write to process log file: {err}");
            }
            tracked.log_buffer.push(line);
            if tracked.log_buffer.len() > MAX_LOG_LINES {
                let drain_count = tracked.log_buffer.len() - MAX_LOG_LINES;
                tracked.log_buffer.drain(..drain_count);
            }
        }
    }

    pub fn set_port(&self, process_id: &str, port: u16) {
        let mut guard = self.processes.lock().unwrap();
        if let Some(tracked) = guard.get_mut(process_id) {
            tracked.info.port = Some(port);
        }
    }

    pub fn set_status(&self, process_id: &str, status: ProcessStatus) {
        let mut guard = self.processes.lock().unwrap();
        if let Some(tracked) = guard.get_mut(process_id) {
            tracked.info.status = status;
        }
    }

    pub fn register(
        &self,
        process_id: String,
        command_id: String,
        issue_id: String,
        category: String,
        name: String,
        pid: u32,
        abort_handle: tokio::task::AbortHandle,
    ) -> Result<(), std::io::Error> {
        let log_file_path =
            std::env::temp_dir().join(format!("grovekeeper-proc-{process_id}.log"));
        let file = std::fs::File::create(&log_file_path)?;
        let log_writer = std::io::BufWriter::new(file);

        let info = RunningProcess {
            process_id: process_id.clone(),
            command_id,
            issue_id,
            category,
            name,
            pid,
            port: None,
            status: ProcessStatus::Running,
        };
        let tracked = TrackedProcess {
            info,
            abort_handle,
            log_buffer: Vec::new(),
            log_file_path,
            log_writer,
        };
        self.processes.lock().unwrap().insert(process_id, tracked);
        Ok(())
    }

    pub fn get_full_logs(&self, process_id: &str) -> Option<String> {
        let path = {
            let guard = self.processes.lock().unwrap();
            guard.get(process_id)?.log_file_path.clone()
        };
        std::fs::read_to_string(&path).ok()
    }

    pub fn flush_log(&self, process_id: &str) {
        use std::io::Write;
        let mut guard = self.processes.lock().unwrap();
        if let Some(tracked) = guard.get_mut(process_id) {
            let _ = tracked.log_writer.flush();
        }
    }

    pub fn kill_process(&self, process_id: &str) -> bool {
        let mut guard = self.processes.lock().unwrap();
        if let Some(tracked) = guard.get_mut(process_id) {
            tracked.abort_handle.abort();
            tracked.info.status = ProcessStatus::Stopped;
            true
        } else {
            false
        }
    }

    #[allow(dead_code)]
    pub fn remove_process(&self, process_id: &str) -> bool {
        let mut guard = self.processes.lock().unwrap();
        if let Some(tracked) = guard.remove(process_id) {
            tracked.abort_handle.abort();
            let _ = std::fs::remove_file(&tracked.log_file_path);
            true
        } else {
            false
        }
    }

    pub fn cleanup_all(&self) {
        let mut guard = self.processes.lock().unwrap();
        for tracked in guard.values() {
            tracked.abort_handle.abort();
            let _ = std::fs::remove_file(&tracked.log_file_path);
        }
        guard.clear();
    }
}

#[cfg(test)]
mod tests {
    use regex::Regex;

    fn try_extract_port(line: &str, pattern: &str) -> Option<u16> {
        let regex = Regex::new(pattern).ok()?;
        let captures = regex.captures(line)?;
        let port_str = captures.get(1)?.as_str();
        port_str.parse::<u16>().ok()
    }

    #[test]
    fn extract_port_from_vite_output() {
        let line = "  VITE v6.0.0  ready in 312 ms\n  ➜  Local:   http://localhost:1420/";
        let pattern = r"localhost:(\d+)";
        assert_eq!(try_extract_port(line, pattern), Some(1420));
    }

    #[test]
    fn extract_port_from_next_output() {
        let line = "ready - started server on 0.0.0.0:3000, url: http://localhost:3000";
        let pattern = r"localhost:(\d+)";
        assert_eq!(try_extract_port(line, pattern), Some(3000));
    }

    #[test]
    fn extract_port_custom_pattern() {
        let line = "Server listening on port 8080";
        let pattern = r"port (\d+)";
        assert_eq!(try_extract_port(line, pattern), Some(8080));
    }

    #[test]
    fn no_match_returns_none() {
        let line = "Compiling source files...";
        let pattern = r"localhost:(\d+)";
        assert_eq!(try_extract_port(line, pattern), None);
    }

    #[test]
    fn invalid_regex_returns_none() {
        let line = "localhost:3000";
        let pattern = r"(((invalid";
        assert_eq!(try_extract_port(line, pattern), None);
    }
}
