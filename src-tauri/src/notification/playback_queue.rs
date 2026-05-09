use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::OnceLock;
use std::time::Instant;

use tauri::async_runtime;
use tokio::sync::mpsc;

use crate::models::notification::NotificationEventType;

use super::sound;

const MAX_QUEUE_SIZE: usize = 5;
const DEFAULT_DEBOUNCE_WINDOW_MS: u64 = 2000;
const POLLING_DEBOUNCE_WINDOW_MS: u64 = 30000;

struct QueuedSound {
    path: PathBuf,
    volume: f32,
}

enum QueueMessage {
    Enqueue {
        candidates: Vec<PathBuf>,
        volume: f32,
        event_type: NotificationEventType,
        session_id: String,
    },
    Shutdown,
}

/// Handle to enqueue sounds into the playback queue.
struct PlaybackQueueHandle {
    sender: mpsc::UnboundedSender<QueueMessage>,
}

impl PlaybackQueueHandle {
    fn enqueue(
        &self,
        candidates: Vec<PathBuf>,
        volume: f32,
        event_type: NotificationEventType,
        session_id: String,
    ) {
        let _ = self.sender.send(QueueMessage::Enqueue {
            candidates,
            volume,
            event_type,
            session_id,
        });
    }

    fn shutdown(&self) {
        let _ = self.sender.send(QueueMessage::Shutdown);
    }
}

/// Lazily-initialized playback queue that defers Tokio runtime access until first use.
/// Safe to construct during Tauri setup (before the async runtime is available).
pub struct LazyPlaybackQueue {
    inner: OnceLock<PlaybackQueueHandle>,
}

impl LazyPlaybackQueue {
    pub fn new() -> Self {
        Self {
            inner: OnceLock::new(),
        }
    }

    pub fn enqueue(
        &self,
        candidates: Vec<PathBuf>,
        volume: f32,
        event_type: NotificationEventType,
        session_id: String,
    ) {
        let handle = self.inner.get_or_init(start_playback_queue);
        handle.enqueue(candidates, volume, event_type, session_id);
    }

    pub fn shutdown(&self) {
        if let Some(handle) = self.inner.get() {
            handle.shutdown();
        }
    }
}

/// Start the playback queue actor. Returns a handle for enqueuing sounds.
fn start_playback_queue() -> PlaybackQueueHandle {
    let (sender, receiver) = mpsc::unbounded_channel();
    async_runtime::spawn(playback_queue_actor(receiver));
    PlaybackQueueHandle { sender }
}

fn pick_sound_index(candidate_count: usize, last_played: Option<usize>) -> usize {
    if candidate_count <= 1 {
        return 0;
    }
    let seed = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos() as usize;
    match last_played {
        Some(excluded) => {
            let idx = seed % (candidate_count - 1);
            if idx >= excluded {
                idx + 1
            } else {
                idx
            }
        }
        None => seed % candidate_count,
    }
}

/// Extract pack prefix from the first candidate path (e.g. "grove" from ".../sounds/grove/file.wav").
fn extract_pack_prefix(candidates: &[PathBuf]) -> String {
    candidates
        .first()
        .and_then(|path| {
            // Walk up from file to find a recognizable pack folder name
            path.parent().and_then(|parent| {
                parent
                    .file_name()
                    .map(|name| name.to_string_lossy().into_owned())
            })
        })
        .unwrap_or_default()
}

fn pick_from_candidates(
    candidates: &[PathBuf],
    event_type: NotificationEventType,
    rotation_map: &mut HashMap<(NotificationEventType, String), usize>,
) -> Option<PathBuf> {
    if candidates.is_empty() {
        return None;
    }
    if candidates.len() == 1 {
        return Some(candidates[0].clone());
    }
    let pack_prefix = extract_pack_prefix(candidates);
    let rotation_key = (event_type, pack_prefix);
    let last_played = rotation_map.get(&rotation_key).copied();
    let selected = pick_sound_index(candidates.len(), last_played);
    rotation_map.insert(rotation_key, selected);
    Some(candidates[selected].clone())
}

async fn playback_queue_actor(mut receiver: mpsc::UnboundedReceiver<QueueMessage>) {
    let mut debounce_map: HashMap<(String, NotificationEventType), Instant> = HashMap::new();
    let mut rotation_map: HashMap<(NotificationEventType, String), usize> = HashMap::new();

    while let Some(message) = receiver.recv().await {
        match message {
            QueueMessage::Shutdown => break,
            QueueMessage::Enqueue {
                candidates,
                volume,
                event_type,
                session_id,
            } => {
                // Critical events bypass debounce
                if !event_type.is_critical() {
                    let debounce_key = (session_id.clone(), event_type);
                    let debounce_window = debounce_window_for(event_type);
                    let now = Instant::now();

                    if let Some(last_fired) = debounce_map.get(&debounce_key) {
                        if now.duration_since(*last_fired).as_millis()
                            < u128::from(debounce_window)
                        {
                            log::debug!(
                                "Debounced {} for session {}",
                                event_type.as_str(),
                                debounce_key.0
                            );
                            continue;
                        }
                    }
                    debounce_map.insert(debounce_key, now);
                }

                // Pick from candidates using rotation
                let path = match pick_from_candidates(&candidates, event_type, &mut rotation_map) {
                    Some(path) => path,
                    None => continue,
                };

                // Collect any queued sounds into a batch
                let mut batch = vec![QueuedSound { path, volume }];
                while batch.len() < MAX_QUEUE_SIZE {
                    match receiver.try_recv() {
                        Ok(QueueMessage::Enqueue {
                            candidates: next_candidates,
                            volume,
                            event_type: next_event_type,
                            session_id: next_session_id,
                        }) => {
                            if !next_event_type.is_critical() {
                                let debounce_key = (next_session_id, next_event_type);
                                let debounce_window = debounce_window_for(next_event_type);
                                let now = Instant::now();
                                if let Some(last_fired) = debounce_map.get(&debounce_key) {
                                    if now.duration_since(*last_fired).as_millis()
                                        < u128::from(debounce_window)
                                    {
                                        continue;
                                    }
                                }
                                debounce_map.insert(debounce_key, now);
                            }
                            if let Some(path) = pick_from_candidates(
                                &next_candidates,
                                next_event_type,
                                &mut rotation_map,
                            ) {
                                batch.push(QueuedSound { path, volume });
                            }
                        }
                        Ok(QueueMessage::Shutdown) => return,
                        Err(_) => break,
                    }
                }

                // Drain any remaining to prevent unbounded growth
                let mut overflow = 0usize;
                loop {
                    match receiver.try_recv() {
                        Ok(QueueMessage::Shutdown) => return,
                        Ok(QueueMessage::Enqueue { .. }) => {
                            overflow += 1;
                        }
                        Err(_) => break,
                    }
                }

                if overflow > 0 {
                    log::warn!("Dropped {overflow} queued sounds (queue overflow)");
                }

                // Play sounds sequentially on a blocking thread
                let batch = Arc::new(batch);
                let batch_ref = Arc::clone(&batch);
                let _ = tokio::task::spawn_blocking(move || {
                    for queued_sound in batch_ref.iter() {
                        if let Err(error) =
                            sound::play_sound_blocking(&queued_sound.path, queued_sound.volume)
                        {
                            log::error!("Sound playback failed: {error}");
                        }
                    }
                })
                .await;
            }
        }
    }
}

fn debounce_window_for(event_type: NotificationEventType) -> u64 {
    match event_type {
        NotificationEventType::BranchBehindBase
        | NotificationEventType::MergeConflict
        | NotificationEventType::GithubIssueAssigned
        | NotificationEventType::GithubTriggerReceived => POLLING_DEBOUNCE_WINDOW_MS,
        _ => DEFAULT_DEBOUNCE_WINDOW_MS,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lazy_playback_queue_creation_does_not_panic() {
        let _queue = LazyPlaybackQueue::new();
        // No Tokio runtime exists — this must not panic
    }

    #[test]
    fn pick_sound_index_single_candidate_returns_zero() {
        assert_eq!(pick_sound_index(1, None), 0);
    }

    #[test]
    fn pick_sound_index_excludes_last_played() {
        for _ in 0..50 {
            let picked = pick_sound_index(3, Some(1));
            assert_ne!(picked, 1, "Should never repeat last-played index");
            assert!(picked < 3);
        }
    }

    #[test]
    fn pick_sound_index_no_exclusion_returns_valid_index() {
        for _ in 0..50 {
            let picked = pick_sound_index(5, None);
            assert!(picked < 5);
        }
    }

    #[test]
    fn debounce_windows_correct() {
        assert_eq!(
            debounce_window_for(NotificationEventType::TaskComplete),
            DEFAULT_DEBOUNCE_WINDOW_MS
        );
        assert_eq!(
            debounce_window_for(NotificationEventType::BranchBehindBase),
            POLLING_DEBOUNCE_WINDOW_MS
        );
        assert_eq!(
            debounce_window_for(NotificationEventType::MergeConflict),
            POLLING_DEBOUNCE_WINDOW_MS
        );
    }
}
