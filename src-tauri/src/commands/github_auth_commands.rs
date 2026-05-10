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
const KEYRING_USER_INFO: &str = "github-oauth-user";

// ─── Keyring helpers ────────────────────────────────────────────────────────

fn store_credentials(token: &str, user: &GitHubUser) -> Result<(), String> {
    let token_entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
        .map_err(|error| format!("Failed to create keyring entry: {error}"))?;
    token_entry
        .set_password(token)
        .map_err(|error| format!("Failed to store token in keychain: {error}"))?;

    let user_json = serde_json::to_string(user)
        .map_err(|error| format!("Failed to serialize user: {error}"))?;
    let user_entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER_INFO)
        .map_err(|error| format!("Failed to create keyring entry: {error}"))?;
    user_entry
        .set_password(&user_json)
        .map_err(|error| format!("Failed to store user info in keychain: {error}"))?;

    Ok(())
}

fn get_stored_credentials() -> Result<Option<(String, GitHubUser)>, String> {
    let token_entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
        .map_err(|error| format!("Failed to create keyring entry: {error}"))?;
    let token = match token_entry.get_password() {
        Ok(token) => token,
        Err(keyring::Error::NoEntry) => return Ok(None),
        Err(error) => return Err(format!("Failed to read token from keychain: {error}")),
    };

    let user_entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER_INFO)
        .map_err(|error| format!("Failed to create keyring entry: {error}"))?;
    match user_entry.get_password() {
        Ok(json) => {
            if let Ok(user) = serde_json::from_str::<GitHubUser>(&json) {
                Ok(Some((token, user)))
            } else {
                Ok(Some((token, GitHubUser { login: "unknown".to_string(), avatar_url: String::new() })))
            }
        }
        Err(_) => {
            Ok(Some((token, GitHubUser { login: "unknown".to_string(), avatar_url: String::new() })))
        }
    }
}

fn delete_stored_credentials() -> Result<(), String> {
    for username in [KEYRING_USERNAME, KEYRING_USER_INFO] {
        let entry = keyring::Entry::new(KEYRING_SERVICE, username)
            .map_err(|error| format!("Failed to create keyring entry: {error}"))?;
        match entry.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => {}
            Err(error) => return Err(format!("Failed to delete from keychain: {error}")),
        }
    }
    Ok(())
}

// ─── GitHub API helpers ─────────────────────────────────────────────────────

enum FetchUserError {
    /// Token is invalid/revoked (401/403) — should delete stored token
    AuthRejected(String),
    /// Network/transient error — token may still be valid
    Transient(String),
}

async fn fetch_github_user(
    http: &reqwest::Client,
    token: &str,
) -> Result<GitHubUser, FetchUserError> {
    let response = http
        .get("https://api.github.com/user")
        .header("Authorization", format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "Grovekeeper")
        .send()
        .await
        .map_err(|error| FetchUserError::Transient(format!("Network error: {error}")))?;

    let status = response.status();
    if status == reqwest::StatusCode::UNAUTHORIZED || status == reqwest::StatusCode::FORBIDDEN {
        return Err(FetchUserError::AuthRejected(format!(
            "Token rejected: {status}"
        )));
    }
    if !status.is_success() {
        return Err(FetchUserError::Transient(format!(
            "GitHub API error: {status}"
        )));
    }

    response
        .json::<GitHubUser>()
        .await
        .map_err(|error| FetchUserError::Transient(format!("Parse error: {error}")))
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

    let user = fetch_github_user(github_client.http_client(), &token)
        .await
        .map_err(|error| match error {
            FetchUserError::AuthRejected(message) | FetchUserError::Transient(message) => message,
        })?;

    store_credentials(&token, &user)?;

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
    let current = github_client.auth_mode().await;
    match current {
        AuthMode::OAuth { ref user, .. } => {
            return Ok(GhAuthStatus::OAuthConnected { user: user.clone() });
        }
        AuthMode::Cli => {
            return Ok(GhAuthStatus::CliConnected);
        }
        AuthMode::NotConnected => {}
    }

    if let Some((token, user)) = get_stored_credentials()? {
        github_client
            .set_auth_mode(AuthMode::OAuth {
                token,
                user: user.clone(),
            })
            .await;
        return Ok(GhAuthStatus::OAuthConnected { user });
    }

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
    delete_stored_credentials()?;
    github_client.set_auth_mode(AuthMode::NotConnected).await;
    Ok(())
}
