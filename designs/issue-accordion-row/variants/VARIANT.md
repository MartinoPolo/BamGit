# Variant: A — Color Band Header

## Style Applied

- Typography: Geist (sans) + Geist Mono — all sizes drawn from the design token scale (10.5px–13px body range)
- Colors: Per-issue accent palettes derived from the token set (moss, amber, azure, plum, teal, coral, gold, indigo), each desaturated for dark-mode legibility. Row backgrounds are approximately oklch L=0.25–0.27 with the accent hue, well above the surface-2 baseline.
- Layout: Full-width horizontal band per row; left-to-right information hierarchy (expand chevron → priority → PRD tag → issue number → title → git badges → session chip → action buttons). Expanded section uses a two-column grid (tree thumbnail + detail columns).
- Density: Dense — collapsed rows are 42px tall, matching the `.gk-btn-sm` / `.gk-badge` 26px/20px control heights. Expanded sections add ~120px of additional detail without padding bloat.

## Files

- `variant-a.html` — standalone dark-mode mockup, self-contained with inlined tokens.css

## Design Decisions

- **3px left-edge accent stripe on each row header**: Each row carries a `::before` stripe in the full-saturation accent color against the desaturated band background. This creates an immediate color identity signal at the far left without making the entire row distractingly bright — analogous to the issue card header band pattern but adapted to a linear layout.

- **On-band action buttons with contextual tint feedback**: Action icons (folder, terminal, editor, overflow) sit inside the colored band and use `ia-action-btn` — a transparent button that on hover fills with a 16% tint of the accent dot color and gains a matching border. This keeps the band visually cohesive at rest while giving crisp hover feedback that reads against any accent hue.

- **Expanded body uses a darker, same-hue surface**: The expanded body background (`ia-exp-bg`) is approximately L=0.195–0.202 in the same hue — lighter than `--background` but darker than the band, creating clear visual hierarchy between the collapsed header and the detail area without reaching for a generic neutral. SVG tree thumbnails are generated per-accent-color to reinforce the issue's identity.

---

# Variant: C — Grouped Sections

## Style Applied

- Typography: Geist (sans) + Geist Mono — loaded from Google Fonts CDN
- Colors: Forest Moss dark palette — `--priority-top/high/medium/low` for group headers; `--session-*` for state chips; `--moss-400` primary accent
- Layout: Single-column list, sticky group headers, 42px collapsed rows, 2-column grid in expanded body (tree thumbnail + details)
- Density: Dense — 42px rows, 30px group headers, 26px (`gk-btn-sm`) action buttons, 20px badges

## Files

- `variant-c.html` — self-contained mockup with inlined tokens.css
- `VARIANT.md` — this file

## Design Decisions

- **Priority-tinted sticky section headers**: Each group header carries a subtle background tint and a 3px left bar in its priority color (red/orange/yellow/blue). This gives instant triage orientation without overwhelming the row content — the color lives in the scaffolding, not the data.

- **Left accent stripe per row**: Every collapsed row has a 2px vertical bar (absolute-positioned, inset 8px top/bottom) that fades to full opacity on hover and stays lit when expanded. It reinforces the priority group membership without duplicating the priority icon, which already sits in the row.

- **Progressive disclosure via expand**: Action buttons (Folder, Terminal, Editor, ⋯) are opacity-0 until hover or expand, keeping the collapsed view scannable. The expanded panel adds a low-poly tree SVG thumbnail, GitHub labels, dev-server status, and worktree path in a 2-column grid — all additional context without cluttering the collapsed density.
