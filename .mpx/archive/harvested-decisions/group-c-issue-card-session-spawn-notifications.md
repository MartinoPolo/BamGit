# Group C: Issue Card Improvements, Session Spawn Dialog, Notifications

Extracted from sessions: 2026-05-07 to 2026-05-08. Source sessions:

- `3bad3268` (412KB, 2026-05-07) — issue card improvements
- `a4a85bce` (905KB, 2026-05-08) — notifications & sounds PRD #95
- `e8c3b48b` (515KB, 2026-05-08) — session spawn dialog

---

## Session 1: Issue Card Improvements (3bad3268)

- **Topic**: WorktreeStateIcon circle in issue card
  **Question**: Is the circle icon next to the branch name useful, or does it duplicate the worktree badge?
  **Answer**: Remove from IssueCard — it duplicates the worktree badge.
  **Category**: UI-Design

- **Topic**: Expand/collapse on issue cards
  **Question**: Should expand/collapse be kept, removed, or reworked?
  **Answer**: Remove entirely — delete the logic, persisted store, progress indicator, and `forceExpanded` prop.
  **Category**: UI-Design

- **Topic**: Selection background color
  **Question**: Should batch selection use a more blueish color instead of `--primary` (moss green)?
  **Answer**: Dropped — fine as-is.
  **Category**: UI-Design

- **Topic**: Shift-click selection behavior
  **Question**: Should Shift+click on an already-selected card toggle (deselect) it on repeated clicks?
  **Answer**: OS-standard Windows Explorer model. Shift+click always replaces the anchor→target range. Ctrl+click for individual toggle.
  **Category**: UI-Design

- **Topic**: PRD number display in issue card header
  **Question**: Should the PRD number appear before the issue number in the top-left corner?
  **Answer**: Yes — format `PRD#XX / #YY` when parent issue has `prd` label. PRD# portion is clickable.
  **Category**: UI-Design

- **Topic**: Issue card click behavior
  **Question**: Clicking issue card title vs. body — what action does each trigger?
  **Answer**: Title click = activate (switches bottom panel to detail tab). Body click = select only. 5-state visual system.
  **Rationale**: Title-only navigation removes ambiguity.
  **Category**: UI-Design

- **Topic**: Tauri-only actions in browser mode
  **Question**: What should happen when Tauri-only actions are invoked in browser mode?
  **Answer**: Create `$lib/opener.ts` wrapper. Show "Desktop app required" toast notifications.
  **Category**: Platform

- **Topic**: VS Code icon in issue cards
  **Question**: Which SVG to use for the VS Code icon?
  **Answer**: Replace current SVG with one from the Obsidian plugin.
  **Category**: UI-Design

- **Topic**: Label tooltips on issue card badges
  **Question**: Should label badges show tooltips?
  **Answer**: Remove tooltips from label badges only; keep all other tooltips.
  **Category**: UI-Design

- **Topic**: Tree thumbnail in issue card
  **Question**: The preview shows entire 500×500 viewBox including empty space. How to improve visibility?
  **Answer**: Increase height from 72px to 100px. CSS zoom-crop: show top 30%, trim 15% from each side. Scale bump seed and sprouting stages in the library.
  **Category**: UI-Design

---

## Session 2: Notifications & Sounds PRD #95 (a4a85bce)

- **Topic**: Sound format support
  **Question**: WAV only, or also OGG/MP3?
  **Answer**: WAV + OGG. WAV for bundled (lossless, tiny clips). OGG for user packs (smaller, royalty-free). Skip MP3.
  **Category**: Platform

- **Topic**: CESP manifest compatibility
  **Question**: Extend CESP v1.0 or just consume it?
  **Answer**: Full CESP v1.0 read support. Do not extend. Grovekeeper-native packs use `grovekeeper.json` with all 15 events.
  **Category**: Platform

- **Topic**: Event importance tiers
  **Question**: Which events are Critical vs. Important vs. Normal?
  **Answer**: Critical (never debounced, ON): needs-input, session.end. Important (ON, debounce-able): error, conflict, pr.ready, resource.limit. Normal (OFF): all others.
  **Category**: Data-State

- **Topic**: Notification grouping/batching
  **Question**: Batch rapid events?
  **Answer**: Per-session debounce only — no full batching. 2000ms window per event type per session. Critical never debounced.
  **Category**: Data-State

- **Topic**: Window flash behavior
  **Question**: Flash until focused, or flash N times?
  **Answer**: Keep existing. Critical = flash until focused. Informational = flash briefly.
  **Category**: Platform

- **Topic**: Volume control layers
  **Question**: Global only, or per-sound override? Manifest volume?
  **Answer**: Two layers: global (0.0–1.0 in DB) × per-sound user override. No manifest layer.
  **Category**: Data-State

- **Topic**: Character pack system — scope
  **Question**: Per-issue or per-session?
  **Answer**: Per-issue. Sessions without a Grovekeeper issue get no character (default pack, no persona).
  **Category**: Data-State

- **Topic**: Character assignment mechanism
  **Question**: Random, round-robin, user picks, or auto-random with override?
  **Answer**: Auto-random with manual override. Random from enabled pool; spawn dialog has optional character picker; issue card context menu allows reassignment.
  **Category**: UI-Design

- **Topic**: Character identity in UI
  **Question**: Purely audible, or show name + avatar?
  **Answer**: Show icon (avatar) on issue card + name in character select context menu.
  **Category**: UI-Design

- **Topic**: Issue card avatar placement and click behavior
  **Question**: Where on the card? What do left/right-click do?
  **Answer**: Bottom-right corner, same rounding as icon-only buttons. Left-click = mute toggle. Right-click = character dropdown + "Play random sound" + "Mute" toggle.
  **Category**: UI-Design

- **Topic**: Sound playback queue collision handling
  **Question**: Wait-for-finish, overlap, or capped?
  **Answer**: Wait-for-finish with cap of 5. Overflow → single "multiple sessions finished" summary sound.
  **Category**: Data-State

- **Topic**: Debounce scope
  **Question**: Global per event type or per-session?
  **Answer**: Per-session. Distinct sessions both play. Debounce only suppresses rapid-fire from same session.
  **Category**: Data-State

- **Topic**: Default debounced events
  **Question**: Which events get debounced by default?
  **Answer**: task.acknowledge (2s), task.complete (2s), branch.behind-base (30s), pr.review-requested (5s). All others: no debounce.
  **Category**: Data-State

- **Topic**: Active sound event set
  **Question**: Which events have sound enabled by default?
  **Answer**: Only errors, conflicts, resource limits, needs-input, session end, PR ready. All others muted by default.
  **Category**: UI-Design

---

## Session 3: Session Spawn Dialog (e8c3b48b)

- **Topic**: Session spawn dialog entry points
  **Question**: Same dialog everywhere, or streamlined variants?
  **Answer**: Same dialog, pre-populated differently based on context. Forest right-click auto-attaches issue + worktree. Sessions page opens blank.
  **Category**: UI-Design

- **Topic**: Prompt suggestions / skill chips
  **Question**: Predefined prompts as action chips, dropdown, or smart contextual suggestions?
  **Answer**: Smart contextual suggestions shown as 3-4 action chips ordered by issue state. First chip = most likely action. Plus "+" button for dropdown of all skills.
  **Category**: UI-Design

- **Topic**: Prompt field — action chips vs. unified textarea
  **Question**: Separate inputs or single field?
  **Answer**: Single unified prompt field. Chips are shortcuts that populate it. User sees exactly what will be sent.
  **Category**: UI-Design

- **Topic**: Which action types open the spawn dialog
  **Question**: Only `agent` actions, or also `deterministic` and `ui`?
  **Answer**: Only `agent` type. `deterministic` actions execute directly (with confirm toast). `ui` actions navigate.
  **Category**: Workflow

- **Topic**: Prompt chaining depth
  **Question**: Limited to 2 steps or unlimited?
  **Answer**: Unlimited — agents handle conflicts.
  **Category**: UI-Design

- **Topic**: Prompt chaining intelligence
  **Question**: Hardcoded `afterAction` map or simulate expected post-execution state?
  **Answer**: Simulation state via `deriveContextualActions()`.
  **Category**: Data-State

- **Topic**: Session dialog pre-fill from issue card action
  **Question**: Which fields pre-filled?
  **Answer**: Prompt (resolved action command), context (linked issue auto-checked), worktree (issue's active worktree). Provider/model/permissions from settings (workspace overrides user).
  **Category**: Data-State

- **Topic**: Session result placement in bottom panel
  **Question**: Where should a newly spawned session appear?
  **Answer**: Bottom panel split in half — issues tab on left, session on right.
  **Category**: UI-Design

- **Topic**: Worktree creation in spawn dialog
  **Question**: Inline expansion, nested mini-wizard, or pre-check callout?
  **Answer**: Pre-check flow. Yellow callout with "Create with defaults" (one click) + "Advanced" expander. Spawning without worktree allowed but shows warning.
  **Category**: UI-Design

- **Topic**: Context auto-suggestion display
  **Question**: Full context visible, or badge indicators?
  **Answer**: Badge indicators with expandable preview. Format: "Context: Issue #172 ✓ | PR #245 ✓ | Git status ✓"
  **Category**: UI-Design

- **Topic**: Parent PRD context auto-inclusion
  **Question**: Auto-include parent PRD context?
  **Answer**: OFF by default, toggle-able. If enabled, only first ~500 chars.
  **Category**: Data-State

- **Topic**: Resume session UX
  **Question**: Auto-detect resumable sessions?
  **Answer**: Yes — show resumable sessions prominently at top as primary action. "Start new session" as secondary.
  **Category**: UI-Design
