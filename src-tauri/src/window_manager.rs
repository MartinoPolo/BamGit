use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

const OVERVIEW_LABEL: &str = "overview";
const WORKSPACE_PREFIX: &str = "workspace-";

pub const DEFAULT_WINDOW_WIDTH: f64 = 1600.0;
pub const DEFAULT_WINDOW_HEIGHT: f64 = 900.0;
pub const APP_NAME: &str = "Grovekeeper";

pub fn overview_label() -> &'static str {
    OVERVIEW_LABEL
}

pub fn workspace_label(dashboard_id: &str) -> String {
    format!("{WORKSPACE_PREFIX}{dashboard_id}")
}

pub fn open_or_focus_window(
    app: &AppHandle,
    label: &str,
    url: &str,
    title: &str,
    width: f64,
    height: f64,
) -> Result<(), String> {
    if let Some(existing) = app.get_webview_window(label) {
        existing
            .set_focus()
            .map_err(|error| format!("Failed to focus window: {error}"))?;
        return Ok(());
    }

    let webview_url = WebviewUrl::App(url.into());
    WebviewWindowBuilder::new(app, label, webview_url)
        .title(title)
        .inner_size(width, height)
        .center()
        .build()
        .map_err(|error| format!("Failed to create window: {error}"))?;

    Ok(())
}

pub fn open_or_focus_window_with_position(
    app: &AppHandle,
    label: &str,
    url: &str,
    title: &str,
    width: f64,
    height: f64,
    x: Option<i32>,
    y: Option<i32>,
) -> Result<(), String> {
    if let Some(existing) = app.get_webview_window(label) {
        existing
            .set_focus()
            .map_err(|error| format!("Failed to focus window: {error}"))?;
        return Ok(());
    }

    let webview_url = WebviewUrl::App(url.into());
    let mut builder = WebviewWindowBuilder::new(app, label, webview_url)
        .title(title)
        .inner_size(width, height);

    if let (Some(px), Some(py)) = (x, y) {
        builder = builder.position(px as f64, py as f64);
    } else {
        builder = builder.center();
    }

    builder
        .build()
        .map_err(|error| format!("Failed to create window: {error}"))?;

    Ok(())
}

pub fn close_window(app: &AppHandle, label: &str) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(label) {
        window
            .close()
            .map_err(|error| format!("Failed to close window: {error}"))?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn overview_label_returns_constant() {
        assert_eq!(overview_label(), "overview");
    }

    #[test]
    fn workspace_label_includes_dashboard_id() {
        assert_eq!(workspace_label("abc-123"), "workspace-abc-123");
    }

}
