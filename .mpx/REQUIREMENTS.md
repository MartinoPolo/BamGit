# Grovekeeper Requirements

## Problem Statement

Developers running multiple AI agent sessions in parallel juggle too many disconnected tools: terminals, editors, browsers, dev servers, and GitHub. There is no unified view of task state across providers, no reliable notifications for when agents need attention, and no way to orchestrate autonomous execution pipelines with human-in-the-loop checkpoints.

## Target User

Developer who uses Claude Code (and other AI CLIs) for parallel task execution across GitHub issues, each in its own git worktree. Manages work via GitHub issues and PRs. Needs visibility into agent session states, git/GitHub status, per-task workspaces, usage metrics, and autonomous execution control.

## Architecture Decisions

- **Single process, multiple windows** — one Grovekeeper instance manages all workspaces via Tauri `single_instance`
- **One workspace = one GitHub repo = one project folder = potentially one app window**
- **Overview dashboard** as launcher for all workspaces (replaces portfolio dashboards)
- **Deep module architecture** — small interfaces hiding large implementations
- **Multi-provider from day one** — Claude Code + Cursor + Codex + OpenCode, extensible via Provider trait
- **OKLCH design tokens** from `claude_design/tokens.css`, dark theme primary
- **Paraglide i18n** — English + Czech, RTL excluded, Frontend owns user-facing text — Rust returns error keys, frontend translates

---

## Core Requirements

### Workspace Dashboard

- The workspace dashboard is the root page for each workspace window
- **Primary view: Forest View** — collapsible panel, open by default. Can be slid upward to hide via a handle with a forest icon. Clicking the handle brings it back. Forest occupies the top portion; the bottom portion hosts detail content (issue cards, PRD overview, dependency graph)
- **Issue cards** appear in the bottom panel and in secondary views (not as the primary dashboard element). Each card shows: name, color identifier, status badges, tree thumbnail (92px)
- The default/primary view is configurable in settings (forest open by default, or collapsed by default, multiple bottom section views, tabs etc.)
- Badges on cards: branch status (active/local/remote-gone/deleted), PR state (open/draft/review-requested/merged/closed/ready-to-merge), GitHub issue state (open/closed), sync status (behind base count), merge conflict indicator
- Badges are interactive: clicking PR/issue badge opens GitHub URL
- Badges are responsive: collapse to icon-only when header space is insufficient
- One workspace = one dashboard = one GitHub repo
- **Overview dashboard** (separate window/page): shows all configured workspaces as cards with health indicators (active sessions, open PRs, pending HITL issues)
- Toolbar: Add Issue, Add Worktree Issue, Sync All, Sort, Filter, Collapse/Expand, Settings
- "Assigned Issues" panel accessible from dashboard (sidebar widget or collapsible section, quick-access) showing GitHub issues assigned to user (via `gh`) for quick import
- Dashboard-level color palette configuration (vivid, pastel, etc. — 30 colors, 6 hues × 5 shades)

### Issue Creation

- **Manual create:** Multi-step keyboard-driven wizard (modal at top of screen):
    1. GitHub issue search (live, number-aware, arrow-key navigation)
    2. Issue name entry (pre-filled from GitHub if selected)
    3. Worktree yes/no (conditional)
    4. Color selection (30-color palette, auto-rotation, custom input)
    5. Worktree creation progress (if yes)
    - Enter confirms, Escape cancels, Back navigates
- **Quick add (no worktree):** One-click from assigned GitHub issue. Auto-fills name, GitHub link, assigns next color.
- **Quick add (with worktree):** One-click from assigned issue or GitHub trigger. Auto-fills everything, auto-detects base branch, runs setup-worktree.sh.
- **From raw requirements:** Quick ideas widget appends to `.mpx/RAW_REQUIREMENTS.md`. Processing trigger runs `/mp-grill-requirements` to refine → create GitHub issue.
- **GitHub trigger:** Poll for `grovekeeper:execute` label on GitHub issues. Auto-creates Grovekeeper issue + worktree + starts execution session.
- Priority defaults to medium, not prompted during creation. User can change via card action later.

#### Issue Creation Paths Summary

| Path                 | Trigger                                     | Auto-fills                               | Worktree       |
| -------------------- | ------------------------------------------- | ---------------------------------------- | -------------- |
| Manual create        | "Add Issue" in dashboard                    | From GitHub search or typed name         | Optional       |
| Quick add            | Button on assigned GitHub issue             | Name, GitHub link, next color            | No             |
| Quick add + worktree | Button on assigned issue / GitHub trigger   | All above + base branch auto-detect      | Yes            |
| From requirements    | Quick ideas widget → processing trigger     | After grilling/refinement → GitHub issue | Then quick add |
| GitHub trigger       | `grovekeeper:execute` label on GitHub issue | Full auto                                | Yes            |

#### Color System

- 30-color palette (6 hues × 5 shades), no gray colors (reserved for disabled states)
- Theme-aware orientation: darker shades at top in dark mode, lighter in light mode
- Auto-preselect next available color (rotate from last-used position)
- Already-assigned colors disabled (rendered gray)
- Custom color input with letter "A" preview for text readability
- Single main color drives visual identity: VS Code Peacock, terminal tab, tree visualization
- Release color on archive, delete, or color change
- Closed issue appearance: CSS overlay `filter: grayscale(0.8) opacity(0.7)` — preserves stored color for reopening

#### Priority System

- Levels: lowest, low, medium, high, highest
- Default: medium (assigned automatically, not prompted during creation)
- Medium priority has no visible badge on the card
- Non-default levels (low, lowest, high, highest) show a badge
- Changeable via issue card action button or overflow menu dropdown
- Some views sort by priority; blocking relationships can prioritize higher-priority issues closer to front

### Session Management

- Sessions represent individual AI agent CLI executions tied to an issue
- One issue can have many sessions (over time and concurrently)
- Session states: running, needs-input, needs-review, paused, finished, errored
- Three modes of session management:
    - **Spawn:** Grovekeeper launches agent CLI as child process, communicates via stream-JSON protocol
    - **Monitor:** Grovekeeper discovers externally-launched sessions by polling session directories
    - **Adopt:** Externally-launched session can be closed and resumed inside Grovekeeper (or vice versa)
- Provider/model selection per session (v1: Claude Code, Cursor, Codex)
- Track per-session: cost (USD), token count (input/output/cache), duration, transcript, tool calls
- Provider capability matrix: spawn support, session discovery, historical import, session file format, subscription types

### Session Dashboard (Chat UI)

- Rich chat rendering:
    - Markdown (headers, lists, code blocks, links, tables)
    - Syntax-highlighted code blocks with copy button
    - Tool call cards: collapsible detail per tool (Read, Write, Edit, Bash, Grep, etc.)
    - Diff views for file changes (Edit tool results)
    - User/Assistant message bubbles with provider-specific avatars
    - Approval/permission request cards (Allow / Allow always / Deny)
    - Turn counter and cost indicator in header
- Session interaction UX:
    - Quick-navigate buttons: jump to latest response start, jump to latest prompt start
    - Content before last prompt visually grayed out (scrollable, not removed)
    - Input box always visible and accessible (fixed at bottom)
- Sub-agent display:
    - Deterministic tree of all sub-agents spawned (parsed from session JSON/JSONL)
    - Per sub-agent: name, model, status, tool usage count
    - Not AI-generated summaries — parsed from actual session data
- Session detail right panel (280px):
    - Tree thumbnail (issue visualization)
    - Stats card: turns, cost, tokens, cache hit ratio, tool count
    - Worktree card: branch, path, commits + Terminal/Editor buttons
- Session history: browse past sessions for any issue, search content, filter by date/provider/outcome

### Issue Environment

- Each issue has an **issue environment**: worktree folder, editor instance, terminal session
- **Editor:** Launch VS Code or Cursor via CLI. Verify Peacock color matches issue color in `.vscode/settings.json`.
- **Terminal:** Open platform-appropriate terminal at worktree path. Pass issue color to terminal tab where supported.
- Per-issue folder assignment: left-click opens explorer, right-click reassigns. Faded when unassigned.

#### Deferred for future PRD

- Dev server management (deterministic port assignment, stdout parsing, auto-detection)
- Embedded browser preview (dev server URL in Tauri webview)
- Embedded terminal (xterm.js) — use external terminal instead

### Worktree Lifecycle

- Create worktrees by shelling out to `mpx-claude-code/scripts/setup-worktree.sh`
- Remove worktrees via `remove-worktree.sh`
- Capture script stdout/stderr and show progress in UI
- Worktree state machine: none → pending → active → failed (with retry)
- Setup script handles: git worktree creation, IDE config copy, Peacock color, .env files, Claude Code settings, dependency installation
- Auto-assign worktree folder after setup succeeds
- Retry modal on failure: list active worktrees for direct assignment + option to create new
- Prune fully-closed worktrees (merged PR + deleted branch + closed issue) — batch removal supported
- Per-project worktree folder: `{parent}/{project-name}-worktrees/` (configurable in settings)
- Auto-detect existing worktrees in configured folder on first setup
- Path change dialog: move worktrees / redetect in new folder / delete all originals
- Smart branch/worktree naming: strip filler words + conventional commit prefixes, keep issue number + ~5 words, max ~50 chars, lowercase, dashes, git-safe

### Git & GitHub Integration

- **GitHub:** `gh` CLI as primary interface. `gh api graphql` for bulk sync. `gh auth` for authentication (required dependency).
- **Git:** `git` CLI primary for worktree ops, merge-tree, rev-list, fetch, merge, push. `git2` crate for performance-critical batch reads.
- **State sync:** Immediate fetch after Grovekeeper-initiated actions. Manual "Sync All" button. Cached state with 5-minute TTL.
- **GitHub polling:** Check for `grovekeeper:execute` label (configurable interval).
- **Sync operations:** Detect behind-base, detect merge conflicts (`git merge-tree`), merge + push, Claude Code fallback for conflict resolution (`/mp-sync-base`).
- **Fetch coordinator:** Deduplicate parallel `git fetch` calls per repo root.
- **GitHub page** (`/github`): Dedicated page with 3 tabs (Issues | PRs | Worktrees).
    - Show all repo issues/PRs, distinguish Grovekeeper-managed ones visually
    - Filters: open/closed, Grovekeeper-linked, active worktrees
    - Sorting: creation date, last changed, number, group by PRD
    - Default: open PRs, open issues, active worktrees
- **PR lifecycle:** Merge/squash-merge button, auto-resolve CI failures via agent, auto-resolve merge conflicts via agent, PR log with session summary.
- **GitHub comments:** Fix `mp-execute` Step 2 to forward comments field. HITL Q&A stored as structured GitHub issue comments.

### Action Buttons (Skills)

- Configurable action buttons on issue cards
- Each action = name + icon + command template (anything passable to agent CLI)
- Command templates support variables: `{{issue_number}}`, `{{branch_name}}`, `{{worktree_folder}}`, etc.
- Default set: Execute, Review, Check & Fix (mapping to mpx-claude-code skills)
- User can: add, edit, reorder, hide, replace defaults with custom actions
- Actions can be skill invocations, raw prompts, multi-skill chains
- Workspace-level and global actions supported

### Notification System

- Cross-platform (Tauri notification plugin + rodio sound + window attention)
- Frontend passes translated title/body to Rust dispatch command (Rust does not generate user-facing text)
- Per-event configuration stored in SQLite
- CESP/peon-ping manifest format for sound packs
- Bundled default sound pack (royalty-free, nature-themed)
- Sound rotation: multiple sounds per event, random selection excluding last played
- Per-event: enable/disable, assign sound, mute, merge events to share sounds

#### Notification Events

| Event                     | Toast    | Sound        | Window Flash |
| ------------------------- | -------- | ------------ | ------------ |
| `session.start`           | Optional | Optional     | No           |
| `session.end`             | Yes      | Optional     | No           |
| `session.error`           | Yes      | Yes (urgent) | Yes          |
| `session.needs-input`     | Yes      | Yes (urgent) | Yes          |
| `task.complete`           | Yes      | Optional     | No           |
| `task.acknowledge`        | Optional | Optional     | No           |
| `pr.ready`                | Yes      | Optional     | No           |
| `pr.merged`               | Yes      | Optional     | No           |
| `pr.review-requested`     | Yes      | Optional     | No           |
| `merge.conflict`          | No       | No           | No           |
| `branch.behind-base`      | No       | No           | No           |
| `github.issue-assigned`   | No       | No           | No           |
| `github.trigger-received` | Yes      | Optional     | No           |
| `achievement.unlocked`    | Yes      | Yes          | No           |
| `resource.limit`          | Yes      | Yes          | No           |

### Configuration & Data

- All state in SQLite (single file)
- Export/import configuration as JSON for portability (with schema version for migration)
- Workspace management: create, edit, delete workspaces; assign color palette
- Settings UI: General, Appearance, Language, Providers, Notifications, GitHub, Worktrees, Keyboard Shortcuts, About
- Per-platform terminal/editor configuration
- Startup behavior: auto-open last workspace OR show overview (configurable)

### Cross-Platform

- Windows, macOS, Linux from day one (via Tauri)
- Terminal abstraction: Windows Terminal, iTerm2, Terminal.app, GNOME Terminal, etc.
- Editor abstraction: VS Code, Cursor, other VS Code forks (all support Peacock)
- No platform-specific dependencies in core logic
- Platform-specific code behind clean abstractions in Rust `platform/` module

### Issue Tree Visualization (Forest View)

- Forest panel in top portion of workspace dashboard — collapsible (slide up to hide, click handle to restore)
- Open by default; configurable in settings whether forest starts open or collapsed
- Each issue = a tree whose shape/stage reflects lifecycle progress
- PRD/epic issues = large oak tree (central), with stone nameplate showing PRD title
- Clicking a tree updates the bottom detail panel with issue information

#### State Dimensions (determine tree appearance)

1. **GitHub Label:** `HITL` or `AFK`. Under a PRD, issues without either label should not exist — display in **error state** if they do (red glow, speech bubble with warning). In repo-wide forest (outside PRD context), unlabeled issues are displayed in a **special way** (distinct visual treatment, TBD — possibly potted plants if no worktree, or a unique badge/dimming for unlabeled trees with worktrees)
2. **Worktree State:** `none`, `pending`, `active`, `failed`, `removing`, `removed`
3. **Session State (aggregate):** `no-session`, `running`, `needs-input`, `needs-review`, `paused`, `finished`, `errored`. Priority order for aggregate: needs-input > errored > needs-review > running > paused > finished > no-session
4. **Execution Phase (derived from stream-JSON):** `none`, `analyzing`, `tdd` (red+green+refactor), `reviewing` (review+check+fix), `testing` (checks+tests), `fixing` (applying fixes), `shipping` (commit+push+PR+CI+merge)
5. **Branch Status:** `no-branch`, `active`, `local-only`, `remote-gone`, `deleted`
6. **PR State:** `no-pr`, `draft`, `open`, `review-requested`, `changes-requested`, `approved`, `ready-to-merge`, `merged`, `closed`
7. **GitHub Issue State:** `open`, `closed`
8. **Sync Status:** `up-to-date`, `behind-base(N)`, `merge-conflict`
9. **Grovekeeper Status:** `active`, `archived`

#### Tree Lifecycle Stages

> Full priority-ordered cascade with all rules: see `.mpx/STATE_MAPPING.md`

| Stage          | Visual                   | Primary Trigger                                          |
| -------------- | ------------------------ | -------------------------------------------------------- |
| Seed           | Seed on soil             | GH issue exists, worktree=none, no session               |
| Sprouting      | Sprouting seed           | Worktree pending or failed                               |
| Sapling        | Young sapling            | Worktree=active, branch exists, no session run yet       |
| Growing        | Sapling with growth      | Session active (running, paused, errored, needs-input)   |
| Leafy tree     | Tree with full canopy    | Draft PR, or commits on branch with no PR                |
| Flowering tree | Tree with flowers        | PR open or review-requested (blossoming, under review)   |
| Fruiting tree  | Tree with fruit          | PR approved or ready-to-merge (mature, ready to harvest) |
| Seasonal tree  | Orange/red autumn leaves | PR changes-requested (autumn setback)                    |
| Wilting tree   | Faded, drooping canopy   | PR closed without merge (rejected/abandoned)             |
| Bare tree      | Leafless winter tree     | PR merged (lifecycle complete)                           |
| Dead tree      | Desaturated, fallen      | Branch deleted or remote-gone                            |
| Stump          | Tree stump               | Worktree removed, issue archived                         |

#### Tree Shape & Color

- Tree shapes mapped to GitHub labels (label-to-shape mapping): oak, birch, willow, maple, baobab, fir, pine, cypress, spruce, bush, acacia, apple, cherry
- Deterministic tree appearance via `mulberry32(seed)` — same issue always produces same tree shape
- Stage color takes priority (signals state — e.g., autumn palette for seasonal, dead gray for dead)
- Otherwise, tree canopy leans toward the issue-assigned color
- Exact color adaptation algorithm to be iterated

#### Overlay System (cross-cutting states)

> Full accessory/overlay mapping with priorities: see `.mpx/STATE_MAPPING.md`

- **Session errored:** Red speech bubble (crownTop). Red pulsing glow (intensity 4)
- **Needs-input:** Orange speech bubble (crownTop). Orange pulsing glow (intensity 3)
- **Merge conflict:** Storm cloud (crownTop)
- **Worktree failed:** Storm cloud (crownTop)
- **Behind base:** Mushroom/fungi clusters on trunk (binary: present when behind, absent when synced)
- **Approved:** Green glow (intensity 2). Fruiting stage handles the visual
- **Ready-to-merge:** Green glow (intensity 5). Fruiting stage handles the visual
- **Changes-requested:** Seasonal stage (autumn palette). No storm cloud
- **HITL label:** Grill accessory (static = available, animated = grilling session active)

#### Execution Phase Tools

- **Analyzing:** Lantern (infinity-sign path animation)
- **TDD / Building:** Shovel (digging swing)
- **Reviewing:** No tool — cardinal birds (reviewer sub-agents) in canopy carry the signal
- **Checks / Testing:** Pruning shears (snipping motion)
- **Fixing:** Shovel + robin bird in canopy (builder fixing issues)
- **Shipping:** Rake (horizontal slide)

#### Session Accessories

- **Running session:** Tree animates (canopySway + animateGrowth). Execution phase tool at trunkBase
- **Paused session:** Ladder at trunkBase (someone stepped away). Tree is static
- **Fruit:** Static count (3-5), decorative. Species-matched fruit type per tree shape

#### Sub-Agent Visualization

- **Birds in canopy** at branchTips — 6 types mapped to agent categories:
    - Owl (analysis), Robin (executor), Sparrow (checker), Cardinal (reviewer), Hummingbird (utility), Parrot (research/docs)
- Multiple birds of same type for parallel agents (e.g., 3 cardinals for 3 reviewers)
- Fade out when sub-agent finishes. Tooltip shows agent name. Clickable for output

#### Forest Layout

- **PRD tree** at center (larger, oak shape)
- Issue trees spawn equidistantly from center: 1st left, 2nd right, 3rd left of 1st, 4th right of 2nd...
- Blocked issues in rows behind their blockers (up to 10 depth rows)
- Back rows: trunk y-shifted slightly up for perspective, x-offset so not fully hidden, smaller, can be visually disabled
- Deterministic layout — no manual dragging
- Forest occupies top portion of screen (~4:1 aspect ratio), resizable bottom border
- Sky gradient background, ground strip with grass elements

#### Bottom Detail Panel

- Default: PRD/repository overview
- On tree click: issue detail (metadata, badges, actions)
- On PRD tree click: return to PRD overview
- Dependency graph tab: DAG visualization with AFK/HITL labels, quick-start HITL button, click-to-navigate

#### Technology

- **Rendering:** low-poly-2d-trees library (SVG-based, procedural polygon generation)
- **Performance:** Only trees with active sessions get full animation. Idle trees = static SVG with subtle CSS sway
- **Layout:** Flat 2D with simulated perspective via y-offset for depth rows

### AFK/HITL Workflow

- **AFK monitoring loop:** Watch for AFK-labeled issues in linked repos. When on: pick unblocked issue, spawn execution session (`/mp-execute`). Toggle on/off.
- **HITL sessions:** Spawn separate Claude Code session for grilling. Provider/model selectable. Reuses chat UI.
- **One-way HITL→AFK flip:** After user resolves questions, click "Mark as AFK." Never flip back — unresolved items from execution create new linked issues.
- **Question preparation:** Background agent reads HITL issue + codebase context, generates questions. Displayed when user starts HITL session.
- **Q&A storage:** Grovekeeper DB + GitHub issue comments (consumed by future `/mp-execute` runs after fixing Step 2 comment forwarding).

### Metrics & Statistics

- **Real-time capture:** From session actor as events flow (tokens, cost, tools, duration, turns, model).
- **Historical import:** One-time scan of Claude Code session directories. Multi-provider (Cursor, Codex as supported).
- **Usage dashboard:** 4 KPI cards, 30-day cost chart, activity breakdown, top sessions, tool usage, period filters.
- **Aggregation:** By agent, session, tool, project, PRD, daily/weekly/monthly.
- **Achievements:** Milestone-based (e.g., "Planted 10 Trees", "Green Thumb", "Cache Master"). Notification on unlock.
- **Model pricing:** 30+ model variants, LiteLLM cache, user-defined aliases.

### AI Configuration Access

- Dedicated page with tabs: Skills, Agents, Hooks, MCP Servers, Memories, Instructions.
- Card grid with badges (model, category, version). Click → full detail panel.
- Discovery: `~/.claude/`, project `.claude/`, mpx-claude-code, memories folder. Scan on navigate + manual refresh.
- "Open file" / "Open in editor" / "Open folder" buttons per item. Read-only display in Grovekeeper.

### Internationalization

- Paraglide setup: `project.inlang/settings.json`, `messages/{en,cs}.json`, compile to `src/lib/paraglide/`
- All user-facing strings through `m.key_name` imports from day one
- Setup first, translate incrementally (English complete, Czech added per component)
- Rust returns error keys; frontend translates
- RTL explicitly excluded

---

## Non-Functional Requirements

- **Performance:** UI must remain responsive during git/GitHub operations (async Rust backend). Forest view responsive with 50+ trees. Session list handles 100+ entries.
- **Reliability:** Notification system must have zero false positives for needs-input.
- **Offline:** Graceful degradation — cached data with "last synced" indicator, disabled buttons for internet-dependent actions.
- **Security:** No token/secret storage in Grovekeeper (relies on `gh auth`). No secrets in SQLite. Safe script spawn (`shell: false`).
- **Testing:** 80% coverage (Vitest), E2E (Playwright), component stories (Storybook).
- **Accessibility:** Keyboard-navigable, ARIA labels, focus management. Global keyboard shortcuts system.

## Open Questions

1. **Reconnection strategy** — How to handle flaky internet beyond disabling buttons. Caching depth, retry behavior, queue-and-send-on-reconnect.
2. **Tree color adaptation** — Exact algorithm for blending issue-assigned color with stage-dictated palette. Needs design iteration.
3. **Session reliability** — Zero false positives for needs-input notification. May require polling cross-check.

## Out of Scope for V1

- RAG integration (vector databases, embedding models, retrieval pipelines)
- Advanced prompt analytics (A/B testing, prompt versioning)
- Full autopilot system (webhook triggers, cron-scheduled execution)
- Agent personality / Warcraft voices (custom sound packs deferred beyond bundled defaults)
- GitHub App for triggering from GitHub UI (using label polling instead)
- Webhook relay for instant GitHub triggers
- Built-in code editor (using external VS Code/Cursor)
- Dev server management / embedded browser preview
- Embedded terminal (xterm.js) — use external terminal
- Mobile push notifications
- RTL language support
