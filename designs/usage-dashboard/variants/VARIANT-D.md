# Variant: Activity Feed + KPIs

## Style Applied

- Typography: Geist (sans) for labels/names, Geist Mono (mono) for values/timestamps/meta
- Colors: Forest Moss palette -- moss-400 accent, status colors for outcomes, category tint colors for feed entries
- Layout: Top KPI strip (4 cards), then two-column: scrolling timeline feed (left) + sticky filter sidebar (right)
- Density: Medium-high -- compact feed entries with timeline gutter, dense sidebar filter panels

## Files

- `variant-d.html` -- Self-contained HTML mockup with all tokens inlined

## Design Decisions

- **Vertical timeline instead of charts**: This variant prioritizes recent activity over aggregated data. Each session is a chronological entry with dot-and-line timeline gutter, making it easy to scan what happened recently, in what order, and with what outcome. Day separators with cost totals give daily context without a chart.

- **Outcome-colored timeline dots**: The timeline dots use `data-outcome` to visually indicate session status (success=green, error=red, partial=amber) providing instant visual scanning of session health without reading badges.

- **Sticky filter sidebar**: Filters (model, category, outcome, cost threshold) are surfaced in a right sidebar that stays visible while scrolling the feed. This replaces the filter bar from other variants, making filtering feel more permanent and discoverable. The sidebar also doubles as a summary panel showing model breakdown, outcome distribution bars, and per-session averages.
