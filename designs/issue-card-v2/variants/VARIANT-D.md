# Variant D: Split Horizon

## Style Applied

- Typography: Geist (sans) + Geist Mono — loaded via Google Fonts CDN
- Colors: Full OKLCH palette from tokens.css — moss, amber, azure, plum, rose, teal for issue identity; all session/priority/status colors from design tokens
- Layout: Two-column body grid (100px thumbnail | 1fr info), auto-fill card grid at 450px min
- Density: Medium — 8px-based spacing, compact header, breathing room in body

## Files

- `variant-d.html` — standalone dark-mode mockup with all card states

## Design Decisions

- **Dual gradient strategy**: The header uses a horizontal (left-to-right) gradient from a desaturated issue color to a more vivid version, creating a cinematic widescreen sweep. The body uses a separate vertical gradient (faint issue tint fading to surface). These two gradients meet at a crisp 1px boundary line using `color-mix(in oklch, var(--ic-color) 25%, var(--border))`, producing a clean horizon effect without blending across zones.

- **Top glow shadow**: Each card emits a colored glow above it via a negative-offset box-shadow (`0 -4px 8px 0` at 15% issue color). This makes cards feel lit from above and immediately distinguishable by color when scanning a grid. On hover, the glow intensifies and the card lifts, reinforcing depth hierarchy.

- **Ghost card label-based split gradient**: Non-adopted cards use dashed borders and muted tones. When labels with colorizing colors exist, the ghost header picks up a faint split gradient using two label colors (one per side at 8% mix), providing subtle identity without the full adopted card treatment. Non-colorizing labels are rendered in neutral gray.
