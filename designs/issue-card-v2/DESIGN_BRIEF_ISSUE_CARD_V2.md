# Issue Card v2 — Design Brief

> **NOTE**: This brief was the starting point for variant generation. The **canonical requirements** are now in `ISSUE_CARD_REQUIREMENTS.md` (same directory), which incorporates all grilling decisions and two rounds of variant review feedback. When conflicts exist, `ISSUE_CARD_REQUIREMENTS.md` takes priority.
>
> Raw user feedback from variant reviews: `V2_REFINEMENT_RAW_PROMPT.md` (Round 1), `V2_ROUND2_RAW_PROMPT.md` (Round 2).

Complete visual redesign of the Grovekeeper issue card. The current solid-color header band looks cartoonish and out of place in a modern developer tool. This redesign explores gradient-based color identity, introduces a "ghost" card variant for non-adopted issues, and defines all interactive states.

**Supersedes**: `designs/issue-card/DESIGN_BRIEF_ISSUE_CARD.md` and `designs/issue-card-redesign/DESIGN_BRIEF_ISSUE_CARD_REDESIGN.md`. Those briefs remain as historical reference.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `designs/tokens.css`. Font: Geist (sans) / Geist Mono. OKLCH color space for all computed colors.

## Container Context

**Parent**: `IssueCardList` inside `WorkspaceBottomPanel` — Issues tab, card grid view
**What parent provides**: CSS Grid layout (`repeat(auto-fill, minmax(450px, 1fr))`), batch selection toolbar, view switcher (card grid vs compact row), archived issues section, bottom panel tab bar and chrome
**What this component fills**: A single grid cell within the issue card grid
**Must NOT include**: Grid layout, bottom panel chrome, batch toolbar, view switcher — these belong to parent components

**Mockup rendering**: Show 4-6 cards in a two-column grid context so the viewer sees relative sizing, color variety, and the contrast between adopted and ghost cards side by side. Include the accordion section for assigned issues below the adopted grid.

---

## Core Design Problem

Each issue has a user-assigned hex color from a 24-color palette. A user scanning 10-20 cards must **immediately identify each issue by its color**. The current implementation uses a flat solid-color header band — this is too heavy and looks cartoonish. The redesign must preserve strong color identity while achieving an elegant, modern look.

### Design Direction: Gradients on Backgrounds

The primary area of creative freedom is **gradient treatment on both header and card body backgrounds**. The designer should explore different gradient directions, intensities, and combinations across the 5 variants. Specifically:

- **Header background**: Gradient-based, not flat solid. Could fade from issue color into surface, use a desaturated version, or blend with a neutral.
- **Card body background**: May carry a subtle tint, wash, or secondary gradient derived from the issue color.
- **Gradient directions**: Free exploration — top-to-bottom, diagonal, radial, or creative combinations.
- **Dark mode**: Reduce saturation ~20-30% compared to light mode. Issue color should feel muted but still distinct.

### What to Avoid

- **Left colored border / accent bar**: This is a well-known AI design cliché ("almost as reliable a sign of AI-generated design as em-dashes are for AI-generated text"). Do not use it.
- **Thin top stripe alone**: Insufficient color surface area to distinguish issues at a glance.
- **Default shadcn/ui styling without customization**: Creates a "vibe-coded" samey look. All elements should feel intentionally designed.
- **Flat solid-color fills**: The whole point of this redesign is to move away from these.

---

## Card Types

### 1. Adopted Issue Card (Full Card)

The primary card. Represents an issue that has been imported into Grovekeeper with full tracking, worktree, and session capabilities.

#### Header Zone

The header uses the issue color as the dominant visual element, rendered as a **gradient** (not flat fill). WCAG-contrast text via `getContrastTextColor()`.

**Left side**:
- PRD parent number (if sub-issue): `PRD#87 /` (monospace, linked to GitHub when URL available)
- Issue number: `#123` (monospace, linked to GitHub issue URL when available)
- Issue name (truncated with ellipsis, clickable to open Issue Detail)

**Right side** (fixed, always visible):
- Child count chip (if sub-issues exist): layers icon + count
- Session state chip (if active session): EXECUTING / HITL / REVIEW / ERROR / PAUSED / DONE
- Priority badge (if non-medium and priorities enabled): clickable, spawns priority change menu
- Quick-action buttons: Open Folder, Open Terminal, Open Editor, Mute toggle

**Quick-action buttons**:
- Icon-only, ~18-20px, semi-transparent backdrop matching header treatment
- Always visible (not hover-revealed) — critical for touch/mobile
- When no worktree: ghost appearance (reduced opacity), click opens file picker to assign folder
- Right-click on any button: opens file picker to reassign folder

#### Body (Two-Column Grid)

`grid-template-columns: ~100px 1fr`

**Left column — Preview area (~100px)**:
- Shows one of:
  - **Tree thumbnail**: `LowPolyTree` component with stage-based morphology and hue-tinted canopy. Gradient background derived from issue color.
  - **Character portrait**: When a character pack is active for this issue.
  - **Empty placeholder**: Subtle empty well when neither is available.
- Minimum 100px — trees look too small at 80px. Designer may adjust upward if the new design warrants it.
- Corner treatment and overlay effects are at designer's discretion.

**Right column — Info rows**:
- **Row 1**: Worktree + branch path (monospace, the primary info at a glance). Format: tree icon `worktree/` + git-branch icon `branch-name`. This tells the user instantly whether a worktree exists and which branch is checked out. When no worktree: show muted "no worktree" placeholder. After the path: sync badge, merge conflict badge, worktree error badge (inline, right-aligned or wrapping to second line if narrow).
- **Row 2**: GitHub badges (PR state + issue state) — always render with min-h for consistent spacing even when absent
- **Row 3**: GitHub labels (first 3 as pills + overflow count with tooltip)

#### Action Buttons (Bottom-Right, Always Visible)

- Absolutely positioned bottom-right of card body
- Contextual action buttons (max 2 visible + overflow ⋯)
- Primary action: moss green background for recommended next step
- Overflow button opens the same context menu as right-click
- `deriveContextualActions()` determines which actions appear based on issue/session/git state

---

### 2. Ghost Issue Card (Non-Adopted)

Represents a GitHub issue assigned to the user but not yet imported into Grovekeeper. Appears in the **Assigned Issues accordion** below the adopted issue grid.

#### Visual Treatment

- **Neutral gray** by default — no issue color assigned yet
- **Dashed or dotted border** to distinguish from adopted cards at a glance
- **Muted overall opacity** or desaturated surface — clearly communicates "not yet active"
- **Same card size and structure** as adopted cards — same grid cell dimensions

#### Label-Based Coloring (Designer Explores Both)

Some GitHub labels may colorize the ghost card. Two approaches to explore across variants:

**Option A — Priority system**: Highest-priority label's color becomes a subtle tint for the entire ghost card. One color wins.

**Option B — Split gradient** (max 2-3 labels): Ghost card background uses a diagonal or linear gradient blending top label colors at ~8% opacity each. Cap at 3 to avoid muddiness.

When a label triggers colorization, that label's pill badge retains full color. All other GitHub labels render in **grayed-out** style to match the ghost aesthetic.

#### Content

Ghost cards display the **same structure** as adopted cards. Most fields will naturally be empty since non-adopted issues lack worktrees, branches, PRs, and sessions.

**Always shown**:
- Issue title + `#number` (linked to GitHub)
- GitHub issue state badge (open/closed)
- GitHub labels (grayed out, except colorizing labels at full color)
- PRD parent number (if the issue belongs to a PRD)
- Priority badge (if set on GitHub)
- **Adopt split-button** (see below)

**Shown if available** (rare for non-adopted):
- Branch name, worktree badge, sync badge, PR badge

**Never shown**:
- Quick-action buttons (folder/terminal/editor/mute) — no worktree means these serve no purpose
- Tree or character in preview area — replaced by empty placeholder
- Session state chip — no sessions possible
- Contextual action buttons — replaced by the Adopt button

#### Adopt Split-Button

A **split button** in the position where contextual action buttons normally appear:

- **Default action**: "Adopt with Worktree" (or the user's last-selected option)
- **Dropdown**: "Adopt" (no worktree), "Adopt with Worktree", potentially other options
- **Remembers** the last-selected option as the new default
- Built with shadcn `ButtonGroup` + `DropdownMenu` pattern (see `shadcn-svelte/docs/src/lib/registry/examples/button-group-split-demo.svelte`)

#### Priority Badge Positioning

Since ghost cards lack the quick-action buttons that normally anchor the right side of the header, the priority badge needs a **new positioning strategy**. Options for the designer:
- Float it in the header where quick-action buttons would be
- Place it in the body metadata area
- Integrate it into the issue number/title row
- The designer should solve this naturally within each variant's layout

---

## Interactive States

All states must be **clearly distinguishable at a glance**. No checkboxes on cards — selection indicated entirely through ring/glow treatment. Ring colors match forest glow colors for two-way visual consistency.

### Core States (Fully Design)

| State | Visual | Trigger |
|-------|--------|---------|
| **Default** | Clean border, subtle shadow, no ring | Resting |
| **Hover** | Issue-color border/glow transition, background brightens, shadow lift | Mouse enter |
| **Active** | Stronger glow, thicker ring, heavier background tint. Green `#22c55e` (dark) / `#4ade80` (light) | Single click (one at a time, shows detail in bottom panel) |
| **Selected (batch)** | Blue `#4a9eff` (dark) / `#3b82f6` (light) ring + body tint. NO checkbox | Ctrl+click, Shift+click, right-click "Select" |
| **Selection-ready** | Thinner blue ring, lighter intensity. Cursor stays pointer | Ctrl/Shift held over card |
| **Archived** | `grayscale(0.8) opacity(0.7)` overlay. Preserves stored color underneath | Issue archived |
| **Ghost** | Neutral gray, dashed border, muted. See Ghost Card section | Non-adopted assigned issue |

### Session-Driven Overlays (Fully Design)

These overlay on top of the default/hover/active states:

| Session State | Overlay Treatment |
|---------------|-------------------|
| **Executing** | Breathing glow animation (pulsing issue-color glow, like WorkspaceCard's `animate-ws-breathe`) |
| **Error** | Red tint on card surface, red-shifted glow. Session state chip shows ERROR |
| **HITL** (needs input) | Amber pulse animation. Attention-drawing but not alarming |
| **Done** | Subtle fade/completion indicator. Brief success glow, then settles to default |

### Deferred States (Minimal Treatment OK)

- **Dragging**: rotation + lift shadow (current: `rotate-[-1.5deg] scale-[1.02] shadow-lg opacity-92`)
- **Loading**: shimmer/skeleton overlay
- **Disabled**: faded, no pointer events (current: `opacity-42 pointer-events-none`)

---

## Layout: Adopted + Assigned Accordion

The Issues tab contains two sections:

### Adopted Issues Grid (Top)

Standard responsive grid: `repeat(auto-fill, minmax(450px, 1fr))`. Row-major ordering. Contains all adopted issue cards (full cards).

### Assigned Issues Accordion (Below Grid)

A **collapsible accordion section** below the adopted grid:

- **Accordion header**: "Assigned · {count} issues" + sort/filter controls as icon buttons
- **Collapsed by default** when the user first visits
- **Inside**: Same responsive card grid as above, but populated with ghost cards
- **Own sort/filter**: Independent from the adopted grid's sort/filter

The accordion replaces the need for a separate "Assigned Issues" bottom-panel tab (decision on removing that tab is deferred until this ships).

### View Switcher

A **global view toggle** in the Issues tab toolbar switches between:

1. **Card grid view** (default): The layout described in this brief
2. **Compact row view**: Defined in `designs/issue-accordion-row/DESIGN_BRIEF_ISSUE_ACCORDION_ROW.md`

The view switcher applies to **both sections** (adopted grid and assigned accordion). Both sections switch view mode together.

**No per-card collapse/expand**. The former collapsed/expanded card toggle is dropped in favor of this global view switcher.

---

## Reusable Components

Must use existing Grovekeeper components — no custom `<button>` or `<span>` elements where a component exists:

- **Button**: `Button` from `$lib/components/shadcn/button/` — `ghost-overlay` for header quick-actions, contextual action buttons
- **Badge**: `Badge` from `$lib/components/shadcn/badge/` — status indicators, GitHub labels
- **SessionStateChip**: Existing component for session state display
- **TreeThumbnailImage**: Existing tree visualization thumbnail
- **GitHubBadge**: Existing badge with color/state variants
- **SyncBadge**: Existing behind-base-count indicator
- **MergeConflictBadge**: Existing conflict indicator
- **ContextualActionButtons**: Existing action button set with primary/secondary/overflow
- **WithTooltip**: Existing tooltip wrapper
- **Color utility**: `getContrastTextColor()` from `color-picker/color_utils.ts`

## Components to Create

- **SplitButton**: New derived component wrapping `ButtonGroup.Root` + `ButtonGroup.Separator` + `Button` + `DropdownMenu`. Remembers last-selected action. See shadcn reference: `button-group-split-demo.svelte`.

---

## Variant Requirements (5 Variants)

Each variant should show:

1. **Two-column grid with 4-6 cards** — mix of different issue colors (use moss green, amber, azure, plum, rose, teal from the palette)
2. **At least one ghost card** visible in an accordion section below the adopted grid
3. **All interactive states** for one card: default + hover + active + selected
4. **One card with active session** showing the executing breathing glow
5. **Archived card** (grayscale overlay)
6. **Label coloring exploration** on ghost card: variants should cover both priority-based (single color) and split-gradient (2-3 colors) approaches
7. **Dark mode** (primary theme) — light mode support noted but dark is the design target

### What Varies Between Variants

- **Gradient direction and intensity** on header and body
- **Border treatment**: solid, gradient-tinted, glow-based, or combinations
- **Shadow and glow approach**: box-shadow layers, blur radius, spread
- **Header-to-body transition**: sharp edge, gradient fade, blended
- **State treatment styling**: How hover/active/selected look within each variant's visual language
- **Ghost card aesthetic**: How the muted/neutral treatment interacts with the variant's style
- **Priority badge positioning** (especially on ghost cards without header buttons)

### What Stays Constant Across Variants

- Card anatomy (header zone + preview area + info rows + action buttons)
- Preview area ~100px minimum
- Information content and hierarchy
- Interactive behavior (click, hover, selection mechanics)
- Component usage (Button, Badge, GitHubBadge, etc.)
- Typography (Geist / Geist Mono)
- Grid layout (450px min, auto-fill)
- State semantics (hover = warm, active = green, selected = blue)

---

## Design Freedom

Areas where the designer has maximum creative latitude:

- **Gradient direction, intensity, and layering** — the primary exploration axis
- **Header-to-body visual transition** — sharp, gradient fade, blended, overlapping
- **Shadow depth and glow treatment** — subtle vs dramatic, how many box-shadow layers
- **Border style and color** — solid, gradient-tinted, glow-based
- **Card corner radius** — current is `rounded-lg` (8px) but can be adjusted
- **Transition timing and easing** — hover animations, state change speed
- **Preview area background treatment** — gradient, pattern, or themed behind tree/character
- **Ghost card dashed border style** — dash pattern, gap, color
- **Session overlay animation style** — breathing speed, glow intensity, color shift
- **Dark mode desaturation approach** — how much to mute, filter vs color-mix
- **Priority badge position on ghost cards** — wherever it fits the layout best

## Design Constraints (Set in Stone)

- Issue color is the **primary visual differentiator** — it must be prominent
- WCAG contrast for all text on colored backgrounds
- No left accent border (AI design cliché)
- No flat solid-color headers (the thing we're replacing)
- Must use existing base components (Button, Badge, etc.) — not custom HTML
- Must respect the token system (`designs/tokens.css`)
- 450px minimum card width, responsive grid
- Preview area not smaller than 100px
- Always-visible action buttons (not hover-revealed) — mobile/touch requirement
- No per-card checkboxes for selection
- Ring color semantics: hover = warm/issue-color, active = green, selected = blue

---

## Visual References

- **WorkspaceCard.svelte** — oklch glows, breathing animations, gradient tints, accent border transitions. Good visual language to draw from but not required to match exactly. Issue cards and workspace cards are never visible simultaneously, so some visual distinction is acceptable.
- **Current IssueCard.svelte** — baseline to improve upon. The information layout works; the visual treatment doesn't.
- **Forest Moss palette** (`designs/tokens.css`) — deep greens, bark browns, amber accents, cool blues, plum purples
- **`designs/issue-card-redesign/variants/`** — previous redesign attempts (variant-a through variant-e) for context on what was tried

## Not Included in This Design

- Compact row view (separate brief: `designs/issue-accordion-row/`)
- Kanban board layout (separate tab)
- Issue creation wizard
- Issue detail/edit modal
- Color picker component (already implemented)
- Tree lifecycle legend (separate artboard)
- Forest view tree rendering
- Drag-and-drop reordering
- Context menu component (already implemented via bits-ui)
- Batch action toolbar (already implemented, parent component)
