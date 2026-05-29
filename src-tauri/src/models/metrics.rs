use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Activity categories for classifying session turns.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum ActivityCategory {
    Coding,
    Debugging,
    Feature,
    Refactoring,
    Testing,
    Exploration,
    Planning,
    Delegation,
    Git,
    BuildDeploy,
    Conversation,
    Brainstorming,
    General,
}

impl_sql_enum!(ActivityCategory {
    Coding => "coding",
    Debugging => "debugging",
    Feature => "feature",
    Refactoring => "refactoring",
    Testing => "testing",
    Exploration => "exploration",
    Planning => "planning",
    Delegation => "delegation",
    Git => "git",
    BuildDeploy => "build-deploy",
    Conversation => "conversation",
    Brainstorming => "brainstorming",
    General => "general",
});

/// Time period filter for dashboard queries.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum MetricsPeriod {
    Today,
    Week,
    Month,
    ThirtyDays,
    All,
    Custom { start: String, end: String },
}

impl MetricsPeriod {
    pub fn to_sql_date_filter(&self) -> Option<String> {
        match self {
            Self::Today => Some("date(started_at) = date('now')".to_string()),
            Self::Week => Some("started_at >= datetime('now', '-7 days')".to_string()),
            Self::ThirtyDays => Some("started_at >= datetime('now', '-30 days')".to_string()),
            Self::Month => Some("started_at >= datetime('now', 'start of month')".to_string()),
            Self::All => None,
            Self::Custom { start, end } => {
                fn is_valid_date(s: &str) -> bool {
                    s.len() == 10
                        && s.as_bytes().iter().enumerate().all(|(i, &b)| {
                            if i == 4 || i == 7 {
                                b == b'-'
                            } else {
                                b.is_ascii_digit()
                            }
                        })
                }
                if !is_valid_date(start) || !is_valid_date(end) {
                    return None;
                }
                Some(format!(
                    "date(started_at) >= date('{start}') AND date(started_at) <= date('{end}')"
                ))
            }
        }
    }

    pub fn previous_period_filter(&self) -> Option<(String, String)> {
        match self {
            Self::Today => Some((
                "date(started_at) = date('now', '-1 day')".to_string(),
                "date(started_at) = date('now')".to_string(),
            )),
            Self::Week => Some((
                "started_at >= datetime('now', '-14 days') AND started_at < datetime('now', '-7 days')".to_string(),
                "started_at >= datetime('now', '-7 days')".to_string(),
            )),
            Self::ThirtyDays => Some((
                "started_at >= datetime('now', '-60 days') AND started_at < datetime('now', '-30 days')".to_string(),
                "started_at >= datetime('now', '-30 days')".to_string(),
            )),
            Self::Month => Some((
                "started_at >= datetime('now', 'start of month', '-1 month') AND started_at < datetime('now', 'start of month')".to_string(),
                "started_at >= datetime('now', 'start of month')".to_string(),
            )),
            Self::All | Self::Custom { .. } => None,
        }
    }
}

/// KPI summary for the usage dashboard.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct UsageStats {
    pub total_cost_usd: f64,
    #[ts(type = "number")]
    pub session_count: i64,
    pub one_shot_rate: f64,
    pub cache_hit_ratio: f64,
    pub cost_delta_percent: Option<f64>,
    #[ts(type = "number | null")]
    pub session_count_delta: Option<i64>,
}

/// Grouping dimension for cost breakdown queries.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum GroupBy {
    None,
    Model,
    Provider,
    Category,
}

/// A single time-bucket cost entry for the bar chart.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct TimeBucketCost {
    pub date: String,
    pub cost_usd: f64,
    #[ts(type = "number")]
    pub session_count: i64,
}

/// A grouped cost entry broken down by model, provider, or category.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct GroupedCostEntry {
    pub date: String,
    pub group: String,
    pub cost_usd: f64,
    #[ts(type = "number")]
    pub session_count: i64,
}

/// Activity breakdown row for the table.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct ActivityBreakdown {
    pub category: ActivityCategory,
    pub cost_usd: f64,
    #[ts(type = "number")]
    pub turn_count: i64,
    pub one_shot_percent: f64,
}

/// A top session entry.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct TopSession {
    pub session_id: String,
    pub issue_name: Option<String>,
    #[ts(type = "number | null")]
    pub issue_number: Option<i64>,
    pub cost_usd: f64,
    #[ts(type = "number")]
    pub turn_count: i64,
    #[ts(type = "number")]
    pub tool_call_count: i64,
    pub started_at: String,
    pub pricing_available: bool,
}

/// Tool usage breakdown row.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct ToolUsageBreakdown {
    pub tool_name: String,
    #[ts(type = "number")]
    pub call_count: i64,
}

/// Full dashboard data returned by get_usage_dashboard.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct UsageDashboardData {
    pub stats: UsageStats,
    pub time_bucket_costs: Vec<TimeBucketCost>,
    pub grouped_costs: Vec<GroupedCostEntry>,
    pub activity_breakdown: Vec<ActivityBreakdown>,
    pub top_sessions: Vec<TopSession>,
    pub tool_usage: Vec<ToolUsageBreakdown>,
    pub pricing_available: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn all_returns_none_filter() {
        assert!(MetricsPeriod::All.to_sql_date_filter().is_none());
    }

    #[test]
    fn today_returns_date_filter() {
        let filter = MetricsPeriod::Today.to_sql_date_filter().unwrap();
        assert!(filter.contains("date('now')"));
    }

    #[test]
    fn week_returns_7_day_filter() {
        let filter = MetricsPeriod::Week.to_sql_date_filter().unwrap();
        assert!(filter.contains("-7 days"));
    }

    #[test]
    fn thirty_days_returns_30_day_filter() {
        let filter = MetricsPeriod::ThirtyDays.to_sql_date_filter().unwrap();
        assert!(filter.contains("-30 days"));
    }

    #[test]
    fn month_returns_start_of_month_filter() {
        let filter = MetricsPeriod::Month.to_sql_date_filter().unwrap();
        assert!(filter.contains("start of month"));
    }

    #[test]
    fn custom_valid_dates_returns_range_filter() {
        let period = MetricsPeriod::Custom {
            start: "2026-01-01".to_string(),
            end: "2026-01-31".to_string(),
        };
        let filter = period.to_sql_date_filter().unwrap();
        assert!(filter.contains("2026-01-01"));
        assert!(filter.contains("2026-01-31"));
    }

    #[test]
    fn custom_invalid_date_format_returns_none() {
        let period = MetricsPeriod::Custom {
            start: "not-a-date".to_string(),
            end: "2026-01-31".to_string(),
        };
        assert!(period.to_sql_date_filter().is_none());
    }

    #[test]
    fn custom_short_date_returns_none() {
        let period = MetricsPeriod::Custom {
            start: "2026-01".to_string(),
            end: "2026-01-31".to_string(),
        };
        assert!(period.to_sql_date_filter().is_none());
    }

    #[test]
    fn custom_date_with_letters_returns_none() {
        let period = MetricsPeriod::Custom {
            start: "2026-0a-01".to_string(),
            end: "2026-01-31".to_string(),
        };
        assert!(period.to_sql_date_filter().is_none());
    }

    #[test]
    fn previous_period_returns_none_for_all() {
        assert!(MetricsPeriod::All.previous_period_filter().is_none());
    }

    #[test]
    fn previous_period_returns_none_for_custom() {
        let period = MetricsPeriod::Custom {
            start: "2026-01-01".to_string(),
            end: "2026-01-31".to_string(),
        };
        assert!(period.previous_period_filter().is_none());
    }

    #[test]
    fn previous_period_returns_some_for_today() {
        let (prev, _current) = MetricsPeriod::Today.previous_period_filter().unwrap();
        assert!(prev.contains("-1 day"));
    }

    #[test]
    fn previous_period_returns_some_for_week() {
        let (prev, current) = MetricsPeriod::Week.previous_period_filter().unwrap();
        assert!(prev.contains("-14 days"));
        assert!(current.contains("-7 days"));
    }
}
