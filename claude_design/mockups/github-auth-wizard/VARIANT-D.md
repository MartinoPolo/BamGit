# Variant: Inline Banner Flow

## Style Applied

- Typography: Geist (sans), Geist Mono (mono) via Google Fonts CDN
- Colors: Forest Moss palette, status-success for Phase 3, status-danger for error/expiry
- Layout: Top-of-page inline banner that contracts through phases; settings content visible below at all times
- Density: Medium — Phase 1 is spacious (hero code), Phase 2 is compact (single row), Phase 3 is minimal (slim bar)

## Files

- `variant-d.html` — Self-contained HTML mockup with all tokens inlined

## Design Decisions

- **Progressive collapse**: The banner shrinks from a generous two-row Phase 1 (large code + CTA) to a single-row Phase 2 (compact code + progress bar) to a slim Phase 3 success bar. This reflects decreasing user attention needed at each stage — the banner gets out of the way as the flow becomes passive.

- **Non-blocking browsing**: Unlike modal variants (A) or sheets (C), the banner sits inline at the top of the settings page. Users can scroll down and continue adjusting other settings while waiting for GitHub auth to complete. The polling spinner and progress bar remain visible as a persistent status strip.

- **Combined "Copy & Open GitHub" CTA**: Phase 1 merges both actions into a single primary button — clicking it copies the code to clipboard AND opens the GitHub device flow URL. This reduces the flow to one click instead of two separate actions (copy, then open). The code block also has its own standalone copy button for re-copying.

- **Animated glow sweep on success**: Phase 3 features a 2px green line at the top with a sweeping glow animation, drawing the eye back to the banner when authentication succeeds. The banner then auto-dismisses after 3 seconds, cleaning up without requiring user action.

- **Timer-to-progress-bar transition**: Phase 1 shows only the digital timer (14:55). Phase 2 adds a visual progress bar alongside the timer, giving both precise and at-a-glance time remaining. The bar changes color through moss -> warning -> danger as time runs low.
