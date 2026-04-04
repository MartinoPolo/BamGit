use std::path::{Path, PathBuf};

/// Play a .wav file from the given path. Blocks until playback completes.
/// Must be called from a blocking context (not async executor).
pub fn play_sound_blocking(sound_path: &Path) -> Result<(), String> {
    use rodio::{Decoder, OutputStream, Sink};
    use std::fs::File;
    use std::io::BufReader;

    let file = File::open(sound_path)
        .map_err(|error| format!("Failed to open sound file {}: {error}", sound_path.display()))?;
    let reader = BufReader::new(file);
    let source = Decoder::new(reader)
        .map_err(|error| format!("Failed to decode sound file: {error}"))?;

    let (_stream, stream_handle) = OutputStream::try_default()
        .map_err(|error| format!("Failed to open audio output: {error}"))?;
    let sink = Sink::try_new(&stream_handle)
        .map_err(|error| format!("Failed to create audio sink: {error}"))?;

    sink.append(source);
    sink.sleep_until_end();

    Ok(())
}

/// Resolve the sound file path for an event type.
/// Checks: custom path (absolute) -> resources/sounds/<filename>.
pub fn resolve_sound_path(
    sound_file: &str,
    resource_directory: &Path,
) -> Option<PathBuf> {
    let custom_path = PathBuf::from(sound_file);
    if custom_path.is_absolute() && custom_path.exists() {
        return Some(custom_path);
    }

    let bundled_path = resource_directory.join("sounds").join(sound_file);
    if bundled_path.exists() {
        return Some(bundled_path);
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn resolve_sound_path_finds_bundled_file() {
        let temp_directory = tempfile::tempdir().unwrap();
        let sounds_directory = temp_directory.path().join("sounds");
        fs::create_dir_all(&sounds_directory).unwrap();
        fs::write(sounds_directory.join("urgent.wav"), b"fake wav").unwrap();

        let result = resolve_sound_path("urgent.wav", &temp_directory.path().to_path_buf());
        assert!(result.is_some());
        assert!(result.unwrap().ends_with("urgent.wav"));
    }

    #[test]
    fn resolve_sound_path_returns_none_for_missing_file() {
        let temp_directory = tempfile::tempdir().unwrap();

        let result = resolve_sound_path("nonexistent.wav", &temp_directory.path().to_path_buf());
        assert!(result.is_none());
    }

    #[test]
    fn resolve_sound_path_prefers_absolute_custom_path() {
        let temp_directory = tempfile::tempdir().unwrap();
        let custom_file = temp_directory.path().join("my_sound.wav");
        fs::write(&custom_file, b"custom wav").unwrap();

        // Also create a bundled version with the same name
        let sounds_directory = temp_directory.path().join("sounds");
        fs::create_dir_all(&sounds_directory).unwrap();
        fs::write(sounds_directory.join("my_sound.wav"), b"bundled wav").unwrap();

        let result = resolve_sound_path(
            custom_file.to_str().unwrap(),
            &temp_directory.path().to_path_buf(),
        );
        assert_eq!(result, Some(custom_file));
    }
}
