use std::process::Command;

use super::shared::validate_hex_color;

/// Opens a terminal window at the given folder path.
///
/// On Windows, uses Windows Terminal (`wt`) with optional tab color.
/// On macOS, uses `open -a Terminal`.
/// On Linux, tries `x-terminal-emulator`, falling back to `xterm`.
#[tauri::command]
pub fn open_terminal(folder_path: String, tab_color: Option<String>) -> Result<(), String> {
    if let Some(ref color) = tab_color {
        validate_hex_color(color)?;
    }

    if cfg!(target_os = "windows") {
        spawn_windows_terminal(&folder_path, tab_color.as_deref())
    } else if cfg!(target_os = "macos") {
        spawn_macos_terminal(&folder_path)
    } else {
        spawn_linux_terminal(&folder_path)
    }
}

fn spawn_windows_terminal(folder_path: &str, tab_color: Option<&str>) -> Result<(), String> {
    let mut command = Command::new("wt");
    command.args(["-w", "0", "nt", "-d", folder_path]);

    if let Some(color) = tab_color {
        command.args(["--tabColor", color]);
    }

    command
        .spawn()
        .map_err(|error| format!("Could not open Windows Terminal: {error}"))?;

    Ok(())
}

fn spawn_macos_terminal(folder_path: &str) -> Result<(), String> {
    Command::new("open")
        .args(["-a", "Terminal", folder_path])
        .spawn()
        .map_err(|error| format!("Could not open Terminal: {error}"))?;

    Ok(())
}

fn spawn_linux_terminal(folder_path: &str) -> Result<(), String> {
    let result = Command::new("x-terminal-emulator")
        .args(["--working-directory", folder_path])
        .spawn();

    match result {
        Ok(_) => Ok(()),
        Err(_) => {
            Command::new("xterm")
                .current_dir(folder_path)
                .spawn()
                .map_err(|error| format!("Could not open terminal: {error}"))?;

            Ok(())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_hex_color_accepts_lowercase_hex() {
        assert!(validate_hex_color("#ff0000").is_ok());
    }

    #[test]
    fn validate_hex_color_accepts_uppercase_hex() {
        assert!(validate_hex_color("#FF00AA").is_ok());
    }

    #[test]
    fn validate_hex_color_accepts_mixed_case_hex() {
        assert!(validate_hex_color("#aB12Cd").is_ok());
    }

    #[test]
    fn validate_hex_color_rejects_short_hex() {
        assert!(validate_hex_color("#fff").is_err());
    }

    #[test]
    fn validate_hex_color_rejects_missing_hash() {
        assert!(validate_hex_color("ff0000").is_err());
    }

    #[test]
    fn validate_hex_color_rejects_invalid_characters() {
        assert!(validate_hex_color("#gggggg").is_err());
    }

    #[test]
    fn validate_hex_color_rejects_empty_string() {
        assert!(validate_hex_color("").is_err());
    }

    #[test]
    fn validate_hex_color_rejects_too_long_hex() {
        assert!(validate_hex_color("#ff00001").is_err());
    }
}
