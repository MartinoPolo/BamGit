# Issue Card Test Requirements

Canonical source of truth: `designs/_issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md`
GitHub issues: PRD #296 (card v2), PRD #339 (process management), PRD #89 (original), #297-#300 (v2 sub-issues), #340-#345 (process sub-issues), #173/#183/#184/#187/#198/#206/#230/#237 (earlier iterations)

---

## 1. Card Types

### REQ-CT-1: Adopted Issue Card

Full card for GitHub issues imported into Grovekeeper with tracking, worktree, and session capabilities.

### REQ-CT-2: Ghost Card

Represents assigned-but-not-adopted GitHub issues. Appears in Assigned Issues accordion below adopted grid.

- Neutral gray by default
- Dashed border (2px dash, 4px gap)
- Same card structure as adopted but most fields naturally empty
- No quick-action buttons (folder/terminal/editor/mute)
- No tree/character preview (empty placeholder shown)
- No issue state chip
- Adopt split-button replaces contextual action buttons

---

## 2. Header Zone

### REQ-HD-1: Header Background

- Issue color rendered as gradient (NOT flat fill); treatment is variant-dependent
- WCAG-contrast text via `getContrastTextColor()`
- Dark mode: desaturate header ~20-30% vs light mode

### REQ-HD-2: PRD Parent Number

- Format: `#87 /` (just `#` + number, NO "PRD" prefix)
- Monospace font
- Clickable link to PRD GitHub issue URL
- Text color matches title text, slightly dimmed
- Only shown if issue is a sub-issue of a PRD

### REQ-HD-3: PRD Group Hover

- Hovering **PRD number only** (NOT whole card) highlights ALL cards sharing that PRD with a ring
- Ring includes the hovered card itself
- Ring ~25% larger offset/size than normal state rings
- Ring does NOT appear on normal card hover
- Works across adopted grid and assigned accordion

### REQ-HD-4: Issue Number

- Format: `#142`, monospace
- Clickable, linked to GitHub issue URL (opens in browser)
- When header background is dark/non-colorized (Radiant variant): issue number text carries the issue's assigned color for at-a-glance identification
- When header background is colorized (Veil, Refined Horizon): issue number inherits header text color for readability

### REQ-HD-5: Issue Title

- Truncated with ellipsis when overflowing
- Clickable to open Issue Detail panel

### REQ-HD-6: Issue State Chip

- Rectangular shape (NOT rounded pill)
- Monospace font (Geist Mono), uppercase
- Dot indicator (`●`) prefix, colored to match state
- Each state has defined color independent of issue/header color
- No chip shown when no state matches
- Full 22-state cascade per section 6

### REQ-HD-7: Priority Badge

- Only shown if priority is non-medium AND priorities are enabled
- Full text labels: `LOWEST`, `LOW`, `HIGH`, `TOP`
- Rectangular shape consistent with state chip
- Clickable, spawns priority change menu
- Default position: header-right
- 8 alternative positions available via settings (preview corners, half-splits, inside positions)
- All positions inside preview have small padding from borders
- Correct z-index to render above preview content
- Applies to both adopted and ghost cards

### REQ-HD-8: Quick-Action Buttons

- 3 buttons: Open Folder, Open Terminal, Open Editor (mute toggle moved to context menu)
- Icon-only, standard component sizes
- Ghost style: NO visible background by default (fully transparent)
- Background appears ONLY on hover
- Always visible (not hover-revealed)
- When no worktree: reduced opacity, click opens file picker
- NOT shown on ghost cards

### REQ-HD-9: No Child Count

- No child count / sub-issues chip in header (issue cards never represent PRDs)

---

## 3. Body (Two-Column Grid)

### REQ-BD-1: Grid Layout

- `grid-template-columns: ~100px 1fr`
- Preview area left, info rows right

### REQ-BD-2: Preview Area

- Square shape (not rectangular)
- Minimum 100px
- Background matches header color / issue color gradient
- Shows one of: tree thumbnail (stage-based, hue-tinted canopy), character portrait, or empty placeholder
- Tree thumbnails use ViewBox cropping (scale + translateY, focus on top ~30%)
- Seed stage scaled ~2.5x, Sprouting ~1.8x
- Container 100px

### REQ-BD-3: Row 1 - Worktree + Branch

- Format: tree-icon `worktree-folder/` + git-branch-icon `branch-slug` (monospace)
- Worktree name: folder name only, strip parent path
- Branch name: strip conventional prefixes (`feat/`, `fix/`, `refactor/`, `chore/`)
- Single line only, truncate with ellipsis, never wrap
- Right-aligned pinned badges: sync badge, merge conflict badge, worktree error badge
- When no worktree: muted "no worktree" placeholder

### REQ-BD-4: Row 2 - GitHub Status Badges

- Badge order: issue state (left) + PR state (middle) + CI status (right, when PR exists)
- CI status: green circle-check (passed), red circle-X (failed), spinner (running)
- Uses badge style system (A/B/C)
- Maintain min-height for consistent spacing
- CI badge refreshes via GitHub sync

### REQ-BD-5: Row 3 - GitHub Labels

- First N as colored pills + overflow count (`+2`) with tooltip
- Labels match their GitHub color
- Uncolored labels render grayish
- When pills overlap with action buttons, reduce label count

### REQ-BD-6: Row 4 - Command Results

- CommandResultBadge: animated collapsing pill
    - Running: pill with spinner icon + command name (e.g., `check:all`)
    - Passed: animates to green circle-check icon
    - Failed: animates to red circle-X icon
- ServerPortBadge: green dot + port number, click opens `localhost:{port}`
- Staleness: results gray out when `hasLocalChanges` true or `commits_ahead` changes
- Max 3 badges + overflow count
- Maintain min-height when no commands configured

---

## 4. Action Buttons

### REQ-AB-1: Layout

- Absolutely positioned bottom-right of card body
- Max 2 visible + overflow (three-dot) button

### REQ-AB-2: Button Hierarchy

1. Primary: filled background using issue's color with WCAG-contrast text; fallback to neutral/gray for Done and Ghost cards
2. Secondary: outlined style (border visible, transparent background)
3. Overflow: outlined style, same as secondary

- User setting alternative: moss-green instead of issue-color

### REQ-AB-3: Contextual Action Priority (14 levels)

| #   | Condition                  | Primary         | Secondary           |
| --- | -------------------------- | --------------- | ------------------- |
| 1   | Session running            | ViewSession     | (all else disabled) |
| 2   | Worktree failed            | RetryWorktree   | RemoveWorktree      |
| 3   | Merge conflict             | SyncBase        | Run                 |
| 4   | Local changes, no PR       | CommitPushAndPr | CommitAndPush       |
| 5   | Local changes, PR exists   | CommitAndPush   | Commit              |
| 6   | Ahead of remote, no PR     | CreatePr        | Push                |
| 7   | Ahead of remote, PR exists | Push            | Review              |
| 8   | PR changes-requested       | Run             | Review              |
| 9   | PR approved                | Merge           | Review              |
| 10  | PR open/draft              | Review          | CheckAndFix         |
| 11  | Behind base                | SyncBase        | Run                 |
| 12  | HITL label                 | Hitl            | Run                 |
| 13  | No worktree                | Run             | SetupWorktree       |
| 14  | Default                    | Run             | Review              |

---

## 5. Interactive States

### REQ-IS-1: Hover State

- Issue-color border glow or intensified border
- Card lifts ~2-3px via translateY or shadow offset
- Background brightens slightly
- Additive: works across ALL other states
- Done + hover: gains outline/border and subtle bg, then fades back
- Ghost + hover: dashed border becomes brighter, bg gains subtle gradient (stronger on left/top)

### REQ-IS-2: Default State

- Clean border, subtle shadow, resting appearance

### REQ-IS-3: Active State

- Issue-color 3px solid outline + body tint (uses card's OWN color, not generic green/blue)
- Box-shadow glow in issue color
- Subtle body tint in issue color
- Triggered by single click (shows issue detail)
- Clicking an active card does NOT toggle it off

### REQ-IS-4: Selected (Batch) State

- `var(--primary)` 3px solid outline (system color, NOT issue color)
- `var(--primary)` box-shadow glow
- NO checkbox
- Triggered by Ctrl+click, Shift+click

### REQ-IS-5: Selection-Ready State

- `var(--primary)` outline at ~30% opacity
- Pointer cursor
- Previews selection without committing
- Triggered when Ctrl or Shift key held

### REQ-IS-6: Done State

- Transparent background, NO borders, NO card surface
- Content fully readable (NOT dimmed/faded)
- Text, badges, buttons all at normal opacity
- Color identity (issue color gradient) removed entirely
- `DONE` chip displayed in header
- Action buttons preserved with normal styling
- Primary action button: neutral/gray fallback
- On hover: gains border + generic (non-issue-color) bg, then fades back
- Full batch selection support
- Condition: `github_issue_state === 'closed'` AND `pr_state === 'merged'`
- Derived at render time, no DB change

### REQ-IS-7: Ghost State

- Neutral gray, dashed border, muted appearance
- See Ghost Card specifics (section 8)

### REQ-IS-8: Worktree Setup State

- Muted/borderless card (similar to Done but "not yet born")
- Transparent border, reduced opacity (0.6)
- No dashed border (dashed is reserved for ghost cards only)
- No gradient, no color identity
- Card materializes (border, gradient, color appear) when worktree becomes active
- `WORKTREE SETUP` chip + spinner in worktree badge
- Trigger: `worktreeState = pending`

### REQ-IS-9: Worktree Removing State

- Card fades toward muted/borderless state
- `REMOVING WORKTREE` chip
- Brief transition, settles into no-worktree look
- Trigger: `worktreeState = removing`

### REQ-IS-10: Session Overlays - Executing

- NO card overlay at all
- Strictly chip-only across ALL variants
- No header brightening, no glow changes, no variant-specific exceptions

### REQ-IS-11: Session Overlays - Error

- Red tint on card surface, red-shifted glow
- Pulsing animation
- Orange/red border color
- Default overlay glow intensity: 150%

### REQ-IS-12: Session Overlays - Needs Input

- Amber pulse animation
- Orange/red border color
- Default overlay glow intensity: 150%

### REQ-IS-13: Disabled State

- opacity ~42%, pointer-events none
- Used during batch operations

### REQ-IS-14: Archived State

- No distinct visual treatment
- Filter category only (cards look same as active)
- Only visible when "Show Archived" filter is on

### REQ-IS-15: Ring Semantics

- Active = issue color (reinforces card identity)
- Selected/batch = `var(--primary)` (system-level action, not issue-specific)
- Use combination of outline + subtle glows (box-shadow, inset shadows) for state differentiation

### REQ-IS-16: Removed States

- No Dragging state (card grid has no meaningful drag target)
- No generic Loading state (replaced by specific sub-states)

---

## 6. Issue State Chip Cascade (22 States)

Priority-ordered; first match wins. Single chip only.

### REQ-SC-1 through REQ-SC-22:

| #   | REQ       | Chip Label          | Source     | Color      | Trigger                                      |
| --- | --------- | ------------------- | ---------- | ---------- | -------------------------------------------- |
| 1   | REQ-SC-1  | `ERROR`             | session    | Red        | aggregateSessionState = errored              |
| 2   | REQ-SC-2  | `NEEDS INPUT`       | session    | Amber      | aggregateSessionState = needs-input          |
| 3   | REQ-SC-3  | `MERGE CONFLICT`    | sync       | Red        | syncStatus = merge-conflict                  |
| 4   | REQ-SC-4  | `SETUP FAILED`      | worktree   | Red        | worktreeState = failed                       |
| 5   | REQ-SC-5  | `ANALYZING`         | exec phase | Green      | session running + phase = analyzing          |
| 6   | REQ-SC-6  | `BUILDING`          | exec phase | Green      | session running + phase = tdd                |
| 7   | REQ-SC-7  | `REVIEWING`         | exec phase | Blue/Cyan  | session running + phase = reviewing          |
| 8   | REQ-SC-8  | `VERIFYING`         | exec phase | Green      | session running + phase = verifying          |
| 9   | REQ-SC-9  | `SHIPPING`          | exec phase | Green      | session running + phase = committing         |
| 10  | REQ-SC-10 | `EXECUTING`         | session    | Green      | aggregateSessionState = running, no phase    |
| 11  | REQ-SC-11 | `REVIEW`            | session    | Blue/Cyan  | aggregateSessionState = needs-review         |
| 12  | REQ-SC-12 | `PAUSED`            | session    | Gray/Muted | aggregateSessionState = paused               |
| 13  | REQ-SC-13 | `RUNNING CHECKS`    | commands   | Blue/Cyan  | activeCheckCommands.length > 0               |
| 14  | REQ-SC-14 | `RUNNING TESTS`     | commands   | Blue/Cyan  | activeTestCommands.length > 0                |
| 15  | REQ-SC-15 | `BEHIND BASE`       | sync       | Amber      | syncStatus = behind-base                     |
| 16  | REQ-SC-16 | `CHANGES REQ`       | PR         | Amber      | prState = changes-requested                  |
| 17  | REQ-SC-17 | `CI RUNNING`        | PR/CI      | Blue/Cyan  | prCiStatus = running                         |
| 18  | REQ-SC-18 | `APPROVED`          | PR         | Green      | prState = approved                           |
| 19  | REQ-SC-19 | `READY TO MERGE`    | PR         | Green      | prState = ready-to-merge                     |
| 20  | REQ-SC-20 | `WORKTREE SETUP`    | worktree   | Amber      | worktreeState = pending                      |
| 21  | REQ-SC-21 | `REMOVING WORKTREE` | worktree   | Amber      | worktreeState = removing                     |
| 22  | REQ-SC-22 | `DONE`              | derived    | Muted      | githubIssueState = closed + prState = merged |

### REQ-SC-23: No Chip

When no condition matches, no chip is shown.

### REQ-SC-24: States NOT Shown as Chips

- `session = finished` (normal end state, no attention needed)
- `branchStatus = deleted/remote-gone` (visible via tree stage + worktree badges)
- CI passed/failed (shown in Row 2 CI badge and Row 4 command results, not as chip)

### REQ-SC-25: Aggregate Session Priority

Multiple sessions: worst active state wins: `needs-input > errored > needs-review > running > paused > finished > no-session`

---

## 7. Issue Lifecycle

### REQ-IL-1: Database Schema

- `IssueStatus = 'active' | 'archived'` only
- No "done" status in DB

### REQ-IL-2: Done is Derived

- Computed at render time from `github_issue_state === 'closed'` AND `pr_state === 'merged'`

### REQ-IL-3: Archive Independence

- Archiving is a filter category, not a visual state
- Can archive both active and done issues
- Archived cards look identical to non-archived

---

## 8. Ghost Card Specifics

### REQ-GC-1: Visual Treatment

- Neutral gray surface, dashed border (2px dash, 4px gap)
- On hover: dashed border stays but brighter, bg gains subtle gradient (stronger left/top)

### REQ-GC-2: Label Coloring - No Labels

- Fully neutral gray ghost card when no colored labels

### REQ-GC-3: Label Coloring - One Label

- Single label color tints card at ~20% opacity (default)
- Header area significantly tinted (clearly colored, not subtle)

### REQ-GC-4: Label Coloring - Two Labels

- Split colorization: first alphabetical label from LEFT, second from RIGHT
- Blending in MIDDLE
- Each side ~15-20% opacity
- Visually clear two distinct colors present

### REQ-GC-5: Label Coloring - Three+ Labels

- Pick first 2 alphabetically by label name
- Apply split colorization for those 2
- Remaining colored labels shown as pill badges but don't affect card tint

### REQ-GC-6: Label Tint Opacity

- Default 20%, configurable via settings (range 5-30%)

### REQ-GC-7: Adopt Split-Button

- Outlined style (not filled)
- No plus icon, text only
- Visible separator between button text and dropdown chevron
- Default: "Adopt + Worktree" (or user's last selection)
- Dropdown: "Adopt (no worktree)" and "Adopt with Worktree"
- Remembers last selection, persisted in DB (`adopt_default_action`)

### REQ-GC-8: Ghost Content Rules

- Always shown: issue title, #number (linked), GitHub issue state badge, GitHub labels, PRD parent (if any), priority badge (if set), Adopt split-button
- Shown if available: branch name, worktree badge, sync badge, PR badge
- Never shown: quick-action buttons, tree/character preview (placeholder only), session state chip, contextual action buttons

---

## 9. Layout

### REQ-LY-1: Adopted Grid

- Responsive: `repeat(auto-fill, minmax(450px, 1fr))`
- Minimum card width: 450px

### REQ-LY-2: Assigned Issues Accordion

- Ghost accordion: no border, no background on container
- Header: "Assigned . {count} issues" + sort/filter ghost icon buttons
- Collapsed by default
- Inside: same responsive grid with ghost cards
- Own sort/filter, independent from adopted grid

### REQ-LY-3: View Switcher

- Global toggle: card grid vs compact row view
- Applies to both sections together
- No per-card collapse/expand

---

## 10. Batch Selection

### REQ-BS-1: Selection Methods

- Ctrl+click: toggle individual card selection
- Shift+click: range select (flat visual order)
- Right-click: "Select" option in context menu
- Long press 500ms: mobile selection
- Ctrl+A / Cmd+A: select all regardless of scroll

### REQ-BS-2: No Checkboxes

- Selection indicated via glow/ring treatment only

### REQ-BS-3: Batch Actions

- Archive, Unarchive, Delete, Change Priority, Clean Worktrees

### REQ-BS-4: Selection Persistence

- Selection does NOT clear after batch action
- Selection clears on: tab change, Escape key

---

## 11. User Settings

### REQ-US-1: Settings Cascade

- User settings (global defaults) -> Workspace settings (per-workspace overrides)
- Overridden workspace values show visual indicator (dot/badge)
- Stored in `app_settings` table, keys prefixed `issue_card_`
- Workspace overrides use `ws_{dashboard_id}_issue_card_` prefix

### REQ-US-2: Setting Definitions

| Key               | Type   | Default         | Range                            |
| ----------------- | ------ | --------------- | -------------------------------- |
| button_color      | enum   | issue-color     | issue-color, moss-green          |
| priority_position | enum   | header-right    | 9 positions                      |
| badge_style       | enum   | subtle          | solid(A), subtle(B), outlined(C) |
| label_tint        | number | 20              | 5-30                             |
| overlay_glow      | number | 150             | 100-200                          |
| variant           | enum   | refined-horizon | veil, refined-horizon, radiant   |
| gradient_reach    | number | 60              | 30-100 (Veil only)               |
| color_saturation  | number | 150             | 30-200 (Veil only)               |
| header_saturation | number | 85              | 30-100 (Horizon only)            |
| radial_intensity  | number | 75              | 30-100 (Radiant only)            |

### REQ-US-3: Variant-Specific Visibility

- Variant-specific settings only shown/apply when corresponding variant is active

---

## 12. Badge Styles

### REQ-BG-1: Style A - Solid

- Truly opaque `var(--badge-color)` background with WCAG-contrast text (white fallback)
- No border (transparent)

### REQ-BG-2: Style B - Subtle (Default)

- Tinted background: `color-mix(in srgb, var(--badge-color) 18%, var(--surface))`
- Colored text, NO border

### REQ-BG-3: Style C - Outlined

- Same background as Subtle, WITH border at ~30% opacity
- `color-mix(in srgb, var(--badge-color) 30%, transparent)` border

### REQ-BG-5: Color Mixing

- All badge color-mix formulas use `in srgb` (NOT oklch) to avoid pink hue rotation artifacts

### REQ-BG-4: Applies To Both

- Badge style applies simultaneously to priority badges AND issue state chips

---

## 13. Card Variants

### REQ-CV-1: All Three Implemented

- All variants available from day one, switchable via settings
- Default: Refined Horizon (G)

### REQ-CV-2: CSS-Only Architecture

- Variants driven by `data-variant` attribute and CSS custom properties
- Single IssueCard component, no JS branching per variant

### REQ-CV-3: Variant F - Veil

- Seamless vertical gradient from top (full intensity) fading into dark surface
- No hard header/body boundary
- Header text auto-contrast
- Gradient reach slider (30-100%, default 60%)
- Color saturation slider (30-200%, default 150%)
- Mix target #1e1e1e to avoid OKLCH artifacts

### REQ-CV-4: Variant G - Refined Horizon (Default)

- Horizontal gradient: vivid issue color LEFT, desaturated RIGHT
- Crisp 1px boundary between header and body
- Header saturation slider (30-100%, default 85%)

### REQ-CV-5: Variant H - Radiant

- Preview area as light source, radial gradient (~340x300px)
- Trees/characters at ~35% opacity
- Preview box OPAQUE dark (NOT transparent)
- Radial intensity slider (30-100%, default 75%)

---

## 14. Light Mode

### REQ-LM-1: Day-One Support

- Light mode implemented alongside dark mode

### REQ-LM-2: Header Treatment

- Light mode: full saturation headers
- Dark mode: desaturate headers ~20-30%

### REQ-LM-3: Color Tokens

- All chip/badge/overlay colors use semantic CSS custom properties
- Swap between themes via `[data-theme]` selectors

---

## 15. Context Menu

### REQ-CM-1: Standard Items

- Rename (standalone issues only, not GitHub-linked)
- Change Color (color picker submenu)
- Change Priority (priority submenu)
- Archive / Unarchive
- Select (triggers batch selection)
- Delete (with confirmation)

### REQ-CM-2: Worktree Items

- Setup Worktree (when no worktree)
- Remove Worktree (when worktree exists)
- Retry Worktree (when worktree failed)

### REQ-CM-3: Commands Submenu (#341)

- Grouped: servers above checks
- State-aware actions per entry (Run/Stop/View Logs)
- Right-click on ServerPortBadge: View Logs, Kill, Open in Browser

### REQ-CM-5: Open Submenu

- "Open" submenu with ExternalLinkIcon trigger
- 3 items: Open Folder (FolderIcon), Open Terminal (TerminalIcon), Open Editor (VscodeIcon)
- All items disabled when no worktree assigned
- Uses `invoke()` to call `open_folder_in_explorer`, `open_terminal`, `open_in_editor`

### REQ-CM-6: Mute Toggle

- Context menu item shows "Mute" (Volume2Icon) when unmuted, "Unmute" (VolumeXIcon) when muted
- Calls `invoke('toggle_issue_sound_mute')` and patches local state

### REQ-CM-4: Batch Context Menu

- When right-clicking a selected card in batch, show batch actions
- Archive, Unarchive, Delete, Change Priority, Clean Worktrees

---

## 16. Cross-Card Interactions

### REQ-CC-1: PRD Group Hover

- Hovering PRD number highlights all cards sharing that PRD
- Ring on all matching cards including hovered one
- Ring ~25% larger than normal state rings

### REQ-CC-2: Forest-Card Sync (#206)

- Hover card -> tree glows in forest view
- Hover tree -> card gets ring highlight
- Ctrl+click batch selection between forest and cards

### REQ-CC-3: Character Avatar (#237)

- Character avatar on card (~24px, bottom-right of preview)
- Left-click: toggle is_sound_muted
- Right-click: character selection dropdown + "Play random sound" + Mute toggle

---

## 17. Design Constraints (Non-Negotiable)

### REQ-DC-1: Color Identity

- Issue color is primary visual differentiator, must be prominent
- WCAG contrast for all text on colored backgrounds

### REQ-DC-2: Prohibited Patterns

- NO left colored accent border
- NO flat solid-color headers
- NO thin top stripe alone
- NO per-card checkboxes
- NO executing card overlay (chip only)
- NO drag-and-drop on card grid
- NO hover-revealed action buttons

### REQ-DC-3: Layout Constraints

- 450px minimum card width
- Preview area: square, minimum 100px
- Worktree + branch: single line only, truncate
- Typography: Geist (sans) / Geist Mono (mono)

---

## 18. Edge Cases

### REQ-EC-1: No Worktree

- Quick-action buttons: reduced opacity, click opens file picker
- Row 1: muted "no worktree" placeholder
- Contextual action: Run / SetupWorktree

### REQ-EC-2: No GitHub Connection

- No CI badge, no PR badge
- Issue state badge only
- No GitHub labels

### REQ-EC-3: No Session

- No issue state chip (unless PR/sync/worktree states apply)
- Default contextual actions: Run / Review

### REQ-EC-4: Multiple Sessions

- Aggregate session state: worst active state wins
- Priority: needs-input > errored > needs-review > running > paused > finished

### REQ-EC-5: Very Long Title

- Truncated with ellipsis, never wraps
- Must not push header elements offscreen

### REQ-EC-6: Many Labels

- Overflow count shown (`+N`) with tooltip listing remaining
- Reduce visible count when overlapping action buttons

### REQ-EC-7: Many Commands

- Max 3 badges visible + overflow count
- Same overflow pattern as labels

### REQ-EC-8: Issue Without Color

- Fallback to default neutral color (#525252)
- All color-dependent features degrade gracefully

### REQ-EC-9: Standalone Issue (Not From GitHub)

- No GitHub number link
- No PR badge, no CI badge, no labels from GitHub
- Rename available in context menu
- No PRD parent

### REQ-EC-10: Done Card Interactions

- Full batch selection support
- Hover shows temporary border + bg
- Primary button neutral/gray
- Color identity removed

### REQ-EC-11: Ghost Card with Branch/PR

- Branch name shown if available
- PR badge shown if available
- Sync badge shown if available

### REQ-EC-12: Concurrent State Transitions

- Worktree setup pending -> card materializes when active
- Worktree removing -> card dematerializes
- Session starting/stopping -> chip updates immediately

---

## 19. Process Management Integration (PRD #339)

### REQ-PM-1: Command Results Row

- Shows results from workspace check/test/server commands
- CommandResultBadge with 5 states: running, passed, failed, timeout, stopped
- Bidirectional animation: collapse on completion, expand on re-run

### REQ-PM-2: Server Port Badge

- Green dot + port number
- Badge style B (borderless dark) default
- Click opens `localhost:{port}`
- Port format: `:3000`

### REQ-PM-3: Badge Staleness

- Results invalidate when hasLocalChanges or commits_ahead changes
- Stale results gray out, disappear after re-run/push

### REQ-PM-4: Context Menu Commands

- "Commands" submenu on issue card context menu
- Grouped: servers above checks
- State-aware: Run/Stop/View Logs per entry
- Bulk run/stop all

### REQ-PM-5: Server Badge Context Menu

- Right-click on ServerPortBadge: View Logs, Kill, Open in Browser

### REQ-PM-6: CI Status Badge (#345)

- Populated from GitHub check runs (statusCheckRollup)
- Maps: SUCCESS -> passed, FAILURE/ERROR -> failed, PENDING -> running
- Auto-sync on dashboard activation

### REQ-PM-7: Restart Policy Display

- Badge shows "restarted N/3" during restart attempts
- Max 3 retries with exponential backoff (1s, 2s, 4s)
- Timeout shows orange clock badge

---

## 20. Open / Deferred Requirements

### REQ-DEF-1: Compact Row View (#318)

- Deferred from PRD #296, needs design brief

### REQ-DEF-2: Kanban Drag-and-Drop (#168)

- Separate component, not card grid
- Cards reused but drag behavior owned by Kanban

### REQ-DEF-3: CI Badge Refresh on Restart (#357)

- When tracked process restarts, CI badges should refresh

### REQ-DEF-4: Persist Process Results (#358)

- Process results currently transient, persist to DB deferred

---

## 21. Test Case Definitions

### 21.1 Tauri E2E Tests (WebdriverIO)

These tests run against the real Tauri binary with SQLite backend. Focus on data persistence, IPC round-trips, and state transitions that require the Rust backend.

#### TE2E-1: Card Rendering with Real Data

```
GIVEN a workspace with 3 adopted issues (various priorities, colors, worktree states)
WHEN the dashboard loads
THEN all 3 cards render with correct title, number, priority badge, and color
AND cards are in responsive grid (min 450px width)
```

#### TE2E-2: Issue State Chip Cascade

```
GIVEN issue with session in "errored" state AND syncStatus = "behind-base"
WHEN card renders
THEN chip shows "ERROR" (red) not "BEHIND BASE" (errored wins cascade)
```

#### TE2E-3: Issue State Chip - All 22 States

```
FOR EACH of the 22 chip states:
  GIVEN the trigger condition is met (and no higher-priority state active)
  WHEN card renders
  THEN correct chip label and color are displayed
```

#### TE2E-4: Done State Derivation

```
GIVEN issue with github_issue_state = "closed" AND pr_state = "merged"
WHEN card renders
THEN card has transparent bg, no borders, DONE chip shown
AND content is fully readable (not dimmed)
AND primary action button is neutral/gray
```

#### TE2E-5: Done State Hover

```
GIVEN a done card
WHEN user hovers over it
THEN card gains temporary border and generic bg
WHEN user moves mouse away
THEN card returns to transparent/borderless state
```

#### TE2E-6: Contextual Action Buttons - Session Running

```
GIVEN issue with active running session
WHEN card renders
THEN primary button shows "ViewSession"
AND secondary/other buttons are disabled
```

#### TE2E-7: Contextual Action Buttons - Local Changes, No PR

```
GIVEN issue with local changes AND no PR exists
WHEN card renders
THEN primary = "CommitPushAndPr", secondary = "CommitAndPush"
```

#### TE2E-8: Contextual Action Buttons - All 14 Levels

```
FOR EACH of the 14 priority levels:
  GIVEN the condition is met (and no higher-priority condition)
  WHEN card renders
  THEN correct primary and secondary actions shown
```

#### TE2E-9: Priority Badge Visibility

```
GIVEN issue with priority = "medium"
WHEN card renders
THEN no priority badge shown
GIVEN issue with priority = "high"
WHEN card renders
THEN priority badge "HIGH" is shown
```

#### TE2E-10: Priority Badge Click

```
GIVEN card with priority badge visible
WHEN user clicks priority badge
THEN priority change menu appears
WHEN user selects "LOW"
THEN badge updates to "LOW" and persists in DB
```

#### TE2E-11: Quick-Action Buttons - With Worktree

```
GIVEN issue with active worktree
WHEN user clicks Open Folder button
THEN folder opens (invoke call succeeds)
AND button has no visible bg by default, bg appears on hover
```

#### TE2E-12: Quick-Action Buttons - No Worktree

```
GIVEN issue with no worktree
THEN quick-action buttons show at reduced opacity
WHEN user clicks Open Folder
THEN file picker opens
```

#### TE2E-13: Ghost Card Rendering

```
GIVEN assigned issue not yet adopted
WHEN Assigned Issues accordion is expanded
THEN ghost card shown with dashed border, neutral gray
AND Adopt split-button visible
AND no quick-action buttons, no tree preview, no state chip
```

#### TE2E-14: Ghost Card Adopt - Default

```
GIVEN ghost card with default adopt action "Adopt + Worktree"
WHEN user clicks Adopt button
THEN issue is adopted with worktree setup
AND card transitions from ghost to adopted
```

#### TE2E-15: Ghost Card Adopt - Remember Selection

```
GIVEN ghost card
WHEN user opens adopt dropdown and selects "Adopt (no worktree)"
THEN issue adopted without worktree
AND next ghost card's default shows "Adopt (no worktree)"
AND preference persisted in DB (adopt_default_action)
```

#### TE2E-16: Ghost Card Label Tinting

```
GIVEN ghost card with one colored label "bug" (red)
THEN card has red tint at ~20% opacity, header significantly tinted
GIVEN ghost card with two colored labels "bug" (red) + "design" (blue)
THEN split colorization: sorted alphabetically -> "bug" LEFT, "design" RIGHT
```

#### TE2E-17: Batch Selection - Ctrl+Click

```
GIVEN 3 cards rendered
WHEN user Ctrl+clicks card 1 and card 3
THEN cards 1 and 3 show var(--primary) outline glow, card 2 unchanged
AND no checkboxes visible
```

#### TE2E-18: Batch Selection - Shift+Click Range

```
GIVEN cards 1-5 rendered, card 2 selected
WHEN user Shift+clicks card 4
THEN cards 2, 3, 4 are all selected (range selection)
```

#### TE2E-19: Batch Selection - Persistence

```
GIVEN 2 cards selected
WHEN user performs batch Archive
THEN cards are archived AND selection is NOT cleared
```

#### TE2E-20: Batch Selection - Clear

```
GIVEN 2 cards selected
WHEN user presses Escape
THEN selection clears
WHEN user changes tab
THEN selection clears
```

#### TE2E-21: Settings Cascade

```
GIVEN user setting badge_style = "solid" (A)
AND workspace has no override
THEN cards use Style A badges
WHEN workspace overrides badge_style = "outlined" (C)
THEN cards in that workspace use Style C
AND settings UI shows override indicator
```

#### TE2E-22: Variant Switching

```
GIVEN variant = "refined-horizon"
WHEN user switches to "veil"
THEN card re-renders with Veil gradient treatment
AND gradient_reach/color_saturation sliders appear in settings
AND header_saturation slider disappears
```

#### TE2E-23: Worktree State Transitions

```
GIVEN issue with no worktree
WHEN user triggers worktree setup
THEN card shows WORKTREE SETUP chip + muted/borderless state
WHEN worktree becomes active
THEN card materializes (gradient, color, border appear)
AND Row 1 shows worktree folder + branch name
```

#### TE2E-24: Worktree Row Formatting

```
GIVEN issue with worktree path "C:/projects/grovekeeper-worktrees/gradient-tokens"
AND branch "feat/gradient-tokens-cleanup"
THEN Row 1 shows "gradient-tokens/" (folder only) + "gradient-tokens-cleanup" (prefix stripped)
AND single line, truncated if needed
```

#### TE2E-25: GitHub Labels Display

```
GIVEN issue with 5 GitHub labels
THEN first N labels shown as colored pills
AND overflow count "+M" shown with tooltip listing remaining
AND each pill matches its GitHub color
```

#### TE2E-26: CI Status Badge

```
GIVEN issue with PR and CI check runs
WHEN CI passes
THEN green circle-check badge in Row 2
WHEN CI fails
THEN red circle-X badge in Row 2
WHEN CI running
THEN spinner badge in Row 2
```

#### TE2E-27: Command Result Badges

```
GIVEN issue with running check command "check:all"
THEN Row 4 shows spinner + "check:all" pill
WHEN command passes
THEN pill animates to green circle-check
WHEN hasLocalChanges becomes true
THEN badge grays out (stale)
```

#### TE2E-28: Server Port Badge

```
GIVEN issue with dev server running on port 3000
THEN Row 4 shows green dot + ":3000" badge
WHEN user clicks badge
THEN opens localhost:3000
```

#### TE2E-29: Context Menu - Standard

```
GIVEN adopted card
WHEN user right-clicks
THEN context menu shows: Rename (if standalone), Change Color, Change Priority, Archive, Select, Delete
```

#### TE2E-30: Context Menu - Commands Submenu

```
GIVEN adopted card with configured commands
WHEN user right-clicks and opens Commands submenu
THEN shows grouped list (servers above checks)
AND each entry has state-aware actions (Run/Stop/View Logs)
```

#### TE2E-31: PRD Group Hover

```
GIVEN cards A and B share PRD #87, card C has PRD #90
WHEN user hovers PRD number "#87" on card A
THEN cards A and B both show PRD ring (larger than normal)
AND card C shows no ring
WHEN user moves mouse to card A title (not PRD number)
THEN PRD ring disappears from A and B
```

#### TE2E-32: Issue Number Link

```
GIVEN card with GitHub issue #142
WHEN user clicks "#142" in header
THEN GitHub issue URL opens in browser
```

#### TE2E-33: Accordion Collapse/Expand

```
GIVEN assigned issues accordion exists with 3 ghost cards
THEN accordion is collapsed by default
WHEN user expands accordion
THEN 3 ghost cards visible in grid
AND header shows "Assigned . 3 issues"
```

#### TE2E-34: Aggregate Session State

```
GIVEN issue with session A (running) and session B (needs-input)
THEN chip shows "NEEDS INPUT" (needs-input > running)
```

#### TE2E-35: Archive / Unarchive

```
GIVEN active card
WHEN user archives via context menu
THEN card disappears from default view
WHEN "Show Archived" filter enabled
THEN card appears, looking same as active (no visual distinction)
```

### 21.2 Tauri MCP Visual Tests

These tests use the Tauri MCP bridge for visual verification via screenshots. Focus on visual correctness, styling, animation, and theming.

#### TMCP-1: Variant Rendering - Refined Horizon

```
GIVEN variant = "refined-horizon"
VERIFY: header has horizontal gradient (vivid left, desaturated right)
VERIFY: crisp 1px boundary between header and body
VERIFY: preview square matches header color
```

#### TMCP-2: Variant Rendering - Veil

```
GIVEN variant = "veil"
VERIFY: seamless vertical gradient from top through body
VERIFY: no hard header/body boundary
VERIFY: gradient reaches ~60% down (default)
```

#### TMCP-3: Variant Rendering - Radiant

```
GIVEN variant = "radiant"
VERIFY: radial gradient emanates from preview area
VERIFY: preview box is OPAQUE dark (not transparent)
VERIFY: trees/characters toned to ~35% opacity
```

#### TMCP-4: Hover State Visual

```
GIVEN default state card
WHEN hover
VERIFY: issue-color border glow visible
VERIFY: card lifted ~2-3px (shadow/transform change)
VERIFY: background slightly brighter
```

#### TMCP-5: Active State Visual

```
GIVEN card clicked (active)
VERIFY: issue-color 3px solid outline (NOT green, NOT blue)
VERIFY: subtle body tint in issue color
VERIFY: box-shadow glow in issue color
```

#### TMCP-6: Selected State Visual

```
GIVEN card Ctrl+clicked (selected)
VERIFY: var(--primary) 3px solid outline (NOT issue color — batch uses system color)
VERIFY: var(--primary) box-shadow glow
VERIFY: NO checkbox visible anywhere
```

#### TMCP-7: Done State Visual

```
GIVEN done card (closed + merged)
VERIFY: transparent background, NO visible borders
VERIFY: NO card surface/fill color
VERIFY: text and badges at full opacity (not dimmed)
VERIFY: DONE chip in header
VERIFY: action buttons present with neutral styling
```

#### TMCP-8: Ghost Card Visual

```
GIVEN ghost card
VERIFY: dashed border (visible dash pattern)
VERIFY: neutral gray surface
VERIFY: no quick-action buttons
VERIFY: Adopt split-button visible
VERIFY: no tree preview (placeholder only)
```

#### TMCP-9: Ghost Card Label Tint - Single

```
GIVEN ghost card with one red label
VERIFY: header has visible red tint (clearly colored, not subtle)
VERIFY: card body has lighter tint
VERIFY: label pill retains full color
```

#### TMCP-10: Ghost Card Label Tint - Split

```
GIVEN ghost card with orange "design" + blue "import" labels
VERIFY: left side has orange tint, right side has blue tint
VERIFY: colors blend in middle
VERIFY: both tints clearly distinguishable
```

#### TMCP-11: Error Overlay Visual

```
GIVEN card with session error state
VERIFY: red tint on card surface
VERIFY: pulsing animation active
VERIFY: orange/red border color
VERIFY: ERROR chip in header
```

#### TMCP-12: Needs Input Overlay Visual

```
GIVEN card with needs-input state
VERIFY: amber pulse animation active
VERIFY: orange/red border
VERIFY: NEEDS INPUT chip in header
```

#### TMCP-13: Executing - No Overlay

```
GIVEN card with executing session
VERIFY: NO card overlay, NO header brightening
VERIFY: only EXECUTING chip visible in header
VERIFY: card body looks same as default (no glow changes)
```

#### TMCP-14: Badge Style A (Solid)

```
GIVEN badge_style = "solid"
VERIFY: priority badge has opaque var(--badge-color) background
VERIFY: state chip has opaque var(--badge-color) background
VERIFY: text has WCAG contrast against background (white fallback)
VERIFY: no visible border
```

#### TMCP-15: Badge Style B (Subtle, Default)

```
GIVEN badge_style = "subtle"
VERIFY: tinted background (18% badge color mixed in sRGB), colored text, NO border
```

#### TMCP-16: Badge Style C (Outlined)

```
GIVEN badge_style = "outlined"
VERIFY: tinted background (18% badge color mixed in sRGB), colored text, WITH 30% opacity border
```

#### TMCP-17: Quick-Action Button Ghost Style

```
GIVEN card at rest
VERIFY: quick-action buttons have NO visible background
WHEN hover over button
VERIFY: background appears on that button only
```

#### TMCP-18: No-Worktree Quick Actions

```
GIVEN card with no worktree
VERIFY: quick-action buttons at reduced opacity
```

#### TMCP-19: Light Mode Header

```
GIVEN light mode active
VERIFY: header has full saturation colors (vivid)
VERIFY: card body is white/light surface
VERIFY: text dark on light surfaces
```

#### TMCP-20: Dark Mode Header

```
GIVEN dark mode active
VERIFY: header desaturated ~20-30% vs light mode
VERIFY: card body is dark surface
```

#### TMCP-21: Worktree Setup Materialization

```
GIVEN card transitioning from no-worktree to worktree-active
VERIFY: card starts muted/borderless
VERIFY: gradient, color, border appear when worktree activates
```

#### TMCP-22: Selection-Ready State

```
GIVEN Ctrl key held
VERIFY: cards show var(--primary) outline at ~30% opacity
VERIFY: cursor changes to pointer
```

#### TMCP-23: PRD Group Ring

```
GIVEN cards share PRD
WHEN hover PRD number
VERIFY: ring appears on ALL matching cards
VERIFY: ring is ~25% larger than normal state rings
```

#### TMCP-24: Responsive Grid

```
GIVEN viewport width = 1400px
VERIFY: cards in grid with min 450px width
GIVEN viewport width = 800px
VERIFY: single column layout
```

#### TMCP-25: Issue Color on Radiant Header

```
GIVEN card using Radiant variant (dark/non-colorized header)
VERIFY: issue number (#142) renders in issue's assigned color
GIVEN card using Veil or Refined Horizon variant (colorized header)
VERIFY: issue number inherits header text color (not issue color)
```

#### TMCP-26: Priority Position - Header Right

```
GIVEN priority_position = "header-right"
VERIFY: priority badge positioned next to state chip in header
```

#### TMCP-27: Priority Position - Preview

```
GIVEN priority_position = "preview-bottom-inside"
VERIFY: priority badge inside preview area, padded from bottom
VERIFY: z-index above preview content
```

#### TMCP-28: Done + Hover Transition

```
GIVEN done card
WHEN hover starts
VERIFY: border and generic bg fade IN
WHEN hover ends
VERIFY: border and bg fade OUT back to transparent
```

#### TMCP-29: Command Result Animation

```
GIVEN running command badge
WHEN command completes (pass)
VERIFY: pill collapses from text+spinner to green circle-check
VERIFY: animation is smooth, not instant
```

#### TMCP-30: Stale Badge Appearance

```
GIVEN passed command badge
WHEN local changes detected
VERIFY: badge dims/grays out visually
```

#### TMCP-31: Design Constraint - No Left Border

```
FOR EACH card rendered
VERIFY: no left colored accent border/strip present
```

#### TMCP-32: Design Constraint - No Flat Header

```
FOR EACH card rendered
VERIFY: header uses gradient, not flat solid color
```

#### TMCP-33: Card Minimum Width

```
VERIFY: no card rendered below 450px width
```

#### TMCP-34: Preview Square Shape

```
VERIFY: preview area is square (width === height)
VERIFY: minimum 100px
```

#### TMCP-35: Title Truncation

```
GIVEN card with very long title (100+ chars)
VERIFY: title truncated with ellipsis
VERIFY: no horizontal overflow
VERIFY: header elements not pushed offscreen
```
