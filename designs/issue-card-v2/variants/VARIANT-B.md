# Variant B: Diagonal Sweep

## Style Applied

- Typography: Geist (sans), Geist Mono (mono) via Google Fonts CDN
- Colors: OKLCH palette from tokens.css — moss, amber, azure, plum, rose, teal. All via `color-mix()` for computed variants.
- Layout: CSS Grid `repeat(auto-fill, minmax(450px, 1fr))`, responsive collapse at 520px
- Density: Medium — compact header (40px), 2-column body with 100px thumbnail column

## Files

- `variant-b.html` — standalone HTML mockup with `<link>` to `../../tokens.css`

## Design Decisions

- **Gradient border via mask-composite**: The border itself is a 135-degree gradient from issue color (top-left) to the neutral `--border` token (bottom-right), using a pseudo-element with `-webkit-mask-composite: xor` to punch out the inner fill. This creates the "color wraps around the card" effect without `border-image` (which clips border-radius).

- **Diagonal body tint at ~5%**: The card inner has a subtle `::before` overlay — `color-mix(in oklch, var(--ic-color) 5%, transparent)` sweeping 135deg — that reinforces color identity without competing with content. The header uses a stronger 28% mix at the top-left corner, fading to the neutral surface.

- **Directional shadow offset to bottom-right**: Shadow is offset 4px/4px (matching the 135deg gradient axis) with a 15% issue-color tint, giving each card a chromatic depth cue that reinforces the diagonal motif. On hover, both shadow intensity and border gradient brightness increase along the same axis.

- **Breathing glow for executing state**: The `diagonal-breathe` keyframe animation pulses the directional shadow from 15% to 35% opacity at 2.8s intervals, with the border pseudo-element pulsing opacity simultaneously. Creates an organic "working" signal without jarring movement.

- **Ghost card split gradient**: Non-adopted cards with multiple labels use `--ic-label-a` and `--ic-label-b` custom properties to blend two label colors at 8% each along the same 135deg diagonal, giving ghost cards subtle color identity from their GitHub labels.
