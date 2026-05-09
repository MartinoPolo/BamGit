# Variant D: Unified Scrollable Feed

## Style Applied

- Typography: Geist (sans), Geist Mono (mono) — all from Google Fonts CDN
- Colors: Forest Moss dark palette — moss, amber, bark, azure scales with semantic status colors
- Layout: Single-column centered feed, max-width 900px (matching chat tab), no sidebars or split panes
- Density: Medium — cards with comfortable padding, clear separation between items

## Files

- `variant-d.html` — self-contained HTML mockup with all tokens.css inlined

## Design Decisions

- **Single-column feed for both tabs**: Files tab uses expandable file cards stacked vertically (path + stats header, click chevron to expand diff inline). Stats tab uses stacked metric cards (Cost, Tokens, Activity, Tool Usage). Both share the same 900px centered column, providing visual consistency when switching between Chat, Files, and Stats tabs.

- **Expandable file cards instead of sidebar + diff split**: Each changed file is a self-contained card — collapsed shows just the path, status indicator, and +/- stats. Expanding reveals the full unified diff inline. This eliminates the need for a separate file tree sidebar, making the layout mobile-friendly and reducing cognitive load. Two files are shown expanded, four collapsed, demonstrating both states.

- **Progressive disclosure on tool usage**: The tool usage table uses inline horizontal bar fills within each row rather than a separate chart area. This keeps the data dense while still providing visual weight comparison at a glance. The bar tracks sit inside the grid alongside counts, avg latency, and success rate columns.
