use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

use rusqlite::Connection;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

use super::discovery::{DiscoveredSession, SessionDiscoverer};

/// Payload emitted when discovered sessions change.
#[derive(Debug, Clone, Serialize)]
pub struct DiscoveredSessionsPayload {
    pub sessions: Vec<DiscoveredSession>,
}

/// Background poller that periodically discovers external Claude Code sessions
/// and emits Tauri events when the set changes.
pub struct DiscoveryPoller {
    running: Arc<AtomicBool>,
}

impl DiscoveryPoller {
    pub fn new() -> Self {
        Self {
            running: Arc::new(AtomicBool::new(false)),
        }
    }

    /// Start the background polling loop.
    /// Opens one DB connection for the poller's lifetime, reused across cycles.
    pub fn start(&self, app_handle: AppHandle, interval_milliseconds: u64) {
        if self.running.swap(true, Ordering::SeqCst) {
            return; // Already running
        }

        let running = Arc::clone(&self.running);

        tokio::spawn(async move {
            let db_path = match app_handle.path().app_data_dir() {
                Ok(dir) => dir.join("bamgit.db"),
                Err(_) => {
                    log::error!("Discovery poller: failed to resolve app data directory");
                    return;
                }
            };

            let connection = match Connection::open(&db_path) {
                Ok(c) => c,
                Err(e) => {
                    log::error!("Discovery poller: failed to open database: {e}");
                    return;
                }
            };

            let mut discoverer = SessionDiscoverer::new();
            let mut previous_fingerprint = String::new();

            while running.load(Ordering::SeqCst) {
                let excluded_pids = query_managed_pids(&connection);
                let sessions = discoverer.discover_sessions(&excluded_pids);

                let fingerprint = build_fingerprint(&sessions);

                if fingerprint != previous_fingerprint {
                    let payload = DiscoveredSessionsPayload {
                        sessions: sessions.clone(),
                    };
                    let _ = app_handle.emit("discovered-sessions-updated", &payload);
                    previous_fingerprint = fingerprint;
                }

                tokio::time::sleep(Duration::from_millis(interval_milliseconds)).await;
            }
        });
    }

    /// Stop the background polling loop.
    pub fn stop(&self) {
        self.running.store(false, Ordering::SeqCst);
    }
}

/// Build a change-detection fingerprint from the session list.
fn build_fingerprint(sessions: &[DiscoveredSession]) -> String {
    let mut parts: Vec<String> = sessions
        .iter()
        .map(|s| {
            format!(
                "{}:{:?}:{}",
                s.id,
                s.status,
                s.message_count,
            )
        })
        .collect();
    parts.sort();
    parts.join(",")
}

/// Query PIDs of BamGit-managed sessions from the database.
fn query_managed_pids(connection: &Connection) -> Vec<u32> {
    let mut statement = match connection.prepare(
        super::discovery::MANAGED_PIDS_QUERY,
    ) {
        Ok(s) => s,
        Err(_) => return Vec::new(),
    };

    let rows = match statement.query_map([], |row| {
        let pid: i64 = row.get(0)?;
        Ok(pid as u32)
    }) {
        Ok(r) => r,
        Err(_) => return Vec::new(),
    };

    rows.filter_map(|r| r.ok()).collect()
}
