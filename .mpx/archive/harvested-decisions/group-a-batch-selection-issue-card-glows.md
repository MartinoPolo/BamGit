# Group A: Batch Selection, Issue Card Design, Ring/Glow System

Extracted from sessions: 2026-05-04 to 2026-05-06. Source sessions:

- `51e46258` (5MB, 2026-05-04) — bulk selection feature grill
- `0e291b79` (454KB, 2026-05-04) — issue card design fixes
- `f805ec78` (1MB, 2026-05-06) — ring/glow system + color palette

---

## Session 1: Bulk Selection Feature (51e46258)

- **Topic:** Bulk selection — scope of batch actions
  **Question:** Do you want batch operations only for prune, or for other actions too (archive, delete, change priority, change color)?
  **Answer:** Archive, delete, change priority. NOT change color — color should be very distinct between issues.
  **Rationale:** Color is a core identity marker; bulk-changing it doesn't make sense.
  **Category:** UI-Design

- **Topic:** Bulk selection — selection UX trigger (desktop)
  **Question:** Which UX pattern for entering selection mode — always-visible checkbox, selection mode toggle, Ctrl/Shift-click only, or right-click/long-press?
  **Answer:** Right-click "Select" on desktop. No always-visible checkbox (wastes space, low-frequency feature). Optional selection-mode toggle next to prune button if needed, styled as a low-prominence "gold button."
  **Rationale:** Checkbox adds visual noise. Right-click is natural and discoverable without cluttering the default view.
  **Category:** UI-Design

- **Topic:** Bulk selection — selection UX trigger (mobile)
  **Question:** Long press on mobile?
  **Answer:** Yes, long press (500ms) on mobile.
  **Rationale:** No dragging planned, so long press is safe to use for selection.
  **Category:** UI-Design

- **Topic:** Bulk selection — keyboard modifier behavior
  **Question:** Ctrl+click vs Shift+click — deviate from desktop standard?
  **Answer:** No deviation. Ctrl+click = toggle individual, Shift+click = range select.
  **Category:** UI-Design

- **Topic:** Bulk selection — selection-ready hover visual
  **Question:** When Ctrl/Shift held + hovering a card, what visual hint?
  **Answer:** Clearly visible border change or shadow — not subtle. Must distinguish from normal hover. Modifier key overrides all card element actions (e.g., Shift-clicking a PR badge selects the card, not triggers the badge). Cursor stays `pointer` (no crosshair).
  **Rationale:** Selection is a significant mode change; it needs to be clearly visible.
  **Category:** UI-Design

- **Topic:** Bulk selection — action bar placement
  **Question:** Floating bar at bottom, or persistent toolbar?
  **Answer:** Persistent bar (where the prune button already lives). Additional contextual buttons appear in that bar when selection is active. Non-jumping UI is the priority.
  **Rationale:** Avoids layout shift and buttons overlapping content.
  **Category:** UI-Design

- **Topic:** Bulk selection — prune button label
  **Question:** What should the prune button say?
  **Answer:** Default: "Clean up worktrees". When selection active: "Prune selected worktrees."
  **Category:** UI-Design

- **Topic:** Bulk selection — archived issue selectability
  **Question:** Can archived issues be selected?
  **Answer:** Yes, if displayed alongside normal issues. Actions are context-aware: both Archive and Unarchive appear when mixed types are selected; each action only affects the applicable issues.
  **Category:** UI-Design

- **Topic:** Bulk selection — forest view multi-select
  **Question:** Should trees in the forest also support multi-select?
  **Answer:** Yes — full two-way compatibility. Trees support right-click context menu with "Select", Ctrl/Shift+click, and selection-ready glow when modifier held. Selection state is two-way bound between cards and trees.
  **Rationale:** The whole point of two-way binding is consistent control of the same state from either surface.
  **Category:** UI-Design

- **Topic:** Bulk selection — selection lifecycle/persistence
  **Question:** When does selection clear?
  **Answer:** Clears on tab change and on Escape key. Does NOT clear after a batch action completes (stays selected after e.g. archive).
  **Category:** UI-Design

- **Topic:** Bulk selection — Select All / Deselect All
  **Question:** Add Select All? As buttons or a checkbox?
  **Answer:** Tri-state checkbox (like Dropbox/file managers) at the top of the list. Checked = all selected, indeterminate = some selected, unchecked = none. Ctrl+A = Select All, Escape = Deselect All.
  **Category:** UI-Design

- **Topic:** Bulk selection — selection count display
  **Question:** Show "N selected" label in action bar?
  **Answer:** Yes, show count between selection controls and action buttons.
  **Category:** UI-Design

- **Topic:** Bulk selection — prune dialog behavior with selection
  **Question:** When "Prune selected worktrees" clicked — immediate or open dialog?
  **Answer:** Open `PruneWorktreesDialog` pre-filtered to selected issues (consistent with existing UX, confirmation maintained).
  **Category:** UI-Design

- **Topic:** Bulk selection — unavailable action display
  **Question:** Should unavailable batch actions be hidden or disabled?
  **Answer:** Disabled with count tooltip (e.g., "2 of 5 selected have worktrees") — more transparent than hiding.
  **Category:** UI-Design

- **Topic:** Bulk selection — prune safety categories
  **Question:** How to categorize worktrees in the selection-aware prune dialog?
  **Answer:** 4 categories: safe / risky / dangerous / no-worktree. Only safe items pre-selected. Risky and dangerous still listed but unchecked by default — user can opt in and confirm.
  **Category:** UI-Design

- **Topic:** Terminology — active vs selected
  **Question:** What to call single-click (inspect) state vs batch selection state?
  **Answer:** "Active" = single-click inspect (one at a time, shows bottom panel). "Selected" = batch selection for bulk ops. These are distinct states — batch-selecting a single issue is still "selected" not "active." Activating an issue clears all batch selection.
  **Rationale:** Avoids confusion between the two interaction modes across cards and trees.
  **Category:** Domain-Language

- **Topic:** Glow colors — selection-ready hover (cards + trees)
  **Question:** What glow color for selection-ready hover state (Ctrl/Shift held + hovering)?
  **Answer:** Violet `#c084fc` — warm purple, clearly distinct from yellow (normal hover) and blue (active). Must be different from the batch-selected color.
  **Rationale:** User is not good at distinguishing green and blue; avoided blue-green spectrum additions.
  **Category:** UI-Design

- **Topic:** Glow colors — batch-selected state (cards + trees)
  **Question:** What glow color for batch-selected state?
  **Answer:** Hot pink `#ec4899` — completely distinct from violet and all existing glows.
  **Category:** UI-Design

- **Topic:** Glow colors — two-way binding between cards and trees
  **Question:** Should the selection-ready and batch-selected glows be identical between cards and trees?
  **Answer:** Yes — exact same colors, two-way bound. When hovering a card with modifier held, the corresponding tree changes glow simultaneously, and vice versa.
  **Category:** UI-Design

---

## Session 2: Issue Card Design Fixes (0e291b79)

- **Topic:** Issue card — selection checkboxes
  **Question:** Remove checkboxes from multi-select state?
  **Answer:** Yes — selection indicated ONLY through border/shadow/glow. No checkboxes anywhere. They overlapped priority badges.
  **Category:** UI-Design

- **Topic:** Issue card — selected state visibility
  **Question:** Make selected border/shadow 1.5x more visible?
  **Answer:** Yes.
  **Category:** UI-Design

- **Topic:** Issue card — active vs selected state differentiation
  **Question:** Active state needs to be clearly distinct from selected state.
  **Answer:** Active gets diffuse outer glow halo (2x more visible than current). Selected gets sharp ring without halo — the presence/absence of halo is the key differentiator.
  **Category:** UI-Design

- **Topic:** Issue card — hover state visibility
  **Question:** Hover is not visible enough — improve it.
  **Answer:** Hover should be clearly visible (similar prominence to active/selected). Hierarchy: Default < Hover < Selected < Active.
  **Category:** UI-Design

- **Topic:** Issue card — quick-action buttons in header
  **Question:** Add buttons for folder, terminal, VS Code?
  **Answer:** Yes — three icon-only buttons in the RIGHT side of the card header. Disabled (dimmed) state when no worktree folder assigned.
  **Category:** UI-Design

- **Topic:** Issue card — header title link
  **Question:** Should the issue header name link to GitHub?
  **Answer:** Yes — issue number/title is a link to GitHub when an issue is linked.
  **Category:** UI-Design

- **Topic:** Issue card — two-column grid ordering
  **Question:** When displaying cards in 2-column grid, row-major (1,2 / 3,4) or column-major (1,3,5 / 2,4,6)?
  **Answer:** Row-major (left-to-right, then next row). This is the natural reading order and what CSS Grid defaults to.
  **Rationale:** Column-major only makes sense for categorical columns (Kanban). For a sorted flat list, row-major matches desktop conventions (Windows Explorer, macOS Finder) and makes Shift+click range selection intuitive.
  **Category:** UI-Design

- **Topic:** Issue card — context menu
  **Question:** Show context menu design on the HTML design page?
  **Answer:** Yes — add context menu visualization to the design.
  **Category:** UI-Design

---

## Session 3: Ring/Glow System + Color Palette (f805ec78)

- **Topic:** Issue card rings — fixed color vs issue color
  **Question:** Do you want hover and active rings to use the issue's own color instead of fixed yellow/green?
  **Answer:** Yes — switch to issue-color rings for hover and active. State differentiation via thickness and glow behavior, not color.
    - Hover: 2px sharp ring in issue color, no glow
    - Active: 3px ring + soft 14px outer glow in issue color
    - Selected (batch): stays `--primary` moss green (system-level, not issue-specific)
      **Rationale:** Issue-color rings create much stronger visual identity per card.
      **Category:** UI-Design

- **Topic:** Forest/card two-way binding — ring colors
  **Question:** Should tree glows also switch to issue colors (or keep fixed palette)?
  **Answer:** Yes — trees also use issue color for hover and active glows. Same issue color in both creates the strongest visual link for two-way binding.
  **Category:** UI-Design

- **Topic:** Issue card rings — hover vs active differentiation without color difference
  **Question:** With same hue for hover and active, how to differentiate?
  **Answer:** By weight and glow. Hover = 2px sharp ring, subtle background tint, no glow ("looking at"). Active = 3px ring + 14px blurred glow + background tint ("working on"). Glow is the key differentiator.
  **Category:** UI-Design

- **Topic:** Issue card — hover background tint
  **Question:** Confirm hover background tint of 6% issue color mix? Apply to active state too?
  **Answer:** Yes, both hover and active get `color-mix(in oklch, var(--ic) 6%, var(--surface))` background tint.
  **Category:** UI-Design

- **Topic:** Issue card — batch selection ring color
  **Question:** Selected (batch) state — `--primary` moss green or blue `#4a9eff`? (Three different answers existed in requirements, design, and CSS.)
  **Answer:** Use `--primary` (moss green), matching the design. Batch selection is a system-level action, not issue-specific. Avoids collision with blue issue colors.
  **Category:** UI-Design

- **Topic:** Issue card — ring implementation (box-shadow vs Tailwind ring utility)
  **Question:** Switch from Tailwind `ring-*` utility to `box-shadow`?
  **Answer:** Yes — switch to `box-shadow` for all card state rings. Enables blur/glow (14px outer glow impossible with Tailwind ring), composable layers, matches forest view glow rendering. Remove `--ring-hover`, `--ring-active`, `--ring-selected` CSS tokens.
  **Category:** UI-Design

- **Topic:** Color palette — dark/light adaptation
  **Question:** Single palette or separate dark/light palettes? How to adapt colors per theme?
  **Answer:** Single 24-color `DEFAULT_COLOR_PALETTE`. Header band uses raw color directly (text auto-flips via WCAG luminance). Derived surfaces (rings, tints, tree thumbnails) adapt via `color-mix()` with theme-aware surface variables. `color-mix()` percentages adjust per theme.
  **Rationale:** Simpler to maintain one palette and derive theme variants from it.
  **Category:** UI-Design

- **Topic:** Forest view — `resolveGlowOverlay` alignment
  **Question:** Update `resolveGlowOverlay` to use issue color for hover/active instead of hardcoded hex?
  **Answer:** Yes — `resolveGlowOverlay` takes issue's `color` as input for hover and active overlays.
  **Category:** UI-Design

- **Topic:** Icon styling in quick-action buttons
  **Answer:** Thinner icons — `size=14, strokeWidth=1.5`.
  **Category:** UI-Design
