# Session Chat Interface — Design Spec

Design spec for the primary session view where users interact with AI coding agents in real-time. This is the most used screen in Grovekeeper. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Generate Three Distinct Variants

Please generate three layout variants for this interface. Each variant should take a different approach to arranging the elements below. All variants must include every required element, but may position, group, and visually treat them differently. After I choose one, we will fully design all its states and sub-components.

## Interface Purpose

Real-time chat view for an active AI coding session. The user watches the agent work (streaming text, tool calls, file edits), responds to permission prompts, sends follow-up messages, switches models/modes, and monitors session health. Sessions can run for minutes to hours.

## Required Elements

### Message Stream (primary content area)

- User messages: visually distinct from assistant messages (e.g., right-aligned bubbles, different background)
- Assistant messages: left-aligned, support full markdown (headers, lists, bold/italic, tables, links)
- System messages: centered, muted, smaller text
- Code blocks: syntax-highlighted, monospace, with copy button and language label
- Content before the last user prompt should be visually dimmed (not hidden — still scrollable)
- Messages stream in real-time (text appears character-by-character)

### Input Area (always fixed at bottom)

- Multi-line textarea that never scrolls out of view
- Send button
- Image paste zone (drag-and-drop or Ctrl+V — show drop target indicator)
- Slash command hint: typing "/" shows autocomplete suggestions

### Session Metadata (always visible, not in a modal)

All of these must be visible without clicking. Arrange them however works best — they do NOT need to be in rows:

- **Model name** + context window size (e.g., "Opus 4.6 (1M)")
- **Provider icon** (small, identifies which AI tool is running)
- **Session state badge**: running / needs-input / needs-review / paused / finished / errored
- **Permission mode**: select/dropdown showing current mode (Approve each / Auto-accept / Bypass). Cyclable via keyboard shortcut. Must look like an interactive control, not just a label.
- **Model selector**: select/dropdown showing current model. Switchable via keyboard shortcut. Interactive control.
- **Git branch name**
- **Linked issue** number + state (e.g., "#42 open") — if applicable
- **Linked PR** number + state (e.g., "PR #5 draft") — if applicable
- **Context window utilization**: progress bar + percentage (e.g., "37% of 1M tokens"). Color shifts as it fills (green → amber → red).
- **Session cost**: USD amount (e.g., "$4.387")
- **Token counts**: input + output totals
- **Quota utilization** (provider-specific, may be absent): 5-hour and 7-day progress bars with countdown timers. Only shown for providers that expose quota data.

Important: mode selector and model selector should be visually disabled (grayed out with tooltip) when the current provider does not support mid-session changes.

### Quick-Action Skill Buttons (near input area)

- Compact row of context-aware action buttons: Execute, Review, Check & Fix, Commit, Ship
- These change based on session state (some hide/show contextually)
- "More" overflow button leading to a searchable skill list
- Clicking pre-fills the input textarea with a slash command

### Navigation

- "Jump to latest response" button (appears when scrolled up)
- "Jump to latest prompt" button
- Both should be floating/sticky, not inline in the message stream

### Tabs (above the message stream)

- **Chat** (default, active) — the message stream described above
- **Files** — changed files tree with diffs (designed separately, just show the tab)
- **Stats** — metrics dashboard (designed separately, just show the tab)

### Collapsible Right Sidebar

- Contains the sub-agent tree panel (designed separately)
- Should have a collapse/expand toggle
- When collapsed, show a small badge with agent count (e.g., "3")
- Approximate width when expanded: 260-300px

## Layout Constraints

- Full-width within its container (no fixed max-width)
- Input area must be pinned to the bottom — it never scrolls away
- Message stream fills available vertical space between tabs and input
- Metadata elements should use space efficiently — avoid stacking vertically if horizontal space is available
- Dark theme primary (light theme support later)

## States to Explore in Variants

For the initial three variants, show the "active session, mid-conversation" state — messages visible, agent is working, metadata populated. After variant selection, we will design:

- Empty state (session just started, no messages yet)
- Needs-input state (approval card visible, input focused)
- Finished state (session complete, input disabled)
- Errored state
- Long conversation (many messages, dimmed content above)
- Quota warning (utilization >90%)

## Visual References

- The existing Grovekeeper design language uses the Forest Moss palette: deep greens, bark browns, amber accents
- Status colors: success (green), warning (amber), danger (red), info (blue) — see tokens.css
- Monospace font for code, tool outputs, file paths
- Compact, information-dense layout (this is a developer tool, not a consumer chat app)
- Reference: `artboards-app2.jsx` for prior session view exploration (inspiration only, not requirements)

## Not Included in This Design

- Tool call card internals (separate design brief)
- Sub-agent tree panel internals (separate design brief)
- Approval/permission card internals (part of tool call cards brief)
- Files tab content
- Stats tab content
- Session spawning dialog
- Skill configuration panel
