mod commands;
mod database;
mod models;

use commands::dashboard_commands;
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
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            dashboard_commands::create_dashboard,
            dashboard_commands::get_dashboards,
            dashboard_commands::get_dashboard,
            dashboard_commands::update_dashboard,
            dashboard_commands::delete_dashboard,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
