# Bottom Panel Session Tab — Design Spec

Design spec for the compact session view inside the bottom panel. When the user is on an issue page, a "Session" tab in the bottom panel shows ongoing and past sessions for that issue without navigating away from the issue view. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Container Context

**Parent**: `WorkspaceBottomPanel` — tab content area (the "Session" tab)
**What parent provides**: Tab bar with tab buttons, panel resizer handle at top, panel border
**What this component fills**: The content area below the active "Session" tab button, full width × remaining height after tab bar
**Must NOT include**: Tab bar, panel header, outer border, footer — these belong to the parent panel

**Mockup rendering**: Show the bottom panel shell (tab bar with "Session" tab active) as read-only context at ~40% opacity. The designed component fills the content area below.

## Panel Purpose

The bottom panel is always visible when an issue is selected. The Session tab gives a quick-access view of the issue's sessions — checking on progress, sending a quick reply, or jumping to the full session. It is intentionally compact and not a replacement for the full session view.

## Required Elements

### Session Selector / List

When multiple sessions exist for the issue, the user must be able to switch between them:

- Show session identifier: provider icon + start time + state badge
- Active session highlighted
- Create new session: "+" button or "Spawn session" call-to-action when none exist
- Sessions ordered: active first, then by recency

### Session Status Summary

Always visible for the active session (without scrolling):

- **Session state badge**: running / needs-input / needs-review / stopped / finished / errored
- **Provider icon** — which AI tool
- **Model name** — short (e.g., "Opus 4.7")
- **Session cost** — USD
- **Last activity** — relative timestamp (e.g., "2m ago")

### Compact Message Preview

Shows the tail end of the session — enough to see what happened recently:

- Last 2-4 messages (user + assistant), vertically stacked
- Messages truncated if long (single-line or 2-line clip with fade)
- Tool calls shown as single-line compact entries (icon + name + status), not full cards. Header height follows the shared 36px tool card header standard from `SESSION_CHAT_VIEW.md`
- "Needs input" state: approval card visible inline (Allow / Deny) — this must be actionable from the bottom panel
- Content before the last exchange visually dimmed (`opacity: 0.4`), restores to full opacity on hover (`150ms ease-out` transition, entire turn restores as a unit)

### Chat Input

- Single-line input (expands to 2-3 lines max)
- Send button
- Must be visible without scrolling — pinned at bottom of the panel
- Slash command hint active (same "/" autocomplete as full session)

### "Open Full Session" Link

- Always visible — not hidden in overflow
- Opens the full session view (navigates to the session page with full chat, tabs, sidebar)
- Should feel like an obvious escape hatch, not a buried action

## Layout Constraints

- Panel height: approximately 250-350px (user-resizable, but design for this range)
- Panel fills the full width available below the main content
- Input must be pinned to the bottom — never scrolls away
- Message preview should use remaining space between status summary and input
- Dark theme primary
- All buttons use `.gk-btn-sm` (26px height), badges use `.gk-badge` (20px height), inputs use `.gk-input` (32px height) — no inline height overrides. Matches the standardized sizing from the session chat view update.

## States to Explore in Variants

For the initial three variants, show:
- Two sessions for the issue (one active/running, one completed)
- Active session in "running" state with 2 recent messages visible
- Session cost and model shown

After variant selection, we will design:
- No sessions yet (empty state with "Spawn session" CTA)
- Single session (no multi-session selector needed)
- Needs-input state (approval card visible in the preview)
- Errored session
- Session finished (input disabled, results summary shown)
- Long session (many turns — preview still shows only the tail)
- Minimized / hidden panel (tab is clickable to expand)

## Visual References

- Grovekeeper Forest Moss palette — all colors from `tokens.css`
- Should feel like a compact "preview window" into the full session view — same visual language, smaller scale
- The bottom panel tab system is shared with other tabs (e.g., terminal, output) — the Session tab must coexist with that styling

## Not Included in This Design

- Full session view → `SESSION_CHAT_VIEW.md`
- Session spawning dialog → `SESSION_SPAWNING_DIALOG.md`
- Bottom panel chrome / tab bar (separate — part of the main layout)
- Session history search (out of scope for this panel)
