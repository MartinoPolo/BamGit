# Overview Toolbar — Design Brief

Toolbar controls on the Overview page (multi-workspace launcher) for searching, sorting, filtering, and configuring workspace card content. Issue: #276. Parent PRD: #257 (Overview & Workspace Card Polish). Related: PRD #254 (Dashboard UX Refresh — `SortFilterControls` component planned there).

---

## 1. Purpose

Give the user fast, keyboard-accessible controls for organizing the workspace overview without leaving the page. The toolbar sits between the page header and the workspace card grid, providing: search, sort, filter, archive toggle, footer configuration, and the create-workspace action. It must read as a light secondary toolbar (no heavy chrome) that does not compete with the workspace cards for visual weight.

---

## 2. Surrounding Context

**This is the Overview page — NOT a workspace dashboard.**

- **Full-width page** — no sidebar, no forest view, no bottom panel
- **Header above**: `h1 "Grovekeeper"` + subtitle (left), archive toggle + GitHub popover button (right)
- **Toolbar**: sits directly below the header, above the card grid
- **Card grid below**: `repeat(auto-fill, 340px)` responsive grid of `WorkspaceCard` components + `AddWorkspaceCard`
- **No sidebar context**: toolbar spans the full content width minus page padding (currently `p-8`)

**Current page structure** (`src/routes/overview/+page.svelte`):
```
<div class="flex flex-col gap-6 p-8">
  [Header row: title left, archive+github right]
  [Card grid: WorkspaceCards + AddWorkspaceCard]
</div>
```

The toolbar inserts between the header and the grid. The existing archive toggle (`ArchiveIcon` button) and GitHub popover move INTO the toolbar — they no longer live in the header row. The header row becomes title + subtitle only.

**Mockup rendering**: Show the full-width overview page at reduced opacity — page title/subtitle at top, toolbar below it (full focus), first row of workspace cards at ~30% opacity below. No sidebar. No forest.

---

## 3. Requirements

### 3.1 Search

- Inline `SearchField` component, filters workspace cards by name as user types
- Placeholder: "Search workspaces..." with `Ctrl+F` hint via `Kbd`
- Filters the card grid live (no submit button)
- When empty, all cards shown (subject to other filters)
- When focused, auto-select all text for quick replacement
- Clear button (X) inside the field when non-empty

### 3.2 Sort Control

- Trigger: ghost icon button (`ArrowUpDown` Lucide), 26px (`icon-sm`), tooltip "Sort"
- Opens a `Popover` (approx 180px wide) listing sort options as radio rows:
  - Name (A-Z)
  - Activity (most recent first) — **DEFAULT**
  - Issue count (most to least)
  - Cost (today, highest to lowest)
- Selected option shows a check on the right, persists via `Persisted` (localStorage)
- Optional ascending/descending toggle inside the popover — designer freedom
- Trigger shows a small accent dot (3px, `--primary`) at top-right when a non-default sort is active

### 3.3 Filter Control

- Trigger: ghost icon button (`Filter` Lucide), 26px, tooltip "Filter"
- Opens a `Popover` (approx 220px wide) with single-select filter modes:
  - All — **DEFAULT**
  - Active (any session running OR last activity < 24h)
  - Needs Attention (HITL > 0 OR ATTN > 0)
  - Dormant (no activity > 24h)
- Active mode visually selected; trigger shows accent dot when not "All"
- Inline summary line at popover bottom (mono, 11px, muted): `{N} workspaces shown` — updates live

### 3.4 Archive Toggle

- Existing `ArchiveIcon` button, now inside the toolbar instead of the header
- `Button` ghost/icon, toggles `showArchived` state
- When pressed: `intent="primary"`, shows archived workspaces in the grid
- Tooltip: "Show archived"

### 3.5 Footer Settings Control

- Trigger: ghost icon button (`SlidersHorizontal` Lucide), 26px, tooltip "Card footer content"
- Opens a `Popover` (approx 260px wide) titled "Workspace card footer"
- Single-select list controlling what every workspace card footer shows:
  - Today's cost — **DEFAULT** (shown as `today $X.XX`)
  - This week's cost (`week $X.XX`)
  - Total cost (`total $X.XX`)
  - Active sessions (`{N} sessions`)
  - Last activity (`{relative time}`)
- Selection applies to all workspace cards immediately, persisted in `app_settings` (Tauri DB key-value, key: `overview.footer_content`)
- Below the option list: a tiny preview row (mono, dashed top border, `surface-2` bg) showing what the chosen footer looks like — matches real card footer typography (mono 10.5px, `foreground-subtle`)

### 3.6 GitHub Status

- Existing GitHub popover button, now inside the toolbar instead of the header
- `Button` ghost/icon with custom `GithubIcon`
- Opens `Popover` with `GitHubStatusCard` (existing component)

### 3.7 Create Workspace

- `Button` primary, compact, label "New workspace" (or icon-only `Plus` on narrow viewports)
- Opens `DashboardCreateDialog` (existing component)
- Rightmost element in the toolbar

---

## 4. Existing Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `SearchField` | `$lib/components/base/search-field` | Workspace name search input |
| `Button` | `$lib/components/shadcn/button` | ghost/icon triggers, primary create button |
| `Popover` | `$lib/components/shadcn/popover` | Sort, filter, footer settings, GitHub status |
| `Separator` | `$lib/components/shadcn/separator` | Vertical dividers between toolbar sections |
| `Switch` | `$lib/components/shadcn/switch` | Alternative for archive toggle (designer choice) |
| `Tooltip` / `SimpleTooltip` | `$lib/components/shadcn/tooltip` | Trigger labels for icon buttons |
| `Kbd` | `$lib/components/shadcn/kbd` | Keyboard shortcut hints (Ctrl+F in search) |
| `Badge` | `$lib/components/shadcn/badge` | Optional active filter/sort indicators |
| `GitHubStatusCard` | `$lib/components/blocks/github` | GitHub connection status in popover |
| `GithubIcon` | `$lib/components/derived/icons` | GitHub button icon |
| Lucide icons | `@lucide/svelte/icons/*` | `arrow-up-down`, `filter`, `sliders-horizontal`, `archive`, `plus`, `check`, `x` |

If a shared `SortFilterControls` component is implemented for PRD #254 (Dashboard UX Refresh), the overview toolbar should reuse/extend it for visual consistency. The overview variant uses icon-only triggers (no inline text labels) and operates on workspace data rather than issues.

---

## 5. Components to Design

| Component | Description | Storybook |
|-----------|-------------|-----------|
| **OverviewToolbar** | Full toolbar row: search + sort/filter controls + archive + footer settings + github + create. Orchestrates layout and spacing | Yes |
| **OverviewToolbarContext** | Svelte context (`overview-toolbar.context.svelte.ts`) exposing `searchQuery`, `sortMode`, `filterMode`, `footerContent` via `Persisted` (localStorage for search/sort/filter) and Tauri-backed accessor for footer content | No |

The individual popover contents (sort options, filter options, footer settings) are simple enough to be inline in the toolbar component or extracted as sub-snippets. They do not warrant standalone components unless the `SortFilterControls` pattern from PRD #254 creates a reusable primitive.

---

## 6. Layout & Dimensions

### Toolbar Row

- Full-width within page padding (matches the `p-8` of the overview page)
- Height: 40-48px (single row, vertically centered contents)
- Background: transparent (inherits page background) or `surface` with subtle bottom border — designer freedom
- Flex layout: `[SearchField] [spacer] [Sort] [Filter] [sep] [Archive] [Footer Settings] [GitHub] [sep] [New Workspace]`
- 8px gap between icon buttons; 12px gap around vertical separators
- SearchField width: 200-280px, does NOT grow to fill — fixed or max-width constrained

### Responsive Behavior

- At narrow widths (< 600px): SearchField collapses to icon-only trigger that expands on click
- Icon buttons remain always visible (they are only 26px each)
- "New workspace" button can collapse to icon-only `Plus` at narrow widths
- Toolbar never wraps to a second line — overflow handled by collapsing search and create button text

### Popover Positioning

- Popovers anchor below their triggers with 6px offset
- Widths: Sort approx 180px, Filter approx 220px, Footer Settings approx 260px, GitHub approx 320px (existing)
- Arrow optional (designer freedom)

---

## 7. States & Interactions

### Toolbar States

| State | Visual |
|-------|--------|
| **Default** | All triggers as ghost icon buttons, no badges, search field empty |
| **Search active** | SearchField has text, card grid filters live, clear (X) button visible |
| **Non-default sort** | Sort trigger shows 3px accent dot at top-right |
| **Non-default filter** | Filter trigger shows 3px accent dot at top-right |
| **Archive shown** | Archive button uses `intent="primary"` (filled) |
| **Non-default footer** | Footer settings trigger shows 3px accent dot at top-right |
| **Empty search result** | Card grid shows empty state ("No workspaces match"), toolbar unchanged |

### Button States

| State | Treatment |
|-------|-----------|
| **Default** | Ghost icon button, `text-foreground-subtle` |
| **Hover** | `bg-surface-2`, `text-foreground` |
| **Focus (keyboard)** | Standard `gk-btn` focus ring |
| **Popover open** | Trigger gets `bg-surface-3`, popover anchored below |
| **Active indicator** | 3px accent dot (`--primary`) at top-right of trigger when non-default value active |

### Popover Row States

| State | Treatment |
|-------|-----------|
| **Default row** | `text-foreground-muted` |
| **Hover** | `bg-surface-hover` |
| **Selected** | Check icon on right, `text-foreground` (others `text-foreground-muted`) |

### Empty Filter Result

When a filter mode (e.g., "Dormant") matches no workspaces, the toolbar itself does not change. The card grid shows its own empty state. The filter popover summary shows `0 workspaces shown`.

---

## 8. Design Constraints (Non-Negotiable)

- Toolbar must span full content width — no sidebar context on overview page
- Must not compete visually with workspace cards (secondary chrome only)
- Search, sort, filter, archive, footer settings, GitHub, and create workspace — all present in toolbar
- Sort/filter state persisted to localStorage (per-window) via `Persisted`
- Footer content setting persisted to `app_settings` DB table (global, not per-workspace)
- Default values: Sort = Activity, Filter = All, Footer = Today's cost
- Keyboard accessible: every control reachable via Tab, popovers openable via Enter/Space, Escape closes popover
- `Ctrl+F` focuses the search field (captured at page level)
- Archive toggle, GitHub popover, and create workspace button move from the current header into the toolbar
- Header row becomes title + subtitle only (no action buttons)
- Icon size inside buttons: 14px, strokeWidth 1.7
- Typography: Geist (sans) / Geist Mono (mono)
- OKLCH design tokens, semantic color variables only

---

## 9. Design Freedom

Designer has creative latitude in:

- Whether the toolbar has a visible background/border or is fully transparent
- Exact grouping and separator placement between controls
- Whether SearchField has a visible border at rest or only on focus (ghost input style)
- Whether sort/filter triggers use icon-only or icon + tiny chevron
- How "non-default state" is signaled on triggers (dot badge, color shift, filled icon, subtle underline)
- Layout inside sort/filter popovers (radio rows, check rows, segmented sections)
- Whether the live count in filter popover sits at bottom or as sub-header
- Whether the footer settings preview row sits above or below the option list
- Whether the create button is always visible or only on hover/focus of the toolbar
- Transition/animation timing for popover open/close
- Whether the toolbar sticks to the top on scroll or scrolls with content

Designer MUST preserve:

- All 7 controls present (search, sort, filter, archive, footer settings, GitHub, create)
- Search field is inline (not hidden behind an icon by default on desktop widths)
- Ghost icon button style for sort/filter/footer settings triggers
- Popover pattern for all settings (not dropdown menus or inline expansion)
- Persistence rules: sort/filter to localStorage, footer to DB
- Default values as specified

---

## 10. Inspiration

- **Linear** — compact toolbar with inline search + icon-button controls, dot badges for active filters
- **GitHub Issues** — filter/sort bar with inline search, "Sort" and "Filter" icon buttons
- **Raycast** — clean top toolbar with search + action buttons, minimal chrome
- **Issue Card v2 Final Decisions** (`designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md`) — quality standard for specification depth, state coverage, and component architecture

---

## 11. Not Included

- Search across workspace content (issues, sessions) — search is name-only for workspaces
- Bulk actions on workspaces (delete, archive batch — handled by PRD #255)
- Per-workspace footer override (chosen footer applies to all cards globally)
- Workspace card structural redesign (separate concern)
- Overview page layout changes beyond toolbar insertion
- View switcher (card grid vs list) — deferred to future PRD
- Advanced filter combinations (AND/OR, multi-select) — single-select filter only

---

## 12. Implementation Notes (for refine phase)

### State Management

- New context: `overview-toolbar.context.svelte.ts`
  - `searchQuery`: `StateRaw<string>` (ephemeral, not persisted)
  - `sortMode`: `Persisted<OverviewSortMode>` (localStorage key: `overview.sort`)
  - `filterMode`: `Persisted<OverviewFilterMode>` (localStorage key: `overview.filter`)
  - `footerContent`: Tauri-backed accessor (key: `overview.footer_content` in `app_settings`)
- Sort mode type: `'activity' | 'name' | 'issue-count' | 'cost'`
- Filter mode type: `'all' | 'active' | 'needs-attention' | 'dormant'`
- Footer content type: `'cost-today' | 'cost-week' | 'cost-total' | 'sessions' | 'last-activity'`

### Workspace Card Footer

- `WorkspaceCard` receives a `footerContent` prop from the page
- Footer becomes data-driven: renders cost via `CostLink` for cost variants, session count, or relative time based on the prop
- Current hardcoded `today $X.XX` footer is replaced by the configurable version

### Sort Comparators

- Name: `localeCompare` on `workspace.name`
- Activity: `Date` comparison on `workspace.last_activity` (nulls last)
- Issue count: numeric comparison on `workspace.open_issue_count`
- Cost: numeric comparison on `workspace.total_cost_usd` (nulls as 0)

### Filter Predicates

- All: no filter
- Active: `workspace.active_session_count > 0` OR `last_activity` within 24h
- Needs Attention: `workspace.hitl_count > 0` OR `workspace.prs_needing_attention > 0`
- Dormant: `last_activity` is null OR older than 24h, AND `active_session_count === 0`

### Tauri Backend

- New `app_settings` key: `overview.footer_content` (string value, default `'cost-today'`)
- No schema changes — uses existing `get_app_setting` / `set_app_setting` commands
- Add mock handler in `tauri_mock.ts` for `get_app_setting` / `set_app_setting` if not already present

### Testing

- Unit tests for sort comparators (all 4 modes, edge cases with nulls)
- Unit tests for filter predicates (all 4 modes, boundary: exactly 24h)
- Unit tests for search filtering (case-insensitive, partial match, empty query)
- Storybook: OverviewToolbar with all controls, popover states, active indicators
- E2E: search filters cards, sort reorders cards, filter narrows cards, footer setting changes card footer
