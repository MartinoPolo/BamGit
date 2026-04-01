# BamGit — Rough Architecture

## Vision

Desktop agent orchestration GUI replacing multi-app workflow chaos. Unifies task state, editor, terminal, browser, and agent session into a single per-task view with reliable notifications.

## Tech Stack

- **Desktop framework:** Tauri v2 (Rust backend)
- **Frontend:** SvelteKit 2 + Svelte 5 (runes, SPA mode, static adapter)
- **Styling:** Tailwind CSS
- **Database:** SQLite via rusqlite (bundled)
- **Git:** `git` CLI primary, `git2` crate for performance-critical reads (ref lookups, batch status)
- **GitHub:** `gh` CLI primary, `gh api graphql` for bulk sync
- **Auth:** `gh auth` (no PAT management in app)
- **Testing:** Vitest (unit), Playwright (E2E), Storybook (components)

## Core Vocabulary

See `.mpx/VOCABULARY.md` for canonical terms.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    BamGit Desktop App                   │
├─────────────────────────────────────────────────────────┤
│  FRONTEND (Svelte 5 + SvelteKit SPA)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Issue        │  │ Session      │  │ Settings      │  │
│  │ Dashboard    │  │ Dashboard    │  │ & Config      │  │
│  │ (card list)  │  │ (tabs+chat)  │  │               │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────────┘  │
│         │                 │                             │
│  ┌──────┴─────────────────┴──────────────────────────┐  │
│  │  Shared Components                                │  │
│  │  - Badges (branch, PR, issue, sync, conflict)     │  │
│  │  - Rich Chat (markdown, diffs, tool cards)        │  │
│  │  - Embedded Terminal (xterm.js)                   │  │
│  │  - Embedded Browser Preview (webview)             │  │
│  │  - Action Buttons (skill invocation)              │  │
│  │  - Notification Toasts                            │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          │ Tauri IPC (invoke/events)    │
├──────────────────────────┼──────────────────────────────┤
│  BACKEND (Rust / Tauri)  │                              │
│  ┌───────────────────────┴───────────────────────────┐  │
│  │  Tauri Commands (IPC layer)                       │  │
│  └───────────────────────┬───────────────────────────┘  │
│         ┌────────────────┼────────────────┐             │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐      │
│  │ Session     │  │ GitHub      │  │ Git         │      │
│  │ Manager     │  │ Service     │  │ Service     │      │
│  │             │  │             │  │             │      │
│  │ - spawn     │  │ - gh CLI    │  │ - git CLI   │      │
│  │ - monitor   │  │ - graphql   │  │ - git2 crate│      │
│  │ - adopt     │  │ - polling   │  │ - worktree  │      │
│  │ - protocol  │  │ - cache     │  │   scripts   │      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
│         │                │                │             │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐      │
│  │ Notification│  │ Process     │  │ Platform    │      │
│  │ Service     │  │ Manager     │  │ Abstraction │      │
│  │             │  │             │  │             │      │
│  │ - in-app    │  │ - dev server│  │ - terminal  │      │
│  │ - toast     │  │ - editor    │  │ - editor    │      │
│  │ - sound     │  │ - port mgmt │  │ - shell     │      │
│  │ - window    │  │ - PID track │  │ - paths     │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                          │                              │
│                   ┌──────┴──────┐                       │
│                   │  SQLite DB  │                       │
│                   └─────────────┘                       │
└─────────────────────────────────────────────────────────┘

External:
  ├── Claude Code CLI (stream-JSON protocol / JSONL files)
  ├── gh CLI (GitHub API)
  ├── git CLI + git2 (local repos)
  ├── VS Code / Cursor (external editor, focus via `code <folder>`)
  └── mpx-claude-code scripts (setup-worktree.sh, remove-worktree.sh)
```

## Rust Backend Modules

### Session Manager

- **Spawn sessions:** Launch `claude` CLI as child process, communicate via stream-JSON protocol. Full control over stdin/stdout.
- **Monitor sessions:** Poll `~/.claude/projects/` JSONL files for externally-launched sessions (c9watch pattern). ~2-3s detection.
- **Adopt sessions:** Detect external session, optionally inject hook for instant notifications, transition to managed state.
- **State machine:** running -> needs-input -> needs-review -> paused -> finished -> errored. Detection of needs-input vs needs-review is an open research item (sub-agent stop hooks produce false positives).
- **Provider trait:** Abstraction for future providers (Codex, Copilot). V1 implements Claude Code only. `provider` field on every session.

### GitHub Service

- **Primary interface:** `gh` CLI for all single-item queries and mutations.
- **Bulk sync:** `gh api graphql` for refreshing state across many issues.
- **Immediate fetch:** After BamGit-initiated actions (create issue, create PR), immediately fetch related state.
- **Manual sync:** "Sync All" button refreshes all GitHub state.
- **Polling:** Check for `bamgit:execute` label on issues (30s-5min interval). Future: webhook relay for instant triggers.
- **Cache:** git_status_cache table with fetched_at timestamps. "Last synced X ago" indicator in UI.

### Git Service

- **`git` CLI** for: worktree operations, `merge-tree` (conflict detection), `rev-list` (behind-base count), fetch, merge, push.
- **`git2` crate** for: batch ref lookups, branch existence checks, status queries — where process spawn overhead matters.
- **Worktree lifecycle:** Shell out to `mpx-claude-code/scripts/setup-worktree.sh` and `remove-worktree.sh`. Capture stdout/stderr for UI progress.
- **Fetch coordinator:** Deduplicate parallel `git fetch` calls per repo root (same pattern as Obsidian plugin).

### Notification Service

- **In-app:** Badge/dot indicators on issue cards and session tabs. Always active for all events.
- **System toast:** Tauri notification plugin (cross-platform). For needs-input, session finished, PR ready.
- **Sound:** Configurable per event type. Different sounds for needs-input (urgent) vs needs-review (gentle). Custom .wav support.
- **Window attention:** Tauri window attention request (cross-platform). For needs-input only.
- **Replaces:** notify-flash-beep.ps1 entirely.
- **Config:** Per-event notification preferences stored in SQLite.

### Platform Abstraction

- **Terminal:** Spawn user's preferred terminal with working directory and optional tab color. Supports: Windows Terminal, iTerm2, GNOME Terminal, etc.
- **Editor:** Launch user's preferred editor (VS Code, Cursor, other VS Code forks). Color sync via Peacock extension for VS Code-based editors. Launch via `code <folder>` / `cursor <folder>`.
- **Paths:** Cross-platform path handling (Windows backslash vs Unix forward slash).

### Process Manager

- **Dev server:** Launch per-issue dev server with deterministic port assignment. Parse stdout for URL confirmation. Detect already-running servers.
- **Editor tracking:** Launch editor via CLI command, relies on editor's idempotent behavior for focus.
- **PID tracking:** Track dev server and session PIDs for cleanup.

## SQLite Schema (v1)

Source of truth: [`src-tauri/src/database/schema.rs`](../src-tauri/src/database/schema.rs)

## Open Research Items

1. **needs-input vs needs-review detection** — Stop hooks fire for sub-agent completions (false positives). Need reliable heuristic: process tree inspection + JSONL state analysis + stream-JSON protocol signals. Requires prototyping.
2. **Faster GitHub triggers** — Webhook relay (Cloudflare Worker, smee.io) for near-instant triggers vs current 30s polling.

## Reference Repositories

See `REFERENCES.md` for full list with descriptions. Key ones per feature area:

- **Session monitoring:** c9watch, OpenCovibe
- **Multi-provider:** cline
- **Task board + worktrees:** cline-kanban
- **Session protocol:** OpenCovibe (stream-JSON, session actor)
- **Dashboard + GitHub + git:** obsidian-tasks-dashboard-plugin
- **Skills/hooks/scripts:** mpx-claude-code
- **Visualization:** agent-flow, claude-code-hooks-multi-agent-observability
- **Session resume:** cli-continues, claude-code-templates
