# Variant E: Atmospheric Haze

## Style Applied

- Typography: Geist (sans) + Geist Mono (mono) via Google Fonts CDN
- Colors: OKLCH palette from tokens.css -- moss, amber, azure, plum, rose, teal for issue identity; dark theme surface/border tokens for chrome
- Layout: Unified single-surface card with no header/body visual separation; atmospheric color wash throughout
- Density: Medium -- 8px-based spacing, compact header row, two-column body grid (100px thumb | 1fr info)

## Files

- `variant-e.html` -- standalone HTML mockup with inline `<style>` for component-specific CSS, references `../../tokens.css`
- `VARIANT-E.md` -- this file

## Design Decisions

1. **Full-card atmospheric wash instead of header/body split**: The entire card surface receives the issue color at 10-18% opacity via a vertical gradient (stronger at top, fading downward). This creates an immediate "color identity at a glance" effect without the dated look of flat colored headers. A semi-transparent dark scrim band in the header zone preserves WCAG AA text contrast.

2. **Glow-based borders via inset box-shadow**: Instead of traditional CSS borders, the card edge is defined by `box-shadow: inset 0 0 0 1px color-mix(...)`. This creates a softer, more atmospheric edge that blends with the color wash. On hover, the inset glow intensifies and an outer glow halo expands -- the card feels "warmer" rather than just getting a border highlight.

3. **Breathing animation for executing state**: The `is-executing` class uses a keyframe animation that pulses the entire atmospheric wash intensity and halo glow in and out over 2.8s. The card literally breathes in color -- much more organic than a spinner or pulsing dot, and instantly readable when scanning a grid of 10+ cards.

4. **Ghost card split gradient for label-based coloring**: Non-adopted cards with colorizing labels get a subtle dual-tone atmospheric blend -- each label color tints one half of the card at ~6% opacity. This gives ghost cards visual identity derived from their labels without committing to a full issue color (since they're not yet adopted).
