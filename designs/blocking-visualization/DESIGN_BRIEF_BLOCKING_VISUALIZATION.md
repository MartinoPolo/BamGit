# Blocking Visualization — Design Brief

Visualization of blocking relationships across PRDs and their sub-issues. Answers two questions at a glance: "what can I work on next?" and "what is blocking what?". Issue: #275. Parent PRD: #219 (PRD Management & Visualization).

## Design Tokens

Use the Grovekeeper Forest Moss palette from `designs/tokens.css`. Font: Geist / Geist Mono.

## Container Context

This component has TWO container modes that share most of the visual language. Each mockup variant must show both modes (one as primary, one as a smaller annotated inset) so the designer demonstrates the rendering scales.

### Mode A — Bottom Panel Tab (issue-focused)

**Parent**: `WorkspaceBottomPanel` — tab content area for a new "Dependencies" or "Blocking" tab
**What parent provides**: Tab bar with tab buttons, panel resizer handle at top, panel border
**What this component fills**: Content area below the tab bar, full width × remaining height (typically 320–500px tall)
**Must NOT include**: Tab bar, panel header, outer border — owned by parent

### Mode B — Standalone PRD Page Tab

**Parent**: `/prd` route layout — page chrome with "Overview | Dependencies | Timeline" tabs
**What parent provides**: Page background, route header, page-level tabs
**What this component fills**: Full page width (after sidebar) × remaining height after the page tabs (~800px wide × ~600–800px tall)
**Must NOT include**: Page tabs, route header, sidebar — owned by parent

**Mockup rendering**: Render Mode B (full page) as the primary canvas at full opacity. In the top-right corner, include a smaller (≈260×180px) inset preview of Mode A (bottom panel tab) at full opacity, labeled "Bottom panel rendering". Render the surrounding parent chrome of both modes at ~30% opacity for context.

## Purpose

Make blocking relationships glanceable so the user can decide what to work on next. The graph must:

- Show every PRD and every issue with their blocked-by edges
- Visually surface "ready" items (no open blockers) so they jump out
- Convey status (priority, AFK / HITL / design-needed labels) without requiring a click
- Let the user filter / collapse to keep the view legible at scale (50+ issues, 10+ PRDs)
- Navigate to the underlying issue or PRD on click

## Required Elements

### 1. Two View Modes (toggle in the top-left of the canvas)

- **PRD-level view**: Each node is a PRD card; edges are PRD → PRD blocking relationships
- **Issue-level view (within a PRD)**: Each node is an issue; edges are issue → issue blocking relationships within the chosen PRD
- View switch: pill segmented control (`PRDs | Issues`). When in Issue mode, an adjacent PRD selector dropdown is visible
- Mode A defaults to Issue-level (the bottom panel is per-issue context). Mode B defaults to PRD-level

### 2. Node Styling — PRD Card

Compact rectangular card, ~220px wide × ~84px tall:

- Header row: `PRD #123` (mono, 11px, muted) + tiny progress percentage right-aligned
- Title (truncated, 13px, 500 weight, 1–2 lines max)
- Bottom row, mono 11px:
  - `{completed}/{total} done` count
  - Thin progress bar (4px, `--primary` for done, `--surface-2` background, full width of bottom row)
- Status badges row above progress (small): one or more of
  - `AFK` (info), `HITL` (warning), `design-needed` (amber/orange), `unresolved` (danger)
  - Each badge uses existing `.gk-badge` classes
- Border: 1px `--border`. When the PRD has at least one ready (unblocked, AFK) sub-issue: glowing moss border (`--moss-400` 50% + 16px outer glow at 35% opacity)
- Click → navigate to PRD detail / open PRD in workspace

### 3. Node Styling — Issue Node

Compact rectangular card, ~200px wide × ~64px tall:

- Header row: `#456` (mono, 11px, muted) + priority pip (small triangle/dot, color tied to priority)
- Title (truncated, 12.5px, 500 weight, 1 line)
- Bottom row: badges (`AFK`, `HITL`, `design-needed`) — only show those present
- Left accent bar (3px) tinted by the issue's color if any (matches existing IssueCard accent system)
- Border: 1px `--border`. Ready (no open blockers + AFK) → moss glow as above
- Click → navigate to issue in board / bottom panel

### 4. Edges

- Default: 1.5px stroke, `--border-strong`, with a small arrow marker pointing from blocker → blocked
- When the blocker is closed (resolved): edge becomes dashed and `--foreground-subtle`
- When the blocker is the source of a "ready" item the user is hovering: thicken stroke to 2.5px and tint with `--primary` for that path
- Avoid 90° dogleg fans — use orthogonal routing with rounded corners (8px) OR cubic bezier curves; the variant decides
- Self-loops not possible (data invariant) — no need to design

### 5. Highlight: "What Can I Work On Next"

A persistent visual treatment for ready items (open + AFK + zero open blockers):

- The node gets the moss glow (described above)
- An optional "ready" badge or check-circle icon overlaid on the top-right corner
- A toggle in the top toolbar `[ ] Highlight ready only` — when on, all non-ready nodes drop to opacity 0.45 and edges between non-ready nodes desaturate

### 6. Toolbar (top of canvas)

Left → right:

- View switch (`PRDs | Issues`) + PRD selector (when Issues mode)
- "Highlight ready only" toggle
- Filter chip group: `AFK` `HITL` `design-needed` `unresolved` — toggle to show/hide nodes by label
- Layout button (Lucide `network` icon) — re-runs auto-layout
- Zoom controls: `−`, `100%`, `+`, "Fit" — bottom-right OR top-right of canvas (designer freedom)

### 7. Empty State

- Mode B with no PRDs in workspace: centered illustration / icon + "No PRDs yet. Create one with the `prd` label." plus a primary button "View open issues"
- Mode B with PRDs but no dependencies: centered "No blocking relationships defined yet" message + sub-line "Add `Blocked by #N` to a PRD or issue"

### 8. Legend (bottom-left, dismissible)

A compact legend pinned to bottom-left: dot/swatch + label for
- Ready (moss glow)
- Blocked
- In progress
- Resolved (dashed edge)
Plus the badges meaning: AFK / HITL / design-needed / unresolved.
Hidden by default in Mode A; shown by default in Mode B.

### 9. Hover & Selection

- Hover a node: highlight all incoming + outgoing edges + connected nodes; dim the rest to opacity 0.35
- Click a node: select state (1.5px ring, accent color), opens a small floating popover with full title, status, "Open" button
- Esc clears selection

## States

- **Default**: All nodes at full opacity
- **Loading**: Skeleton nodes (3–5 placeholder rectangles in a horizontal arrangement) + skeleton toolbar
- **Empty (no PRDs)**: as defined above
- **Empty (no dependencies)**: as defined above
- **Ready-only filter active**: non-ready nodes at opacity 0.45, edges between them desaturated
- **Hover on a node**: connected subgraph highlighted, rest dimmed
- **Selected**: ring + popover
- **Single PRD focused (Issues mode)**: only that PRD's issues + edges visible, with a small chip at the top "PRD #123 — {title} · Back to all"

## Reusable Components

- `Button` from `$lib/components/ui/button` — toolbar buttons (`variant="ghost"`, `size="sm"` for filter chips, `size="icon-sm"` for layout/zoom)
- `Badge` (existing `.gk-badge` classes) for AFK / HITL / design-needed / unresolved
- `Popover` from `$lib/components/ui/popover` — selection details popover
- `Switch` from `$lib/components/ui/switch` — "Highlight ready only" toggle
- `Tooltip` / `SimpleTooltip` for toolbar buttons
- `ToggleGroup` from `$lib/components/ui/toggle-group` — view switch (PRDs | Issues)
- `Select` (or shadcn `Combobox`) — PRD selector dropdown
- Lucide icons: `network`, `zoom-in`, `zoom-out`, `maximize-2`, `eye`, `check-circle`

### Existing Issue-Level Graph

The codebase already ships an issue-level dependency graph: `DependencyGraphView.svelte`, `DependencyGraphCanvas.svelte`, `DependencyGraphNode.svelte`, `DependencyGraphFilterBar.svelte`, `DependencyGraphViewSwitcher.svelte` and supporting modules in `src/lib/modules/dependency-graph/`. Reuse the layout engine (`computeDependencyLayout`, `computePrdsLayout`, `computeSinglePrdLayout`) and the canvas. The brief covers the new visual treatment (PRD cards, ready highlighting, toolbar, empty states) and the dual-surface chrome — node geometry / auto-layout primitives stay.

## Components to Adopt

None new required. Existing `Popover`, `Switch`, `ToggleGroup`, `Select`, `Tooltip`, `Badge`, `Button` cover all interactions. SVG primitives for nodes/edges (no graph library).

## Layout Constraints

- PRD card: ~220×84px
- Issue card: ~200×64px
- Edge stroke: 1.5px default, 2.5px highlighted, dashed when blocker resolved
- Minimum spacing between nodes: 32px horizontal, 24px vertical (existing layout module spec)
- Canvas padding: 24px (Mode B), 12px (Mode A)
- Toolbar height: 40px
- Mode A renders 1–2 columns of layered nodes typically
- Mode B can scroll/pan when graph exceeds viewport (existing canvas already handles pan/zoom)

## Visual References

- Linear's "Project graph" view (PRD-level dependency layout)
- GitHub Projects' roadmap view (compact node cards with status pills)
- Notion graph view (subtle edges, glow on hover)
- Existing `DependencyGraphView` in this repo — preserve geometry conventions, modernize the chrome and node visuals
- Existing `WorkspaceCard` glow + breathing animation — adopt the same moss glow for "ready" nodes for consistency

## UI Freedom

- Edge routing style: orthogonal with rounded corners vs cubic bezier curves — pick what reads cleanest for the variant
- Whether the legend is a docked card or a popover triggered by an "i" button
- Whether the "ready" highlight uses a glow only, an overlay icon only, or both
- Color hue for the priority pip (current priority colors in `IssueCard` are the source of truth — match those)
- Whether zoom controls live in the corner of the canvas or alongside other toolbar buttons
- Animation easing for filter / highlight transitions (200–300ms recommended)

Designer MUST preserve:

- Two-mode rendering (Mode A bottom panel, Mode B standalone page) — both visible in the mockup
- The "ready" visual treatment (moss glow + optional overlay icon)
- Click-to-navigate on every node
- Filter chip set: AFK / HITL / design-needed / unresolved
- Use of existing layout primitives from `dependency-graph` module

## Not Included

- Editing dependencies (add / remove blocker links) — separate feature, not in #275
- Timeline / Gantt rendering — that is a future tab in PRD #219
- PRD progress chart drilldowns — owned by PRD #93 Metrics
- Cross-workspace blocking visualization — single-workspace scope only
- Drag-to-reposition nodes (auto-layout only)

---

## Implementation Notes (for refine phase)

- Backend: existing `get_issue_dependencies` returns `IssueDependency[]`. PRD-level edges are derived by parsing `Blocked by PRD #N` mentions in PRD bodies (or by aggregating sub-issue blockers across PRD boundaries — to be decided in refine).
- "Ready" classification: `classifyReadyState` already exists in `dependency-graph` module — reuse, possibly extend to consider AFK label.
- New routes: `/prd` (workspace-scoped) with `Overview | Dependencies | Timeline` tabs. Add a "Blocking" / "Dependencies" bottom panel tab.
- Persistence: filter chip + "ready only" toggle persisted per surface in localStorage.
