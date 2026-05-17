#![deny(unused_imports, dead_code, clippy::disallowed_methods)]

mod commands;
mod database;
mod git;
mod metrics;
mod models;
mod notification;
mod process;
mod session;
mod window_manager;

use commands::{
    action_commands, ai_config_commands, ai_config_mutations, character_pack_commands,
    color_palette_commands, dashboard_commands, dependency_commands, dialog_commands,
    git_status_commands, github_auth_commands, github_commands, issue_commands,
    keyboard_shortcut_commands, label_shape_mapping_commands, metrics_commands,
    notification_commands, portfolio_commands, process_commands, raw_requirements_commands,
    seed_commands, session_commands, settings_commands, terminal_commands, window_commands,
    workspace_command_commands, worktree_commands,
};
use std::sync::Arc;

use database::connection::DatabaseState;
use git::fetch_coordinator::FetchCoordinator;
use git::github_client::GitHubClient;
use metrics::pricing::PricingEngine;
use models::setting::{STARTUP_BEHAVIOR_KEY, STARTUP_BEHAVIOR_LAST_WORKSPACE, STARTUP_BEHAVIOR_OVERVIEW};
use notification::playback_queue;
use notification::service::NotificationService;
use process::manager::ProcessManager;
use session::discovery_polling::DiscoveryPoller;
use session::manager::SessionManager;
use tauri::Manager;
use window_manager::{APP_NAME, DEFAULT_WINDOW_HEIGHT, DEFAULT_WINDOW_WIDTH};

pub type SharedPricingEngine = Arc<tokio::sync::Mutex<PricingEngine>>;


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_mcp_bridge::init())
        .setup(|app| {
            // Register single-instance plugin in setup so we have access to app handle
            #[cfg(desktop)]
            {
                let handle = app.handle().clone();
                handle.plugin(tauri_plugin_single_instance::init(
                    |app_handle, args, _cwd| {
                        // Parse --dashboard-id=<id> from args
                        let dashboard_id = args.iter().find_map(|arg| {
                            arg.strip_prefix("--dashboard-id=").map(String::from)
                        });

                        if let Some(id) = dashboard_id {
                            let label = window_manager::workspace_label(&id);
                            let _ = window_manager::open_or_focus_window(
                                app_handle,
                                &label,
                                "index.html",
                                APP_NAME,
                                DEFAULT_WINDOW_WIDTH,
                                DEFAULT_WINDOW_HEIGHT,
                            );
                        } else {
                            let _ = window_manager::open_or_focus_window(
                                app_handle,
                                window_manager::overview_label(),
                                "/overview",
                                APP_NAME,
                                DEFAULT_WINDOW_WIDTH,
                                DEFAULT_WINDOW_HEIGHT,
                            );
                        }
                    },
                ))?;
            }

            let app_data_directory = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data directory");

            let database_state = database::connection::initialize_database(app_data_directory.clone())
                .expect("Failed to initialize database");

            let resource_directory = app
                .path()
                .resource_dir()
                .expect("Failed to resolve resource directory");

            // Determine startup behavior before managing state
            let startup_behavior = {
                let connection = database_state.read().unwrap_or_else(|e| panic!("{e}"));
                connection
                    .query_row(
                        "SELECT value FROM user_settings WHERE key = ?1",
                        [STARTUP_BEHAVIOR_KEY],
                        |row| row.get::<_, String>(0),
                    )
                    .unwrap_or_else(|_| STARTUP_BEHAVIOR_OVERVIEW.to_string())
            };

            let mut pricing_engine = PricingEngine::new(&app_data_directory);
            {
                let conn = database_state.read().unwrap_or_else(|e| panic!("{e}"));
                pricing_engine.load_overrides_from_database(&conn);
            }

            app.manage(database_state);
            app.manage(Arc::new(tokio::sync::Mutex::new(pricing_engine)) as SharedPricingEngine);
            app.manage(SessionManager::new());
            app.manage(ProcessManager::new());
            app.manage(FetchCoordinator::new());
            app.manage(GitHubClient::new());
            app.manage(DiscoveryPoller::new());
            app.manage(NotificationService::new(
                resource_directory,
                app_data_directory.clone(),
            ));
            app.manage(playback_queue::LazyPlaybackQueue::new());

            // Auto-start discovery polling (3-second interval)
            let poller = app.state::<DiscoveryPoller>();
            poller.start(app.handle().clone(), 3000);

            // Startup behavior: restore last workspace windows or just show overview
            if startup_behavior == STARTUP_BEHAVIOR_LAST_WORKSPACE {
                let db = app.state::<DatabaseState>();
                window_commands::restore_workspace_windows(app.handle(), db.inner());
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            dashboard_commands::create_dashboard,
            dashboard_commands::get_dashboards,
            dashboard_commands::get_dashboard,
            dashboard_commands::update_dashboard,
            dashboard_commands::archive_dashboard,
            dashboard_commands::unarchive_dashboard,
            dashboard_commands::delete_dashboard,
            issue_commands::create_issue,
            issue_commands::get_issues_for_dashboard,
            issue_commands::get_issue,
            issue_commands::update_issue,
            issue_commands::delete_issue,
            issue_commands::archive_issue,
            issue_commands::unarchive_issue,
            issue_commands::update_issue_character,
            issue_commands::toggle_issue_sound_mute,
            portfolio_commands::add_repo_to_portfolio,
            portfolio_commands::remove_repo_from_portfolio,
            portfolio_commands::get_portfolio_repos,
            session_commands::spawn_session,
            session_commands::send_message,
            session_commands::interrupt_session,
            session_commands::terminate_session,
            session_commands::respond_to_request,
            session_commands::respond_to_user_input,
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
            github_commands::search_github_issues,
            github_commands::sync_all_github_state,
            worktree_commands::setup_worktree,
            worktree_commands::remove_worktree,
            worktree_commands::refresh_worktree_state,
            worktree_commands::get_prunable_issues,
            worktree_commands::update_peacock_color,
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
            notification_commands::get_notification_volume,
            notification_commands::set_notification_volume,
            notification_commands::get_sound_volume_override,
            notification_commands::set_sound_volume_override,
            notification_commands::get_all_sound_volume_overrides,
            notification_commands::list_sound_packs,
            notification_commands::install_sound_pack,
            notification_commands::remove_sound_pack,
            character_pack_commands::get_character_packs,
            character_pack_commands::get_character_pack_with_sounds,
            character_pack_commands::create_character_pack,
            character_pack_commands::update_character_pack,
            character_pack_commands::delete_character_pack,
            character_pack_commands::toggle_character_pack_enabled,
            character_pack_commands::save_character_pack_sounds,
            character_pack_commands::upload_character_avatar,
            character_pack_commands::scan_folder_for_characters,
            character_pack_commands::bulk_import_characters,
            character_pack_commands::import_sound_files,
            color_palette_commands::get_all_color_palettes,
            color_palette_commands::get_color_palette,
            color_palette_commands::create_color_palette,
            color_palette_commands::update_color_palette,
            color_palette_commands::delete_color_palette,
            color_palette_commands::get_next_available_color,
            color_palette_commands::get_used_colors_for_dashboard,
            terminal_commands::open_terminal,
            label_shape_mapping_commands::get_label_shape_mappings,
            label_shape_mapping_commands::upsert_label_shape_mapping,
            keyboard_shortcut_commands::get_custom_bindings,
            keyboard_shortcut_commands::upsert_custom_binding,
            keyboard_shortcut_commands::delete_custom_binding,
            window_commands::open_workspace_window,
            window_commands::close_workspace_window,
            window_commands::get_window_bindings,
            window_commands::save_window_geometry,
            window_commands::get_overview_data,
            dependency_commands::get_issue_dependencies,
            raw_requirements_commands::read_raw_requirements,
            raw_requirements_commands::write_raw_requirements,
            seed_commands::seed_demo_workspace,
            seed_commands::delete_demo_workspace,
            dialog_commands::open_file,
            dialog_commands::pick_folder,
            dialog_commands::save_file,
            github_commands::list_user_repos,
            github_commands::search_github_repos,
            github_auth_commands::github_device_flow_start,
            github_auth_commands::github_device_flow_poll,
            github_auth_commands::github_auth_status,
            github_auth_commands::github_logout,
            ai_config_commands::discover_ai_config,
            ai_config_commands::get_custom_discovery_paths,
            ai_config_commands::set_custom_discovery_paths,
            ai_config_commands::detect_installed_providers,
            ai_config_mutations::inspect_symlink,
            ai_config_mutations::write_ai_config_file,
            ai_config_mutations::delete_ai_config_file,
            ai_config_mutations::delete_hook_from_settings,
            ai_config_mutations::delete_mcp_from_settings,
            ai_config_mutations::set_skill_override,
            ai_config_mutations::read_provider_settings,
            ai_config_mutations::write_provider_settings,
            metrics_commands::get_usage_dashboard,
            metrics_commands::get_achievements,
            metrics_commands::import_historical_sessions,
            metrics_commands::get_exchange_rates,
            process_commands::run_workspace_command,
            process_commands::kill_workspace_process,
            process_commands::get_running_processes,
            process_commands::get_processes_for_issue,
            process_commands::get_process_logs,
            workspace_command_commands::create_workspace_command,
            workspace_command_commands::get_workspace_commands_for_dashboard,
            workspace_command_commands::update_workspace_command,
            workspace_command_commands::delete_workspace_command,
            workspace_command_commands::reorder_workspace_commands,
            settings_commands::get_user_setting,
            settings_commands::set_user_setting,
            settings_commands::delete_user_setting,
            settings_commands::get_all_user_settings,
            settings_commands::get_workspace_setting,
            settings_commands::set_workspace_setting,
            settings_commands::delete_workspace_setting,
            settings_commands::get_all_workspace_settings,
            settings_commands::get_workspace_overridden_keys,
            settings_commands::get_resolved_setting,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                let poller = app_handle.state::<DiscoveryPoller>();
                poller.stop();

                let queue = app_handle.state::<playback_queue::LazyPlaybackQueue>();
                queue.shutdown();

                let pm = app_handle.state::<ProcessManager>();
                pm.cleanup_all();

                let manager = app_handle.state::<SessionManager>();
                tauri::async_runtime::block_on(manager.cleanup_all());
            }
        });
}
