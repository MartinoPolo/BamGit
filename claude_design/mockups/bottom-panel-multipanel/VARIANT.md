# Variant: A — Floating Switcher

## Style Applied

- **Typography**: Geist (sans) + Geist Mono — loaded from Google Fonts CDN; mono used for IDs, badge labels, status bar, and panel metadata
- **Colors**: Full Forest Moss dark palette — `--moss-*`, `--azure-*`, `--plum-*`, `--bark-*` for avatar backgrounds; status/priority tokens for issue badges; `--primary` (moss-400) drives all interactive highlights
- **Layout**: Side-by-side split (left 40% issues list / right 60% detail), with a shared toolbar above; the popover floats above the toolbar anchored to the layout-icon button
- **Density**: Dense — 36px tab bars, 12–13px body text, tightly spaced issue rows, compact meta grid in detail panel

## Files

- `variant-a.html` — standalone self-contained mockup (all tokens inlined, Geist via CDN)
- `VARIANT.md` — this file

## Design Decisions

1. **Popover anchors to the layout button, not the panel edge.** The trigger button lives at the far right of the toolbar and uses `position: absolute; bottom: calc(100% + 8px); right` so the popover appears just above the button rather than at the panel corner — this keeps the grid spatially connected to its affordance and avoids covering the tab bars below.

2. **Thumbnail geometry uses pure CSS divs, no SVG or images.** Each of the 7 preset thumbnails is rendered with absolutely-positioned `.thumb-panel`, `.thumb-tab`, `.thumb-divider-v/h` divs inside a 52×36px container. This keeps them pixel-accurate, theme-reactive (they inherit `--primary` and `--surface-3` tokens), and trivially extensible for new layout presets.

3. **Vertical resizer handle uses a two-layer hover affordance.** The 5px grab zone is invisible by default; `::after` pseudo-element (3px × 32px) fades in and turns primary-green only on hover. This avoids visual clutter at rest while providing a clear drag affordance — matching the same pattern used for the horizontal panel resizer.
