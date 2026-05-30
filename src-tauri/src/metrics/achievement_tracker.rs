use rusqlite::Connection;

use crate::models::achievement::{Achievement, AchievementKind};

pub fn get_all_achievements(conn: &Connection) -> Result<Vec<Achievement>, rusqlite::Error> {
    let mut result = Vec::with_capacity(10);

    for kind in AchievementKind::all() {
        let (progress, unlocked_at) = conn
            .query_row(
                "SELECT progress, unlocked_at FROM achievements WHERE kind = ?1",
                [kind.as_str()],
                |row| Ok((row.get::<_, i64>(0)?, row.get::<_, Option<String>>(1)?)),
            )
            .unwrap_or((0, None));

        result.push(Achievement {
            kind: *kind,
            display_name: kind.display_name().to_string(),
            description: kind.description().to_string(),
            threshold: kind.threshold(),
            progress,
            unlocked_at,
        });
    }

    Ok(result)
}

pub fn increment_achievement(
    conn: &Connection,
    kind: AchievementKind,
    amount: i64,
) -> Result<bool, rusqlite::Error> {
    conn.execute(
        "INSERT INTO achievements (kind, progress) VALUES (?1, ?2) \
         ON CONFLICT(kind) DO UPDATE SET progress = achievements.progress + ?2",
        rusqlite::params![kind.as_str(), amount],
    )?;

    let (progress, already_unlocked): (i64, bool) = conn.query_row(
        "SELECT progress, unlocked_at IS NOT NULL FROM achievements WHERE kind = ?1",
        [kind.as_str()],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )?;

    if !already_unlocked && progress >= kind.threshold() {
        conn.execute(
            "UPDATE achievements SET unlocked_at = datetime('now') WHERE kind = ?1",
            [kind.as_str()],
        )?;
        return Ok(true);
    }

    Ok(false)
}

pub fn check_session_achievements(
    conn: &Connection,
    _cost_usd: f64,
    duration_seconds: Option<f64>,
    cache_hit_ratio: f64,
    one_shot_turns: i64,
    edit_turns: i64,
) -> Vec<AchievementKind> {
    let mut newly_unlocked = Vec::new();

    if let Ok(true) = increment_achievement(conn, AchievementKind::GreenThumb, 1) {
        newly_unlocked.push(AchievementKind::GreenThumb);
    }

    if duration_seconds.map_or(false, |d| d < 60.0) {
        if let Ok(true) = increment_achievement(conn, AchievementKind::SpeedRunner, 1) {
            newly_unlocked.push(AchievementKind::SpeedRunner);
        }
    }

    if cache_hit_ratio >= 90.0 {
        if let Ok(true) = increment_achievement(conn, AchievementKind::CacheMaster, 1) {
            newly_unlocked.push(AchievementKind::CacheMaster);
        }
    }

    if edit_turns > 0 && one_shot_turns == edit_turns {
        if let Ok(true) = increment_achievement(conn, AchievementKind::OneShotWonder, 1) {
            newly_unlocked.push(AchievementKind::OneShotWonder);
        }
    }

    let total_cost: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(cost_usd), 0.0) FROM session_metrics",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0.0);
    if total_cost >= 100.0 {
        if let Ok(true) = increment_achievement(conn, AchievementKind::BigSpender, (total_cost as i64).saturating_sub(99)) {
            newly_unlocked.push(AchievementKind::BigSpender);
        }
    }

    newly_unlocked
}

pub fn check_issue_achievements(conn: &Connection) -> Vec<AchievementKind> {
    let mut newly_unlocked = Vec::new();

    let issue_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM issues", [], |row| row.get(0))
        .unwrap_or(0);

    for kind in &[
        AchievementKind::FirstSeed,
        AchievementKind::Created10Trees,
        AchievementKind::Created50Trees,
    ] {
        let current_progress: i64 = conn
            .query_row(
                "SELECT COALESCE(progress, 0) FROM achievements WHERE kind = ?1",
                [kind.as_str()],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let increment = issue_count - current_progress;
        if increment > 0 {
            if let Ok(true) = increment_achievement(conn, *kind, increment) {
                newly_unlocked.push(*kind);
            }
        }
    }

    newly_unlocked
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        crate::database::schema::create_tables(&conn).unwrap();
        conn
    }

    fn get_progress(conn: &Connection, kind: &str) -> i64 {
        conn.query_row(
            "SELECT progress FROM achievements WHERE kind = ?1",
            [kind],
            |row| row.get(0),
        )
        .unwrap_or(0)
    }

    #[test]
    fn increment_below_threshold_does_not_unlock() {
        let conn = setup_db();
        let unlocked = increment_achievement(&conn, AchievementKind::GreenThumb, 1).unwrap();
        assert!(!unlocked);
    }

    #[test]
    fn increment_at_threshold_unlocks() {
        let conn = setup_db();
        for _ in 0..9 {
            increment_achievement(&conn, AchievementKind::GreenThumb, 1).unwrap();
        }
        let unlocked = increment_achievement(&conn, AchievementKind::GreenThumb, 1).unwrap();
        assert!(unlocked);
    }

    #[test]
    fn get_all_achievements_returns_ten() {
        let conn = setup_db();
        let achievements = get_all_achievements(&conn).unwrap();
        assert_eq!(achievements.len(), 10);
        assert!(achievements.iter().all(|a| a.unlocked_at.is_none()));
    }

    #[test]
    fn second_unlock_attempt_returns_false() {
        let conn = setup_db();
        increment_achievement(&conn, AchievementKind::FirstSeed, 1).unwrap();
        let again = increment_achievement(&conn, AchievementKind::FirstSeed, 1).unwrap();
        assert!(!again);
    }

    #[test]
    fn one_shot_wonder_increments_on_perfect_rate() {
        let conn = setup_db();
        let unlocked = check_session_achievements(&conn, 0.0, None, 0.0, 3, 3);
        assert_eq!(get_progress(&conn, "one-shot-wonder"), 1, "OneShotWonder should be incremented when one_shot_turns == edit_turns");
        assert!(!unlocked.contains(&AchievementKind::OneShotWonder));
    }

    #[test]
    fn one_shot_wonder_does_not_increment_on_imperfect_rate() {
        let conn = setup_db();
        check_session_achievements(&conn, 0.0, None, 0.0, 2, 5);
        assert_eq!(get_progress(&conn, "one-shot-wonder"), 0, "OneShotWonder should not increment when one_shot_turns != edit_turns");
    }

    #[test]
    fn one_shot_wonder_does_not_increment_on_zero_turns() {
        let conn = setup_db();
        check_session_achievements(&conn, 0.0, None, 0.0, 0, 0);
        assert_eq!(get_progress(&conn, "one-shot-wonder"), 0, "OneShotWonder should not increment when edit_turns == 0");
    }

    // ── Group 4: Achievement Triggers ──

    #[test]
    fn test_speed_runner_triggers_under_60_seconds() {
        let conn = setup_db();
        check_session_achievements(&conn, 0.0, Some(30.0), 0.0, 0, 0);
        assert_eq!(get_progress(&conn, "speed-runner"), 1, "SpeedRunner should trigger for duration < 60s");
    }

    #[test]
    fn test_speed_runner_does_not_trigger_at_60() {
        let conn = setup_db();
        check_session_achievements(&conn, 0.0, Some(60.0), 0.0, 0, 0);
        assert_eq!(get_progress(&conn, "speed-runner"), 0, "SpeedRunner should NOT trigger at exactly 60s (condition is < 60.0)");
    }

    #[test]
    fn test_speed_runner_does_not_trigger_on_none() {
        let conn = setup_db();
        check_session_achievements(&conn, 0.0, None, 0.0, 0, 0);
        assert_eq!(get_progress(&conn, "speed-runner"), 0, "SpeedRunner should NOT trigger when duration is None");
    }

    #[test]
    fn test_cache_master_triggers_at_90_percent() {
        let conn = setup_db();
        check_session_achievements(&conn, 0.0, None, 90.0, 0, 0);
        assert_eq!(get_progress(&conn, "cache-master"), 1, "CacheMaster should trigger at 90.0% cache hit ratio");
    }

    #[test]
    fn test_cache_master_does_not_trigger_at_89_9() {
        let conn = setup_db();
        check_session_achievements(&conn, 0.0, None, 89.9, 0, 0);
        assert_eq!(get_progress(&conn, "cache-master"), 0, "CacheMaster should NOT trigger at 89.9%");
    }

    #[test]
    fn test_big_spender_increments_at_100_dollars() {
        let conn = setup_db();
        conn.execute(
            "INSERT INTO sessions (id, provider, state, started_at) VALUES ('s1', 'claude-code', 'finished', '2025-01-01T00:00:00Z')",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO session_metrics (session_id, provider, cost_usd, started_at) VALUES ('s1', 'claude-code', 100.0, '2025-01-01T00:00:00Z')",
            [],
        ).unwrap();

        // _cost_usd param is unused — BigSpender queries SUM(cost_usd) from session_metrics directly
        check_session_achievements(&conn, 0.0, None, 0.0, 0, 0);

        assert_eq!(get_progress(&conn, "big-spender"), 1, "BigSpender progress should be 1 when SUM(cost_usd) >= 100");
    }

    #[test]
    fn test_big_spender_does_not_increment_at_99() {
        let conn = setup_db();
        conn.execute(
            "INSERT INTO sessions (id, provider, state, started_at) VALUES ('s1', 'claude-code', 'finished', '2025-01-01T00:00:00Z')",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO session_metrics (session_id, provider, cost_usd, started_at) VALUES ('s1', 'claude-code', 99.0, '2025-01-01T00:00:00Z')",
            [],
        ).unwrap();

        check_session_achievements(&conn, 0.0, None, 0.0, 0, 0);

        assert_eq!(get_progress(&conn, "big-spender"), 0, "BigSpender should NOT increment when SUM(cost_usd) < 100");
    }

    // ── Group 5: Integration Test ──

    #[test]
    fn test_session_completion_integration() {
        let conn = setup_db();

        conn.execute(
            "INSERT INTO sessions (id, provider, state, started_at, ended_at, cost_usd, token_count) \
             VALUES ('int-test-1', 'claude-code', 'finished', '2025-01-01T10:00:00Z', '2025-01-01T10:00:30Z', 0.50, 500)",
            [],
        ).unwrap();

        conn.execute(
            "INSERT INTO session_metrics \
             (session_id, provider, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, \
              cost_usd, duration_seconds, turn_count, tool_call_count, one_shot_turns, edit_turns, started_at, ended_at) \
             VALUES ('int-test-1', 'claude-code', 'claude-sonnet-4-20250514', 300, 200, 270, 10, 0.50, 25.0, 3, 5, 2, 2, \
                     '2025-01-01T10:00:00Z', '2025-01-01T10:00:30Z')",
            [],
        ).unwrap();

        // cache_hit_ratio = 270 / (270 + 300) * 100 = 47.4%
        let cache_hit_ratio = 270.0 / (270.0 + 300.0) * 100.0;
        let unlocked = check_session_achievements(&conn, 0.50, Some(25.0), cache_hit_ratio, 2, 2);

        assert_eq!(get_progress(&conn, "green-thumb"), 1, "GreenThumb should be incremented");
        assert!(!unlocked.contains(&AchievementKind::GreenThumb), "GreenThumb should not be unlocked yet (threshold 10)");

        assert_eq!(get_progress(&conn, "speed-runner"), 1, "SpeedRunner should be incremented (25s < 60s)");
        assert!(unlocked.contains(&AchievementKind::SpeedRunner), "SpeedRunner should be unlocked (threshold 1)");

        assert_eq!(get_progress(&conn, "cache-master"), 0, "CacheMaster should NOT be incremented (47.4% < 90%)");

        assert_eq!(get_progress(&conn, "one-shot-wonder"), 1, "OneShotWonder should be incremented (2 == 2, both > 0)");

        assert_eq!(get_progress(&conn, "big-spender"), 0, "BigSpender should NOT be incremented (total cost $0.50)");
    }
}
