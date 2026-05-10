use std::collections::HashMap;

use serde::Serialize;
use tauri::{Manager, State};
use ts_rs::TS;

use crate::database::connection::DatabaseState;
use crate::metrics::{achievement_tracker, currency, historical_import, queries};
use crate::models::achievement::Achievement;
use crate::models::metrics::{GroupBy, MetricsPeriod, UsageDashboardData};

#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct ImportSummary {
    pub providers: Vec<ProviderImportSummary>,
    #[ts(type = "number")]
    pub total_sessions: u64,
    #[ts(type = "number")]
    pub total_skipped: u64,
}

#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct ProviderImportSummary {
    pub provider: String,
    #[ts(type = "number")]
    pub sessions_imported: u64,
    #[ts(type = "number")]
    pub sessions_skipped: u64,
}

#[tauri::command]
pub fn get_usage_dashboard(
    state: State<DatabaseState>,
    period: MetricsPeriod,
    dashboard_id: Option<String>,
    group_by: Option<GroupBy>,
) -> Result<UsageDashboardData, String> {
    let connection = state.read()?;
    queries::query_usage_dashboard(
        &connection,
        &period,
        dashboard_id.as_deref(),
        &group_by.unwrap_or(GroupBy::None),
    )
    .map_err(|error| format!("Failed to query usage dashboard: {error}"))
}

#[tauri::command]
pub fn get_achievements(state: State<DatabaseState>) -> Result<Vec<Achievement>, String> {
    let connection = state.read()?;
    achievement_tracker::get_all_achievements(&connection)
        .map_err(|error| format!("Failed to query achievements: {error}"))
}

#[tauri::command]
pub fn import_historical_sessions(state: State<DatabaseState>) -> Result<ImportSummary, String> {
    let connection = state.write()?;
    let results = historical_import::import_all_providers(&connection);

    let mut total_sessions = 0u64;
    let mut total_skipped = 0u64;
    let mut providers = Vec::new();

    for r in results {
        total_sessions += r.result.sessions_imported;
        total_skipped += r.result.sessions_skipped;
        providers.push(ProviderImportSummary {
            provider: r.provider,
            sessions_imported: r.result.sessions_imported,
            sessions_skipped: r.result.sessions_skipped,
        });
    }

    Ok(ImportSummary {
        providers,
        total_sessions,
        total_skipped,
    })
}

#[tauri::command]
pub async fn get_exchange_rates(
    app_handle: tauri::AppHandle,
) -> Result<HashMap<String, f64>, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {e}"))?;
    let service = currency::CurrencyService::new(&app_data_dir);
    service
        .get_exchange_rates()
        .await
        .map_err(|e| format!("Failed to fetch exchange rates: {e}"))
}
