use std::path::Path;
use std::process::Command;

use super::error::GitError;
use super::types::{is_unsafe_branch_ref, WorktreeInfo};

fn run_git_command(working_directory: &Path, args: &[&str]) -> Result<String, GitError> {
    let output = Command::new("git")
        .args(args)
        .current_dir(working_directory)
        .output()
        .map_err(|error| GitError::CommandFailed(format!("Failed to spawn git: {error}")))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError::CommandFailed(format!(
            "git {} exited with {}: {}",
            args.first().unwrap_or(&""),
            output.status,
            stderr.trim()
        )));
    }

    String::from_utf8(output.stdout)
        .map_err(|error| GitError::InvalidOutput(format!("Non-UTF8 git output: {error}")))
}

/// Returns exit code without treating non-zero as error.
fn run_git_command_with_exit_code(
    working_directory: &Path,
    args: &[&str],
) -> Result<(i32, String), GitError> {
    let output = Command::new("git")
        .args(args)
        .current_dir(working_directory)
        .output()
        .map_err(|error| GitError::CommandFailed(format!("Failed to spawn git: {error}")))?;

    let code = output.status.code().unwrap_or(-1);
    let stdout = String::from_utf8(output.stdout)
        .map_err(|error| GitError::InvalidOutput(format!("Non-UTF8 git output: {error}")))?;

    Ok((code, stdout))
}

/// Count commits that `branch_name` is behind `base_branch` on the remote.
/// Uses explicit refs instead of HEAD to work correctly in worktree setups.
pub fn get_behind_base_count(
    working_directory: &Path,
    branch_name: &str,
    base_branch: &str,
) -> Result<i64, GitError> {
    if is_unsafe_branch_ref(branch_name) {
        return Err(GitError::UnsafeBranchRef(branch_name.to_string()));
    }
    if is_unsafe_branch_ref(base_branch) {
        return Err(GitError::UnsafeBranchRef(base_branch.to_string()));
    }

    let range = format!("refs/heads/{branch_name}..origin/{base_branch}");
    let output = run_git_command(working_directory, &["rev-list", "--count", &range])?;

    output
        .trim()
        .parse::<i64>()
        .map_err(|error| GitError::InvalidOutput(format!("Cannot parse count: {error}")))
}

/// Returns `true` if merge-tree detects conflicts (exit code 1),
/// `false` if clean (exit code 0), error otherwise.
/// Uses explicit branch ref instead of HEAD.
pub fn detect_merge_conflicts(
    working_directory: &Path,
    branch_name: &str,
    base_branch: &str,
) -> Result<bool, GitError> {
    if is_unsafe_branch_ref(branch_name) {
        return Err(GitError::UnsafeBranchRef(branch_name.to_string()));
    }
    if is_unsafe_branch_ref(base_branch) {
        return Err(GitError::UnsafeBranchRef(base_branch.to_string()));
    }

    let branch_ref = format!("refs/heads/{branch_name}");
    let remote_ref = format!("origin/{base_branch}");
    let (exit_code, _stdout) = run_git_command_with_exit_code(
        working_directory,
        &["merge-tree", "--write-tree", &branch_ref, &remote_ref],
    )?;

    match exit_code {
        0 => Ok(false),
        1 => Ok(true),
        other => Err(GitError::CommandFailed(format!(
            "git merge-tree exited with unexpected code: {other}"
        ))),
    }
}

pub fn verify_branch_ref(working_directory: &Path, branch_name: &str) -> Result<bool, GitError> {
    if is_unsafe_branch_ref(branch_name) {
        return Err(GitError::UnsafeBranchRef(branch_name.to_string()));
    }

    let ref_path = format!("refs/heads/{branch_name}");
    let (exit_code, _stdout) =
        run_git_command_with_exit_code(working_directory, &["rev-parse", "--verify", &ref_path])?;

    Ok(exit_code == 0)
}

pub fn list_worktrees(working_directory: &Path) -> Result<Vec<WorktreeInfo>, GitError> {
    let output = run_git_command(working_directory, &["worktree", "list", "--porcelain"])?;
    Ok(parse_worktree_porcelain(&output))
}

pub fn resolve_repo_root(working_directory: &Path) -> Result<String, GitError> {
    let output = run_git_command(working_directory, &["rev-parse", "--show-toplevel"])?;
    Ok(output.trim().to_string())
}

fn parse_worktree_porcelain(output: &str) -> Vec<WorktreeInfo> {
    let mut worktrees = Vec::new();
    let mut current_path: Option<String> = None;
    let mut current_head: Option<String> = None;
    let mut current_branch: Option<String> = None;
    let mut is_bare = false;

    for line in output.lines() {
        if let Some(path) = line.strip_prefix("worktree ") {
            // Flush previous entry
            if let Some(path_value) = current_path.take() {
                worktrees.push(WorktreeInfo {
                    path: path_value,
                    head_commit: current_head.take(),
                    branch: current_branch.take(),
                    is_bare,
                });
                is_bare = false;
            }
            current_path = Some(path.to_string());
        } else if let Some(head) = line.strip_prefix("HEAD ") {
            current_head = Some(head.to_string());
        } else if let Some(branch) = line.strip_prefix("branch ") {
            current_branch = Some(branch.to_string());
        } else if line == "bare" {
            is_bare = true;
        }
    }

    // Flush last entry
    if let Some(path_value) = current_path {
        worktrees.push(WorktreeInfo {
            path: path_value,
            head_commit: current_head,
            branch: current_branch,
            is_bare,
        });
    }

    worktrees
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_branch_name_starting_with_dash_for_behind_count() {
        let result = get_behind_base_count(Path::new("."), "feature", "--malicious");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), GitError::UnsafeBranchRef(_)));
    }

    #[test]
    fn rejects_unsafe_branch_for_behind_count() {
        let result = get_behind_base_count(Path::new("."), "--malicious", "main");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), GitError::UnsafeBranchRef(_)));
    }

    #[test]
    fn rejects_branch_name_starting_with_dash_for_merge_conflicts() {
        let result = detect_merge_conflicts(Path::new("."), "feature", "--malicious");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), GitError::UnsafeBranchRef(_)));
    }

    #[test]
    fn rejects_unsafe_branch_for_merge_conflicts() {
        let result = detect_merge_conflicts(Path::new("."), "--malicious", "main");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), GitError::UnsafeBranchRef(_)));
    }

    #[test]
    fn rejects_branch_name_starting_with_dash_for_verify() {
        let result = verify_branch_ref(Path::new("."), "--malicious");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), GitError::UnsafeBranchRef(_)));
    }

    #[test]
    fn parses_empty_worktree_output() {
        let result = parse_worktree_porcelain("");
        assert!(result.is_empty());
    }

    #[test]
    fn parses_single_worktree() {
        let output = "worktree /home/user/repo\nHEAD abc123def\nbranch refs/heads/main\n\n";
        let result = parse_worktree_porcelain(output);

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].path, "/home/user/repo");
        assert_eq!(result[0].head_commit.as_deref(), Some("abc123def"));
        assert_eq!(result[0].branch.as_deref(), Some("refs/heads/main"));
        assert!(!result[0].is_bare);
    }

    #[test]
    fn parses_multiple_worktrees() {
        let output = "\
worktree /home/user/repo
HEAD abc123
branch refs/heads/main

worktree /home/user/repo-wt
HEAD def456
branch refs/heads/feature

";
        let result = parse_worktree_porcelain(output);

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].path, "/home/user/repo");
        assert_eq!(result[0].branch.as_deref(), Some("refs/heads/main"));
        assert_eq!(result[1].path, "/home/user/repo-wt");
        assert_eq!(result[1].branch.as_deref(), Some("refs/heads/feature"));
    }

    #[test]
    fn parses_bare_worktree() {
        let output = "worktree /home/user/repo.git\nbare\n\n";
        let result = parse_worktree_porcelain(output);

        assert_eq!(result.len(), 1);
        assert!(result[0].is_bare);
        assert!(result[0].head_commit.is_none());
        assert!(result[0].branch.is_none());
    }

    // Integration tests that run against the actual repo
    #[test]
    fn verify_branch_ref_finds_existing_branch_in_this_repo() {
        let repo_root = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
        let result = verify_branch_ref(repo_root, "4-git-cli-integration");
        assert!(result.is_ok());
    }

    #[test]
    fn list_worktrees_succeeds_in_this_repo() {
        let repo_root = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
        let result = list_worktrees(repo_root);
        assert!(result.is_ok());
        let worktrees = result.unwrap();
        assert!(!worktrees.is_empty(), "Should find at least one worktree");
    }

    #[test]
    fn resolve_repo_root_succeeds_in_this_repo() {
        let repo_root = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
        let result = resolve_repo_root(repo_root);
        assert!(result.is_ok());
        assert!(!result.unwrap().is_empty());
    }
}
