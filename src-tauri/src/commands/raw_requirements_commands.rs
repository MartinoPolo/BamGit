use std::fs;
use std::path::PathBuf;

fn raw_requirements_path(local_folder: &str) -> PathBuf {
    PathBuf::from(local_folder)
        .join(".mpx")
        .join("RAW_REQUIREMENTS.md")
}

#[tauri::command]
pub fn read_raw_requirements(local_folder: String) -> Result<String, String> {
    let path = raw_requirements_path(&local_folder);
    if !path.exists() {
        return Ok(String::new());
    }
    fs::read_to_string(&path).map_err(|error| format!("Failed to read RAW_REQUIREMENTS.md: {error}"))
}

#[tauri::command]
pub fn write_raw_requirements(local_folder: String, content: String) -> Result<(), String> {
    let path = raw_requirements_path(&local_folder);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Failed to create .mpx directory: {error}"))?;
    }
    fs::write(&path, content).map_err(|error| format!("Failed to write RAW_REQUIREMENTS.md: {error}"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::sync::atomic::{AtomicU32, Ordering};

    static TEST_COUNTER: AtomicU32 = AtomicU32::new(0);

    fn temp_dir() -> PathBuf {
        let unique = TEST_COUNTER.fetch_add(1, Ordering::Relaxed);
        let dir = std::env::temp_dir().join(format!(
            "grovekeeper_raw_req_{}_{unique}",
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn read_returns_empty_string_when_file_missing() {
        let dir = temp_dir();
        let result = read_raw_requirements(dir.to_string_lossy().to_string());
        assert_eq!(result.unwrap(), "");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn write_creates_mpx_directory_and_file() {
        let dir = temp_dir();
        let content = "## 2026-05-01 14:30\nTest note\n";
        write_raw_requirements(dir.to_string_lossy().to_string(), content.to_string()).unwrap();

        let path = dir.join(".mpx").join("RAW_REQUIREMENTS.md");
        assert!(path.exists());
        assert_eq!(fs::read_to_string(&path).unwrap(), content);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn round_trip_write_then_read() {
        let dir = temp_dir();
        let content = "## 2026-05-01 14:30\nFirst note\n---\n## 2026-05-01 13:15\nSecond note\n";
        write_raw_requirements(dir.to_string_lossy().to_string(), content.to_string()).unwrap();
        let result = read_raw_requirements(dir.to_string_lossy().to_string()).unwrap();
        assert_eq!(result, content);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn write_overwrites_existing_content() {
        let dir = temp_dir();
        write_raw_requirements(dir.to_string_lossy().to_string(), "old".to_string()).unwrap();
        write_raw_requirements(dir.to_string_lossy().to_string(), "new".to_string()).unwrap();
        let result = read_raw_requirements(dir.to_string_lossy().to_string()).unwrap();
        assert_eq!(result, "new");
        let _ = fs::remove_dir_all(&dir);
    }
}
