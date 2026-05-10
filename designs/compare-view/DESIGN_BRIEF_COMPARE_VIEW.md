# Compare View (Model Comparison) — Design Spec

Side-by-side comparison of two AI models based on performance, efficiency, and working style metrics. Accessed from the "Group by: Model" view on the usage dashboard. Helps users decide which model to use for different task types. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono. Use `--chart-1` and `--chart-2` for the two compared models.

## Container Context

**Parent**: Usage Dashboard page — sub-view accessed from "Group by: Model" or compare action
**What parent provides**: Usage page layout, navigation header, period/scope filters
**What this component fills**: The main content area of the Usage page, replacing or overlaying the default dashboard view
**Must NOT include**: Page-level navigation, period filter bar — these belong to the Usage Dashboard page

**Mockup rendering**: Show the Usage page header and filter bar as read-only context at ~40% opacity. The designed component fills the main content area below.

## Compare View Purpose

Answer "Which model performs better for my use case?" by showing concrete metrics side-by-side. Users compare cost efficiency, code quality (one-shot rate), and behavioral patterns to make informed model selection decisions.

## Required Elements

### Model Selection

- Entry point: "Compare" action on a model row in the "Group by: Model" view
- First model pre-selected from the clicked row
- Second model: Select/Combobox dropdown listing all other models with sufficient data (>= 20 calls)
- Low-data warning badge on models with < 20 calls

### Performance Metrics (3)

| Metric         | Formula                                                | Better |
| -------------- | ------------------------------------------------------ | ------ |
| One-shot rate  | edit turns with 0 retries / total edit turns \* 100    | Higher |
| Retry rate     | total retries / edit turns                             | Lower  |
| Cache hit rate | cache_read / (input + cache_read + cache_write) \* 100 | Higher |

### Efficiency Metrics (4)

| Metric                 | Formula                                    | Better |
| ---------------------- | ------------------------------------------ | ------ |
| Cost per call          | total cost / total API calls               | Lower  |
| Cost per edit          | edit turn cost / edit turns                | Lower  |
| Output tokens per call | output tokens / calls                      | Lower  |
| Cache hit rate         | (duplicated from performance for emphasis) | Higher |

### Category Head-to-Head

- Per activity category (coding, debugging, feature, etc.) where either model has edit turns
- Shows one-shot rate for each model as opposing horizontal bars
- Sorted by total turns descending
- Winner highlighted per category
- Uses `--chart-1` and `--chart-2` colors

### Working Style (4 metrics, display only — no winner)

| Metric             | Formula                               |
| ------------------ | ------------------------------------- |
| Delegation rate    | agent spawns / total turns (%)        |
| Planning rate      | planning tool turns / total turns (%) |
| Avg tools per turn | total tool calls / turns              |
| Fast mode usage    | fast-mode calls / total calls (%)     |

### Context Panel (supplementary)

Per model: total calls, total cost, input/output tokens, days of data, edit turns.

### Winner Indication

- Per metric: winning value in primary color (or green), losing value in muted
- Overall winner: model with more metric wins (tie shown as "Draw")

## Reusable Components

- `Card.Card`: metric group containers
- `Select`: model selector dropdown
- `Badge`: low-data warning, winner indicator
- `SimpleTooltip`: metric explanations
- `cn()`: conditional winner/loser styling

## Components to Adopt

- Consider `Chart` (layerchart BarChart) for category head-to-head horizontal bars

## Layout Constraints

- Content area within usage page (not a separate page)
- Model selector: top of the compare section, full width
- Metric groups: 2x2 grid or stacked sections
- Category bars: full width, sorted list
- Minimum viable data: 20 calls per model to enable comparison

## States to Explore in Variants

- Two models selected with clear winner
- Two models with very close metrics (near-tie)
- Low-data warning on one model
- Category head-to-head with 5+ categories

States to design after variant selection:

- Model selector open (dropdown with call counts)
- Single model selected (waiting for second)
- No eligible models (< 2 models with sufficient data)
- Dark mode appearance

## Visual References

- CodeBurn compare view: `C:/_MP_github_cloned/codeburn/src/compare.tsx` (layout, metric panels)
- CodeBurn compare stats: `C:/_MP_github_cloned/codeburn/src/compare-stats.ts` (metric computation)
- StatCell component: `src/lib/components/ui/stat-cell/` (number formatting, tone variants)

## UI Freedom

- How winner is indicated (color, icon, badge, background)
- Whether metrics are grouped by theme or shown as a flat list
- Category head-to-head chart style (bars, dots, sparklines)
- Transition animation when switching model selection
- Whether the compare view replaces the dashboard or overlays it

## Not Included

- Self-correction metric (dropped from v1 — requires raw assistant text)
- More than 2 models compared simultaneously
- Historical model comparison (compare across time periods)
- Model recommendation engine (advisory, not prescriptive)
