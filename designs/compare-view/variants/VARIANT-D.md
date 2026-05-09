# Variant: Radar Chart Overlay

## Style Applied

- Typography: Geist (sans), Geist Mono (mono) — all from Google Fonts CDN
- Colors: Forest Moss palette; moss-400 (model 1), azure-400 (model 2), amber-400 (model 3)
- Layout: Radar chart as primary visual, summary table below, context cards at bottom
- Density: Medium — chart takes center stage, supporting data is compact tabular

## Files

- `variant-d.html` — self-contained HTML with inlined tokens.css

## Design Decisions

- **Radar/spider chart as primary comparison surface**: Unlike the side-by-side columns (A), versus table (B), or dashboard cards (C), this variant uses overlapping polygons on a shared hexagonal grid. Each model is a colored polygon whose shape immediately reveals its strengths and weaknesses — a wide polygon dominates, a narrow one is weaker. This works especially well for holistic 2-4 model comparison where you want to see overall "profile shape" at a glance.

- **Three models instead of two**: Variants A-C compare 2 models. The radar chart naturally accommodates 3+ overlaid polygons without becoming cluttered, so this variant showcases 3 models (Sonnet 4, Opus 4, Haiku 3.5) to demonstrate the format's advantage for multi-model comparison.

- **Interactive legend toggles and dot tooltips**: Clicking a legend item hides/shows that model's polygon, letting users isolate specific comparisons. Hovering chart vertices shows exact values — the chart provides the gestalt, the table provides precision, and tooltips bridge the two.

- **Insight card in the legend sidebar**: A small left-bordered finding card summarizes the key takeaway ("Opus excels at accuracy, Haiku dominates throughput, Sonnet balances both"), giving users an immediate narrative without forcing them to decode the chart themselves.
