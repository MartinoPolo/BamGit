use std::path::Path;
use std::process::Command;

use super::error::GitError;
use super::types::is_unsafe_branch_ref;

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

}
