# Usage Dashboard — Design Brief

Full-page analytics dashboard for tracking AI usage costs, token consumption, session statistics, and spending trends. Accessible via the "Usage" nav item (BarChart3Icon) in the sidebar. This is the primary metrics surface — workspace-scoped by default with a global toggle. Heatmap calendar chosen as primary visualization (Variant E decision). Hand this to a designer for visual exploration.

---

## 1. Purpose

Cost tracking, usage analytics, and spending awareness across sessions and providers. Users check this to:

- Understand spending trends and identify expensive sessions
- Track cost by provider, model, issue, and time period
- Evaluate one-shot success rates and cache efficiency
- Spot temporal patterns (weekday/weekend, sprint bursts, quiet periods)
- Detect optimization opportunities (feeds into Optimize view, #250)
- Compare model effectiveness (feeds into Compare view, #251)

PRD #93 (Metrics & Statistics). Related issues: #247 (backend wiring, closed), #248 (visual overhaul, closed), #249 (nav/URL/CostLink, closed). Open: #250 (optimize view), #251 (compare view), #309 (ColorThemePicker improvements).

---

## 2. Surrounding Context

**Parent**: None — standalone page (`/usage` route, SvelteKit SPA)
**Layout**:
- **Left**: Dashboard sidebar (240px, FINAL) — "Usage" nav item ACTIVE (highlighted with BarChart3Icon)
- **Top**: Page header with title + action buttons (within content area, not TopBar)
- **Content**: Full-width scrollable content area
- **NO forest/bottom panel split** — this is a separate analytics page, not the workspace dashboard

When accessed from the Overview window, scope defaults to "All workspaces" (global).

---

## 3. Requirements

### Data Requirements

| Metric | Source | Notes |
|--------|--------|-------|
| Total cost (USD) | `UsageStats.total_cost_usd` | Delta vs previous period |
| Session count | `UsageStats.session_count` | Delta vs previous period |
| One-shot rate | `UsageStats.one_shot_rate` | Industry avg ~62% benchmark |
| Cache hit ratio | `UsageStats.cache_hit_ratio` | Estimated monthly savings |
| Cost over time | `TimeBucketCost[]` | Adaptive granularity: hourly/daily/weekly/monthly |
| Grouped costs | `GroupedCostEntry[]` | By model, provider, or category |
| Activity breakdown | `ActivityBreakdown[]` | 13 categories with cost, turns, one-shot % |
| Top sessions | `TopSession[]` | Top 5 by cost with issue linkage |
| Tool usage | `ToolUsageBreakdown[]` | Top 10 tools by call count |
| Achievements | `Achievement[]` | 10 milestone-based, progress bars |
| Pricing status | `pricing_available: boolean` | Warning when pricing unavailable |

### Functional Requirements

- **Time range selection**: today, 7d, 30d, month, all, custom (RangeCalendar)
- **Scope toggle**: "This workspace" / "All workspaces"
- **Group by**: None / Model / Provider / Category
- **3 color themes**: Monochrome (primary opacity 30-100%), Traffic Light (green/amber/red), Gradient (blue/yellow/red). Persisted via `Persisted` class in localStorage
- **CSV export**: Respects active period filter
- **URL state sync**: All filters (period, scope, groupBy, custom date range) encoded in URL. Back/forward navigation works. Deep-linking supported
- **Refresh**: Event-driven (metrics-updated Tauri event), manual button, freshness timers (30s fresh → idle, 120s → stale)
- **Multi-currency**: Store USD, convert at display time via Frankfurter API. Currency preference in user settings
- **CostLink navigation**: Any cost value across the app can navigate here with filters pre-applied

---

## 4. Existing Components to Reuse

### Usage-Specific (Already Built)

| Component | File | Description |
|-----------|------|-------------|
| **CostChart** | `src/lib/components/blocks/usage/CostChart.svelte` | LayerChart bar chart with 3 color themes, grouped/stacked modes, adaptive time labels |
| **CostLink** | `src/lib/components/blocks/usage/CostLink.svelte` | Clickable cost value with magnitude coloring (low/medium/high), navigates to /usage with filters |
| **RefreshIndicator** | `src/lib/components/blocks/usage/RefreshIndicator.svelte` | 5-state refresh button (idle/loading/fresh/stale/new-data-available) |
| **ColorThemePicker** | `src/lib/components/blocks/usage/ColorThemePicker.svelte` | Popover with 3 theme radio options + swatch previews |
| **AchievementsDialog** | `src/lib/components/blocks/usage/AchievementsDialog.svelte` | Dialog with 2-column achievement grid, progress bars |
| **DateRangePicker** | `src/lib/components/blocks/usage/DateRangePicker.svelte` | Popover + 2-month RangeCalendar |
| **GroupByDropdown** | `src/lib/components/blocks/usage/GroupByDropdown.svelte` | Select: None/Model/Provider/Category |
| **ScopeToggle** | `src/lib/components/blocks/usage/ScopeToggle.svelte` | Select: This workspace / All workspaces |
| **cost_link_utils** | `src/lib/components/blocks/usage/cost_link_utils.ts` | `formatCostDisplay()`, `getCostMagnitude()` |
| **csv_export** | `src/lib/components/blocks/usage/csv_export.ts` | `exportUsageCsv()` |

### Usage Context

| Module | File | Description |
|--------|------|-------------|
| **UsageContext** | `src/lib/modules/usage/usage.context.svelte.ts` | Full page state: period, scope, groupBy, colorTheme (Persisted), dashboardData, achievements, refreshState, load/notify functions |
| **usage_types** | `src/lib/modules/usage/usage_types.ts` | `MetricsPeriod`, `GroupByOption`, `UsageScope`, `ChartColorTheme`, `RefreshState`, `PERIODS`, type guards |
| **url_state_sync** | `src/lib/modules/usage/url_state_sync.svelte.ts` | URL ↔ state two-way sync |

### Base Components

| Component | Use |
|-----------|-----|
| **Card** | All content sections |
| **Button** | `secondary` for header actions, `ghost` for compact controls |
| **Tabs** | Period selector tabs |
| **Badge** | Delta indicators, status badges |
| **Dialog** | Achievements display |
| **Popover** | Color theme picker, custom date range |
| **Select** | Scope toggle, group-by dropdown |
| **SimpleTooltip** | Header button tooltips |
| **Tooltip.Root/Trigger/Content** | Rich chart tooltips |
| **Separator** | Section dividers |
| **Skeleton** | Loading placeholders |
| **Progress** | Achievement progress bars |
| **Chart.Container / Chart.Tooltip** | LayerChart wrapper + tooltip formatting |
| **RangeCalendar** | Custom date range picker |

### Design System Classes

| Class | Use |
|-------|-----|
| `cb-panel` + `cb-panel-title` | Dense data sections with bracket-style `[HEADING]` |
| `cb-row` + `cb-num` + `cb-mute` | Dense data rows (activity breakdown, tool calls) |
| `cb-bar` / `cb-bar-cool` / `cb-bar-moss` | Gradient bars in breakdown tables |
| `cb-tabs` + `cb-tab` | Tabbed sub-sections |
| `gk-h2` / `gk-h3` / `gk-eyebrow` | Section headings and labels |
| `gk-badge-*` | Status indicators (success/warning/danger/info) |
| `font-mono` / `tabular-nums` | All numeric values |

---

## 5. Components to Design

### 5.1 Heatmap Calendar (Primary Visualization — Variant E Decision)

GitHub-contribution-style calendar grid replacing the traditional bar chart as the primary cost visualization. Each day is a colored cell where intensity maps to spend.

**Requirements**:
- 7-level intensity scale from empty surface through deep moss greens
- Two modes: **Colorful** (moss → yellow → red scale matching CostLink magnitude colors) and **Monocolor** (moss-only intensity scale). Adapts correctly to both dark and light mode
- Color scale: low = moss green, medium = golden yellow (distinct, not ambiguous), high = red (clearly danger). Match existing design tokens where possible
- Click any cell to reveal a **drill-down detail panel** below showing that day's sessions + category cost breakdown
- Week-total row: dashed-border row below calendar showing per-week cost totals
- Adaptive to selected period: full year (all), 6 months, 30 days, current month

### 5.2 Weekly Pattern Sidebar Panel

Mini 7-bar chart showing average daily spend by weekday (Mon-Sun). Surfaces recurring patterns unique to the heatmap approach.

### 5.3 Usage Summary Cards (KPI Strip)

4 cards in a horizontal row at the top of the page. Already implemented but may need visual refinement.

| Card | Value | Delta/Context |
|------|-------|---------------|
| Total cost | `$X.XX` | `+/-N% vs prev period` (green if down, amber if up) |
| Sessions | `N` | `+/-N vs prev period` |
| One-shot rate | `N%` | `industry avg ~62%` |
| Cache hit | `N%` | `saving ~$X.XX/mo` |

Each card: `Card.Card` with internal padding. Label `text-sm text-muted-foreground`, value `text-2xl font-bold` (Geist Mono), subtitle `text-xs` with delta indicator.

### 5.4 Activity Breakdown Table

Already implemented. Grid layout: `grid-cols-[120px_1fr_64px_44px_44px]`. Per-category: name, proportional bar, cost, turn count, one-shot % with dot indicator (green >=75%, amber >=60%, red <60%, muted dash = 0%). Bars should use the selected color theme.

### 5.5 Top Sessions List

Already implemented. Top 5 sessions by cost. Per session: issue number (muted), issue name (truncate), cost (tabular-nums, right-aligned). No issue = "Ad-hoc session". Clickable (navigates to session detail, future).

### 5.6 Tool Calls Chart

Already implemented. Horizontal bar chart within Card. Grid: `grid-cols-[80px_1fr_48px]` — tool name, bar, count. Top 10 tools, bars use `bg-primary/70`.

### 5.7 Time Range Picker

Already implemented. Tab bar with: today | 7d | 30d | Month | All | Custom. "Custom" opens Popover with 2-month RangeCalendar. Active tab highlighted.

### 5.8 Day Detail Panel (New — Heatmap Drill-Down)

Shown below the heatmap when a day cell is clicked. Split panel:
- **Left**: Session list for that day (issue number, issue name, cost, turns, model)
- **Right**: Category cost breakdown mini-bars

Persistent view (not tooltip) — stays open until another day is clicked or dismissed.

---

## 6. Layout & Dimensions

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: "Usage Analytics" + [Palette] [Trophy] [↻] [CSV]│
├──────────────────────────────────────────────────────────────┤
│  Filter Bar: [Today|7d|30d|Month|All|Custom] [Scope▾] [Group▾]│
├──────────────────────────────────────────────────────────────┤
│  KPI Cards (4x): [ Total Cost ] [ Sessions ] [ 1-Shot ] [ Cache ]│
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐ ┌──────────────────┐│
│  │  Heatmap Calendar (~70%)            │ │  Weekly Pattern   ││
│  │  + Click-to-drill detail panel      │ │  Sidebar (320px)  ││
│  │                                     │ │                   ││
│  └─────────────────────────────────────┘ └──────────────────┘│
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────┐ ┌─────────────────────────┐│
│  │  Activity Breakdown (1.4fr)  │ │  Top Sessions + Tool    ││
│  │                              │ │  Calls (1fr)            ││
│  └──────────────────────────────┘ └─────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

- Full page width with `p-8` padding, `gap-6` between sections
- KPI cards: `grid-cols-4 gap-4` (responsive: collapse to 2-col on narrow)
- Heatmap + sidebar: `grid-cols-[1fr_320px] gap-4`
- Activity + right column: `grid-cols-[1.4fr_1fr] gap-4`
- All number values use `tabular-nums` for alignment
- Minimum heatmap cell size: 14px (square)
- Day detail panel: full width of heatmap area, max 200px height

---

## 7. States & Interactions

### Page States

| State | Visual | Trigger |
|-------|--------|---------|
| **Default loaded** | 30d period, workspace scope, data populated | Initial load |
| **Loading** | Skeleton loaders for KPI cards, heatmap area, tables | Data fetch in progress |
| **Empty** | Illustration + "No usage data for this period" message | No data for selected filters |
| **Error** | Stale indicator + retry prompt | Backend fetch failed |

### Filter States

| State | Visual | Trigger |
|-------|--------|---------|
| **"Today" period** | Heatmap shows single day expanded (or falls back to hourly bar chart) | Period = today |
| **"Custom" period** | Date range popover open with RangeCalendar | Click "Custom" tab |
| **Grouped by Model** | Stacked/grouped bars with legend (in bar chart view) | GroupBy = model |
| **Global scope** | All workspaces selected, scope badge highlighted | Scope toggle change |

### Heatmap States

| State | Visual | Trigger |
|-------|--------|---------|
| **Cell hover** | Tooltip with date, cost, session count | Mouse enter on cell |
| **Cell selected** | Highlighted border, detail panel shown below | Click on cell |
| **No data cell** | Empty surface color | Zero cost for that day |
| **Max spend cell** | Brightest intensity color | Highest cost day |

### Component States

| State | Visual | Trigger |
|-------|--------|---------|
| **Color theme variants** | Monochrome / Traffic Light / Gradient applied | Theme picker change |
| **Popover open** | Color theme picker or custom date range | Button click |
| **Dialog open** | Achievements Dialog displayed | Trophy button click |
| **Export in progress** | CSV button shows loading indicator | Export button click |
| **RefreshIndicator** | 5 states: idle, loading (spin), fresh (<30s), stale (>2min), new-data-available (dot badge) | Timer / metrics-updated event |
| **Pricing unavailable** | Warning badge on cost values | `pricing_available = false` |

---

## 8. Design Constraints (Non-Negotiable)

- **Information density priority** — this is a data-heavy analytics page; maximize useful data per screen area
- **Must use semantic tokens** — all colors via CSS custom properties (`bg-primary`, `text-foreground`, etc.). No hardcoded colors
- **Dark theme primary** — light theme supported but dark is the design starting point
- **Geist / Geist Mono fonts** — sans for labels, mono for all numeric values
- **OKLCH color space** — all custom colors defined in OKLCH
- **Heatmap color scale**: low = moss green, medium = golden yellow, high = red. Colors must be clearly distinguishable from each other. Match CostLink magnitude colors (hue 142 low, hue 82 medium, hue 8 high)
- **4px base grid** — all spacing aligned to 4px increments
- `tabular-nums` on ALL numeric values for column alignment
- **No native `title` tooltips** — use ChartTooltip or SimpleTooltip
- **No backdrop blur** on overlays (decision: performance on weaker hardware)
- **Keyboard accessible** — every action reachable via keyboard. Tab through filters, Enter to select
- **Touch/mobile planned** — clickable targets must meet minimum touch size (32px)
- URL state sync for all filters — bookmarkable, shareable
- CostLink (finalized design) used for all clickable cost values. Magnitude-coded: low (moss, <$1), medium (golden yellow, $1-$20), high (red, >$20)
- Existing components are source of truth: CostChart, RefreshIndicator, ColorThemePicker, etc. already built and working. Design around them, don't redesign them

---

## 9. Design Freedom

- **Heatmap cell styling**: rounded vs sharp corners, gap between cells, cell size
- **Heatmap color interpolation**: discrete steps vs continuous gradient within each mode
- **Detail panel animation**: slide-down, fade-in, or instant
- **KPI card internal layout**: horizontal vs stacked labels, icon treatment
- **Section card styling**: flat vs elevated, border treatment
- **Whether breakdown tables use alternating row backgrounds**
- **Transition animations between period switches** (fade, slide, morph)
- **How the "Group by" mode visually transforms the heatmap** (overlay legend, separate heatmaps, stacked cells)
- **Empty state illustration/messaging**
- **Weekly pattern sidebar**: bar chart style, orientation, annotations
- **Whether to show both heatmap AND bar chart** (e.g., heatmap primary + small bar chart in sidebar) or heatmap-only
- **Day detail panel dismiss behavior**: click-away, X button, click-same-cell-again
- **Section ordering below heatmap** (activity breakdown position relative to top sessions / tool calls)
- **cb-panel vs Card styling** for data sections (CodeBurn TUI density vs shadcn Card polish)

---

## 10. Not Included (Separate Briefs / Future)

| Feature | Status | Reference |
|---------|--------|-----------|
| Optimize View | Separate brief | #250, `designs/OPTIMIZE_VIEW.md` |
| Compare View | Separate brief | #251, `designs/COMPARE_VIEW.md` |
| Widget drag-and-drop customization | Deferred to v2 | — |
| Real-time streaming cost updates during active sessions | Future | — |
| Budget/plan tracking overlay | Future | — |
| Advanced prompt analytics / A/B testing | Out of scope V1 | — |

---

## 11. Inspiration

- **CodeBurn TUI dashboard**: `C:/_MP_github_cloned/codeburn/src/dashboard.tsx` — layout, color gradient, cb-panel density
- **GitHub contribution heatmap**: Calendar grid pattern, intensity coloring, click-to-drill
- **Grafana dashboards**: Analytics panel arrangement, time range pickers, drill-down patterns
- **Issue Card v2 Final Decisions**: `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md` — gold standard for brief quality, state enumeration, component architecture

---

## 12. Visual References (Current Implementation)

| What | File |
|------|------|
| Usage page | `src/routes/usage/+page.svelte` |
| Usage context | `src/lib/modules/usage/usage.context.svelte.ts` |
| CostChart | `src/lib/components/blocks/usage/CostChart.svelte` |
| CostLink | `src/lib/components/blocks/usage/CostLink.svelte` |
| RefreshIndicator | `src/lib/components/blocks/usage/RefreshIndicator.svelte` |
| ColorThemePicker | `src/lib/components/blocks/usage/ColorThemePicker.svelte` |
| AchievementsDialog | `src/lib/components/blocks/usage/AchievementsDialog.svelte` |
| DateRangePicker | `src/lib/components/blocks/usage/DateRangePicker.svelte` |
| GroupByDropdown | `src/lib/components/blocks/usage/GroupByDropdown.svelte` |
| ScopeToggle | `src/lib/components/blocks/usage/ScopeToggle.svelte` |
| CostLink design decisions | `designs/cost-link/DECISION.md` + `SUMMARY.md` |
| Variant D (activity feed) | `designs/usage-dashboard/variants/VARIANT-D.md` |
| Variant E (heatmap, chosen) | `designs/usage-dashboard/variants/VARIANT-E.md` |
| Design tokens | `designs/tokens.css` |
| Workspace card stat cells | `src/lib/components/ui/stat-cell/` |
| shadcn-svelte chart examples | `C:/_MP_github_cloned/shadcn-svelte/docs/src/lib/registry/blocks/` |

---

## 13. Data Shapes (Rust → TypeScript via ts-rs)

```typescript
type UsageDashboardData = {
  stats: UsageStats;
  time_bucket_costs: TimeBucketCost[];
  grouped_costs: GroupedCostEntry[];
  activity_breakdown: ActivityBreakdown[];
  top_sessions: TopSession[];
  tool_usage: ToolUsageBreakdown[];
  pricing_available: boolean;
};

type UsageStats = {
  total_cost_usd: number;
  session_count: number;
  one_shot_rate: number;
  cache_hit_ratio: number;
  cost_delta_percent: number | null;
  session_count_delta: number | null;
};

type TimeBucketCost = { date: string; cost_usd: number; session_count: number };
type GroupedCostEntry = { date: string; group: string; cost_usd: number; session_count: number };
type ActivityBreakdown = { category: ActivityCategory; cost_usd: number; turn_count: number; one_shot_percent: number };
type TopSession = { session_id: string; issue_name: string | null; issue_number: number | null; cost_usd: number; turn_count: number; tool_call_count: number; started_at: string };
type ToolUsageBreakdown = { tool_name: string; call_count: number };
type Achievement = { kind: AchievementKind; display_name: string; description: string; threshold: number; progress: number; unlocked_at: string | null };
```

---

## 14. Base Components

StatCell, StatusRow, Card, Badge, Button (ghost | secondary), Tabs, Progress, Chart.Container, Chart.Tooltip, DropdownMenu, Select, Tooltip, Separator, Skeleton, Popover, Dialog, RangeCalendar, cb-panel / cb-row / cb-bar / cb-tabs, gk-h2 / gk-h3 / gk-eyebrow, CostChart, CostLink, RefreshIndicator, ColorThemePicker, AchievementsDialog, DateRangePicker, GroupByDropdown, ScopeToggle
