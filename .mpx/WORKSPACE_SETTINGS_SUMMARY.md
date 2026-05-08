# Workspace Settings — Cross-Session Summary

Generated from grilling session 2026-05-08. Use this to cross-check conflicts with other sessions working on settings/workspace configuration.

## Context

Currently there is one `/settings` page accessible from the workspace sidebar. This page contains **both** user-level settings (appearance, language, notifications, keyboard shortcuts) and workspace-level settings (name, color, repo, base branch, worktree folder). The grilling decided to split these.

## Decisions Made

### 1. Settings Split: User vs Workspace

- **User settings** (global, not workspace-scoped) move to a user settings area accessible from the account section in the bottom-left sidebar (gear/avatar button). Includes: Appearance, Language, Notifications, Keyboard Shortcuts, Providers, About.
- **Workspace settings** stay as a navigable page from the workspace sidebar. This is a **full settings page** (not just a dialog). Contains all workspace-scoped configuration.
- The existing `DashboardEditDialog` (compact modal) remains for quick edits (name, accent color, GitHub repo) — accessible via workspace card right-click or gear icon. It does **not** include dev server commands, test commands, etc.

### 2. Workspace Settings Page — Sections

**General:**

- Workspace name
- Accent color (ColorPicker)
- GitHub repository (RepoCombobox)
- Default base branch
- Local project folder

**Worktrees:**

- Worktree parent folder
- Auto-detect existing worktrees toggle

**Commands (NEW):**
Two categories, each supporting unlimited entries:

- **Server commands** — name, command string, optional port pattern (regex to parse port from stdout). Examples: "Frontend" → `pnpm dev`, "Backend" → `cargo run`. Multiple dev servers can run simultaneously per issue.
- **Check commands** — name, command string, expected exit code. Examples: "Unit Tests" → `pnpm test`, "E2E" → `pnpm test:e2e`, "Lint" → `pnpm check:fast`.

Each entry: name input + command input + delete button. "Add server command" / "Add check command" buttons at bottom of each category.

### 3. New DB Schema

New table `workspace_commands`:

```sql
CREATE TABLE workspace_commands (
    id TEXT PRIMARY KEY,
    dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK(category IN ('server', 'check')),
    name TEXT NOT NULL,
    command TEXT NOT NULL,
    port_pattern TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);
```

### 4. Workspace Archive/Delete

- `dashboards` table gets `status TEXT NOT NULL DEFAULT 'active'` column
- **Archive** — soft, reversible. Card disappears from overview grid. Restorable via "Show archived" toggle.
- **Delete** — only on already-archived workspaces. Requires typing workspace name to confirm. Red destructive modal. Soft-delete in DB (status = 'deleted', data preserved).

### 5. Workspace Card Changes

- **Right-click** on workspace card → opens `DashboardEditDialog` directly (no dropdown menu)
- **Gear icon** added to card header (ghost, `icon-sm`, same row as folder/GitHub buttons). Left-click → opens `DashboardEditDialog`.
- **"Newly planted"** text in empty workspace card → changed to **"Newly created"**

### 6. Dev Server Management

- Issue cards get dev server status visibility: running indicator (green dot) + port number
- Click port indicator → opens `http://localhost:{port}` in browser
- Right-click port badge → view logs of that process
- Dev server processes tracked by Grovekeeper (PID, port, stdout/stderr streaming)
- Log viewer for running processes (scrollable terminal-like output)
- Requires Tauri (child process management). Browser mock mode shows toast.

### 7. Overview Page Toolbar

- Existing header row (h1 + subtitle) gets **right-aligned ghost icon buttons**: Sort dropdown, Filter dropdown, Settings gear
- Settings gear opens popover to configure workspace card footer content (what data to show: today's cost, week cost, total cost, active sessions, last activity)
- Sort/filter are inline button groups (reusable component), not a standalone toolbar

## Potential Conflicts to Watch

- Any session working on the `/settings` page needs to know about the user-vs-workspace split
- Any session touching `DashboardEditDialog` — it stays as a compact modal, not extended with commands
- Any session modifying the `dashboards` table schema — the `status` column addition
- Any session adding new Tauri commands for process management
- The `workspace_commands` table is new and should not conflict with existing schema
