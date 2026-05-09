# Variant: Dashboard Overview + Drill-Down

## Style Applied

- Typography: Geist (sans), Geist Mono (mono) — all metrics use mono with tabular-nums
- Colors: Forest Moss palette — amber for cost accent, azure for input tokens, moss for output, teal for cache, plum for turns, bark for duration; each metric tile gets a distinct 2px gradient accent bar
- Layout: Overview-first with visual summaries at top, detailed breakdowns below; 3x2 metric tile grid for Stats, pie+bar chart for Files
- Density: Medium — generous padding on overview tiles, tighter in drill-down lists

## Files

- `variant-e.html` — self-contained HTML mockup with both Files and Stats tab views

## Design Decisions

- **Files tab opens with a visual summary dashboard** — a donut pie chart showing file type distribution alongside a horizontal additions/deletions bar chart per file. This gives an instant gestalt of "what changed" before drilling into individual diffs. The pie chart uses distinct palette colors (moss, azure, amber, plum, bark) for each file extension.

- **Drill-down file list sits below the overview** — separated by a labeled divider "File Details". Files are collapsible rows (not full cards) to maintain density, with inline diffs expanding below each row rather than inside a card wrapper. This keeps vertical scanning fast.

- **Stats tab uses a 3x2 metric tile grid** with prominent numbers (28px) and subtle accent bars at the top of each tile. Each tile has its own color identity via the 2px top gradient — amber for cost, azure for input, moss for output, teal for cache hit, plum for turns, bark for duration. Below the hero grid, detailed breakdowns (cost by model, token breakdown, session activity, tool usage) use the same labeled-divider pattern as the Files tab drill-down, creating visual consistency across tabs.
