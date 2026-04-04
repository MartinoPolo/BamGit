mod commands;
mod database;
mod git;
mod models;
mod notification;
mod session;

use commands::{
    action_commands, color_palette_commands, dashboard_commands, git_status_commands,
    github_commands, issue_commands, notification_commands, portfolio_commands, session_commands,
    worktree_commands,
};
use git::fetch_coordinator::FetchCoordinator;
use notification::service::NotificationService;
use session::discovery_polling::DiscoveryPoller;
use session::manager::SessionManager;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let app_data_directory = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data directory");

            let database_state = database::connection::initialize_database(app_data_directory)
                .expect("Failed to initialize database");

            let resource_directory = app
                .path()
                .resource_dir()
                .expect("Failed to resolve resource directory");

            app.manage(database_state);
            app.manage(SessionManager::new());
            app.manage(FetchCoordinator::new());
            app.manage(DiscoveryPoller::new());
            app.manage(NotificationService::new(resource_directory));

            // Auto-start discovery polling (3-second interval)
            let poller = app.state::<DiscoveryPoller>();
            poller.start(app.handle().clone(), 3000);

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
            session_commands::discover_external_sessions,
            session_commands::adopt_session,
            session_commands::start_discovery_polling,
            session_commands::stop_discovery_polling,
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
            worktree_commands::setup_worktree,
            worktree_commands::remove_worktree,
            worktree_commands::refresh_worktree_state,
            worktree_commands::get_prunable_issues,
            action_commands::create_action,
            action_commands::get_actions_for_dashboard,
            action_commands::get_action,
            action_commands::update_action,
            action_commands::delete_action,
            action_commands::reorder_actions,
            action_commands::execute_action,
            notification_commands::get_notification_configs,
            notification_commands::update_notification_config,
            notification_commands::test_notification_sound,
            color_palette_commands::get_all_color_palettes,
            color_palette_commands::get_color_palette,
            color_palette_commands::create_color_palette,
            color_palette_commands::update_color_palette,
            color_palette_commands::delete_color_palette,
            color_palette_commands::get_next_available_color,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                let poller = app_handle.state::<DiscoveryPoller>();
                poller.stop();

                let manager = app_handle.state::<SessionManager>();
                tauri::async_runtime::block_on(manager.cleanup_all());
            }
        });
}
