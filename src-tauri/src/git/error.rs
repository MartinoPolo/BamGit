use thiserror::Error;

#[derive(Debug, Error)]
pub enum GitError {
    #[error("Git command failed: {0}")]
    CommandFailed(String),

    #[error("Invalid git output: {0}")]
    InvalidOutput(String),

    #[error("Repository not found at path: {0}")]
    RepositoryNotFound(String),

    #[error("Unsafe branch ref: {0}")]
    UnsafeBranchRef(String),

    #[error("git2 error: {0}")]
    Git2(#[from] git2::Error),
}
