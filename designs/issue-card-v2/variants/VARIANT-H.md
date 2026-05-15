# Variant H: Radiant (Bright Radial Emanation) -- v2

## Style Applied

- Typography: Geist (sans) / Geist Mono (mono) via Google Fonts CDN
- Colors: OKLCH color space throughout; Moss, Amber, Azure, Plum, Rose, Teal palette with color-mix() for dynamic derivation
- Layout: Two-column body grid (100px preview + 1fr details), radial gradient emanating from preview area at ~25-35% intensity as resting state, controllable via slider
- Density: Medium-dense, 8pt grid spacing, compact header with standard-size quick actions

## Files

- `variant-h.html` — Complete standalone HTML mockup with inline CSS and JS controls

## Design Decisions

- **Preview as Light Source**: The square preview area acts as the color source, radiating outward via a 340x300px radial gradient. Trees/characters inside are toned down to ~35% opacity so the colored background IS the focal point, not the content inside it.
- **No Executing Overlay**: The radial emanation IS the card's signature. Executing state adds a green glow to the radial blend via the `is-active` class, with a chip-only indicator. No card glow/pulse for executing.
- **Done State = Colorless Card**: Done cards lose card chrome — transparent background, no borders, no box-shadow. Content remains **fully readable at normal opacity** (NOT dimmed). Radial glow removed (color identity gone). Primary action button uses neutral gray. On hover, border + generic background appears.
- **8-Card Matrix**: 4 rows x 2 columns covering Default, Default+Hover, Active, Active+Hover, Selected, Selected+Hover, Done, Done+Hover with correct PRD grouping (#87, #89, #90).
- **Ghost Label Tinting**: Neutral gray for no labels, ~18% orange tint for "Design needed", orange+blue blend for multi-label. Controllable via slider.

## v2 Fixes

- PRD format: `#87 /` not `PRD#87 /`
- Quick-action buttons: standard 26px size, transparent bg (bg on hover only)
- Worktree/branch: single line, folder-only path, slug-only branch, right-pinned badges
- Priority badge: 3 position options (header right, preview bottom, preview top)
- Adopt button: text-only "Adopt + Worktree", no plus icon
- Radial intensity slider (30-100%, default 75%)
- Label tint slider (5-30%, default 18%)
- Session overlay: None / Error / Needs Input (no executing option)
- PRD grouping highlight on hover
