# Variant F: Veil -- Seamless Top-Down Blend (Regenerated)

## Style Applied

- Typography: Geist (sans) / Geist Mono (mono) from Google Fonts CDN
- Colors: Issue colors via hex (Moss #4a7c59, Amber #d4a574, Azure #5b8cb8, Plum #8b6b9e, Rose #c47a8f, Teal #5ba6a6) with `color-mix()` for gradient derivation
- Layout: 2-column grid `repeat(auto-fill, minmax(450px, 1fr))`, two-column body (100px square preview + info)
- Density: Medium -- compact header, comfortable body spacing

## Files

- `variant-f.html` -- standalone HTML mockup with 8 adopted cards (4 rows x 2 columns), 3 ghost cards, 5 control panel options

## Design Decisions

1. **Auto-contrast header text**: Warm/light issue colors (Amber, Rose) get dark header text (`oklch(0.2 ...)`); dark/cool colors (Moss, Azure, Plum, Teal) get light header text. PRD ref, title, and action button icons all inherit `--ic-header-text`. This ensures readability on the bright gradient top.

2. **Done state = colorless card**: Done cards have `background: transparent; border-color: transparent; box-shadow: none`. Content remains **fully readable at normal opacity** — NOT dimmed. Color identity (gradient) removed, but text/badges/buttons stay crisp. Primary action button uses neutral gray. On hover, border + generic background appears, then fades back.

3. **No executing card overlay**: The `EXECUTING` session chip appears in the header as a rectangular monospace badge -- that is the sole indicator. No glow, brightness boost, or card-level overlay is applied for executing state. Error and Needs Input overlays are separate (pulsing red/amber).

4. **Gradient Reach slider (30-100%)**: Controls how far the veil color wash extends via `--ic-gradient-reach` CSS property. At 30%, color is concentrated at the very top; at 100%, it washes through the entire card.

5. **Ghost card tint visibility**: Tinted ghost cards use 18% default intensity (slider range 5-30%) with direct hex color references (#f97316 orange, #3b82f6 blue) to ensure the tint is clearly visible. Scenario 3 blends both colors.

6. **Color Saturation slider (30-200%, default 150%)**: Controls header color vividness. Below 100%: desaturates toward neutral `#1e1e1e` (NOT `oklch(0.25 0 0)` which causes purple/pink contamination via OKLCH hue interpolation). Above 100%: boost mode increases chroma/lightness via enhanced gradient mix percentages. 150% is the sweet spot — vivid without oversaturation.
