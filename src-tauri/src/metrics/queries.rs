use rusqlite::Connection;

use crate::models::metrics::{
    ActivityBreakdown, ActivityCategory, DailyCost, MetricsPeriod, TopSession, ToolUsageBreakdown,
    UsageDashboardData, UsageStats,
};

fn period_where_clause(filter: Option<&str>, column: &str) -> String {
    match filter {
        Some(raw) => {
            let replaced = raw.replace("started_at", column).replace("timestamp", column);
            format!("WHERE {replaced}")
        }
        None => String::new(),
    }
}

pub fn query_usage_stats(
    conn: &Connection,
    period: MetricsPeriod,
) -> Result<UsageStats, rusqlite::Error> {
    let date_filter = period.to_sql_date_filter();

    let current_where = period_where_clause(date_filter, "started_at");

    let stats_sql = format!(
        "SELECT COALESCE(SUM(cost_usd), 0.0), COUNT(*) FROM session_metrics {current_where}"
    );
    let (total_cost_usd, session_count): (f64, i64) = conn.query_row(&stats_sql, [], |row| {
        Ok((row.get::<_, f64>(0)?, row.get::<_, i64>(1)?))
    })?;

    let oneshot_sql = format!(
        "SELECT COALESCE(SUM(one_shot_turns), 0), COALESCE(SUM(edit_turns), 0) FROM session_metrics {current_where}"
    );
    let (one_shot_sum, edit_turns_sum): (i64, i64) =
        conn.query_row(&oneshot_sql, [], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?))
        })?;

    let one_shot_rate = if edit_turns_sum > 0 {
        one_shot_sum as f64 / edit_turns_sum as f64 * 100.0
    } else {
        0.0
    };

    let cache_sql = format!(
        "SELECT COALESCE(SUM(cache_read_tokens), 0), COALESCE(SUM(input_tokens), 0) FROM session_metrics {current_where}"
    );
    let (cache_read_sum, input_tokens_sum): (i64, i64) =
        conn.query_row(&cache_sql, [], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?))
        })?;

    let cache_hit_ratio = if cache_read_sum + input_tokens_sum > 0 {
        cache_read_sum as f64 / (cache_read_sum + input_tokens_sum) as f64 * 100.0
    } else {
        0.0
    };

    let (cost_delta_percent, session_count_delta) = match period.previous_period_filter() {
        None => (None, None),
        Some((prev_filter, _)) => {
            let prev_where = format!("WHERE {prev_filter}");
            let prev_sql = format!(
                "SELECT COALESCE(SUM(cost_usd), 0.0), COUNT(*) FROM session_metrics {prev_where}"
            );
            let (prev_cost, prev_count): (f64, i64) =
                conn.query_row(&prev_sql, [], |row| {
                    Ok((row.get::<_, f64>(0)?, row.get::<_, i64>(1)?))
                })?;

            let delta_cost = if prev_cost > 0.0 {
                Some((total_cost_usd - prev_cost) / prev_cost * 100.0)
            } else {
                None
            };

            let delta_count = if prev_count > 0 {
                Some(session_count - prev_count)
            } else {
                None
            };

            (delta_cost, delta_count)
        }
    };

    Ok(UsageStats {
        total_cost_usd,
        session_count,
        one_shot_rate,
        cache_hit_ratio,
        cost_delta_percent,
        session_count_delta,
    })
}

pub fn query_daily_costs(
    conn: &Connection,
    period: MetricsPeriod,
) -> Result<Vec<DailyCost>, rusqlite::Error> {
    let date_filter = period.to_sql_date_filter();
    let where_clause = period_where_clause(date_filter, "started_at");

    let sql = format!(
        "SELECT date(started_at) as day, COALESCE(SUM(cost_usd), 0), COUNT(*)
         FROM session_metrics
         {where_clause}
         GROUP BY day
         ORDER BY day ASC"
    );

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([], |row| {
        Ok(DailyCost {
            date: row.get::<_, String>(0)?,
            cost_usd: row.get::<_, f64>(1)?,
            session_count: row.get::<_, i64>(2)?,
        })
    })?;

    rows.collect()
}

pub fn query_activity_breakdown(
    conn: &Connection,
    period: MetricsPeriod,
) -> Result<Vec<ActivityBreakdown>, rusqlite::Error> {
    let date_filter = period.to_sql_date_filter();
    let where_clause = period_where_clause(date_filter, "timestamp");

    let sql = format!(
        "SELECT category,
                COALESCE(SUM(cost_usd), 0),
                COUNT(*),
                CASE WHEN SUM(CASE WHEN has_edits = 1 THEN 1 ELSE 0 END) > 0
                     THEN CAST(SUM(CASE WHEN has_edits = 1 AND retry_count = 0 THEN 1 ELSE 0 END) AS REAL) /
                          SUM(CASE WHEN has_edits = 1 THEN 1 ELSE 0 END) * 100
                     ELSE 0 END
         FROM turn_metrics
         {where_clause}
         GROUP BY category
         ORDER BY SUM(cost_usd) DESC"
    );

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([], |row| {
        let category: ActivityCategory = row.get(0)?;
        Ok(ActivityBreakdown {
            category,
            cost_usd: row.get::<_, f64>(1)?,
            turn_count: row.get::<_, i64>(2)?,
            one_shot_percent: row.get::<_, f64>(3)?,
        })
    })?;

    rows.collect()
}

pub fn query_top_sessions(
    conn: &Connection,
    period: MetricsPeriod,
    limit: usize,
) -> Result<Vec<TopSession>, rusqlite::Error> {
    let date_filter = period.to_sql_date_filter();
    let where_clause = period_where_clause(date_filter, "sm.started_at");

    let sql = format!(
        "SELECT sm.session_id, i.name, i.github_issue_number, sm.cost_usd, sm.turn_count, sm.tool_call_count, sm.started_at
         FROM session_metrics sm
         LEFT JOIN sessions s ON sm.session_id = s.id
         LEFT JOIN issues i ON s.issue_id = i.id
         {where_clause}
         ORDER BY sm.cost_usd DESC
         LIMIT {limit}"
    );

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([], |row| {
        Ok(TopSession {
            session_id: row.get::<_, String>(0)?,
            issue_name: row.get::<_, Option<String>>(1)?,
            issue_number: row.get::<_, Option<i64>>(2)?,
            cost_usd: row.get::<_, f64>(3)?,
            turn_count: row.get::<_, i64>(4)?,
            tool_call_count: row.get::<_, i64>(5)?,
            started_at: row.get::<_, String>(6)?,
        })
    })?;

    rows.collect()
}

pub fn query_tool_usage(
    conn: &Connection,
    period: MetricsPeriod,
    limit: usize,
) -> Result<Vec<ToolUsageBreakdown>, rusqlite::Error> {
    let date_filter = period.to_sql_date_filter();
    let where_clause = period_where_clause(date_filter, "timestamp");

    let sql = format!(
        "SELECT tool_name, COUNT(*) as cnt
         FROM tool_usage
         {where_clause}
         GROUP BY tool_name
         ORDER BY cnt DESC
         LIMIT {limit}"
    );

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([], |row| {
        Ok(ToolUsageBreakdown {
            tool_name: row.get::<_, String>(0)?,
            call_count: row.get::<_, i64>(1)?,
        })
    })?;

    rows.collect()
}

pub fn query_usage_dashboard(
    conn: &Connection,
    period: MetricsPeriod,
) -> Result<UsageDashboardData, rusqlite::Error> {
    let stats = query_usage_stats(conn, period)?;
    let daily_costs = query_daily_costs(conn, period)?;
    let activity_breakdown = query_activity_breakdown(conn, period)?;
    let top_sessions = query_top_sessions(conn, period, 5)?;
    let tool_usage = query_tool_usage(conn, period, 10)?;

    Ok(UsageDashboardData {
        stats,
        daily_costs,
        activity_breakdown,
        top_sessions,
        tool_usage,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::test_helpers::setup_test_database;

    fn insert_session(conn: &rusqlite::Connection, session_id: &str, started_at: &str) {
        conn.execute(
            "INSERT INTO sessions (id, provider, state, started_at) VALUES (?1, 'claude-code', 'finished', ?2)",
            rusqlite::params![session_id, started_at],
        )
        .unwrap();
    }

    fn insert_session_metrics(
        conn: &rusqlite::Connection,
        session_id: &str,
        cost_usd: f64,
        input_tokens: i64,
        cache_read_tokens: i64,
        one_shot_turns: i64,
        edit_turns: i64,
        turn_count: i64,
        tool_call_count: i64,
        started_at: &str,
    ) {
        conn.execute(
            "INSERT INTO session_metrics
             (session_id, provider, input_tokens, cache_read_tokens, cost_usd, one_shot_turns, edit_turns, turn_count, tool_call_count, started_at)
             VALUES (?1, 'claude-code', ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            rusqlite::params![
                session_id,
                input_tokens,
                cache_read_tokens,
                cost_usd,
                one_shot_turns,
                edit_turns,
                turn_count,
                tool_call_count,
                started_at
            ],
        )
        .unwrap();
    }

    fn insert_turn_metrics(
        conn: &rusqlite::Connection,
        id: &str,
        session_id: &str,
        turn_index: i64,
        category: &str,
        cost_usd: f64,
        has_edits: i64,
        retry_count: i64,
        timestamp: &str,
    ) {
        conn.execute(
            "INSERT INTO turn_metrics (id, session_id, turn_index, category, cost_usd, has_edits, retry_count, timestamp)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            rusqlite::params![
                id,
                session_id,
                turn_index,
                category,
                cost_usd,
                has_edits,
                retry_count,
                timestamp
            ],
        )
        .unwrap();
    }

    fn insert_tool_usage(
        conn: &rusqlite::Connection,
        id: &str,
        session_id: &str,
        tool_name: &str,
        timestamp: &str,
    ) {
        conn.execute(
            "INSERT INTO tool_usage (id, session_id, tool_name, timestamp) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![id, session_id, tool_name, timestamp],
        )
        .unwrap();
    }

    #[test]
    fn usage_stats_totals_are_correct() {
        let conn = setup_test_database();

        insert_session(&conn, "s1", "2026-05-01T10:00:00");
        insert_session(&conn, "s2", "2026-05-02T11:00:00");

        insert_session_metrics(&conn, "s1", 1.5, 1000, 200, 3, 5, 10, 20, "2026-05-01T10:00:00");
        insert_session_metrics(&conn, "s2", 2.5, 2000, 800, 2, 4, 8, 16, "2026-05-02T11:00:00");

        let stats = query_usage_stats(&conn, MetricsPeriod::All).unwrap();

        assert!((stats.total_cost_usd - 4.0).abs() < 1e-9);
        assert_eq!(stats.session_count, 2);
        assert!((stats.one_shot_rate - (5.0 / 9.0 * 100.0)).abs() < 1e-6);
        let expected_cache = 1000.0 / (1000.0 + 3000.0) * 100.0;
        assert!((stats.cache_hit_ratio - expected_cache).abs() < 1e-6);
    }

    #[test]
    fn usage_stats_empty_returns_zeros() {
        let conn = setup_test_database();
        let stats = query_usage_stats(&conn, MetricsPeriod::All).unwrap();
        assert_eq!(stats.total_cost_usd, 0.0);
        assert_eq!(stats.session_count, 0);
        assert_eq!(stats.one_shot_rate, 0.0);
        assert_eq!(stats.cache_hit_ratio, 0.0);
        assert!(stats.cost_delta_percent.is_none());
    }

    #[test]
    fn daily_costs_groups_by_day() {
        let conn = setup_test_database();

        insert_session(&conn, "s1", "2026-05-01T08:00:00");
        insert_session(&conn, "s2", "2026-05-01T14:00:00");
        insert_session(&conn, "s3", "2026-05-02T09:00:00");

        insert_session_metrics(&conn, "s1", 1.0, 0, 0, 0, 0, 1, 0, "2026-05-01T08:00:00");
        insert_session_metrics(&conn, "s2", 2.0, 0, 0, 0, 0, 1, 0, "2026-05-01T14:00:00");
        insert_session_metrics(&conn, "s3", 3.0, 0, 0, 0, 0, 1, 0, "2026-05-02T09:00:00");

        let daily = query_daily_costs(&conn, MetricsPeriod::All).unwrap();

        assert_eq!(daily.len(), 2);
        assert_eq!(daily[0].date, "2026-05-01");
        assert!((daily[0].cost_usd - 3.0).abs() < 1e-9);
        assert_eq!(daily[0].session_count, 2);
        assert_eq!(daily[1].date, "2026-05-02");
        assert!((daily[1].cost_usd - 3.0).abs() < 1e-9);
        assert_eq!(daily[1].session_count, 1);
    }

    #[test]
    fn activity_breakdown_groups_by_category() {
        let conn = setup_test_database();

        insert_session(&conn, "s1", "2026-05-01T08:00:00");

        insert_session_metrics(&conn, "s1", 5.0, 0, 0, 0, 0, 3, 0, "2026-05-01T08:00:00");

        insert_turn_metrics(
            &conn,
            "t1",
            "s1",
            0,
            "coding",
            2.0,
            1,
            0,
            "2026-05-01T08:01:00",
        );
        insert_turn_metrics(
            &conn,
            "t2",
            "s1",
            1,
            "coding",
            1.5,
            1,
            1,
            "2026-05-01T08:02:00",
        );
        insert_turn_metrics(
            &conn,
            "t3",
            "s1",
            2,
            "debugging",
            3.0,
            0,
            0,
            "2026-05-01T08:03:00",
        );

        let breakdown = query_activity_breakdown(&conn, MetricsPeriod::All).unwrap();

        assert_eq!(breakdown.len(), 2);

        let debugging_row = breakdown
            .iter()
            .find(|r| r.category == ActivityCategory::Debugging)
            .unwrap();
        assert!((debugging_row.cost_usd - 3.0).abs() < 1e-9);
        assert_eq!(debugging_row.turn_count, 1);

        let coding_row = breakdown
            .iter()
            .find(|r| r.category == ActivityCategory::Coding)
            .unwrap();
        assert!((coding_row.cost_usd - 3.5).abs() < 1e-9);
        assert_eq!(coding_row.turn_count, 2);
        assert!((coding_row.one_shot_percent - 50.0).abs() < 1e-6);
    }

    #[test]
    fn tool_usage_counts_correctly() {
        let conn = setup_test_database();

        insert_session(&conn, "s1", "2026-05-01T08:00:00");
        insert_session_metrics(&conn, "s1", 1.0, 0, 0, 0, 0, 1, 3, "2026-05-01T08:00:00");

        insert_tool_usage(&conn, "tu1", "s1", "Edit", "2026-05-01T08:01:00");
        insert_tool_usage(&conn, "tu2", "s1", "Edit", "2026-05-01T08:02:00");
        insert_tool_usage(&conn, "tu3", "s1", "Bash", "2026-05-01T08:03:00");

        let usage = query_tool_usage(&conn, MetricsPeriod::All, 10).unwrap();

        assert_eq!(usage.len(), 2);
        assert_eq!(usage[0].tool_name, "Edit");
        assert_eq!(usage[0].call_count, 2);
        assert_eq!(usage[1].tool_name, "Bash");
        assert_eq!(usage[1].call_count, 1);
    }

    #[test]
    fn top_sessions_ordered_by_cost_desc() {
        let conn = setup_test_database();

        insert_session(&conn, "s1", "2026-05-01T08:00:00");
        insert_session(&conn, "s2", "2026-05-01T09:00:00");
        insert_session(&conn, "s3", "2026-05-01T10:00:00");

        insert_session_metrics(&conn, "s1", 1.0, 0, 0, 0, 0, 2, 5, "2026-05-01T08:00:00");
        insert_session_metrics(&conn, "s2", 5.0, 0, 0, 0, 0, 8, 12, "2026-05-01T09:00:00");
        insert_session_metrics(&conn, "s3", 3.0, 0, 0, 0, 0, 4, 7, "2026-05-01T10:00:00");

        let top = query_top_sessions(&conn, MetricsPeriod::All, 5).unwrap();

        assert_eq!(top.len(), 3);
        assert_eq!(top[0].session_id, "s2");
        assert!((top[0].cost_usd - 5.0).abs() < 1e-9);
        assert_eq!(top[1].session_id, "s3");
        assert_eq!(top[2].session_id, "s1");
    }

    #[test]
    fn dashboard_assembles_all_sections() {
        let conn = setup_test_database();

        insert_session(&conn, "s1", "2026-05-01T08:00:00");
        insert_session_metrics(&conn, "s1", 2.0, 500, 100, 1, 2, 3, 4, "2026-05-01T08:00:00");
        insert_turn_metrics(&conn, "t1", "s1", 0, "coding", 1.0, 1, 0, "2026-05-01T08:01:00");
        insert_tool_usage(&conn, "tu1", "s1", "Read", "2026-05-01T08:01:00");

        let dashboard = query_usage_dashboard(&conn, MetricsPeriod::All).unwrap();

        assert!((dashboard.stats.total_cost_usd - 2.0).abs() < 1e-9);
        assert_eq!(dashboard.daily_costs.len(), 1);
        assert_eq!(dashboard.activity_breakdown.len(), 1);
        assert_eq!(dashboard.top_sessions.len(), 1);
        assert_eq!(dashboard.tool_usage.len(), 1);
    }
}
