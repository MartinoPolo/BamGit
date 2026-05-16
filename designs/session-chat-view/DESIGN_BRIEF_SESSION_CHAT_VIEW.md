# Session Chat View — Design Brief

The primary session detail interface where users interact with AI coding agents through a message stream. Displays conversation history, tool execution, sub-agent activity, session metrics, and a floating input panel for composing messages with skill shortcuts and model/permission controls. This is a MAJOR feature — the primary way users interact with running sessions.

**PRD**: #90 (Session Management & Chat UI)
**Gold standard reference**: `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md`
**Design system**: `designs/DESIGN_SYSTEM.md` + `claude_design/tokens.css`

---

## 1. Purpose

- **Session interaction**: Compose messages, execute skills, approve/deny tool usage, answer agent questions, attach images
- **Transcript viewing**: Browse full conversation history with markdown, code blocks, tool cards, inline images
- **Real-time monitoring**: Watch streaming responses, track context window utilization, cost, token counts, quota consumption
- **Sub-agent inspection**: Navigate the sub-agent tree, expand inline messages at spawn points
- **Session control**: Switch models/modes, change permission settings, stop/resume, open in native CLI

---

## 2. Surrounding Context

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ┌──────┐ ┌──────────────────────────────────────────────┐ ┌──────────────┐ │
│ │      │ │ TOP BAR (full width)                         │ │              │ │
│ │      │ │ [←] Title [● Running]   branch · #90 · PR #5 │ │              │ │
│ │ LEFT │ ├──────────────────────────────────────────────┤ │    RIGHT     │ │
│ │ NAV  │ │                                              │ │   SIDEBAR    │ │
│ │ 240px│ │  ┌─ 900px content column ─┐                  │ │   272px /    │ │
│ │      │ │  │ Message stream         │                  │ │   44px       │ │
│ │ Sess-│ │  │ (turns, tool cards,    │                  │ │              │ │
│ │ ions │ │  │  sub-agent expansions) │                  │ │ Provider     │ │
│ │ HIGH-│ │  │                        │                  │ │ Quotas       │ │
│ │ LIGHT│ │  │                        │                  │ │ Metrics      │ │
│ │ ED   │ │  └────────────────────────┘                  │ │ Sub-Agents   │ │
│ │      │ │  ┌─ Gradient fade ────────┐                  │ │              │ │
│ │      │ │  ┌─ Floating input panel ─┐                  │ │              │ │
│ │      │ │  │ Skills · Textarea      │                  │ │              │ │
│ │      │ │  │ Controls · Send/Stop   │                  │ │              │ │
│ │      │ │  └────────────────────────┘                  │ │              │ │
│ └──────┘ └──────────────────────────────────────────────┘ └──────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Left**: Dashboard sidebar (240px) — same nav items, "Sessions" highlighted as active. This sidebar is provided by the app shell, NOT part of this component.
- **Main area**: Session chat content — top bar + 900px max-width content column centered in remaining space
- **Right sidebar**: 272px expanded / 44px collapsed — provider info, usage quotas, context progress, sub-agent tree
- **Bottom**: Floating input panel with gradient fade mask
- **NO forest view** — this is not the dashboard page
- **NO topbar** from the dashboard — a session-specific top bar replaces it

Key decision (from DECISIONS.md): "right sidebar + 900px content column" — app-level left nav occupies left, so metadata goes right.

---

## 3. Requirements

### 3.1 Message Types

| Type | Alignment | Visual Treatment |
|------|-----------|-----------------|
| **User** | Right-aligned bubble, max 75% of content column | `bg-primary-soft`, rounded `14px 14px 4px 14px`, user avatar circle |
| **Assistant** | Left-aligned, full-width within content column | Full markdown rendering (headers, lists, bold/italic, tables, inline code, links, code blocks) |
| **System** | Centered, muted | 11px text, `opacity-70`, subtle divider treatment |
| **Tool** | Inline between assistant segments | 3-level card system (see section 3.2) |

### 3.2 Tool Cards — 3-Level System

Typical session has 50-200+ tool cards. Progressive disclosure is critical.

**Level 1 — Compact** (default for completed tools):
Single line, 36px tall. Tool icon + tool name + key detail + output size label + duration + status icon. Subdued opacity (80%), click to expand. Already implemented in `ToolCardCompact.svelte`.

**Level 2 — Expanded** (auto for running tools, user-toggleable):
Same header as L1 plus content panel below. Left accent border in tool-specific color. Scrollable content, max ~260px tall. Truncation with "Show more" for long outputs. Already implemented in `ToolCardExpanded.svelte`.

**Level 3 — Interactive** (auto-activated, full-width):
Three sub-types, all implemented:
- **Permission Prompt** (`ToolCardPermission.svelte`): Amber accent, "Agent wants to use [Tool]", Allow (Enter) / Allow Always (Ctrl+Enter) / Deny (Esc)
- **Elicitation Prompt** (`ToolCardElicitation.svelte`): Info/blue accent, MCP server name + message, text input + Submit/Cancel
- **Ask User Question** (`ToolCardAskUser.svelte`): Neutral accent, question + radio button options, arrow key navigation, Enter confirms

**Per-Tool Visual Identity** (from `tool_card_utils.ts`):

| Tool | Icon | Accent Color | Key Detail | Output Label |
|------|------|-------------|------------|-------------|
| Bash | Terminal | Green (145) | `$ command` preview | Exit code |
| Read | Eye | Blue (220) | File path | Line count |
| Write | Pencil | Amber (75) | File path | Size/"created" |
| Edit | Code | Orange (50) | File path + `+N -N` | Patch line counts |
| Glob | FolderSearch | Azure (250) | Pattern | File count |
| Grep | Search | Purple (320) | Pattern | Match + file count |
| Agent | CPU | Indigo (280) | Sub-agent name + model | Tool count + duration |
| WebSearch | Globe | Teal (165) | Query | Result count |
| WebFetch | ArrowDown | Coral (30) | URL (truncated) | HTTP status + size |
| TodoWrite | List | Green (120) | --- | Item count |
| Task | Settings | Muted (280) | Description | Duration + status |

**Card Grouping**: When 5+ consecutive tool calls fire, render as a collapsible group ("{N} tool calls"). Already implemented in `ToolCardGroup.svelte`.

### 3.3 Sub-Agent Display

- Sidebar tree view (`SubAgentTree.svelte` + `AgentTreeNode.svelte`) with per-node: name, model, status (running/completed/failed), tool count, duration
- Click a tree node to expand its messages **inline in the chat stream** at the spawn point (`SubAgentExpansion.svelte`)
- Colored left border (azure-400), nested expansions use progressive indentation
- Expanded section: sub-agent prompt + responses + L1/L2 tool cards
- Collapse button to close inline expansion

### 3.4 Streaming

- Text appears character-by-character with a blinking caret (`StreamingCaret.svelte`)
- Tool calls can appear mid-stream and resolve while the assistant continues
- Running tools auto-expand to L2
- Auto-scroll when user is near the bottom (implemented in `scroll_anchoring.ts`)

### 3.5 Content Dimming

Content above the last user message is visually dimmed (`opacity: 0.4`). Entire turn restores to full opacity on hover with `transition: opacity 150ms ease-out`. Implemented in `ContentDimmer.svelte`.

### 3.6 Image Handling — Session-Wide Numbering

- Numbering is session-wide and persistent: image #1 stays #1
- Paste/upload inserts `[Image #N]` pill in textarea; rendered inline via `InlineImage.svelte`
- Image carousel in the input panel (collapsed by default, auto-expands on paste, auto-collapses on send)
- Past images referenceable naturally in subsequent prompts

### 3.7 Quick Navigation

Floating sticky overlay buttons (`QuickNavButtons.svelte`):
- "Jump to latest response" — visible when scrolled above latest assistant message
- "Jump to latest prompt" — visible when scrolled above latest user message

---

## 4. Existing Components to Reuse

### Chat Components (`src/lib/components/blocks/chat/`)

| Component | Status | Lines | Notes |
|-----------|--------|-------|-------|
| `ChatMessage.svelte` | Implemented | 43 | Dispatcher — routes to UserBubble/AssistantMessage/ToolCard/SystemMessage based on role |
| `UserBubble.svelte` | Implemented | 25 | Right-aligned bubble, 75% max-width, user icon |
| `AssistantMessage.svelte` | Implemented | 23 | Markdown rendering, streaming mode with caret |
| `SystemMessage.svelte` | Implemented | 11 | Centered, muted, 11px |
| `ToolCardCompact.svelte` | Implemented | 53 | L1 — 36px single-line, clickable to expand |
| `ToolCardExpanded.svelte` | Implemented | 69 | L2 — header + scrollable content, accent border |
| `ToolCardPermission.svelte` | Implemented | 69 | L3 — amber accent, Allow/AllowAlways/Deny |
| `ToolCardElicitation.svelte` | Implemented | 94 | L3 — blue accent, MCP server, text input |
| `ToolCardAskUser.svelte` | Implemented | 88 | L3 — question + radio options |
| `ToolCardGroup.svelte` | Implemented | 47 | Collapsible group for 5+ consecutive tools |
| `CodeBlock.svelte` | Implemented | 67 | Syntax-highlighted, copy button, language badge |
| `StreamingCaret.svelte` | Implemented | 3 | Blinking cursor for streaming text |
| `InlineImage.svelte` | Implemented | 20 | Image with `#N` caption |
| `ContentDimmer.svelte` | Implemented | 18 | Opacity dimming with hover restore |
| `QuickNavButtons.svelte` | Implemented | 44 | Jump-to-latest sticky buttons |
| `tool_card_utils.ts` | Implemented | 80 | Per-tool icons, accent colors, detail/output extractors |

### Session Components (`src/lib/components/blocks/session/`)

| Component | Status | Lines | Notes |
|-----------|--------|-------|-------|
| `SessionChatView.svelte` | Implemented | 287 | Main orchestrator — top bar + chat column + sidebar |
| `SessionTopBar.svelte` | Implemented | 103 | Title, state badge, git context, tabs, actions |
| `SessionSidebar.svelte` | Implemented | 233 | Expanded (272px) / collapsed (44px), provider + quotas + metrics + sub-agents |
| `FloatingInputPanel.svelte` | Implemented | 118 | Image carousel + skills + textarea + bottom controls |
| `SkillChipsRow.svelte` | Implemented | 38 | Execute/Review/Check&Fix/Commit/Ship + More |
| `SendStopButton.svelte` | Implemented | 32 | Morph between Send (primary) and Stop (danger) |
| `ProgressBar.svelte` | Implemented | 25 | Colored fill bar with threshold support |
| `ProviderChip.svelte` | Implemented | 25 | Provider icon + name, clickable |
| `SessionStateBadge.svelte` | Implemented | 18 | State-colored badge with optional pulse dot |
| `SubAgentTree.svelte` | Implemented | 19 | Tree container, delegates to AgentTreeNode |
| `AgentTreeNode.svelte` | Implemented | 98 | Recursive tree node — expandable, depth indentation |
| `SubAgentExpansion.svelte` | Implemented | 46 | Inline sub-agent messages with azure left border |
| `session_theme_utils.ts` | Implemented | 63 | Badge configs, color thresholds, provider configs |
| `sub_agent_types.ts` | Implemented | 9 | SubAgent interface (recursive children) |

### Base Components

- **Button**: `gk-btn-sm` (26px) for input panel controls, `gk-btn-icon-sm` for toolbar/overflow
- **Badge**: `.gk-badge-success` (running pulse), `.gk-badge-warning` (needs-input), `.gk-badge-danger` (errored), `.gk-badge-info` (stopped), `.gk-badge` for counts
- **Form controls**: `Input` for elicitation, `Textarea` for composer
- **Card**: `Card.Card` for tool cards and message grouping
- **Tabs**: `Tabs.Root` + `Tabs.Tab` for Chat/Files/Stats
- **RadioGroup**: for Ask User question options
- **Kbd** / **KbdGroup**: keyboard hint badges on action buttons
- **Separator**: between top bar action groups
- **SimpleTooltip**: for toolbar button hints

### Utility Modules

- `chat_message_builder.ts`: builds ChatMessage from session events, groups into turns
- `scroll_anchoring.ts`: auto-scroll logic, jump-to-latest detection
- `markdown_renderer.ts`: markdown to HTML (used by AssistantMessage)
- `chat_message_types.ts`: ChatMessage, ChatTurn, MessageRole, ToolStatus, InteractionType constants

---

## 5. Components to Design

Gaps in the current component set — these need design work for mockups:

| Component | Description | Priority |
|-----------|-------------|----------|
| **Session Empty State** | "No messages yet" state for just-spawned sessions. Provider icon, prompt suggestions, skill shortcuts | High |
| **Session Error Banner** | Full-width error card in the stream when session errors out. Red accent, error message, retry/dismiss actions | High |
| **Skill Configuration Panel** | Side drawer/modal for event-based skill assignment. Event list + skill picker + discovery path management | Medium |
| **Tools Popover** | Popover listing per-session toggles for MCP servers, skills, and tools | Medium |
| **Model/Provider Dropdown** | Combined provider + model + effort selector. Grouped sections, context window display | Medium |
| **Permission Mode Dropdown** | Simple 3-option dropdown (Approve each / Auto-accept edits / Bypass all) | Low |
| **Image Enlarge Preview** | Click thumbnail in carousel to see full-size. Lightbox or modal | Low |
| **Session Files Tab** | GitHub PR-style file diffs view (deferred to `SESSION_FILES_STATS_TABS.md`) | Deferred |
| **Session Stats Tab** | Session metrics dashboard (deferred to `SESSION_FILES_STATS_TABS.md`) | Deferred |

---

## 6. Layout & Dimensions

### Page-Level Layout

| Region | Width | Position | Notes |
|--------|-------|----------|-------|
| Dashboard sidebar | 240px | Left | App-level, NOT part of this component |
| Top bar | Full remaining width | Top | Spans chat column + right sidebar |
| Chat column | Remaining (fills space) | Center | Content constrained to 900px centered |
| Right sidebar | 272px / 44px | Right | Collapsible, border-left |
| Floating input | Max 900px | Bottom of chat column | Centered, 16px from bottom edge |

### Content Column (900px)

The message stream content and floating input panel share the **same max-width of 900px, centered**. No content extends wider than the input panel. Implemented via `max-w-225` (Tailwind, 900px) + `mx-auto`.

- Assistant messages: full 900px width
- User message bubbles: max 75% of 900px (675px)
- Tool cards: full 900px width
- Sub-agent expansions: full 900px width with left border indentation
- System messages: centered within 900px

### Right Sidebar

**Expanded (272px)**: Sections top-to-bottom with separator borders:
1. Header strip — collapse toggle (left-aligned, closest to content boundary)
2. Provider section — icon + name chip
3. Global usage — 5h + 7d quota progress bars
4. Session metrics — Context bar + Cost + Tokens
5. Sub-agents — section header + count badge + scrollable tree

**Collapsed (44px)**: Vertical strip:
1. Expand toggle
2. State pulse dot (uses state color)
3. Vertical context bar (4px wide, color-coded) + rotated percentage text
4. Sub-agent count (rotated text, bottom)

No cost in collapsed state (per user decision).

### Progress Bar Layout (Sidebar)

All bars in the sidebar align as a single vertical channel:
- Each row: `[label-column 52px]  [bar-fills-channel flex-1]  [value-column min-48px]`
- All four bars (5h, 7d, Context, plus future) share same width and alignment

### Progress Bar Color Thresholds

| Bar | Green | Orange | Red |
|-----|-------|--------|-----|
| Context | <40% | 40-60% | >60% |
| 5h quota | <60% | 60-85% | >85% |
| 7d quota | <60% | 60-85% | >85% |

### Floating Input Panel

- Max-width: 900px (or 80% of chat column, whichever smaller)
- Position: absolute bottom-16px, centered via `left-1/2 -translate-x-1/2`
- Rounded corners (`rounded-3.5`), subtle shadow, **solid opaque** surface background
- Gradient fade: 120px tall, `linear-gradient(transparent, var(--background))`, `pointer-events: none`, sticky bottom behind the input panel
- Drag-and-drop target for images and files

---

## 7. States & Interactions

### Page-Level States (Priority Order)

| # | State | Key Visual | Session State |
|---|-------|-----------|---------------|
| 1 | **Active, mid-conversation** | Messages streaming, L1/L2 tool cards, sub-agent tree populated | `running` |
| 2 | **Needs input** | L3 permission/elicitation card visible and focused, amber state badge pulsing | `needs-input` |
| 3 | **Empty / just spawned** | No messages, skill chips visible, sidebar with starter values, empty-state prompt | `running` (no messages yet) |
| 4 | **Errored** | Red state badge, error card in stream, sidebar shows errored state | `errored` |
| 5 | **Long conversation** | Content dimmed above last prompt, jump-to-latest buttons visible | `running` or `finished` |
| 6 | **Image attached** | Carousel expanded with thumbnails, `[Image #N]` pills in textarea | Any composing state |
| 7 | **Image carousel collapsed** | Thin strip showing "N images" button | Any state with images |
| 8 | **Sidebar collapsed** | 44px strip with expand toggle, state dot, vertical context bar, agent count | Any |
| 9 | **Quota warning** | 5h or context bar in red zone, possible toast notification | Any |
| 10 | **Long-text input** | Textarea expanded near 50vh, bottom controls still visible at panel bottom | Composing |
| 11 | **Needs review** | Info/blue state badge, review prompt in stream | `needs-review` |
| 12 | **Stopped** | Muted state badge, input panel enabled for resume | `paused` (displayed as "Stopped") |
| 13 | **Finished** | No pulse on badge, input panel disabled, "Session finished" system message | `finished` |
| 14 | **Tools popover open** | MCP servers, skills, tools with per-session toggles | Any |
| 15 | **Model dropdown open** | Grouped by provider, models with context windows and effort selection | Any |

### Tool Card States

| State | Visual |
|-------|--------|
| L1 completed | Subdued (80% opacity), single line |
| L1 hover | Full opacity |
| L2 auto-expanded (running) | Spinner in header, content updating live |
| L2 user-expanded | Static content, click header to collapse |
| L3 permission | Amber border, action buttons focused |
| L3 elicitation | Blue border, text input focused |
| L3 ask user | Neutral border, radio options navigable |
| Error | Red left border, XIcon status |
| Group collapsed | "{N} tool calls" with chevron |
| Group expanded | All cards visible with collapse button |

### Sub-Agent Tree States

| State | Visual |
|-------|--------|
| Empty | "No sub-agents spawned yet" placeholder |
| Single agent | No tree needed, flat node |
| Deep nesting (4+) | Progressive indentation, each level +14px |
| Many agents (15+) | Independent scroll within sub-agents section |
| Node hover | Background highlight |
| Node active (expanded inline) | `bg-primary-soft`, left border in `--primary` |
| Running node | Pulsing green dot |
| Completed node | Green check icon |
| Failed node | Red X icon |

### Scrolling Behavior

- Auto-scroll when user is within ~100px of bottom (threshold in `scroll_anchoring.ts`)
- New messages DON'T force-scroll if user has scrolled up to review history
- Quick-nav buttons appear when scrolled away from latest content
- Sub-agents tree scrolls independently from message stream
- Tool card L2 content scrolls independently (max-h-65)
- Image carousel scrolls horizontally

### Send/Stop Button Morph

- **Idle / waiting for input**: Send icon, primary color, `Enter` hint
- **Agent actively generating**: Stop icon (square), danger color, `Ctrl+C` hint
- Transition is instant (no animation)
- Returns to Send when agent finishes or is stopped

---

## 8. Design Constraints (Non-Negotiable)

- **900px max-width** for content column — shared between message stream and input panel
- **Right sidebar** for metadata (left is app nav) — 272px expanded, 44px collapsed
- **Floating input panel** — NOT a full-width bar. Rounded, elevated, centered
- **No blur overlays** (per DECISIONS.md — performance concern on weaker hardware)
- **Gradient fade** behind input panel — 120px, transparent to background, pointer-events: none
- **36px tool card headers** — all levels consistent
- **26px (gk-btn-sm)** for all input panel controls — skill chips and bottom controls same height
- **20px (gk-badge)** for all badges — no inline height overrides
- **32px (gk-input)** for all inputs — no inline height overrides
- **No inline height overrides** on any control — use design token sizes exclusively
- **No "Paused"** — display as "Stopped" (no native pause exists in CLIs)
- Dark theme primary; light theme supported
- WCAG contrast for all text
- Keyboard-first — every action accessible via keyboard
- Typography: Geist (sans) / Geist Mono (mono)
- OKLCH color space for all custom colors
- Must use existing base components (Button, Badge, Card, Tabs, etc.)

---

## 9. Design Freedom

Designers have creative latitude in these areas:

- **Tool card visual identity**: Specific icon designs, accent colors, and visual hierarchy per tool type (must remain distinguishable at L1)
- **Message bubble styling**: Exact padding, border-radius, shadow depth, hover effects
- **Floating input panel appearance**: Shadow intensity, border treatment, corner radius, elevation feel
- **Gradient fade curve**: Exact gradient stops and easing for bottom fade
- **Sub-agent inline expansion styling**: Border color progression for nested levels, indentation strategy
- **Micro-interactions**: Hover states, focus rings, transition timing, expansion/collapse animations (keep under 200ms)
- **Image carousel layout**: Thumbnail size, spacing, scroll behavior, `#N` caption placement
- **Empty state illustration**: Icon or illustration for "no messages yet" state
- **Skill chip styling**: Exact pill treatment, spacing, grouping
- **Top bar density**: Exact spacing between title/badge/git-context/actions
- **Sidebar section spacing**: Padding between provider/quota/metrics/sub-agents sections
- **Tool card group appearance**: Collapsed group line treatment, count badge style
- **Error card styling**: Banner vs card, icon choice, action button placement
- **Streaming caret**: Blink rate, color, shape

### Constraints on Freedom

- Must preserve content/input column width alignment (900px shared max-width)
- Must use documented component size variants (no inline height overrides)
- Must maintain progress bar vertical alignment in sidebar (all bars same width)
- Must keep tool card headers at 36px consistent height
- Must respect color thresholds for progress bars (Context, 5h, 7d)
- Must preserve keyboard shortcuts for all interactive elements

---

## 10. Inspiration

- **Claude.ai** — chat UX, composer with `+` for context, streaming, tool cards
- **ChatGPT 2026** — model selector at bottom-right of input area, message bubbles
- **Cursor 3.0** — pill-style controls in floating panel, agent panel with @ mentions
- **VS Code Copilot Chat** — tool call rendering, inline expansion
- **OpenCovibe** — 3-level tool card system, per-tool colors
- **GitHub PR Files view** — inspiration for Edit tool L2 content (inline diffs)
- **Issue Card v2** (`ISSUE_CARD_FINAL_DECISIONS.md`) — component quality bar, state cascade pattern, settings cascade, variant architecture, comprehensive state documentation

---

## Page Layout Specification

### 1. Top Bar

Single horizontal bar above both columns. Three groups:

**Left group**:
- Back button (ghost icon-sm) — navigates to session list
- Session title — issue title or first user message, truncated to ~60ch with ellipsis
- Session state badge — running/needs-input/needs-review/stopped/finished/errored. Color-coded (running pulse green, needs-input amber pulse, errored red)

**Center group (git context)**:
Single inline row, monospace:
- Branch name with git-branch icon
- Issue badge — `#90 open` (clickable)
- PR badge — `PR #5 draft` (clickable)
When window narrows: badges collapse to icon-only.

**Right group**:
- Open in CLI — secondary button with external-link icon. Spawns provider-appropriate resume command in terminal at worktree path.
- Overflow menu `[...]` — Export chat (enabled), Restart (disabled/coming-soon), Delete session (disabled/coming-soon). No Pause, no Stop (Stop is in the Send/Stop morph).
- Tab switcher: Chat (default) | Files | Stats

**Constraints**: No provider icon in top bar (lives in sidebar). No model/permission/cost fields in top bar.

### 2. Right Sidebar

See section 6 for full specification. Key elements:
- Collapse toggle left-aligned in header
- Provider chip (clickable, future provider switcher)
- 5h + 7d quota progress bars with countdown text
- Context progress bar + Cost + Tokens (session-scoped)
- Sub-agents section with count badge + scrollable tree

### 3. Message Stream

The primary content area between the top bar/tabs and the floating input panel.

Content rendered within the 900px centered column. Turn-based grouping:
- System messages (if any in the turn)
- User message (right-aligned)
- Assistant messages interleaved with tool cards
- Sub-agent inline expansions at spawn points

Code blocks: syntax-highlighted, monospace, language badge, copy button. Implemented in `CodeBlock.svelte`.

### 4. Floating Input Panel

See section 6 for positioning. Vertical structure:

**A. Image carousel** (collapsible) — collapsed strip or expanded thumbnails
**B. Skill chips row** — Execute, Review, Check & Fix, Commit, Ship + More. All `gk-btn-sm` (26px), rounded-full.
**C. Textarea** — 3 lines default, auto-grow to 50vh, slash autocomplete, @ mentions, image paste
**D. Bottom controls row** — two groups:
- Left: `[+ Attach]`, `[Tools ...]`
- Right: `[Local ...]`, `[Provider . Model . Effort ...]`, `[Approve each ...]`, `[Send/Stop]`

All buttons `gk-btn-sm` (26px). Send distinguished by primary/danger color only.

### 5. Sync Rules

- Provider, model, effort, permission mode are **session-level state**
- Sidebar Provider section reflects current provider (read-only)
- Sidebar shows NO model/permission/effort/location controls — those live only in the input panel
- Changes to model mid-session allowed when provider supports it

---

## Not Included

- Files tab and Stats tab content — `SESSION_FILES_STATS_TABS.md`
- Session spawning dialog — `SESSION_SPAWNING_DIALOG.md`
- Bottom panel compact view — `BOTTOM_PANEL_SESSION_TAB.md`
- Voice input (out of scope for v1)
- Per-message agent override (out of scope; session-bound)
- Provider installation / authentication flows

---

## Source Files (Current Implementation)

### Chat Module
- `src/lib/modules/chat/chat_message_types.ts` — ChatMessage, ChatTurn, MessageRole, ToolStatus, InteractionType
- `src/lib/modules/chat/chat_message_builder.ts` — buildChatMessage, groupMessagesIntoTurns
- `src/lib/modules/chat/scroll_anchoring.ts` — shouldAutoScroll, shouldShowJumpToLatest*, findLastMessageIndex
- `src/lib/modules/chat/markdown_renderer.ts` — renderMarkdown

### Chat Components
- `src/lib/components/blocks/chat/ChatMessage.svelte` — message type dispatcher
- `src/lib/components/blocks/chat/UserBubble.svelte` — right-aligned user message
- `src/lib/components/blocks/chat/AssistantMessage.svelte` — markdown + streaming
- `src/lib/components/blocks/chat/SystemMessage.svelte` — centered, muted
- `src/lib/components/blocks/chat/ToolCardCompact.svelte` — L1 tool card
- `src/lib/components/blocks/chat/ToolCardExpanded.svelte` — L2 tool card
- `src/lib/components/blocks/chat/ToolCardPermission.svelte` — L3 permission prompt
- `src/lib/components/blocks/chat/ToolCardElicitation.svelte` — L3 elicitation prompt
- `src/lib/components/blocks/chat/ToolCardAskUser.svelte` — L3 ask user question
- `src/lib/components/blocks/chat/ToolCardGroup.svelte` — collapsible tool group
- `src/lib/components/blocks/chat/CodeBlock.svelte` — syntax-highlighted code
- `src/lib/components/blocks/chat/StreamingCaret.svelte` — blinking cursor
- `src/lib/components/blocks/chat/InlineImage.svelte` — image with caption
- `src/lib/components/blocks/chat/ContentDimmer.svelte` — opacity dimming with hover restore
- `src/lib/components/blocks/chat/QuickNavButtons.svelte` — jump-to-latest buttons
- `src/lib/components/blocks/chat/tool_card_utils.ts` — per-tool icons, colors, detail extractors

### Session Components
- `src/lib/components/blocks/session/SessionChatView.svelte` — main orchestrator
- `src/lib/components/blocks/session/SessionTopBar.svelte` — top bar with title, state, git context, tabs
- `src/lib/components/blocks/session/SessionSidebar.svelte` — right sidebar (expanded/collapsed)
- `src/lib/components/blocks/session/FloatingInputPanel.svelte` — input panel with skills, textarea, controls
- `src/lib/components/blocks/session/SkillChipsRow.svelte` — skill chip buttons
- `src/lib/components/blocks/session/SendStopButton.svelte` — send/stop morph button
- `src/lib/components/blocks/session/ProgressBar.svelte` — colored progress bar
- `src/lib/components/blocks/session/ProviderChip.svelte` — provider icon + name
- `src/lib/components/blocks/session/SessionStateBadge.svelte` — state badge with pulse
- `src/lib/components/blocks/session/SubAgentTree.svelte` — sub-agent tree container
- `src/lib/components/blocks/session/AgentTreeNode.svelte` — recursive tree node
- `src/lib/components/blocks/session/SubAgentExpansion.svelte` — inline sub-agent messages
- `src/lib/components/blocks/session/session_theme_utils.ts` — badge configs, color thresholds, provider configs
- `src/lib/components/blocks/session/sub_agent_types.ts` — SubAgent interface

### Design Assets
- `claude_design/Session Chat View.html` — existing HTML mockup
- `designs/session-chat-view/DESIGN_BRIEF_SESSION_CHAT_VIEW_UPDATE_PROMPT.md` — update prompt for mockup changes
