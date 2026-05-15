# Group B: Session Chat View, Workspace Card

Extracted from sessions: 2026-05-06 to 2026-05-07. Source sessions:

- `14d3aaeb` (1.7MB, 2026-05-06) — session chat view round 1
- `35c3a880` (1.5MB, 2026-05-06) — session chat view refinements
- `4805607b` (1.4MB, 2026-05-07) — workspace card grilling

---

## Session 1: Session Chat View — Layout & Top Bar (14d3aaeb)

- **Topic**: Sidebar direction
  **Question**: Mirror sidebar to the right (chat on left, metadata + sub-agents in 272px right sidebar)?
  **Answer**: Yes, mirror to the right.
  **Rationale**: App-level left nav (workspace nav) already occupies the left side; right sidebar keeps left free.
  **Category**: UI-Design

- **Topic**: Top bar contents
  **Question**: Is a layout of `[Title + state badge + provider icon] | [branch · #issue · PR] | [Chat/Files/Stats tabs]` too crowded at 1280px?
  **Answer**: Accepted. Fine with the crowded top bar for now.
  **Rationale**: At narrower widths the git cluster will collapse to icon-only badges.
  **Category**: UI-Design

- **Topic**: Sidebar header (expanded state)
  **Question**: With the state badge moved to the top bar, what goes at the sidebar top?
  **Answer**: Just the collapse toggle; no label or other content next to it.
  **Category**: UI-Design

- **Topic**: Collapsed sidebar strip contents
  **Question**: Include state pulse dot, vertical mini context bar (%), agent count, and cost in collapsed 44px strip?
  **Answer**: Accepted, but remove cost from the collapsed strip.
  **Category**: UI-Design

- **Topic**: Context progress bar color thresholds
  **Question**: What color thresholds for the context usage bar?
  **Answer**: Below 40% = green; 40–60% = orange; above 60% = red.
  **Category**: UI-Design

- **Topic**: Quota progress bar color thresholds (5h / 7d)
  **Question**: What color thresholds for 5-hour and 7-day quota bars?
  **Answer**: Below 60% = green; 60–85% = orange; above 85% = red.
  **Category**: UI-Design

- **Topic**: Combined model + context selector
  **Question**: Single dropdown showing "Opus 4.7 (1M)" combining model name and context window?
  **Answer**: Yes, single dropdown. Provider icon kept next to the model selector in the sidebar (not duplicated in the top bar).
  **Category**: UI-Design

- **Topic**: Sidebar metric alignment
  **Question**: Should all progress bars be the same width, aligned between the longest left label and the longest right value?
  **Answer**: Yes. All bars stretch to the same width within that channel.
  **Category**: UI-Design

- **Topic**: Separator between global quota and session metrics
  **Question**: Should a visual separator divide 5h/7d quota rows from the session-specific metrics (context, cost, tokens)?
  **Answer**: Yes, a visual separator is desirable.
  **Category**: UI-Design

- **Topic**: Sub-agents visual separation
  **Question**: Should sub-agents section get its own card-like container or just a divider line?
  **Answer**: Section header + responsive height, not strict 50/50 split.
  **Category**: UI-Design

- **Topic**: Input area controls placement
  **Question**: Proposed: floating panel, ~900px max-width, skills row above textarea, `[+ Attach] [Tools ▾]` bottom-left, `[Provider+Model ▾] [Permission ▾] [Send]` bottom-right. Accept this layout?
  **Answer**: Accepted for v1.
  **Category**: UI-Design

- **Topic**: Provider icon placement
  **Question**: Provider icon in the top bar (next to state badge) or beside the model selector in the sidebar?
  **Answer**: Provider belongs in the sidebar next to the model selector; Claude icon should NOT be in the top bar.
  **Category**: UI-Design

- **Topic**: Provider switcher hint
  **Question**: Since multiple providers will be supported, hint a provider switcher in the design?
  **Answer**: Yes, hint a provider switcher. The provider icon can be styled to suggest this.
  **Category**: Platform

- **Topic**: Image attachment design
  **Question**: Carousel for overflowing images; collapsible; uncollapsed only when user adds a new image; collapsed when message is sent?
  **Answer**: Yes, implement a carousel that collapses on send and only opens when a new image is added.
  **Category**: UI-Design

- **Topic**: Effort / Thinking Mode indicator
  **Question**: How to indicate Effort or Thinking Mode?
  **Answer**: Add a separate Effort/Thinking Mode selector; also add a Location Switcher (local/cloud) as a placeholder for future cloud session support.
  **Rationale**: Grovekeeper is not local-only in the long term; cloud sessions may be spawned in the future.
  **Category**: Platform

- **Topic**: Session resumability in native CLI
  **Question**: Where to put a "Resume in Claude Code CLI" button?
  **Answer**: Add the button (decided placement deferred to further discussion, but tracked in docs and issues).
  **Category**: Platform

- **Topic**: Vocabulary additions
  **Question**: Add "Effort" to the vocabulary?
  **Answer**: Add "Effort" to VOCABULARY.md; drop other proposed terms.
  **Category**: Domain-Language

---

## Session 2: Session Chat View Refinements (35c3a880)

- **Topic**: Sidebar collapse button alignment
  **Question**: Should the collapse button move to the left edge of the right sidebar header?
  **Answer**: Yes.
  **Category**: UI-Design

- **Topic**: Floating input panel: content leaking on sides
  **Question**: Chat content is visible in the gaps to the left/right of the 900px max-width floating panel. Use gradient fade mask (Option A) or full-width frosted footer (Option B)?
  **Answer**: Option A — gradient fade (`linear-gradient(transparent → var(--background))`, 120px, pointer-events: none).
  **Category**: UI-Design

- **Topic**: Shared max-width column
  **Question**: Wrap message stream in the same 900px max-width as the floating panel? Keep 900px or narrow to ~800px?
  **Answer**: Keep 900px. All content (assistant text, tool cards, sub-agent expansions) shares this column. User bubbles stay at 75% within it.
  **Category**: UI-Design

- **Topic**: Pause vs Stop action
  **Question**: Does a separate "Pause" action make sense, or should just Send↔Stop morph exist?
  **Answer**: No "Pause" action. Send button morphs to Stop during generation. Remove "Pause" from overflow menu. "Paused" state renamed to "Stopped".
  **Category**: Data-State

- **Topic**: Session state: "paused" → "stopped"
  **Question**: Rename "paused" to "stopped" in STATE_MAPPING.md and all docs?
  **Answer**: Yes, rename everywhere including forest view accessory (ladder) rules.
  **Category**: Domain-Language

- **Topic**: Overflow menu contents
  **Question**: With Stop moved to the send button morph, what stays in the overflow menu?
  **Answer**: Export chat only. Restart and Delete session reserved as future placeholders.
  **Category**: UI-Design

- **Topic**: Older message dimming + hover restore
  **Question**: Older messages dimmed at opacity 0.4; full hover restore to normal?
  **Answer**: Yes — `opacity: 0.4` with hover restore for entire turn at `150ms ease-out`. Messages remain interactable.
  **Category**: UI-Design

- **Topic**: Component height consistency
  **Question**: Should component heights use predefined design system sizes rather than inline pixel overrides?
  **Answer**: Yes. No inline height overrides. Send button uses `gk-btn-sm` (26px), distinguished by primary color not size.
  **Category**: UI-Design

- **Topic**: Tool card header height
  **Question**: Standardize L1/L2 tool card headers at 34px or 36px (to match L3)?
  **Answer**: 36px for all tool card headers (L1, L2, L3).
  **Category**: UI-Design

- **Topic**: Keyboard shortcuts
  **Question**: Which keyboard shortcut for Stop? Esc or Ctrl+C?
  **Answer**: Ctrl+C (canonical for stopping a running session). Send hints: Enter. Esc is too easily hit accidentally.
  **Category**: UI-Design

- **Topic**: Provider/branch/issue/PR in sidebar vs top bar
  **Question**: Drop provider/branch/issue/PR from sidebar since top bar already shows them?
  **Answer**: Yes — drop from sidebar. Sidebar contains only quotas + session metrics + sub-agents.
  **Category**: UI-Design

---

## Session 3: Workspace Card Grilling (4805607b)

- **Topic**: "Tracked" count meaning
  **Question**: Design shows "13 tracked" — does this mean issues + PRs or something else?
  **Answer**: Active git worktrees (not issues, not PRs).
  **Category**: Domain-Language

- **Topic**: Branch display on workspace card
  **Question**: Which branch to show under workspace name?
  **Answer**: Branch of the main git worktree (not per-issue branches).
  **Category**: UI-Design

- **Topic**: Cost period display
  **Question**: Show `today $4.82` hardcoded, or configurable from day one, or skip until PRD #93?
  **Answer**: Show `today $4.82` hardcoded. Configurable period deferred to PRD #93.
  **Category**: UI-Design

- **Topic**: AFK session count display
  **Question**: Show total active sessions or only AFK-spawned sessions?
  **Answer**: Show breakdown: total sessions + how many are AFK. Format: `5 sessions (3 AFK)`.
  **Category**: UI-Design

- **Topic**: Last activity timestamp semantics
  **Question**: Is the AFK row "last" timestamp redundant with the footer "just now" timestamp?
  **Answer**: No — AFK row "last" = when the AFK loop last ran; footer timestamp = any workspace activity. Keep both.
  **Category**: UI-Design

- **Topic**: Stat box click behaviors
  **Question**: What does clicking each stat box do?
  **Answer**: Issues stat → workspace Issues tab (all tracked). PRs stat → workspace PRs view. ATTN stat → workspace Issues tab filtered to attention-needed. HITL stat → workspace Issues tab filtered to HITL. AFK row click → navigate to AFK loop page. Card click → open workspace dashboard.
  **Category**: UI-Design

- **Topic**: AFK toggle button placement
  **Question**: Should a start/stop button be on the AFK row of the workspace card?
  **Answer**: No. Start/stop button only in the workspace dashboard.
  **Category**: UI-Design

- **Topic**: Issues stat box: dual number
  **Question**: Show open GitHub issues or Grovekeeper issues?
  **Answer**: Grovekeeper non-PRD issues. Format: `1/10` (AFK-actionable / total tracked). Tooltip: "1 unblocked AFK issue out of 10 tracked."
  **Category**: UI-Design

- **Topic**: Issues stat icon
  **Question**: Use `circle-dot`, `list-checks`, or another icon?
  **Answer**: `list-checks`.
  **Category**: UI-Design

- **Topic**: GitHub icon implementation
  **Question**: Custom `GithubIcon.svelte`, add `simple-icons` package, or use a Lucide proxy?
  **Answer**: Custom `GithubIcon.svelte` using Simple Icons SVG path (fill-based). Same for `VscodeIcon.svelte`.
  **Category**: UI-Design

- **Topic**: Icon button states on workspace card
  **Question**: GitHub and folder buttons — behavior when assigned vs not assigned?
  **Answer**: Always visible. Unassigned = 0.35 opacity; click opens config wizard. Assigned = resting at `--foreground-subtle`, hover to `--foreground` + `surface-2` bg. Uses `ghost` variant.
  **Category**: UI-Design

- **Topic**: IssueCard migration to Card component
  **Question**: Is it worth migrating IssueCard to use the shared Card component?
  **Answer**: No. The `--ic` per-instance accent color system is incompatible with Card's design-token-based state system.
  **Category**: Data-State

- **Topic**: Accent color strategy for workspace cards
  **Question**: Expand accent system (A), workspace-only palette from first palette color (B), or hybrid (C)?
  **Answer**: Option B — workspace card accent derives from the workspace's palette color. New color scales added as tokens but not as app-wide accent overrides.
  **Category**: UI-Design

- **Topic**: Accent color picker in workspace settings
  **Question**: Color picker or color swatches?
  **Answer**: Reuse `ColorPickerContent` with 12 colors in a 2×6 grid. Custom colors available. Inline picker (no dropdown trigger).
  **Category**: UI-Design

- **Topic**: Accent color palette size and hues
  **Question**: What 12 colors to offer?
  **Answer**: 12 in 2×6 grid. Existing 7 (moss/amber/bark/azure/plum/teal/rose) + 5 new: coral `oklch(0.620 0.155 30)`, gold `oklch(0.650 0.135 90)`, sage `oklch(0.600 0.085 160)`, indigo `oklch(0.540 0.140 275)`, fuchsia `oklch(0.580 0.155 350)`.
  **Category**: UI-Design

- **Topic**: PRD row on workspace card
  **Question**: Should the workspace card have a dedicated PRD info row?
  **Answer**: Yes — compact inline row: `3 PRDs · 12/31 done [progress bar]`. Click navigates to PRD view.
  **Category**: UI-Design

- **Topic**: PRD "in progress" definition
  **Question**: What defines a PRD as "in progress"?
  **Answer**: A PRD has at least one completed sub-issue.
  **Category**: Domain-Language

- **Topic**: PRD view scope
  **Question**: Create a new PRD for "PRD Management & Visualization" or fold into PRD #96?
  **Answer**: New PRD. PRD #96 owns Overview Dashboard; workspace card PRD row added to #96, but full PRD view is a new PRD.
  **Category**: Workflow

- **Topic**: PRD #96 partial grilling tracking
  **Question**: Creating sub-issues could falsely signal PRD #96 is fully grilled. Strategy?
  **Answer**: Status comment on PRD #96 stating partial grilling; sub-issues with `#96 [Overview]` prefix; grill remaining sections separately.
  **Category**: Workflow
