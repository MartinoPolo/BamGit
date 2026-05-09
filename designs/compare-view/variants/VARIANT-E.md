# Variant: Timeline Comparison

## Style Applied

- Typography: Geist (sans), Geist Mono (mono) via Google Fonts CDN
- Colors: Forest Moss palette -- moss-400 (Sonnet), azure-400 (Opus), amber-400 (Haiku) as model series colors
- Layout: Stacked sparkline rows with 3-column grid (label | chart | values)
- Density: Medium-high -- compact sparkline rows at 48px height, 8px vertical rhythm

## Files

- `variant-e.html` -- self-contained HTML with inlined tokens.css

## Design Decisions

- **Sparkline rows over point-in-time tables**: Each metric gets its own small area chart showing 7 days of data for all 3 models. This reveals trends (Sonnet's one-shot rate climbing, Opus cost staying flat) that static comparison tables hide entirely. The stacked-row layout keeps all metrics scannable in a single vertical scroll.

- **Three models instead of two**: The timeline format naturally supports N models as layered lines, so this variant extends beyond the 2-model constraint of other variants. Each model gets a distinct color from the palette (moss, azure, amber) with semi-transparent area fills that layer without occluding.

- **Crosshair tooltip demo on Cost per call**: One chart includes a static crosshair+tooltip to show the hover interaction pattern -- vertical line snaps to the nearest day, floating panel shows all model values for that date. This communicates the interactive affordance without JavaScript.

- **Working Style section uses lines only (no area fill)**: Since these metrics have no "winner" semantics, the area fill is dropped to visually de-emphasize them. The value chips also render at 70% opacity to reinforce the "style indicator, not competition" framing.
