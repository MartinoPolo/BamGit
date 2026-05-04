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

### Metadata (right side of card)

- **Issue name**: primary text, truncated with ellipsis if too long
- **GitHub issue number**: `#123` in monospace, small
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

- Grid layout: tree thumbnail (92px) | metadata (1fr) — or explore alternatives
- Card must work at widths from ~320px (narrow panel) to ~600px (wide panel)
- Multiple cards stack vertically with 4-8px gap
- Left border accent: 3px colored left border using priority color (optional — may conflict with the new color header approach, explore whether both are needed)
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

- **Selection-ready hover** (Ctrl/Shift held + hovering): visible border change and shadow — clearly distinct from normal hover. Uses violet (`#c084fc`) glow on the corresponding forest tree. Cursor remains `pointer`. When Ctrl/Shift is held, card-level hover effects suppress element-level interactions (e.g., Shift+click on a PR badge selects the card, not the badge).
- **Selected** (batch-selected): checkbox appears on left edge of card, card has a distinct highlight treatment. Uses hot pink (`#ec4899`) glow on the corresponding forest tree. Selection state is visually distinct from the blue "active" glow.
- **Select All checkbox**: tri-state checkbox at top of card list (all checked / some checked / none). Same row as the action toolbar. Replaces dedicated Select All / Deselect All buttons.

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

## States to Explore in Variants

For the initial three variants, show a list of 4-5 cards in the collapsed state with different issue colors (red, blue, green, purple, amber) to demonstrate color distinction. After variant selection, we will design:

- Collapsed state (default, multiple cards visible)
- Expanded state (single card opened)
- Hover state (action buttons revealed)
- Selection-ready hover state (Ctrl/Shift held, border/shadow change)
- Selected state (checkbox visible, highlight treatment)
- Archived state (grayscale overlay)
- Child/indented state (with connector lines)
- No-worktree state (seed stage — minimal metadata)
- Active session state (notification dot pulsing)
- Error state (red indicators)
- Narrow width (badges collapsed to icons)
- Context menu open state (single-card actions)
- Context menu open state (batch actions — "Archive 3 selected", etc.)

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
