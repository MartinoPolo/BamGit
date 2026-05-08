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
- **Primary view: Forest View** — persistent collapsible panel, open by default. Renders below the dashboard header (never overlays header or sidebar). Collapse/expand via a forest-icon toggle button in the main toolbar. Forest occupies the top portion; the bottom portion hosts tabbed detail content
- **Bottom panel tabs**: `Issues | Kanban | Dependencies | Activity | Session`. Issue Detail replaces tab content contextually when a tree/card is selected (per PRD #122 REQ-18 auto-promote logic). Filter-type tabs filter to selected issue, Highlight-type tabs highlight the node
- **Issue cards** appear in the bottom panel Issues tab in a **responsive two-column row-major grid** (`grid-template-columns: repeat(auto-fill, minmax(450px, 1fr))`, row-major order). Cards have a 450px minimum width; the grid automatically drops to one column when viewport width cannot fit two. Each card shows: color header band (issue color background, WCAG-contrast text), issue name (clickable link to GitHub issue when linked), session state chip (same contrast technique as priority chip), status badges, tree thumbnail (72px). Header right side has quick-action buttons (Open Folder, Open Terminal, Open Editor) — always visible, ghost appearance when no folder assigned (reduced opacity, muted, still clickable to assign folder via native file picker). No checkboxes for selection — use border/shadow/glow only. No whole-card tooltip — all info visible directly on the card; individual button tooltips retained
- The default/primary view is configurable in settings (forest open by default, or collapsed by default)
- Badges on cards: branch status (active/local/remote-gone/deleted), PR state (open/draft/review-requested/merged/closed/ready-to-merge), GitHub issue state (open/closed), sync status (behind base count), merge conflict indicator
- Badges are interactive: clicking PR/issue badge opens GitHub URL
- Badges are responsive: collapse to icon-only when header space is insufficient
- **GitHub badge row always rendered** with `min-h-[22px]` even when no PR/issue badges exist, so GitHub labels below remain at consistent vertical position
- **Issue card visual improvements**: reduce header band saturation in dark mode (~20%), subtle gradient tint (8% issue color overlay on background, matching workspace card pattern), take hover/glow/ring/shadow inspiration from workspace cards (consistent border color on hover, glow, tint). Design brief for card redesign variants. No left accent border (reserved for workspace cards).
- **Issue card status row**: New row showing dev server and check command results as badges (green/red/orange). Click badge → navigate to process log. Generalized for unlimited user-defined commands.
- One workspace = one dashboard = one GitHub repo
- **Overview dashboard** (separate window/page): shows all configured workspaces as cards in a responsive grid (`repeat(auto-fill, minmax(320px, 1fr))`). Each workspace card is a living dashboard widget:
    - **Header**: workspace name (bold), accent-color thumbnail (or 2-letter initials placeholder), subtitle line showing repo default branch + active worktree count. Top-right: GitHub icon button (custom fill-based `GithubIcon.svelte`) + folder icon button (Lucide `folder` closed)
    - **Health grid** (4 equal-width stat cells, order: Issues → PRs → ATTN → HITL): Issues shows dual number `{afk_actionable}/{total_tracked}` (AFK = unblocked issues with AFK label; total = non-PRD Grovekeeper issues). ATTN uses danger tone (red) with pulse dot when >0. HITL uses warning tone (amber) with pulse dot when >0. Each stat cell is clickable — navigates to the relevant filtered view in the workspace dashboard
    - **PRD row** (compact inline): `{N} PRDs · {completed}/{total} done [progress_bar]`. Aggregate sub-issue completion across all open PRDs. Click → PRD view. Hidden when no PRDs exist
    - **AFK status row**: LED indicator (glowing green when on, gray when off) + label + session breakdown (`5 sessions (3 AFK)` / `idle` / `last {time}`). AFK session count = sessions spawned by AFK loop only. Click → AFK loop page. Start/stop toggle only in workspace dashboard, not on overview card
    - **Footer**: `today $X.XX` (cost period hardcoded to "today", configurable period deferred to PRD #93 Metrics) + relative timestamp of last workspace activity
    - **Card variants**: default, active (breathing glow when AFK on), needs-attention (amber accent when HITL >0), urgent (red accent when ATTN >0), dormant (desaturated when no activity >24h), empty (placeholder when no issues tracked)
    - **Accent colors**: 12-preset palette (moss, amber, bark, azure, plum, teal, rose, coral, gold, sage, indigo, fuchsia) selected via inline `ColorPickerContent` (2×6 grid) in workspace settings
    - **Card component integration**: derives from base `Card` with `accentBarColor` (3px left border) and `gradientTint` (8% accent overlay) props. State variants handled by WorkspaceCard, not Card
    - **Icon buttons**: `ghost` variant, `icon-sm` (26px), `text-foreground-subtle` at rest, strokeWidth 1.7. Unassigned state: opacity 0.35, click/right-click opens `DashboardEditDialog`
    - **Settings gear icon**: ghost `icon-sm` button in header row alongside folder/GitHub buttons. Left-click opens `DashboardEditDialog`. Provides discoverability for touch users.
    - **Right-click** on workspace card (any area) → opens `DashboardEditDialog` directly (no dropdown context menu)
    - **Empty card text**: "Newly created — open to track issues" (not "planted")
    - **Add Workspace card**: dashed border, centered + icon, "Add workspace" label (no subtitle). Click opens workspace creation wizard
    - Click any card area (except buttons) → opens/focuses that workspace's window
    - Hover: translateY(-2px) + accent-colored glow + border tint
- **Overview toolbar**: Header row reused (title+subtitle left, controls right). Right-aligned ghost icon buttons: Sort dropdown (Name, Activity, Issue count, Cost), Filter dropdown (All, Active, Needs Attention, Dormant), Settings gear (opens popover to configure card footer content: today's cost, week cost, total cost, active sessions, last activity)
- **Main toolbar**: Title/Subtitle | Sync | Notifications | Forest Toggle (icon button) | Create Issue (split-button: Add Issue / Add Worktree Issue, persists last-used action)
- **Bottom panel toolbar** (Issues tab): Always-visible persistent bar with consistent height (no layout shift). Default state (no selection): ghost appearance (no background/border), showing Sort | Filter | Clean Up Worktrees. Selected state: "N selected" count | Batch action buttons (Archive, Unarchive, Delete, Change Priority, Clean Selected Worktrees) | Deselect All (×). Modifier-held state (Ctrl/Shift pressed, nothing selected): toolbar gains selected-state visual styling (bg + border) but keeps default content. "Clean Up Worktrees" changes to "Clean Selected Worktrees" when batch selection is active. All worktree cleanup actions show a confirmation dialog
- **Batch selection**: Multi-select issue cards/trees for bulk operations. Triggers: right-click context menu "Select" (desktop), long press 500ms (mobile/touch), Ctrl+click (toggle individual), Shift+click (range select with Windows Explorer pattern — range vs individually-selected items tracked separately, shift-clicking to a shorter range deselects items outside the new range while preserving Ctrl+clicked items), Ctrl+A (select all), Escape (deselect all). Selection clears on tab change and Escape; does NOT clear after batch action. Normal click (no modifier) clears batch selection and activates the clicked card. Clicking an already-active card does NOT deactivate it — deactivation only via Escape or clicking empty space in the grid. Batch actions: Archive, Unarchive (context-aware — both show if mixed), Delete, Change Priority. NOT batch: Change Color. Unavailable actions disabled with tooltip; partially applicable actions enabled with info tooltip ("affects 2 of 5")
- **Active vs Selected terminology**: "Active" = single-click inspect (one at a time, shows bottom panel detail). "Selected" = batch selection (multiple, for bulk ops). Activation clears batch selection. **Card state visual hierarchy** — uses `box-shadow` (not Tailwind `ring-*`) for all state rings, enabling both sharp rings and soft glows. States differentiated by ring thickness, glow blur, and color source. Hover/active rings suppressed on selected cards. Background tint applied on hover and active (`color-mix(in oklch, var(--ic) 6%, var(--surface))`):
    - Default → no ring, no tint
    - Hover → 2px sharp `box-shadow` ring in **issue's own color** (40% opacity) + border tint + subtle background tint — only on non-active, non-selected cards
    - Active → 3px `box-shadow` ring in **issue's own color** (55% opacity) + 14px blurred outer glow (20% opacity) + background tint — heavier, committed feel
    - Selected (batch) → 3px `box-shadow` ring in `--primary` (moss green, 45% opacity) + subtle body tint — system-level action, not issue-specific
    - Selection-ready (Ctrl/Shift held) → violet ring
- **Issue card context menu**: Right-click opens a bits-ui `ContextMenu` with all actions from the overflow (⋯) menu: Select/Deselect (top, separated), Edit, Rename (standalone only), Priority submenu, Change Color, Setup/Remove Worktree, Archive/Unarchive, Delete. "Select" is the first item with a separator below it. When right-clicking a batch-selected card: show batch actions ("Archive 5 selected", etc.). When right-clicking an unselected card: clear batch selection, activate card, show single-card actions (file manager pattern). The overflow (⋯) button is kept for touch/accessibility but opens the same context menu component programmatically
- **Forest context menu**: Migrate existing `ForestContextMenu` to bits-ui `ContextMenu` for consistency. Add "Select" action matching card context menu behavior
- **Forest ↔ card two-way binding**: Selection state syncs between forest trees and issue cards. Hovering/selecting a tree highlights its card and vice versa. Both surfaces use the issue's own color for hover and active glows — forest uses SVG `feGaussianBlur`, cards use CSS `box-shadow` with blur. Selected (batch) uses `--primary` on both surfaces. **Glow exclusivity**: When hovering a different issue than the active one, suppress the active tree's glow (only the hovered tree glows). Active glow returns when hover ends.
- **Legend**: floating button inside the forest panel, not in the main toolbar
- **"Assigned Issues" tab**: Separate tab in the bottom panel (alongside Issues, Kanban, etc.) showing GitHub issues assigned to user (via `gh`). Supports quick-add (bypass creation wizard) and quick-add-with-worktree. Shows PRD number, issue number, issue title. Visible side-by-side with Issues tab when multi-panel layout is active. Design brief required for final layout.
- Dashboard-level color palette configuration (vivid, pastel, etc. — 24 colors, 6 hues × 4 rows)

### Issue Creation

- **Manual create:** Multi-step keyboard-driven wizard (modal at top of screen):
    1. GitHub issue search (live, number-aware, arrow-key navigation). No preselection on open — Enter with no selection = Skip. Arrow nav fills search bar with selected issue title (display only, no search trigger). Clicking an issue = select + advance
    2. Issue name entry (pre-filled from GitHub if selected). Name excludes issue number (displayed separately on card). Trailing special characters stripped
    3. Worktree yes/no (conditional). Clicking Yes/No = select + advance
    4. Color selection (24-color palette, auto-rotation, custom input). Clicking a swatch = select + advance (creates issue on last step)
    5. Worktree creation progress (if yes)
    - **Click-to-advance:** Clicking any selectable item confirms + advances to next step across all steps
    - **Dynamic footer:** Back/Cancel buttons swap keyboard hints based on text input focus. Back shows Esc when input focused, Backspace when not. Cancel shows Esc only when no Back button or input not focused. Navigation hint ("Navigate" text + separate arrow Kbd icons) shown per step: ↑↓ on step 1 (always visible), hidden on step 2, ←→ on step 3, ↑↓←→ on step 4 (hidden when hex input focused). Step 3: no element focused on entry (blur on mount)
    - **Arrow nav from any focus:** Arrow keys navigate items when any element in the modal is focused (not just text input). Exception: text input focused = arrows control cursor
    - **Keyboard routing:** Enter confirms current step from **any focus within the modal** (global handler routes to step's confirm function). Empty name on step 2 shows inline validation error. Escape goes back when text input focused on non-first step, closes wizard otherwise (Dialog's own Escape suppressed via `onEscapeKeydown`). Backspace goes back when no text input focused
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

- 24-color palette (6 hue columns × 4 rows: normal, darker, lighter, specials), no gray colors in main palette (reserved for disabled states). Row 4 specials: black, white, gray, 3 bonus hues
- Theme-aware orientation: darker shades at top in dark mode, lighter in light mode
- Auto-preselect next available color (rotate from last-used position)
- Already-assigned colors disabled (rendered gray) — blocking is implicit via `usedColors` prop, omit for non-blocking pickers (e.g. settings glow)
- Color picker UI: single swatch trigger (32px) opens a Popover dropdown with preset grid + hex input + native picker. Optional `displayText` prop (e.g. "A") for text readability preview on swatches — omit for pure color pickers
- Single main color drives visual identity: VS Code Peacock, terminal tab, tree visualization
- Release color on archive, delete, or color change
- Closed issue appearance: CSS overlay `filter: grayscale(0.8) opacity(0.7)` — preserves stored color for reopening

#### Priority System

- Levels: lowest, low, medium, high, top (no "none" option — medium is the default)
- Default: medium (assigned automatically, not prompted during creation)
- Medium priority has no visible badge on the card
- Non-default levels (low, lowest, high, top) show a badge in the card header
- Priority badge in card header is clickable — spawns priority change menu inline
- Also changeable via context menu Priority submenu
- Some views sort by priority; blocking relationships can prioritize higher-priority issues closer to front

### Session Management

- Sessions represent individual AI agent CLI executions tied to an issue
- One issue can have many sessions (over time and concurrently)
- Session states: running, needs-input, needs-review, stopped, finished, errored (no "paused" state — stopping and returning later is equivalent)
- Three modes of session management:
    - **Spawn:** Grovekeeper launches agent CLI as child process, communicates via stream-JSON protocol
    - **Monitor:** Grovekeeper discovers externally-launched sessions by polling session directories
    - **Adopt:** Externally-launched session can be closed and resumed inside Grovekeeper (or vice versa)
- Provider/model selection per session (v1: Claude Code, Cursor, Codex)
- Track per-session: cost (USD), token count (input/output/cache), duration, transcript, tool calls
- Provider capability matrix: spawn support, session discovery, historical import, session file format, subscription types

### Session Dashboard (Chat UI)

Canonical design spec: `claude_design/design_briefs/SESSION_CHAT_VIEW.md`. Variant C (right sidebar layout) is the chosen base; refined per the 2026-05-06 grilling session.

#### Page layout

Three regions: full-width **top bar**, **chat column** (left), **right sidebar** (272px expanded / 44px collapsed).

#### Top bar

- Left group: session title + state badge (running / needs-input / needs-review / stopped / finished / errored)
- Center group: branch name + issue badge + PR badge (single inline row, monospace where appropriate, badges clickable to open GitHub URLs, collapse to icon-only on narrow widths)
- Right group: `[↗ Open in CLI]` action (resumes session in native provider CLI — `claude --resume`, `codex --resume`, etc., spawned in terminal at worktree path) + `[⋮]` overflow menu (Export chat; Restart and Delete session reserved for future) + tab switcher (Chat / Files / Stats). Stop is handled by send↔stop morph in the input panel, not the overflow menu
- No provider/model/permission/cost fields in the top bar

#### Right sidebar (expanded, 272px)

Sections top to bottom with separators:

1. Header: collapse toggle (left-aligned, closest to content boundary)
2. **Provider** section: provider icon + name (clickable chip — placeholder for future provider switcher)
3. **Global usage** section: 5h quota progress bar + countdown, 7d quota progress bar + countdown
4. **Session metrics** section (separator above to distinguish global vs session-scoped data): Context bar + value, Cost value, Tokens value
5. **Sub-Agents** section: header + count badge + tree (responsive height — fills remaining sidebar space, scrolls if long)

Progress bar alignment: equal-width bars across all rows, filling space between longest left label and longest right value with ~8px padding.

Color thresholds:

- Context: green <40% / orange 40–60% / red >60%
- 5h and 7d quotas: green <60% / orange 60–85% / red >85%

#### Right sidebar (collapsed, 44px)

Vertical strip: collapse toggle, state pulse dot, vertical context bar with rotated `%`, "N agents" rotated text. No cost in collapsed state.

#### Chat column

- Tab switcher (Chat / Files / Stats) at the top
- Message stream:
    - User messages right-aligned bubbles, assistant left-aligned with full markdown
    - Syntax-highlighted code blocks with copy button and language label
    - Tool call cards: 3-level system (compact / expanded / interactive) per `SESSION_CHAT_VIEW.md`
    - Approval / elicitation / question cards as Level 3 tool cards
    - Streaming text appears character-by-character with caret
    - Content above last user prompt is visually dimmed (`opacity: 0.4`). Dimmed content remains scrollable and fully interactable. On hover, the entire turn (user msg + assistant response + tool cards) restores to full opacity with `transition: opacity 150ms ease-out`
    - Floating quick-nav buttons: "Jump to latest response", "Jump to latest prompt"
    - Inline sub-agent expansion when a tree node is clicked — colored left border, nested expansions use progressive border colors
    - Images render inline in message bubbles with `#N` caption beneath each

#### Floating input panel

Floating, rounded, elevated surface (not a full-width bar). Max-width ~900px, centered in chat column, ~20px from chat-column bottom. Solid opaque background. Content column shares the same ~900px max-width constraint (no content wider than the input panel). Gradient fade (~120px) behind the panel prevents content from visually colliding with it.

Vertical structure:

1. **Image carousel** (collapsible): collapsed by default; expands on paste/upload; auto-collapses on send. Session-wide persistent `#N` numbering. Carousel of all session images with `#N` captions; horizontal arrow scrolling on overflow.
2. **Skill chips row**: Execute, Review, Check & Fix, Commit, Ship, More ▾. Always visible. Context-aware (some chips appear/hide on session events). Click pre-fills textarea with the slash command.
3. **Textarea**: 3-line default, auto-grow up to ~50vh then internal scroll. Slash autocomplete (`/`), `@` mentions for files / issues / sub-agents / past images. Pasted image inserts `[Image #N]` pill.
4. **Bottom controls row**:
    - Left group: `[+ Attach]`, `[Tools ▾]` (popover with per-session MCP / skills / tools toggles)
    - Right group: `[Local ▾]` (location placeholder; future Cloud / Remote SSH), `[Provider · Model · Effort ▾]` (combined dropdown grouped by provider, then models with context window in parens, then effort levels), `[Approve each ▾]` (permission mode), `[→ Send / ■ Stop]` (morphs: Send with `Enter` hint when idle, Stop with `Ctrl+C` hint when agent is generating)

- All buttons in the input panel use `.gk-btn-sm` (26px) — no inline height overrides. Send/Stop distinguished by primary/danger color, not size. All tool card headers standardized to 36px. All badges use `.gk-badge` (20px)

Sync rule: model, effort, permission mode, location are session-level state and live ONLY in the input panel. Sidebar provider is read-only (with future switcher menu); no other duplicates.

#### Sub-agent display

- Deterministic tree of all sub-agents spawned (parsed from session JSON/JSONL, not AI-generated)
- Per node: name, model (abbreviated), status indicator (running / completed / failed), tool count, duration
- Lives in the right sidebar's Sub-Agents section
- Click a node → expand its messages inline in the chat stream at the spawn point, with colored left border; nested expansions use progressively different border colors
- Active expansion indicator on the tree node when inline expansion is open

#### Image handling

- Session-wide persistent numbering. Image #1 stays #1 for the lifetime of the session.
- Pasted/uploaded image inserts `[Image #N]` pill in textarea at cursor; backspace deletes the pill as a unit
- Past images are referenceable by number naturally in subsequent prompts (the placeholder is in transcript history)
- Image carousel above the textarea provides visual access; collapses on send

#### Session-level actions

- **Open in CLI** (top bar): resumes the session in the native provider CLI by spawning the appropriate command in a terminal at the worktree path. Provider-aware: each provider has its own resume command and behavior. Tooltip shows the exact command before clicking.

#### Skill controls and configuration

- Skill chips row in the input panel (see above) for one-click slash command insertion
- Tools popover in the input panel for per-session toggles (MCP servers, skill availability, tool availability)
- Skill configuration panel (separate surface, accessed via gear): event-based skill assignment (On session start, After execution, On error, On merge conflict, After commit, After PR created) + skill discovery from `.claude/` user/project folders + custom paths

#### Session history and search

Browse past sessions for any issue. Full-text search content with multi-scope (single session / issue-scoped / PRD-scoped). Background search process. Filter by date / provider / outcome.

### Issue Environment

- Each issue has an **issue environment**: worktree folder, editor instance, terminal session
- **Editor:** Launch VS Code or Cursor via CLI. Verify Peacock color matches issue color in `.vscode/settings.json`.
- **Terminal:** Open platform-appropriate terminal at worktree path. Pass issue color to terminal tab where supported.
- Per-issue folder assignment via three header buttons (Open Folder, Open Terminal, Open Editor). When folder assigned: left-click opens respective app at folder path; right-click opens native file picker to reassign (silent replacement, no confirmation). When no folder assigned: ghost appearance (reduced opacity, muted) but still clickable — left-click opens native file picker to assign; right-click also opens file picker. Tooltips: "Open [path]" / "Open terminal [path]" / "Open editor [path]" when assigned, "Assign folder" when unassigned. Editor icon changes based on user's configured editor (VS Code, Cursor, etc.)

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
- Prune fully-closed worktrees (merged PR + deleted branch + closed issue) — batch removal supported. Prune actions available via: issue card context menu (promoted to primary action in terminal states), forest tree right-click context menu, and "Clean Up Worktrees" button in bottom panel Issues tab toolbar. When batch selection is active, button changes to "Prune Selected Worktrees" and opens prune dialog filtered to selected issues
- **Prune safety categorization** (shown in prune dialog): Safe (PR merged + issue closed + branch gone, pre-checked green), Risky (PR merged but issue open or branch still active, unchecked amber warning), Dangerous (PR open/draft/review-requested/approved or active session, unchecked red warning with reason), No worktree (grayed out, skipped). Risky/dangerous worktrees listed but not pre-selected; user can opt-in
- Per-project worktree folder: `{parent}/{project-name}-worktrees/` (configurable in settings)
- Auto-detect existing worktrees in configured folder on first setup
- Path change dialog: move worktrees / redetect in new folder / delete all originals
- Smart branch/worktree naming: Branch/worktree name from GitHub issue title: first 5 words, max 50 characters, lowercase, dashes, git-safe.

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
- Default set: Run, Review, Check & Fix, Commit, Commit & Push, Commit Push & PR, Push, Create PR, Sync Base, Merge, HITL, Code Clean, View Session, Setup Worktree, Remove Worktree
- User can: add, edit, reorder, hide, replace defaults with custom actions
- Actions can be skill invocations, raw prompts, multi-skill chains
- Workspace-level and global actions supported

#### Contextual Action System

- **Max 2 visible buttons** on card; additional actions in overflow (⋯) menu. Context menu includes all actions with disabled states for unmet preconditions.
- **Primary action** (first button) uses moss green background for the recommended next step.
- **Pure function** `deriveContextualActions(issue, cache, sessionState, allActions)` returns prioritized action list. First match in a 14-row priority cascade wins. Rule-based `show_when` conditions on Action rows deferred to v2.
- **"Run" action**: One-click full autonomous workflow — creates worktree (if needed) → `mp-execute #N` → review → commit → push → PR → merge. Primary action for idle and AFK issues.
- **"View Session" action**: When session is running, primary action navigates to session detail page (history, agents, background terminals). All other actions disabled during active session.

#### Action Invocation Types

- **Agent actions** (spawn CLI session with pre-filled skill command): Run (`mp-execute`), HITL (`mp-hitl`), Review (`mp-review`), Check & Fix (`mp-check-fix`), Commit (`mp-commit`), Commit & Push (`mp-commit-push`), Commit Push & PR (`mp-commit-push-pr`), Create/Update PR (`mp-pr`), Code Clean (`mp-code-clean`)
- **Deterministic actions** (direct git/Tauri commands, no agent): Push (`git push`), Merge (`gh pr merge`), Sync Base (`git merge` if no conflicts, else agent `mp-sync-base`), Setup Worktree, Remove Worktree
- **UI actions**: Create Issue (global toolbar/command palette, not per-card)

#### Required State Dimensions (backend prerequisite)

- `has_local_changes` (dirty working tree) — needed for Commit actions. Not yet tracked in `GitStatusCache`.
- `ahead_remote_count` (unpushed commits) — needed for Push/PR actions. Not yet tracked in `GitStatusCache`.

#### Future: `prepareIssueContext()` Optimization

- Gather issue body, comments, labels, git status, execution summaries deterministically before spawning agent session
- Saves agentic tokens by front-loading context that skills currently gather themselves
- When skills are split (implement → review → commit/push/PR), execution summary from previous step should be gathered and passed to next agent (session context handoff)

### Notification System

- Cross-platform (Tauri notification plugin + rodio sound + window attention)
- Frontend passes translated title/body to Rust dispatch command (Rust does not generate user-facing text)
- Per-event configuration stored in SQLite
- Sound formats: WAV (bundled) + OGG (user packs) via rodio. No MP3
- CESP/peon-ping manifest format for sound pack import (`openpeon.json`); native `grovekeeper.json` manifest for full 15-event packs
- Bundled default "Grove" sound pack (10 unique CC0 sounds, all ≤3s)
- Sound rotation: multiple sounds per event, random selection excluding last played
- Per-event: enable/disable, assign sound, mute, merge events to share sounds
- Bundled pack in `resources/sounds/`, user packs in `<app_data_dir>/sound-packs/<pack-name>/`

#### Character Pack System

- **Characters assigned per-issue** — random from enabled pool on issue creation, manual override via spawn dialog or issue card context menu
- Sessions without a Grovekeeper issue get no character (default pack, no persona)
- Character identity: icon + name in selection UI, icon only on issue card
- Issue card avatar placement: bottom-right corner next to action buttons, same rounding as icon-only button
    - Left-click: mute all sounds for that issue (toggle, crossed-out visual)
    - Right-click: dropdown — character list (icon + name), divider, "Play random sound", "Mute" toggle
- Each character pack provides sounds for all 15 events + a small avatar image

#### Importance Tiers

| Tier          | Events                                                          | Sound Default | Debounce    |
| ------------- | --------------------------------------------------------------- | ------------- | ----------- |
| **Critical**  | `session.needs-input`, `session.end`                            | ON            | Never       |
| **Important** | `session.error`, `merge.conflict`, `resource.limit`, `pr.ready` | ON            | Per-session |
| **Normal**    | All others (9 events)                                           | OFF (muted)   | Per-session |

Rule: `sound_enabled` defaults to `true` only for Critical and Important events. Normal events are assigned a sound but muted by default. Users toggle in settings.

#### Playback Behavior

- Sequential queue with wait-for-finish — simultaneous notifications play one after another
- Queue cap at 5 — overflow plays a single summary sound
- Per-session debounce — same session + same event type within window gets suppressed
- Only Critical events are never debounced

#### Volume Control

- Two layers: global volume (float 0.0–1.0, default 0.8) + per-sound user override in DB
- Final playback volume = `global_volume × user_override`
- Controlled from Sound/Notification Settings UI

#### Notification Events

| Event                     | Tier      | Toast    | Sound (default) | Window Flash      |
| ------------------------- | --------- | -------- | --------------- | ----------------- |
| `session.needs-input`     | Critical  | Yes      | ON              | Yes (until focus) |
| `session.end`             | Critical  | Yes      | ON              | No                |
| `session.error`           | Important | Yes      | ON              | Yes (until focus) |
| `merge.conflict`          | Important | Yes      | ON              | No                |
| `resource.limit`          | Important | Yes      | ON              | No                |
| `pr.ready`                | Important | Yes      | ON              | No                |
| `session.start`           | Normal    | Optional | OFF             | No                |
| `task.complete`           | Normal    | Yes      | OFF             | No                |
| `task.acknowledge`        | Normal    | Optional | OFF             | No                |
| `pr.merged`               | Normal    | Yes      | OFF             | No                |
| `pr.review-requested`     | Normal    | Yes      | OFF             | No                |
| `branch.behind-base`      | Normal    | No       | OFF             | No                |
| `github.issue-assigned`   | Normal    | No       | OFF             | No                |
| `github.trigger-received` | Normal    | Yes      | OFF             | No                |
| `achievement.unlocked`    | Normal    | Yes      | OFF             | No                |

### Configuration & Data

- All state in SQLite (single file)
- Export/import configuration as JSON for portability (with schema version for migration)
- Workspace management: create, edit, archive, delete workspaces; assign color palette
- **Settings split**: User settings (appearance, language, notifications, keyboard shortcuts, providers, about) accessible from account section in bottom-left sidebar. Workspace settings as a full navigable page from workspace sidebar.
- **Workspace archive/delete**: Archive is soft and reversible (card hidden, restorable via "Show archived" toggle). Delete only available on already-archived workspaces, requires typing workspace name to confirm (destructive modal). Both are soft-deletes in DB (`status` column: `active`/`archived`/`deleted`).
- Per-platform terminal/editor configuration
- Startup behavior: auto-open last workspace OR show overview (configurable)

### Workspace Settings Page

Full settings page accessible from workspace sidebar. Sections:

**General:** workspace name, accent color (ColorPicker), GitHub repository (RepoCombobox), default base branch, local project folder.

**Worktrees:** worktree parent folder, auto-detect existing worktrees toggle.

**Commands:** Two categories, each supporting unlimited entries:

- **Server commands** — name, command string, optional port pattern (regex to parse port from stdout). Multiple dev servers can run simultaneously per issue. Examples: "Frontend" → `pnpm dev`, "Backend" → `cargo run`
- **Check commands** — name, command string, expected exit code. Examples: "Unit Tests" → `pnpm test`, "E2E" → `pnpm test:e2e`, "Lint" → `pnpm check:fast`

DB schema: `workspace_commands` table (`id, dashboard_id, category, name, command, port_pattern, sort_order`).

The existing `DashboardEditDialog` (compact modal) remains for quick edits (name, accent color, GitHub repo) — accessible via workspace card right-click or gear icon. Does not include dev server/test commands.

### Dev Server & Process Management

- Issue cards get configurable action buttons for running workspace server and check commands
- **Server processes**: tracked by Grovekeeper (PID, port, stdout/stderr streaming). Running indicator (green dot) + port number displayed on issue card. Click port → opens `http://localhost:{port}` in browser. Right-click port badge → view process logs.
- **Check processes**: run workspace check commands in issue's worktree. Results shown as status badges (green/red/orange) on issue card in a dedicated status row. Click badge → view process log/results.
- **Log viewer**: scrollable terminal-like output for running/completed processes
- Requires Tauri (child process management). Browser mock mode shows "Desktop app required" toast.

### Cross-Platform

- Windows, macOS, Linux from day one (via Tauri)
- Terminal abstraction: Windows Terminal, iTerm2, Terminal.app, GNOME Terminal, etc.
- Editor abstraction: VS Code, Cursor, other VS Code forks (all support Peacock)
- No platform-specific dependencies in core logic
- Platform-specific code behind clean abstractions in Rust `platform/` module

### Issue Tree Visualization (Forest View)

- Forest panel in top portion of workspace dashboard — persistent collapsible panel, renders below the dashboard header (never overlays header or sidebar). Collapse/expand via forest-icon toggle button in the main toolbar
- Open by default; configurable in settings whether forest starts open or collapsed
- Each issue = a tree whose shape/stage reflects lifecycle progress
- PRD/epic issues = large oak tree (central), with stone nameplate showing PRD title
- Clicking a tree updates the bottom detail panel with issue information

#### State Dimensions (determine tree appearance)

1. **GitHub Label:** `HITL` or `AFK`. Under a PRD, issues without either label should not exist — display in **error state** if they do (red glow, speech bubble with warning). In repo-wide forest (outside PRD context), unlabeled issues are displayed in a **special way** (distinct visual treatment, TBD — possibly potted plants if no worktree, or a unique badge/dimming for unlabeled trees with worktrees)
2. **Worktree State:** `none`, `pending`, `active`, `failed`, `removing`, `removed`
3. **Session State (aggregate):** `no-session`, `running`, `needs-input`, `needs-review`, `stopped`, `finished`, `errored`. Priority order for aggregate: needs-input > errored > needs-review > running > stopped > finished > no-session
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
| Growing        | Sapling with growth      | Session active (running, stopped, errored, needs-input)  |
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
- **Batch-selected:** Blue glow (`#4a9eff`, intensity 3). Two-way bound with issue card selection state. Matches card `ring-2` blue
- **Selection-ready** (Ctrl/Shift held): Blue glow (`#4a9eff`, intensity 1.5). Same color as selected but reduced intensity. Matches card `ring-1` blue. Tree supports same selection triggers as cards: Ctrl+click (toggle), Shift+click (range), right-click context menu "Select"

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
- Tree base size: 320px width (matching low-poly-2d-trees library), scaled by depth row. Overlap on narrow screens is acceptable — prefer taller visible trees over tiny non-overlapping ones
- Tree spacing: equidistant `100% / (treeCount + 1)` across viewport width (matching library approach)
- Background: import library's `SceneBackground` component directly (sky gradient + brown-to-green ground). Ground height fixed at 18%

#### Bottom Detail Panel

- Tabbed panel: `Issues | Kanban | Dependencies | Activity | Session | Assigned Issues`
- Default content (no selection): PRD/repository overview in Issues tab
- On tree click: Issue Detail replaces current tab content contextually (auto-promote per #122 REQ-18)
- On PRD tree click: return to PRD overview
- Tab behavior types: Replace (Issue Detail, Session), Filter (Activity), Highlight (Dependencies) — all tabs react simultaneously to selection via their behavior type
- Issues tab has its own toolbar: Sort | Filter | Prune icon-only button (tooltip: "Clean up worktrees")
- **Issues tab list view**: Alternative to card grid — accordion rows with colored background header. Collapsed: priority icon, PRD#/issue#, issue name, git badges, session state chip, action buttons (most behind ⋯). Expanded: full issue detail. Toggle via layout switcher icon in toolbar. Responsive compaction: (1) hide action buttons, (2) compact badges to icon-only, (3) truncate issue name.
- Kanban tab: board view of the same issues (column-based by stage)
- Dependencies tab: DAG visualization with AFK/HITL labels, quick-start HITL button, click-to-navigate

#### Multi-Panel Layout

- Bottom panel supports multiple panels side-by-side. Each panel independently selects its view (any tab). Panels can show duplicates.
- **Layout presets** (7+): Single, Side-by-side (2 horizontal), Quad (4 equal), Top-merged (1 top + 2 bottom), Bottom-merged (2 top + 1 bottom), Left-merged (1 left + 2 right), Right-merged (2 left + 1 right)
- Switcher: layout icon in bottom panel toolbar opens popover with visual previews of each layout
- Panels resizable via paneforge
- Layout choice persists per workspace (stored in DB)
- **Smart defaults**: Spawning a session auto-opens second panel with Session view (if in single mode, switches to side-by-side). Activating an issue shows Issue Detail in second panel if available.

#### Sort & Filter System

- Reusable `SortFilterControls` component — inline button group (not standalone toolbar), placeable anywhere. Storybook stories required.
- **Overview page**: Sort by name, activity, issue count, cost. Filter by all, active, needs attention, dormant.
- **Dashboard Issues tab**: Sort by priority, name, status, creation date. Filter by status, has PR, has worktree, priority level.
- State persisted to localStorage per-surface.
- Also needed on: Usage page, AI Config page (filter by category/model).

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
- **Usage dashboard:** Workspace-scoped by default with global toggle. 4 KPI cards, cost chart with adaptive time buckets (hourly/daily/weekly/monthly), activity breakdown, top sessions, tool usage, period filters (today/7d/30d/month/all/custom range).
- **Chart library:** LayerChart (via shadcn-svelte Chart component). SVG-based, Svelte 5 native, snippet-based custom tooltips, CSS variable theming (`--chart-1` through `--chart-5`).
- **Cost coloring:** Three configurable themes — Monochrome (primary opacity 30%→100%), Traffic Light (green→amber→red), Gradient (CodeBurn-style 3-stop). Stored as user-level default in `app_settings`, overridable per workspace in `dashboards` table. Shortcut picker button in usage page header.
- **Custom date range:** Calendar + RangeCalendar components (shadcn-svelte registry, bits-ui primitives, `@internationalized/date`). 6th "Custom" period tab opens Popover with 2-month RangeCalendar. Backend `MetricsPeriod::Custom { start, end }` variant.
- **Aggregation:** By session, tool, model, provider, workspace, PRD, daily/weekly/monthly. "Group by" dropdown (None/Model/Provider/Category) transforms chart and breakdown views.
- **Workspace scoping:** `dashboard_id: Option<String>` parameter on all metrics commands. Queries join `session_metrics → sessions → issues` to filter by workspace. Default: current workspace; toggle for global view.
- **URL state sync:** All filters (period, scope, groupBy, custom date range) synced to URL search params via `pushState` + `page.state`. Back/forward navigation restores filter state. Deep-linking supported.
- **CostLink component:** Clickable cost text anywhere in the app. Navigates to `/usage` with appropriate filters pre-applied via URL search params. Storybook stories.
- **RefreshIndicator component:** Compound component wrapping Button with 5 states (idle/loading/fresh/stale/new-data-available). Last-updated relative timestamp. Dot badge for new data. Reusable across pages.
- **ChartTooltip component:** Rich hover tooltip for chart elements (date, cost, session count, top activity). Uses composable Tooltip.Root/Trigger/Content. Storybook stories.
- **Achievements:** Milestone-based (10 fixed, single-tier). Display in Dialog (not inline card). Notification on unlock via `achievement.unlocked` event (ties to PRD #95).
- **Model pricing:** LiteLLM JSON primary (24h TTL, bundled snapshot fallback) → OpenRouter API secondary (free, no auth, real-time) → "Pricing N/A" on miss. Fast mode multiplier configurable in settings (default 6x for Opus). User-defined model aliases and per-model rate overrides stored in `model_pricing_cache` table.
- **Multi-currency:** Frankfurter API (`api.frankfurter.dev`, free, no auth, 31 ECB currencies including EUR/CZK). Store all costs in USD, convert at display time. Cache full rates map with 24h TTL. Currency preference in user settings.
- **Export CSV:** Single CSV with sections (Summary, Daily Costs, Activity Breakdown, Top Sessions, Tool Usage). Respects active period filter. Tauri file dialog for save location.
- **Optimize view:** 10 waste detectors (junk reads, duplicate reads, low read/edit ratio, cache bloat, unused MCP servers, bloated CLAUDE.md, ghost agents/skills/commands, bash output limit). Health score 0-100 with A/B/C/D/F grade. Advisory panel within usage page.
- **Compare view:** Side-by-side model comparison. 7 metrics: one-shot rate, retry rate, cost/call, cost/edit, output tokens/call, cache hit rate. Category head-to-head. Working style metrics. Minimum 20 calls per model. Triggered from "Group by: Model" view.
- **Backend wiring:** PricingEngine called during session completion and historical import. Achievement triggers hooked to session completion. `metrics-updated` and `achievement-unlocked` Tauri events. Missing indexes on `turn_metrics(timestamp)` and `tool_usage(timestamp)`.

### AI Configuration Access

- Dedicated page with tabs: Skills, Agents, Hooks, MCP Servers, Memories, Instructions.
- Card grid with badges (model, category, version). Click → full detail panel.
- Discovery: `~/.claude/`, project `.claude/`, mpx-claude-code, memories folder. Scan on navigate + manual refresh.
- "Open file" / "Open in editor" / "Open folder" buttons per item. Read-only display in Grovekeeper.

### PRD Management & Visualization

- **PRD row on workspace cards**: compact inline row showing open PRD count + aggregate sub-issue progress bar. Visible on overview dashboard workspace cards. Click navigates to PRD view
- **PRD view**: dedicated view for browsing and managing PRDs within a workspace. Shows PRD cards with sub-issue progress, blocking relationships between PRDs, and status indicators. Accessible as both a bottom panel tab in the workspace dashboard and a standalone navigable page
- **PRD cards**: each card shows PRD title, sub-issue completion ratio, blocking/blocked-by relationships, labels, and quick navigation to the PRD's GitHub issue
- **PRD progress tracking**: aggregate metrics per workspace — open PRDs, split PRDs (have sub-issues), PRDs in progress (at least one completed sub-issue). Surfaced on workspace card PRD row and in PRD view
- **Scope**: separate PRD to be created — "PRD: PRD Management & Visualization"

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
- Agent personality / Warcraft voices (character packs are in scope; specific copyrighted content is user-supplied)
- GitHub App for triggering from GitHub UI (using label polling instead)
- Webhook relay for instant GitHub triggers
- Built-in code editor (using external VS Code/Cursor)
- Embedded terminal (xterm.js) — use external terminal
- Mobile push notifications
- RTL language support
