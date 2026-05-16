# Compare View — Design Brief

Side-by-side comparison of two AI models on performance, efficiency, and working style metrics. Inline sub-view within the Usage Analytics page, accessed from the "Group by: Model" cost chart. Answers "Which model should I use for this kind of work?" with concrete data.

**GitHub Issue**: #251 (blocked by #248)
**Parent PRD**: #93 (Metrics & Statistics)
**Variant mockups**: `designs/compare-view/variants/variant-{a..e}.html`

---

## 1. Purpose

Users run multiple AI models (Sonnet, Opus, Haiku, etc.) across sessions. The compare view answers:

- Which model has a higher one-shot rate (fewer retries)?
- Which model is more cost-efficient per edit?
- How do models differ in working style (delegation, planning, tool density)?
- Per activity category (coding, debugging, etc.), which model performs better?

This is a data consumption view — read-only analysis, no mutations. The user selects two models and sees immediate metric-by-metric comparison with winner highlighting and an overall verdict.

---

## 2. Surrounding Context

The compare view lives **inline within the Usage Analytics page** (`/usage`), not as a separate route or modal. It replaces the default dashboard content when triggered.

### Full Viewport Layout

```
+--------+----------------------------------------------------------+
|        | Usage Analytics                            [Color] [CSV]  |
|  Side  |----------------------------------------------------------|
|  bar   | [Today] [7d] [30d] [Month] [All] [📅]   Scope   GroupBy  |
|        |----------------------------------------------------------|
|  Nav   |                                                          |
|  items:|  ← Back to Dashboard          Model Selector             |
|  - Dash|  ┌─────────────────┐  ┌─────────────────┐               |
|  - Sess|  │ [MODEL A STATS] │  │ [MODEL B STATS] │               |
|  - AI  |  └─────────────────┘  └─────────────────┘               |
|  - Usage| ┌────────────────────────────────────────┐              |
|  - WSett| │ PERFORMANCE METRICS                    │              |
|  ------| │ EFFICIENCY METRICS                     │              |
|  Lang  | │ CATEGORY HEAD-TO-HEAD                  │              |
|  Theme | │ WORKING STYLE                          │              |
|  User  | └────────────────────────────────────────┘              |
+--------+----------------------------------------------------------+
```

**Sidebar**: Standard `DashboardSidebar` — 6 nav items (Dashboard, Sessions, AI Config, **Usage** [active], Workspace Settings), plus brand, workspace selector, language, theme, user sections. Collapsed variant at 48px width.

**Page header**: "Usage Analytics" title row with ColorThemePicker, AchievementsDialog, RefreshIndicator, Export CSV button — all read-only context at ~40% opacity in mockups.

**Filter bar**: Period tabs + DateRangePicker, ScopeToggle, GroupByDropdown — inherited from the Usage page. Period and scope filters apply to the compare view's data. GroupBy dropdown disabled or hidden while compare is active (compare IS the model grouping view).

**Content area**: Compare view replaces the KPI cards + cost chart + breakdown sections. A "Back to Dashboard" link or breadcrumb returns to the default Usage view.

### Mockup Rendering

Show the page header and filter bar at ~40% opacity as read-only context. The compare content fills everything below the filter bar. The sidebar should be shown in its expanded state.

---

## 3. Requirements

### 3.1 Entry Point

- "Compare" action button on model rows in the "Group by: Model" chart/table view (from #248).
- First model pre-selected from the clicked row.
- URL state: `?groupBy=model&compare=sonnet-4,opus-4` — bookmarkable, shareable within the app.

### 3.2 Model Selection

- Top of compare section, full width.
- Two model slots: Model A (pre-filled) and Model B (user selects).
- Model B: `Select`/`Combobox` dropdown listing all models with sufficient data.
- Each dropdown option shows: model name + call count + total cost.
- Models with < 20 calls: shown but with a low-data warning `Badge` (amber).
- Swapping models (A ↔ B) via a swap button between the two selectors.

### 3.3 Performance Metrics (3)

| Metric         | Formula                                                | Better |
| -------------- | ------------------------------------------------------ | ------ |
| One-shot rate  | edit turns with 0 retries / total edit turns * 100     | Higher |
| Retry rate     | total retries / edit turns                             | Lower  |
| Cache hit rate | cache_read / (input + cache_read + cache_write) * 100  | Higher |

### 3.4 Efficiency Metrics (3)

| Metric                 | Formula                    | Better |
| ---------------------- | -------------------------- | ------ |
| Cost per call          | total cost / total calls   | Lower  |
| Cost per edit          | edit cost / edit turns      | Lower  |
| Output tokens per call | output tokens / calls       | Lower  |

### 3.5 Category Head-to-Head

- Per activity category (coding, debugging, feature, etc.) where either model has edit turns.
- Shows one-shot rate for each model as opposing horizontal bars.
- Sorted by total turns descending (most data first).
- Winner highlighted per category.
- Uses `--chart-1` (Model A) and `--chart-2` (Model B) as bar colors.

### 3.6 Working Style (4 metrics, display only — no winner)

| Metric             | Formula                               |
| ------------------ | ------------------------------------- |
| Delegation rate    | agent spawns / total turns (%)        |
| Planning rate      | planning tool turns / total turns (%) |
| Avg tools per turn | total tool calls / turns              |
| Fast mode usage    | fast-mode calls / total calls (%)     |

### 3.7 Context Panel (supplementary, per model)

Total calls, total cost, input/output tokens, days of data, edit turns. Displayed as compact data rows above or beside the metrics.

### 3.8 Winner Indication

- **Per metric**: winning value in accent color (`--chart-1` or `--chart-2`), losing value in `text-foreground-muted`.
- **Overall winner**: model with more metric wins. Tie shown as "Draw". Displayed prominently at the top of the results.
- Working style metrics excluded from winner count (informational only).

### 3.9 Data Constraints

- Minimum 20 calls per model for meaningful comparison.
- If < 2 models have sufficient data, show an empty state explaining why.
- Low-data models are selectable but display a warning banner.

---

## 4. Existing Components to Reuse

| Component | Usage |
|-----------|-------|
| `Card.Card` | Metric group containers, context panel |
| `Select` / `Combobox` | Model selector dropdown |
| `Badge` | Low-data warning (amber), winner indicator, model labels |
| `StatCell` | Individual metric display (value + label + tone) |
| `SimpleTooltip` | Metric formula explanations on hover |
| `Button` | Back navigation, swap models, compare action |
| `Tabs` | Section navigation if metrics overflow vertically |
| `Progress` | Cache hit rate / one-shot rate visual bars |
| `cb-panel` / `cb-row` / `cb-num` / `cb-mute` | Dense data rows for context panel and metrics (CodeBurn data density) |
| `cb-bar` / `cb-bar-cool` / `cb-bar-moss` | Horizontal comparison bars for category head-to-head |
| `cb-finding` | Insight cards for key takeaways |
| `cn()` | Conditional winner/loser styling |

---

## 5. Components to Design

| Component | Description |
|-----------|-------------|
| **CompareView** | Top-level orchestrator: model selectors + metric sections. Manages loading, empty states, data flow |
| **ModelSelector** | Dual combobox with swap button. Shows model name, call count, cost. Low-data warning badge |
| **ComparisonMetricRow** | Single metric: label (left), Model A value, visual indicator (bar/delta), Model B value. Winner highlight. Tooltip for formula |
| **CategoryBar** | Opposing horizontal bars for head-to-head per category. A bar extends left from center, B bar extends right. Winner side is bolder |
| **OverallVerdict** | Summary card: "Model A wins 5-2" or "Draw". Shows model avatars/colors and the score |
| **CompareContextCard** | Per-model summary stats (calls, cost, tokens, days). Compact two-column layout |

---

## 6. Layout & Dimensions

### Primary Layout: Side-by-Side Columns

```
┌──────────────────────────────────────────────────────────┐
│  ← Back to Dashboard          [Model A ▾] ↔ [Model B ▾] │
├──────────────────────────────────────────────────────────┤
│  ┌─ Model A Context ──┐  ┌─ Model B Context ──┐         │
│  │ 2,847 calls  $142  │  │ 1,203 calls  $89   │         │
│  │ 45 days   912 edits│  │ 32 days   421 edits│         │
│  └────────────────────┘  └────────────────────┘         │
├──────────────────────────────────────────────────────────┤
│  ┌─ Overall: Opus 4 wins 5–2 ─────────────────────────┐ │
│  └────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│  [PERFORMANCE]                                          │
│  ┌─ Label ────── Model A ──── ▌▌ ──── Model B ───────┐ │
│  │ One-shot rate    78.2%     ████   ▌  71.4%         │ │
│  │ Retry rate       0.31      ████   ▌  0.48          │ │
│  │ Cache hit rate   82.1%     ████   ▌  79.3%         │ │
│  └────────────────────────────────────────────────────┘ │
│  [EFFICIENCY]                                           │
│  │ Cost/call        $0.049    ████   ▌  $0.074        │ │
│  │ Cost/edit        $0.12     ████   ▌  $0.21         │ │
│  │ Output tok/call  1,247     ████   ▌  1,891         │ │
│  [CATEGORY HEAD-TO-HEAD]                                │
│  │ Coding     ████████ 82%  ▌  71% ███████            │ │
│  │ Debugging  ██████ 68%    ▌  74% ████████           │ │
│  │ Feature    ████████ 79%  ▌  65% ██████             │ │
│  [WORKING STYLE] (no winner)                            │
│  │ Delegation      12.4%    ▌  8.2%                   │ │
│  │ Planning        5.1%     ▌  3.8%                   │ │
│  │ Tools/turn      3.2      ▌  2.7                    │ │
│  │ Fast mode       41.2%    ▌  22.8%                  │ │
└──────────────────────────────────────────────────────────┘
```

### Dimensions

- Content width: fills the usage page main content area (no `max-w` — matches existing usage page).
- Model selectors: `max-w-[280px]` each, horizontally centered with swap button.
- Metric sections: full-width Card containers with `cb-panel` styling inside.
- Comparison rows: 3-column grid — label (fixed 160px), Model A value + bar, Model B value + bar.
- Category bars: center-anchored with bars growing outward. Max bar width 200px per side.
- Spacing: `gap-4` between sections, `gap-2` between rows within sections.

### Responsive Behavior

- Below 768px: metric rows stack vertically (label, then Model A row, then Model B row).
- Model selectors stack vertically on narrow viewports.
- Category bars reduce max width proportionally.

---

## 7. States & Interactions

### 7.1 Empty State — No Models Available

Shown when < 2 models have >= 20 calls in the selected period.

- Empty illustration or icon (BarChart3 dimmed).
- Message: "Not enough model data for comparison. Need at least 2 models with 20+ API calls."
- Suggest changing period filter or scope.

### 7.2 Single Model Selected (Waiting for Second)

- Model A context card visible, Model B slot shows placeholder.
- Metric sections hidden or shown as skeleton/placeholder.
- Focus auto-placed on Model B selector.

### 7.3 Two Models Selected — Full Comparison

- All metric sections populated with data.
- Winner highlighted per metric.
- Overall verdict card visible.
- Period/scope filter changes trigger data reload.

### 7.4 Low-Data Warning

- Amber warning banner below the affected model's context card.
- Text: "Limited data ({N} calls). Results may not be statistically significant."
- Metrics still shown (not blocked), but with reduced confidence indicator.

### 7.5 Loading State

- Skeleton placeholders for metric values while `get_model_comparison` loads.
- Model selectors remain interactive during load.
- RefreshIndicator in the page header shows activity.

### 7.6 Switching Models

- Changing either model selector triggers new data fetch.
- Previous comparison remains visible (at reduced opacity) until new data arrives.
- Swap button (↔) between selectors exchanges Model A and Model B instantly.

### 7.7 Back Navigation

- "← Back to Dashboard" link at top-left returns to the default Usage view.
- Browser back button also works (URL state driven).

---

## 8. Design Constraints (Non-Negotiable)

- Renders inline within the Usage page — NOT a separate route, modal, or bottom panel tab.
- Must use existing design tokens (`designs/tokens.css`), OKLCH color space.
- Must respect the Forest Moss palette. Model colors use `--chart-1` and `--chart-2`.
- Typography: Geist (sans) for labels, Geist Mono (mono) for numeric values.
- WCAG contrast for all text.
- No more than 2 models compared simultaneously (variants D/E explored 3-model, but v1 is 2-model per issue #251).
- Minimum 20 calls per model for meaningful comparison; include `low_data_warning` flag.
- Self-correction metric dropped from v1 (requires raw assistant text analysis).
- Must add mock handler in `tauri_mock.ts` and `tauri_mock_data.ts` for browser mode.
- Dark theme is primary. Light theme supported.
- No backdrop blur on any overlays.
- Numeric values always use `tabular-nums` for alignment.

---

## 9. Design Freedom

- **Winner indication style**: color, icon, badge, background tint, or combination.
- **Metric grouping**: cards per section vs flat scrollable list vs tabbed sections.
- **Category chart style**: opposing horizontal bars, butterfly chart, back-to-back bars, dot plot.
- **Context panel placement**: side-by-side cards above metrics, inline header within each section, or collapsible sidebar.
- **Overall verdict treatment**: prominent banner, small badge, or animated score reveal.
- **Transition animation**: when switching models, crossfade, slide, or instant swap.
- **Bar visualization**: solid fill, gradient fill, segmented blocks.
- **Tooltip design**: simple text, rich card with formula + explanation.
- **Working Style section**: same row layout as metrics but with no winner highlight, or a distinct visual treatment (e.g., radar/spider chart, different background).
- **Model color assignment**: fixed (A always `--chart-1`) or user-swappable.

---

## 10. Inspiration & References

### CodeBurn Compare View

- `C:/_MP_github_cloned/codeburn/src/compare.tsx` — TUI layout with side-by-side model panels, metric rows, category bars.
- `C:/_MP_github_cloned/codeburn/src/compare-stats.ts` — metric computation logic (ModelStats, ComparisonRow, CategoryComparison, WorkingStyle types). Port to Rust backend.

### Issue Card v2 Quality Standard

- `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md` — the gold standard for design brief completeness. Match the level of detail for states, component extraction, and settings.

### Existing Variants

Five HTML mockup variants already explored:

| Variant | Style | Key Feature |
|---------|-------|-------------|
| A | Side-by-side columns | Two-column card layout with metric rows |
| B | Versus table | Dense tabular comparison with inline bars |
| C | Dashboard cards | KPI cards + breakdown sections |
| D | Radar chart overlay | Spider chart with overlapping model polygons, 3-model support |
| E | Timeline comparison | Sparkline rows showing 7-day trends per metric, 3-model support |

### Usage Page (Parent)

- `src/routes/usage/+page.svelte` — current Usage Analytics page with KPI cards, cost chart, activity breakdown, tool calls. Compare view replaces this content area when active.

### StatCell Component

- `src/lib/components/base/stat-cell/` — reusable number display with label, value, suffix, tone variants (neutral, zero, warning, danger). Use for individual metric cells.

---

## 11. Not Included (Deferred / Out of Scope)

- Self-correction metric (requires raw assistant text or ingestion-time flagging).
- More than 2 models compared simultaneously (v1 constraint; variants D/E explored this).
- Historical model comparison (compare across different time periods).
- Model recommendation engine ("use X for coding, Y for debugging").
- Exportable comparison report (PDF/image).
- Session-level drill-down from metrics (click a metric to see contributing sessions).
- Custom metric definitions (user-defined formulas).
