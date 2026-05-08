# Variant: Subtle Glow (A)

## Style Applied

- Typography: Geist (sans) + Geist Mono — loaded from Google Fonts
- Colors: Full token palette from tokens.css; issue colors moss/amber/azure/plum drive all per-card theming via CSS custom property `--ic-color`
- Layout: Two-column body (100px thumb + flexible detail column), header band above; cards stack vertically in a single column for focus
- Density: Medium — 12px body padding, 26px action buttons, 20px badges, 8px base grid

## Files

- `variant-a.html` — self-contained mockup with all tokens inlined
- `VARIANT.md` — this file

## Design Decisions

- **Per-card color system via `--ic-color`**: Every visual element (header bg, thumbnail gradient, glow color, badge tint, border) is derived from a single `--ic-color` CSS variable using relative `oklch()` math. This means any new issue color can be added with one class and one property — no per-color overrides needed.

- **Gradient-fade header bottom edge**: The header band uses an `::after` pseudo-element with a `linear-gradient` from the desaturated header color into `var(--surface)`. This eliminates the hard horizontal cut between header and body, giving the card a visual continuity without adding DOM nodes.

- **Layered glow shadow system**: Hover state uses three stacked `box-shadow` layers — a standard `shadow-md` for base lift, a short-radius spread for a tight color ring, and a wide-radius low-opacity bloom for the ambient glow. Active state promotes this to a 2px solid ring + stronger bloom, giving a clear pressed-in-but-selected feel distinct from hover.
