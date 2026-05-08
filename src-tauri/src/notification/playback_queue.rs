use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;

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
        path: PathBuf,
        volume: f32,
        event_type: NotificationEventType,
        session_id: String,
    },
    Shutdown,
}

/// Handle to enqueue sounds into the playback queue.
pub struct PlaybackQueueHandle {
    sender: mpsc::UnboundedSender<QueueMessage>,
}

impl PlaybackQueueHandle {
    pub fn enqueue(
        &self,
        path: PathBuf,
        volume: f32,
        event_type: NotificationEventType,
        session_id: String,
    ) {
        let _ = self.sender.send(QueueMessage::Enqueue {
            path,
            volume,
            event_type,
            session_id,
        });
    }

    pub fn shutdown(&self) {
        let _ = self.sender.send(QueueMessage::Shutdown);
    }
}

/// Start the playback queue actor. Returns a handle for enqueuing sounds.
pub fn start_playback_queue() -> PlaybackQueueHandle {
    let (sender, receiver) = mpsc::unbounded_channel();
    tokio::spawn(playback_queue_actor(receiver));
    PlaybackQueueHandle { sender }
}

async fn playback_queue_actor(mut receiver: mpsc::UnboundedReceiver<QueueMessage>) {
    let mut debounce_map: HashMap<(String, NotificationEventType), Instant> = HashMap::new();

    while let Some(message) = receiver.recv().await {
        match message {
            QueueMessage::Shutdown => break,
            QueueMessage::Enqueue {
                path,
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

                // Collect any queued sounds into a batch
                let mut batch = vec![QueuedSound { path, volume }];
                while batch.len() < MAX_QUEUE_SIZE {
                    match receiver.try_recv() {
                        Ok(QueueMessage::Enqueue {
                            path,
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
                            batch.push(QueuedSound { path, volume });
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
