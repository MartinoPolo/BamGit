# Issue Card Redesign — Design Spec

Visual refresh of the issue card component. Cards currently look flat and inconsistent with workspace cards. Take inspiration from workspace card hover states, glows, border treatments, and gradient tints while preserving the information-dense layout. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Container Context

**Parent**: `IssueCardList` inside `WorkspaceBottomPanel` — Issues tab, card grid view
**What parent provides**: CSS Grid layout (`repeat(auto-fill, minmax(450px, 1fr))`), batch selection toolbar, archived issues section, bottom panel tab bar and chrome
**What this component fills**: A single grid cell within the issue card grid
**Must NOT include**: Grid layout, bottom panel chrome, batch toolbar — these belong to parent components

**Mockup rendering**: Show 2-3 cards in a grid context so the viewer sees relative sizing. No panel chrome needed — the card is the focus.

## Card Purpose

The primary unit of work display. Shows issue identity, git/GitHub state, session state, action buttons, and thumbnail. Must be scannable at a glance and visually distinctive per-issue via color.

## Required Elements

### Header Band
- Issue color background with WCAG-contrast text
- `#issue_number` (monospace, linked to GitHub when available)
- Issue name (truncated)
- Child count badge (if sub-issues exist)
- Session state chip
- Priority chip (non-medium only)
- Quick-action icon buttons: Open Folder, Open Terminal, Open Editor
- Mute toggle (character pack audio)
- **Dark mode**: reduce header band saturation by ~20% compared to current

### Body (two-column grid)
- Left column: 100×100px thumbnail with gradient background + tree visualization
- Right column rows:
  - Row 1: branch name + worktree badge + sync badge + merge conflict badge
  - Row 2: GitHub badges (PR + issue) — always render with min-h-[22px] even when absent
  - Row 3: GitHub labels (first 3 + overflow count)
  - Row 4 (NEW): Dev server/check command status badges (green/red/orange)

### Action Buttons
- Absolutely positioned bottom-right
- Contextual action buttons (max 2 visible + overflow ⋯)

### State Treatments (key design focus)
- Default → no ring, no tint, clean border
- Hover → issue-color border transition across whole card, subtle glow, background tint. Inspired by workspace card hover (translateY + colored glow + border tint)
- Active → stronger glow, thicker ring, heavier background tint
- Selected (batch) → `--primary` ring, system-level tint
- Archived → grayscale + reduced opacity overlay

## Reusable Components

- Button: `.gk-btn-sm` (26px) for header quick-actions, `.gk-btn-ghost` for contextual actions
- Badge: `.gk-badge` (20px) for status indicators, GitHub badges
- SessionStateChip: existing component for session state display
- TreeThumbnailImage: existing tree visualization thumbnail
- GitHubBadge: existing badge with color variants

## Components to Adopt

- No new components needed — refinement of existing card styling

## Layout Constraints

- Card min-width: 450px (grid constraint)
- Thumbnail: 100×100px (keep current, accommodates 4 rows beside it)
- Header min-height: 32px
- Body padding: 12px (increase from current 10px)
- Reference: `.gk-btn-sm` (26px), `.gk-badge` (20px)

## States to Explore in Variants

Initial variants should show:
- Default state (idle issue with all data populated)
- Hover state (key design focus)
- Active state (selected for detail view)
- Dark mode specifically

States to design after variant selection:
- Selected (batch) state
- Archived state
- Empty/ghost buttons (no folder assigned)
- Multiple status badges row populated
- Notification pulse dot
- Running session with tool animation

## Visual References

- `WorkspaceCard.svelte` — hover glow, accent border, gradient tint, border color transitions
- `workspace_card_variants.ts` — state-dependent styling approach
- Current `IssueCard.svelte` — baseline to improve upon

## UI Freedom

- Exact gradient direction and opacity for body tint
- Header band bottom edge treatment (sharp vs gradient fade)
- Shadow/glow blur radius and spread
- Transition timing and easing curves
- Whether body rows get separators or rely on spacing alone
- Thumbnail corner treatment and overlay effects

## Not Included

- Left accent border (explicitly excluded — reserved for workspace cards)
- Structural layout changes (grid columns, thumbnail size changes)
- New data fields beyond the status row
- Mobile/touch-specific adaptations
