use std::path::Path;

use git2::Repository;

use super::error::GitError;
use super::types::{is_unsafe_branch_ref, BranchStatus};

pub fn resolve_branch_status(
    repo_path: &Path,
    branch_name: &str,
) -> Result<BranchStatus, GitError> {
    if is_unsafe_branch_ref(branch_name) {
        return Err(GitError::UnsafeBranchRef(branch_name.to_string()));
    }

    let repository = Repository::discover(repo_path).map_err(|error| {
        GitError::RepositoryNotFound(format!("{}: {error}", repo_path.display()))
    })?;

    let local_ref = format!("refs/heads/{branch_name}");
    let remote_ref = format!("refs/remotes/origin/{branch_name}");

    let local_exists = repository.find_reference(&local_ref).is_ok();
    let remote_exists = repository.find_reference(&remote_ref).is_ok();

    if local_exists && remote_exists {
        return Ok(BranchStatus::Active);
    }

    if local_exists && !remote_exists {
        // Check if there was a configured upstream that's gone
        if let Ok(branch) = repository.find_branch(branch_name, git2::BranchType::Local) {
            if branch.upstream().is_err() {
                // Had upstream config but remote ref is gone
                let config = repository.config().ok();
                let merge_key = format!("branch.{branch_name}.merge");
                let has_upstream_config = config
                    .as_ref()
                    .and_then(|c| c.get_string(&merge_key).ok())
                    .is_some();

                if has_upstream_config {
                    return Ok(BranchStatus::RemoteGone);
                }
            }
        }
        return Ok(BranchStatus::Local);
    }

    if !local_exists && !remote_exists {
        return Ok(BranchStatus::Deleted);
    }

    // Remote exists but local doesn't — unusual but not unknown
    Ok(BranchStatus::Unknown)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_unsafe_branch_ref() {
        let result = resolve_branch_status(Path::new("."), "--evil");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), GitError::UnsafeBranchRef(_)));
    }

    #[test]
    fn returns_error_for_nonexistent_repo() {
        let result = resolve_branch_status(Path::new("/tmp/nonexistent-repo-xyz"), "main");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), GitError::RepositoryNotFound(_)));
    }

    #[test]
    fn detects_deleted_branch() {
        let repo_root = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
        let result = resolve_branch_status(repo_root, "this-branch-definitely-does-not-exist-xyz");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), BranchStatus::Deleted);
    }

    #[test]
    fn detects_existing_branch() {
        let repo_root = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
        // The current branch must exist locally
        let result = resolve_branch_status(repo_root, "4-git-cli-integration");
        assert!(result.is_ok());
        let status = result.unwrap();
        // Either Active (if pushed) or Local (if not yet pushed)
        assert!(
            status == BranchStatus::Active || status == BranchStatus::Local,
            "Expected Active or Local, got {:?}",
            status
        );
    }
}
