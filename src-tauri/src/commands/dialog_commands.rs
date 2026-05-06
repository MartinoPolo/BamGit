use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn pick_folder(app: AppHandle) -> Result<Option<String>, String> {
    let folder = tauri::async_runtime::spawn_blocking(move || {
        app.dialog().file().blocking_pick_folder()
    })
    .await
    .map_err(|error| error.to_string())?;

    Ok(folder.map(|path| path.to_string()))
}
