# Assigned Issues Panel — Design Spec

Dedicated tab in the workspace bottom panel showing GitHub issues assigned to the current user. Enables quick-import into Grovekeeper with or without a worktree, bypassing the full creation wizard.

**Status**: Variant E (Batch Action Bar) selected and refined. See `mockups/assigned-issues-panel/variant-e.html` for the approved direction.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Container Context

**Parent**: `WorkspaceBottomPanel` — tab content area (the "Assigned Issues" tab)
**What parent provides**: Tab bar with tab buttons (Terminal, Issues, Kanban, Issue Detail, Dependencies, Activity, Session, Assigned Issues), panel resizer handle at top, panel border
**What this component fills**: The content area below the active tab button, full width × remaining height after tab bar
**Must NOT include**: Tab bar, panel header, outer border, footer — these belong to the parent panel
**Workspace scope**: One workspace = one GitHub repository. All issues shown are from that repo, so repo column is omitted.

**Mockup rendering**: Show the bottom panel shell (tab bar with "Assigned Issues" tab active) as read-only context at ~40% opacity. The designed component fills the content area below.

## Panel Purpose

Quick import of GitHub-assigned issues into the Grovekeeper workspace. The user sees what's assigned to them and can create a Grovekeeper issue (with or without worktree) in one click, bypassing the full creation wizard.

## Tab Badge

The "Assigned Issues" tab shows a count badge of **suitable-for-linking** issues only:
- Suitable = assigned to current user **AND** not closed **AND** not already linked in Grovekeeper
- Example: `Assigned Issues` tab with badge `8` means 8 unlinked open issues remain

## Categories

Two collapsible sections. No "Deleted" concept — an issue is either linked or unlinked in Grovekeeper.

- **Unlinked** _(expanded by default)_: Assigned open issues not yet in the Grovekeeper dashboard. Full opacity. Full quick-action buttons.
- **Linked** _(collapsed by default)_: Already in the workspace dashboard. Shown dimmed (45% opacity) for reference. No quick-add actions. Collapsed by default since they're secondary context.

## Required Elements

### Toolbar (above selection bar)

- **Search input** (full-width, flex-1): Full-text filter across issue number, PRD number, and title. Keyboard shortcut: `Ctrl+A` / `⌘A` selects all visible rows when focus is within the tab.
- **Refresh indicator**: Shows "synced Xs ago" text + animated refresh icon button. Polls at a reasonable interval to detect new assignments; does not hammer the GitHub API. Clicking forces an immediate refresh.

### Selection Bar (below toolbar, above table header)

- **Global checkbox** (tri-state: unchecked / indeterminate / checked): Selects or deselects all visible rows. In indeterminate state when some but not all are selected. Reacts to Ctrl+A / ⌘A.
- **Selection count text**: "3 selected" or "No issues selected"
- **Select all link** (when some are selected): "Select all X unlinked" — quick link to check all unlinked rows
- **Add Selected** button (primary, disabled when 0 selected): Quick-add selected issues to workspace. Contextually applies to **unlinked issues only** even if linked rows are also selected.
- **Add + Worktree** button (secondary, disabled when 0 selected): Same, plus creates worktrees. Applies to unlinked only.

### Table Header (sortable columns)

All columns support sort (ascending / descending). Active sort shown with filled sort arrow. Columns:

| Column | Width | Notes |
|--------|-------|-------|
| Checkbox | 28px | Global checkbox lives here; no column label |
| PRD | 56px | Mono. Sort by PRD number. Empty shown as `—` |
| Issue # | 54px | Mono. Sort by number |
| Title | 1fr | Sort alphabetically |
| Labels | ~200px | Filter/sort by label presence. Show as many as possible |
| Actions | 72px | Not sortable. Pinned right. Always visible |

### Per Issue Row

- **Checkbox** (left): Toggle row selection
- **PRD number** (clickable link): Opens the PRD GitHub issue in browser. Shows `—` if no parent PRD.
- **GitHub issue number** (clickable link `#123`): Opens the issue in browser.
- **Issue title**: Full text, truncated with ellipsis. **Not** a click target for row selection.
- **GitHub labels**: Show as many as possible, prioritized: `afk`/`hitl` first → `design-needed` → everything else.
- **Quick actions** (always visible, pinned right):
  - Plus icon: Quick-add to workspace (no worktree)
  - GitBranch icon: Quick-add with worktree
  - For **linked rows**: show a small "✓" linked indicator instead (no add buttons)

### Row Click Behavior

Clicking anywhere in a row **except** the checkbox, PRD number link, issue number link, and title text **selects the row** (toggles its checkbox). Labels, empty space, and all other areas are click targets for selection. Quick action buttons perform their action without toggling selection.

### Keyboard Shortcuts

- `Ctrl+A` / `⌘A` (when tab has focus): Select all visible rows
- `Space`: Toggle selection of focused row
- `Enter`: Add selected issues (same as "Add Selected" button)

### Pagination

- Fetch up to **50** issues per load. If more exist, show a "Load X more" button at the bottom of the scroll area.
- Show total count in group headers: `Unlinked (8)`, `Linked (3)`.

## Quick Actions

- **Quick add** (Plus icon): Creates Grovekeeper issue with auto-filled name, GitHub link, next color. No worktree. One click, no wizard.
- **Quick add with worktree** (GitBranch icon): Same + auto-creates worktree. One click.
- Both bypass the creation wizard entirely.
- Contextual batch behavior: if a mix of linked and unlinked rows is selected, batch "Add Selected" and "Add + Worktree" silently skip linked rows.

## Components to Use

- **Table layout**: Custom CSS grid table (same pattern as Variant E). Consider extracting as a reusable component or adopting shadcn-svelte Table when available.
- **Batch action bar**: Reference `BatchActionToolbar.svelte` for styling conventions; implement a custom version with the tri-state global checkbox and the two quick-add actions.
- **Search input**: `src/lib/components/ui/search-field/` or `input/`.
- **Buttons**: `Button` component from `ui/button/` — size `sm` for quick-add, `icon-sm` for row actions.
- **Badges**: `Badge` from `ui/badge/` or `.gk-badge` CSS class for GitHub labels.
- **Tabs**: Existing bottom panel tab system. Add count badge using `.tab-count` pattern.
- **Tab overflow**: On narrow widths, tabs that don't fit should collapse behind a "…" overflow button (dropdown or scroll).

## Layout Constraints

- Tab content area: full width of its panel in multi-panel layout
- Issue row height: 38px (compact)
- Must work in narrow panels (multi-panel side-by-side)
- On narrow widths: hide Labels column first, then PRD column. Always show checkbox, Issue #, Title, Actions.

## States to Implement

- **Default**: Unlinked section expanded, linked collapsed, no selection, search empty
- **Selection active**: Batch bar populated, global checkbox indeterminate or checked, action buttons enabled
- **Search filtered**: Rows filtered in real-time, counts update, "X of Y" indicator
- **Empty state**: No assigned issues (all linked or none assigned)
- **Loading**: Fetching from GitHub — spinner in refresh indicator area
- **Error**: GitHub not authenticated or API failure
- **Post quick-add**: Issue animates out of Unlinked, reappears in Linked

## Visual References

- `AssignedIssuesPanel.svelte` — current implementation (baseline)
- `BatchActionToolbar.svelte` — selection bar / batch action pattern
- `TopBar.svelte` — refresh button + `syncing` animate-spin pattern
- GitHub Issues list — compact issue row pattern
- Action button placement (hover-reveal vs always visible)
- Animation on quick-add (issue sliding to linked section)
- Whether to show issue body preview on hover/expand

## Not Included

- Full issue editing (use main Issues tab or Issue Detail for that)
- Cross-repository issue management (future feature)
- Issue creation wizard integration (this bypasses the wizard)
- Assigned PR display (separate concern, shown in PRs tab)
