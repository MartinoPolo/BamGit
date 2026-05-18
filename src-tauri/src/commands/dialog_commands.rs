use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn open_file(
    app: AppHandle,
    filter_name: String,
    filter_extensions: Vec<String>,
) -> Result<Option<String>, String> {
    let path = tauri::async_runtime::spawn_blocking(move || {
        let ext_refs: Vec<&str> = filter_extensions.iter().map(|s| s.as_str()).collect();
        app.dialog()
            .file()
            .add_filter(&filter_name, &ext_refs)
            .blocking_pick_file()
    })
    .await
    .map_err(|error| error.to_string())?;

    if let Some(file_path) = path {
        let path_str = file_path.to_string();
        let content = tauri::async_runtime::spawn_blocking(move || {
            const MAX_FILE_SIZE: u64 = 1_048_576; // 1 MB
            let metadata = std::fs::metadata(&path_str)
                .map_err(|error| format!("Cannot read file metadata: {error}"))?;
            if metadata.len() > MAX_FILE_SIZE {
                return Err(format!(
                    "File is too large ({:.1} MB). Maximum allowed size is 1 MB.",
                    metadata.len() as f64 / 1_048_576.0
                ));
            }
            std::fs::read_to_string(&path_str)
                .map_err(|error| format!("Failed to read file: {error}"))
        })
        .await
        .map_err(|error| error.to_string())??;
        Ok(Some(content))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn pick_folder(app: AppHandle) -> Result<Option<String>, String> {
    let folder = tauri::async_runtime::spawn_blocking(move || {
        app.dialog().file().blocking_pick_folder()
    })
    .await
    .map_err(|error| error.to_string())?;

    Ok(folder.map(|path| path.to_string()))
}

#[tauri::command]
pub async fn save_file(
    app: AppHandle,
    content: String,
    default_name: String,
    filter_name: String,
    filter_extensions: Vec<String>,
) -> Result<Option<String>, String> {
    let path = tauri::async_runtime::spawn_blocking(move || {
        let ext_refs: Vec<&str> = filter_extensions.iter().map(|s| s.as_str()).collect();
        app.dialog()
            .file()
            .set_file_name(&default_name)
            .add_filter(&filter_name, &ext_refs)
            .blocking_save_file()
    })
    .await
    .map_err(|error| error.to_string())?;

    if let Some(file_path) = path {
        let path_str = file_path.to_string();
        std::fs::write(&path_str, content).map_err(|error| error.to_string())?;
        Ok(Some(path_str))
    } else {
        Ok(None)
    }
}
