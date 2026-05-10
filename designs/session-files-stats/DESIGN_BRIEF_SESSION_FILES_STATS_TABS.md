# Session Files & Stats Tabs — Design Spec

Design spec for the **Files** and **Stats** tabs inside the session detail view. These two tabs live alongside the Chat tab in the session view header. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Container Context

**Parent**: Session detail view — tab content area (alongside the "Chat" tab)
**What parent provides**: Session top bar (title, state badge, git context), tab bar (Chat / Files / Stats), right sidebar (sub-agent tree, provider info)
**What this component fills**: The content area below the session tab bar, full width (minus sidebar if open) × full height
**Must NOT include**: Session top bar, tab bar, right sidebar — these belong to the session view layout

**Mockup rendering**: Show the session view shell (top bar + tab bar with the relevant tab active) as read-only context at ~40% opacity. The designed component fills the content area below.

## Purpose

These two tabs provide visibility into session activity beyond the conversation:

- **Files tab**: Code review surface — shows all files changed during the session with GitHub-style diffs, enabling users to review agent edits without leaving Grovekeeper
- **Stats tab**: Session analytics — aggregates cost, token usage, tool calls, and efficiency metrics so users understand what the agent spent time and resources on

Both tabs support the session detail view's goal of full transparency into AI agent behavior.

## Tab Context

Both tabs live inside the session view alongside the Chat tab. They are full-height within the session view's content area. The right sidebar (sub-agent tree) can be open or collapsed independently.

---

## Files Tab

### Purpose

Shows all files changed during the session, with GitHub-style diffs for each. Lets the user review the agent's edits without switching to a code editor. This is the primary code review surface inside Grovekeeper.

### Required Elements

#### File Summary Bar (top of tab)

- Total count of changed files (e.g., "12 files changed")
- Total additions and deletions (e.g., "+347 −89" in green/red)
- Filter or sort controls (optional in variants — e.g., filter by file type)

#### File Tree / File List

- List or tree of all changed files
- Per file: file path (right-to-left truncation for long paths), `+N −N` stats in green/red
- Visual indicator for file status: modified / added / deleted / renamed
- Click to jump to that file's diff

#### Diff View

- Unified diff per file (GitHub PR Files style)
- Added lines: green highlight
- Removed lines: red highlight
- Unchanged context lines: muted
- Line numbers on both sides
- File header: full file path + `+N −N` stats
- Toggle between unified and side-by-side diff (optional — show in variants)
- "Expand all" / "Collapse all" diffs action
- Long diffs (100+ lines): collapse with "Show N hidden lines" expander

### States

- Empty state: "No files changed yet" (session just started or read-only session)
- Large diff (many files): file list should scroll independently of the diff view
- Binary files: show "Binary file changed — cannot display diff"
- Deleted file: show all lines as removed

---

## Stats Tab

### Purpose

Aggregated metrics for the session: how much it cost, how many tokens were used, which tools were called most, and how efficiently the context was used. Lets users understand what the agent spent time on.

### Required Elements

#### Cost Section

- **Total cost** — prominent, USD (e.g., "$4.387")
- **Cost by model** — breakdown if multiple models used during session (e.g., via model switching or sub-agents using different models)
- Optional: local currency equivalent (small, secondary)

#### Token Section

- **Input tokens** — total
- **Output tokens** — total
- **Cache read tokens** — tokens served from prompt cache
- **Cache write tokens** — tokens written to prompt cache
- **Cache hit ratio** — percentage of input served from cache (e.g., "71% cache hit")
- Context window utilization: filled / total tokens

#### Session Activity

- **Total turns** — number of user↔assistant exchanges
- **Session duration** — total time from spawn to current/end (e.g., "1h 23m")
- **Start time** — timestamp
- **End time** — timestamp (or "Running" if active)

#### Tool Usage

- Count of calls per tool type (Read, Bash, Edit, Grep, Agent, WebFetch, etc.)
- Sorted by most-used
- Show as compact table rows with tool icon, tool name, call count
- Optional: add duration or success rate per tool (show in at least one variant)

### States

- Mid-session (running): costs and token counts updating in real-time
- Empty state: session spawned but no turns yet
- Long session: many tool types, long list

---

## States

Both tabs must handle these states:

### Files Tab States

- **Empty**: "No files changed yet" (session just started or read-only session)
- **Loading**: Initial load or refreshing diffs
- **Large diff**: Many files (100+), file list scrolls independently
- **Binary file**: "Binary file changed — cannot display diff"
- **Deleted file**: All lines shown as removed
- **Sidebar open/closed**: Content area adjusts width accordingly

### Stats Tab States

- **Mid-session (running)**: Costs and token counts update in real-time
- **Empty**: Session spawned but no turns yet
- **Completed session**: All metrics finalized, shows end timestamp
- **Long session**: Many tool types, scrollable list
- **Sidebar open/closed**: Content area adjusts width accordingly

---

## Reusable Components

Use these existing Grovekeeper components:

- **Button**: `.gk-btn-sm` for filter/sort actions, expand/collapse controls
- **Badge**: `.gk-badge-success` (additions), `.gk-badge-danger` (deletions), `.gk-badge-info` (file status indicators)
- **Typography**: `.gk-h2` for tab section headers (e.g., "Cost", "Token Usage"), `.gk-body` for file paths and stats, `.font-mono` for numbers and code paths
- **Card**: `.gk-card` for stats section groupings (Cost, Tokens, Activity, Tool Usage)
- **Divider**: `.gk-hr` between stats sections
- **Text styles**: `.cb-num` for numeric values (cost, tokens), `.cb-mute` for secondary labels

---

## Components to Adopt

Consider these shadcn-svelte or Bits UI components if needed:

- **Collapsible** from Bits UI — for expandable diff sections in Files tab
- **Table** from shadcn-svelte — for tool usage breakdown in Stats tab
- **Progress** from shadcn-svelte — for context window utilization bar

---

## Layout Constraints

- Full height within the session view content area
- Both tabs should scroll as needed (independent scroll from the right sidebar)
- Diff view can be very tall — virtual scrolling or efficient rendering implied
- File tree and diff should feel cohesive (same padding, same fonts)
- Stats tab numbers should use monospace font for alignment
- **Content column width:** The Chat tab constrains its content to `max-width: 900px` centered. The Stats tab should follow the same 900px column for consistency. The Files tab may use full available width (diffs benefit from horizontal space), but the file summary bar and controls should still align to the 900px column when the sidebar is open — this keeps the header visually consistent across tab switches.
- All buttons use `.gk-btn-sm` (26px), badges use `.gk-badge` (20px) — no inline height overrides. Matches the standardized sizing established in the session chat view update.

## Visual References

- GitHub PR Files view — primary reference for the Files tab diff display
- Linear issue activity sidebar — inspiration for compact stats layout
- Grovekeeper Forest Moss palette — green for additions, red for removals (override token colors)

## UI Freedom

Designers have creative latitude in:

- **Files tab**: Layout between file list and diff viewer (split view, stacked, or full-width with inline navigation)
- **Stats tab**: Visual treatment of metrics (cards vs table vs dashboard tiles)
- **Diff rendering**: Syntax highlighting color choices (within Forest Moss palette bounds)
- **Tool usage visualization**: Table, bar chart, or compact list with icons
- **Empty states**: Illustration style and messaging tone
- **Filter/sort controls**: Positioning and visual style (dropdowns, tabs, buttons)
- **Diff expander UI**: Visual treatment for "Show N hidden lines" controls

Must preserve: Forest Moss palette adherence, 26px button height (`.gk-btn-sm`), 900px content column for Stats tab, monospace fonts for numbers.

## Not Included in This Design

- Chat tab, tool cards, sub-agent tree, session metadata, skill controls → `SESSION_CHAT_VIEW.md`
- File editing / inline comments on diffs (out of scope for v1)
