use std::fs;
use std::path::{Path, PathBuf};

fn validate_local_folder(local_folder: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(local_folder);
    let canonical = path
        .canonicalize()
        .map_err(|e| format!("Invalid local folder path: {e}"))?;
    if !canonical.is_dir() {
        return Err(format!(
            "Local folder is not a directory: {}",
            canonical.display()
        ));
    }
    Ok(canonical)
}

fn raw_requirements_path(validated_folder: &Path) -> PathBuf {
    validated_folder.join(".mpx").join("RAW_REQUIREMENTS.md")
}

#[tauri::command]
pub fn read_raw_requirements(local_folder: String) -> Result<String, String> {
    let folder = validate_local_folder(&local_folder)?;
    let path = raw_requirements_path(&folder);
    if !path.exists() {
        return Ok(String::new());
    }
    fs::read_to_string(&path)
        .map_err(|error| format!("Failed to read RAW_REQUIREMENTS.md: {error}"))
}

#[tauri::command]
pub fn write_raw_requirements(local_folder: String, content: String) -> Result<(), String> {
    let folder = validate_local_folder(&local_folder)?;
    let path = raw_requirements_path(&folder);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Failed to create .mpx directory: {error}"))?;
    }
    fs::write(&path, content)
        .map_err(|error| format!("Failed to write RAW_REQUIREMENTS.md: {error}"))
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

    #[test]
    fn rejects_nonexistent_folder() {
        let result = read_raw_requirements("/nonexistent/path/xyz".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn rejects_nonexistent_folder_for_write() {
        let result =
            write_raw_requirements("/nonexistent/path/xyz".to_string(), "test".to_string());
        assert!(result.is_err());
    }
}
