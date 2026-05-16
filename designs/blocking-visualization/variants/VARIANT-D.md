# Variant: Veil Network

## Style Applied

- Typography: Geist (sans), Geist Mono (mono) via Google Fonts CDN
- Colors: Forest Moss palette with per-node accent colors (moss, amber, azure, coral, plum, teal); ready nodes use moss-400 veil
- Layout: 3-column DAG with orthogonal edge routing, rounded 8px elbows, thin 1.2px strokes
- Density: High — nodes are 220x96px (taller than base 84px) with 5 data rows per card

## Files

- `variant-d.html` — self-contained HTML mockup with all modes and states

## Design Decisions

- **Seamless veil gradient**: Each node uses a top-down gradient blending the PRD's accent color (at 77% mix for ready, 40% for blocked) into the dark surface with NO hard header/body separator. The mix target is `#1e1e1e` (true neutral gray) to avoid OKLCH purple/pink contamination artifacts.

- **Dense info cards**: Each 96px-tall node shows PRD ID + progress %, title, badge row (Style B borderless-dark), progress bar + count, AND a mini-stat line in 10px monospace (`3 ready sub-issues · blocked by 2`). This is the most information-dense variant.

- **Orthogonal edge routing**: Instead of bezier curves, edges use straight horizontal/vertical segments with `Q` (quadratic) corners at 8px radius — giving a clean circuit-board feel that contrasts with the soft gradient nodes. Strokes are thin (1.2px) and semi-transparent for a minimalist look, with resolved edges dashed.
