# Grovekeeper Requirements

## Problem Statement

Developers running multiple Claude Code agent sessions in parallel juggle too many disconnected tools: multiple terminals, editors, browsers, and dev servers. There is no unified view of task state, no reliable notifications for when agents need attention, and no way to quickly switch context between parallel tasks without losing track of which tools belong to which task.

## Target User

Developer who uses Claude Code CLI for parallel task execution across GitHub issues, each in its own git worktree. Manages work via GitHub issues and PRs. Needs visibility into agent session states, git/GitHub status, and per-task workspaces.

## Core Requirements

### R1: Issue Dashboard

- Display issues as cards in a vertical list (inspired by obsidian-tasks-dashboard-plugin)
- Each card shows: name, priority (color-coded border), color identifier, status badges
- Badges: branch status (active/local/remote-gone/deleted), PR state (open/draft/review-requested/merged/closed/ready-to-merge), GitHub issue state (open/closed), sync status (behind base count), merge conflict indicator
- Badges are interactive: clicking PR/issue badge opens GitHub URL
- Two dashboard types:
    - **Repo dashboard:** one GitHub repo, issues are GitHub issues
    - **Portfolio dashboard:** group of projects, each issue is a repo pointer with child worktree issues nested underneath
- Portfolio parent issues carry metadata (local folder, GitHub repo, default base branch, worktree parent folder) inherited by children
- Toolbar: Add Issue, Add Worktree Issue, Sync All, Sort, Filter, Collapse/Expand, Settings
- "Assigned Issues" panel showing GitHub issues assigned to user (via `gh`) for quick import
- Dashboard-level color palette configuration (vivid, pastel, etc. — ~20 colors per palette)

### R2: Issue Creation

- **Manual create:** Search/select GitHub issue or type name -> pick color (auto-suggested from palette) -> optional priority -> optional base branch + worktree creation
- **Quick add (no worktree):** One-click from assigned GitHub issue. Auto-fills name, GitHub link, assigns next color.
- **Quick add (with worktree):** One-click from assigned issue or GitHub trigger. Auto-fills everything, auto-detects base branch, runs setup-worktree.sh.
- **From raw requirements:** Enter raw text -> fork to (a) create GitHub issue directly via `gh`, or (b) invoke /mp-grill-requirements first to refine, then create GitHub issue.
- **GitHub trigger:** Poll for `grovekeeper:execute` label on GitHub issues. Auto-creates Grovekeeper issue + worktree + starts execution session.
- **Portfolio child:** "Add worktree" button on portfolio parent issue. Inherits parent metadata.

#### Issue Creation Paths Summary

| Path                 | Trigger                                     | Auto-fills                                | Worktree       |
| -------------------- | ------------------------------------------- | ----------------------------------------- | -------------- |
| Manual create        | "Add Issue" in dashboard                    | From GitHub search or typed name          | Optional       |
| Quick add            | Button on assigned GitHub issue             | Name, GitHub link, next color             | No             |
| Quick add + worktree | Button on assigned issue / GitHub trigger   | All above + base branch auto-detect       | Yes            |
| From requirements    | "Add Requirements" button                   | After grilling/refinement -> GitHub issue | Then quick add |
| GitHub trigger       | `grovekeeper:execute` label on GitHub issue | Full auto                                 | Yes            |
| Portfolio child      | "Add worktree" on portfolio parent issue    | Inherits parent metadata                  | Yes            |

### R3: Session Management

- Sessions represent individual Claude Code CLI executions tied to an issue
- One issue can have many sessions (over time and concurrently)
- Session states: running, needs-input, needs-review, paused, finished, errored
- Three modes of session management:
    - **Spawn:** Grovekeeper launches Claude Code CLI as child process, communicates via stream-JSON protocol
    - **Monitor:** Grovekeeper discovers externally-launched sessions by polling ~/.claude/projects/ JSONL files
    - **Adopt:** Externally-launched session can be closed and resumed inside Grovekeeper (or vice versa)
- **Context card on session switch:** Shows original intent, last user prompt, and summary of last response — so user can quickly re-orient when switching between tasks
- Provider field on every session (v1: Claude Code only; future: Codex, Copilot, etc.)
- Track per-session: cost (USD), token count, duration, transcript

### R4: Session Dashboard

- Tabbed interface, one tab per active session
- Tab indicators: issue color + icon representing session state
- Two switchable view modes per session:
    - **Rich chat view:** Markdown rendering, code blocks, diff views, tool call cards (inspired by OpenCovibe components)
    - **Terminal view:** Raw xterm.js terminal showing Claude Code CLI output
- Input box for sending messages/prompts to active session
- Embedded browser preview showing dev server URL for that issue
- Session history: browse past sessions for any issue

### R5: Workspace Management

- Each issue has one workspace: worktree folder, editor instance, dev server (port), browser URL
- **Dev server:** Grovekeeper can launch dev server per issue with deterministic port assignment. Configurable command (default: `pnpm dev`). Parses stdout for URL. Detects already-running servers.
- **Editor:** Launch user's preferred editor (VS Code, Cursor, other VS Code forks). Focus existing window via `code <folder>` / `cursor <folder>`.
- **Embedded terminal:** xterm.js terminal per issue for dev server output and manual commands
- **Embedded browser preview:** Shows dev server URL, auto-assigned port

### R6: Worktree Lifecycle

- Create worktrees by shelling out to mpx-claude-code/scripts/setup-worktree.sh
- Remove worktrees via remove-worktree.sh
- Capture script stdout/stderr and show progress in UI
- Worktree state machine: none -> pending -> active -> failed (with retry)
- Setup script handles: git worktree creation, IDE config copy, Peacock color, .env files, Claude Code settings, dependency installation
- Prune fully-closed worktrees (merged PR + deleted branch + closed issue)

### R7: Git & GitHub Integration

- **GitHub:** `gh` CLI as primary interface. `gh api graphql` for bulk sync. `gh auth` for authentication (required dependency).
- **Git:** `git` CLI primary for worktree ops, merge-tree, rev-list, fetch, merge, push. `git2` crate for performance-critical batch reads.
- **State sync:** Immediate fetch after Grovekeeper-initiated actions. Manual "Sync All" button. Cached state with "last synced X ago" indicator.
- **GitHub polling:** Check for `grovekeeper:execute` label (30s-5min interval).
- **Sync operations:** Detect behind-base, detect merge conflicts (git merge-tree), merge + push, Claude Code fallback for conflict resolution (/mp-sync-base).
- **Fetch coordinator:** Deduplicate parallel git fetch calls per repo root.

### R8: Action Buttons (Skills)

- Configurable action buttons on issue cards
- Each action = name + icon + command template (anything passable to Claude Code CLI)
- Command templates support variables: {{issue_number}}, {{branch_name}}, {{worktree_folder}}, etc.
- Default set: Execute, Review, Check & Fix (mapping to mpx-claude-code skills)
- User can: add, edit, reorder, hide, replace defaults with custom actions
- Actions can be skill invocations, raw prompts, multi-skill chains
- Dashboard-level and global actions supported

### R9: Notification System

- Replaces existing notify-flash-beep.ps1 entirely
- Cross-platform (Tauri notification plugin + native sound playback + window attention request)
- Delivery channels: in-app indicators (always), system toast, configurable sounds, window attention
- Per-event configuration stored in SQLite
- Configurable sound files (.wav) per event type
- Different urgency levels: needs-input (urgent sound + toast + window flash) vs needs-review (gentle chime + toast) vs informational (in-app only)
- Notification events and default delivery channels:

| Event                   | In-app | Toast | Sound        | Window flash |
| ----------------------- | ------ | ----- | ------------ | ------------ |
| Session needs-input     | Yes    | Yes   | Yes (urgent) | Yes          |
| Session needs-review    | Yes    | Yes   | Yes (gentle) | No           |
| Session finished        | Yes    | Yes   | Optional     | No           |
| Session errored         | Yes    | Yes   | Yes (urgent) | Yes          |
| PR ready to merge       | Yes    | Yes   | Optional     | No           |
| PR review requested     | Yes    | Yes   | Optional     | No           |
| Merge conflict detected | Yes    | No    | No           | No           |
| Branch behind base      | Yes    | No    | No           | No           |
| GitHub issue assigned   | Yes    | No    | No           | No           |
| GitHub trigger received | Yes    | Yes   | Optional     | No           |

- Internet-dependent actions show disabled state when offline

### R10: Configuration & Data

- All state in SQLite (single file)
- Export/import configuration as JSON for portability
- Dashboard management: create, edit, delete dashboards; assign color palette per dashboard
- Settings UI for: action buttons, editor/terminal preference, notification preferences, sound files
- Per-platform terminal/editor configuration

### R12: Issue Tree Visualization (Forest View)

- Alternative dashboard visualization: "Forest View" showing issues as animated trees in a forest scene
- Each issue with a worktree = a tree whose shape/stage reflects lifecycle progress
- Each issue without a worktree = a potted plant with simpler growth stages
- PRD/epic issues = large oak tree (central), with a stone nameplate showing the PRD title
- Sub-issue trees arranged in a semicircle around the PRD oak; completed stumps fade to periphery
- Toggle between card-list view and forest view on the same dashboard
- Clicking a tree opens the issue detail panel (same as clicking a card)

#### State Dimensions (9 total, determine tree appearance)

1. **GitHub Label:** `HITL` or `AFK` (issues without either label are excluded from forest view, except PRDs)
2. **Worktree State:** `none`, `pending`, `active`, `failed`, `removing`, `removed`
3. **Session State (aggregate):** `no-session`, `running`, `needs-input`, `needs-review`, `paused`, `finished`, `errored`. Priority order for aggregate: needs-input > errored > needs-review > running > paused > finished > no-session
4. **Execution Phase (derived from stream-JSON):** `none`, `analyzing`, `tdd` (red+green+refactor), `reviewing` (review+check+fix), `verifying` (frontend), `committing` (commit+finalize)
5. **Branch Status:** `no-branch`, `active`, `local-only`, `remote-gone`, `deleted`
6. **PR State:** `no-pr`, `draft`, `open`, `review-requested`, `changes-requested`, `approved`, `ready-to-merge`, `merged`, `closed`
7. **GitHub Issue State:** `open`, `closed`
8. **Sync Status:** `up-to-date`, `behind-base(N)`, `merge-conflict`
9. **Grovekeeper Status:** `active`, `archived`

#### Tree Lifecycle Stages (worktree issues)

| Stage              | Visual               | Primary Trigger                                                         |
| ------------------ | -------------------- | ----------------------------------------------------------------------- |
| Seed               | Seed on soil         | GH issue exists, label=HITL, worktree=none, no session                  |
| Sprouting          | Sprouting seed       | Label=AFK, worktree=none or pending                                     |
| Sapling            | Young sapling        | Worktree=active, branch exists, no session run yet                      |
| Growing (supports) | Sapling with stakes  | Session running (first execution)                                       |
| Leafy tree         | Tree with leaves     | Session finished, commits exist on branch                               |
| Fruiting tree      | Tree with fruit      | PR opened (draft or open). Different fruit types per concurrent session |
| Autumn tree        | Orange/red leaves    | PR review-requested, changes-requested, or approved                     |
| Ready tree         | Full, glowing tree   | PR ready-to-merge                                                       |
| Bare tree          | Leafless winter tree | PR merged, GH issue closed                                              |
| Dead tree          | Fallen/dead tree     | Branch deleted, worktree still exists                                   |
| Stump (pařez)      | Tree stump           | Worktree removed, issue archived                                        |

#### Potted Plant Stages (worktree-less issues)

Simpler lifecycle: pot with soil → sprout → small plant → flowering → dried

#### Overlay System (cross-cutting states)

- **Error/damage:** Sick/damaged tree, wilting leaves (worktree failed, session errored)
- **Merge conflict:** Storm clouds, beaver gnawing at trunk
- **Behind base:** Wind blowing leaves
- **Needs-input:** Speech bubble or bell on tree (urgent attention needed)
- **Changes-requested:** Storm clouds
- **Approved:** Birds singing, flowers blooming
- **Root connections:** Roots connect to PRD oak tree and visually show sync status; connected roots = in sync, disconnected = diverged

#### Session Overlays

- **Multiple sessions:** Different fruit types per session (apples, pears, oranges)
- **Sub-agents:** Small companion saplings that sprout when sub-agent starts, wilt when it finishes. Labeled with agent type
- **Tool calls:** Gardening implements animate near tree trunk when used (shovel=Bash, magnifying glass=Grep, watering can=Write, pruning shears=Edit)

#### Technology

- **Rendering:** SVG + Canvas hybrid (Option E)
    - Tree structure: SVG elements (clickable, accessible, Svelte-reactive)
    - Ambient effects: Transparent canvas layer (particles, weather, animated creatures)
- **Style:** Flat/geometric design for V1
- **Layout:** Flat 2D, no depth/perspective. Oak centered, sub-issues in semicircle
- **Performance:** Only trees with active sessions get full animation. Idle trees = static SVG with subtle CSS sway
- **Future upgrade path:** Rive for polished tree animations with built-in state machines (V2+)

### R11: Cross-Platform

- Windows, macOS, Linux from day one
- Terminal abstraction: Windows Terminal, iTerm2, GNOME Terminal, etc.
- Editor abstraction: VS Code, Cursor, other VS Code forks (all support Peacock)
- No platform-specific dependencies in core logic
- Platform-specific code behind clean abstractions

## Non-Functional Requirements

- **Performance:** UI must remain responsive during git/GitHub operations (async Rust backend)
- **Reliability:** Notification system must have zero false positives for needs-input (open research item)
- **Offline:** Graceful degradation — cached data with "last synced" indicator, disabled buttons for internet-dependent actions
- **Security:** No token/secret storage in Grovekeeper (relies on `gh auth`). No secrets in SQLite.

## Open Questions

1. **Reconnection strategy** — How to handle flaky internet beyond disabling buttons. Caching depth, retry behavior, queue-and-send-on-reconnect.
2. **Offline capabilities** — Exactly which actions to disable, caching strategy depth.

## Out of Scope for V1

- Multi-provider support (designed in, not implemented beyond Claude Code)
- Advanced session statistics (tool usage analytics, cost trends) — basic tree visualization is in scope via R12
- GitHub App for triggering from GitHub UI (using label polling instead)
- Webhook relay for instant GitHub triggers
- Built-in code editor (using external VS Code/Cursor)
