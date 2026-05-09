# Issue Card — Design Brief

Design spec for the primary issue representation used throughout Grovekeeper. Issue cards appear in the bottom panel Issues tab, Kanban views, and wherever issues are listed. This is a redesign — the current implementation is a placeholder. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `designs/tokens.css`. Font: Geist / Geist Mono.

## Container Context

**Parent**: Issue List Container (within panel tab content area) or Kanban Column
**What parent provides**: Tab bar, panel border, scrolling viewport, grid layout container, persistent action toolbar
**What this component fills**: Individual card slot within the responsive grid (450px min-width, auto-fills columns)
**Must NOT include**: Panel header, tab bar, outer scrolling container, grid container itself — these belong to the parent

**Mockup rendering**: Show multiple cards in a two-column grid context at reduced opacity to demonstrate responsive layout. The card design fills only its slot within the grid. Parent chrome (tab bar, toolbar) should be visible but de-emphasized.

## Chosen Variant: Banner

The Banner variant was chosen — vivid color header band with WCAG-contrast text, tree thumbnail in the body, metadata to the right. All states, expanded/collapsed views, and edge cases are now fully specified below.

## Card Purpose

The issue card is the atomic unit of the dashboard. It represents a single tracked issue (linked to a GitHub issue) and conveys at a glance: what the issue is, what color it is, what stage it's in, and whether it needs attention. Cards must be **visually distinguishable by their assigned color** — a user scanning a list of 10-20 cards should immediately identify each issue by its color.

## Required Elements

### Issue Color Identity (the most important visual feature)

- Each issue has a user-assigned hex color from a 24-color palette
- The color must be **prominently visible at first glance** — this is the primary visual differentiator between cards
- **Header area**: should have a vivid, solid background using the issue color — clearly distinguishable from other issues
- **Card body**: may have a subtle tint or wash of the issue color (e.g., 8-15% opacity overlay)
- **Text contrast**: automatically switch between black (`#000000`) and white (`#ffffff`) text based on background luminance. Use WCAG relative luminance — light backgrounds get black text, dark/vivid backgrounds get white text. The utility `getContrastTextColor()` in `color-picker/color_utils.ts` already implements this
- Default color when none assigned: `#525252` (neutral gray)

### Tree Thumbnail (92px panel)

- Small `LowPolyTree` component rendered at 92px size
- Tree stage reflects the issue lifecycle (seed → sprouting → sapling → growing → leafy → fruiting → flowering → seasonal → bare → dead → stump)
- Tree canopy color is derived from the issue color via hue extraction (green-tinted, natural-looking — the tree should still look like a tree, but with a distinctive warm/cool tint)
- Background behind the tree: explore options — could be the issue color, a surface gradient, or transparent
- The tree thumbnail from `artboards-issue.jsx` (92×92, `translateY(20px)`, `showGround={false}`) is the starting reference

### Header Layout

The header band uses the issue color as background with WCAG-contrast text.

- **Left side**: `#123` issue number (monospace) + issue name (truncated with ellipsis). The issue name is a clickable link to the corresponding GitHub issue when linked (opens in browser). Unlinked issues show the name as plain text
- **Right side (fixed, always visible)**: Priority badge + child count chip + **quick-action buttons**
- Priority badge and child count chip are positioned first (leftmost in right group), quick-action buttons last (rightmost, flush to header edge)

### Quick-Action Buttons (header-right)

Three icon buttons in the header for quick access to the issue environment. Always visible (not hover-revealed), fixed position on the right side of the header. They do NOT shift or move other header elements.

1. **Open Folder** — folder icon, opens issue worktree folder in file explorer
2. **Open Terminal** — terminal/command-line icon, opens terminal at worktree path
3. **Open Editor** — editor icon (VS Code by default, changes based on user's configured editor setting)

**No-folder state**: When no folder/worktree is assigned, buttons have ghost appearance (reduced opacity, muted color) but remain **clickable** — left-click opens native file picker to assign a folder. Right-click on any button (at any time, even when folder IS assigned) opens native file picker to reassign the folder (silent replacement, no confirmation). Tooltips: "Open [path]" / "Open terminal [path]" / "Open editor [path]" when assigned; "Assign folder" when unassigned.

Button style: small icon-only buttons (~18-20px), subtle background matching the header color treatment (semi-transparent backdrop like the priority chip). On dark-text headers use `rgba(0,0,0,0.12)`, on light-text headers use `rgba(255,255,255,0.15)`.

### Metadata (right side of card body)

- **Branch name**: monospace, muted, small — may be absent (no worktree yet)
- **Priority badge**: color-coded text badge (Top/red, High/orange, Medium/hidden, Low/blue, Lowest/gray). No "none" option — medium is the default. Priority badge in the header is **clickable** — spawns priority change menu inline. Visibility controlled by a per-workspace setting
- **Child count chip**: small badge showing number of sub-issues (e.g., "3 sub")

### Status Badges (compact row)

- **GitHub issue state**: open (green dot), closed (purple dot)
- **PR state**: draft, open, review-requested, approved, merged, closed, ready-to-merge — each with distinct icon/color
- **Branch status**: active, local-only, remote-gone, deleted
- **Sync status**: "2 behind base" indicator
- **Merge conflict indicator**: red warning badge
- **Worktree state**: pending (yellow spinner), active (green), failed (red)
- **Label pills**: GitHub labels with their hex colors (subtle background + border)
- Badges are interactive: clicking PR/issue badge opens GitHub URL
- Badges are responsive: collapse to icon-only when card width is narrow

### Badge Styling (must match design HTML)

Three badge variants, all matching `Issue Card States.html` exactly:

**Mini badge** (`ic-mini-badge`): For status indicators (PR state, issue state, branch status, sync, conflict)

- Height: 18px, padding: 0 6px, border-radius: 4px
- Font: `var(--font-mono)`, 10.5px, weight 500
- Border: 1px solid, background + color via `color-mix(in oklch, ...)` per status variant
- Status variants: success (green), warn (amber), danger (red), info (blue), purple, amber, moss

**Label pill** (`ic-label-pill`): For GitHub labels

- Height: 18px, padding: 0 7px, border-radius: 999px (fully rounded)
- Font: `var(--font-sans)`, 10.5px, weight 500
- Background: `color-mix(in oklch, var(--lbl) 14%, transparent)`
- Color: `color-mix(in oklch, var(--lbl) 75%, var(--foreground))`
- Border: `1px solid color-mix(in oklch, var(--lbl) 30%, transparent)`

**Priority chip** (`ic-pri-chip`): For priority indicator in header

- Height: 18px, padding: 0 6px, border-radius: 4px
- Font: `var(--font-mono)`, 9px, weight 700, uppercase, letter-spacing 0.06em
- Background: `rgba(0,0,0,0.18)` on light-text headers, `rgba(255,255,255,0.22)` on dark-text headers
- Clickable — spawns priority change menu

### Context Menu (right-click)

Built with bits-ui `ContextMenu` (WAI-ARIA menu pattern, focus trapping, submenus, separators). Two trigger mechanisms: right-click on card, or click the overflow (⋯) button (same component, programmatic open).

**Menu structure:**

1. **Select / Deselect** — top item, separator below (mode-switching action)
2. Edit
3. Rename (standalone issues only)
4. Priority ▸ (submenu: lowest, low, medium, high, top — no "none" option)
5. Change Color (opens color picker on click — no inline swatch preview in the menu item)
6. Separator
7. Setup Worktree / Remove Worktree (conditional on worktree state)
8. Archive / Unarchive (conditional on archived state)
9. Delete (destructive, red text)

**Batch context menu** (right-clicking a batch-selected card): shows batch actions — "Archive N selected", "Delete N selected", etc. Right-clicking an unselected card clears the batch selection, activates that card, and shows single-card actions (file manager pattern: Windows Explorer, macOS Finder, VS Code).

### Action Buttons (always-visible, bottom-right of card body)

- **Always visible** (not hover-revealed) — critical for mobile/touch where hovering is not possible
- Contextual "suggested actions" based on issue state (e.g., Setup Worktree, Execute, Review, Commit, Push, Create PR). Max 2 visible; additional actions behind overflow (⋯) menu
- Styled with `ic-action-btn` classes from design HTML: 22px height, 5px radius, 1px border, 11px sans font
- Primary action variant: moss green background for the recommended next step
- Overflow (⋯) button opens the same bits-ui context menu programmatically (single menu implementation, two triggers — right-click for desktop power users, button for touch/accessibility)
- Full contextual action state mapping deferred to separate issue

### Session State Chip (header)

- Small status chip in the header, positioned next to the priority chip
- Uses same contrast technique as priority chip: `bg-black/18` on dark headers, `bg-white/22` on light headers — avoids color collision with any header background
- Mono font, 9px, bold, uppercase (same `ic-pri-chip` styling as priority)
- States: EXECUTING (running), HITL (needs-input), REVIEW (needs-review), ERROR (errored), PAUSED (paused), DONE (finished). No chip shown for no-session
- Complemented by tree preview glow: pulsing glow for attention states (needs-input, errored), steady glow for running
- Replaces the old notification dot entirely

## Collapsed vs. Expanded States

The card should have two states:

### Collapsed (default)

- Compact — shows only the essential info: color header, name, issue number, status badge, tree thumbnail
- Optimized for scanning a list of many issues
- The color header is the dominant visual element

### Expanded (click to toggle)

- Reveals full metadata grid: status, worktree state, priority, created date, last synced
- Shows `WorktreeProgressIndicator` when worktree is being set up
- Shows full badge row with all status indicators
- Expand/collapse state persists per issue across sessions

## Special States

### Archived

- CSS `filter: grayscale(0.8) opacity(0.7)` overlay
- Preserves stored color underneath (visible if unarchived)

### Indented (child issue)

- Tree connector lines on the left (vertical + horizontal branch)
- `isLastChild` affects connector line height
- Slight left indent to show hierarchy

## Reusable Components

Specify which existing Grovekeeper components and classes to use:

- **LowPolyTree**: 92px tree component from `@mp/low-poly-2d-trees` library — renders tree thumbnail with stage-based morphology and hue-tinted canopy
- **WorktreeProgressIndicator**: Shows setup progress when worktree is being created
- **Buttons**: `.gk-btn-sm` for action buttons (22px height variant), `.gk-btn-icon` for quick-action icons
- **Custom badge classes** (from design HTML):
    - `.ic-mini-badge` for status indicators (18px height, mono font, color variants)
    - `.ic-label-pill` for GitHub labels (18px height, fully rounded)
    - `.ic-pri-chip` for priority indicator in header (9px uppercase mono)
    - `.ic-action-btn` for contextual action buttons (22px height, 5px radius)
- **Typography**: `.gk-h3` for issue name, `.gk-small` for metadata, `.font-mono` for issue numbers and branch names
- **Color utility**: `getContrastTextColor()` from `color-picker/color_utils.ts` — WCAG luminance-based text color selection

## Components to Adopt

shadcn-svelte or Bits UI components to install if needed:

- **ContextMenu** from bits-ui — WAI-ARIA menu pattern with focus trapping, submenus, and separators. Used for right-click actions and overflow (⋯) button menu

## Layout Constraints

- Grid layout: tree thumbnail (72px) | metadata (1fr)
- Card must work at widths from ~320px (single-column narrow) to ~600px (wide panel)
- **Responsive two-column layout**: `grid-template-columns: repeat(auto-fill, minmax(450px, 1fr))`. Cards have 450px minimum width; grid automatically drops to one column when viewport cannot fit two. In single-column mode, min-width does not apply — cards stretch to fill. All badges and buttons must remain visible and clickable at narrow widths
- **Row-major ordering**: Items flow left→right, then next row (1,2 / 3,4 / 5,6). This is CSS Grid's default `grid-auto-flow: row`. Matches file manager conventions (Windows Explorer, macOS Finder) and ensures sort order reads naturally. Shift+click range selection follows this visual order
- **Badge layout**: Branch name + state badges share one row (left-aligned branch, right-aligned state badges). When card is too narrow and elements would collide, right-aligned badges wrap to a second line (still right-aligned), expanding card height. Never overlap
- Dark theme primary, light theme supported (ring colors adjust per mode)

## Batch Selection State

Issue cards support multi-selection for batch operations. The selection system is two-way bound with the forest view — selecting a tree selects its card and vice versa.

### Terminology

- **Active** = single-click on a card/tree → inspects in bottom panel (one at a time)
- **Selected** = batch selection via Ctrl+click, Shift+click, right-click menu, or long press → for bulk operations (multiple allowed)

### Selection Triggers

- **Right-click context menu**: "Select" as first item in the new bits-ui context menu (see Context Menu section above)
- **Long press** (mobile/touch, 500ms): enters selection mode (Android planned via Tauri v2)
- **Ctrl+click**: toggle individual card selection
- **Shift+click**: range select — flat visual order, crosses parent/child boundaries
- **Ctrl+A**: select all available issues regardless of scroll position
- **Escape**: deselect all

### Selection Visual States

All interactive states must be **clearly distinguishable from each other** at a glance. No checkboxes on cards — selection is indicated entirely through ring/glow treatment. All states use **uniform `ring-2` thickness** (except selection-ready `ring-1`), differentiated by **color alone**. No halo shadows. Ring colors match forest glow colors exactly for two-way visual consistency.

**Visual hierarchy (from least to most prominent):**

1. **Default (resting)**: 1px border `var(--border)`, subtle shadow. No ring
2. **Hover**: `ring-2` yellow `#ffd700` (dark mode) / amber `#d4a017` (light mode). Background subtly brightens (`color-mix(in oklch, var(--ic) 6%, var(--surface))`). Forest glow: yellow `#ffd700`
3. **Active** (single-click inspect, one at a time): `ring-2` green `#22c55e` (dark mode) / lighter green `#4ade80` (light mode). Forest glow: green `#22c55e`
4. **Selected** (batch-selected, multiple): `ring-2` blue `#4a9eff` (dark mode) / mid blue `#3b82f6` (light mode) + subtle body tint. NO checkbox — ring is the sole indicator. Forest glow: blue `#4a9eff`
5. **Selection-ready** (Ctrl/Shift held): `ring-1` blue `#4a9eff` — same color as selected but thinner ring, less intense glow. Cursor remains `pointer`. Card-level hover suppresses element-level interactions (Shift+click on PR badge selects card, not badge). Forest glow: blue `#4a9eff` at reduced intensity

**Key distinction rules:**

- All states distinguished by color alone — no halo vs ring shape differences needed
- Hover = yellow ring (warm, attention-drawing)
- Active = green ring (nature/growth metaphor, "inspecting this one")
- Selected = blue ring (cool, systematic, "batch operation")
- Selection-ready = blue ring but thinner (preview of selected state)

- **Select All checkbox**: tri-state checkbox at top of card list (all checked / some checked / none). Same row as the persistent action toolbar
- **Shift-deselect**: Windows Explorer pattern — range vs individually-selected items tracked separately. Shift+clicking to a shorter range deselects items outside the new range while preserving Ctrl+clicked items

### Batch Action Toolbar (always-visible persistent bar)

The toolbar is **always visible** with consistent height — no layout shift between states.

**Default state (no selection):** Sort | Filter | Clean Up Worktrees

**Selected state:** Select All checkbox (tri-state) | "N selected" count | batch actions | Deselect All (×)

Batch actions:

- **Archive** / **Unarchive** — context-aware: if both active and archived issues are selected, both buttons show. Archive only affects active issues, Unarchive only affects archived.
- **Delete** — with confirmation
- **Change Priority** — submenu
- **"Clean Selected Worktrees"** — replaces "Clean Up Worktrees" label when selection active. Opens prune dialog filtered to selected issues with safety categorization. All worktree cleanup actions show a confirmation dialog.

Unavailable actions (no selected issues support it) are disabled with a tooltip. Partially applicable actions show an info tooltip ("affects 2 of 5 selected").

**NOT a batch action**: Change Color — colors are intentionally distinct per issue.

### Selection Lifecycle

- Clears on any tab change (not just Issues → Kanban)
- Clears on Escape
- Clears when clicking empty space in the grid (deactivates active card too)
- Does NOT clear after batch action completes (deleted/archived items are removed from the selection set, remaining selection persists)
- Normal click (no modifier) clears batch selection and activates the clicked card
- Clicking an already-active card does NOT deactivate it (no toggle-off) — still navigates to Issue Detail
- Clicking an active card when already on the Issue Detail tab is a no-op

## States to Show on Design Page

The design page must show all of these states:

- Default resting state (two-column grid, multiple cards)
- Hover state (yellow ring + background brighten)
- Active state (green ring)
- Selected/multi-selected state (blue ring + body tint, NO checkbox)
- Selection-ready hover (violet border/shadow, Ctrl/Shift held)
- Dragging state (rotation + lifted shadow)
- Loading state (shimmer overlay)
- Archived state (grayscale overlay)
- Error state (red indicators)
- Disabled state (faded, no pointer events)
- No-worktree state (quick-action buttons disabled, seed stage tree)
- Context menu open state (single-card actions — full menu rendered inline on page)
- Context menu open state (batch actions — "Archive 3 selected", etc.)
- Multi-selection with action bar (NO checkboxes on cards)
- Mixed light + dark header colors in two-column grid

## Visual References

- Current artboard: `artboards-issue.jsx` — the `IssueCard` component (92px tree | metadata grid). This is the starting point, not a constraint
- Forest Moss palette: deep greens, bark browns, amber accents — see `tokens.css`
- Status colors: success (green), warning (amber), danger (red), info (blue)
- Monospace font for issue numbers, branch names, code references
- Compact, information-dense layout (developer tool, not consumer app)
- Color contrast utility: `getContrastTextColor()` from `color-picker/color_utils.ts` — already handles WCAG luminance thresholds

## UI Freedom

Areas where the designer has creative latitude:

- **Exact badge spacing and alignment** — layout constraints are specified, but micro-spacing adjustments are at designer's discretion
- **Card shadow depth and layers** — subtle elevation effects, hover lift amount
- **Transition timing and easing** — smooth state changes (hover, selection, expansion)
- **Tree thumbnail background treatment** — solid color, gradient, or transparent behind the tree component
- **Header texture or subtle patterns** — vivid color headers could have subtle grain or noise overlay (must maintain WCAG contrast)
- **Ring animation on selection** — pulse effect, fade-in timing
- **Loading shimmer style** — skeleton animation pattern and speed
- **Collapsed vs expanded animation** — slide, fade, or height transition curve

## Not Included in This Design

- Tree lifecycle legend (separate artboard, already designed)
- Tree accessories/overlays (watering can, storm cloud, etc. — these render on forest trees, not card thumbnails)
- Kanban board layout (separate design brief)
- Issue creation wizard
- Issue detail/edit modal
- Color picker component (already designed and implemented)
