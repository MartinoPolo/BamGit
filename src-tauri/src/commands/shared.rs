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
