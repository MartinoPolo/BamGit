# Grovekeeper Requirements

## Problem Statement

Developers running multiple AI agent sessions in parallel juggle too many disconnected tools: terminals, editors, browsers, dev servers, and GitHub. There is no unified view of task state across providers, no reliable notifications for when agents need attention, and no way to orchestrate autonomous execution pipelines with human-in-the-loop checkpoints.

## Target User

Developer who uses Claude Code (and other AI CLIs) for parallel task execution across GitHub issues, each in its own git worktree. Manages work via GitHub issues and PRs. Needs visibility into agent session states, git/GitHub status, per-task workspaces, usage metrics, and autonomous execution control.

## Key Architecture Decisions

See `ARCHITECTURE.md` for full architecture, module map, and diagrams.

- Single process, multiple windows via Tauri `single_instance`
- One workspace = one GitHub repo = one project folder = one app window
- Deep module architecture — `use{Module}()` context factories
- Multi-provider from day one — Provider trait abstraction
- OKLCH design tokens, dark theme primary, Paraglide i18n (en + cs)
- Frontend owns user-facing text — Rust returns error keys

---

## Core Features

### Workspace Dashboard (implemented)

PRD #87 (design system), PRD #89 (issue management). Sub-issues: #97-#105, #131-#136.
Design: `claude_design/Issue Card.html`, `claude_design/Grovekeeper Design.html`.

- Root page per workspace window. Forest View in top panel (collapsible), tabbed bottom panel
- **Bottom panel tabs**: Issues | Kanban | Dependencies | Activity | Session | Assigned Issues
- **Issue cards**: responsive grid, color header band, session state chip, status badges, tree thumbnail, quick-action buttons (folder/terminal/editor), context menu with all actions
- **Badges**: branch status, PR state, GitHub issue state, sync status, merge conflict — all interactive and responsive
- **Batch selection**: Ctrl+click, Shift+click (Windows Explorer pattern), right-click "Select", long press (mobile). Actions: Archive, Unarchive, Delete, Change Priority, Clean Worktrees
- **Active vs Selected**: Active = single-click inspect (one at a time, bottom panel detail). Selected = batch (multiple, bulk ops). Visual hierarchy via `box-shadow` rings and issue-color glows
- **Multi-panel layout**: 7 presets via paneforge. Smart defaults (session spawn opens second panel)
- **Main toolbar**: Title/Subtitle | Sync | Notifications | Forest Toggle | Create Issue (split-button)
- **Bottom panel toolbar**: Sort | Filter | Clean Up Worktrees. Batch mode: "N selected" + batch action buttons

### Overview Dashboard (implemented)

PRD #96 (platform & settings). Sub-issues: #212-#218.
Design: `claude_design/Workspace Card.html`, `claude_design/Workspace Card v1.html`.

- All workspaces as responsive card grid. Each card: health grid (Issues/PRs/ATTN/HITL), PRD row, AFK status, cost footer
- Card variants: default, active (breathing glow), needs-attention, urgent, dormant, empty
- 12-preset accent color palette. Right-click → edit dialog. Gear icon for settings access
- Toolbar with Sort, Filter, Settings (planned: #274, #276)

### Issue Creation (implemented)

PRD #89. Sub-issues: #133, #148, #172, #174, #181.
Design: `claude_design/Creation Wizard.html`.

- **Manual**: 5-step keyboard-driven wizard (GitHub search → name → worktree y/n → color → progress). Click-to-advance, dynamic footer hints, arrow nav from any focus
- **Quick add**: One-click from assigned GitHub issue (with/without worktree)
- **GitHub trigger** (planned): `grovekeeper:execute` label → auto-create + worktree + session
- 24-color palette (6 hues × 4 rows), auto-rotation, theme-aware orientation
- Priority: lowest/low/medium/high/top. Defaults to medium, not prompted during creation

### Session Management (partially implemented — UI done, backend wiring in progress)

PRD #90. Sub-issues: #150-#164. Unresolved: still-open sub-issues #156, #158, #163, #164.
Design: `claude_design/Session Chat View.html`, `claude_design/Bottom Panel Session Tab.html`.

- Sessions = individual AI agent CLI executions tied to an issue
- Session states: running, needs-input, needs-review, stopped, finished, errored
- Three modes: **Spawn** (child process, stream-JSON), **Monitor** (discover external sessions), **Adopt** (resume external in Grovekeeper)
- Provider/model selection per session (v1: Claude Code, Cursor, Codex, OpenCode — providers #160-#162 implemented)
- Track: cost (USD), tokens (input/output/cache), duration, transcript, tool calls

### Session Chat UI (frontend components built, not yet wired to live sessions)

PRD #90. Sub-issues: #151-#155, #157, #159. Remaining: #156 (spawn dialog), #158 (Files/Stats tabs), #163 (history search), #164 (bottom panel session tab).
Design: `claude_design/Session Chat View.html`.

- **Layout**: top bar + chat column (left) + right sidebar (272px expanded / 44px collapsed)
- **Top bar**: session title + state badge | branch + issue + PR badges | Open in CLI + overflow + tab switcher (Chat/Files/Stats)
- **Right sidebar**: Provider, global usage (5h/7d quotas), session metrics (context/cost/tokens), sub-agent tree
- **Chat column**: user/assistant bubbles with markdown, syntax-highlighted code blocks, tool call cards (3-level: compact/expanded/interactive), streaming text with caret, content dimming above last prompt
- **Floating input panel**: image carousel + skill chips + textarea (slash/@ autocomplete) + controls (attach, tools, provider+model+effort, permissions, send/stop morph)

### Issue Environment (implemented)

PRD #89. Sub-issues: #131.

- Per-issue: worktree folder, editor instance, terminal session
- Three header buttons: Open Folder, Open Terminal, Open Editor. Ghost when unassigned (click assigns)
- Peacock color sync for VS Code/Cursor

### Worktree Lifecycle (implemented)

PRD #89, PRD #91. Sub-issues: #131.

- Create/remove via `setup-worktree.sh` / `remove-worktree.sh` scripts
- State machine: none → pending → active → failed (with retry)
- Smart branch naming from GitHub issue title (5 words, max 50 chars, git-safe)
- Prune dialog with safety categorization: Safe/Risky/Dangerous

### Git & GitHub Integration (implemented)

PRD #91. Related: #263 (OAuth), #280 (CLI status card).

- `gh` CLI primary, `gh api graphql` for bulk sync, `git2` crate for batch reads
- GitHub OAuth device flow (#263, #267) replacing `gh auth` dependency
- State sync: immediate fetch after actions, manual sync, 5-minute TTL cache
- GitHub page (`/github`): Issues | PRs | Worktrees tabs

### Action Buttons / Skills (implemented)

PRD #89. Sub-issues: #184. Related: #229 (wire quick-actions — open).

- Configurable per-issue action buttons. Max 2 visible on card, rest in overflow
- Primary action (moss green) = context-derived via `deriveContextualActions()` priority cascade
- Default set: Run, Review, Check & Fix, Commit variations, Push, PR, Sync Base, Merge, HITL, etc.
- Open: #229 — wire quick-action buttons to actual Rust commands

### Notification System (implemented)

PRD #95. Sub-issues: #235-#237, #264, #266 (event trigger wiring — open), #268, #286.

- Cross-platform: Tauri notification (toast), rodio (sound), window attention (flash)
- 15 events across 3 importance tiers: Critical (never debounced), Important (debounce-able, sound ON), Normal (sound OFF default)
- Sequential playback queue (cap 5), per-session debounce, random rotation
- Open: #266 — wire 4 session notification event triggers from source points

### Character Pack System (implemented)

PRD #95. Sub-issues: #265, #290.

- Per-issue character assignment (random from enabled pool, manual override)
- Character creator: full-page editor, sound pool + event assignment via drag-and-drop, avatar upload
- Bulk import wizard: scan structured folders, auto-map by filename pattern
- Bundled packs: Grove + peon/peasant variants (EN/CZ)

### Metrics & Statistics (implemented)

PRD #93. Sub-issues: #247-#249, #259, #289. Remaining: #250 (optimize view), #251 (compare view).

- Real-time capture from session actor + historical import from session directories
- Usage dashboard: workspace-scoped (global toggle), KPI cards, cost chart, activity breakdown, period filters, custom date range, URL state sync, CSV export
- Pricing: LiteLLM → OpenRouter → bundled snapshot → user overrides. Multi-currency via Frankfurter API
- Achievements: 10 milestone-based, notification on unlock
- Open: #250 — optimize view (waste detection, health scoring). #251 — compare view (model comparison)

### AI Configuration (implemented)

PRD #94. Sub-issues: #282, #288.

- Provider-scoped page: Claude Code, OpenCode, Codex, Cursor
- Tabs per provider: Skills, Agents, Hooks, MCP Servers, Rules, Memories, Instructions, Settings
- Card view / list view, sort, group, cross-tab search. Detail/edit/delete modals
- Skill overrides (Claude Code): on/name-only/user-invocable-only/off per workspace

### Forest View Visualization (partially implemented — rendering + layout done, overlays/accessories planned)

PRD #88 (open). Sub-issues: #118-#123, #206. Unresolved: #203. Future redesign: PRD #256.
State mapping: `.mpx/knowledge/STATE_MAPPING.md`.

- Each issue = a tree. PRD = large oak at center. Blocking = depth rows behind
- 12 lifecycle stages: seed → sprouting → sapling → growing → leafy → flowering → fruiting → seasonal → wilting → bare → dead → stump
- Stage cascade, overlay system, execution phase tools, sub-agent birds: see `STATE_MAPPING.md`
- Tree shapes mapped to GitHub labels. Deterministic layout via `mulberry32(seed)`

### AFK/HITL Workflow (not yet implemented)

PRD #92 (open).

- **AFK loop**: Watch for AFK-labeled issues, pick unblocked, spawn execution session. Toggle on/off
- **HITL sessions**: Spawn separate session for grilling, provider/model selectable
- **One-way HITL→AFK flip**: After resolution, mark as AFK. Unresolved items create new linked issues

### Workspace Settings (implemented)

PRD #96, PRD #255 (open — further work). Sub-issues: #261.
Summary: `.mpx/knowledge/WORKSPACE_SETTINGS_SUMMARY.md` (archived).

- **Settings split**: User settings (global, bottom-left sidebar) vs Workspace settings (full page from workspace sidebar)
- **Workspace page sections**: General (name, accent, repo, branch, folder), Worktrees (parent folder), Commands (server + check entries)
- **Archive/Delete**: Archive = soft reversible. Delete = only on archived, type-to-confirm

### Keyboard Shortcuts (implemented)

PRD #87. Sub-issues: #104.

- Global registry, `window` keydown listener, inline rebinding, SQLite persistence
- Command palette: Ctrl+K, fuzzy search across actions/navigation/issues (#103)

### Sort & Filter System (partially implemented)

Reusable `SortFilterControls` component. State persisted to localStorage per-surface.
Open: #276 (overview page sorting/filtering/configurable footer).

### Internationalization (implemented — incremental)

PRD #87. Sub-issues: #101.

- Paraglide: en + cs. All user-facing strings via `m.key_name`. Rust returns error keys. RTL excluded

### PRD Management (planned)

PRD #219 (open).

- PRD row on workspace cards with aggregate sub-issue progress
- Dedicated PRD view with cards, blocking relationships, status indicators

### Assigned Issues Panel (implemented)

PRD #89. Sub-issues: #135, #269.

- Dedicated bottom panel tab with sortable table, batch actions, search
- Quick-add (with/without worktree) from assigned GitHub issues

---

## Non-Functional Requirements

- **Performance:** UI responsive during git/GitHub ops. Forest handles 50+ trees. Session list handles 100+ entries
- **Reliability:** Zero false positives for needs-input notifications
- **Offline:** Graceful degradation — cached data with "last synced", disabled buttons for internet-dependent actions
- **Security:** No token/secret storage (relies on GitHub OAuth). No secrets in SQLite. Safe script spawn (`shell: false`)
- **Testing:** 80% coverage (Vitest), E2E (Playwright), component stories (Storybook). See `.mpx/testing-framework/`
- **Accessibility:** Keyboard-navigable, ARIA labels, focus management. Event propagation rules for floating overlays

## Open Questions

1. **Reconnection strategy** — Caching depth, retry behavior, queue-and-send-on-reconnect for flaky internet
2. **Tree color adaptation** — Exact algorithm for blending issue-assigned color with stage palette
3. **Session reliability** — Polling cross-check for needs-input state to ensure zero false positives

## Out of Scope for V1

- RAG integration, vector databases, embedding models
- Advanced prompt analytics, A/B testing, prompt versioning
- GitHub App / webhook relay (using label polling instead)
- Built-in code editor, embedded terminal (xterm.js)
- Mobile push notifications, RTL language support
