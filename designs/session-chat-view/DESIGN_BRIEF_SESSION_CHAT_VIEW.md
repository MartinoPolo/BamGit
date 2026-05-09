# Session Chat View — Design Brief

The primary session detail interface where users interact with AI coding agents through a message stream. Displays conversation history, tool execution, sub-agent activity, session metrics, and a floating input panel for composing messages with skill shortcuts and model/permission controls.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Container Context

**Parent**: Standalone full-page view (navigated to from session list or bottom panel)
**What parent provides**: Window chrome, navigation context
**What this component fills**: Entire window content area
**Must NOT include**: Application-level window controls, main navigation — these belong to the Tauri window frame

**Mockup rendering**: This is a standalone full-page component that owns its entire layout including top bar, sidebar, chat column, and floating input panel. Render at full viewport dimensions.

## Purpose

The Session Chat View is the primary workspace for interacting with AI coding sessions. Users compose messages, execute skills, review tool outputs, monitor context/cost/quota metrics, inspect sub-agent activity, manage images, and control model/permission settings. The interface balances high information density (50-200+ tool cards per session) with focused input composition and quick access to session state.

## Required Elements

### Page Layout

Three regions:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                                 │
│ [Title] [● Running]    feat/session-ui · #90 open · PR #5 draft   [↗ Open in CLI] [⋮] [Chat|Files|Stats]│
├──────────────────────────────────────────────────────┬──────────────────┤
│                                                      │  ┌─ collapse ─┐ │
│  Message stream                                      │  │            │ │
│  (Chat tab content)                                  │  │  Provider  │ │
│                                                      │  │  ── sep ── │ │
│                                                      │  │  Quotas    │ │
│                                                      │  │  ── sep ── │ │
│                                                      │  │  Metrics   │ │
│                                                      │  │  ── sep ── │ │
│                                                      │  │  Sub-Agents│ │
│      ┌─ Floating input panel ─┐                      │  │            │ │
│      │ Skill chips            │                      │  │            │ │
│      │ ┌──────────────────┐   │                      │  │            │ │
│      │ │ Textarea (3 ln)  │   │                      │  │            │ │
│      │ └──────────────────┘   │                      │  │            │ │
│      │ [+] [Tools ▾]  [Local ▾] [Model · High ▾] [Approve ▾] [→]   │  │            │ │
│      └────────────────────────┘                      │  └────────────┘ │
└──────────────────────────────────────────────────────┴──────────────────┘
```

- Sidebar on the **right**: 272px expanded, 44px collapsed.
- Chat column fills remaining width.
- Top bar runs full page width above both columns.
- Floating input panel sits inside the chat column, centered, max-width ~900px, ~20px from the bottom edge of the chat column.

### 1. Top Bar

Single horizontal bar above both columns. Three groups:

### Left group

- **Session title** — issue title or first user message, truncated to ~60ch with ellipsis.
- **Session state badge** — running / needs-input / needs-review / stopped / finished / errored. Color-coded (running pulse green, needs-input amber, errored red).

### Center group (git context)

Single inline row, monospace where appropriate:

- **Branch name** — `feat/session-ui` with branch icon
- **Issue badge** — `#90 open` (clickable → opens GitHub URL)
- **PR badge** — `PR #5 draft` (clickable → opens GitHub URL)

When window narrows: badges collapse to icon-only.

### Right group

- **Open in CLI** action — labeled icon button `[↗ Open in CLI]`. Resumes the current session in the native provider CLI (e.g., `claude --resume <session-id>`, `codex --resume <id>`, etc.) by spawning the provider-appropriate command in a terminal at the worktree path. Works for all four providers; command varies per provider.
- **Overflow menu** `[⋮]` — session-level actions: Export chat, Restart (future), Delete session (future). Stop is handled by the send↔stop morph in the input panel (see section 6). No "Pause" action — stopping the agent and returning later achieves the same effect.
- **Tab switcher**: Chat (default) | Files | Stats

### Constraints

- No provider icon in the top bar — provider lives in the sidebar.
- No model/permission/cost fields in the top bar.

### 2. Right Sidebar

### Expanded state (272px wide)

Sections top to bottom, divided by separator lines:

**A. Header strip**

- Collapse toggle (icon) — **left-aligned** in the header row, closest to the content boundary. Toggles to the 44px strip.
- No label needed. Future-proof: leave room for additions.

**B. Provider section**

- Provider icon (orange Anthropic / OpenAI / Cursor / OpenCode etc.)
- Provider name (e.g., "Claude Code")
- This is where multi-provider support is hinted — show as a clickable chip that, in the future, opens a provider switcher.

**C. Global usage section** (separator above)

- **5h quota** — label `5h` + progress bar + countdown text (e.g., `3h 28m`)
- **7d quota** — label `7d` + progress bar + countdown text (e.g., `6d 4h`)

**D. Session metrics section** (separator above — visual separation between global vs. session-scoped data)

- **Context** — `Context` label + progress bar + value (`54% · 108K`)
- **Cost** — `Cost` label + value (`$4.387`), monospace
- **Tokens** — `Tokens` label + value (`48.2K in · 12.1K out`), monospace

**E. Sub-Agents section** (separator + header above)

- Section header: icon + "Sub-Agents" + count badge
- Tree of sub-agents (per node: name, model, status indicator, tool count, duration)
- Sub-agents area sits below the metrics with reasonable spacing — height is responsive: metrics are auto-height; sub-agents fill the remaining vertical space and scroll independently if long.

### Progress bar layout (rules for sections C and D)

All bars in the sidebar must align as a single vertical channel:

- Each row: `[label-column]  [bar-fills-channel]  [value-column]`
- Width of the bar channel = remaining space between the longest left label and the longest right value (with ~8px padding on each side)
- All four bars (5h, 7d, Context, plus any future bars) end at the same x-position and have the same width
- Bars are right-aligned within the channel; values are right-aligned in the value column

### Progress bar color thresholds

| Bar      | Green | Orange | Red  |
| -------- | ----- | ------ | ---- |
| Context  | <40%  | 40–60% | >60% |
| 5h quota | <60%  | 60–85% | >85% |
| 7d quota | <60%  | 60–85% | >85% |

### Collapsed state (44px wide)

Vertical strip with the following items, top to bottom:

1. Collapse toggle (expands sidebar)
2. Session state pulse dot (uses state color)
3. **Vertical context bar** — thin (~4px wide) vertical fill bar showing context % filled, color-coded with the same thresholds. Below it: rotated `54%` text.
4. **Sub-agent count** — rotated text `5 agents`

**No cost in collapsed state** (per user decision — cost is non-essential at-a-glance info).

### 3. Tabs and Message Stream

### Tabs

Three tabs at the top of the chat column:

- **Chat** — active by default (this view)
- **Files** — see `SESSION_FILES_STATS_TABS.md`
- **Stats** — see `SESSION_FILES_STATS_TABS.md`

### Message Stream

The primary content area between the tabs and the floating input panel.

**Message types**

- User messages — right-aligned bubbles, distinct background, avatar/icon
- Assistant messages — left-aligned, full markdown (headers, lists, bold/italic, tables, inline code, links)
- System messages — centered, muted, smaller font ("Session started", "Paused", etc.)

**Code blocks** — syntax-highlighted, monospace, language label, copy button

**Streaming** — text appears character-by-character with a subtle caret at the insertion point. Tool calls can appear mid-stream and resolve while the assistant continues.

**Content dimming** — content above the last user message is visually dimmed (`opacity: 0.4`). Dimmed content remains scrollable and fully interactable (accordions, navigation links, copy buttons all work). On hover, the **entire turn** (user message + assistant response + all tool cards in that turn) restores to full opacity with `transition: opacity 150ms ease-out`. This makes older content recede visually while remaining accessible.

**Image rendering** — images are rendered inline in message bubbles. Each image has a small `#N` caption beneath it (matches the global session numbering — see Image Handling section).

**Floating quick-nav buttons** (sticky overlays, not inline):

- "Jump to latest response" — visible when scrolled above the latest assistant message
- "Jump to latest prompt" — visible when scrolled above the latest user message

### 4. Tool Call Cards

Tool calls appear inline in the message stream between assistant text segments. A typical session has 50–200+ cards. Three rendering levels.

### Level 1 — Compact (default for completed tools)

Single line, ~32–36px tall.

- Tool icon (unique per tool type)
- Tool name (e.g., "Read", "Bash")
- Key detail (varies by tool — see table)
- Output size label (varies — see table)
- Duration (e.g., "0.3s")
- Status icon (success, failure, running spinner)

Completed tools are subdued (reduced opacity). Click anywhere → expand to Level 2.

### Level 2 — Expanded (auto for running tools, user-toggleable for completed)

Same header as Level 1, plus:

- Left accent border in tool-specific color
- Content panel: input + output, scrollable, max ~250–300px tall
    - Bash: command + terminal output
    - Read: file content excerpt with line numbers
    - Edit: inline diff (old → new with +/− coloring)
    - Grep: matching lines highlighted
    - Agent: sub-agent summary
- Truncation indicator with "Show more" lazy-load

### Level 3 — Interactive (auto-activated, full-width)

**Permission Prompt** — agent wants to use a tool

- Amber accent
- "Agent wants to use **[Tool Name]**"
- Tool input shown (collapsible for long inputs)
- Buttons: Allow (Enter, default focus), Allow Always (Ctrl+Enter), Deny (Esc)

**Elicitation Prompt** — MCP server needs user data

- Info/blue accent
- MCP server name + message
- Text input + Submit (Enter) / Cancel (Esc); clickable URL if provided

**Ask User Question** — agent asks with options

- Neutral accent
- Question text + selectable chips/radio buttons
- Arrow keys navigate, Enter confirms, "Other" expands freetext
- Multi-select variant uses checkboxes

### Per-Tool Visual Identity

| Tool      | Key Detail             | Output Size Label              | Icon concept     |
| --------- | ---------------------- | ------------------------------ | ---------------- |
| Bash      | `$ command` preview    | Exit code or "interrupted"     | Terminal         |
| Read      | File path              | Line count                     | Eye              |
| Write     | File path              | Size or "created"              | Pencil + doc     |
| Edit      | File path + `+N −N`    | Patch line counts              | Diff             |
| Glob      | Pattern                | File count                     | Folder search    |
| Grep      | Pattern                | Match + file count             | Magnifying glass |
| Agent     | Sub-agent name + model | Tool count + duration + tokens | Bot              |
| WebSearch | Query                  | Result count                   | Globe            |
| WebFetch  | URL (truncated)        | HTTP status + size             | Download         |
| TodoWrite | —                      | Item count                     | Checklist        |
| Task      | Description            | Duration + status              | Gear             |

Each tool gets a unique icon and accent color. Designer chooses specifics — must be visually distinguishable at Level 1.

### Card Grouping

When 5+ consecutive tool calls fire, render as a collapsible group ("12 tool calls") to avoid overwhelming the stream.

### 5. Sub-Agent Inline Expansion

Clicking a node in the right-sidebar Sub-Agents tree expands its messages **inline in the chat stream** at the spawn point:

- Colored left border (default: azure/blue)
- Nested expansions use progressively different border colors or increased indentation
- Expanded section contains: sub-agent prompt, responses, Level 1/2 tool cards
- Collapse action closes the inline expansion
- The sidebar tree node shows a visual indicator when its messages are expanded inline

Sample tree state for the canonical mockup:

- Main session — Opus 4.7, running, 45 tools
    - Explore codebase structure — Sonnet, completed, 12 tools, 23s
    - Review error handling — Sonnet, completed, 8 tools, 15s
        - Fetch library docs — Haiku, completed, 3 tools, 4s
    - Implement provider trait — Sonnet, running, 5 tools
    - Run test suite — Haiku, failed, 2 tools, 8s

### 6. Floating Input Panel

Floating, rounded, elevated surface — **not** a full-width bar with padding. Centered horizontally in the chat column.

**Container properties**

- Max-width ~900px (or ~80% of chat column, whichever is smaller)
- ~20px above the bottom of the chat column
- Rounded corners, subtle shadow, **solid opaque** surface-elevated background (`var(--surface)`)
- Drag-and-drop target for images and files (drop indicator overlay when dragging)

**Shared content column** — the message stream content (assistant text, tool cards, sub-agent expansions, system messages) must be constrained to the **same max-width as the floating input panel** (~900px, centered). This prevents content from "leaking" past the edges of the input card. User message bubbles remain narrower (75% of column). This matches the pattern used by Claude.ai and ChatGPT where content and input share a single column constraint.

**Gradient fade** — a gradient overlay covers the bottom ~120px of the chat column behind the input panel: `linear-gradient(transparent, var(--background))`. This fades scrolling content before it reaches the panel, preventing visual collision. The gradient is `pointer-events: none` so it doesn't block interaction with the input panel.

**Vertical structure (top → bottom)**

### A. Image carousel (collapsible)

- **Collapsed by default** — shown as a thin strip with `📎 N images` button when ≥1 image exists in the session, or fully hidden if 0 images
- **Expands automatically** when the user pastes/uploads a new image (focuses on the new image)
- **Collapses automatically** when the user sends a message
- **Manually toggleable** via a chevron on the strip
- When expanded: horizontal carousel of all session images (newest right or left — TBD by designer). Each thumbnail shows `#N` caption.
- If thumbnails overflow horizontally: arrow buttons / scrollable carousel
- Click thumbnail → enlarge preview
- × on each thumbnail → remove from current message draft (does not affect already-sent images)

### B. Skill chips row (always visible)

Horizontal row of context-aware skill buttons. Default set:

| Label       | Slash command    | Visibility rule  |
| ----------- | ---------------- | ---------------- |
| Execute     | `/execute`       | Always           |
| Review      | `/review`        | Always           |
| Check & Fix | `/check-and-fix` | Always           |
| Commit      | `/commit`        | After file edits |
| Ship        | `/ship`          | After commit     |

Plus event-driven additional skills (configured per event type — see skill configuration below).

**More ▾** button at the end → searchable dropdown of all discovered skills (from `.claude/` user/project folders + custom paths).

Click any chip → pre-fill textarea with the slash command (user can edit before sending).

### C. Textarea

- Default height: 3 lines (visible without expanding)
- Auto-grows up to ~50vh, then internal scroll
- Placeholder: "Message or /command…"
- Slash autocomplete: typing `/` shows suggestion list
- `@` mentions: typing `@` shows context picker (files, issues, sub-agents, past images)
- Image paste: pasting an image inserts a `[Image #N]` pill at the cursor position; the image carousel expands above

### D. Bottom controls row

Single row, two groups separated by flex space:

**Left group**

- `[+ Attach]` — opens file picker (image, file, URL paste)
- `[Tools ▾]` — popover listing per-session toggles for MCP servers, available skills, available tools

**Right group**

- `[Local ▾]` — location selector. Placeholder for v1 (only "Local" available). Future: "Cloud", "Remote SSH", etc.
- `[Claude Code · Opus 4.7 (1M) · High ▾]` — combined provider + model + effort selector. Single dropdown, grouped:
    - Top: provider switcher (Claude Code / Cursor / Codex / OpenCode)
    - Then: model list per provider (each entry shows context window in parens)
    - Then: effort/thinking-mode selection (Low / Medium / High / off)
- `[Approve each ▾]` — permission mode (Approve each / Auto-accept edits / Bypass all)
- `[→ Send / ■ Stop]` — primary action. **Morphs between Send and Stop** based on session state:
    - **Idle / waiting for input:** Send icon (`→`), keyboard hint `Enter` (or `Ctrl+Enter` for newline). Primary color.
    - **Agent actively generating:** Stop icon (`■`), keyboard hint `Ctrl+C`. Danger/red color. Single click interrupts the current generation immediately.
    - Transition is instant (no animation). The button returns to Send when the agent finishes or is stopped.
    - There is no separate "Pause" action — stopping the agent and returning later achieves the same effect.

**Component sizing rules**

- All buttons in the input panel use predefined size variants — **no inline height overrides**.
- Bottom controls row: all buttons (Attach, Tools, Local, Model dropdown, Approve each, Send/Stop) use `.gk-btn-sm` (`--size-control-sm`, 26px). The Send button is distinguished by primary color, not by being taller.
- Skill chips row: all chips use `.gk-btn-sm` (26px) — same height as the bottom controls.
- All tool card headers (L1, L2, L3) use a **single consistent height of 36px**.
- All badges use `.gk-badge` (20px) — no inline height overrides to 15px or 17px.
- All inputs use `.gk-input` (`--size-control-md`, 32px) — no inline height overrides.

**Sync rules**

- Provider, model, effort, permission mode are session-level state
- The sidebar's Provider section reflects the current provider (read-only)
- The sidebar shows no model/permission/effort/location controls — those live only in the input panel
- Changes to model mid-session are allowed only when the provider supports it (Cursor, Claude Code yes; Codex, OpenCode model-only mid-session change allowed; mode/effort restricted per provider capabilities)

### E. Skill configuration panel (separate surface)

Accessed via gear/settings icon near the skills row (or via the Tools popover). Opens as a side drawer or modal.

- **Event list**: rows for On session start, After execution, On error, On merge conflict, After commit, After PR created
- Per event: assigned skill chips + "+ Add skill" button
- **Skill picker**: search field + list of discovered skills + "Browse…" for custom path
- **Discovery paths**: list of scanned folders + "Add path…" + per-path enable toggle
- **Global defaults toggle**: "Use as defaults for all new sessions"

### 7. Image Handling — Session-Wide Numbering

- Image numbering is **session-wide and persistent**: image #1 stays #1 for the lifetime of the session
- Pasted/uploaded image inserts `[Image #N]` pill in the textarea at cursor position. Backspace deletes the pill as a unit.
- After send: the message bubble in the stream renders the image inline with `#N` caption beneath
- Past images can be referenced naturally in subsequent prompts (e.g., "compare image #2 and #5") — the model sees the placeholder token in transcript history
- The carousel above the textarea (see 6.A) gives quick visual access to all session images, collapsed by default and auto-collapsing on send

---

## Reusable Components

Use the following existing Grovekeeper components:

- **Button**: `.gk-btn-sm` for all input panel controls (26px), `.gk-btn-icon` for toolbar/overflow actions
- **Badge**: `.gk-badge-success` (running pulse), `.gk-badge-warning` (needs-input), `.gk-badge-danger` (errored), `.gk-badge-info` (stopped), `.gk-badge` for counts
- **Form controls**: `.gk-input` for text fields in elicitation prompts, `.gk-textarea` for the main composer, `.gk-select` for dropdowns
- **Display**: `.gk-card` for tool cards and message bubbles, `.gk-hr` for sidebar section separators
- **Navigation**: `.gk-tabs` + `.gk-tab` + `.is-active` for Chat/Files/Stats tab bar, `.gk-popover` + `.gk-popover-item` for Tools/Model/Approve dropdowns
- **Layout**: `.gk-tooltip` for hover hints on controls, `.gk-kbd` for keyboard shortcuts in tooltips
- **Typography**: `.gk-body` (13px) for message text, `.gk-small` (12px) for sidebar labels, `.gk-tiny` (11px) for timestamps/durations, `.gk-eyebrow` (10.5px uppercase) for section headers, `.font-mono` for code/git context/metrics

## Components to Adopt

No new shadcn-svelte or Bits UI components required — all interactions can be built with existing Grovekeeper primitives. Future consideration: virtualized list component for extremely long message streams (500+ messages).

## Layout Constraints

- **Shared content column**: message stream content and floating input panel share the same max-width (~900px, centered). No content extends wider than the input panel.
- Right sidebar fixed width: 272px expanded, 44px collapsed
- Floating input panel: max-width 900px, centered, 20px from chat-column bottom
- Message stream fills available space between tabs and the floating panel
- **Gradient fade**: bottom ~120px of chat column fades from transparent to `var(--background)` behind the input panel
- Top bar fills full page width
- Dark theme primary; light theme supported (already in current HTML mockup)
- All scrollable areas (message stream, sub-agents tree, tool card content, image carousel) scroll independently

## States

The canonical mockup shows: active session mid-conversation, sample messages, mixed L1/L2/L3 tool cards, sample sub-agent tree with one node expanded inline, default skill row visible, sidebar expanded.

Design these additional states (priority order):

1. **Active session, mid-conversation** (canonical — already in HTML)
2. **Needs-input** — Level 3 permission card visible, focus on it, sidebar showing `needs-input` badge
3. **Empty / just spawned** — no messages yet, sidebar populated with starter values, skill row visible
4. **Errored** — red state badge, error card in stream, sidebar shows errored state
5. **Long conversation** — content above last prompt dimmed, jump-to-latest buttons visible
6. **Image attached** (mid-composition) — carousel expanded with thumbnails, `[Image #N]` pills in textarea
7. **Image carousel collapsed** — later in conversation, strip showing `📎 5 images` button
8. **Sidebar collapsed** — 44px strip with all five elements, plus interaction state for hover on the strip
9. **Quota warning** — 5h or context bar in red zone
10. **Long-text input** — textarea expanded near 50vh; bottom controls still visible at panel bottom
11. **Tools popover open** — list of MCP servers, skills, tools with toggles
12. **Combined model dropdown open** — grouped by provider, showing models with context windows and effort selection
13. **Skill configuration panel open** — event list with assigned skills, skill picker dialog open in a sub-state
14. **Open in CLI hover/tooltip** — tooltip showing the exact command to be run (e.g., `claude --resume <session-id>`)
15. **Overflow menu open** — `[⋮]` opens; v1 shows placeholder items disabled-with-coming-soon, just for layout

For tool cards specifically (sub-component states):

- All 11 tool types at Level 1
- Level 2 per tool type (each has its own content layout)
- All three Level 3 sub-types (permission, elicitation, question)
- Tool grouping (5+ consecutive calls collapsed)
- Tool error state (red accent)
- Streaming output (tool currently running)

For sub-agent tree (sub-component states):

- Empty (no sub-agents)
- Single agent (no tree needed)
- Deep nesting (4+ levels)
- Many agents (15+ nodes scrolling)
- Hover/selection states
- Active expansion indicator on a node

---

## UI Freedom

Designers have creative latitude in these areas:

- **Tool card visual identity**: Specific icon designs, accent colors, and visual hierarchy per tool type (must remain distinguishable at L1)
- **Message bubble styling**: Exact padding, border-radius, shadow depth, and hover effects
- **Floating input panel appearance**: Shadow intensity, border treatment, corner radius, and elevation feel
- **Gradient fade curve**: Exact gradient stops and easing for the bottom fade behind the input panel
- **Sub-agent inline expansion styling**: Border color progression, indentation strategy, and nesting indicators
- **Micro-interactions**: Hover states, focus rings, transition timing, and expansion/collapse animations (keep under 200ms)
- **Image carousel layout**: Thumbnail size, spacing, scroll behavior, and `#N` caption placement
- **Empty state illustrations**: Icon or illustration for "no messages yet" state
- **Skill chip styling**: Exact button treatment, spacing, and grouping for the skill row

Constraints:

- Must preserve content/input column width alignment (~900px shared max-width)
- Must use documented component size variants (no inline height overrides)
- Must maintain progress bar vertical alignment in sidebar (all bars same width, right-aligned)
- Must keep tool card headers at 36px consistent height
- Must respect color thresholds for progress bars (Context, 5h, 7d)

## Visual References

- Variant C JSX (`session-variant-c.jsx`) — chosen base, mirror to right
- Forest Moss palette in `tokens.css`
- Geist / Geist Mono fonts
- Cursor 3.0 input panel — pill-style controls, floating panel
- Claude.ai composer — `+` for context, "Tools" as single popover entry point
- VS Code Copilot Chat — agent panel with @ mentions
- ChatGPT 2026 composer — model selector at bottom-right of input area
- OpenCovibe tool card system — 3-level structure, per-tool colors
- GitHub PR Files view — Edit tool L2 content inspiration

## Not Included

- Files tab and Stats tab content → `SESSION_FILES_STATS_TABS.md`
- Session spawning dialog → `SESSION_SPAWNING_DIALOG.md`
- Bottom panel compact view → `BOTTOM_PANEL_SESSION_TAB.md`
- Voice input (out of scope for v1)
- Per-message agent override (out of scope; session-bound)
- Provider installation / authentication flows
