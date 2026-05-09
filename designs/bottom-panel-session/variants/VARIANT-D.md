# Variant: Notification Stream

## Style Applied

- Typography: Geist (sans) for UI, Geist Mono for timestamps/labels/code
- Colors: Forest Moss dark palette, azure for tool events, amber for assistant, moss for user, session-needs-input (amber/warning) for approval rows
- Layout: Single-column log/feed with grid-aligned rows (timestamp | icon | summary)
- Density: High -- single-line entries, 28px row height, minimal padding

## Files

- `variant-d.html` — self-contained mockup with inlined tokens

## Design Decisions

- **Log-style grid layout**: Every event occupies exactly one row with a fixed 3-column grid (52px timestamp, 18px icon, flexible summary). This makes scanning extremely fast compared to chat-bubble layouts -- the eye follows the timestamp column down and the type labels act as color-coded markers. Ideal for developers who think of sessions as event logs rather than conversations.

- **Inline approval actions**: The "Needs Input" row breaks the single-line pattern just enough to surface Allow/Deny buttons without a separate card or modal. The row gets a left-border accent in the warning color and a subtle tinted background, making it impossible to miss while scrolling. The buttons use ghost styling (border-only) for Deny and tinted fill for Allow, following the primary/ghost CTA pairing rule.

- **Dimmed/recent divider**: Older events fade to 40% opacity with a "2m ago" timestamp divider separating them from recent activity. This preserves context without visual noise -- hovering restores full opacity per the spec. The divider line uses the same pattern as stream separators in terminal UIs, fitting the developer-tool aesthetic.
