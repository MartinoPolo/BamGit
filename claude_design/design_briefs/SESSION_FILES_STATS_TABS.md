# Session Files & Stats Tabs — Design Spec

Design spec for the **Files** and **Stats** tabs inside the session detail view. These two tabs live alongside the Chat tab in the session view header. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Generate Three Distinct Variants

Please generate three visual variants. Each should explore a different approach to information layout and visual hierarchy across both tabs. All variants must include every element listed below for both tabs. After I choose one, we will fully design all edge cases.

**Variant A — Dense, developer-focused**: Files tab mimics GitHub PR Files exactly — sidebar file tree on the left, diff on the right. Stats tab is a compact table/grid, no charts. Maximum data density, minimal whitespace.

**Variant B — Card-based, scannable**: Files tab shows expandable file cards in a single column (no sidebar). Stats tab uses metric cards with prominent numbers and subtle icon decoration. Easier to read at a glance.

**Variant C — Sidebar + summary bar**: Both tabs share a narrow left sidebar. Files tab sidebar = file tree with +/- counts; diff fills the right. Stats tab sidebar = category list (Cost, Tokens, Tools); detail fills the right. Unified layout language across the two tabs.

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

## Not Included in This Design

- Chat tab, tool cards, sub-agent tree, session metadata, skill controls → `SESSION_CHAT_VIEW.md`
- File editing / inline comments on diffs (out of scope for v1)
