# Overview Toolbar — Design Brief

Toolbar controls in the Overview page header for sorting, filtering, and configuring workspace card content. Issue: #276. Parent PRD: #257 (Overview & Workspace Card Polish).

## Design Tokens

Use the Grovekeeper Forest Moss palette from `designs/tokens.css`. Font: Geist / Geist Mono.

## Container Context

**Parent**: Overview page header row in `src/routes/overview/+page.svelte`
**What parent provides**: Page background, app title/subtitle on the left, "Show archived" switch already present, the workspace card grid below
**What this component fills**: A right-aligned cluster of inline buttons inside the existing header row — flows next to the `Show archived` switch
**Must NOT include**: Page header background, page title/subtitle, the workspace grid below, page padding — these belong to the parent

**Mockup rendering**: Show the Overview page header at reduced opacity (app title left, "Show archived" switch present) plus a hint of the first workspace card row at ~30% opacity. The designed toolbar fills only its right-aligned button cluster. Header total height ~56–64px.

## Purpose

Give the user fast, glanceable controls for organizing the workspace overview without leaving the page or opening a settings dialog. Three controls only — Sort, Filter, Footer Settings — each opening a small popover. The toolbar must read as a tight, secondary toolbar (no heavy chrome) that does not compete with the workspace cards for visual weight.

## Required Elements

### 1. Sort Control

- Trigger: ghost icon button (`ArrowUpDown` Lucide), 26px (`icon-sm`), tooltip "Sort"
- Opens a small popover (≈180px wide) listing sort options as radio rows:
  - Name (A → Z)
  - Activity (most recent first) — DEFAULT
  - Issue count (most → least)
  - Cost (today, highest → lowest)
- Selected option shows a check on the right and persists across sessions (localStorage)
- Optional secondary toggle inside the popover for ascending/descending — UI freedom, but the default per-option direction must be the one listed above
- After selection, the icon shows a small dot/badge if a non-default option is active

### 2. Filter Control

- Trigger: ghost icon button (`Filter` Lucide), 26px, tooltip "Filter"
- Opens a popover (≈220px wide) with a single-select group of filter modes:
  - All — DEFAULT
  - Active (any session running OR last activity < 24h)
  - Needs Attention (HITL > 0 OR ATTN > 0)
  - Dormant (no activity > 24h)
- Active mode shown as visually selected; trigger icon shows a small dot when not "All"
- Below the radio group, an inline summary line (mono, 11px, muted): `{N} workspaces shown` updates live

### 3. Footer Settings Control

- Trigger: ghost icon button (`Settings2` or `SlidersHorizontal` Lucide), 26px, tooltip "Footer content"
- Opens a popover (≈260px wide) titled "Workspace card footer"
- Single-select list controlling what every workspace card footer shows:
  - Today's cost — DEFAULT (shown as `today $X.XX`)
  - This week's cost (`week $X.XX`)
  - Total cost (`total $X.XX`)
  - Active sessions (`{N} sessions`)
  - Last activity (`{relative time}`)
- Selection applies to all workspace cards immediately and persists in `app_settings` (DB key-value, not localStorage)
- Below the list, a tiny preview row (mono, dashed top border, surface-2 bg) showing what the chosen footer will look like — same typography/density as the real card footer

### Layout & Order

- Left → right: `[Show archived switch] [vertical separator] [Sort] [Filter] [Footer Settings]`
- 8px gap between controls; 12px gap before the optional vertical separator
- The cluster sits right-aligned in the header row; vertically centered

## States

- **Default**: All three triggers as ghost icon buttons, no badges
- **Hover**: `bg-surface-2`, `text-foreground`
- **Focus (keyboard)**: ring as standard `gk-btn` focus
- **Active filter / non-default sort**: tiny accent dot (3px, `--primary`) at the top-right of the trigger icon
- **Popover open**: trigger gets `bg-surface-3`, popover anchored below with 6px offset, arrow optional
- **Popover row hover**: `bg-surface-hover`
- **Selected row**: check icon on the right, label in `--foreground` (others `--foreground-muted`)
- **Empty filter result** (e.g., "Dormant" but everything is active): the toolbar itself does not change — the empty state is owned by the page below; just show the live count `0 workspaces shown` in the filter popover summary

## Reusable Components

- `Button` from `$lib/components/ui/button` — `variant="ghost"`, `size="icon-sm"` (26px)
- `Popover` from `$lib/components/ui/popover` (Bits UI primitive)
- `RadioGroup` (Bits UI) for single-select rows, OR plain buttons that share the radio role
- `Separator` from `$lib/components/ui/separator` — vertical divider before the toolbar cluster
- `Tooltip` / `SimpleTooltip` for trigger labels
- Lucide icons (path-based imports): `arrow-up-down`, `filter`, `settings-2` (or `sliders-horizontal`), `check`

If a `SortFilterControls` component already exists for the bottom panel (planned in PRD #254), prefer reusing/extending it for visual consistency. The Overview toolbar uses a smaller, lighter variant with no inline labels — only icon triggers. Document the shared component in the refine phase.

## Components to Adopt

None new required — Popover, RadioGroup, Separator, Button, Tooltip already available via shadcn-svelte.

## Layout Constraints

- Toolbar height: matches header row (~56–64px), but the buttons themselves are 26×26px and vertically centered
- Icon size inside button: 14px, strokeWidth 1.7
- Popover widths: Sort ≈180px, Filter ≈220px, Footer ≈260px
- Popover row height: 32px, 8px horizontal padding inside rows
- Radius: `--radius-md` for popovers, `--radius-sm` for rows
- Z-index: rely on Popover primitive's stacking context

## Visual References

- Linear's filter/sort toolbars (compact icon triggers with popovers, dot badge when non-default)
- GitHub's "Sort" / "Filter" buttons in issue lists
- Existing Grovekeeper bottom panel toolbar (`SortFilterControls` planned for PRD #254) — feel consistent
- Existing `WorkspaceCard` footer styling (mono 10.5px, `foreground-subtle`) — the preview row in the Footer Settings popover should match

## UI Freedom

- Whether the trigger uses an icon-only ghost button or icon + tiny chevron
- Layout inside the Sort popover (radio rows vs check rows vs grouped sections for ascending/descending)
- How "non-default state" is signaled on the trigger (dot badge, color shift, filled icon variant)
- Whether the live count line in the Filter popover lives at the bottom or as a sub-header
- Whether the Footer Settings popover preview row sits above or below the option list

Designer MUST preserve:

- Three controls only (Sort, Filter, Footer Settings) — no extra buttons
- Right-aligned placement inside the existing header row
- Persistence: Sort/Filter → localStorage (per-window), Footer choice → `app_settings` (global)
- Default values: Sort = Activity, Filter = All, Footer = Today's cost

## Not Included

- A new page header redesign (header text/title is owned by the page)
- A toolbar separator / visual divider between the workspace grid and the toolbar
- Bulk actions on workspaces (delete, archive batch — out of scope for #276)
- A search input for workspaces (deferred — PRD #257 Excluded)
- Per-card footer override (the chosen footer applies to all cards)
- Workspace card content beyond the footer string

---

## Implementation Notes (for refine phase)

- New Tauri-backed setting key: `overview.footer_content` in `app_settings` table
- Frontend state: a new `overview-toolbar.context.svelte.ts` exposing `sortMode`, `filterMode`, `footerContent` via `Persisted` (localStorage for sort/filter) and a Tauri-backed accessor for footer content
- Workspace card footer becomes data-driven: it receives a `footerContent` prop from the page and renders accordingly (cost period via existing CostLink component for cost variants)
