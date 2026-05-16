# Variant: Horizon Nodes

## Style Applied

- Typography: Geist (sans) + Geist Mono — all node IDs, percentages, badge labels, and chips use Geist Mono; titles use Geist at 13px medium weight
- Colors: Forest Moss palette with per-PRD accent colors (moss, amber, azure, coral, plum, teal) expressed through left-to-right header gradients using `color-mix(in oklch, ...)`
- Layout: 3-column DAG with cubic bezier edge routing; nodes flow left-to-right by dependency depth
- Density: Medium — 8px body padding, 4px badge gaps, compact 28px header zone

## Files

- `variant-b.html` — self-contained HTML mockup with all states

## Design Decisions

- **Gradient header treatment**: Each PRD node has a horizontal gradient header (vivid accent left, desaturated right) that visually echoes the Issue Card v2 "Refined Horizon" design. The 1px boundary line beneath the header is tinted with the node's accent color, creating a crisp visual separation between identity/status (header) and content (body).

- **Style B borderless-dark badges**: All badges (AFK, HITL, design-needed, unresolved) use the borderless-dark pattern — `color-mix(in oklch, {color} 14%, transparent)` background with colored text and NO border. This is lighter and more integrated than variant-a's bordered badges, reducing visual noise in the dense graph view.

- **Steady ready glow (no pulse)**: Ready nodes get a constant `box-shadow: 0 0 16px` moss glow rather than the pulsing animation from variant-a. This avoids animation fatigue when multiple nodes are ready simultaneously, while still making ready items immediately identifiable. The glow intensifies slightly on hover (20px spread, 40% opacity).

- **Rectangular monospace status chips with dot prefix**: Status indicators like "READY" and "BLOCKED" use rectangular (not pill) chips with monospace font and a bullet prefix character, matching the Issue Card v2 convention. These sit inline within the header gradient zone.

- **Skeleton loading mirrors node shape**: Loading skeletons use the same two-zone structure (colored header shimmer + body shimmer) as the real horizon nodes, giving users an accurate preview of the layout before data loads.
