use tauri::State;

use crate::git::github_client::{AuthMode, GitHubClient};
use crate::models::github::{DeviceFlowStartResult, GhAuthStatus, GitHubUser};

use super::github_commands::run_gh_command;

const GITHUB_CLIENT_ID: &str = match option_env!("GROVEKEEPER_GITHUB_CLIENT_ID") {
    Some(id) => id,
    None => "PLACEHOLDER_CLIENT_ID",
};
const GITHUB_DEVICE_FLOW_SCOPES: &str = "repo read:org read:user";
const KEYRING_SERVICE: &str = "grovekeeper";
const KEYRING_USERNAME: &str = "github-oauth-token";

// ─── Keyring helpers ────────────────────────────────────────────────────────

fn store_token(token: &str) -> Result<(), String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
        .map_err(|error| format!("Failed to create keyring entry: {error}"))?;
    entry
        .set_password(token)
        .map_err(|error| format!("Failed to store token in keychain: {error}"))
}

fn get_stored_token() -> Result<Option<String>, String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
        .map_err(|error| format!("Failed to create keyring entry: {error}"))?;
    match entry.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(format!("Failed to read token from keychain: {error}")),
    }
}

fn delete_stored_token() -> Result<(), String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
        .map_err(|error| format!("Failed to create keyring entry: {error}"))?;
    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(format!("Failed to delete token from keychain: {error}")),
    }
}

// ─── GitHub API helpers ─────────────────────────────────────────────────────

async fn fetch_github_user(http: &reqwest::Client, token: &str) -> Result<GitHubUser, String> {
    let response = http
        .get("https://api.github.com/user")
        .header("Authorization", format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "Grovekeeper")
        .send()
        .await
        .map_err(|error| format!("Failed to fetch GitHub user: {error}"))?;

    if !response.status().is_success() {
        return Err(format!("GitHub API error: {}", response.status()));
    }

    response
        .json::<GitHubUser>()
        .await
        .map_err(|error| format!("Failed to parse user response: {error}"))
}

// ─── Tauri commands ─────────────────────────────────────────────────────────

#[tauri::command]
pub async fn github_device_flow_start(
    github_client: State<'_, GitHubClient>,
) -> Result<DeviceFlowStartResult, String> {
    let response = github_client
        .http_client()
        .post("https://github.com/login/device/code")
        .header("Accept", "application/json")
        .form(&[
            ("client_id", GITHUB_CLIENT_ID),
            ("scope", GITHUB_DEVICE_FLOW_SCOPES),
        ])
        .send()
        .await
        .map_err(|error| format!("Failed to start device flow: {error}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("GitHub returned error {status}: {body}"));
    }

    response
        .json::<DeviceFlowStartResult>()
        .await
        .map_err(|error| format!("Failed to parse device flow response: {error}"))
}

#[tauri::command]
pub async fn github_device_flow_poll(
    github_client: State<'_, GitHubClient>,
    device_code: String,
) -> Result<GhAuthStatus, String> {
    let response = github_client
        .http_client()
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .form(&[
            ("client_id", GITHUB_CLIENT_ID),
            ("device_code", device_code.as_str()),
            ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
        ])
        .send()
        .await
        .map_err(|error| format!("Failed to poll for token: {error}"))?;

    let body: serde_json::Value = response
        .json()
        .await
        .map_err(|error| format!("Failed to parse poll response: {error}"))?;

    if let Some(error) = body.get("error").and_then(|e| e.as_str()) {
        return Err(error.to_string());
    }

    let token = body
        .get("access_token")
        .and_then(|t| t.as_str())
        .ok_or("Missing access_token in response")?
        .to_string();

    let user = fetch_github_user(github_client.http_client(), &token).await?;

    store_token(&token)?;

    github_client
        .set_auth_mode(AuthMode::OAuth {
            token,
            user: user.clone(),
        })
        .await;

    Ok(GhAuthStatus::OAuthConnected { user })
}

#[tauri::command]
pub async fn github_auth_status(
    github_client: State<'_, GitHubClient>,
) -> Result<GhAuthStatus, String> {
    // Fast path: already initialized this session
    let current = github_client.auth_mode().await;
    match current {
        AuthMode::OAuth { user, .. } => return Ok(GhAuthStatus::OAuthConnected { user }),
        AuthMode::Cli => return Ok(GhAuthStatus::CliConnected),
        AuthMode::NotConnected => {}
    }

    // Try stored OAuth token
    if let Some(token) = get_stored_token()? {
        match fetch_github_user(github_client.http_client(), &token).await {
            Ok(user) => {
                github_client
                    .set_auth_mode(AuthMode::OAuth {
                        token,
                        user: user.clone(),
                    })
                    .await;
                return Ok(GhAuthStatus::OAuthConnected { user });
            }
            Err(_) => {
                let _ = delete_stored_token();
            }
        }
    }

    // Try gh CLI
    if run_gh_command(&["auth", "status"]).await.is_ok() {
        github_client.set_auth_mode(AuthMode::Cli).await;
        return Ok(GhAuthStatus::CliConnected);
    }

    Ok(GhAuthStatus::NotConnected)
}

#[tauri::command]
pub async fn github_logout(
    github_client: State<'_, GitHubClient>,
) -> Result<(), String> {
    delete_stored_token()?;
    github_client.set_auth_mode(AuthMode::NotConnected).await;
    Ok(())
}
