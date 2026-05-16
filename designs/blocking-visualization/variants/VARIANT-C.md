# Variant: Radiant Graph — Glowing Node Emanation

## Style Applied

- Typography: Geist (sans) + Geist Mono (monospace), imported via Google Fonts CDN
- Colors: Forest Moss dark theme with per-node accent colors (moss, amber, azure, coral, plum, teal) emanated as radial gradients
- Layout: 3-column DAG with orthogonal edge routing (8px rounded corners), darker canvas background (oklch 0.135) to make node glows dominant
- Density: Medium — 88px tall PRD nodes with compact Style B badges (borderless-dark)

## Files

- `variant-c.html` — self-contained HTML mockup with all styles inlined (references `../../tokens.css`)

## Design Decisions

- **Radial node emanation**: Each PRD node has a CSS custom property `--node-accent` driving a `radial-gradient` pseudo-element that extends beyond the node boundary. Ready nodes use `--radial-intensity: 0.85` with a 110px glow radius vs the default 0.55/80px, creating a clear visual hierarchy between actionable and blocked work.

- **Style B badges (borderless-dark)**: Unlike Variant A's bordered badges, these use a dark tinted background with colored text and no border — matching the Issue Card v2 Radiant (Variant H) aesthetic. The dark badge backgrounds blend with the semi-transparent node body, reinforcing the atmospheric feel.

- **Orthogonal edge routing**: Edges use right-angle paths with 8px SVG `Q` arc corners instead of bezier curves, providing a distinctive contrast to Variant B. Edges connecting two ready nodes receive an SVG glow filter (`feGaussianBlur` merge), making them visually "light up" as if energy flows between ready nodes.
