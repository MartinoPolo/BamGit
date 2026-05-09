use crate::models::github::GitHubUser;

#[derive(Debug, Clone)]
pub enum AuthMode {
    OAuth { token: String, user: GitHubUser },
    Cli,
    NotConnected,
}

pub struct GitHubClient {
    auth_mode: tokio::sync::RwLock<AuthMode>,
    http_client: reqwest::Client,
}

impl GitHubClient {
    pub fn new() -> Self {
        Self {
            auth_mode: tokio::sync::RwLock::new(AuthMode::NotConnected),
            http_client: reqwest::Client::new(),
        }
    }

    pub async fn auth_mode(&self) -> AuthMode {
        self.auth_mode.read().await.clone()
    }

    pub async fn set_auth_mode(&self, mode: AuthMode) {
        *self.auth_mode.write().await = mode;
    }

    pub fn http_client(&self) -> &reqwest::Client {
        &self.http_client
    }

    pub async fn is_oauth(&self) -> bool {
        matches!(&*self.auth_mode.read().await, AuthMode::OAuth { .. })
    }

    /// Returns the current OAuth user's login, or None if not in OAuth mode.
    pub async fn current_user_login(&self) -> Option<String> {
        let mode = self.auth_mode.read().await;
        match &*mode {
            AuthMode::OAuth { user, .. } => Some(user.login.clone()),
            _ => None,
        }
    }

    /// GET a GitHub REST API endpoint. `path` should start with `/` (e.g. `/user`).
    pub async fn api_get(&self, path: &str) -> Result<serde_json::Value, String> {
        let token = self.require_oauth_token().await?;
        let url = format!("https://api.github.com{path}");
        let response = self
            .http_client
            .get(&url)
            .header("Authorization", format!("Bearer {token}"))
            .header("Accept", "application/vnd.github+json")
            .header("User-Agent", "Grovekeeper")
            .send()
            .await
            .map_err(|error| format!("API request failed: {error}"))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("GitHub API error {status}: {body}"));
        }

        response
            .json()
            .await
            .map_err(|error| format!("Failed to parse API response: {error}"))
    }

    /// POST a GraphQL query to the GitHub API.
    pub async fn graphql(&self, query: &str) -> Result<serde_json::Value, String> {
        let token = self.require_oauth_token().await?;
        let body = serde_json::json!({ "query": query });
        let response = self
            .http_client
            .post("https://api.github.com/graphql")
            .header("Authorization", format!("Bearer {token}"))
            .header("User-Agent", "Grovekeeper")
            .json(&body)
            .send()
            .await
            .map_err(|error| format!("GraphQL request failed: {error}"))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("GitHub GraphQL error {status}: {body}"));
        }

        response
            .json()
            .await
            .map_err(|error| format!("Failed to parse GraphQL response: {error}"))
    }

    async fn require_oauth_token(&self) -> Result<String, String> {
        let mode = self.auth_mode.read().await;
        match &*mode {
            AuthMode::OAuth { token, .. } => Ok(token.clone()),
            _ => Err("OAuth not active — use gh CLI fallback".to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn new_client_starts_as_not_connected() {
        let client = GitHubClient::new();
        assert!(matches!(client.auth_mode().await, AuthMode::NotConnected));
        assert!(!client.is_oauth().await);
    }

    #[tokio::test]
    async fn set_oauth_mode() {
        let client = GitHubClient::new();
        client
            .set_auth_mode(AuthMode::OAuth {
                token: "test-token".to_string(),
                user: GitHubUser {
                    login: "testuser".to_string(),
                    avatar_url: "https://example.com/avatar.png".to_string(),
                },
            })
            .await;
        assert!(client.is_oauth().await);
    }

    #[tokio::test]
    async fn set_cli_mode() {
        let client = GitHubClient::new();
        client.set_auth_mode(AuthMode::Cli).await;
        assert!(!client.is_oauth().await);
        assert!(matches!(client.auth_mode().await, AuthMode::Cli));
    }

    #[tokio::test]
    async fn require_token_fails_when_not_connected() {
        let client = GitHubClient::new();
        let result = client.require_oauth_token().await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn require_token_succeeds_when_oauth() {
        let client = GitHubClient::new();
        client
            .set_auth_mode(AuthMode::OAuth {
                token: "my-token".to_string(),
                user: GitHubUser {
                    login: "user".to_string(),
                    avatar_url: "https://example.com/a.png".to_string(),
                },
            })
            .await;
        let token = client.require_oauth_token().await.unwrap();
        assert_eq!(token, "my-token");
    }
}
