use std::time::Duration;

use crate::models::workspace_command::{CommandCategory, RestartPolicy};

pub const MAX_RESTARTS: u32 = 3;
const DEFAULT_CHECK_TIMEOUT_SECONDS: u64 = 30;

pub fn backoff_delay(restart_count: u32) -> Duration {
    Duration::from_secs(1u64 << restart_count.min(30))
}

pub fn resolve_timeout(category: &CommandCategory, timeout_seconds: Option<i64>) -> Option<Duration> {
    match timeout_seconds {
        Some(seconds) if seconds > 0 => Some(Duration::from_secs(seconds as u64)),
        Some(_) => None,
        None => match category {
            CommandCategory::Check => Some(Duration::from_secs(DEFAULT_CHECK_TIMEOUT_SECONDS)),
            CommandCategory::Server => None,
        },
    }
}

pub fn should_restart(
    policy: &RestartPolicy,
    exit_code: Option<i32>,
    is_timeout: bool,
    restart_count: u32,
) -> bool {
    if restart_count >= MAX_RESTARTS {
        return false;
    }
    match policy {
        RestartPolicy::Never => false,
        RestartPolicy::OnFailure => {
            if is_timeout {
                return true;
            }
            match exit_code {
                Some(code) => code != 0,
                None => true,
            }
        }
        RestartPolicy::Always => true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // --- backoff_delay ---

    #[test]
    fn backoff_delay_first_retry() {
        assert_eq!(backoff_delay(0), Duration::from_secs(1));
    }

    #[test]
    fn backoff_delay_second_retry() {
        assert_eq!(backoff_delay(1), Duration::from_secs(2));
    }

    #[test]
    fn backoff_delay_third_retry() {
        assert_eq!(backoff_delay(2), Duration::from_secs(4));
    }

    // --- resolve_timeout ---

    #[test]
    fn resolve_timeout_check_default() {
        assert_eq!(resolve_timeout(&CommandCategory::Check, None), Some(Duration::from_secs(30)));
    }

    #[test]
    fn resolve_timeout_server_no_default() {
        assert_eq!(resolve_timeout(&CommandCategory::Server, None), None);
    }

    #[test]
    fn resolve_timeout_explicit_overrides() {
        assert_eq!(resolve_timeout(&CommandCategory::Check, Some(60)), Some(Duration::from_secs(60)));
    }

    #[test]
    fn resolve_timeout_server_explicit() {
        assert_eq!(resolve_timeout(&CommandCategory::Server, Some(120)), Some(Duration::from_secs(120)));
    }

    #[test]
    fn resolve_timeout_negative_returns_none() {
        assert_eq!(resolve_timeout(&CommandCategory::Check, Some(-1)), None);
        assert_eq!(resolve_timeout(&CommandCategory::Server, Some(-5)), None);
    }

    #[test]
    fn resolve_timeout_zero_returns_none() {
        assert_eq!(resolve_timeout(&CommandCategory::Check, Some(0)), None);
    }

    // --- should_restart ---

    #[test]
    fn should_restart_never_policy() {
        assert!(!should_restart(&RestartPolicy::Never, Some(1), false, 0));
        assert!(!should_restart(&RestartPolicy::Never, Some(0), false, 0));
        assert!(!should_restart(&RestartPolicy::Never, None, true, 0));
    }

    #[test]
    fn should_restart_on_failure_nonzero() {
        assert!(should_restart(&RestartPolicy::OnFailure, Some(1), false, 0));
    }

    #[test]
    fn should_restart_on_failure_zero() {
        assert!(!should_restart(&RestartPolicy::OnFailure, Some(0), false, 0));
    }

    #[test]
    fn should_restart_on_failure_timeout() {
        assert!(should_restart(&RestartPolicy::OnFailure, None, true, 0));
    }

    #[test]
    fn should_restart_always_zero() {
        assert!(should_restart(&RestartPolicy::Always, Some(0), false, 0));
    }

    #[test]
    fn should_restart_always_nonzero() {
        assert!(should_restart(&RestartPolicy::Always, Some(1), false, 0));
    }

    #[test]
    fn should_restart_max_reached() {
        assert!(!should_restart(&RestartPolicy::Always, Some(1), false, 3));
        assert!(!should_restart(&RestartPolicy::OnFailure, Some(1), false, 3));
        assert!(!should_restart(&RestartPolicy::Never, Some(1), false, 3));
    }
}
