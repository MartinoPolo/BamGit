use rusqlite::Connection;

use crate::models::metrics::{
    ActivityBreakdown, ActivityCategory, GroupBy, GroupedCostEntry, MetricsPeriod, TimeBucketCost,
    TopSession, ToolUsageBreakdown, UsageDashboardData, UsageStats,
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

fn bucket_expression(period: &MetricsPeriod, column: &str) -> String {
    match period {
        MetricsPeriod::Today => format!("strftime('%Y-%m-%d %H:00', {column})"),
        MetricsPeriod::All => format!("strftime('%Y-W%W', {column})"),
        _ => format!("date({column})"),
    }
}

fn workspace_join(table: &str, dashboard_id: Option<&str>) -> (String, String) {
    match dashboard_id {
        Some(_) => (
            format!(
                " JOIN sessions _ws ON {table}.session_id = _ws.id \
                 JOIN issues _wi ON _ws.issue_id = _wi.id"
            ),
            " AND _wi.dashboard_id = :dashboard_id".to_string(),
        ),
        None => (String::new(), String::new()),
    }
}

fn query_single_row_f64_i64(
    conn: &Connection,
    sql: &str,
    dashboard_id: Option<&str>,
) -> Result<(f64, i64), rusqlite::Error> {
    if let Some(did) = dashboard_id {
        conn.query_row(sql, &[(":dashboard_id", did)], |row| {
            Ok((row.get::<_, f64>(0)?, row.get::<_, i64>(1)?))
        })
    } else {
        conn.query_row(sql, [], |row| {
            Ok((row.get::<_, f64>(0)?, row.get::<_, i64>(1)?))
        })
    }
}

fn query_single_row_i64_i64(
    conn: &Connection,
    sql: &str,
    dashboard_id: Option<&str>,
) -> Result<(i64, i64), rusqlite::Error> {
    if let Some(did) = dashboard_id {
        conn.query_row(sql, &[(":dashboard_id", did)], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?))
        })
    } else {
        conn.query_row(sql, [], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?))
        })
    }
}

pub fn query_usage_stats(
    conn: &Connection,
    period: &MetricsPeriod,
    dashboard_id: Option<&str>,
) -> Result<UsageStats, rusqlite::Error> {
    let date_filter = period.to_sql_date_filter();
    let current_where = period_where_clause(date_filter.as_deref(), "started_at");
    let (ws_join, ws_filter) = workspace_join("session_metrics", dashboard_id);

    let stats_sql = format!(
        "SELECT COALESCE(SUM(session_metrics.cost_usd), 0.0), COUNT(*) FROM session_metrics{ws_join} {current_where}{ws_filter}"
    );
    let (total_cost_usd, session_count) = query_single_row_f64_i64(conn, &stats_sql, dashboard_id)?;

    let oneshot_sql = format!(
        "SELECT COALESCE(SUM(session_metrics.one_shot_turns), 0), COALESCE(SUM(session_metrics.edit_turns), 0) FROM session_metrics{ws_join} {current_where}{ws_filter}"
    );
    let (one_shot_sum, edit_turns_sum) = query_single_row_i64_i64(conn, &oneshot_sql, dashboard_id)?;

    let one_shot_rate = if edit_turns_sum > 0 {
        one_shot_sum as f64 / edit_turns_sum as f64 * 100.0
    } else {
        0.0
    };

    let cache_sql = format!(
        "SELECT COALESCE(SUM(session_metrics.cache_read_tokens), 0), COALESCE(SUM(session_metrics.input_tokens), 0) FROM session_metrics{ws_join} {current_where}{ws_filter}"
    );
    let (cache_read_sum, input_tokens_sum) = query_single_row_i64_i64(conn, &cache_sql, dashboard_id)?;

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
                "SELECT COALESCE(SUM(session_metrics.cost_usd), 0.0), COUNT(*) FROM session_metrics{ws_join} {prev_where}{ws_filter}"
            );
            let (prev_cost, prev_count) = query_single_row_f64_i64(conn, &prev_sql, dashboard_id)?;

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

pub fn query_time_bucket_costs(
    conn: &Connection,
    period: &MetricsPeriod,
    dashboard_id: Option<&str>,
) -> Result<Vec<TimeBucketCost>, rusqlite::Error> {
    let date_filter = period.to_sql_date_filter();
    let where_clause = period_where_clause(date_filter.as_deref(), "started_at");
    let (ws_join, ws_filter) = workspace_join("session_metrics", dashboard_id);

    let bucket_expr = bucket_expression(period, "session_metrics.started_at");

    let sql = format!(
        "SELECT {bucket_expr} as bucket, COALESCE(SUM(session_metrics.cost_usd), 0), COUNT(*)
         FROM session_metrics{ws_join}
         {where_clause}{ws_filter}
         GROUP BY bucket
         ORDER BY bucket ASC"
    );

    let mut stmt = conn.prepare(&sql)?;
    let mapper = |row: &rusqlite::Row| {
        Ok(TimeBucketCost {
            date: row.get::<_, String>(0)?,
            cost_usd: row.get::<_, f64>(1)?,
            session_count: row.get::<_, i64>(2)?,
        })
    };

    if let Some(did) = dashboard_id {
        stmt.query_map(&[(":dashboard_id", did)], mapper)?.collect()
    } else {
        stmt.query_map([], mapper)?.collect()
    }
}

pub fn query_grouped_costs(
    conn: &Connection,
    period: &MetricsPeriod,
    dashboard_id: Option<&str>,
    group_by: &GroupBy,
) -> Result<Vec<GroupedCostEntry>, rusqlite::Error> {
    let date_filter = period.to_sql_date_filter();
    let where_clause = period_where_clause(date_filter.as_deref(), "started_at");
    let (ws_join, ws_filter) = workspace_join("session_metrics", dashboard_id);

    let bucket_expr = bucket_expression(period, "session_metrics.started_at");

    let group_expr = match group_by {
        GroupBy::Model => "COALESCE(session_metrics.model, 'unknown')",
        GroupBy::Provider => "COALESCE(session_metrics.provider, 'unknown')",
        GroupBy::Category => {
            return query_grouped_costs_by_category(conn, period, dashboard_id);
        }
        GroupBy::None => unreachable!(),
    };

    let sql = format!(
        "SELECT {bucket_expr} as bucket, {group_expr} as grp, COALESCE(SUM(session_metrics.cost_usd), 0), COUNT(*)
         FROM session_metrics{ws_join}
         {where_clause}{ws_filter}
         GROUP BY bucket, grp
         ORDER BY bucket ASC, grp ASC"
    );

    let mut stmt = conn.prepare(&sql)?;
    let mapper = |row: &rusqlite::Row| {
        Ok(GroupedCostEntry {
            date: row.get::<_, String>(0)?,
            group: row.get::<_, String>(1)?,
            cost_usd: row.get::<_, f64>(2)?,
            session_count: row.get::<_, i64>(3)?,
        })
    };

    if let Some(did) = dashboard_id {
        stmt.query_map(&[(":dashboard_id", did)], mapper)?.collect()
    } else {
        stmt.query_map([], mapper)?.collect()
    }
}

fn query_grouped_costs_by_category(
    conn: &Connection,
    period: &MetricsPeriod,
    dashboard_id: Option<&str>,
) -> Result<Vec<GroupedCostEntry>, rusqlite::Error> {
    let date_filter = period.to_sql_date_filter();
    let where_clause = period_where_clause(date_filter.as_deref(), "timestamp");
    let (ws_join, ws_filter) = workspace_join("turn_metrics", dashboard_id);

    let bucket_expr = bucket_expression(period, "turn_metrics.timestamp");

    let sql = format!(
        "SELECT {bucket_expr} as bucket, turn_metrics.category as grp, COALESCE(SUM(turn_metrics.cost_usd), 0), COUNT(DISTINCT turn_metrics.session_id)
         FROM turn_metrics{ws_join}
         {where_clause}{ws_filter}
         GROUP BY bucket, grp
         ORDER BY bucket ASC, grp ASC"
    );

    let mut stmt = conn.prepare(&sql)?;
    let mapper = |row: &rusqlite::Row| {
        Ok(GroupedCostEntry {
            date: row.get::<_, String>(0)?,
            group: row.get::<_, String>(1)?,
            cost_usd: row.get::<_, f64>(2)?,
            session_count: row.get::<_, i64>(3)?,
        })
    };

    if let Some(did) = dashboard_id {
        stmt.query_map(&[(":dashboard_id", did)], mapper)?.collect()
    } else {
        stmt.query_map([], mapper)?.collect()
    }
}

pub fn query_activity_breakdown(
    conn: &Connection,
    period: &MetricsPeriod,
    dashboard_id: Option<&str>,
) -> Result<Vec<ActivityBreakdown>, rusqlite::Error> {
    let date_filter = period.to_sql_date_filter();
    let where_clause = period_where_clause(date_filter.as_deref(), "timestamp");
    let (ws_join, ws_filter) = workspace_join("turn_metrics", dashboard_id);

    let sql = format!(
        "SELECT turn_metrics.category,
                COALESCE(SUM(turn_metrics.cost_usd), 0),
                COUNT(*),
                CASE WHEN SUM(CASE WHEN turn_metrics.has_edits = 1 THEN 1 ELSE 0 END) > 0
                     THEN CAST(SUM(CASE WHEN turn_metrics.has_edits = 1 AND turn_metrics.retry_count = 0 THEN 1 ELSE 0 END) AS REAL) /
                          SUM(CASE WHEN turn_metrics.has_edits = 1 THEN 1 ELSE 0 END) * 100
                     ELSE 0 END
         FROM turn_metrics{ws_join}
         {where_clause}{ws_filter}
         GROUP BY turn_metrics.category
         ORDER BY SUM(turn_metrics.cost_usd) DESC"
    );

    let mut stmt = conn.prepare(&sql)?;
    let mapper = |row: &rusqlite::Row| {
        let category: ActivityCategory = row.get(0)?;
        Ok(ActivityBreakdown {
            category,
            cost_usd: row.get::<_, f64>(1)?,
            turn_count: row.get::<_, i64>(2)?,
            one_shot_percent: row.get::<_, f64>(3)?,
        })
    };

    if let Some(did) = dashboard_id {
        stmt.query_map(&[(":dashboard_id", did)], mapper)?.collect()
    } else {
        stmt.query_map([], mapper)?.collect()
    }
}

pub fn query_top_sessions(
    conn: &Connection,
    period: &MetricsPeriod,
    dashboard_id: Option<&str>,
    limit: usize,
) -> Result<Vec<TopSession>, rusqlite::Error> {
    let date_filter = period.to_sql_date_filter();
    let where_clause = period_where_clause(date_filter.as_deref(), "sm.started_at");

    let ws_filter = match dashboard_id {
        Some(_) => " AND i.dashboard_id = :dashboard_id",
        None => "",
    };

    let sql = format!(
        "SELECT sm.session_id, i.name, i.github_issue_number, sm.cost_usd, sm.turn_count, sm.tool_call_count, sm.started_at
         FROM session_metrics sm
         LEFT JOIN sessions s ON sm.session_id = s.id
         LEFT JOIN issues i ON s.issue_id = i.id
         {where_clause}{ws_filter}
         ORDER BY sm.cost_usd DESC
         LIMIT {limit}"
    );

    let mut stmt = conn.prepare(&sql)?;
    let mapper = |row: &rusqlite::Row| {
        Ok(TopSession {
            session_id: row.get::<_, String>(0)?,
            issue_name: row.get::<_, Option<String>>(1)?,
            issue_number: row.get::<_, Option<i64>>(2)?,
            cost_usd: row.get::<_, f64>(3)?,
            turn_count: row.get::<_, i64>(4)?,
            tool_call_count: row.get::<_, i64>(5)?,
            started_at: row.get::<_, String>(6)?,
        })
    };

    if let Some(did) = dashboard_id {
        stmt.query_map(&[(":dashboard_id", did)], mapper)?.collect()
    } else {
        stmt.query_map([], mapper)?.collect()
    }
}

pub fn query_tool_usage(
    conn: &Connection,
    period: &MetricsPeriod,
    dashboard_id: Option<&str>,
    limit: usize,
) -> Result<Vec<ToolUsageBreakdown>, rusqlite::Error> {
    let date_filter = period.to_sql_date_filter();
    let where_clause = period_where_clause(date_filter.as_deref(), "timestamp");
    let (ws_join, ws_filter) = workspace_join("tool_usage", dashboard_id);

    let sql = format!(
        "SELECT tool_usage.tool_name, COUNT(*) as cnt
         FROM tool_usage{ws_join}
         {where_clause}{ws_filter}
         GROUP BY tool_usage.tool_name
         ORDER BY cnt DESC
         LIMIT {limit}"
    );

    let mut stmt = conn.prepare(&sql)?;
    let mapper = |row: &rusqlite::Row| {
        Ok(ToolUsageBreakdown {
            tool_name: row.get::<_, String>(0)?,
            call_count: row.get::<_, i64>(1)?,
        })
    };

    if let Some(did) = dashboard_id {
        stmt.query_map(&[(":dashboard_id", did)], mapper)?.collect()
    } else {
        stmt.query_map([], mapper)?.collect()
    }
}

pub fn query_usage_dashboard(
    conn: &Connection,
    period: &MetricsPeriod,
    dashboard_id: Option<&str>,
    group_by: &GroupBy,
) -> Result<UsageDashboardData, rusqlite::Error> {
    let stats = query_usage_stats(conn, period, dashboard_id)?;
    let time_bucket_costs = query_time_bucket_costs(conn, period, dashboard_id)?;
    let grouped_costs = match group_by {
        GroupBy::None => Vec::new(),
        _ => query_grouped_costs(conn, period, dashboard_id, group_by)?,
    };
    let activity_breakdown = query_activity_breakdown(conn, period, dashboard_id)?;
    let top_sessions = query_top_sessions(conn, period, dashboard_id, 5)?;
    let tool_usage = query_tool_usage(conn, period, dashboard_id, 10)?;

    Ok(UsageDashboardData {
        stats,
        time_bucket_costs,
        grouped_costs,
        activity_breakdown,
        top_sessions,
        tool_usage,
        pricing_available: true,
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

    fn insert_dashboard(conn: &rusqlite::Connection, id: &str) {
        conn.execute(
            "INSERT INTO dashboards (id, name, type) VALUES (?1, 'Test', 'repo')",
            [id],
        )
        .unwrap();
    }

    fn insert_issue(conn: &rusqlite::Connection, id: &str, dashboard_id: &str) {
        conn.execute(
            "INSERT INTO issues (id, dashboard_id, name) VALUES (?1, ?2, 'Test Issue')",
            rusqlite::params![id, dashboard_id],
        )
        .unwrap();
    }

    fn link_session_to_issue(conn: &rusqlite::Connection, session_id: &str, issue_id: &str) {
        conn.execute(
            "UPDATE sessions SET issue_id = ?1 WHERE id = ?2",
            rusqlite::params![issue_id, session_id],
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

        let stats = query_usage_stats(&conn, &MetricsPeriod::All, None).unwrap();

        assert!((stats.total_cost_usd - 4.0).abs() < 1e-9);
        assert_eq!(stats.session_count, 2);
        assert!((stats.one_shot_rate - (5.0 / 9.0 * 100.0)).abs() < 1e-6);
        let expected_cache = 1000.0 / (1000.0 + 3000.0) * 100.0;
        assert!((stats.cache_hit_ratio - expected_cache).abs() < 1e-6);
    }

    #[test]
    fn usage_stats_empty_returns_zeros() {
        let conn = setup_test_database();
        let stats = query_usage_stats(&conn, &MetricsPeriod::All, None).unwrap();
        assert_eq!(stats.total_cost_usd, 0.0);
        assert_eq!(stats.session_count, 0);
        assert_eq!(stats.one_shot_rate, 0.0);
        assert_eq!(stats.cache_hit_ratio, 0.0);
        assert!(stats.cost_delta_percent.is_none());
    }

    #[test]
    fn time_bucket_costs_groups_by_day() {
        let conn = setup_test_database();

        // Use Week period so it groups by day, and use dates on the same day vs different day.
        insert_session(&conn, "s1", "2026-05-01T08:00:00");
        insert_session(&conn, "s2", "2026-05-01T14:00:00");
        insert_session(&conn, "s3", "2026-05-02T09:00:00");

        insert_session_metrics(&conn, "s1", 1.0, 0, 0, 0, 0, 1, 0, "2026-05-01T08:00:00");
        insert_session_metrics(&conn, "s2", 2.0, 0, 0, 0, 0, 1, 0, "2026-05-01T14:00:00");
        insert_session_metrics(&conn, "s3", 3.0, 0, 0, 0, 0, 1, 0, "2026-05-02T09:00:00");

        // Week period groups by day
        let custom = MetricsPeriod::Custom {
            start: "2026-05-01".to_string(),
            end: "2026-05-10".to_string(),
        };
        let buckets = query_time_bucket_costs(&conn, &custom, None).unwrap();

        assert_eq!(buckets.len(), 2);
        assert_eq!(buckets[0].date, "2026-05-01");
        assert!((buckets[0].cost_usd - 3.0).abs() < 1e-9);
        assert_eq!(buckets[0].session_count, 2);
        assert_eq!(buckets[1].date, "2026-05-02");
        assert!((buckets[1].cost_usd - 3.0).abs() < 1e-9);
        assert_eq!(buckets[1].session_count, 1);
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

        let breakdown = query_activity_breakdown(&conn, &MetricsPeriod::All, None).unwrap();

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

        let usage = query_tool_usage(&conn, &MetricsPeriod::All, None, 10).unwrap();

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

        let top = query_top_sessions(&conn, &MetricsPeriod::All, None, 5).unwrap();

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

        let dashboard =
            query_usage_dashboard(&conn, &MetricsPeriod::All, None, &GroupBy::None).unwrap();

        assert!((dashboard.stats.total_cost_usd - 2.0).abs() < 1e-9);
        assert_eq!(dashboard.time_bucket_costs.len(), 1);
        assert_eq!(dashboard.grouped_costs.len(), 0);
        assert_eq!(dashboard.activity_breakdown.len(), 1);
        assert_eq!(dashboard.top_sessions.len(), 1);
        assert_eq!(dashboard.tool_usage.len(), 1);
        assert!(dashboard.pricing_available);
    }

    #[test]
    fn workspace_scoping_filters_by_dashboard() {
        let conn = setup_test_database();

        insert_dashboard(&conn, "d1");
        insert_dashboard(&conn, "d2");
        insert_issue(&conn, "i1", "d1");
        insert_issue(&conn, "i2", "d2");

        insert_session(&conn, "s1", "2026-05-01T08:00:00");
        insert_session(&conn, "s2", "2026-05-01T09:00:00");
        link_session_to_issue(&conn, "s1", "i1");
        link_session_to_issue(&conn, "s2", "i2");

        insert_session_metrics(&conn, "s1", 1.0, 100, 0, 0, 0, 1, 0, "2026-05-01T08:00:00");
        insert_session_metrics(&conn, "s2", 3.0, 200, 0, 0, 0, 1, 0, "2026-05-01T09:00:00");

        let global = query_usage_stats(&conn, &MetricsPeriod::All, None).unwrap();
        assert!((global.total_cost_usd - 4.0).abs() < 1e-9);
        assert_eq!(global.session_count, 2);

        let scoped = query_usage_stats(&conn, &MetricsPeriod::All, Some("d1")).unwrap();
        assert!((scoped.total_cost_usd - 1.0).abs() < 1e-9);
        assert_eq!(scoped.session_count, 1);
    }

    #[test]
    fn custom_period_filters_date_range() {
        let conn = setup_test_database();

        insert_session(&conn, "s1", "2026-05-01T08:00:00");
        insert_session(&conn, "s2", "2026-05-05T09:00:00");
        insert_session(&conn, "s3", "2026-05-10T10:00:00");

        insert_session_metrics(&conn, "s1", 1.0, 0, 0, 0, 0, 1, 0, "2026-05-01T08:00:00");
        insert_session_metrics(&conn, "s2", 2.0, 0, 0, 0, 0, 1, 0, "2026-05-05T09:00:00");
        insert_session_metrics(&conn, "s3", 3.0, 0, 0, 0, 0, 1, 0, "2026-05-10T10:00:00");

        let custom = MetricsPeriod::Custom {
            start: "2026-05-01".to_string(),
            end: "2026-05-05".to_string(),
        };
        let stats = query_usage_stats(&conn, &custom, None).unwrap();
        assert!((stats.total_cost_usd - 3.0).abs() < 1e-9);
        assert_eq!(stats.session_count, 2);
    }
}
