# Variant: Progress Ring

## Style Applied

- Typography: Geist (sans), Geist Mono (mono) via Google Fonts CDN
- Colors: Forest Moss palette -- status-success (green) -> status-warning (amber) -> status-danger (red) for ring progression; primary (moss-400) for new-data state
- Layout: Circular SVG ring wrapping the refresh icon; optional inline label to the right
- Density: Compact -- 30px circular button, ring is both indicator and affordance

## Files

- `variant-d.html` -- self-contained mockup with all tokens inlined

## Design Decisions

- **Ring as dual affordance**: The circular progress arc simultaneously communicates data age (fill level) and urgency (color gradient from green through amber to red). No separate badge needed -- the ring itself is the freshness indicator, and the entire circle is the click target.
- **Continuous depletion model**: Unlike dot-badge variants that show binary fresh/stale, this variant shows a smooth spectrum. The "Freshness spectrum" section demonstrates 5 points along the depletion timeline. This gives users a sense of time pressure without requiring them to read timestamp text.
- **Loading as indeterminate ring spin**: During loading, both the arc segment and the RefreshCw icon spin independently -- the SVG ring rotates around its center while the icon spins in place. This creates a distinctive "orbital" loading animation that feels more purposeful than a simple spinner.
- **Compact mode viability**: At 30px the ring-only variant (no label) is self-documenting -- an empty gray ring reads as "no data", a full green ring reads as "fresh", a nearly-empty red ring reads as "stale". This makes it viable for tight toolbar layouts where even the 26px icon-button variants from A/B/C would need a badge or tooltip for the same information density.
