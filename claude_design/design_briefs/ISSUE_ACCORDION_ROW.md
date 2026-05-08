# Issue Accordion Row — Design Spec

Alternative list view for the Issues tab in the workspace dashboard bottom panel. Replaces the card grid with compact expandable accordion rows. Inspired by the Grovekeeper Obsidian plugin overview. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Generate Three Distinct Variants

Three structurally different approaches to the accordion row layout. All must include every required element listed below.

**Variant A — Color Band Header**: Each row has a colored background header (issue color, reduced saturation in dark mode) similar to the issue card header band. Expand chevron on the left. Actions on the right.

**Variant B — Minimal Indicator**: Clean neutral rows with a small color dot or thin left indicator. Issue color used sparingly — only on hover glow and expand transition. Maximum information density.

**Variant C — Grouped Sections**: Rows grouped by priority or status with sticky section headers. Each row is minimal but the grouping provides visual structure. Color used in group headers.

## Row Purpose

Compact issue overview optimized for scanning many issues quickly. Users toggle between this and the card grid via a layout switcher. Should feel like a professional task list, not a simplified card.

## Required Elements

### Collapsed Row (single line, ~40-44px height)

Left to right:
- Priority icon (if non-medium)
- PRD number (if sub-issue, e.g. `PRD#87`)
- Issue number (`#123`, monospace)
- Issue name (truncated, primary text)
- Git-related badges: branch status, PR state, GitHub issue state
- Session state chip
- Action buttons: Open Folder, Open Terminal, Open Editor, overflow (⋯) for contextual actions
- Expand/collapse chevron

**Background**: Issue color as background with appropriate contrast, similar to card header band.

### Expanded Section (below collapsed row)

- Full issue detail content (same as Issue Detail tab)
- Tree thumbnail
- GitHub labels
- Dev server / check command status badges
- Full action button set

### Responsive Compaction (narrowing viewport)

Progressive stages:
1. Hide action buttons (accessible via right-click context menu)
2. Compact GitHub badges to icon-only
3. Truncate issue name more aggressively

## Reusable Components

- Button: `.gk-btn-sm` (26px) for inline actions, `.gk-btn-ghost` for row actions
- Badge: `.gk-badge` (20px) for status indicators
- SessionStateChip: existing component
- GitHubBadge: existing component (supports compact/icon-only mode)
- IssueCardContextMenu: same context menu on right-click

## Components to Adopt

- Consider: Accordion/Collapsible from bits-ui for expand/collapse animation
- Consider: Virtualized list (svelte-virtual-list or similar) for performance with 50+ issues

## Layout Constraints

- Row height collapsed: 40-44px
- Full width of panel (no grid columns)
- Expand animation: 150-200ms ease-out
- Must work in multi-panel layout (panels can be narrow)
- Reference: `.gk-btn-sm` (26px), `.gk-badge` (20px)

## States to Explore in Variants

Initial variants should show:
- List of 6-8 issues with mixed states (some expanded, most collapsed)
- Hover state on collapsed row
- Dark mode

States to design after variant selection:
- Active (selected for detail) row treatment
- Batch-selected rows
- Running session visual indicator
- Archived row appearance
- Empty state (no issues)
- Narrow viewport (compacted badges/buttons)

## Visual References

- Obsidian Tasks Dashboard plugin — compact issue rows with badges and actions
- `IssueCard.svelte` — data elements to include
- `WorkspaceCard.svelte` — hover/glow treatment inspiration
- GitHub Issues list view — professional task list feel

## UI Freedom

- Exact expand/collapse animation style
- Whether expanded section has a border or background differentiation
- Separator style between rows (border, gap, or alternating bg)
- Badge placement and spacing within the row
- How color background interacts with hover/active states
- Group header design (if Variant C direction chosen)

## Not Included

- Drag-to-reorder (sort is via toolbar controls)
- Inline editing of issue fields
- Kanban-style column layout (separate tab)
- Forest view integration (accordion is bottom panel only)
