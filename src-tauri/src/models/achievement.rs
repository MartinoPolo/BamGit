use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// All possible achievement types.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum AchievementKind {
    FirstSeed,
    Planted10Trees,
    Planted50Trees,
    GreenThumb,
    ForestKeeper,
    ConflictResolver,
    OneShotWonder,
    CacheMaster,
    BigSpender,
    SpeedRunner,
}

impl_sql_enum!(AchievementKind {
    FirstSeed => "first-seed",
    Planted10Trees => "planted-10-trees",
    Planted50Trees => "planted-50-trees",
    GreenThumb => "green-thumb",
    ForestKeeper => "forest-keeper",
    ConflictResolver => "conflict-resolver",
    OneShotWonder => "one-shot-wonder",
    CacheMaster => "cache-master",
    BigSpender => "big-spender",
    SpeedRunner => "speed-runner",
});

impl AchievementKind {
    pub fn threshold(&self) -> i64 {
        match self {
            Self::FirstSeed => 1,
            Self::Planted10Trees => 10,
            Self::Planted50Trees => 50,
            Self::GreenThumb => 10,
            Self::ForestKeeper => 5,
            Self::ConflictResolver => 3,
            Self::OneShotWonder => 5,
            Self::CacheMaster => 1,
            Self::BigSpender => 100,
            Self::SpeedRunner => 1,
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            Self::FirstSeed => "First Seed",
            Self::Planted10Trees => "Planted 10 Trees",
            Self::Planted50Trees => "Planted 50 Trees",
            Self::GreenThumb => "Green Thumb",
            Self::ForestKeeper => "Forest Keeper",
            Self::ConflictResolver => "Conflict Resolver",
            Self::OneShotWonder => "One-Shot Wonder",
            Self::CacheMaster => "Cache Master",
            Self::BigSpender => "Big Spender",
            Self::SpeedRunner => "Speed Runner",
        }
    }

    pub fn description(&self) -> &'static str {
        match self {
            Self::FirstSeed => "Created your first issue",
            Self::Planted10Trees => "Created 10 issues",
            Self::Planted50Trees => "Created 50 issues",
            Self::GreenThumb => "Completed 10 sessions via Grovekeeper",
            Self::ForestKeeper => "Resolved 5 HITL issues",
            Self::ConflictResolver => "Auto-resolved 3 merge conflicts",
            Self::OneShotWonder => "5 sessions with 100% one-shot rate",
            Self::CacheMaster => "A session with 90%+ cache hit ratio",
            Self::BigSpender => "Spent $100 total on AI sessions",
            Self::SpeedRunner => "Completed a session in under 60 seconds",
        }
    }

    pub fn all() -> &'static [AchievementKind] {
        &[
            Self::FirstSeed,
            Self::Planted10Trees,
            Self::Planted50Trees,
            Self::GreenThumb,
            Self::ForestKeeper,
            Self::ConflictResolver,
            Self::OneShotWonder,
            Self::CacheMaster,
            Self::BigSpender,
            Self::SpeedRunner,
        ]
    }
}

/// An achievement record from the database.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct Achievement {
    pub kind: AchievementKind,
    pub display_name: String,
    pub description: String,
    #[ts(type = "number")]
    pub threshold: i64,
    #[ts(type = "number")]
    pub progress: i64,
    pub unlocked_at: Option<String>,
}
