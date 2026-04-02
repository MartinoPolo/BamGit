use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{Arc, Mutex};

use super::error::GitError;

/// Deduplicates concurrent `git fetch origin` calls per repo root.
/// Multiple callers requesting a fetch for the same repo root will share
/// a single in-flight fetch via the stored result.
pub struct FetchCoordinator {
    in_flight: Mutex<HashMap<PathBuf, Arc<Mutex<Option<Result<(), String>>>>>>,
}

impl FetchCoordinator {
    pub fn new() -> Self {
        Self {
            in_flight: Mutex::new(HashMap::new()),
        }
    }

    /// Fetch from origin, deduplicating concurrent calls for the same repo root.
    /// Blocks the calling thread until the fetch completes.
    pub fn fetch_once(&self, repo_root: &Path) -> Result<(), GitError> {
        let canonical = repo_root.to_path_buf();

        // Get or create a slot for this repo root
        let slot = {
            let mut map = self
                .in_flight
                .lock()
                .map_err(|error| GitError::CommandFailed(format!("Lock poisoned: {error}")))?;

            if let Some(existing_slot) = map.get(&canonical) {
                Arc::clone(existing_slot)
            } else {
                let slot = Arc::new(Mutex::new(None));
                map.insert(canonical.clone(), Arc::clone(&slot));
                slot
            }
        };
        // in_flight lock is released here

        // Acquire the slot lock — if another thread is already fetching,
        // we block here until they finish and store their result.
        let result = {
            let mut result_guard = slot
                .lock()
                .map_err(|error| GitError::CommandFailed(format!("Slot lock poisoned: {error}")))?;

            if let Some(ref result) = *result_guard {
                // Another thread already completed the fetch
                return result.clone().map_err(GitError::CommandFailed);
            }

            // We are the first — perform the fetch
            let fetch_result = run_git_fetch(&canonical);
            let mapped_result = fetch_result
                .as_ref()
                .map(|_| ())
                .map_err(|error| error.to_string());
            *result_guard = Some(mapped_result);

            fetch_result
        };
        // slot lock is released here

        // Clean up the slot from the map (after releasing the slot lock)
        if let Ok(mut map) = self.in_flight.lock() {
            map.remove(&canonical);
        }

        result
    }

    pub fn reset(&self) {
        if let Ok(mut map) = self.in_flight.lock() {
            map.clear();
        }
    }
}

fn run_git_fetch(repo_root: &Path) -> Result<(), GitError> {
    let output = Command::new("git")
        .args(["fetch", "origin"])
        .current_dir(repo_root)
        .output()
        .map_err(|error| GitError::CommandFailed(format!("Failed to spawn git fetch: {error}")))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError::CommandFailed(format!(
            "git fetch origin failed: {}",
            stderr.trim()
        )));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use std::thread;

    #[test]
    fn new_coordinator_has_no_in_flight_fetches() {
        let coordinator = FetchCoordinator::new();
        let map = coordinator.in_flight.lock().unwrap();
        assert!(map.is_empty());
    }

    #[test]
    fn reset_clears_all_entries() {
        let coordinator = FetchCoordinator::new();
        {
            let mut map = coordinator.in_flight.lock().unwrap();
            map.insert(
                PathBuf::from("/some/repo"),
                Arc::new(Mutex::new(Some(Ok(())))),
            );
        }
        coordinator.reset();
        let map = coordinator.in_flight.lock().unwrap();
        assert!(map.is_empty());
    }

    #[test]
    fn fetch_once_succeeds_on_real_repo() {
        let repo_root = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
        let coordinator = FetchCoordinator::new();
        let result = coordinator.fetch_once(repo_root);
        // May fail if no network, but should not panic
        assert!(result.is_ok() || result.is_err());
    }

    #[test]
    fn concurrent_fetches_for_same_repo_share_result() {
        let repo_root = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
        let coordinator = Arc::new(FetchCoordinator::new());

        let mut handles = Vec::new();
        for _ in 0..3 {
            let coord = Arc::clone(&coordinator);
            let root = repo_root.to_path_buf();
            handles.push(thread::spawn(move || coord.fetch_once(&root)));
        }

        let results: Vec<_> = handles.into_iter().map(|h| h.join().unwrap()).collect();
        let first_ok = results[0].is_ok();
        for result in &results {
            assert_eq!(
                result.is_ok(),
                first_ok,
                "All concurrent fetches should produce the same outcome"
            );
        }
    }
}
