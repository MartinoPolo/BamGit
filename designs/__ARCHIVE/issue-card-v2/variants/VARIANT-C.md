# Variant C: Radial Emanation

## Style Applied

- Typography: Geist (sans) + Geist Mono (monospace) via Google Fonts CDN
- Colors: OKLCH palette from tokens.css — moss, amber, azure, plum, rose, teal. All computed colors via `color-mix(in oklch, ...)`.
- Layout: Two-column grid `repeat(auto-fill, minmax(450px, 1fr))` for cards, two-column body (100px thumb | 1fr details)
- Density: Medium — 10px/12px internal spacing, 16px grid gap

## Files

- `variant-c.html` — standalone mockup with all states and ghost cards

## Design Decisions

- **Radial gradient as "aura"**: The issue color radiates from the top-left (near the tree thumbnail) outward as a soft elliptical gradient. This creates a natural "light source" feeling and avoids the cliched left-border or flat-header patterns. The gradient spans both header and body seamlessly — no hard division line.

- **Multi-layer shadow with inner glow**: Each card has a tight inner glow (`inset 0 0 4px`) in the issue color plus a soft outer neutral shadow. On hover, the inner glow expands from 4px to 12px blur and the radial gradient ellipse grows from 180px to 240px, creating a "blooming" effect. The executing state uses a CSS breathing animation that pulses both the box-shadow and an overlay pseudo-element.

- **Uniform colored border via `color-mix`**: Rather than a bold accent bar, the entire border picks up 20% of the issue color mixed with the neutral border token. This gives each card a subtle color frame without overwhelming the layout. The radial gradient does the heavy lifting for color identity — the border is just reinforcement.
