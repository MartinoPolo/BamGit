# Variant: Refined Horizon

## Style Applied

- Typography: Geist (sans), Geist Mono (mono) via Google Fonts CDN
- Colors: OKLCH color space throughout; Moss #4a7c59, Amber #d4a574, Azure #5b8cb8, Plum #8b6b9e, Rose #c47a8f, Teal #5ba6a6; all derived with color-mix()
- Layout: Horizontal L-to-R header gradient (issue color -> desaturated), crisp 1px boundary line, separate body gradient (faint tint -> surface)
- Density: Medium — 8px grid spacing, 42px header, 100px square preview

## Files

- `variant-g.html` — Complete standalone HTML mockup with inline styles and JS controls

## Design Decisions

- **Sunset horizon metaphor**: Header gradient sweeps vivid issue color from left to desaturated right, meeting the darker body at a crisp 1px boundary line — like a colorful sky meeting earth at the horizon. This is the core identity of the variant.
- **No executing card overlay (strict chip-only)**: Executing state shows ONLY the `● EXECUTING` chip in the header. No header brightening, no steady glow, no card-level visual changes. Only error and Needs Input states get pulsing overlays.
- **Soft glow states instead of thick rings**: Active (green) and Selected (blue) states use diffused box-shadow glows with body color tinting instead of the 3px solid rings from Variant D. This reads more refined and less jarring.
- **Rectangular session chips with monospace + dot**: Session state indicators are rectangular (radius-xs) with monospace font and a colored dot prefix, visually distinct from the rounded GitHub state badges.
- **Issue-colored primary button**: The primary action button uses the card's issue color by default (toggleable to moss green via control panel), reinforcing the color identity system.
