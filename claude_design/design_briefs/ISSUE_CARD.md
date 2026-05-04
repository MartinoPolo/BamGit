# Issue Card — Design Spec

Design spec for the primary issue representation used throughout Grovekeeper. Issue cards appear in the bottom panel Issues tab, Kanban views, and wherever issues are listed. This is a redesign — the current implementation is a placeholder. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

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
3. **Open Editor** — VS Code icon, opens editor at worktree path

**Disabled state**: When no folder/worktree is assigned, all three buttons are visually disabled (reduced opacity, no pointer events, muted color). The buttons remain in place to prevent layout shift.

Button style: small icon-only buttons (~18-20px), subtle background matching the header color treatment (semi-transparent backdrop like the priority chip). On dark-text headers use `rgba(0,0,0,0.12)`, on light-text headers use `rgba(255,255,255,0.15)`.

### Metadata (right side of card body)

- **Branch name**: monospace, muted, small — may be absent (no worktree yet)
- **Priority badge**: color-coded text badge (Critical/red, High/orange, Medium/hidden, Low/blue, None/hidden). Visibility controlled by a per-workspace setting
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

### Context Menu (right-click)

Built with bits-ui `ContextMenu` (WAI-ARIA menu pattern, focus trapping, submenus, separators). Two trigger mechanisms: right-click on card, or click the overflow (⋯) button (same component, programmatic open).

**Menu structure:**
1. **Select / Deselect** — top item, separator below (mode-switching action)
2. Edit
3. Rename (standalone issues only)
4. Priority ▸ (submenu: lowest, low, medium, high, highest)
5. Change Color (inline ColorPicker)
6. Separator
7. Setup Worktree / Remove Worktree (conditional on worktree state)
8. Archive / Unarchive (conditional on archived state)
9. Delete (destructive, red text)

**Batch context menu** (right-clicking a batch-selected card): shows batch actions — "Archive N selected", "Delete N selected", etc. Right-clicking an unselected card clears the batch selection, activates that card, and shows single-card actions (file manager pattern: Windows Explorer, macOS Finder, VS Code).

### Action Buttons (hover-revealed)

- Appear on hover over the card (opacity transition)
- Default set: Execute, Review, Check & Fix (configurable per-workspace)
- Overflow (⋯) button opens the same bits-ui context menu programmatically (single menu implementation, two triggers — right-click for desktop power users, button for touch/accessibility)

### Notification Indicator

- Optional pulsing dot in the tree thumbnail area
- Color indicates type: session running (green pulse), needs input (amber pulse), errored (red pulse)

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

## Layout Constraints

- Grid layout: tree thumbnail (72px) | metadata (1fr)
- Card must work at widths from ~320px (narrow panel) to ~600px (wide panel)
- **Two-column layout**: Cards display in a 2-column CSS grid (`grid-template-columns: repeat(2, 1fr)`) with 8px gap
- **Row-major ordering**: Items flow left→right, then next row (1,2 / 3,4 / 5,6). This is CSS Grid's default `grid-auto-flow: row`. Matches file manager conventions (Windows Explorer, macOS Finder) and ensures sort order reads naturally. Shift+click range selection follows this visual order
- Dark theme primary (light theme support later)

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

All interactive states must be **clearly distinguishable from each other** at a glance. No checkboxes on cards — selection is indicated entirely through border/shadow/glow treatment.

**Visual hierarchy (from least to most prominent):**

1. **Default (resting)**: 1px border `var(--border)`, subtle shadow. No special treatment
2. **Hover**: border tints toward issue color, shadow lifts to `shadow-md`, **background subtly brightens** (e.g., `color-mix(in oklch, var(--ic) 6%, var(--surface))`). Must be clearly visible — not just a minor border tweak
3. **Active** (single-click inspect, one at a time): **glow shadow** using `var(--ring)` color (blue). Ring: `0 0 0 3px` + outer glow `0 0 12px` at 25% opacity. Clearly distinct from hover — the glow is the differentiator
4. **Selected** (batch-selected, multiple): primary-color ring `0 0 0 3px` using `var(--primary)` (moss green) + subtle body tint. NO checkbox — border+ring is the sole indicator. Distinct from active by color (green vs blue)
5. **Selection-ready hover** (Ctrl/Shift held + hovering): violet (`#c084fc`) border + shadow treatment. Clearly distinct from normal hover. Cursor remains `pointer`. Card-level hover suppresses element-level interactions (Shift+click on PR badge selects card, not badge)

**Key distinction rules:**
- Hover = shadow lift + background brighten (no ring)
- Active = blue glow ring + outer glow halo
- Selected = green/primary ring + body tint (no outer glow halo — different shape from active)
- The active glow halo (blurred, extends outward) vs selected ring (sharp, tight) creates a clear visual distinction even without color perception

- **Select All checkbox**: tri-state checkbox at top of card list (all checked / some checked / none). Same row as the action toolbar. Replaces dedicated Select All / Deselect All buttons.
- Uses hot pink (`#ec4899`) glow on the corresponding forest tree. Selection state is visually distinct from the blue "active" glow.

### Batch Action Toolbar

When items are selected, additional action buttons appear in the persistent toolbar (same row as the "Clean up worktrees" button):

- **"N selected"** label showing count
- **Archive** / **Unarchive** — context-aware: if both active and archived issues are selected, both buttons show. Archive only affects active issues, Unarchive only affects archived.
- **Delete** — with confirmation
- **Change Priority** — submenu
- **"Prune selected worktrees"** — replaces "Clean up worktrees" label when selection active. Opens prune dialog filtered to selected issues with safety categorization.

Unavailable actions (no selected issues support it) are disabled with a tooltip. Partially applicable actions show an info tooltip ("affects 2 of 5 selected").

**NOT a batch action**: Change Color — colors are intentionally distinct per issue.

### Selection Lifecycle

- Clears on any tab change (not just Issues → Kanban)
- Clears on Escape
- Does NOT clear after batch action completes (deleted/archived items are removed from the selection set, remaining selection persists)
- Normal click (no modifier) clears batch selection and activates the clicked card

## States to Show on Design Page

The design page must show all of these states:

- Default resting state (two-column grid, multiple cards)
- Hover state (visible background brighten + shadow lift + action buttons revealed)
- Active state (blue glow ring + outer glow halo)
- Selected/multi-selected state (green/primary ring + body tint, NO checkbox)
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

## Not Included in This Design

- Tree lifecycle legend (separate artboard, already designed)
- Tree accessories/overlays (watering can, storm cloud, etc. — these render on forest trees, not card thumbnails)
- Kanban board layout (separate design brief)
- Issue creation wizard
- Issue detail/edit modal
- Color picker component (already designed and implemented)
