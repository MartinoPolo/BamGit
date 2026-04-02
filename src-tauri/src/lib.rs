mod commands;
mod database;
mod models;
mod session;

use commands::{dashboard_commands, issue_commands, portfolio_commands, session_commands};
use session::manager::SessionManager;
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
            app.manage(SessionManager::new());
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
            session_commands::spawn_session,
            session_commands::send_message,
            session_commands::interrupt_session,
            session_commands::terminate_session,
            session_commands::get_sessions,
            session_commands::get_session,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                let manager = app_handle.state::<SessionManager>();
                tauri::async_runtime::block_on(manager.cleanup_all());
            }
        });
}
