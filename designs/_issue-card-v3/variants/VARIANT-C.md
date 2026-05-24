# Variant: Moss -- Organic Corner Growth

## Style Applied

- Typography: Geist / Geist Mono (via Google Fonts CDN)
- Colors: OKLCH + hex issue colors, neutral dark #1e1e1e base, tokens.css palette
- Layout: Bottom-left asymmetric radial gradient origin -- inverted weight distribution
- Density: Medium -- 8px grid spacing, compact card body

## Files

- `variant-c.html` -- self-contained HTML mockup with 9 cards + controls panel

## Design Decisions

- **Bottom-left corner origin**: The radial gradient uses `ellipse at 0% 100%` with a secondary perturbation layer at `8% 92%` to create a non-uniform, organic moss-like spread edge. This makes the preview thumbnail area (bottom-left) the color epicenter while the header zone (top-right) stays clean and readable.
- **Two-layer gradient for organic edge**: Rather than a single smooth gradient, two overlapping ellipses with slightly different sizes and offsets create visual perturbation that mimics natural moss growth patterns -- the color boundary is irregular, not a perfect circle.
- **Selected state replaces issue color with blue from same origin**: When a card is selected, the blue selection gradient radiates from the same bottom-left corner, maintaining the moss metaphor while clearly communicating selection state through color substitution rather than just border treatment.
- **Ghost card tints use same corner origin**: The orange-tinted ghost card uses `radial-gradient at 0% 100%` for directional consistency. The two-label ghost uses dual radial gradients from both bottom corners, creating a divergent growth pattern.
