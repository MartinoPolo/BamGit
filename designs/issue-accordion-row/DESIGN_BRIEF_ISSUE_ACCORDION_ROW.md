# Issue Accordion Row — Design Brief

Compact expandable row view for issues in the workspace dashboard bottom panel. The high-density alternative to the card grid — toggled via the view switcher in the Issues tab toolbar. Must convey the same essential data as `IssueCard` (see `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md`) but in a single-line expandable format. Hand this to a designer for visual exploration.

**Related**: PRD #254 (Dashboard UX Refresh), PRD #296 (Issue Card v2 Redesign)

---

## 1. Purpose

Compact information-dense alternative to the card grid. Optimized for scanning 20+ issues quickly. Users toggle between this and the card grid via a global layout switcher. The row view must feel like a professional task list — not a simplified card. Every data point visible on the card must be accessible in the row (collapsed or expanded).

---

## 2. Surrounding Context

The accordion rows appear in the bottom panel (~75% of viewport height), inside the Issues tab, when the view switcher is set to "rows" mode.

**Full viewport layout**:
- **Left**: Dashboard sidebar (240px, final) — logo, workspace selector, nav items (Dashboard active), theme/lang/user
- **Top**: TopBar with dashboard name, controls
- **Forest View**: ~25% height with tree canvas
- **Bottom Panel**: ~75% height, Issues tab active, view switcher showing "rows" mode selected

**Parent**: `WorkspaceBottomPanel` — tab content area (the "Issues" tab, alternative list view mode)
**What parent provides**: Tab bar with tab buttons, panel resizer handle at top, panel border, view-mode toggle (card grid vs accordion list) in the Issues tab toolbar, `BatchActionToolbar`, `SortFilterControls`
**What this component fills**: Content area below the Issues tab toolbar, full width x remaining height (scrollable)
**Must NOT include**: Tab bar, panel header, outer border, footer, sort/filter controls — these belong to the parent

**Mockup rendering**: Show the bottom panel shell (tab bar with "Issues" tab active, accordion view selected) as read-only context at ~40% opacity. The designed component fills the content area below.

---

## 3. Requirements

### 3.1 Data Parity with Issue Card

Every piece of data shown on the IssueCard must be accessible in the accordion row — either in the collapsed row or in the expanded section. No information loss when switching view modes.

### 3.2 Collapsed Row Data

Must show (left to right, prioritized):
- Issue color identity (background, stripe, or indicator)
- Expand/collapse control (chevron)
- Priority indicator (icon or badge, if non-medium and priorities enabled)
- PRD parent number (if sub-issue, e.g. `#87 /`)
- Issue number (`#142`, monospace, clickable link to GitHub)
- Issue title (truncated, primary text)
- Worktree/branch badges (sync badge, merge conflict badge — right-aligned)
- GitHub badges (issue state, PR state, CI status)
- Issue state chip (same 22-state cascade as card: `IssueStateChip`)
- Contextual action buttons (primary + secondary + overflow `...`)

### 3.3 Expanded Section Data

Additional detail revealed on expand:
- Tree thumbnail / character portrait / placeholder (same as IssueCardPreview)
- Worktree folder + branch name (full, monospace)
- GitHub labels (colored pills + overflow count)
- Command results row (check/test/CI badges: `CommandResultBadge`, `ServerPortBadge`)
- Full contextual action button set
- Notification dot (if present)

### 3.4 Batch Selection in Row Mode

Same batch selection system as card grid:
- Ctrl+click toggle, Shift+click range (Windows Explorer pattern), right-click "Select"
- NO checkboxes — selection via blue ring/highlight treatment only
- Blue `#4a9eff` (dark) / `#3b82f6` (light) selection indicator
- `BatchActionToolbar` works identically in both view modes
- Ctrl+A selects all, Escape deselects

### 3.5 Sort/Filter Compatibility

Accordion rows respect the same sort/filter controls as the card grid. Sort order determines row order. Filters hide/show rows. No additional sort/filter UI specific to the row view.

### 3.6 Ghost Rows (Non-Adopted Issues)

Non-adopted assigned issues appear as ghost rows in the "Assigned Issues" section below adopted rows (or in the Assigned Issues tab, depending on panel layout):
- Neutral gray, dashed border or dashed left indicator
- Same row structure, most fields naturally empty
- No quick-action buttons, no state chip
- Adopt split-button replaces contextual action buttons
- Label-based coloring: 1 colored label = tint, 2 labels = left/right split (same rules as ghost cards, adapted to row format)

### 3.7 Responsive Compaction (Narrowing Viewport)

Progressive stages as panel width decreases:
1. Hide action button labels (icon-only, then behind overflow `...`)
2. Compact GitHub badges to icon-only mode
3. Truncate issue title more aggressively
4. Hide priority badge text (icon-only)

Right-click context menu always available as fallback for hidden actions.

---

## 4. Data Mapping — IssueCard Field to AccordionRow Location

| IssueCard Field | Collapsed Row | Expanded Section |
|---|---|---|
| Issue color (header gradient) | Row background tint / left indicator | Inherited from row |
| PRD parent number | Inline before issue number | -- |
| Issue number (#142) | Inline, monospace, clickable | -- |
| Issue title | Inline, truncated | Full title (if truncated in row) |
| Issue state chip (22-state) | Inline, right zone | -- |
| Priority badge | Inline, left zone (if non-medium) | -- |
| Quick-action buttons (folder/terminal/editor/mute) | Hidden (in expanded or overflow) | Visible in expanded section |
| Contextual action buttons (primary/secondary/overflow) | Inline, right zone (max 2 + overflow) | Full set in expanded |
| Tree thumbnail / character portrait | -- | Left column of expanded grid |
| Worktree folder path | -- | Expanded detail |
| Branch name | Abbreviated or icon + badge in collapsed | Full path in expanded |
| Sync badge (behind base count) | Inline badge, right-aligned | -- |
| Merge conflict badge | Inline badge, right-aligned | -- |
| Worktree state badge (pending/failed/removing) | Inline badge | -- |
| GitHub issue state badge | Inline badge | -- |
| PR state badge | Inline badge | -- |
| CI status badge | Inline badge (if space) | Expanded detail |
| GitHub labels (colored pills) | -- | Expanded section |
| Command result badges (check/test/server) | -- | Expanded section (Row 4 equivalent) |
| Server port badge | -- | Expanded section |
| Notification dot | Dot indicator (left or near title) | -- |

---

## 5. Existing Components to Reuse

These exist in the codebase and must be used — not recreated:

| Component | Location | Usage in Accordion Row |
|---|---|---|
| `Accordion` (shadcn/bits-ui) | `$lib/components/shadcn/accordion/` | Expand/collapse primitive |
| `Button` (ghost, ghost-overlay, icon, icon-sm) | `$lib/components/shadcn/button/` | Action buttons, overflow trigger |
| `Badge` (all variants + compact size) | `$lib/components/shadcn/badge/` | Status indicators, labels |
| `IssueStateChip` | `$lib/components/derived/issue-state-chip/` | 22-state cascade chip |
| `PriorityBadge` | (to be created per card v2 spec) | Priority indicator |
| `SyncBadge` | `$lib/components/derived/sync-badge/` | Behind-base count |
| `GitHubBadge` | `$lib/components/derived/github-badge/` | Issue/PR state (supports compact/icon-only) |
| `MergeConflictBadge` | `$lib/components/derived/merge-conflict-badge/` | Merge conflict indicator |
| `CommandResultBadge` | (to be created per card v2 spec) | Check/test result animated pill |
| `ServerPortBadge` | (to be created per card v2 spec) | Dev server port indicator |
| `ContextualActionButtons` | `$lib/components/blocks/issue/` | Primary + secondary + overflow actions |
| `IssueCardContextMenu` | `$lib/components/blocks/issue/` | Right-click context menu (same as card) |
| `BatchActionToolbar` | `$lib/components/blocks/issue/` | Batch selection toolbar |
| `SimpleTooltip` / `Tooltip` | `$lib/components/shadcn/tooltip/` | All icon-only elements |
| `ContextMenu` | `$lib/components/shadcn/context-menu/` | Right-click actions |
| `Kbd` | `$lib/components/shadcn/kbd/` | Shortcut hints |
| `SplitButton` | (to be created per card v2 spec) | Ghost row adopt action |

---

## 6. Components to Design

### 6.1 IssueAccordionRow (the row itself)

Single-line collapsed row with all priority data, expandable to show full issue detail. Wraps shadcn Accordion item.

**Collapsed layout** (single horizontal strip, ~40-44px):
```
[expand-chevron] [priority?] [PRD#? /] [#issue-num] [title...] ... [worktree-badges] [gh-badges] [state-chip] [action-btns]
```

**Structure**:
- Left zone: chevron + priority + PRD + issue number + title (flex, min-w-0, truncation)
- Right zone: badges + state chip + action buttons (flex, shrink-0, gap-1)
- Background: issue color applied as tint/gradient/band

### 6.2 IssueAccordionRowExpanded (expanded content)

Additional detail section below the collapsed row. Uses a two-column grid similar to the card body:

```
[tree-thumbnail/portrait] | [worktree-path]
                          | [github-labels]
                          | [command-results]
                          | [full-action-buttons]
```

- Left column: ~80-100px preview (tree thumbnail, character portrait, or placeholder)
- Right column: stacked detail rows (same data as IssueCard body rows 1-4)

### 6.3 IssueAccordionList (list orchestrator)

Wraps all accordion rows. Manages:
- Adopted rows section
- Ghost rows section (assigned issues, if shown inline)
- Scroll container
- Keyboard navigation between rows
- Virtual scrolling for 50+ issues (consider `svelte-virtual-list` or native CSS `content-visibility`)
- PRD group hover store (same as `IssueCardList`)

---

## 7. States & Interactions

### 7.1 Core Row States

| State | Visual | Trigger |
|---|---|---|
| **Default (collapsed)** | Clean row, issue color background tint, subtle bottom separator | Resting |
| **Hover** | Background brightens, action buttons become more visible. Always additive — works on all states | Mouse enter |
| **Active (single-click)** | Issue-color glow/ring on the row (same semantics as card active). Shows detail in adjacent panel. One at a time | Single click on row |
| **Selected (batch)** | Blue `#4a9eff` ring/highlight + blue body overlay (~5% tint). NO checkbox | Ctrl+click, Shift+click |
| **Selection-ready** | Blue border at ~30% opacity, pointer cursor | Ctrl/Shift held |
| **Expanded** | Chevron rotates, expanded content slides in below | Click chevron or designated expand trigger |
| **Active + Expanded** | Both active glow and expanded content visible | Click row then expand |

### 7.2 Session-Driven Row States

| Session State | Row Treatment |
|---|---|
| **Executing** | NO row overlay. Chip only (`IssueStateChip`). Executing is routine — no animation |
| **Error** | Red tint on row background, pulsing animation, orange/red border |
| **Needs Input** | Amber pulse animation, orange/red border |

### 7.3 Special Row States

| State | Visual | Trigger |
|---|---|---|
| **Done** | Transparent/no background, NO borders, NO row surface. Content fully readable (NOT dimmed). No color identity. `DONE` chip shown. On hover: gains border + generic bg, fades back | `github_issue_state='closed'` AND `pr_state='merged'` |
| **Ghost** | Neutral gray, dashed border/indicator, muted. Adopt split-button replaces actions. Label-based tinting | Non-adopted assigned issue |
| **Worktree Setup** | Muted/borderless row. Spinner in worktree badge. `WORKTREE SETUP` chip. Row "materializes" once worktree active | `worktreeState = pending` |
| **Worktree Removing** | Row fades toward muted state. `REMOVING WORKTREE` chip | `worktreeState = removing` |
| **Disabled** | `opacity-42 pointer-events-none` | During batch operation |

### 7.4 Interactions

- **Single click** on row body: activates the issue (shows detail in adjacent panel)
- **Click on chevron**: toggles expand/collapse (does NOT change active state)
- **Click on title**: activates issue and navigates to Issue Detail
- **Ctrl+click / Shift+click**: batch select (same as card)
- **Right-click**: context menu (same `IssueCardContextMenu`)
- **Double-click**: (optional, design freedom) could expand or open detail
- **Keyboard**: Arrow keys to navigate rows, Enter to activate, Space to expand, Ctrl+A to select all, Escape to deselect

---

## 8. Design Constraints (Non-Negotiable)

- Issue color must be the **primary visual differentiator** on each row — must be prominent enough for at-a-glance scanning
- WCAG contrast for all text on colored backgrounds
- **No left colored accent border as sole color identity** (AI design cliche per card v2 decisions) — if a left stripe exists, it must be supplementary to a more prominent color treatment
- Must use existing base components (Button, Badge, etc.)
- Must respect token system (`designs/tokens.css`), OKLCH color space
- Must support batch selection with blue ring — same visual treatment as card grid
- Same contextual actions as card (14-level priority cascade from `derive_contextual_actions.ts`)
- Same 22-state issue state chip cascade as card
- Same context menu as card (`IssueCardContextMenu`)
- Action buttons: NO visible background by default, bg on hover only (ghost style)
- Quick-action buttons (folder/terminal/editor/mute): always accessible, not permanently hidden
- Typography: Geist (sans) / Geist Mono (mono)
- Collapsed row height: 40-44px
- Full width of panel (no columns)
- Must work in multi-panel layout (panels can be narrow)
- Dark mode primary, light mode supported from day one
- Must handle 50+ issues performantly (virtual scrolling or `content-visibility`)
- Both adopted and ghost rows must be supported

---

## 9. Design Freedom

The designer has freedom over these aspects:

- **Row background treatment**: How issue color is applied (full-width tint, gradient band, left-to-right fade, stripe + tint, etc.)
- **Row height** (within 40-44px range for collapsed)
- **Expand animation**: slide, accordion, morph. Duration 150-250ms
- **Expanded section styling**: border, background differentiation, indent, card-within-row
- **Separator style between rows**: border, gap, alternating bg, or none
- **Badge placement and spacing** within the row
- **How color background interacts with hover/active/selected states**
- **Chevron placement**: far left vs far right vs inline
- **How much detail shows in collapsed vs expanded** (beyond the required minimums in section 3)
- **Ghost row dashed indicator style** (border, left stripe, background pattern)
- **Group headers** (optional: whether rows can be visually grouped by priority, status, or PRD)
- **Expanded section two-column split** (exact preview size, stacking behavior at narrow widths)
- **PRD group hover**: how all same-PRD rows highlight when hovering the PRD number

---

## 10. Inspiration

- **Issue Card v2**: `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md` — the canonical reference for all data, states, and interaction patterns. The row must mirror the card's 22-state chip cascade, 14-level contextual action priority, badge styles (A/B/C), and done/ghost/worktree states.
- **Issue Card component architecture**: `IssueCard.svelte` + sub-components — understand the decomposition pattern (`IssueCardContext`, `IssueCardHeader`, `WorktreeRow`, `GitHubStatusRow`, `IssueLabelsRow`, `CommandResultsRow`, `ContextualActionButtons`)
- **Variant A mockup** (`designs/issue-accordion-row/variants/variant-a.html`): Color band header with 3px left-edge accent stripe, action buttons with contextual tint feedback, expanded body in darker same-hue surface
- **Variant C mockup** (`designs/issue-accordion-row/variants/variant-c.html`): Grouped by priority with sticky section headers, priority-tinted groups, progressive disclosure
- **GitHub Issues list view**: Professional task list feel, scan-friendly density
- **Linear app**: Compact issue rows with status, priority, assignee inline
- **Obsidian Tasks Dashboard plugin**: Compact rows with badges and actions

---

## 11. Base Components

Accordion, Button (ghost | ghost-overlay x icon | icon-sm), Badge (all variants + compact), IssueStateChip, PriorityBadge, SyncBadge, GitHubBadge, MergeConflictBadge, CommandResultBadge, ServerPortBadge, SimpleTooltip, Tooltip, ContextMenu, Kbd, SplitButton

---

## 12. Not Included

- Drag-to-reorder (sort is via toolbar controls)
- Inline editing of issue fields
- Kanban-style column layout (separate PRD #168)
- Forest view integration (accordion is bottom panel only)
- Sort/filter controls UI (belongs to parent toolbar, not the row component)
- Tab bar or panel chrome (belongs to parent)
- View switcher toggle (belongs to parent toolbar)
