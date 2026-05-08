use std::path::{Path, PathBuf};

/// Play a sound file from the given path with volume control. Blocks until playback completes.
/// Must be called from a blocking context (not async executor).
pub fn play_sound_blocking(sound_path: &Path, volume: f32) -> Result<(), String> {
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

    sink.set_volume(volume);
    sink.append(source);
    sink.sleep_until_end();

    Ok(())
}

/// Resolve the sound file path for a given filename.
/// Search order: resources/sounds/<filename> → app_data_dir/sound-packs/<filename>
pub fn resolve_sound_path(
    sound_file: &str,
    resource_directory: &Path,
    app_data_directory: &Path,
) -> Option<PathBuf> {
    // Check bundled sounds first
    let bundled_sounds_directory = resource_directory.join("sounds");
    let resolved = bundled_sounds_directory.join(sound_file);
    if resolved.starts_with(&bundled_sounds_directory) && resolved.exists() {
        return Some(resolved);
    }

    // Check user-installed sound packs
    let user_packs_directory = app_data_directory.join("sound-packs");
    let resolved = user_packs_directory.join(sound_file);
    if resolved.starts_with(&user_packs_directory) && resolved.exists() {
        return Some(resolved);
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

        let app_data = tempfile::tempdir().unwrap();
        let result = resolve_sound_path(
            "urgent.wav",
            temp_directory.path(),
            app_data.path(),
        );
        assert!(result.is_some());
        assert!(result.unwrap().ends_with("urgent.wav"));
    }

    #[test]
    fn resolve_sound_path_finds_file_in_subdirectory() {
        let temp_directory = tempfile::tempdir().unwrap();
        let grove_directory = temp_directory.path().join("sounds").join("grove");
        fs::create_dir_all(&grove_directory).unwrap();
        fs::write(grove_directory.join("alert.wav"), b"fake wav").unwrap();

        let app_data = tempfile::tempdir().unwrap();
        let result = resolve_sound_path(
            "grove/alert.wav",
            temp_directory.path(),
            app_data.path(),
        );
        assert!(result.is_some());
        assert!(result.unwrap().ends_with("alert.wav"));
    }

    #[test]
    fn resolve_sound_path_finds_user_pack_file() {
        let resource_dir = tempfile::tempdir().unwrap();
        fs::create_dir_all(resource_dir.path().join("sounds")).unwrap();

        let app_data = tempfile::tempdir().unwrap();
        let pack_dir = app_data.path().join("sound-packs").join("peon");
        fs::create_dir_all(&pack_dir).unwrap();
        fs::write(pack_dir.join("work.wav"), b"fake wav").unwrap();

        let result = resolve_sound_path(
            "peon/work.wav",
            resource_dir.path(),
            app_data.path(),
        );
        assert!(result.is_some());
        assert!(result.unwrap().ends_with("work.wav"));
    }

    #[test]
    fn resolve_sound_path_returns_none_for_missing_file() {
        let temp_directory = tempfile::tempdir().unwrap();
        let app_data = tempfile::tempdir().unwrap();

        let result = resolve_sound_path(
            "nonexistent.wav",
            temp_directory.path(),
            app_data.path(),
        );
        assert!(result.is_none());
    }

    #[test]
    fn resolve_sound_path_blocks_path_traversal() {
        let temp_directory = tempfile::tempdir().unwrap();
        let sounds_directory = temp_directory.path().join("sounds");
        fs::create_dir_all(&sounds_directory).unwrap();

        let app_data = tempfile::tempdir().unwrap();
        let result = resolve_sound_path(
            "../../../etc/passwd",
            temp_directory.path(),
            app_data.path(),
        );
        assert_eq!(result, None);
    }

    #[test]
    fn resolve_sound_path_prefers_bundled_over_user_pack() {
        let resource_dir = tempfile::tempdir().unwrap();
        let sounds_dir = resource_dir.path().join("sounds").join("grove");
        fs::create_dir_all(&sounds_dir).unwrap();
        fs::write(sounds_dir.join("test.wav"), b"bundled").unwrap();

        let app_data = tempfile::tempdir().unwrap();
        let pack_dir = app_data.path().join("sound-packs").join("grove");
        fs::create_dir_all(&pack_dir).unwrap();
        fs::write(pack_dir.join("test.wav"), b"user").unwrap();

        let result = resolve_sound_path(
            "grove/test.wav",
            resource_dir.path(),
            app_data.path(),
        );
        assert!(result.is_some());
        let path = result.unwrap();
        assert!(path.starts_with(resource_dir.path()));
    }
}
