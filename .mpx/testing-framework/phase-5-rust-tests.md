# Phase 5 — Rust Backend Tests

**Status**: Not started
**Pre-requisite**: None (independent)
**Estimated sub-agents**: 6
**Run after**: Can run in parallel with Phases 1–4
**Run before**: Nothing

---

## Context

This phase adds `#[cfg(test)]` unit tests to the Rust backend (`src-tauri/src/`). Currently **zero Rust tests exist**. This is the most critical gap — the backend handles complex logic (dependency cycle detection, AI config discovery, GitHub sync, usage aggregation) with no automated verification.

### Running Rust Tests

```bash
cd src-tauri
cargo test
# Or from project root:
pnpm exec cargo test --manifest-path src-tauri/Cargo.toml
```

### Rust Test Structure

Tests live in the same file as the code being tested, inside a `#[cfg(test)]` module:

```rust
// src-tauri/src/commands/issues.rs

pub fn some_function(input: &str) -> Result<String, String> {
    // ... implementation
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_some_function_basic() {
        let result = some_function("input").unwrap();
        assert_eq!(result, "expected output");
    }

    #[test]
    fn test_some_function_error_case() {
        let result = some_function("");
        assert!(result.is_err());
    }
}
```

For tests that need SQLite, use an in-memory database:

```rust
use rusqlite::Connection;

fn setup_test_db() -> Connection {
    let conn = Connection::open_in_memory().expect("Failed to create test DB");
    crate::schema::create_tables(&conn).expect("Failed to create tables");
    crate::defaults::seed_defaults(&conn).expect("Failed to seed defaults");
    conn
}
```

### Conflict Reporting

Same format as CONVENTIONS.md §4. When a test reveals a bug in the implementation, fix the implementation and document in the Findings Report.

---

## Sub-agent Tasks

### Sub-agent 1 — Implement & Test Issue Dependency CRUD

**Location**: Search for `dependency`, `blocking`, `blocked_by`, `issue_dependency` in `src-tauri/src/`. Read all relevant files.
**Test file**: `#[cfg(test)]` module in the same file
**Priority**: 🔴 Critical

> **⚠️ Important**: Before writing any tests, audit the actual codebase. Search `src-tauri/src/` for `create_issue_dependency`, `add_dependency`, `issue_dependencies`. If the only tables/functions you find are basic many-to-many CRUD with no cycle guard, you have two options:
>
> 1. **Implement cycle detection** as part of this task (add the guard to the Rust function, then test it)
> 2. **Test what exists** (basic CRUD) and document the missing cycle guard in the Findings Report as a gap
>
> Do NOT write tests for behavior that does not exist yet without also implementing it.

**What to test** (basic CRUD — these should always exist):

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_dependency_creates_row() {
        let conn = setup_test_db();
        // Create issues A and B
        // Add A blocks B
        // Query dependencies for B, verify A is in the list
    }

    #[test]
    fn test_remove_dependency_deletes_row() {
        let conn = setup_test_db();
        // Create A blocks B, then remove it
        // Query confirms row gone
    }

    #[test]
    fn test_delete_issue_cascades_dependencies() {
        let conn = setup_test_db();
        // Create A blocks B, delete A
        // Query dependencies for B → empty (cascade)
    }
}
```

**If cycle detection guard is implemented**, additionally test:

```rust
    #[test]
    fn test_simple_cycle_rejected() {
        // A → B, then try B → A — must be rejected
        let conn = setup_test_db();
        // Add A→B: OK
        // Add B→A: Err
        assert!(add_dependency(&conn, "B", "A").is_err());
    }

    #[test]
    fn test_self_reference_rejected() {
        let conn = setup_test_db();
        assert!(add_dependency(&conn, "A", "A").is_err());
    }

    #[test]
    fn test_transitive_cycle_rejected() {
        let conn = setup_test_db();
        // A→B, B→C both OK; C→A must fail
    }

    #[test]
    fn test_valid_diamond_accepted() {
        // A→B, A→C, B→D, C→D is not a cycle
        let conn = setup_test_db();
        // All four should succeed
    }
```

---

### Sub-agent 2 — Issue CRUD & Label Serialization

**Location**: `src-tauri/src/commands/issues.rs` (or similar — search for `create_issue`, `update_issue`, `delete_issue`)
**Test file**: `#[cfg(test)]` module in the same file
**Priority**: 🔴 Critical

**What to test**:

```rust
#[test]
fn test_create_issue_defaults() {
    let conn = setup_test_db();
    let issue = create_issue(&conn, CreateIssueRequest {
        title: "Test Issue".to_string(),
        dashboard_id: "dash-1".to_string(),
        ..Default::default()
    }).unwrap();

    // worktree_state must default to 'none'
    assert_eq!(issue.worktree_state, "none");
    // status must default to 'active'
    assert_eq!(issue.status, "active");
    // sort_order must be assigned
    assert!(issue.sort_order >= 0);
}

#[test]
fn test_labels_json_round_trip() {
    let conn = setup_test_db();
    let labels_json = r#"[{"name":"bug","color":"#ff0000"}]"#;
    // Insert issue with labels as raw JSON string (that's how the DB stores it)
    let issue = create_issue(&conn, CreateIssueRequest {
        title: "Labeled Issue".to_string(),
        labels: Some(labels_json.to_string()),
        ..Default::default()
    }).unwrap();

    // When fetched back, labels should round-trip correctly
    let fetched = get_issue(&conn, &issue.id).unwrap();
    assert_eq!(fetched.labels.as_deref(), Some(labels_json));
}

#[test]
fn test_delete_issue_cascades_dependencies() {
    let conn = setup_test_db();
    // Create A and B, add A→B dependency
    // Delete A
    // Verify the dependency row no longer exists (cascade)
    let deps_after = get_dependencies_for_issue(&conn, "B").unwrap();
    assert!(deps_after.is_empty());
}

#[test]
fn test_archive_issue() {
    let conn = setup_test_db();
    // Create issue, archive it, verify status=archived
}

#[test]
fn test_update_issue_partial() {
    let conn = setup_test_db();
    // Create issue with title A and priority high
    // Update only the title to B (priority not in update request)
    // Verify: title=B, priority=high (unchanged)
}
```

---

### Sub-agent 3 — AI Config Discovery

**Location**: Search for `discover_ai_config` in `src-tauri/src/`. Read all related files completely.
**Test file**: `#[cfg(test)]` module — use `tempdir` or `tempfile` crate for filesystem tests
**Priority**: 🔴 Critical
**Note**: This is the most complex Rust module. It scans filesystems, parses YAML frontmatter, merges configs from multiple providers. Likely needs `tempdir` for filesystem isolation.

**Check Cargo.toml** for available test dependencies (`tempfile`, `assert_fs`, etc.). If `tempfile` is not listed, add it under `[dev-dependencies]`.

**What to test**:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::fs;

    fn setup_claude_config(dir: &TempDir) -> PathBuf {
        let claude_dir = dir.path().join(".claude");
        fs::create_dir_all(&claude_dir).unwrap();
        claude_dir
    }

    #[test]
    fn test_discover_claude_skills() {
        let tmp = TempDir::new().unwrap();
        let claude_dir = setup_claude_config(&tmp);

        // Skills live in `.claude/skills/` (primary) or `.claude/commands/` (legacy fallback)
        let skills_dir = claude_dir.join("skills");
        fs::create_dir_all(&skills_dir).unwrap();
        fs::write(skills_dir.join("my-skill.md"),
            "---\ndescription: My skill\n---\nDo this thing").unwrap();

        let result = discover_ai_config(tmp.path(), "claude-code").unwrap();
        assert_eq!(result.skills.len(), 1);
        assert_eq!(result.skills[0].name, "my-skill");
    }

    #[test]
    fn test_frontmatter_parsed_correctly() {
        // Test YAML frontmatter extraction from markdown files
        let content = "---\ndescription: Test skill\ndeprecated: true\n---\nContent";
        let parsed = parse_frontmatter(content).unwrap();
        assert_eq!(parsed.description, Some("Test skill".to_string()));
        assert_eq!(parsed.deprecated, Some(true));
    }

    #[test]
    fn test_deprecated_filename_detection() {
        // Files named *.deprecated.md should be marked as deprecated
        let tmp = TempDir::new().unwrap();
        // Create my-skill.deprecated.md
        // Discover → skill.deprecated == true
    }

    #[test]
    fn test_skill_override_project_wins() {
        let tmp = TempDir::new().unwrap();
        // Create user-level skill AND project-level skill with same name
        // Project-level wins over user-level (overrides it)
    }

    #[test]
    fn test_mcp_extraction_from_settings_json() {
        let tmp = TempDir::new().unwrap();
        let settings = r#"{
            "mcpServers": {
                "my-server": {
                    "command": "uvx",
                    "args": ["mcp-server-fetch"]
                }
            }
        }"#;
        // Write settings, discover, verify MCP server with stdio transport
    }

    #[test]
    fn test_mcp_transport_inference() {
        // command-based (has "command" field) → stdio
        // url-based (has "url" field, no "transport") → sse
        // url-based with explicit transport: "http" → http
        // Three distinct cases; test all three
    }

    #[test]
    fn test_malformed_yaml_handled_gracefully() {
        let tmp = TempDir::new().unwrap();
        // Write a file with invalid YAML frontmatter
        // Discover should NOT panic — either skip the file or return partial results
    }

    #[test]
    fn test_missing_directory_handled_gracefully() {
        // If .claude/ doesn't exist at all, discover returns empty config, no error
        let tmp = TempDir::new().unwrap();
        let result = discover_ai_config(tmp.path(), "claude-code");
        assert!(result.is_ok());
        assert_eq!(result.unwrap().skills.len(), 0);
    }

    #[test]
    fn test_rule_language_inference() {
        // typescript.md → language: "typescript"
        // python.md → language: "python"
        // unknown.md → language: None or "unknown"
    }
}
```

**Adapt all test cases** to the actual function signatures and struct names you find in the source. Do not guess — read the code first.

---

### Sub-agent 4 — Usage Aggregation & Filtering

**Location**: Search for `get_usage_dashboard` in `src-tauri/src/`
**Test file**: `#[cfg(test)]` module in the same file
**Priority**: 🟠 High

> **Read the source first**. The actual function signature may differ from the examples below. The `dashboard_id: Option<String>` parameter filters by workspace; when `None` all workspaces are included. Period filtering uses a `MetricsPeriod` enum (e.g. `MetricsPeriod::Week` for a 7-day window), not a string like `"7d"`. Adapt all test calls to match the actual signatures.

**What to test**:

```rust
#[test]
fn test_usage_grouped_by_provider() {
    let conn = setup_test_db();
    // Insert sessions with different providers and costs
    // Call get_usage_dashboard — verify costs are summed per provider
}

#[test]
fn test_usage_period_filtering_week() {
    let conn = setup_test_db();
    // Insert sessions: 2 within last 7 days, 2 older than 7 days
    // Call with period=MetricsPeriod::Week (or equivalent)
    // Verify only 2 sessions appear in results
}

#[test]
fn test_usage_custom_date_range() {
    let conn = setup_test_db();
    // Insert sessions across different dates
    // Call with from=2025-01-01, to=2025-01-31
    // Verify only sessions in that range included
}

#[test]
fn test_usage_dashboard_id_filters_by_workspace() {
    let conn = setup_test_db();
    // Insert sessions for dashboard A and dashboard B
    // Call with dashboard_id=Some("A")
    // Verify only dashboard A sessions returned
}

#[test]
fn test_usage_no_dashboard_id_includes_all() {
    let conn = setup_test_db();
    // Insert sessions for dashboard A and dashboard B
    // Call with dashboard_id=None
    // Verify sessions from both dashboards included
}

#[test]
fn test_cost_aggregation_accuracy() {
    let conn = setup_test_db();
    // Insert 3 sessions: cost 1.50, 2.00, 0.75
    // Total should be 4.25 (floating point precision matters)
    let result = get_usage_dashboard(&conn, ...).unwrap();
    assert!((result.total_cost_usd - 4.25).abs() < 0.001);
}
```

---

### Sub-agent 5 — Session Spawn & Error Handling

**Location**: Search for `spawn_session` in `src-tauri/src/`
**Test file**: `#[cfg(test)]` module
**Priority**: 🟠 High
**Note**: Session spawning involves process management and may be hard to test end-to-end. Focus on the database-level parts: session row creation, error state persistence, ended_at timestamp.

**What to test**:

```rust
#[test]
fn test_session_created_in_db() {
    let conn = setup_test_db();
    // Insert an issue to link to
    // Call the function that creates the DB row for a session
    // Verify row exists with state=running
}

#[test]
fn test_session_marked_errored_on_spawn_failure() {
    // When the process manager returns an error after the DB row is created,
    // the session row should be updated to state=errored with ended_at set
    // This tests the cleanup path
}

#[test]
fn test_session_cost_initial_value() {
    let conn = setup_test_db();
    let session = create_session_row(&conn, ...).unwrap();
    // NOTE: sessions.cost_usd starts as NULL (no DEFAULT in schema).
    // The DEFAULT 0.0 lives on session_metrics.cost_usd, not sessions.
    // Verify the initial value for whichever column you're testing.
    // If checking session_metrics, assert_eq!(metrics.cost_usd, 0.0);
    assert_eq!(session.token_count, 0);
}

#[test]
fn test_session_adoption() {
    // External CLI session imported via adopt_session
    // Verify: session appears in DB with correct provider, state, cost
}
```

**If spawn_session cannot be unit-tested** (e.g., it's deeply coupled to process management with no separation of concerns), document this in the Findings Report and suggest a refactor that would make it testable. Do not force-test untestable code.

---

### Sub-agent 6 — Schema Integrity & Seed Defaults

**Location**: `src-tauri/src/schema.rs`, `src-tauri/src/defaults.rs`, `src-tauri/src/data/seed_commands.rs`
**Test file**: `src-tauri/src/database/tests.rs` — this file **already exists** with a `setup_test_database()` helper. Add the tests there, not in a new `schema_tests.rs` file.
**Priority**: 🟡 Medium

**What to test**:

```rust
#[test]
fn test_create_tables_idempotent() {
    // create_tables() can be called twice without error (IF NOT EXISTS)
    let conn = Connection::open_in_memory().unwrap();
    create_tables(&conn).unwrap();
    create_tables(&conn).unwrap(); // Should not error
}

#[test]
fn test_seed_defaults_idempotent() {
    // seed_defaults() can be called twice (INSERT OR IGNORE)
    let conn = Connection::open_in_memory().unwrap();
    create_tables(&conn).unwrap();
    seed_defaults(&conn).unwrap();
    seed_defaults(&conn).unwrap(); // Should not duplicate rows

    // NOTE: The real table name is `workspace_commands`, not `server_commands`.
    // Verify no duplicate default entries
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM workspace_commands WHERE is_default = 1", [], |r| r.get(0)
    ).unwrap();
    assert_eq!(count, /* expected default count */ N);
}

#[test]
fn test_issue_status_constraint() {
    let conn = setup_test_db();
    // Attempt to insert an issue with invalid status
    let result = conn.execute(
        "INSERT INTO issues (id, dashboard_id, title, status) VALUES ('x', 'y', 'z', 'invalid')",
        []
    );
    assert!(result.is_err(), "Invalid status value should be rejected by CHECK constraint");
}

#[test]
fn test_priority_constraint() {
    let conn = setup_test_db();
    // Attempt invalid priority value
    let result = conn.execute(
        "INSERT INTO issues (id, dashboard_id, title, priority) VALUES ('x', 'y', 'z', 'extreme')",
        []
    );
    assert!(result.is_err(), "Invalid priority value should be rejected");
}

#[test]
fn test_foreign_key_enforcement() {
    let conn = setup_test_db();
    conn.execute_batch("PRAGMA foreign_keys = ON").unwrap();
    // Attempt to insert a session referencing a non-existent issue_id
    let result = conn.execute(
        "INSERT INTO sessions (id, issue_id) VALUES ('s1', 'nonexistent')",
        []
    );
    assert!(result.is_err(), "Foreign key constraint should prevent orphan sessions");
}
```

---

## Completion Criteria

- All 6 Rust test modules created and passing
- `cargo test` passes from `src-tauri/` directory
- No clippy warnings introduced by test code
- Consolidated Findings Report produced with: tests added, bugs discovered, deferred items

## Important Notes

- **Read the code before writing tests.** Adapt test cases to actual function signatures, struct names, and module paths. Do not guess.
- **Do not mock what you can test directly.** Prefer real in-memory SQLite over mocking database calls.
- **One failing test = one potential bug.** If a test reveals unexpected behavior, investigate before deciding to change the test vs. fix the implementation.
- **If `tempfile` is not in Cargo.toml**, add it: `cargo add tempfile --dev` or edit `Cargo.toml` directly under `[dev-dependencies]`.
