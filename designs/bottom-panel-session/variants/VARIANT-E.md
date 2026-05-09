# Variant: Mini Dashboard

## Style Applied

- Typography: Geist (sans) for UI labels, Geist Mono for metric values, labels, and data
- Colors: Forest Moss palette -- azure-300 for tokens-in, moss-300 for tokens-out, amber-400 for cache hit, foreground for turns; status-success for running badge
- Layout: Vertical three-band (header -> metrics grid -> preview + input); dense information hierarchy
- Density: High -- optimized for monitoring at a glance, no scrolling required

## Files

- variant-e.html (self-contained HTML with inlined tokens.css)
- VARIANT-E.md (this file)

## Design Decisions

- **Metric tiles as the primary focus**: Instead of showing a chat stream, the middle band is a 4-column grid of metric tiles (tokens in, tokens out, cache hit %, turns). Each tile has a subtle color accent to aid scanability -- azure for input tokens, moss for output, amber for cache. This makes the variant ideal for monitoring session cost and performance without reading messages.

- **Last message truncated to 2 lines with active tool indicator**: The preview section shows only the most recent assistant response clipped to 2 lines plus a compact inline tool-call row. This gives just enough context to understand what the session is doing without the visual weight of a full chat stream. The "LAST RESPONSE" eyebrow label makes the purpose of this section immediately clear.

- **Parent tab bar at 40% opacity as read-only context**: The panel shell includes the WorkspaceBottomPanel tab bar (Terminal, Session, Output, Problems) rendered at 40% opacity with pointer-events disabled, plus a resizer handle. This shows exactly where the component sits within the parent container hierarchy without confusing it with interactive elements.

- **Dense header row with session selector**: Combines the session dropdown, state badge, provider icon, model name, and cost into a single compact header row. This eliminates the need for a separate status card while keeping all critical session metadata visible above the fold.
