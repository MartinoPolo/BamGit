# Session Chat View — Design Update Prompt

Use this prompt to update the Session Chat View HTML mockup (`Session Chat View.html` and its JSX files) to reflect the decisions from the 2026-05-06 grilling session. The canonical spec is `SESSION_CHAT_VIEW.md` in the same folder — it has already been updated. This prompt summarizes what needs to change in the design implementation.

---

## Changes Required

### 1. Sidebar collapse button — move to left

In `session-layout.jsx`, the `RightSidebar` header has the collapse button pushed to the far right via a `flex: 1` spacer. Move it to the **left** of the header row (remove the spacer before it, or move the spacer after it). The collapse button should be the first element in the header, closest to the content boundary. This applies to the expanded sidebar only — the collapsed sidebar button is already centered in its 44px strip.

### 2. Shared content column — constrain message stream to 900px

Wrap the message stream content inside the chat column in a centered container with `max-width: 900px` and `margin: 0 auto`. This ensures all content (assistant text, tool cards, sub-agent expansions, system messages) shares the same width constraint as the floating input panel. User message bubbles remain at 75% of this column. No content should extend wider than the input panel.

In `session-layout.jsx`, the `SessionPage` chat column currently has `padding: '16px 24px 140px'` with no max-width on content. Add an inner wrapper div around `{children || <SampleStream .../>}` with `maxWidth: 900, margin: '0 auto'`.

### 3. Gradient fade behind floating input

Add a gradient overlay at the bottom of the chat column that fades scrolling content before it reaches the floating input panel. Implementation: a pseudo-element or extra div at the bottom of the chat column, `position: sticky`, `bottom: 0`, `height: 120px`, `background: linear-gradient(transparent, var(--background))`, `pointer-events: none`, `z-index: 10` (below the floating input's z-index of 15).

### 4. Send button morph to Stop

The send button in `FloatingInput` should morph based on a new `isRunning` prop:

- **When not running (default):** Send icon, primary color (`gk-btn-primary`), shows `Enter` keyboard hint badge
- **When running:** Stop icon (square), danger color (`gk-btn-danger`), shows `Ctrl+C` keyboard hint badge

Add this to the canonical artboard (State01_Active where `state="running"`) and State02_NeedsInput. The transition is instant, no animation.

### 5. Remove Pause from overflow menu

In `session-layout.jsx`, the `OverflowMenu` component shows: Pause session, Stop session, Export chat, Restart, Delete session. Update to:

- Export chat (enabled)
- Restart (disabled, muted text, "coming soon" or similar)
- Delete session (disabled, danger color but muted, "coming soon")

Remove "Pause session" and "Stop session" entirely.

### 6. Component height consistency — eliminate all inline height overrides

This is the most impactful change. The design system defines three control sizes:

- `.gk-btn-sm` = 26px (`--size-control-sm`)
- `.gk-btn` = 32px (`--size-control-md`)
- `.gk-btn-lg` = 38px (`--size-control-lg`)
- `.gk-badge` = 20px
- `.gk-input` = 32px

**Remove ALL inline `height:` overrides** on buttons, badges, and inputs. Specific fixes:

**FloatingInput bottom controls row:**

- Remove `height: 24` from Attach, Tools, Local, Model dropdown, Approve each buttons
- Remove `height: 28, width: 28` from Send button
- All should inherit `.gk-btn-sm` height of 26px. Send is distinguished by `.gk-btn-primary` color only.

**FloatingInput skill chips:**

- Remove `height: 22` from all skill chip buttons and the "More" button
- Let them inherit `.gk-btn-sm` height of 26px

**TopBar badges:**

- Remove `height: 17` from `#90 open` and `PR #5 draft` badges
- Let them inherit `.gk-badge` height of 20px

**Sidebar collapse/expand buttons:**

- RightSidebar collapse button: remove `width: 24, height: 24` — let it inherit `.gk-btn-sm` 26px
- CollapsedSidebar expand button: remove `width: 28, height: 28` — let it inherit `.gk-btn-sm` 26px

**Sub-agents count badge:**

- Remove `height: 15` — let it inherit `.gk-badge` 20px

**Tool card headers:**

- In `session-shared.jsx`: change `ToolCardL1` header height from 34px to 36px
- `ToolCardL2` header height from 34px to 36px
- `ToolCardL3Perm`, `ToolCardL3Elicit`, `ToolCardL3Ask` headers are already 36px — no change needed

**ToolCardL3Elicit input:**

- Remove `height: 28` from the elicit input — let it inherit `.gk-input` 32px

**SubAgentExpansion Collapse button:**

- Remove `height: 20` — let it inherit `.gk-btn-sm` 26px

**SkillConfigPanel buttons:**

- Remove `height: 20` from "+ Add" and "+ Add path" buttons — let them inherit `.gk-btn-sm` 26px

**State09 Compact button:**

- Remove `height: 22` — let it inherit `.gk-btn-sm` 26px

**FloatingInput image "+ Add" button:**

- Remove `height: 28` — let it inherit `.gk-btn-sm` 26px

### 7. Content dimming with hover restore

In `session-shared.jsx` and `session-states.jsx`, older message turns are currently rendered with static `opacity: 0.4`. Add hover behavior:

- Wrap each old turn (user message + assistant response + tool cards) in a container div
- The container has `opacity: 0.4` and `transition: opacity 150ms ease-out`
- On hover (`:hover` or inline `onMouseEnter`/`onMouseLeave` since these are inline styles), restore to `opacity: 1`

This means dimmed content recedes visually but becomes fully readable on hover. The entire turn restores as a unit, not individual elements.

### 8. Session state badge — rename "Paused" to "Stopped"

In `session-shared.jsx`, the `SessionBadge` component maps session states to badge configs. Rename the `paused` key to `stopped` and update its label from "Paused" to "Stopped".

---

## Verification checklist

After applying all changes, verify across all 15 page-level state artboards:

- [ ] Sidebar collapse button is left-aligned in the expanded sidebar header
- [ ] All message content stays within the 900px column (no wider than the input panel)
- [ ] Gradient fade visible at the bottom of the chat column (subtle, not overpowering)
- [ ] Send button shows Stop icon with `Ctrl+C` hint in running states (01, 05, 06, 07, 08, 09)
- [ ] Send button shows Send icon with `Enter` hint in idle/input states (02, 03, 04, 10)
- [ ] Overflow menu has Export chat + disabled Restart/Delete only (no Pause, no Stop)
- [ ] No button, badge, or input has an inline height override — all use class-defined sizes
- [ ] Skill chips and bottom controls are the same height (26px)
- [ ] All tool card headers are 36px (L1, L2, L3 uniform)
- [ ] TopBar badges are 20px (not 17px)
- [ ] Dimmed content restores to full opacity on hover (visible in State05_LongConvo)
- [ ] "Paused" badge renamed to "Stopped" everywhere
