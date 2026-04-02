mod commands;
mod database;
mod git;
mod models;

use commands::{dashboard_commands, git_status_commands, github_commands, issue_commands, portfolio_commands};
use git::fetch_coordinator::FetchCoordinator;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_directory = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data directory");

            let database_state = database::connection::initialize_database(app_data_directory)
                .expect("Failed to initialize database");

            app.manage(database_state);
            app.manage(FetchCoordinator::new());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            dashboard_commands::create_dashboard,
            dashboard_commands::get_dashboards,
            dashboard_commands::get_dashboard,
            dashboard_commands::update_dashboard,
            dashboard_commands::delete_dashboard,
            issue_commands::create_issue,
            issue_commands::get_issues_for_dashboard,
            issue_commands::get_issue,
            issue_commands::update_issue,
            issue_commands::delete_issue,
            issue_commands::archive_issue,
            issue_commands::unarchive_issue,
            portfolio_commands::add_repo_to_portfolio,
            portfolio_commands::remove_repo_from_portfolio,
            portfolio_commands::get_portfolio_repos,
            git_status_commands::refresh_git_status,
            git_status_commands::get_cached_git_status,
            git_status_commands::get_all_git_statuses_for_dashboard,
            github_commands::get_github_status_cache,
            github_commands::get_all_github_status_caches,
            github_commands::check_gh_availability,
            github_commands::fetch_issue_state,
            github_commands::fetch_pr_for_branch,
            github_commands::fetch_assigned_issues,
            github_commands::sync_all_github_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
