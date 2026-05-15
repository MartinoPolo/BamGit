/// Resolves Option<Option<T>>: None = keep existing, Some(None) = clear, Some(Some(v)) = set
pub fn resolve_nullable_field<T>(update_value: Option<Option<T>>, existing_value: Option<T>) -> Option<T> {
    match update_value {
        None => existing_value,
        Some(new_value) => new_value,
    }
}

/// Validates that a string is a valid 6-digit hex color (e.g., "#FF00AA").
pub fn validate_hex_color(color: &str) -> Result<(), String> {
    let bytes = color.as_bytes();
    if bytes.len() != 7 {
        return Err(format!(
            "Invalid hex color length: expected 7 characters (e.g. #FF00AA), got {}",
            bytes.len()
        ));
    }
    if bytes[0] != b'#' {
        return Err(format!("Hex color must start with '#', got '{}'", color));
    }
    for &byte in &bytes[1..] {
        if !byte.is_ascii_hexdigit() {
            return Err(format!("Invalid hex character in color '{}'", color));
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_nullable_field_none_keeps_existing() {
        let existing: Option<String> = Some("existing".to_string());
        let result = resolve_nullable_field(None, existing);
        assert_eq!(result.as_deref(), Some("existing"));
    }

    #[test]
    fn resolve_nullable_field_some_none_clears() {
        let existing: Option<String> = Some("existing".to_string());
        let result = resolve_nullable_field(Some(None), existing);
        assert_eq!(result, None);
    }

    #[test]
    fn resolve_nullable_field_some_some_sets_new() {
        let existing: Option<String> = Some("existing".to_string());
        let result = resolve_nullable_field(Some(Some("new".to_string())), existing);
        assert_eq!(result.as_deref(), Some("new"));
    }

    #[test]
    fn resolve_nullable_field_none_preserves_none() {
        let existing: Option<String> = None;
        let result: Option<String> = resolve_nullable_field(None, existing);
        assert_eq!(result, None);
    }

    #[test]
    fn validate_hex_color_accepts_valid() {
        assert!(validate_hex_color("#FF00AA").is_ok());
        assert!(validate_hex_color("#000000").is_ok());
        assert!(validate_hex_color("#ffffff").is_ok());
        assert!(validate_hex_color("#a1B2c3").is_ok());
    }

    #[test]
    fn validate_hex_color_rejects_missing_hash() {
        assert!(validate_hex_color("FF00AA").is_err());
    }

    #[test]
    fn validate_hex_color_rejects_wrong_length() {
        assert!(validate_hex_color("#FFF").is_err());
        assert!(validate_hex_color("#FF00AABB").is_err());
    }

    #[test]
    fn validate_hex_color_rejects_invalid_chars() {
        assert!(validate_hex_color("#GGHHII").is_err());
        assert!(validate_hex_color("#12345Z").is_err());
    }
}
