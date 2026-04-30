use rusqlite::Row;
use tauri::State;
use uuid::Uuid;

use crate::database::connection::DatabaseState;
use crate::models::portfolio::{AddRepoToPortfolioRequest, PortfolioDashboardPointer};

fn row_to_pointer(row: &Row) -> Result<PortfolioDashboardPointer, rusqlite::Error> {
    Ok(PortfolioDashboardPointer {
        id: row.get(0)?,
        portfolio_dashboard_id: row.get(1)?,
        repo_dashboard_id: row.get(2)?,
        sort_order: row.get(3)?,
    })
}

#[tauri::command]
pub fn add_repo_to_portfolio(
    state: State<DatabaseState>,
    request: AddRepoToPortfolioRequest,
) -> Result<PortfolioDashboardPointer, String> {
    let connection = state.write()?;
    let id = Uuid::new_v4().to_string();

    connection
        .execute(
            "INSERT INTO portfolio_dashboard_pointers (id, portfolio_dashboard_id, repo_dashboard_id)
             VALUES (?1, ?2, ?3)",
            rusqlite::params![id, request.portfolio_dashboard_id, request.repo_dashboard_id],
        )
        .map_err(|error| format!("Failed to add repo to portfolio: {error}"))?;

    connection
        .query_row(
            "SELECT id, portfolio_dashboard_id, repo_dashboard_id, sort_order \
             FROM portfolio_dashboard_pointers WHERE id = ?1",
            [&id],
            |row| row_to_pointer(row),
        )
        .map_err(|error| format!("Failed to read created pointer: {error}"))
}

#[tauri::command]
pub fn remove_repo_from_portfolio(
    state: State<DatabaseState>,
    portfolio_dashboard_id: String,
    repo_dashboard_id: String,
) -> Result<(), String> {
    let connection = state.write()?;

    let rows_affected = connection
        .execute(
            "DELETE FROM portfolio_dashboard_pointers WHERE portfolio_dashboard_id = ?1 AND repo_dashboard_id = ?2",
            rusqlite::params![portfolio_dashboard_id, repo_dashboard_id],
        )
        .map_err(|error| format!("Failed to remove repo from portfolio: {error}"))?;

    if rows_affected == 0 {
        return Err("ERR_PORTFOLIO_NOT_FOUND".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn get_portfolio_repos(
    state: State<DatabaseState>,
    portfolio_dashboard_id: String,
) -> Result<Vec<PortfolioDashboardPointer>, String> {
    let connection = state.read()?;

    let mut statement = connection
        .prepare(
            "SELECT id, portfolio_dashboard_id, repo_dashboard_id, sort_order \
             FROM portfolio_dashboard_pointers WHERE portfolio_dashboard_id = ?1 ORDER BY sort_order",
        )
        .map_err(|error| format!("Failed to prepare query: {error}"))?;

    let pointers = statement
        .query_map([&portfolio_dashboard_id], |row| row_to_pointer(row))
        .map_err(|error| format!("Failed to query portfolio repos: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read pointer row: {error}"))?;

    Ok(pointers)
}
