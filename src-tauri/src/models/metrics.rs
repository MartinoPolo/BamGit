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
#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum MetricsPeriod {
    Today,
    Week,
    Month,
    ThirtyDays,
    All,
}

impl MetricsPeriod {
    pub fn to_sql_date_filter(&self) -> Option<&'static str> {
        match self {
            Self::Today => Some("date(started_at) = date('now')"),
            Self::Week => Some("started_at >= datetime('now', '-7 days')"),
            Self::ThirtyDays => Some("started_at >= datetime('now', '-30 days')"),
            Self::Month => Some("started_at >= datetime('now', 'start of month')"),
            Self::All => None,
        }
    }

    pub fn previous_period_filter(&self) -> Option<(&'static str, &'static str)> {
        match self {
            Self::Today => Some((
                "date(started_at) = date('now', '-1 day')",
                "date(started_at) = date('now')",
            )),
            Self::Week => Some((
                "started_at >= datetime('now', '-14 days') AND started_at < datetime('now', '-7 days')",
                "started_at >= datetime('now', '-7 days')",
            )),
            Self::ThirtyDays => Some((
                "started_at >= datetime('now', '-60 days') AND started_at < datetime('now', '-30 days')",
                "started_at >= datetime('now', '-30 days')",
            )),
            Self::Month => Some((
                "started_at >= datetime('now', 'start of month', '-1 month') AND started_at < datetime('now', 'start of month')",
                "started_at >= datetime('now', 'start of month')",
            )),
            Self::All => None,
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

/// A single day's cost data for the bar chart.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct DailyCost {
    pub date: String,
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
    pub daily_costs: Vec<DailyCost>,
    pub activity_breakdown: Vec<ActivityBreakdown>,
    pub top_sessions: Vec<TopSession>,
    pub tool_usage: Vec<ToolUsageBreakdown>,
}
