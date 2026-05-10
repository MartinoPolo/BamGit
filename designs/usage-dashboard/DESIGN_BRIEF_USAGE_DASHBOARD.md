# Usage Dashboard v2 — Design Spec

Redesign of the `/usage` analytics dashboard with LayerChart-based visualizations, configurable color themes, workspace scoping, and enhanced interactivity. The dashboard is the primary metrics surface — workspace-scoped by default with a global toggle. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono. Chart colors: `--chart-1` through `--chart-5` CSS variables (to be defined per color theme).

## Container Context

**Parent**: None — standalone page (`/usage` route)
**This component is standalone** — it owns its full page chrome including header, filters, and content area.

## Purpose

Primary metrics and analytics surface for tracking AI usage costs, session patterns, and tool efficiency. Users check this to understand spending trends, identify expensive sessions, evaluate one-shot success rates, and spot optimization opportunities.

## Required Elements

### Page Header

- **Title**: "Usage Analytics" (text-2xl, font-bold)
- **Right-side button group** (all `icon-sm` size, `secondary` variant):
    - Color theme shortcut (palette icon) — opens Popover with 3 theme options
    - Trophy button — `{unlockedCount}/{total}` — opens Achievements Dialog
    - RefreshIndicator component (see separate brief)
    - Export CSV button (download icon)

### Filter Bar

- **Period tabs**: today | 7d | 30d | Month | All | Custom
    - Active tab: `bg-background text-foreground shadow-sm`
    - Inactive: `text-muted-foreground hover:text-foreground`
    - "Custom" tab opens Popover with RangeCalendar (2-month, `@internationalized/date`)
- **Scope toggle**: "This workspace" | "All workspaces" (ToggleGroup or Select)
- **Group by dropdown**: None | Model | Provider | Category (Select component)

### KPI Cards (4 cards)

Each card uses `Card.Card` with internal padding. Content:

- Label: `text-sm text-muted-foreground`
- Value: `text-2xl font-bold` (Geist Mono for numbers)
- Subtitle: `text-xs` with delta indicator or context info

| Card          | Value   | Delta/Context                                       |
| ------------- | ------- | --------------------------------------------------- |
| Total cost    | `$X.XX` | `+/-N% vs prev period` (green if down, amber if up) |
| Sessions      | `N`     | `+/-N vs prev period`                               |
| One-shot rate | `N%`    | `industry avg ~62%`                                 |
| Cache hit     | `N%`    | `saving ~$X.XX/mo`                                  |

### Cost Chart (LayerChart)

- **Chart type**: Bar chart (`BarChart` from layerchart)
- **Adaptive granularity**: hourly bars (today), daily (7d/30d/month), weekly/monthly (all-time)
- **Y-axis**: 3-4 gridlines with dollar amounts (`$0`, `$2`, `$4`, `$6`)
- **X-axis**: Date/time labels at start and end, tick marks at gridlines
- **Bar coloring**: Per selected theme:
    - Monochrome: `bg-primary` with `opacity` 30%-100% based on relative cost
    - Traffic Light: green (<33% max) / amber (33-66%) / red (>66%)
    - Gradient: 3-stop positional (blue-cyan -> yellow-orange -> red-orange)
- **Hover**: ChartTooltip component (see below) via `{#snippet tooltip()}` on LayerChart
- **When grouped** (by Model/Provider): stacked or grouped bars using `--chart-1` through `--chart-5`
- **Container**: `Card.Card` with title "Cost per day" (adapts label: "Cost per hour", "Cost per week")
- **Height**: 128-160px chart area

### ChartTooltip Component

Rich hover tooltip anchored to chart elements. Uses `Tooltip.Root` + `Tooltip.Trigger` + `Tooltip.Content` primitives.

Content layout:

```
Date/time label          (font-semibold, 11px)
$X.XX · N sessions       (10.5px, leading-relaxed)
Top: Category (N%)       (10.5px, text-muted-foreground)
```

- Width: `w-[200px]`, `whitespace-normal`, `p-2.5`
- Appears on hover over chart bars, disappears on mouse leave
- Side: `top` with `sideOffset={8}`

### Activity Breakdown

- Grid layout: `grid-cols-[120px_1fr_64px_44px_44px]`
- Header row with column labels (Category, bar, Cost, Turns, 1-shot)
- Per-category row: name, proportional bar (within Card), cost, turn count, one-shot % with dot indicator
- One-shot dot colors: green (>=75%), amber (>=60%), red (<60%), muted dash (0%)
- Bars use the selected color theme (same as chart bars)

### Top Sessions

- List of top 5 sessions by cost
- Per session: issue number (muted), issue name (truncate), cost (tabular-nums, right-aligned)
- No issue → "Ad-hoc session"
- Clickable: navigates to session detail (future)

### Tool Calls

- Horizontal bar chart (within Card)
- Grid: `grid-cols-[80px_1fr_48px]` — tool name, bar, count
- Top 10 tools, ordered by count descending
- Bars use `bg-primary/70`

### Color Theme Picker (Popover)

Triggered by palette icon button in header. Popover content:

- 3 radio options with visual preview swatch per theme
- "Monochrome" — green opacity scale preview
- "Traffic Light" — red/amber/green dot preview
- "Gradient" — small gradient bar preview
- Divider + "Applies to: [This workspace / All workspaces]" toggle

### Achievements Dialog

- Triggered by Trophy button
- Dialog with title "Achievements" and subtitle "{N} of {total} unlocked"
- 2-column grid of achievement cards
- Each card: icon area (TrophyIcon, primary when unlocked, muted when locked), name, description, progress bar
- Unlocked: `border-primary/30 bg-primary/5`, locked: `opacity-50`

## States

List every state that must be designed:

- **Default loaded state**: 30d period, workspace scope, data populated
- **"Today" period**: hourly bars in cost chart
- **"Custom" period**: date range popover open with RangeCalendar
- **Grouped by Model**: stacked/grouped bars with legend in cost chart
- **Global scope**: all workspaces selected
- **Empty state**: no data for selected period (show illustration + message)
- **Loading state**: skeleton loaders for KPI cards, chart area, and tables
- **Color theme variants**: Monochrome, Traffic Light, Gradient applied to same data
- **Hover states**: chart bars showing ChartTooltip, button hover states
- **Popover open states**: Color theme picker popover, custom date range popover
- **Dialog open state**: Achievements Dialog displayed
- **Export in progress**: CSV export button showing loading indicator
- **RefreshIndicator states**: All 5 states from RefreshIndicator component

## Reusable Components

- `Button`: `icon-sm` for header actions, `secondary` variant
- `Card.Card`: all content sections
- `SimpleTooltip`: header button tooltips
- `Tooltip.Root/Trigger/Content`: ChartTooltip (rich content)
- `Dialog`: achievements display
- `Popover`: color theme picker, custom date range
- `Select`: scope toggle, group-by dropdown
- `Badge`: delta indicators on KPI cards
- `cn()`: conditional class merging for theme-based bar colors

## Components to Adopt

- `Calendar` + `RangeCalendar` from shadcn-svelte registry (bits-ui primitives)
- `Chart.Container` + `Chart.Tooltip` from shadcn-svelte chart component
- `layerchart` BarChart, LineChart, Highlight primitives
- `@internationalized/date` for date value types

## Layout Constraints

- Full page width with `p-8` padding, `gap-6` between sections
- KPI cards: `grid-cols-4 gap-4` (responsive: collapse to 2-col on narrow)
- Chart area: minimum 128px height, maximum 200px
- Activity + right column: `grid-cols-[1.4fr_1fr] gap-4`
- All number values use `tabular-nums` for alignment

## Visual References

- Current implementation: `src/routes/usage/+page.svelte`
- CodeBurn TUI dashboard: `C:/_MP_github_cloned/codeburn/src/dashboard.tsx` (layout, color gradient, panels)
- Workspace card stat cells: `src/lib/components/ui/stat-cell/` (similar number formatting)
- shadcn-svelte chart examples: `C:/_MP_github_cloned/shadcn-svelte/docs/src/lib/registry/blocks/`

## UI Freedom

- Chart aspect ratio and container sizing
- KPI card internal layout (horizontal vs stacked labels)
- Filter bar positioning and grouping
- Whether breakdown tables use alternating row backgrounds
- Transition animations between period switches
- How the "Group by" mode visually transforms the chart (stacked vs grouped vs separate)
- Empty state illustration/messaging

## Not Included

- Optimize View (separate brief: OPTIMIZE_VIEW.md)
- Compare View (separate brief: COMPARE_VIEW.md)
- Widget drag-and-drop customization (deferred to v2)
- Real-time streaming cost updates during active sessions
- Budget/plan tracking overlay
