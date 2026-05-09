# Variant: Subtle Underline (Variant A)

## Style Applied

- Typography: Geist Mono for the cost value (tabular-nums), Geist for surrounding UI and tooltip
- Colors: inherits parent foreground — no color differentiation at rest; --foreground-muted dotted underline on hover; --ring (moss-400) focus ring
- Layout: inline element, zero footprint — sits inside flex rows, stat cells, footer strips without disrupting flow
- Density: micro (10.5px sm / 12px md), designed for dense data surfaces

## Files

- `variant-a.html` — self-contained mockup with all tokens inlined

## Design Decisions

- **Invisible at rest by inheritance:** The component sets `color: inherit` and `text-decoration: none`, so it reads as plain monospaced text in whatever context it appears. There is no visual hint until hover — the reveal is the interaction.
- **Dotted vs. solid underline:** `border-bottom: 1px dotted` was chosen over `text-decoration: underline dotted` for precise control over opacity transition. Dotted specifically signals in-app drill-down (not external link) — matching IDE type-hint and spreadsheet conventions.
- **Tooltip as the sole navigation label:** Rather than adding a persistent "(view usage)" label beside every cost value, the tooltip "View usage details" appears only on hover. This keeps stat rows scannable at a glance without repetitive chrome on every card.
