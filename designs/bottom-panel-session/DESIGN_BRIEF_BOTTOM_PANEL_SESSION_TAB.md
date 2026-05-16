# Bottom Panel Session Tab — Design Brief

Design spec for the session monitoring view inside the bottom panel. The "Session" tab shows sessions for the active issue — status, cost, transcript preview, quick actions — without navigating away from the workspace dashboard. This is a DATA-HEAVY panel: use CodeBurn panel styles (`cb-panel`, `cb-row`, `cb-bar`) for dense information display.

**GitHub issue**: #164 — Wire bottom panel session tab with compact issue-scoped view
**Parent PRD**: #90 — Session Management & Chat UI

---

## 1. Purpose

The bottom panel occupies ~75% of viewport height when expanded. The Session tab gives at-a-glance monitoring of the active issue's sessions:

- **Check progress** — see what the AI is doing without opening the full session page
- **Quick reply** — send a message or approve a tool request inline
- **Monitor cost** — track spend, tokens, turns in real time
- **Jump to full view** — one click to open SessionChatView (full-page session)

This is NOT a replacement for the full session view. It is a compact monitoring + quick-interaction surface optimized for information density.

---

## 2. Surrounding Context (Full Viewport)

Mockups MUST render the complete viewport to show where this component lives:

| Zone | Description | Size |
|------|-------------|------|
| **Left sidebar** | Dashboard sidebar — logo, workspace selector, 5 nav items (Issues/Forest/Sessions/AI Config/Settings), theme/lang/user sections | 240px fixed |
| **Top bar** | Workspace title, controls | Full width, ~44px |
| **Forest view** | Tree visualization, visible but small | ~25% of remaining height |
| **Bottom panel** | Tab bar + content. "Session" tab ACTIVE (highlighted) | ~75% of remaining height |

The bottom panel tab bar shows: Issues, Kanban, Issue Detail, Dependencies, Activity, **Session** (active), Assigned Issues. Tab bar renders at top of the panel using the existing `Tabs` component from shadcn-svelte. The session tab content fills all space below the tab bar.

**Mockup rendering rule**: Show the surrounding chrome (sidebar, top bar, forest, tab bar) at ~40% opacity as read-only context. The designed component fills the content area below the active "Session" tab. Do NOT duplicate the tab bar or panel chrome — the parent `WorkspaceBottomPanel` owns those.

---

## 3. Requirements

### 3.1 Data Model

The Session type (from `src/lib/types/generated/Session.ts`):

```typescript
type Session = {
  id: string;
  issue_id: string | null;
  provider: string;                    // "claude-code" | "open-code" | "codex" | "cursor"
  state: SessionState;                 // "running" | "needs-input" | "needs-review" | "paused" | "finished" | "errored"
  pid: number | null;
  cli_session_id: string | null;
  started_at: string;
  ended_at: string | null;
  cost_usd: number | null;
  token_count: number | null;
  original_intent: string | null;
  last_prompt: string | null;
  last_response_summary: string | null;
  execution_phase: ExecutionPhase;     // "none" | "analyzing" | "tdd" | "reviewing" | "verifying" | "committing"
  source: SessionSource;               // "spawned" | "adopted"
  working_directory: string | null;
};
```

Sessions are accessed via `useSessions().sessionsByIssueId` — a `SvelteMap<string, Session[]>` keyed by issue ID. The active issue ID comes from `useSelection().activeIssueId`.

### 3.2 Session Selector / Switcher

When the active issue has multiple sessions, the user must switch between them:

- Show each session: provider icon + start time (relative, e.g. "2h ago") + state badge
- Active/selected session highlighted
- Sort: running sessions first, then by most recent `started_at`
- "Spawn Session" button or "+" icon to create a new session
- When only one session exists, skip the selector — show it inline

**Implementation**: Use a compact horizontal row or dropdown. NOT a vertical list — horizontal space is abundant, vertical space is premium.

### 3.3 Session Status Summary

Always visible without scrolling. Use `cb-row` style for dense metric display:

| Metric | Source | Display |
|--------|--------|---------|
| **State badge** | `session.state` | Use `SessionStateBadge` component — tone + dot (pulsing for running/needs-input) |
| **Execution phase** | `session.execution_phase` | Show when not "none": `ANALYZING`, `BUILDING`, `REVIEWING`, `VERIFYING`, `SHIPPING` |
| **Provider** | `session.provider` | Use `ProviderChip` component — icon + name |
| **Model** | Derived from provider config | Short: "Opus 4.7", "Sonnet 4.5" |
| **Cost** | `session.cost_usd` | USD format: `$1.24` |
| **Tokens** | `session.token_count` | Compact: `42.3k` |
| **Duration** | `started_at` → now (or `ended_at`) | Relative: `12m`, `1h 23m` |
| **Last activity** | Derived from events | Relative timestamp: `2m ago` |

Use `StatCell` for key metrics (cost, tokens, duration) where the value-label format fits. Use `cb-row` + `cb-num` + `cb-mute` classes for dense supplementary data.

### 3.4 Compact Message Preview

Shows the tail end of the session transcript — enough to see recent activity:

- Last 2-4 messages (user + assistant), vertically stacked
- Messages truncated: single-line or 2-line clip with CSS `line-clamp`
- **Tool calls**: single-line compact entries — icon + tool name + status (pass/fail/running). Header height 36px (shared standard from `SESSION_CHAT_VIEW.md`)
- **Older messages dimmed**: `opacity: 0.4` for content before the last exchange. Hover restores full opacity (`150ms ease-out` transition, entire turn restores as a unit)
- **Needs-input state**: Approval card visible inline — Allow / Deny buttons actionable directly from the bottom panel. Use amber/warning left-border accent per variant-d pattern
- Scroll: message area scrolls independently. Auto-scrolls to bottom on new messages

### 3.5 Chat Input

Pinned at the bottom of the panel — never scrolls away:

- Single-line input that expands to 2-3 lines max (`Textarea` with `rows=1`, `max-rows=3`)
- Send button (morphs to Stop when session is running, per `SendStopButton` component)
- Slash command autocomplete active (same "/" hints as full session)
- Input disabled when session is finished or errored
- Uses `gk-input` height (32px) for the input field

### 3.6 "Open Full Session" Link

- Always visible — NOT hidden in overflow or behind a menu
- Navigates to `/sessions/{sessionId}` — full SessionChatView with chat, sidebar, tabs
- Placement: header area, right-aligned. Icon + text: "Open Full View" or expand icon
- Must feel like an obvious escape hatch for deeper investigation

### 3.7 Spawn Session

- "Spawn Session" CTA when no sessions exist for the active issue
- Opens the session spawn dialog (same dialog used everywhere, pre-populated with issue context)
- "+" button in session selector header for additional sessions

---

## 4. Existing Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `SessionStateBadge` | `blocks/session/SessionStateBadge.svelte` | State badge with tone + pulsing dot |
| `ProviderChip` | `blocks/session/ProviderChip.svelte` | Provider icon + name pill |
| `ProgressBar` | `blocks/session/ProgressBar.svelte` | Compact progress indicator |
| `SendStopButton` | `blocks/session/SendStopButton.svelte` | Send/Stop morph button |
| `StatCell` | `base/stat-cell/StatCell.svelte` | Metric display (label + value + suffix) |
| `StatusRow` | `base/status-row/StatusRow.svelte` | Active/inactive status indicator with dot |
| `Badge` | `shadcn/badge/Badge.svelte` | Status pills, labels |
| `Button` | `shadcn/button/Button.svelte` | All actions — `gk-btn-sm` (26px) |
| `Tabs` | `shadcn/tabs/` | Parent tab bar (NOT duplicated — owned by `WorkspaceBottomPanel`) |
| `Textarea` | `shadcn/textarea/Textarea.svelte` | Chat input field |

**CSS classes from `tokens.css`**:
- `cb-panel` + `cb-panel-title` — bracket-style `[HEADING]` panel containers
- `cb-row` + `cb-num` + `cb-mute` — dense data rows with monospace numbers
- `cb-bar` / `cb-bar-cool` / `cb-bar-moss` — gradient progress bars
- `gk-badge` variants — `gk-badge-success`, `gk-badge-warning`, `gk-badge-danger`, `gk-badge-info`
- `gk-body` (13px) for message text, `gk-small` (12px) for timestamps/metadata, `gk-tiny` (11px) for secondary labels
- `font-mono` for technical data (cost, tokens, timestamps)

---

## 5. Components to Design

| Component | Description |
|-----------|-------------|
| **SessionPanelView** | Top-level container for the session tab content. Orchestrates layout: status bar + message preview + input |
| **SessionPanelHeader** | Horizontal bar: session selector (when multiple), status summary, "Open Full View" link |
| **SessionPanelMetrics** | Dense metric row using `cb-row` / `StatCell`: cost, tokens, duration, last activity |
| **CompactMessageList** | Scrollable message preview area. Truncated messages, dimmed history, inline approval cards |
| **CompactToolCallRow** | Single-line tool call entry: icon + name + status. 36px height |
| **InlineApprovalCard** | Compact approval prompt: description + Allow/Deny buttons. Warning-tinted background |
| **SessionPanelInput** | Bottom-pinned chat input. Simplified version of `FloatingInputPanel` — no skill chips, no image carousel, no provider selector. Just textarea + send/stop |
| **EmptySessionState** | Empty state when no sessions exist. "Spawn Session" CTA. Illustration optional |

---

## 6. Layout & Dimensions

### 6.1 Overall Structure

```
┌─────────────────────────────────────────────────────┐
│ [Session Selector] [StateBadge] [Phase] [Provider]  │ ← Header bar (~36-40px)
│ [Cost] [Tokens] [Duration] [LastActivity] [OpenFull]│
├─────────────────────────────────────────────────────┤
│                                                     │
│  Compact message preview (scrollable)               │ ← Flex-1 (fills remaining)
│  - dimmed older messages (opacity 0.4)              │
│  - tool calls as single-line rows                   │
│  - approval card when needs-input                   │
│  - last 2-4 messages at full opacity                │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [Textarea input...                    ] [Send/Stop] │ ← Pinned bottom (~40-48px)
└─────────────────────────────────────────────────────┘
```

### 6.2 Sizing Rules

- Panel height: user-resizable via drag handle. Design for 250-500px range (the bottom panel dominates at ~75% viewport)
- Full width of the content area (no max-width — this is a data panel, not a chat)
- Header: single row, no wrapping. Overflow: collapse less critical metrics first (duration, last activity)
- Message preview: flex-1, overflow-y-auto, scrollbar styled
- Input: fixed at bottom, never scrolls. `gk-input` height (32px) + padding = ~40-48px total
- All buttons: `gk-btn-sm` (26px height)
- All badges: `gk-badge` (20px height)

### 6.3 Responsive Behavior

At narrow widths (panel squeezed horizontally):
1. First: hide text labels on metrics, keep icons + values
2. Then: collapse session selector to dropdown instead of horizontal tabs
3. Then: stack metrics into 2 rows instead of 1

At short heights (panel collapsed):
1. Message preview shrinks first (min-height: 80px)
2. Input always visible
3. Header always visible
4. Below ~120px total: show only header + "expand panel" hint

---

## 7. States & Interactions

### 7.1 Initial Variant States (Show in First Mockup Round)

For the initial variants, show:

- **Two sessions** for the active issue: one running, one finished
- **Running session selected** with 2-3 recent messages visible
- Session cost (`$1.24`), tokens (`42.3k`), duration (`12m`) shown
- Execution phase: `ANALYZING` chip visible
- One compact tool call row in the message preview

### 7.2 Full State Matrix (Design After Variant Selection)

| State | Behavior |
|-------|----------|
| **No sessions** | Empty state with "Spawn Session" CTA. Brief explanation text |
| **Single session** | No session selector needed. Header shows status inline |
| **Multiple sessions** | Horizontal session tabs or dropdown. Active session highlighted |
| **Running** | State badge pulsing green. Input enabled. Stop button visible. Auto-scroll on new messages |
| **Needs-input** | Amber pulsing badge. Inline approval card in message area. Allow/Deny buttons. Input enabled for text responses |
| **Needs-review** | Blue badge. Message preview shows last assistant output. Input enabled |
| **Stopped** | Gray badge. Input enabled (resume). No auto-scroll |
| **Finished** | Primary badge. Input disabled. "Session complete" summary. Cost/token final totals |
| **Errored** | Red badge. Error message shown prominently. "Retry" or "Spawn New" action |
| **No active issue** | "Select an issue to view its sessions" placeholder |
| **Loading** | Skeleton shimmer on header metrics + message area |

### 7.3 Interaction Flows

- **Click session tab** → switch displayed session, load its messages
- **Send message** → append user message, auto-scroll, await response
- **Click Stop** → `terminateSession(sessionId)`, badge transitions to "stopped"
- **Click Allow/Deny** → `respondToRequest(sessionId, requestId, decision)`, approval card collapses
- **Click "Open Full View"** → navigate to `/sessions/{sessionId}` (full SessionChatView)
- **Click "Spawn Session"** → open spawn dialog pre-populated with active issue context
- **Hover old message** → restore opacity from 0.4 to 1.0 (entire turn, 150ms ease-out)

---

## 8. Design Constraints (Non-Negotiable)

- **Standard component heights**: buttons 26px (`gk-btn-sm`), badges 20px (`gk-badge`), inputs 32px (`gk-input`). No inline height overrides
- **Container boundaries**: do NOT duplicate the tab bar, panel header, outer border, or resizer handle — `WorkspaceBottomPanel` owns those
- **Input pinned to bottom**: chat input must be visible without scrolling, always
- **All session metadata visible without scrolling**: state, provider, cost, duration — in the header, not behind scroll
- **Dark theme primary**: design for dark mode first, light mode supported via semantic tokens
- **Fonts**: Geist (sans) for UI text, Geist Mono for metrics/timestamps/code
- **Colors**: Forest Moss palette from `tokens.css`, OKLCH color space
- **No left colored accent border** (AI design cliche)
- **Tool card header height**: 36px (shared standard across all tool call displays)
- **Approval actions must be inline**: Allow/Deny for needs-input state must work directly from this panel — no redirect to full session required
- **Typography**: `gk-body` (13px) for messages, `gk-small` (12px) for metadata, `gk-tiny` (11px) for secondary labels, `font-mono` for all numeric/technical data

---

## 9. Design Freedom (Creative Latitude)

Designers may explore:

- **Metric arrangement**: how cost/tokens/duration/activity are laid out in the header — StatCell grid, inline cb-row, horizontal badges, etc. All must be visible without scrolling
- **Session selector treatment**: horizontal mini-tabs, dropdown, segmented control, vertical sidebar strip
- **Message preview styling**: chat bubbles (compact), log-style rows (variant-d pattern), card-based entries
- **History dimming approach**: opacity gradient, hard divider with timestamp label, progressive fade
- **Tool call visualization**: icon-only pills, text rows, collapsible groups
- **"Open Full View" placement and style**: icon button, text link, header action, floating corner button
- **Approval card layout**: full-width alert bar, inline card with actions, floating toast-like prompt
- **Empty state illustration**: forest-themed placeholder, minimal text, animated seedling
- **Metric color coding**: which metrics get color accents (cost thresholds, state-based coloring)
- **Transition animations**: session switching, message arrival, state changes

Designers must preserve:
- All required data visible per section 3
- Component heights from tokens.css
- Container boundaries per section 2
- Input pinned at bottom
- CodeBurn density aesthetic — this is a data panel, not a spacious chat

---

## 10. Inspiration & Quality Bar

- **Issue Card v2 Final Decisions** (`designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md`) — the quality bar for specification completeness. State cascade, component architecture, settings, variant plan
- **Variant D (Notification Stream)** — log-style grid layout, inline approval actions, dimmed/recent divider. Good density model
- **Variant E (Mini Dashboard)** — metric tiles as primary focus, compact header row with session selector. Good monitoring model
- **CodeBurn data panels** (`cb-panel`, `cb-row`, `cb-bar`) — bracket-style headings, dense data rows, gradient bars. The visual language for data-heavy views in Grovekeeper
- **Full SessionChatView** — the parent design this compact view mirrors. Same visual language, compressed scale

---

## 11. Variant Feedback from Previous Rounds

### Variant D (Notification Stream)
- Strengths: excellent density, log-style scanning, inline approval
- Keep: 3-column grid (timestamp | icon | summary), left-border accent on approval rows
- Explore: can this density work for quick monitoring without losing readability?

### Variant E (Mini Dashboard)
- Strengths: metrics-first approach, monitoring-optimized
- Keep: 4-column metric tiles, dense header row
- Explore: combine metrics prominence with a message preview for context

**Direction for new variants**: Blend the best of both — metric density from E + event readability from D. The panel has ample vertical space (~75% viewport) so both can coexist.

---

## 12. Not Included (Out of Scope)

- **Full session view** → `SessionChatView.svelte` + `SESSION_CHAT_VIEW.md`
- **Session spawning dialog** → separate component, invoked from this panel's "Spawn" button
- **Bottom panel chrome / tab bar** → owned by `WorkspaceBottomPanel.svelte`
- **Session sidebar** (metrics, sub-agents, model selector) → full session view only
- **Session history search** → not in this panel
- **Floating input panel** (skills row, image carousel, provider selector) → full session view only. This panel gets a simplified input
- **Session list page** → separate route for browsing all sessions across issues
