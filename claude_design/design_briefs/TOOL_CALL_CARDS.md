# Tool Call Cards — Design Spec

Design spec for the tool call card system used within the session chat stream. Each AI agent action (reading files, running commands, editing code, etc.) renders as a card. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Generate Three Distinct Variants

Please generate three visual variants for the tool card system. Each variant should explore a different approach to the 3-level rendering, color/icon treatment, and information density. All variants must support all three levels and all tool types listed below. After I choose one, we will fully design all states.

## Card Purpose

Tool calls are the most frequent visual element in a session. A typical session has 50-200+ tool calls. Cards must be extremely compact by default (Level 1) to avoid overwhelming the chat stream, but expandable for detail (Level 2) and interactive when user input is needed (Level 3).

## Three Rendering Levels

### Level 1 — Compact (default for completed tools)

Single line showing essential info at a glance. This is what users see 90% of the time.

Required elements per line:
- **Tool icon** — small, distinct per tool type
- **Tool name** — e.g., "Read", "Bash", "Edit", "Grep"
- **Key detail** — varies by tool (see table below)
- **Output size label** — compact metadata (see table below)
- **Duration** — how long the tool ran (e.g., "0.3s", "2.1s")
- **Status icon** — success (check), failure (X), running (spinner)

Completed tools should be visually subdued (reduced opacity or muted colors) so they recede and the assistant's text stands out.

Click anywhere on the line toggles to Level 2.

### Level 2 — Expanded (for running tools, or user-toggled)

Same header as Level 1, plus a content panel below showing tool input and output.

Required elements:
- Header line (identical to Level 1)
- **Left accent border** in tool-specific color (runs full height of expanded content)
- **Content panel**: raw tool input and output, scrollable, capped max height
- For Bash: show the full command + terminal output
- For Read: show file content excerpt
- For Edit: show inline diff (old → new with +/- coloring)
- For Grep: show matching lines with highlights
- For Agent: show sub-agent summary (name, model, status)
- **Truncation indicator** when output exceeds cap — "Show more" lazy-loads rest
- **Tool summary text** — optional one-line summary below header (e.g., "Read 45 lines from src/main.rs")

Auto-activates for currently-executing tools. Collapses back to Level 1 on click or when tool completes.

### Level 3 — Interactive (auto-activated, not user-toggled)

Full-width card with action buttons. Appears automatically when user input is needed. Three sub-types:

**Permission Prompt** (agent wants to use a tool):
- Accent: amber/warning border
- Shows: "Agent wants to use **[Tool Name]**"
- Tool input displayed (collapsible for long inputs, e.g., a full bash command)
- Three action buttons: **Allow** (primary), **Allow Always** (secondary), **Deny** (destructive)
- Keyboard hints shown on buttons: Enter, Ctrl+Enter, Esc
- Default focus on Allow button
- Arrow keys move focus between buttons

**Elicitation Prompt** (MCP server needs user data):
- Accent: info/blue border
- Shows: MCP server name + human-readable message
- Text input field for the response
- Submit (Enter) + Cancel (Esc) buttons
- If URL is provided (e.g., OAuth), show clickable link

**Ask User Question** (agent asks a question with options):
- Accent: neutral/subtle border
- Shows: question text
- Option buttons displayed as selectable chips/radio buttons
- Arrow keys navigate between options, Enter confirms
- "Other" option: expands a freetext input field
- Multi-select variant: checkboxes instead of radio buttons
- Selected option highlighted (e.g., green check + filled background)

## Per-Tool Visual Identity

Each tool type has a **unique icon** and **accent color**. The icon appears in Level 1 and the color is used for the Level 2 left border.

| Tool | Key Detail (Level 1) | Output Size Label | Suggested Icon Concept |
|------|----------------------|-------------------|----------------------|
| Bash | `$ command` preview (truncated) | Exit code (0, 1, etc.) or "interrupted" | Terminal/console |
| Read | File path (right-to-left truncation) | Line count (e.g., "142 lines") | Eye/document |
| Write | File path | File size or "created" / "overwritten" | Pencil/document |
| Edit | File path + `+N -N` stats | Patch line counts | Diff/pencil |
| Glob | Pattern (e.g., `**/*.ts`) | File count (e.g., "23 files") | Search/folder |
| Grep | Search pattern | Match count + file count (e.g., "8 matches in 3 files") | Magnifying glass |
| Agent | Sub-agent name + model | Tool count + duration + tokens | Bot/branch |
| WebSearch | Search query | Result count | Globe |
| WebFetch | URL (truncated) | HTTP status + response size | Download |
| TodoWrite | — | Item count | Checklist |
| Task | Task description | Duration + status | Gear/cog |

Designer is free to choose specific icons and colors, but each tool must be visually distinguishable at a glance in Level 1.

## Layout Constraints

- Level 1 cards should be as compact as possible — single line, ~32-36px height
- Level 2 content panel: max height ~250-300px, overflow scroll
- Level 3 cards: full width of the chat area, prominent but not overwhelming
- Cards stack vertically in the chat stream between message bubbles
- Multiple consecutive tool calls should feel like a compact log, not a wall of cards
- When many tools run in sequence, consider visual grouping (e.g., subtle separator or "5 tool calls" collapse)

## States to Explore in Variants

For the initial three variants, show a mixed chat stream with:
- 3-4 Level 1 cards (completed: Read, Bash, Edit, Grep)
- 1 Level 2 card (currently running Bash command with output streaming)
- 1 Level 3 card (permission prompt for a Bash command)

After variant selection, we will design:
- All tool types at Level 1
- Level 2 for each tool type (different content layouts)
- All three Level 3 sub-types (permission, elicitation, question)
- Error state (tool failed — red accent)
- Grouped/collapsed state (e.g., "12 tool calls" expandable group)
- Loading/streaming state (output appearing in real-time)

## Visual References

- OpenCovibe's tool card system (3-level, per-tool colors) — inspiration for the level structure
- Claude Code CLI tool output (compact, information-dense) — inspiration for Level 1 density
- GitHub PR diff view — inspiration for Edit tool Level 2 content
- Grovekeeper Forest Moss palette — all colors from tokens.css

## Not Included in This Design

- Chat message bubbles (separate — session chat interface brief)
- Sub-agent tree panel (separate brief)
- The chat input area or session metadata
