# Bottom Panel Multi-Panel Layout — Design Brief

Configurable multi-panel layout for the workspace dashboard bottom panel. Allows displaying multiple views side-by-side (Issues + Issue Detail, Dependencies + Session, etc.). The bottom panel occupies ~75% of vertical space in typical use — this is the PRIMARY workspace. Multi-panel splits unlock simultaneous viewing of different perspectives without tab-switching. Hand this to a designer for visual exploration.

**Source**: PRD #254 (Dashboard UX Refresh). Existing issue #122 (Collapsible split panel — CLOSED, implemented the forest/bottom vertical split).
**Gold standard reference**: `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md`

---

## 1. Purpose

Enable viewing multiple perspectives simultaneously within the bottom panel — e.g., issue card list on the left while inspecting issue detail on the right, or watching a session while browsing dependencies. This is a **crucial power-user feature**: the bottom panel has substantial real estate (~75% of main area height) and developers frequently need to cross-reference between tabs (Issues + Issue Detail, Dependencies + Session, Issues + Assigned Issues).

**Key value**: Reduces tab-switching friction. Enables workflows like "browse issues while reading detail," "monitor session while checking dependencies," and "auto-open session panel when spawning from an issue card."

---

## 2. Surrounding Context

The mockup **MUST** show the full viewport with all chrome elements. The bottom panel is nested inside a larger layout:

### Full Viewport Structure (left to right, top to bottom)

**Left Sidebar** (~240px expanded, ~48px collapsed):
- Brand mark + "Grovekeeper" title (top)
- Workspace selector dropdown
- 5 nav items: Dashboard (TreesIcon), Sessions (CodeIcon), AI Config (SparklesIcon), Usage (BarChart3Icon), Workspace Settings (WrenchIcon)
- Language switcher (bottom section)
- Theme toggle (bottom section)
- User avatar + Settings gear icon (bottom)
- Source: `DashboardSidebar.svelte`

**Main Area** (right of sidebar, full remaining width):

- **TopBar** (single row, border-bottom):
  - Left: Dashboard name (h1, 17px semibold) + subtitle (mono 10px, e.g., "personal . 8 issues")
  - Right: Sync (RefreshCwIcon), Notifications (BellIcon), Quick Ideas (LightbulbIcon), Toggle Forest (TreesIcon), Create Issue (PlusIcon + "Create Issue" primary button)
  - Source: `TopBar.svelte`

- **Forest Panel** (top ~25% of main area, collapsible via paneforge):
  - Canvas showing tree visualizations of issues
  - Collapsible upward via the styled resizer handle
  - Source: `WorkspaceDashboardLayout.svelte` — vertical `PaneGroup` with `StyledPaneResizer`

- **StyledPaneResizer** (horizontal bar between forest and bottom panel):
  - 4px height, centered 8px-wide pill indicator
  - Cursor: `row-resize`, highlights on hover/active
  - Source: `StyledPaneResizer.svelte`

- **Bottom Panel** (~75% of main area) — **THIS IS WHERE THE FEATURE LIVES**:
  - Currently: single tab bar (centered) + single content area
  - Tab bar: Issues, Kanban, Issue Detail, Dependencies, Activity, Session, Assigned Issues
  - This brief adds: split capability WITHIN the bottom panel, each sub-panel having its own tab
  - Source: `WorkspaceBottomPanel.svelte`

### Hierarchy

```
Viewport
├── DashboardSidebar (left, 240px)
└── Main Area (right, flex-1)
    ├── TopBar (fixed height ~52px)
    └── WorkspaceDashboardLayout (flex-1)
        ├── Pane: ForestView (~25%, collapsible)
        ├── StyledPaneResizer
        └── Pane: WorkspaceBottomPanel (~75%, minSize=20%)
            ├── Tab bar (36px, centered)
            └── Content area ← MULTI-PANEL SPLITS GO HERE
```

---

## 3. Requirements

### 3.1 Layout Presets (Source: PRD #254)

| Preset | Description | Panel Count | Paneforge Nesting |
|--------|-------------|-------------|-------------------|
| Single | One full-width panel | 1 | No nesting |
| Side-by-side | Two horizontal panels | 2 | Horizontal `PaneGroup` |
| Quad | Four equal panels (2x2) | 4 | Vertical `PaneGroup` > 2x horizontal `PaneGroup` |
| Top-merged | One panel top, two bottom | 3 | Vertical `PaneGroup` > bottom horizontal `PaneGroup` |
| Bottom-merged | Two panels top, one bottom | 3 | Vertical `PaneGroup` > top horizontal `PaneGroup` |
| Left-merged | One panel left, two right | 3 | Horizontal `PaneGroup` > right vertical `PaneGroup` |
| Right-merged | Two panels left, one right | 3 | Horizontal `PaneGroup` > left vertical `PaneGroup` |

### 3.2 Per-Panel Tab System

- Each sub-panel has its **own independent tab bar** showing available views
- Available tabs: Issues, Kanban, Issue Detail, Dependencies, Activity, Session, Assigned Issues (same as `BOTTOM_PANEL_TABS` in `selection.ts`)
- Each panel can show any view independently
- **Duplicate views allowed** across panels (e.g., two panels both showing Issues is valid)
- When only one panel (Single preset), behavior is identical to current implementation
- Tab click toggles the same tab off (existing behavior in `handleTabClick`)

### 3.3 Smart Defaults (Source: PRD #254)

- **Session spawned from issue card**: Auto-switch to Side-by-side, Session view in right panel, Issues remains in left panel
- **Issue activated (single-click)**: If a second panel exists, show Issue Detail there. If single panel, switch tab as today
- **First launch**: Single panel (no split)
- **Panel close**: When closing a sub-panel (bringing count from 2+ to 1), the remaining panel keeps its current tab

### 3.4 Layout Persistence (Source: PRD #254)

- Per-workspace, stored in DB (new column on `dashboards` table or separate `panel_layouts` table)
- Remembers: which preset, which tab each panel was showing, panel size ratios
- Restores on workspace reopen
- Stored as JSON blob: `{ preset: string, panels: Array<{ tab: string, sizePercent: number }> }`

### 3.5 Splitting Behavior

- Max panels: **4** (quad layout)
- Split direction depends on preset (horizontal, vertical, or nested)
- Each panel maintains minimum size (enforced by paneforge `minSize`)
- No free-form splitting — only the 7 defined presets

---

## 4. Existing Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `PaneGroup` | paneforge | Outer and nested panel groups |
| `Pane` | paneforge | Individual resizable sub-panels |
| `PaneResizer` | paneforge | Resize handles between sub-panels |
| `StyledPaneResizer` | `blocks/layout/StyledPaneResizer.svelte` | Existing styled resizer (horizontal, for forest/panel split). Adapt for vertical variant |
| `Tabs.Root` + `Tabs.Tab` | `shadcn/tabs/` | Per-panel tab bars |
| `Button` (ghost, icon-sm) | `shadcn/button/` | Layout switcher trigger, close panel button |
| `SimpleTooltip` | `shadcn/tooltip/` | Tooltips on layout preset thumbnails and panel controls |
| `Popover` | `shadcn/popover/` | Layout switcher popover |
| `DropdownMenu` | `shadcn/dropdown-menu/` | Alternative for layout switcher if popover is too heavy |
| `Separator` | `shadcn/separator/` | Visual dividers within popover |
| `Kbd` | `shadcn/kbd/` | Keyboard shortcut hints |
| All tab content components | Various | `IssueCardList`, `IssueDetail`, `DependencyGraphView`, `AssignedIssuesPanel`, `PrdOverview` |

---

## 5. Components to Design

### 5.1 MultiPanelContainer

**Role**: Replaces the current single content area in `WorkspaceBottomPanel`. Orchestrates nested `PaneGroup`/`Pane` based on active preset. Each child `Pane` renders a `SubPanel`.

### 5.2 SubPanel

**Role**: Single sub-panel within the multi-panel layout. Contains its own tab bar and content area.

Elements:
- **Tab bar** (compact, per-panel — NOT the current centered full-width tabs)
- **Panel header**: tab bar + close button (X) to remove this sub-panel
- **Content area**: renders the selected tab's content component
- When panel is the **only** panel, no close button shown

### 5.3 SubPanelTabBar

**Role**: Compact tab bar for a single sub-panel. Narrower than the current full-width centered tabs.

Elements:
- Horizontally scrollable if tabs overflow the panel width
- Active tab indicator
- Unlinked count badge on Assigned Issues tab (same as current)
- When panel width < ~300px, tabs become icon-only with tooltips

### 5.4 LayoutSwitcherButton

**Role**: Trigger button in the panel toolbar that opens the layout switcher popover.

Elements:
- Icon-only ghost button (`LayoutGridIcon` or `ColumnsIcon`)
- Shows current layout as the icon state (optional)
- Positioned at the far-right of the shared toolbar above all panels

### 5.5 LayoutSwitcherPopover

**Role**: Popover showing visual thumbnails of the 7 layout presets.

Elements:
- Grid of 7 preset thumbnails (CSS-rendered, ~52x36px each — as explored in Variant A)
- Active preset highlighted with `--primary` ring
- Tooltip on hover showing preset name
- Keyboard navigable (arrow keys, Enter to select)
- Anchored to the layout switcher button (above, right-aligned — per Variant A decision)

### 5.6 VerticalPaneResizer

**Role**: Styled vertical resize handle between side-by-side sub-panels. Same design language as `StyledPaneResizer` but rotated 90 degrees.

Elements:
- 4px width, cursor: `col-resize`
- Centered vertical pill indicator (3px wide, 32px tall)
- Highlights on hover/active with `bg-border` transition

### 5.7 PanelSplitButton (optional, per-panel)

**Role**: Small button on each sub-panel header to split that panel further (if preset allows).

Elements:
- Icon-only ghost button (SplitIcon or ColumnsIcon)
- Only visible when current panel count < 4
- Click splits the panel in the direction appropriate for the current layout

---

## 6. Layout & Dimensions

### 6.1 Panel Sizing

| Constraint | Value | Source |
|-----------|-------|--------|
| Bottom panel min-height | 20% of viewport | Existing `WorkspaceDashboardLayout` `minSize={20}` |
| Sub-panel min-width | 250px | Ensures tab bar + content remain usable |
| Sub-panel min-height | 150px | For vertical splits (quad, merged presets) |
| Per-panel tab bar height | 32px | Slightly smaller than current 36px to save space in multi-panel |
| Layout switcher popover | ~280px wide | Fits 4-column grid of 7 thumbnails |
| Preset thumbnail size | 52x36px | Per Variant A implementation |

### 6.2 Default Split Ratios

| Preset | Default Sizes |
|--------|--------------|
| Side-by-side | 50% / 50% |
| Quad | 50%/50% horizontal x 50%/50% vertical |
| Top-merged | 50% top / 50% bottom (bottom: 50%/50%) |
| Bottom-merged | 50% top (top: 50%/50%) / 50% bottom |
| Left-merged | 40% left / 60% right (right: 50%/50%) |
| Right-merged | 60% left (left: 50%/50%) / 40% right |

### 6.3 Tab Bar Behavior Per Panel Width

| Panel Width | Tab Rendering |
|-------------|--------------|
| >= 500px | Full text labels (same as current) |
| 300-499px | Abbreviated labels or horizontally scrollable |
| < 300px | Icon-only tabs with tooltips |

### 6.4 Split Directions

- **Horizontal splits**: New `PaneGroup direction="horizontal"` nested inside the bottom panel's content area
- **Vertical splits within bottom panel**: New `PaneGroup direction="vertical"` for quad/merged layouts
- All use paneforge's `autoSaveId` for size persistence, keyed per workspace

---

## 7. States & Interactions

### 7.1 Layout States

| State | Description | Panel Count |
|-------|-------------|-------------|
| **Single** | Default. Full-width, current behavior | 1 |
| **Side-by-side** | Two panels, horizontal split | 2 |
| **Quad** | 2x2 grid | 4 |
| **Top-merged** | 1 top + 2 bottom | 3 |
| **Bottom-merged** | 2 top + 1 bottom | 3 |
| **Left-merged** | 1 left + 2 right | 3 |
| **Right-merged** | 2 left + 1 right | 3 |

### 7.2 Per-Panel States

| State | Description |
|-------|-------------|
| **Active tab** | Currently displayed view in this panel |
| **Inactive tabs** | Other available tabs |
| **Tab hover** | Hover highlight on tab |
| **Empty** | No tab selected (placeholder text: "Select a view") |
| **Content loading** | Tab content is loading (skeleton or spinner) |

### 7.3 Resize States

| State | Description |
|-------|-------------|
| **Resizer default** | Thin line between panels, minimal visual weight |
| **Resizer hover** | Pill indicator becomes visible, border highlights |
| **Resizer active (dragging)** | Primary color highlight, smooth resize tracking |
| **Panel at minimum** | Paneforge enforces `minSize`, cursor changes to indicate limit |

### 7.4 Panel Management

| Action | Result |
|--------|--------|
| **Select preset** | Layout changes, panels resize. New panels default to the first unshown tab, or Issues if all tabs are shown |
| **Close panel (X)** | Panel removed. If 2 panels, revert to Single. If 3-4, merge adjacent panels |
| **Split panel** | If below max panels, split the current panel. New panel gets first unshown tab |
| **Switch preset** | All panels re-arrange. Tabs assigned left-to-right, top-to-bottom from the previous state. Extra tabs from removed panels are dropped (first N panels keep their tabs) |

### 7.5 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+\` | Toggle between Single and last-used multi-panel preset |
| `Ctrl+Shift+\` | Open layout switcher popover |
| Arrow keys (in popover) | Navigate preset grid |
| Enter (in popover) | Select highlighted preset |
| Escape (in popover) | Close popover |

### 7.6 Smart Default Triggers

| Trigger | Auto-Action |
|---------|------------|
| Session spawned from issue card | Switch to Side-by-side if Single. Left: Issues, Right: Session |
| Issue activated (click) | If 2+ panels, show Issue Detail in the panel that does NOT have Issues. If Single, switch tab |
| All panels closed to one | Revert to Single preset |

### 7.7 Responsive States

| Viewport Width | Behavior |
|---------------|----------|
| >= 1200px | All presets available |
| 800-1199px | Quad disabled (too cramped). Side-by-side and merged presets available |
| < 800px | Multi-panel disabled. Single only. Layout switcher hidden |

---

## 8. Design Constraints (Non-Negotiable)

- Must use paneforge `PaneGroup`/`Pane`/`PaneResizer` primitives — no custom drag implementations
- Must integrate with existing `BOTTOM_PANEL_TABS` type and `useSelection()` context
- Only the 7 defined presets — no free-form panel arrangements
- Max 4 panels simultaneously
- Per-panel tab bars must support all existing tabs
- Must work with forest panel above (the forest/bottom vertical split is unchanged)
- Layout switcher must be keyboard-accessible
- Panel resizers must match `StyledPaneResizer` design language
- Tab content components receive the same props as today — multi-panel is a layout concern, not a data concern
- Must respect the existing `autoSaveId="grovekeeper-forest-split"` for the outer vertical split
- Typography: Geist (sans) / Geist Mono (mono)
- Use token system from `designs/tokens.css`, OKLCH color space
- No floating/detachable panels
- No drag-and-drop panel reordering
- No saving custom layout presets beyond the 7 built-in

---

## 9. Design Freedom

- **Layout switcher placement**: Far-right of toolbar (Variant A approach) vs. integrated with tab bar vs. floating button
- **Thumbnail visual style**: CSS-rendered divs (Variant A approach) vs. SVG icons vs. simplified grid icons
- **Per-panel tab bar style**: Full reproduction of current centered tabs vs. compact left-aligned tabs vs. dropdown selector per panel
- **Panel border/separator styling**: Thin line (matching StyledPaneResizer) vs. subtle gap vs. shadow separation
- **Close button placement**: Top-right of each sub-panel header vs. inside tab bar vs. context menu only
- **Transition animation**: Instant preset switch vs. animated resize transition (150-300ms ease)
- **Empty panel state**: Placeholder text vs. tab selection prompt vs. recent/suggested tabs
- **Panel header height and density**: How much chrome per sub-panel
- **Whether split button appears per-panel or only in the layout switcher**
- **Whether tab bar scrolls horizontally or wraps** at narrow widths
- **Whether the layout switcher shows text labels, just thumbnails, or both**
- **Popover anchor point and direction** (above button, below button, left/right)

---

## 10. Inspiration & References

### VS Code Terminal Split Panels
- Horizontal and vertical splits
- Per-panel dropdown for terminal selection
- Split button on each panel header
- Clean resize handles
- Close (X) button per panel

### VS Code Editor Split
- Side-by-side editor groups
- Tab bar per group
- Drag tabs between groups
- Layout presets in View menu

### Issue Card v2 Quality Bar
- Reference `ISSUE_CARD_FINAL_DECISIONS.md` for the level of detail expected in final decisions
- 22-state cascades, 14-priority contextual actions, 3 badge styles, 3 card variants — thorough enumeration of every state
- CSS-only variants driven by `data-` attributes and custom properties
- Settings cascade (user -> workspace) pattern for persistence

### Existing Variant Explorations
Five HTML mockup variants already exist in `designs/bottom-panel-multipanel/variants/`:
- `variant-a.html` — Floating switcher popover (documented in `VARIANT.md`)
- `variant-b.html` through `variant-e.html` — additional explorations

---

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

- Surfaces: `--surface-1`, `--surface-2`, `--surface-3`, `--surface-hover`
- Borders: `--border`, `--border-strong`
- Text: `--foreground`, `--foreground-muted`, `--foreground-subtle`
- Primary: `--primary` (moss green for active states)
- Interactive: `bg-primary`, `ring-ring`

---

## Container Context

**Parent**: `WorkspaceDashboardLayout` — the bottom `Pane` in the vertical paneforge split (forest above, bottom panel below, `StyledPaneResizer` between them)

**This component IS the bottom panel container** — it owns the tab bars, panel chrome, resizer handles, layout management, and preset switching. Child tab content components (IssueCardList, IssueDetail, DependencyGraphView, AssignedIssuesPanel, etc.) fill the content areas that each sub-panel provides.

**Selection context**: `useSelection()` from `$lib/modules/board` provides `activeIssueId`, `hoveredIssueId`, `activeTab`, `prdIssueId`, `forestCollapsed`, and batch selection. Multi-panel needs to extend or work alongside this — each sub-panel may track its own active tab while the global `activeIssueId` remains shared.

---

## States to Explore in Variants

**Initial variants should show**:
- Side-by-side layout with Issues (left) + Issue Detail (right) — most common use case
- Layout switcher popover with all 7 preset thumbnails
- Dark mode (primary theme)
- Full viewport with sidebar + topbar + forest (small, ~25%) + bottom panel (~75%) containing the split

**States to design after variant selection**:
- Quad layout with 4 different views
- Three-panel layouts (all 4 merge variants)
- Panel being resized (drag state)
- Narrow viewport where quad becomes impractical
- Empty panel (no view selected)
- Light mode
- Single panel (unchanged current behavior)
- Smart default trigger: session spawned, auto-opening side-by-side
- Collapsed sidebar (48px) with wider main area

---

## Not Included

- Drag-and-drop panel reordering (tabs are assigned per-panel, not dragged between them)
- Saving custom layout presets beyond the 7 built-in
- Floating/detachable panels
- Panel maximization (double-click to expand one panel to full)
- Changes to the forest/bottom-panel vertical split behavior
- Tab content component changes (they receive the same props regardless of multi-panel)
