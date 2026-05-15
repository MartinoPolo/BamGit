# Variant: Vertical Fade

## Style Applied

- Typography: Geist (sans) + Geist Mono (mono) via Google Fonts CDN
- Colors: OKLCH palette from tokens.css (moss, amber, azure, plum, rose, teal) with color-mix() derivations
- Layout: Two-column card grid (auto-fill, minmax 450px), card body is 100px thumb + 1fr info
- Density: Medium-dense. 8-16px spacing, compact header, tight body rows

## Files

- `variant-a.html` — complete standalone mockup with all states

## Design Decisions

- **Vertical gradient continuation**: The header uses a vivid top-to-bottom gradient (28% issue color blending to 10%) that seamlessly continues into the body as a faint wash (7% opacity fading to transparent). No hard edge between header and body — the color just desaturates down the card.
- **Color-mixed borders**: Border uses `color-mix(in oklch, var(--ic-color) 15%, var(--border))` to tint the card edge with the issue color. On hover, this increases to 45% with an added outer glow shadow at 18% opacity of the issue color. The breathing glow on executing cards pulses between 16% and 32% opacity.
- **Ghost card priority tinting**: Ghost cards with high-priority labels get a `--ghost-tint` variable that applies an 8% wash and 5% header tint, giving unassigned urgent issues a warm visual pull without full color assignment. Non-colorizing labels are grayed out in ghost context via CSS descendant selectors.
