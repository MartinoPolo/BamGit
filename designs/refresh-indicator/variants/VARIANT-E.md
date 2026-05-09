# Variant: Animated Countdown

## Style Applied

- Typography: Geist (sans), Geist Mono (mono) — countdown uses tabular-nums for steady digits
- Colors: Forest Moss palette — success green for fresh, status-warning amber for stale/expiring, primary moss for new-data
- Layout: Icon button + trailing countdown text, no container pill — lightweight inline footprint
- Density: Compact — 26px icon button height, 11px timer text, 7px gap

## Files

- `variant-e.html` — self-contained HTML mockup with all tokens inlined

## Design Decisions

- **Circular progress ring on the icon button** rather than a separate progress bar. The ring depletes as the countdown ticks, giving an at-a-glance sense of time remaining without reading the numbers. It maps naturally to the circular refresh icon shape and stays within the 26px footprint.

- **Gradual color escalation** from subtle-to-prominent as data ages. Fresh state keeps the timer text in foreground-subtle with low opacity so it fades into the toolbar. As the countdown nears zero, the text shifts to warning amber and gains font-weight, and the ring stroke transitions from success green to warning amber. This ensures the component never shouts when data is current but clearly draws attention when stale.

- **Separated icon button from timer text** (no enclosing pill border). Unlike Variant C's unified pill, the icon button stands alone as a bordered secondary control while the timer text floats adjacently. This keeps the click target visually distinct as an action button, while the timer reads as informational annotation — matching the mental model of "button you can click" + "status you can read."
