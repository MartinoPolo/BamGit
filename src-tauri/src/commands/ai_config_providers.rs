use std::path::{Path, PathBuf};

use crate::models::ai_config::ProviderKind;

pub struct ProviderDirs {
    pub user: Option<PathBuf>,
    pub project: Option<PathBuf>,
    pub compat_project: Vec<PathBuf>,
}

pub fn user_dir(kind: ProviderKind) -> Option<PathBuf> {
    let home = dirs::home_dir()?;
    Some(match kind {
        ProviderKind::ClaudeCode => home.join(".claude"),
        ProviderKind::OpenCode => home.join(".config").join("opencode"),
        ProviderKind::Codex => home.join(".codex"),
        ProviderKind::Cursor => home.join(".cursor"),
    })
}

pub fn project_dir(kind: ProviderKind, workspace_root: &Path) -> PathBuf {
    match kind {
        ProviderKind::ClaudeCode => workspace_root.join(".claude"),
        ProviderKind::OpenCode => workspace_root.join(".opencode"),
        ProviderKind::Codex => workspace_root.join(".codex"),
        ProviderKind::Cursor => workspace_root.join(".cursor"),
    }
}

/// Cross-provider compat folders to scan for skills (per issue #282 notes).
pub fn skill_compat_dirs(kind: ProviderKind, workspace_root: &Path) -> Vec<PathBuf> {
    match kind {
        ProviderKind::ClaudeCode => vec![workspace_root.join(".agents").join("skills")],
        ProviderKind::OpenCode => vec![
            workspace_root.join(".claude").join("skills"),
            workspace_root.join(".agents").join("skills"),
        ],
        ProviderKind::Codex => vec![workspace_root.join(".agents").join("skills")],
        ProviderKind::Cursor => vec![
            workspace_root.join(".agents").join("skills"),
            workspace_root.join(".claude").join("skills"),
        ],
    }
}

pub fn provider_dirs(kind: ProviderKind, workspace_root: Option<&Path>) -> ProviderDirs {
    let user = user_dir(kind).filter(|d| d.is_dir());
    let project = workspace_root
        .map(|root| project_dir(kind, root))
        .filter(|d| d.is_dir());
    let compat_project = workspace_root
        .map(|root| {
            skill_compat_dirs(kind, root)
                .into_iter()
                .filter(|d| d.is_dir())
                .collect()
        })
        .unwrap_or_default();
    ProviderDirs {
        user,
        project,
        compat_project,
    }
}
