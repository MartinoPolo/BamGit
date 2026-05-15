# Group D: Issue Card UX, Batch Selection Details, Creation Wizard

Extracted from sessions: 2026-05-04 to 2026-05-05. Source sessions:

- `6941ea63` (558KB, 2026-05-04) — batch selection pre-implementation grill
- `1477f7ce` (1.4MB, 2026-05-05) — issue card UX/styling problems
- `6b7b1e3c` (889KB, 2026-05-05) — creation wizard UX polish
- `4da19219` (2MB, 2026-05-05) — post-merge feedback (some unresolved)

---

## Session 1: Batch Selection Pre-Implementation (6941ea63)

- **Topic**: ForestContextMenu migration
  **Question**: Should ForestContextMenu be migrated to bits-ui ContextMenu?
  **Answer**: Yes — migrate both forest and card context menus to bits-ui ContextMenu. Separate commit.
  **Category**: UI-Design

- **Topic**: Select/Deselect placement in context menu
  **Question**: Where should "Select/Deselect" appear?
  **Answer**: First item, with separator below. Mode-switching action, distinct from single-item operations.
  **Category**: UI-Design

- **Topic**: Context menu on batch-selected card
  **Question**: Show batch or single actions?
  **Answer**: Hybrid (file manager pattern). Right-clicking a batch-selected card shows batch actions. Right-clicking an unselected card clears batch, activates that card, shows single actions.
  **Category**: UI-Design

- **Topic**: Overflow button retention
  **Question**: What happens to the overflow (⋯) button with a proper context menu?
  **Answer**: Keep it — opens same bits-ui context menu programmatically. Single implementation, two triggers. Essential for touch and keyboard-only.
  **Category**: UI-Design

- **Topic**: Long press for mobile
  **Question**: Keep long press?
  **Answer**: Yes — Android planned via Tauri v2 mobile. Long press (500ms) enters selection mode.
  **Category**: Platform

- **Topic**: Range select ordering
  **Question**: Flat or hierarchical order?
  **Answer**: Flat visual order, crossing parent/child boundaries.
  **Category**: UI-Design

- **Topic**: Ctrl+A scope
  **Question**: Visible or all?
  **Answer**: All available issues regardless of scroll position.
  **Category**: Workflow

- **Topic**: Tab change clears selection
  **Question**: Which tabs clear selection?
  **Answer**: Any tab change clears selection.
  **Category**: Workflow

- **Topic**: After batch delete
  **Question**: Does selection persist?
  **Answer**: Deleted items removed from selection. Remaining selection persists.
  **Category**: Data-State

---

## Session 2: Issue Card UX/Styling Problems (1477f7ce)

- **Topic**: Card click state machine
  **Question**: What happens when clicking an already-active card?
  **Answer**: No toggle-off. Clicking active card when already on Issue Detail tab = no-op. Deactivation only via Escape or clicking empty space.
  **Rationale**: Rename "selection" → "activation" in code for single-issue inspect state.
  **Category**: UI-Design

- **Topic**: Circular checkmark element on cards
  **Question**: What is it?
  **Answer**: Remove it. Badge system will replace it.
  **Category**: UI-Design

- **Topic**: Shift-deselect behavior
  **Question**: Windows Explorer or simpler pattern?
  **Answer**: Windows Explorer pattern — track range-selected vs individually-selected (Ctrl+clicked) separately. Shift+click replaces range, preserves Ctrl+clicked items.
  **Category**: Workflow

- **Topic**: Badge layout rows
  **Question**: How should rows be organized?
  **Answer**: Three rows: (1) branch+worktree, (2) PR+issue badges, (3) GitHub labels.
  **Category**: UI-Design

- **Topic**: Badge styling variant system
  **Question**: What variant system?
  **Answer**: Match design spec exactly. Mini badge: 18px height, 4px radius, mono 10.5px, OKLCH color-mix. Pill variant for labels: 18px, 999px radius. Priority chip: 18px, bold uppercase.
  **Category**: UI-Design

- **Topic**: Action buttons on narrow cards
  **Question**: Always-visible?
  **Answer**: Defer contextual action states to separate issue. Make current buttons always-visible using icon-only below width threshold.
  **Category**: UI-Design

- **Topic**: Responsive grid
  **Question**: Card minimum width?
  **Answer**: 450px minimum. `auto-fill` with `minmax(450px, 1fr)`. No max-width cap.
  **Category**: UI-Design

- **Topic**: Forest glow ↔ card ring color alignment
  **Question**: Which colors?
  **Answer**: Complete color swap. All states use `ring-2` (except selection-ready `ring-1`). No halo shadows.
    - Hover: yellow `#ffd700` dark / amber `#d4a017` light
    - Active: green `#22c55e` dark / `#4ade80` light
    - Selected: blue `#4a9eff` dark / `#3b82f6` light
    - Selection-ready: blue `#4a9eff`, thinner, less intense

    **Note**: These colors were later superseded by the issue-color ring decision in Group A Session 3 (f805ec78). Active and hover now use the issue's own color. Selected stays `--primary` moss green.
    **Category**: UI-Design

- **Topic**: Selection-ready hover glow
  **Question**: Should selection-ready also glow?
  **Answer**: Yes — reduced intensity compared to selected. Both light and dark modes.
  **Category**: UI-Design

- **Topic**: Session state chip
  **Question**: Replace or complement the pulsing dot?
  **Answer**: Remove pulsing dot entirely. Replace with status chip in card header (bg-black/18 or bg-white/22 based on header luminance). States: EXECUTING (green), HITL (amber), REVIEW (purple), ERROR (red), PAUSED (gray), DONE (green dimmed), no-session (no chip).
  **Category**: UI-Design

- **Topic**: Context menu fixes
  **Question**: Priority submenu offset and Change Color swatch?
  **Answer**: Fix Priority offset via bits-ui `sideOffset`/alignment. Remove inline swatch from "Change Color" — clicking opens color picker popover separately.
  **Category**: UI-Design

- **Topic**: Toolbar merge
  **Question**: "Clean up worktrees" + selection bar — one or two bars?
  **Answer**: One persistent bar. Default: ghost style, "Clean up worktrees" alone. Selected: left = count badge, right = batch actions including "Clean selected worktrees". Consistent height prevents layout shift. Cleanup actions show confirmation dialog.
  **Category**: UI-Design

- **Topic**: Whole-card tooltip
  **Question**: Keep it?
  **Answer**: Remove `IssueCardTooltip` wrapper entirely. Keep individual button tooltips.
  **Category**: UI-Design

- **Topic**: VS Code icon source
  **Question**: Where to get it?
  **Answer**: Copy SVG from obsidian-tasks-dashboard-plugin. Future: icon changes based on editor selection (user setting).
  **Category**: UI-Design

- **Topic**: Folder/Terminal/VSCode button behavior when no folder
  **Question**: Behavior when no folder assigned?
  **Answer**: Ghost+disabled look but still clickable. Left-click → native file picker → assigns. Right-click (even when assigned) → file picker → reassigns. Tooltips: "Open [path]" when assigned, "Assign folder" when not. Reassignment is silent.
  **Category**: UI-Design

- **Topic**: Priority badge interaction
  **Question**: Is the badge interactive?
  **Answer**: Yes, clickable, spawns priority-changing menu. Remove "none" priority — "normal" is default and minimum.
  **Category**: UI-Design

---

## Session 3: Creation Wizard UX Polish (6b7b1e3c)

- **Topic**: Arrow nav in Step 1
  **Question**: Should filling search bar trigger a new search?
  **Answer**: Display only, no search trigger. Prevents flickering/loading.
  **Category**: UI-Design

- **Topic**: Typing after arrow-selecting
  **Question**: Does it reset?
  **Answer**: Yes — any typing clears arrow-selected state and resumes normal search.
  **Category**: UI-Design

- **Topic**: Step 4 swatch click
  **Question**: Instant create or advance to next step?
  **Answer**: Goes to next step (which is creation since step 4 is last). Principle: all click actions advance. Enter in hex input also creates.
  **Category**: Workflow

- **Topic**: Navigation hint styling
  **Question**: How to show in wizard footer?
  **Answer**: Ghost-style element with arrow key Kbd components, "Navigate" text. Centered. Two variants: ↑↓ for steps 1/3, ↑↓←→ for step 4.
  **Category**: UI-Design

- **Topic**: Issue number in generated name
  **Question**: Remove leading number?
  **Answer**: Yes — strip leading number from display name. Strip trailing special chars but not inline colons. Number stays in branch name.
  **Category**: Domain-Language

- **Topic**: Cancel/Back button + Escape key
  **Question**: Escape key conflict?
  **Answer**: Buttons always perform displayed action. On step 1, Cancel shows Escape hint. Pressing Escape with focused input in step 2 should go Back (not cancel wizard). Fix keyboard event propagation.
  **Category**: Workflow

- **Topic**: Selected issue row highlight color
  **Answer**: Uses `bg-primary-soft` — subtle green-tinted highlight from Forest Moss palette. Light: `oklch(0.92 0.03 135)` sage green. Dark: `oklch(0.305 0.045 145)` deep forest green.
  **Category**: UI-Design

- **Topic**: Step 3 choice card visual states
  **Answer**: Unselected (`border-border`, `bg-transparent`), Hover (`border-border`, `bg-surface-hover`), Selected Yes (`border-green-500` + `bg-green-500/10`), Selected No (`border-red-500` + `bg-red-500/10`).
  **Category**: UI-Design

---

## Session 4: Post-Merge Feedback (4da19219) — Some Unresolved

### Resolved decisions (from user's initial message):

- **Decision**: Remove checkbox from selection bar. Deselection via X button and Escape only.
  **Category**: UI-Design

- **Decision**: Issue cards should not be focusable. Remove focus ring — cards not in tab order.
  **Category**: UI-Design

- **Decision**: Remove selection-ready state from cards entirely. Drop ring-1 visual when modifier keys held. Surface the selection bar in highlighted state instead.
  **Category**: UI-Design

- **Decision**: Issue number in card header (`#42`) should be clickable link to GitHub issue.
  **Category**: UI-Design

- **Decision**: PR and issue badges on separate rows. Three rows: (1) worktree+branch, (2) PR+issue badges, (3) GitHub labels.
  **Category**: UI-Design

### Unresolved (recommended but user asked for handoff instead):

- **Q**: Toolbar ghost state — just "Clean Up Worktrees" alone, or include Sort/Filter?
  **Recommended**: Just "Clean Up Worktrees" alone.

- **Q**: Hover + Active coexistence — how should the ring behave?
  **Recommended**: Active card shows green ring always; hover only on non-active cards.

- **Q**: Back/forward navigation — full URL state, history-only, or defer?
  **Recommended**: Defer to separate issue.

- **Q**: Selection-ready replacement — what should the toolbar show when Ctrl/Shift held?
  **Recommended**: Subtle border/bg change on the ghost toolbar.

- **Q**: Accent color fix — add `--accent` overrides per theme, or eliminate `--accent`?
  **Recommended**: Add overrides to each `[data-accent]` block.
