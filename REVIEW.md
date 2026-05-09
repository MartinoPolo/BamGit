# Review — #248 Dashboard Visual Overhaul

Branch: `248-dashboard-visual-overhaul-charts-coloring-date` vs `dev`
Reviewers: 6 (full coverage)

## Actionable Checklist

### Critical

- [ ] **SQL injection via custom date strings** — `src-tauri/src/models/metrics.rs:60-62`
      `MetricsPeriod::Custom { start, end }` interpolates user strings into SQL via `format!()`. Validate with regex `^\d{4}-\d{2}-\d{2}$` before constructing the filter.

- [ ] **ChartTooltip missing date + session count** — `src/lib/components/usage/CostChart.svelte`
      Spec: "ChartTooltip with date, cost, session count." Current `Chart.Tooltip` only shows cost. Add a custom `formatter` snippet that renders date, cost, and session_count.

- [ ] **`metrics-updated` event never wired** — `src/routes/usage/+page.svelte`
      `notifyNewData()` exists in context but nothing calls it. **Blocked by #247** (needs backend metrics-updated event). Wire `listen('metrics-updated', ...)` when event is available; for now, add a TODO and remove from acceptance criteria scope.

### Important

- [ ] **`maxCostValue()` O(n²) — recomputed per bar** — `CostChart.svelte:71`
      Convert to `$derived` so it memoizes. Currently iterates entire data array for every bar's color accessor call.

- [ ] **`$effect` for data loading — fragile reactive tracking** — `+page.svelte:76-81`
      Replace `$effect` with direct `loadData()` calls in event handlers. Also: clear `customDateRange` in `handlePeriodChange` to prevent stale range being sent.

- [ ] **`loadData` sends invalid `'custom'` when range is null** — `usage.context.svelte.ts:88-92`
      Add guard: if period is `'custom'` and `customDateRange` is null, return early instead of sending unrecognized variant to Rust.

- [ ] **`GroupBy::Provider` on nullable column** — `queries.rs:214`
      Bare `session_metrics.provider` → NULL crashes rusqlite String deserialization. Fix: `COALESCE(session_metrics.provider, 'unknown')`.

- [ ] **GroupByDropdown duplicates type guard** — `GroupByDropdown.svelte:20-29`
      Replace manual 4-way equality check with existing `isGroupByOption()` from usage_types.

- [ ] **Three identical `workspace_join_*` functions** — `queries.rs:18-52`
      Extract single `workspace_join(table: &str, dashboard_id: Option<&str>)`.

- [ ] **`bucket_expr` match duplicated 3x** — `queries.rs:166,206,255`
      Extract `fn bucket_expression(period: &MetricsPeriod, column: &str) -> &'static str`.

- [ ] **Grouped chart has no legend** — `CostChart.svelte`
      Spec: "Group by Model shows stacked bars with legend." Add legend markup below the chart.

- [ ] **Monochrome theme: no opacity ramp** — `CostChart.svelte:187`
      Spec: "Monochrome (primary opacity 30%–100%)." Currently all bars same color. Implement via `c` accessor with `oklch()` alpha modulation based on cost ratio.

- [ ] **"Custom" not shown as 6th tab** — `usage_types.ts:34` / `+page.svelte:119`
      Spec: "Add as 6th Custom period tab." Currently a separate button; should be styled as a tab with active state when custom range is selected.

## Nice-to-Have

- `pricing_available` hardcoded true and never read — dead API surface
- `trafficLightColor`/`gradientColor` share threshold logic — consolidate into `colorByRatio(ratio, low, mid, high)`
- `handlePeriodChange` trivial wrapper — can inline
- SvelteMap/SvelteSet inside `$derived.by()` should be plain Map/Set (reactive tracking wasted)
- `unlockedCount` exposed via getter instead of Derived class — inconsistent with context API
- Color theme stored in localStorage only, not in app_settings backend as spec requires (functional but spec-divergent)
- RefreshIndicator "Updated just now" only visible on hover tooltip, not as text label
- No dedicated ChartTooltip Storybook story
- Timer leak if component destroyed abnormally
