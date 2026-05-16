# Session Files & Stats Tabs — Design Brief

Design brief for the **Files** and **Stats** content areas within the session detail view. These are tab-switched views alongside the Chat tab, activated via the `SessionTopBar` tab strip (`Chat | Files | Stats`). The right metadata sidebar persists across all tabs.

---

## 1. Purpose

- **Files tab**: Code review surface — shows all files changed during the session with GitHub-style diffs, enabling review of agent edits without leaving Grovekeeper.
- **Stats tab**: Session analytics — aggregates cost, token usage (input/output/cache), tool calls, turns, duration, model, and efficiency metrics so users understand what the agent spent time and resources on.

Both tabs support the session view's goal of full transparency into AI agent behavior. The right sidebar already shows summary metrics (cost, tokens, context, quotas). These tabs provide the detailed drill-down.

---

## 2. Surrounding Context

The session page layout (implemented in `SessionChatView.svelte`):

```
┌─────────────────────────────────────────────────────────────────┐
│ SessionTopBar (40px)                                            │
│  [← Back] [title] [state badge] ... [Chat | Files | Stats]     │
├──────────────────────────────────────────────┬──────────────────┤
│                                              │ SessionSidebar   │
│  Content area (flex-1)                       │ (272px expanded  │
│  ─────────────────────                       │  or 44px collapsed)│
│  max-width: 900px centered (Chat/Stats)      │                  │
│  OR full available width (Files)             │ • Provider       │
│                                              │ • Global Usage   │
│                                              │   (5h/7d quotas) │
│                                              │ • Session        │
│                                              │   (context, cost,│
│                                              │    tokens)       │
│                                              │ • Sub-Agents     │
│                                              │   (tree)         │
├──────────────────────────────────────────────┤                  │
│ FloatingInputPanel (absolute bottom)         │                  │
└──────────────────────────────────────────────┴──────────────────┘
```

**Location**: Files/Stats are **tab content within the main area**, not inside the right sidebar. The right sidebar persists independently — it always shows provider, quotas, cost summary, and sub-agent tree regardless of active tab.

**Tab switching**: `SessionTopBar` already has `activeTab: 'chat' | 'files' | 'stats'` prop and `onTabChange` callback. The parent (`SessionChatView`) conditionally renders the appropriate content.

**Floating input panel**: Remains visible on Files/Stats tabs (users may want to ask the agent about specific files/stats). Bottom padding (`pb-36`) must accommodate it.

---

## 3. Requirements

### 3.1 Files Tab — Data Requirements

**File list data** (per changed file):
- `filePath` — full relative path from worktree root
- `changeType` — `added` | `modified` | `deleted` | `renamed` | `binary`
- `additions` — line count (green)
- `deletions` — line count (red)
- `oldPath` — for renamed files only

**Diff data** (per file):
- Unified diff hunks with context lines
- Line numbers (old + new)
- Added/removed/context line classification

**Aggregate summary**:
- Total files changed count
- Total additions / total deletions
- Breakdown by change type (N added, N modified, N deleted)

**Data source**: Tool events from the session stream. `tool_end` events where `tool_name` is `Edit`, `Write`, `Read` (for tracking touched files), or `Bash` (for git operations). File changes are accumulated by parsing tool inputs/outputs. For completed sessions, a `git diff` summary from the Rust backend provides the definitive file list.

### 3.2 Stats Tab — Data Requirements

**Cost section**:
- Total cost USD (e.g., `$4.387`) — from `session.cost_usd` + `usage_update` events
- Cost by model — when session uses multiple models (sub-agents, model switching)
- Cost breakdown: input tokens × price, output tokens × price, cache read × price, cache write × price

**Token section** (from `session_metrics` table and `usage_update` events):
- `input_tokens` — total
- `output_tokens` — total
- `cache_read_tokens` — tokens served from prompt cache
- `cache_write_tokens` — tokens written to prompt cache
- Cache hit ratio — `cache_read / (input + cache_read)` as percentage
- Context window utilization — filled / total (from `usage_update.input_tokens` vs model context limit)

**Session activity**:
- `turn_count` — user↔assistant exchanges (from `usage_update.num_turns` or `turn_metrics` count)
- `duration_seconds` — from `session_metrics.duration_seconds` or computed `ended_at - started_at`
- `started_at` — timestamp
- `ended_at` — timestamp or "Running" if active
- `one_shot_turns` / `one_shot_rate` — turns that succeeded without retries
- `edit_turns` — turns containing file edits
- `retry_count` — total retries

**Tool usage** (from `tool_usage` table):
- Per tool: `tool_name`, `call_count`, `error_count`, `total_duration_seconds`
- Sorted by most-used
- Success rate: `(call_count - error_count) / call_count`

**Activity breakdown** (from `turn_metrics` table):
- Per category (13 categories from activity classifier): `category`, `cost_usd`, `turn_count`, `one_shot_percent`

**Model info**:
- Primary model name (from `session_init` event or `session_metrics.model`)
- Provider name (from `session.provider`)

### 3.3 Real-Time Updates

- **Mid-session (running)**: Stats update on each `usage_update` event. File list grows as `tool_end` events for Edit/Write arrive. Token counts, cost, turn count animate/transition smoothly.
- **Completed session**: All data is final. Show `ended_at` timestamp.

---

## 4. Existing Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| **StatCell** | `base/stat-cell/` | Individual metric tiles (cost, tokens, turns, duration). Supports `tone`, `icon`, `pulse` props. |
| **ProgressBar** | `blocks/session/ProgressBar.svelte` | Context window utilization, cache hit ratio bars |
| **Badge** | `shadcn/badge/` | File status indicators (added/modified/deleted), tool name labels |
| **Button** | `shadcn/button/` | `ghost × icon-sm` for expand/collapse, filter/sort controls |
| **Tabs** | `shadcn/tabs/` | If sub-tabs needed within Stats (unlikely — single scrollable view preferred) |
| **Separator** | `shadcn/separator/` | Between stat sections |
| **SimpleTooltip** | `shadcn/tooltip/` | Hover details on truncated paths, cache ratio explanation |
| **Skeleton** | `shadcn/skeleton/` | Loading placeholders while data fetches |
| **CostChart** | `blocks/usage/CostChart.svelte` | Potential reuse for token-over-time mini chart |
| **SessionStateBadge** | `blocks/session/SessionStateBadge.svelte` | State indicator if shown in stats |
| **ProviderChip** | `blocks/session/ProviderChip.svelte` | Provider display in stats header |

**CSS classes** from `tokens.css`:
- `.cb-panel` + `.cb-panel-title` — bracket-style `[HEADING]` for dense data sections
- `.cb-row` + `.cb-num` + `.cb-mute` — dense data rows with mono numbers
- `.cb-bar` / `.cb-bar-cool` / `.cb-bar-moss` — gradient bars for tool usage, activity
- `.gk-eyebrow` — 10.5px uppercase section labels
- `.gk-small` — 12px body text for secondary info
- `.font-mono` — monospace for all numbers, file paths, costs

---

## 5. Components to Design

### Files Tab

| Component | Description |
|-----------|-------------|
| **FileSummaryBar** | Top bar: "12 files changed" + `+347 −89` in green/red + optional filter/sort. Stays fixed at top of scroll area. |
| **FileListItem** | Collapsed row: file path (right-truncated) + status badge (A/M/D/R) + `+N −N` stats. Click to expand diff. Chevron toggle. |
| **InlineDiffView** | Unified diff rendered inline below FileListItem when expanded. Line numbers (old/new gutter), green/red line highlights, context lines muted. Monospace. |
| **DiffHunkHeader** | `@@ -N,N +N,N @@` header with function/scope context. Muted background. |
| **HiddenLinesExpander** | "Show N hidden lines" clickable bar between visible hunks. |
| **BinaryFileIndicator** | "Binary file changed — cannot display diff" placeholder row. |

### Stats Tab

| Component | Description |
|-----------|-------------|
| **StatsHeader** | Session identity: model name + provider chip + duration + state. Compact single row. |
| **CostBreakdownPanel** | Total cost (prominent `$X.XXX`), cost-by-model table (when multi-model), cost-by-token-type breakdown (input/output/cache). Uses `cb-panel` styling. |
| **TokenSummaryPanel** | Input/output/cache-read/cache-write with bars showing relative proportions. Cache hit ratio as ProgressBar + percentage. |
| **SessionActivityPanel** | Turns, duration, start/end times, one-shot rate, edit turns, retries. Grid of StatCells. |
| **ToolUsageTable** | Rows: tool icon + name + call count + error count + avg duration + success rate. Inline horizontal bar fill for visual weight. Sorted by most-used. Uses `cb-row` styling. |
| **ActivityBreakdownTable** | Per-category rows: category label + cost + turn count + one-shot %. Inline bar fill. Uses `cb-row` styling. |

---

## 6. Layout & Dimensions

### Files Tab Layout

```
┌──────────────────────────────────────────────┐
│ FileSummaryBar (sticky top)                  │
│  "12 files changed  +347 −89"  [Sort ▾]     │
├──────────────────────────────────────────────┤
│ ─ scrollable file list + inline diffs ─      │
│                                              │
│ ▸ src/lib/components/Foo.svelte  M  +12 −3  │
│ ▾ src/lib/utils/bar.ts           M  +45 −8  │
│   ┌─────────────────────────────────────┐    │
│   │ @@ -10,6 +10,8 @@ function bar()   │    │
│   │  10 │  10 │  unchanged line        │    │
│   │     │  11 │+ added line            │    │
│   │  11 │     │- removed line          │    │
│   │  12 │  12 │  unchanged line        │    │
│   └─────────────────────────────────────┘    │
│ ▸ src/new-file.ts                A  +28      │
│ ▸ src/old-file.ts                D      −15  │
│                                              │
│                              (pb-36 for FAB) │
└──────────────────────────────────────────────┘
```

- **Full available width** — diffs benefit from horizontal space. No 900px constraint.
- File list and diffs share a single scroll container.
- `FileSummaryBar` sticky at top of scroll area.
- Diff view uses monospace font, 13px line height. Line number gutters: ~48px each (old + new).
- Padding: `px-4` horizontal, consistent with chat view alignment.

### Stats Tab Layout

```
┌──────────────────────────────────────────────┐
│            max-width: 900px centered          │
│                                              │
│ [COST]                                       │
│  $4.387 total                                │
│  ┌──────────────────────────────────────┐    │
│  │ claude-4-opus   $3.20   73%         │    │
│  │ claude-4-sonnet $1.19   27%         │    │
│  │ Input: 142K × $15/M = $2.13        │    │
│  │ Output: 18K × $75/M = $1.35        │    │
│  │ Cache read: 89K × $1.5/M = $0.13   │    │
│  └──────────────────────────────────────┘    │
│                                              │
│ [TOKENS]                                     │
│  Input: 142,380  Output: 18,042              │
│  Cache read: 89,100  Cache write: 12,400     │
│  Cache hit: ██████████░░░░ 71%               │
│  Context:   ████████░░░░░░ 54%               │
│                                              │
│ [ACTIVITY]                                   │
│  ┌────┬────┬──────┬────────┐                 │
│  │ 47 │1h23│ 12:41│ Running│ turns/dur/start │
│  │ 82%│ 31 │  3   │        │ 1-shot/edits/rt │
│  └────┴────┴──────┴────────┘                 │
│                                              │
│ [TOOLS]                                      │
│  Edit     ████████████░  31  98% ✓           │
│  Read     ██████████░░░  28  100%✓           │
│  Bash     ████████░░░░░  22  86% ✓           │
│  Grep     ██████░░░░░░░  18  100%✓           │
│  ...                                         │
│                                              │
│ [ACTIVITY BREAKDOWN]                         │
│  Implementation  $2.10  22 turns  77%        │
│  Testing         $0.89  12 turns  83%        │
│  Debugging       $0.72   8 turns  62%        │
│  ...                                         │
│                              (pb-36 for FAB) │
└──────────────────────────────────────────────┘
```

- **900px max-width centered** — matches Chat tab column width for visual consistency across tab switches.
- Single scrollable column. No sub-tabs — all stats visible in one scroll.
- Section headings use `cb-panel-title` bracket style `[HEADING]`.
- Numbers use monospace font with `tabular-nums` for alignment.
- Padding: `px-6 pt-4 pb-36` matching chat view.

---

## 7. States & Interactions

### Files Tab States

| State | Visual | Trigger |
|-------|--------|---------|
| **Empty** | "No files changed yet" centered message with file-plus icon | Session just started or read-only session |
| **Accumulating (live)** | File list grows as tool events arrive. New files animate in. Existing file stats update (additions/deletions change) | Session running, `tool_end` events for Edit/Write |
| **Session complete** | Full file list, all diffs available. Summary bar shows final counts | Session state = finished |
| **Loading diffs** | Skeleton placeholder in expanded diff area | User expands a file, diff data fetching |
| **Large changeset (50+ files)** | Virtualized list. "Expand all" disabled with tooltip "Too many files — expand individually" | Many files changed |
| **Binary file** | "Binary file changed — cannot display diff" in muted text | Binary file detected |
| **Deleted file** | All lines shown as removed (red). Header badge: `D` | File removed |
| **Renamed file** | Header shows `old/path → new/path`. Badge: `R` | Renamed/moved |
| **Sidebar open/closed** | Content area adjusts width. Diff lines may wrap or scroll horizontally | User toggles sidebar |

**Interactions**:
- Click FileListItem chevron → expand/collapse inline diff
- Click file path → copy to clipboard (with toast)
- "Expand all" / "Collapse all" button in FileSummaryBar
- Sort options: by path (default), by change size, by change type
- Filter: by change type (added/modified/deleted)
- Right-click file → "Open in Editor" (Tauri command), "Copy Path"

### Stats Tab States

| State | Visual | Trigger |
|-------|--------|---------|
| **Mid-session (running)** | Cost and token numbers update on each `usage_update` event. Values transition/animate between updates. "Running" shown instead of end time. Activity panel shows live duration counter | Session state = running |
| **Empty** | "Session spawned — no turns yet" centered message | Session has no turns |
| **Completed** | All metrics finalized. End timestamp shown. Duration shows final value | Session state = finished/errored |
| **No pricing** | Cost shows "N/A" with warning badge. Token counts still shown | `pricing_available = false` or unknown model |
| **Loading** | Skeleton placeholders for all stat panels | Initial data fetch |
| **Sidebar open/closed** | Content stays centered within available width | User toggles sidebar |

**Interactions**:
- Click total cost → navigates to `/usage` with session filter pre-applied (via `CostLink` pattern from PRD #93)
- Hover on cache hit ratio → tooltip explaining what cache tokens are
- Click tool name in tool usage → future: filter chat to show only that tool's calls
- Copy button on cost value → clipboard

---

## 8. Design Constraints (Non-Negotiable)

- **Tab content area only** — must NOT render session top bar, tab strip, sidebar, or floating input panel. These belong to the session view layout.
- **Font**: Geist (sans) for labels, Geist Mono for numbers, paths, and diff content.
- **Forest Moss palette**: Green for additions, red for removals. Use `--status-success` / `--status-danger` tokens, not hardcoded colors.
- **Button sizing**: `.gk-btn-sm` (26px) for all actions. No inline height overrides.
- **Badge sizing**: `.gk-badge` (20px) for file status indicators.
- **OKLCH color space**: All custom colors via CSS custom properties.
- **Dark theme primary**: Light theme supported but secondary.
- **No inline file editing or commenting** — out of scope for v1.
- **No side-by-side diff** — unified only for v1. Side-by-side is a future enhancement.
- **Responsive to sidebar state**: Content must look good at both ~full-width (sidebar collapsed, 44px) and ~reduced-width (sidebar expanded, 272px).
- **Semantic tokens only** — never hardcode `bg-green-500`, always `text-status-success`.
- **Bottom padding**: `pb-36` to accommodate floating input panel.

---

## 9. Design Freedom

Designers have creative latitude in:

- **Files tab**: File list density (compact rows vs cards), expand/collapse animation style, diff line highlight intensity, how the summary bar looks
- **Stats tab**: Section visual treatment — can use `cb-panel` bracket headings, `StatCell` grid, or plain `gk-card` sections. Mix is OK
- **Cost visualization**: Prominent number vs breakdown-first vs pie chart
- **Token visualization**: Bars vs stacked chart vs numeric grid
- **Tool usage**: Table with inline bars, horizontal bar chart, or compact rows with `cb-bar`
- **Activity breakdown**: Table, segmented bar, or treemap
- **Empty states**: Illustration style and messaging tone
- **Diff syntax highlighting**: Color choices for keywords, strings, comments within Forest Moss bounds
- **Section ordering in Stats**: Cost first (recommended) or activity first
- **Diff line number style**: Gutter background, separator treatment
- **Number animations**: Counter scroll, fade, or instant update during live sessions

Must preserve: Forest Moss palette, Geist/Geist Mono fonts, 26px button height, 900px Stats column, monospace for all numeric data.

---

## 10. Inspiration

- **GitHub PR Files tab** — primary reference for file list + expandable diffs
- **Claude.ai usage dashboard** — clean stat presentation with prominent cost
- **Linear issue activity panel** — compact stats layout
- **CodeBurn data panels** — `cb-panel`/`cb-row`/`cb-bar` for dense developer-facing data
- **Issue Card v2 info density** — the `IssueCardInfoRows` pattern of cramming useful data into small spaces
- **Variant D (existing)** — single-column feed with expandable file cards + stacked metric cards. 900px centered, mobile-friendly
- **Variant E (existing)** — dashboard-overview-first with 3x2 metric tile grid, donut chart for file types, accent-colored tiles. More visual, less dense

---

## 11. Data Flow

### Files Tab Data Source

```
Session running:
  SessionEvent (tool_start/tool_end where tool_name ∈ {Edit, Write})
  → frontend accumulates FileChange[] in component state
  → each tool_end for Edit provides: file_path, additions, deletions
  → each tool_end for Write provides: file_path (treat as "added" if new)

Session complete:
  invoke('get_session_file_changes', { sessionId })
  → Rust runs git diff against the session's worktree
  → returns definitive FileChange[] with full diff hunks

Expand file:
  invoke('get_session_file_diff', { sessionId, filePath })
  → returns unified diff string for that file
```

**Note**: `get_session_file_changes` and `get_session_file_diff` Tauri commands do not exist yet — they must be implemented. During active sessions, file changes are derived from tool events. After completion, the git-based approach is authoritative.

### Stats Tab Data Source

```
Session running:
  SessionEvent.usage_update → live cost, tokens, turns, duration
  → frontend updates displayed values on each event

Session complete (or on-demand):
  invoke('get_session_metrics', { sessionId })
  → returns session_metrics row (cost, tokens, turns, duration, etc.)

  invoke('get_session_tool_usage', { sessionId })
  → returns tool_usage rows grouped by tool_name

  invoke('get_session_activity_breakdown', { sessionId })
  → returns turn_metrics grouped by category
```

**Note**: `get_session_metrics`, `get_session_tool_usage`, `get_session_activity_breakdown` may need to be added as dedicated Tauri commands. Currently the usage dashboard queries are workspace-scoped, not session-scoped. The `session_metrics`, `turn_metrics`, and `tool_usage` tables already exist with all required columns.

---

## 12. Mockup Rendering Instructions

**For mockup HTML files**: Show the full session view shell (top bar with tabs, sidebar in expanded state) as read-only context at ~40% opacity. The designed tab content fills the area below the top bar and to the left of the sidebar. Render two separate views: one with the Files tab active, one with the Stats tab active.

**Token import**: Inline `tokens.css` from `designs/tokens.css`. Use `gk-root theme-dark` wrapper. Geist + Geist Mono via Google Fonts CDN.

**Variant HTML files**: Place in `designs/session-files-stats/variants/variant-{letter}.html`.

---

## 13. Not Included in This Design

- Chat tab content, tool cards, streaming text → `SessionChatView.svelte`
- Sub-agent tree, provider info, quotas → `SessionSidebar.svelte`
- Session top bar, tab strip → `SessionTopBar.svelte`
- Floating input panel → `FloatingInputPanel.svelte`
- File editing / inline comments on diffs (future v2)
- Side-by-side diff toggle (future v2)
- Session search / full-text search within files tab (future)
- Diff view syntax highlighting beyond added/removed coloring (future v2 — could use Shiki)
