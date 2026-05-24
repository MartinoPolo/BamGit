# Issue Card v3 — Design Brief

## Goal

Fresh visual pass on issue cards. All behavioral requirements are locked from v2. This brief gives the designer complete visual freedom for surfaces, borders, gradients, shadows, typography color, and card identity — while preserving the functional layout and interaction rules.

The design should avoid generic "AI dashboard" aesthetics. No gradient slop, no neon glow clichés, no glassmorphism. It should feel natural, warm, and alive — consistent with Grovekeeper's forest/botanical metaphor. Think bark textures, leaf canopy dappling, seasonal color palettes, weathered wood — not cyberpunk dashboards.

## What's Locked (Behavioral — designer cannot change)

### Card Structure

- Two-column grid body: ~100px square preview (left) + info rows (right)
- Minimum card width: 450px
- Responsive grid: repeat(auto-fill, minmax(450px, 1fr))

### Header Zone

- PRD parent number (#NN /) — monospace, clickable, linked to GitHub
- Issue number (#NNN) — monospace, clickable, linked to GitHub
- Issue title — truncated with ellipsis, clickable for detail panel
- Issue state chip — rectangular (NOT pill), monospace uppercase, dot prefix, 22-state cascade
- Priority badge — rectangular, full text labels (LOWEST/LOW/HIGH/TOP), 9 configurable positions
- Quick-action buttons (3): Open Folder, Open Terminal, Open Editor — icon-only, always visible, no background at rest, background on hover only

### Body Rows

- Row 1: Worktree folder + branch name (monospace, single line, truncated)
- Row 2: GitHub status badges (issue state + PR state + CI status)
- Row 3: GitHub labels as colored pills + overflow count
- Row 4: Command result badges + server port badges

### Action Buttons

- Bottom-right of card body, absolutely positioned
- Max 2 visible + overflow (three-dot)
- 14-level contextual priority hierarchy (see requirements doc)
- Primary: filled; Secondary: outlined; Overflow: outlined

### Interactive States (behavior locked, visuals open)

- Default: resting appearance
- Hover: card lifts, background brightens (exact treatment: designer's choice)
- Active (single click): issue-color emphasis — glow/tint using the card's OWN color
- Selected (batch): `--primary` (moss green) emphasis — distinct from active. System-level selection, not issue-specific
- Selection-ready (modifier key held): `--primary` outline at ~30% opacity, preview of selection — cursor: pointer
- Done: transparent/minimal appearance, content at full opacity, DONE chip, neutral action buttons
- Ghost: muted/neutral, adopt split-button replaces action buttons, dashed border pattern
- Worktree Setup: borderless/muted ("not yet born"), materializes when worktree activates
- Worktree Removing: fades toward muted state
- Disabled: opacity ~42%, pointer-events none
- Session Error overlay: red/warm emphasis + pulse animation (composable on top of any state)
- Session Needs-Input overlay: amber emphasis + pulse (composable)
- Executing: NO overlay, chip only

### Context Menu

- Standard items: Change Color, Change Priority, Archive/Unarchive, Select, Delete
- "Commands and Actions" section with "Open" submenu (Folder/Terminal/Editor with icons)
- Mute toggle
- Worktree items (Setup/Remove/Retry)
- Commands submenu (servers above checks, state-aware actions)
- Batch context menu for multi-selected cards

### Batch Selection

- Ctrl+click toggle, Shift+click range, right-click Select, long press 500ms, Ctrl+A
- NO checkboxes — selection indicated by visual treatment only
- Selection persists after batch action, clears on tab change or Escape

### Ghost Card Rules

- Neutral appearance by default
- Label coloring: 1 label = single tint (~20% opacity), 2 labels = split colorization (left/right, first alphabetically), 3+ = first 2 alphabetically
- Adopt split-button (outlined, text only, remembers last selection)
- No quick-action buttons, no tree preview (placeholder), no session chip

### PRD Group Hover

- Hovering PRD number highlights ALL cards sharing that PRD
- Ring/emphasis on all matching cards including hovered one
- Ring ~25% larger offset/size than normal state rings
- Ring does NOT appear on normal card hover (PRD number only)

### Badge Styles (3 options, user-configurable)

- Solid: opaque colored background + contrast text
- Subtle: tinted background, colored text, no border
- Outlined: tinted background, colored text, with subtle border at ~20-30% opacity
- Badge style applies simultaneously to both priority badges AND state chips

### Card Variants (minimum 3, switchable via settings)

- Must support at least 3 visual variants
- Variants driven by CSS custom properties and data-variant attribute, no JS branching
- Each variant gets its own slider settings (reach, saturation, intensity, etc.)

### Settings

- User settings (global) → Workspace settings (per-workspace overrides)
- Variant, badge style, label tint opacity (5-30%), overlay glow intensity (100-200%)
- Priority badge position (9 positions)
- Variant-specific sliders: gradient_reach + color_saturation (Veil), header_saturation (Horizon), radial_intensity (Radiant)

## What's Open (Visual — designer has complete freedom)

### Surfaces and Backgrounds

- Card body fill/gradient/texture treatment
- Header background treatment (gradient direction, intensity, color mixing)
- Preview area background
- How issue color identity is expressed (gradient, tint, accent, texture — anything except flat solid fill or left accent border)
- Dark mode vs light mode color adjustments

### Borders and Outlines

- Border style, width, color, radius
- Whether to use borders, outlines, box-shadow outlines, or none
- Ghost card dash pattern implementation
- State-specific border treatments

### Shadows and Depth

- Box-shadow treatments for resting, hover, active, selected states
- Whether cards appear flat, raised, or inset
- Glow effects and their implementation

### Typography Color

- How header text color is determined (contrast-based, fixed, variant-dependent)
- Issue number color treatment per variant (carries issue color when header is dark/non-colorized; inherits header text color when header is colorized)
- Title color and opacity

### Color Identity

- How the issue's assigned color manifests on the card
- How much of the card surface carries the issue color
- Color saturation/desaturation approach for dark vs light mode
- Approach to WCAG contrast compliance

### Animation and Transitions

- Hover transition style and duration
- Active/selected transition
- Done card hover fade-in/fade-out
- Worktree materialization animation
- Error/needs-input pulse animation style

### Card Variant Designs

- The 3+ variant visual approaches
- What makes each variant distinct
- Which settings/sliders each variant exposes

## Design Constraints (Non-Negotiable)

- NO left colored accent border (AI dashboard cliché)
- NO flat solid-color headers
- NO thin top stripe alone
- NO per-card checkboxes
- NO executing card overlay (chip only)
- NO drag-and-drop on card grid
- NO hover-revealed action buttons (always visible)
- NO generic "AI dashboard" neon/cyber aesthetic
- MUST maintain WCAG contrast for all text on colored backgrounds
- MUST use Geist (sans) / Geist Mono (mono) typography
- MUST support both dark and light mode
- MUST feel natural and organic — aligned with forest/botanical metaphor
- Issue color MUST be the primary visual differentiator between cards
- MUST respect OKLCH color space and token system (designs/tokens.css)

## v2 Context (What the Previous Variants Looked Like)

v2 shipped three variants — v3 should be distinct from these, not iterations of the same approach:

- **Veil (F)**: Seamless vertical gradient from full intensity at top, fading into dark surface. No hard header/body boundary. Sliders: gradient reach (30-100%), color saturation (30-200%).
- **Refined Horizon (G)**: Horizontal gradient — vivid issue color left, desaturated right. Crisp 1px boundary between header and body. Slider: header saturation (30-100%).
- **Radiant (H)**: Preview area as light source, radial gradient ~340x300px emanating outward. Preview box opaque dark. Slider: radial intensity (30-100%).

v3 may evolve any of these directions, retire one or more, or introduce entirely new visual metaphors — as long as the minimum 3 variants requirement is met.

## Reference

- Full behavioral spec: `ISSUE_CARD_TEST_REQUIREMENTS.md` (in repo root)
- v2 design decisions: `designs/_issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md`
- Domain language: `.mpx/CONTEXT.md`
- Settled decisions: `.mpx/DECISIONS.md`
