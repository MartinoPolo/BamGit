# Variant: Full-Width Inline Card

## Style Applied

- Typography: Geist (sans), Geist Mono (code, timer, device code at 36px with 0.15em letter-spacing)
- Colors: Forest Moss dark palette (--surface, --surface-2, --border, --primary/moss-400, --status-success for connected state)
- Layout: Inline card embedded in a settings page context, two-column grid (code+QR left, status right), stacks vertically on mobile
- Density: Medium — comfortable spacing with 8pt grid, dense enough to feel embedded rather than modal

## Files

- `variant-b.html` — standalone HTML mockup with all tokens inlined

## Design Decisions

- **Two-column split within the card**: Left side is the persistent reference area (code + QR) that the user needs to copy/scan, right side is the dynamic status area. This separation lets the user quickly find the code even while the right side animates with polling state. The border between panels provides visual separation without competing chrome.

- **QR code as secondary affordance**: The SVG-generated QR pattern sits below the code, sized at 120px — large enough to be useful on a phone camera but not dominating the layout. The hint text "Scan to open github.com/login/device on your phone" makes it clear this is a convenience shortcut, not the primary flow.

- **Success card is compact**: After authentication, the inline card collapses to a single-row layout (avatar + username + badge + actions). This is intentionally much smaller than the polling card — the auth flow is done, so it should take up minimal settings page real estate. The gh CLI toggle appears below only after connection, keeping pre-auth UI clean.
