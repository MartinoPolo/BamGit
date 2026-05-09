# Variant: Quick-Launch Grid

## Style Applied

- Typography: Geist (sans), Geist Mono (mono) -- model names in mono, labels in sans
- Colors: Forest Moss palette -- moss-400 for Claude Code, azure-400 for OpenCode, amber-400 for Codex, bark-300 for Cursor; cost badges use success/amber/danger tints
- Layout: Flat grid of model tiles grouped by provider, single-click-to-launch pattern
- Density: High -- all providers visible at once, no tabs or accordion to drill into

## Files

- variant-e.html (self-contained HTML with inlined tokens.css)
- VARIANT-E.md (this file)

## Design Decisions

- **Tiles as direct launch targets, not provider-first selection**: Instead of choosing a provider then a model, every model is exposed as its own tile. Clicking a tile selects both provider AND model simultaneously, reducing the common case to one click. The provider grouping (colored dots + section headers) gives visual structure without adding interaction steps.

- **Cost badges on every tile**: Uses a $/$$/$$$  system with color-coded backgrounds (green for cheap, amber for mid, red-tinted for expensive) so users can make cost-aware decisions at a glance without needing a separate pricing page. This is high-signal metadata that belongs at the point of decision.

- **Collapsed/expanded progressive disclosure**: The dialog defaults to showing only the tile grid and a compact context bar. Workspace path is shown as a subtle mono label next to the Advanced toggle. Permission mode, prompt prefix, resume, and workspace selector are hidden behind a single "Advanced options" expansion. This optimizes the 80% case (pick model, go) while keeping the 20% case (tune permissions, add prefix) accessible.
