// TODO(PRD #91): Wire notification events from git/GitHub triggers:
//   pr.ready, pr.merged, pr.review-requested, merge.conflict,
//   branch.behind-base, github.issue-assigned, github.trigger-received
pub mod branch_detection;
pub mod cli_operations;
pub mod error;
pub mod fetch_coordinator;
pub mod github_client;
pub mod types;
