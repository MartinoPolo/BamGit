/// Resolves Option<Option<T>>: None = keep existing, Some(None) = clear, Some(Some(v)) = set
pub fn resolve_nullable_field<T>(update_value: Option<Option<T>>, existing_value: Option<T>) -> Option<T> {
    match update_value {
        None => existing_value,
        Some(new_value) => new_value,
    }
}
