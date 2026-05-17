# Blocking Visualization — Design Brief

Visualization of blocking/dependency relationships between PRDs and their sub-issues. Answers two questions at a glance: "what can I work on next?" and "what is blocking what?". Issue: #275. Parent PRD: #219 (PRD Management & Visualization). Implementation: PR #283 (merged 2026-05-10).

**Supersedes**: initial design brief. Raw variant feedback preserved in `variants/VARIANT-B.md`, `VARIANT-C.md`, `VARIANT-D.md`.

---

## 1. Purpose

Make blocking relationships glanceable so the user can decide what to work on next. WHY: Developers managing 10+ PRDs with 50+ issues lose track of what's ready vs blocked. Switching to GitHub's issue tracker to trace dependency chains breaks flow. This visualization surfaces actionable work inside the workspace.

The graph must:

- Show every PRD and every issue with their blocked-by edges [Issue #275 REQ-1, REQ-2]
- Visually surface "ready" items (no open blockers) so they jump out immediately [Issue #275 REQ-4]
- Convey status (priority, AFK / HITL / design-needed labels) without requiring a click [Issue #275 REQ-3]
- Let the user filter / collapse to keep the view legible at scale (50+ issues, 10+ PRDs) [Issue #275 comment, PR #283]
- Navigate to the underlying issue or PRD on click [Issue #275 REQ-5]

---

## 2. Surrounding Context

This component exists in TWO container modes that share most visual language. Each mockup variant must render both modes (one primary, one as an inset annotation).

### Mode A — Bottom Panel Tab (Issue-Focused)

The full workspace viewport contains:
- **Left**: Dashboard sidebar (240px, FINAL STATE) with: Grovekeeper logo, workspace selector dropdown, 5 nav items (Dashboard / Sessions / AI Config / Usage / Workspace Settings), theme toggle, language switcher, user avatar at bottom
- **Top**: TopBar (48px) with dashboard name left-aligned, and right-aligned buttons: sync, notifications bell, quick ideas (lightbulb), toggle forest (trees icon), create issue (+)
- **Above content**: Forest View (canvas with low-poly 2D trees representing issues) — typically ~25% of vertical space, collapsible via TopBar toggle
- **Below forest**: Bottom Panel (~75% of vertical space) with resizer handle at top edge, tab bar centered at top: `Issues | Kanban | Issue Detail | Dependencies | Activity | Session | Assigned Issues`
- **This component fills**: Content area below the tab bar, full width x remaining height (typically 320-500px tall)
- **Must NOT include**: Tab bar, panel header, outer border, resizer handle — all owned by `WorkspaceBottomPanel`
- Defaults to Issue-level view (contextual to active issue)

### Mode B — Standalone PRD Page Tab

- **Left**: Same sidebar as Mode A
- **Top**: PRD route header with PRD title + GitHub link
- **Below header**: Page-level tabs: `Overview | Dependencies | Timeline`
- **This component fills**: Full page width (after sidebar) x remaining height after page tabs (~800px wide x 600-800px tall)
- **Must NOT include**: Page tabs, route header, sidebar — owned by parent route
- Defaults to PRD-level view (all PRDs visible)

**Mockup rendering**: Render Mode B (full page) as the primary canvas at full opacity. In the top-right corner, include a smaller (~260x180px) inset preview of Mode A (bottom panel tab) at full opacity, labeled "Bottom panel rendering". Render the surrounding parent chrome of both modes at ~30% opacity for context.

---

## 3. Requirements

### View Modes [PR #283, Issue #275]

| # | Requirement | Source |
|---|-------------|--------|
| 1 | Three view modes switchable via toolbar: Global (all issues + PRDs), PRDs (PRD nodes only), Single PRD (selected PRD's sub-issues) | [PR #283 comment] |
| 2 | View switch rendered as icon tabs (`Global` / `PRDs` / `Single PRD`) with `Globe`, `Layers`, `Focus` Lucide icons | [DependencyGraphViewSwitcher.svelte] |
| 3 | When in Single PRD mode, adjacent PRD selector dropdown visible | [DependencyGraphViewSwitcher.svelte] |
| 4 | Mode A defaults to Global view; Mode B defaults to PRDs view | [Brief decision] |
| 5 | Single PRD mode: closed sub-issues float in a top row above the DAG, open sub-issues arranged by dagre below | [dagre_layout.ts `computeSinglePrdLayout`] |

### Node Styling — PRD Card [Issue #275, DECISIONS.md]

| # | Requirement | Source |
|---|-------------|--------|
| 6 | Compact rectangular card, 240px wide x 96px tall (existing `NODE_WIDTH` / `NODE_HEIGHT`) | [types.ts] |
| 7 | Header row: `PRD #123` with Layers icon (11px, muted) — uses `isPrd` flag from layout | [DependencyGraphNode.svelte] |
| 8 | Title (truncated, 12px, 500 weight, single line max) | [DependencyGraphNode.svelte] |
| 9 | Pills row: AFK (primary), HITL (amber), design-needed (orange), area:* chips (muted), sub-issue progress count `{completed}/{total}` | [DependencyGraphNode.svelte] |
| 10 | PRD node gets tinted background: `color-mix(in oklch, var(--primary) 8%, var(--card))` with primary-tinted border | [DependencyGraphNode.svelte] |
| 11 | Ready PRD (unblocked + AFK-labeled): moss glow ring `0 0 0 2px oklch(0.7 0.18 142)` | [DependencyGraphNode.svelte] |
| 12 | Closed nodes: `opacity: 0.55`, `filter: grayscale(0.4)`, check icon in header | [DependencyGraphNode.svelte] |
| 13 | Click navigates to PRD detail (activates issue via `selection.activateIssue()`) | [DependencyGraphView.svelte] |

### Node Styling — Issue Node [Issue #275]

| # | Requirement | Source |
|---|-------------|--------|
| 14 | Same card dimensions as PRD (240x96px) — shared `NODE_WIDTH`/`NODE_HEIGHT` | [types.ts] |
| 15 | Header row: `#456` (mono, muted) + ready state dot (colored by state) | [DependencyGraphNode.svelte] |
| 16 | Title (truncated, 12px, 500 weight, single line) | [DependencyGraphNode.svelte] |
| 17 | Pills row: AFK, HITL, design-needed badges + area labels (max 2) | [DependencyGraphNode.svelte] |
| 18 | Ready states: `ready-to-execute` (moss green ring), `ready-to-grill` (amber ring), `needs-design` (orange ring) | [ready_state.ts `READY_STATE`] |
| 19 | HITL quick-start button: small play icon (18x18px circle) in bottom-right corner, only shown when issue has HITL label and is not closed and `onhitlquickstart` callback provided | [DependencyGraphNode.svelte] |
| 20 | Click navigates to issue in bottom panel | [DependencyGraphView.svelte] |

### Edges [Issue #275, PR #283]

| # | Requirement | Source |
|---|-------------|--------|
| 21 | Default: 1.5px stroke, `--muted-foreground`, 45% opacity, arrow marker pointing from blocker to blocked | [DependencyGraphView.svelte] |
| 22 | Cross-PRD edges: 2px stroke, dashed (`6 3`), orange `oklch(0.7 0.18 40)`, 80% opacity, distinct arrow marker | [DependencyGraphView.svelte, PR #283 comment] |
| 23 | Edge count badge: when multiple sub-issue edges aggregate between two PRDs in PRDs view, show count in a 9px-radius circle at midpoint | [DependencyGraphView.svelte] |
| 24 | Routing: dagre automatic via `@dagrejs/dagre` library (left-to-right `rankdir: 'LR'`). Points connected with `L` commands | [dagre_layout.ts] |

### Ready State Highlighting [Issue #275 REQ-4]

| # | Requirement | Source |
|---|-------------|--------|
| 25 | Ready classification via `classifyReadyState()`: closed = none; design-needed label = `needs-design`; has open blockers = none; AFK label = `ready-to-execute`; HITL label = `ready-to-grill` | [ready_state.ts] |
| 26 | Each ready state has distinct ring color + header dot color for colorblind accessibility | [DependencyGraphNode.svelte] |
| 27 | Future: "Highlight ready only" toggle in toolbar that dims non-ready nodes to opacity 0.45 and desaturates their edges | [Brief design decision, not yet implemented] |

### Toolbar [PR #283, existing implementation]

| # | Requirement | Source |
|---|-------------|--------|
| 28 | Left section: View switcher tabs (Global / PRDs / Single PRD) + PRD selector dropdown (when Single PRD active) | [DependencyGraphViewSwitcher.svelte] |
| 29 | Right section: Filter bar — Closed toggle (eye icon), AFK filter, HITL filter, area dropdown, label search input, reset button | [DependencyGraphFilterBar.svelte] |
| 30 | Toolbar: 8px 12px padding, `--card` background, 1px `--border` bottom border, flex-wrap for narrow viewports | [DependencyGraphView.svelte] |

### Canvas [Existing implementation]

| # | Requirement | Source |
|---|-------------|--------|
| 31 | Wheel-zoom centered on cursor, pointer-drag pan, 3-button control cluster (zoom in/out/reset) in top-right corner | [DependencyGraphCanvas.svelte] |
| 32 | Zoom range: 0.2x to 4x, default fit-to-content on load and when view/filter changes | [DependencyGraphCanvas.svelte] |
| 33 | Zoom percentage readout in bottom-right corner (11px, muted, semi-transparent bg) | [DependencyGraphCanvas.svelte] |
| 34 | Canvas background: `--background`. Touch-action: none for pointer events | [DependencyGraphCanvas.svelte] |
| 35 | Nodes rendered via `<foreignObject>` in SVG for HTML-in-SVG composability | [DependencyGraphView.svelte] |

### Empty States [Issue #275]

| # | Requirement | Source |
|---|-------------|--------|
| 36 | Single PRD mode, no PRDs: "No PRDs in this workspace" | [DependencyGraphView.svelte] |
| 37 | Single PRD mode, no selection: "Select a PRD to view its sub-issues" | [DependencyGraphView.svelte] |
| 38 | Single PRD mode, PRD has no sub-issues: "This PRD has no sub-issues" | [DependencyGraphView.svelte] |
| 39 | PRDs view, no PRDs: "No PRDs in this workspace" | [DependencyGraphView.svelte] |
| 40 | Global view, no dependencies: "No blocking relationships defined" | [DependencyGraphView.svelte] |
| 41 | Empty state visual: centered `NetworkOff` icon (32px) + message text (13px, muted, 70% opacity) | [DependencyGraphView.svelte] |

### Filtering [PR #283 comment, existing implementation]

| # | Requirement | Source |
|---|-------------|--------|
| 42 | Closed toggle: show/hide closed issues (default: hidden) | [filters.ts] |
| 43 | AFK-only filter: show only AFK-labeled issues (mutually exclusive with HITL) | [filters.ts] |
| 44 | HITL-only filter: show only HITL-labeled issues (mutually exclusive with AFK) | [filters.ts] |
| 45 | Area dropdown: filter by `area:*` labels, auto-populated from current issue set | [filters.ts] |
| 46 | Label search: free text search across all issue labels | [filters.ts] |
| 47 | Reset button: appears only when filters differ from defaults, resets all at once | [DependencyGraphFilterBar.svelte] |
| 48 | Filtering removes both nodes and their edges (edges only shown when both endpoints pass filter) | [DependencyGraphView.svelte] |

---

## 4. Existing Components to Reuse

Exact variants and locations for all reused components:

| Component | Variant / Config | Location | Used For |
|-----------|-----------------|----------|----------|
| `Button` | `intent="secondary"`, `size="sm"`, custom `h-6.5 text-[11px]` | `$lib/components/shadcn/button` | Filter toggle buttons (Closed, AFK, HITL) |
| `Button` | `intent="primary"`, `size="sm"` | same | Active filter buttons |
| `Button` | `intent="secondary"`, `size="icon-sm"`, custom `size-6.5` | same | Reset filter button |
| `Button` | `intent="secondary"`, `size="icon-sm"`, custom `size-7` | same | Zoom controls (+, -, reset) |
| `Select` | native `<select>` with `h-[26px] text-[11px]` | `$lib/components/shadcn/select` | Area filter dropdown |
| `Select` | `h-[30px] min-w-[180px] text-[12px]` | same | PRD selector in Single PRD mode |
| `Tabs.Root` + `Tabs.Tab` | with Lucide icons `data-icon="inline-start"` | `$lib/components/shadcn/tabs` | View mode switcher (Global/PRDs/Single PRD) |
| Lucide icons | `globe`, `layers`, `focus`, `eye`, `eye-off`, `rotate-ccw`, `play`, `check`, `network` | `@lucide/svelte/icons/*` | Toolbar, node UI |

---

## 5. Components to Design (Visual Improvements)

The existing implementation is functional but visually basic — nodes are plain `--card` background rectangles with simple pills. The design upgrade targets node visuals, edge rendering, and interactive states while keeping the existing layout engine and canvas infrastructure.

| Component | What's New | Why |
|-----------|-----------|-----|
| **Enhanced PRD Node** | Gradient header treatment matching Issue Card v2 variant styles (Horizon/Radiant/Veil), progress bar (4px), badge Style B (borderless-dark) | Current nodes are uniform flat cards with no visual hierarchy between header/content. No progress visualization. PRD nodes should feel like mini-versions of workspace cards [Issue #275, variant B/C/D feedback] |
| **Enhanced Issue Node** | Left accent bar (3px, issue color), priority pip, ready-state moss glow (16px outer glow at 35% opacity, not just 2px ring), hover edge highlight | Current nodes lack issue color identity. Ready state is subtle 2px ring — needs the breathing moss glow from WorkspaceCard for consistency [DECISIONS.md: "Issue color is primary visual differentiator"] |
| **Styled Edges** | Resolved blocker edges: dashed + `--foreground-subtle`. Hover-highlight path: 2.5px + `--primary` tint. Cubic bezier OR orthogonal rounded-corner routing | Current edges are simple straight-line polylines. No resolved/unresolved distinction. No hover interaction [variant B: cubic bezier, variant C/D: orthogonal 8px Q arcs] |
| **Legend (bottom-left)** | Compact dismissible legend with dot/swatch for: ready-to-execute (moss), ready-to-grill (amber), needs-design (orange), blocked (default), resolved (dashed). Badge meanings: AFK, HITL, design-needed | No legend exists. New users can't decode the visual language without one [Brief design decision] |
| **Selection Popover** | Click node: 1.5px ring (accent color), floating popover with full title, status, "Open" button | Current click only calls `selection.activateIssue()` — no popover. Users need more context before navigating away from the graph [Brief design decision] |

---

## 6. Layout & Dimensions

### Node Dimensions

| Element | Size | Source |
|---------|------|--------|
| PRD card | 240 x 96px | `types.ts NODE_WIDTH/NODE_HEIGHT` |
| Issue card | 240 x 96px | Same constants (shared) |
| Node horizontal spacing | 80px | `types.ts NODE_HORIZONTAL_SPACING` |
| Node vertical spacing | 40px | `types.ts NODE_VERTICAL_SPACING` |
| Floating closed row gap | 60px above open graph | `types.ts FLOATING_ROW_GAP` |

### Canvas

| Property | Mode A (Bottom Panel) | Mode B (PRD Page) |
|----------|----------------------|-------------------|
| Canvas padding | 12px | 24px |
| Toolbar height | ~40px (8px + content + 8px) | ~40px |
| Content area | Full width x 280-460px | ~800px wide x 560-760px |
| Min height | 320px | 320px |

### DAG Layout

- **Direction**: Left-to-right (`rankdir: 'LR'`)
- **Algorithm**: dagre automatic layout — handles layering, crossing minimization, edge routing
- **Pan/zoom**: Unbounded canvas with fit-to-content on initial render and view changes
- **Responsive**: Canvas fills available space; `ResizeObserver` tracks container dimensions

---

## 7. States & Interactions

### Node States

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| **Default** | 1.5px `--border`, `--card` background, full opacity | Resting |
| **Hover** | Border color → `--primary`, `translateY(-1px)` lift, 150ms ease | Mouse enter on node |
| **Selected** | `--primary` border + 2px box-shadow ring | Click (`selection.activateIssue()`) |
| **Closed** | `opacity: 0.55`, `filter: grayscale(0.4)`, check icon in header | `isClosedIssue(issue) === true` |
| **Ready to Execute** | Moss green ring `0 0 0 2px oklch(0.7 0.18 142)` + green header dot | `classifyReadyState === 'ready-to-execute'` |
| **Ready to Grill** | Amber ring `0 0 0 2px oklch(0.78 0.16 85)` + amber header dot | `classifyReadyState === 'ready-to-grill'` |
| **Needs Design** | Orange ring `0 0 0 2px oklch(0.7 0.18 40)` + orange header dot | `classifyReadyState === 'needs-design'` |
| **PRD Node** | Primary-tinted background + border, Layers icon in header | `node.isPrd === true` |
| **Floating Closed** | Same as Closed, positioned in top row above DAG | Single PRD mode, `isFloatingClosed === true` |

### Canvas States

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| **Default** | `cursor: grab` | Resting |
| **Panning** | `cursor: grabbing` | Pointer down on canvas (not on a node) + drag |
| **Zooming** | Scale + translate update, centered on cursor | Mouse wheel |

### Graph-Level States

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| **Loading** | Skeleton: 3-5 placeholder rectangles (matching node dimensions) in horizontal arrangement + skeleton toolbar | Data fetching in progress |
| **Empty (no PRDs)** | Centered `NetworkOff` icon (32px) + message | PRDs view/Single PRD with zero PRDs |
| **Empty (no dependencies)** | Centered `NetworkOff` icon + "No blocking relationships defined" | Global view with zero edges |
| **Filtered to empty** | Same empty treatment with "No matching issues" | All issues filtered out |
| **Ready-only filter** | Non-ready nodes at opacity 0.45, edges between them desaturated | Future: "Highlight ready only" toggle on |

### Hover & Selection Interactions

| Interaction | Behavior |
|-------------|----------|
| **Hover node** | Future: highlight all incoming + outgoing edges + connected nodes; dim rest to opacity 0.35. Current: border color change + lift only |
| **Click node** | Calls `selection.activateIssue(issueId)` — switches bottom panel to Issue Detail. Future: selection ring + floating popover with full title, status, "Open" button |
| **Esc** | Future: clears selection |
| **Click canvas** | Initiates pan (existing), future: clears node selection |
| **Right-click node** | Future: context menu with "Open", "Open on GitHub", "View dependencies" |
| **HITL quick-start** | Small play button in bottom-right of HITL nodes, `stopPropagation()`, calls `onhitlquickstart(issueId)` |

---

## 8. Design Constraints (Non-Negotiable)

These constraints MUST be preserved in any variant or refinement:

1. **Two-mode rendering** — Mode A (bottom panel tab) and Mode B (standalone PRD page) both visible in mockups [Brief architecture]
2. **Existing layout engine** — Reuse `dagre_layout.ts` (`computeDependencyLayout`, `computePrdsLayout`, `computeSinglePrdLayout`). Do not replace dagre [PR #283]
3. **Existing canvas** — Reuse `DependencyGraphCanvas.svelte` pan/zoom infrastructure. SVG-based with `foreignObject` for nodes [PR #283]
4. **Three view modes** — Global, PRDs, Single PRD — switchable via toolbar tabs. No removing or renaming [PR #283]
5. **Ready state classification** — Use existing `classifyReadyState()` from `ready_state.ts`. Four states: `ready-to-execute`, `ready-to-grill`, `needs-design`, `none` [ready_state.ts]
6. **Filter system** — Keep all 5 filter dimensions (closed, AFK, HITL, area, label search). Filters remove both nodes and edges [filters.ts]
7. **Cross-PRD edge styling** — Dashed orange edges between PRDs with count badges. Visually distinct from intra-PRD edges [PR #283]
8. **Click navigates** — Every node click must call `selection.activateIssue()` for navigation [Issue #275 REQ-5]
9. **Design token compliance** — All colors via OKLCH CSS custom properties. Forest Moss palette. Dark theme primary [DECISIONS.md]
10. **Typography** — Geist (sans) / Geist Mono (mono). Node IDs, percentages, badge labels in Geist Mono [DESIGN_SYSTEM.md]
11. **No drag-to-reposition** — Nodes positioned by dagre auto-layout only [Brief decision]
12. **Badge Style B** (borderless-dark) for all node badges — `color-mix(in oklch, {color} 14%, transparent)` background with colored text, no border [Variant B/C/D unanimous decision]
13. **Steady glow for ready nodes** — No breathing/pulsing animation on ready state. Consistent with IssueCard v2 executing state decision: "no animation for routine states" [DECISIONS.md, Variant B decision]

---

## 9. Design Freedom (Creative Latitude)

Designers have freedom to explore these areas:

| Area | Options | Guidance |
|------|---------|----------|
| **Edge routing style** | Cubic bezier curves (Variant B) vs orthogonal with 8px rounded corners (Variant C/D) vs dagre default polylines | Pick what reads cleanest for the variant's density level. Orthogonal reads cleaner at high node counts; bezier is more organic |
| **Node header treatment** | Gradient header matching Issue Card v2 variants (Horizon left-to-right, Veil top-down, Radiant emanation) vs current flat tint | All three variant mockups used gradients; the specific direction/intensity is variant-dependent |
| **Legend presentation** | Docked card (bottom-left, dismissible) vs popover triggered by info "i" button vs hidden-by-default overlay | Hidden by default in Mode A (space-constrained); shown by default in Mode B |
| **Ready glow intensity** | 2px ring only (current) vs 16px outer glow at 35% opacity (brief spec) vs both | Variants B and C both chose steady glow. Intensity is tunable |
| **Zoom control placement** | Top-right of canvas (current) vs alongside toolbar buttons vs bottom-right floating | Current top-right works well; moving it is allowed |
| **Progress bar on PRD nodes** | Thin 4px bar at bottom of node vs inline next to count vs radial progress indicator | Variants B/D used thin bar; Variant C used glow intensity as implicit progress |
| **Animation easing** | Transition timing for filter/highlight/hover transitions | 150-300ms recommended. Current: 150ms ease |
| **Ready "overlay" icon** | Check-circle overlay on top-right of ready nodes vs no overlay (glow-only) vs small badge | Optional. Glow ring alone is sufficient if clear enough |
| **Hover dimming threshold** | How much non-connected nodes dim on hover (opacity 0.25 to 0.45) | 0.35 in brief spec. Adjustable for legibility |
| **Node corner radius** | Current: `var(--radius) * 1` (~8px). Adjustable within 6-12px | Match issue card v2 corner radius for consistency |

---

## 10. Inspiration & Quality Bar

### Visual References

- **Linear's Project Graph** — PRD-level dependency layout with clean card nodes and minimal edges
- **GitHub Projects roadmap** — Compact node cards with status pills and progress indicators
- **Notion graph view** — Subtle edges, glow on hover, atmospheric feel
- **Existing `DependencyGraphView`** in this repo — Preserve geometry conventions from dagre, modernize the node chrome and visual states
- **Existing `WorkspaceCard` moss glow** — Adopt the same moss glow breathing animation for "ready" node consistency across the app
- **Issue Card v2 Variants F, G, H** — The quality bar for this brief. Specifically:
  - **Variant F (Veil)**: Seamless top-down gradient on nodes, high information density, soft atmospheric feel
  - **Variant G (Refined Horizon)**: Left-to-right gradient headers on nodes, crisp 1px boundary, most polished overall
  - **Variant H (Radiant)**: Node emanation as the focal point, opaque dark body with glow surround

### Existing Variants (4 produced)

- **Variant A** (`variant-a.html`): Base implementation — no gradient, bordered badges, pulsing ready animation
- **Variant B** (`variant-b.html`, `VARIANT-B.md`): **Horizon Nodes** — gradient header treatment echoing Issue Card v2 Refined Horizon, Style B borderless-dark badges, steady glow, cubic bezier edge routing, skeleton loading mirroring node shape
- **Variant C** (`variant-c.html`, `VARIANT-C.md`): **Radiant Graph** — radial gradient emanation per node, Style B badges, orthogonal edge routing with 8px Q arcs, SVG glow filter on ready-to-ready edges, darker canvas background
- **Variant D** (`variant-d.html`, `VARIANT-D.md`): **Veil Network** — seamless top-down gradient blend, highest density (96px nodes with 5 data rows), Style B badges, orthogonal routing, mini-stat line per node

---

## 11. Not Included (Out of Scope)

- **Editing dependencies** (add/remove blocker links) — Separate feature, not in #275 [Issue #275]
- **Timeline / Gantt rendering** — Future tab in PRD #219 [PRD #219]
- **PRD progress chart drilldowns** — Owned by PRD #93 Metrics [CONTEXT.md]
- **Cross-workspace blocking** — Single-workspace scope only [Issue #275]
- **Drag-to-reposition nodes** — Auto-layout only [Brief decision]
- **PRD creation/editing** — Use GitHub or `/mp-to-prd` [PRD #219]
- **Kanban drag-and-drop integration** — Separate component, PRD #168 [DECISIONS.md]

---

## 12. Implementation Notes (for Refine Phase)

### Backend

- `get_issue_dependencies` Tauri command returns `IssueDependency[]` with `blocker_issue_id` and `blocked_issue_id`. Already implemented and used [Issue #275]
- PRD-level edges derived by aggregating sub-issue blockers across PRD boundaries via `aggregatePrdEdges()` in `prd_grouping.ts` [dagre_layout.ts]
- PRD identification: issues with `prd` label, sub-issues linked via `parent_issue_id` FK [prd_grouping.ts `isPrdIssue`, `findPrdId`]
- Mock data: `MOCK_ISSUE_DEPENDENCIES` in `tauri_mock_data.ts` [Issue #275 notes]

### Ready State

- `classifyReadyState()` in `ready_state.ts` already handles the full cascade: closed → design-needed → open blockers → AFK → HITL [ready_state.ts]
- `buildOpenBlockerCounts()` counts open (non-closed) blockers per issue [ready_state.ts]
- `SPECIAL_LABELS` from `visualization` module provides canonical label names [ready_state.ts imports]

### New Routes (Future)

- `/prd` route (workspace-scoped) with `Overview | Dependencies | Timeline` tabs — Mode B surface [PRD #219]
- Mode A already wired in `WorkspaceBottomPanel.svelte` under the `dependencies` tab [WorkspaceBottomPanel.svelte line 244]

### Persistence

- Filter state + "ready only" toggle: persist per surface in localStorage using `Persisted` class from `$lib/reactivity/persisted.svelte.ts` [Brief decision]
- View mode and selected PRD: persist per workspace in URL state via `url_state_sync.svelte.ts` [existing pattern]

### Existing Source Files (https://github.com/MartinoPolo/Grovekeeper)

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/components/blocks/dependency-graph/DependencyGraphView.svelte` | 350 | Root orchestrator — layout computation, view mode, filtering |
| `src/lib/components/blocks/dependency-graph/DependencyGraphCanvas.svelte` | 274 | SVG canvas with pan/zoom |
| `src/lib/components/blocks/dependency-graph/DependencyGraphNode.svelte` | 308 | Individual node rendering (PRD + issue) |
| `src/lib/components/blocks/dependency-graph/DependencyGraphFilterBar.svelte` | 136 | Filter controls |
| `src/lib/components/blocks/dependency-graph/DependencyGraphViewSwitcher.svelte` | 85 | Global/PRDs/Single PRD tabs |
| `src/lib/modules/dependency-graph/dagre_layout.ts` | 305 | dagre graph construction + 3 layout functions |
| `src/lib/modules/dependency-graph/prd_grouping.ts` | 117 | PRD detection, grouping, edge aggregation |
| `src/lib/modules/dependency-graph/ready_state.ts` | 73 | Ready state classification + blocker counting |
| `src/lib/modules/dependency-graph/filters.ts` | 59 | Filter types + application logic |
| `src/lib/modules/dependency-graph/types.ts` | 33 | Node/edge types + dimension constants |
| `src/lib/modules/dependency-graph/view_modes.ts` | 7 | View mode constants |
| `src/lib/components/blocks/layout/WorkspaceBottomPanel.svelte` | 269 | Host component — wires DependencyGraphView into Dependencies tab |
