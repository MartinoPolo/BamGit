# Variant: E — Heatmap Calendar

## Style Applied

- Typography: Geist (sans) + Geist Mono (mono) from Google Fonts CDN
- Colors: Forest Moss palette — 7-level intensity scale from surface-2 through deep moss greens (oklch 0.280-0.720 lightness, 130-145 hue)
- Layout: Two-column — heatmap calendar (left, ~70%) + sidebar KPI/tool/session panels (right, 320px fixed)
- Density: Medium — spacious calendar cells with dense sidebar data

## Files

- `variant-e.html` — Self-contained HTML with all tokens.css inlined, Geist fonts via CDN

## Design Decisions

- **Heatmap as primary visualization**: GitHub-contribution-style calendar grid replaces the traditional bar chart. Each day is a colored cell where intensity maps to spend ($0 = empty surface, max ~$4+ = brightest moss green). This reveals temporal patterns at a glance — weekday vs weekend usage, sprint bursts, quiet periods — which bar charts obscure.

- **Click-to-drill day detail panel**: Clicking any heatmap cell reveals a split detail panel below showing that day's sessions (with issue numbers) and category cost breakdown. This replaces the tooltip-only approach of other variants with a persistent, scannable detail view that doesn't require hovering.

- **Weekly pattern sidebar panel**: A 7-bar mini chart showing average daily spend by weekday (Mon-Sun) surfaces recurring patterns — the developer clearly works Mon-Fri with Wednesday being the heaviest day and weekends nearly idle. This insight is unique to the heatmap variant and not available in bar/line chart approaches.

- **Week-total row**: Dashed-border row below the calendar grid shows per-week cost totals, enabling quick week-over-week comparison without mental arithmetic.
