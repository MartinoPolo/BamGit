# Variant: C — Split Detail

## Style Applied

- Typography: Geist (sans) + Geist Mono — loaded from Google Fonts CDN
- Colors: Forest Moss dark palette; danger red for high-impact, amber for medium, azure for low; primary moss-400 for accents and selection state
- Layout: Asymmetric 40/60 horizontal split — compact scannable list left, full context panel right; sticky header above both
- Density: Medium-dense; list rows at 44px min-height; detail sections separated by 32px gaps with dashed mono-style section titles

## Files

- `variant-c.html` — standalone self-contained mockup (no external dependencies besides Google Fonts)
- `VARIANT.md` — this file

## Design Decisions

- **Grade ring via SVG arc** — the health score header uses a native SVG circle with `stroke-dasharray` to render the 58/100 arc directly, avoiding any canvas or library dependency while staying pixel-perfect and themeable with `oklch` stroke colors.
- **cb-finding left-border language for selection** — the selected row uses a 2px `var(--primary)` left-border inset pseudo-element rather than a full background highlight, which mirrors the existing `cb-finding.is-high/med/low` visual vocabulary already established in tokens.css and keeps the urgency dots as the primary chromatic signal.
- **Mono section titles with `::before: "//"`** — detail panel section headers use the code-comment prefix pattern to reinforce the tool's "developer instrumentation" personality without introducing new visual primitives, keeping it consistent with the `cb-panel-title` bracket-bracket convention used in existing panels.
