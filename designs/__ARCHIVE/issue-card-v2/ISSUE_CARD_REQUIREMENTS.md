# Issue Card v2 — Consolidated Requirements

All requirements for the Grovekeeper issue card redesign. Sourced from: design brief grilling (2026-05-15), variant review feedback (2026-05-15), existing implementation analysis, GitHub issues, git history of REQUIREMENTS.md, and reference designs from independent designer.

**Supersedes**: previous design brief decisions where conflicts exist. This session's requirements take priority.

---

## 1. Card Types

### 1.1 Adopted Issue Card (Full Card)

The primary card. Represents a GitHub issue imported into Grovekeeper with full tracking, worktree, and session capabilities.

### 1.2 Ghost Card (Non-Adopted)

Represents a GitHub issue assigned to the user but not yet imported. Appears in the **Assigned Issues accordion** below the adopted grid.

- Neutral gray by default
- **Dashed border** — stays on hover but becomes more visible
- Same card structure as adopted, but most fields naturally empty
- No quick-action buttons (folder/terminal/editor/mute)
- No tree/character preview (empty placeholder)
- No session state chip
- Adopt split-button replaces contextual action buttons

---

## 2. Header Zone

### 2.1 Header Background

The header uses the issue color as a **gradient** (not flat fill). Exact gradient treatment varies by variant (top-down, left-right, radial, etc.). WCAG-contrast text via `getContrastTextColor()`.

Dark mode: desaturate ~20-30% compared to light mode.

### 2.2 Header Left Content

- **PRD parent number** (if sub-issue): `#87 /` — just `#` + number, NO "PRD" prefix (clear from context). Monospace, **clickable link** that opens the PRD GitHub issue (same visual treatment as issue number and title — underline on hover, cursor pointer). **Text color**: match title text color, maybe slightly dimmed — NOT gray/invisible.
- **PRD group hover**: Hovering over the **PRD number itself** (not the whole card) highlights **ALL cards sharing that PRD with a ring**, including the card being hovered. Ring should have a **larger offset and size** (~25% bigger than normal state rings) so it remains visible even on active/selected cards. The ring should NOT appear on normal card hover — only on PRD number hover.
- **Issue number**: `#142` — monospace, clickable, linked to GitHub issue URL. **When header background is dark/non-colorized, issue number text should be colored with the issue's assigned color** for at-a-glance identification.
- **Issue title**: truncated with ellipsis, clickable to open Issue Detail.

### 2.3 Header Right Content

**Session state chip** (if active session):
- **Rectangular shape** — NOT rounded pill. Distinct from other badges.
- **Monospace font** with dot indicator: `● EXECUTING`, `● NEEDS INPUT`, `● REVIEW`, `● ERROR`, `● PAUSED`, `● DONE`
- Must be visually distinct from GitHub badges and status badges.
- **Each state has a DEFINED color** (does NOT follow header color):
  - EXECUTING: green (green dot + green text)
  - ERROR: red
  - NEEDS INPUT: amber/orange
  - REVIEW: blue or cyan
  - PAUSED: gray/muted
  - DONE: muted green or gray

**Badge style variants** (toggleable in mockup via 3-way switcher):
- **Style A — Solid**: Solid colored background with WCAG-contrast text. Priority uses level-specific colors. Session chip uses state-specific colors.
- **Style B — Borderless dark**: Darker shade of the state/priority color as background, colored text, **NO border**. More subtle, fully integrated with dark themes. Reference: dark olive bg + gold "HIGH", dark red bg + coral "CRITICAL", dark green bg + green "● EXECUTING".
- **Style C — Bordered dark**: Same as Style B (dark bg + colored text) but **WITH a subtle border** in the state/priority color at low opacity. Slightly more defined than Style B.
- **Must look identical across all variants** — badge styling is not variant-dependent.
- Toggle applies to both **priority badges** and **session state chips** simultaneously.

**Priority badge** (if non-medium and priorities enabled):
- **Full text** label: `LOWEST`, `LOW`, `HIGH`, `TOP` — NOT single-letter abbreviation.
- **Rectangular shape** — consistent with session state chip style.
- Clickable, spawns priority change menu.
- **Positioning** — 9 options, toggleable via select in mockup. All positions inside preview have small padding from borders:
  1. **Header Right**: traditional placement next to session chip and quick-action buttons.
  2. **Preview Bottom half-split**: badge straddles the bottom border — half inside, half outside.
  3. **Preview Top half-split**: badge straddles the top border — half inside, half outside.
  4. **Preview Bottom inside**: fully inside preview box, padded from bottom edge.
  5. **Preview Top inside**: fully inside preview box, slightly below top edge.
  6. **Preview Top-Left**: corner position inside preview, padded from top and left.
  7. **Preview Top-Right**: corner position inside preview, padded from top and right.
  8. **Preview Bottom-Left**: corner position inside preview, padded from bottom and left.
  9. **Preview Bottom-Right**: corner position inside preview, padded from bottom and right.
- Priority badge must have correct **z-index** to render above preview content and not be clipped by preview box borders.
- Same positioning applies to **both adopted and ghost cards**.

**Quick-action buttons**: Open Folder, Open Terminal, Open Editor, Mute toggle.
- Icon-only, standard component button sizes (use `gk-btn-icon` / `gk-btn-sm` — NOT custom tiny sizing).
- **Ghost style** — **NO visible background** in default state. Fully transparent. Background appears **only on hover**. This is non-negotiable across all variants.
- Always visible (not hover-revealed) — critical for touch/mobile.
- When no worktree: ghost appearance (reduced opacity), click opens file picker to assign folder.

### 2.4 Removed from Header

- ~~Child count / sub-issues chip~~ — **REMOVED**. Issue cards never represent PRDs, so this chip will never appear. Saves header space.

---

## 3. Body (Two-Column Grid)

`grid-template-columns: ~100px 1fr`

### 3.1 Preview Area (Left Column)

- **Square** shape (not rectangular) — character packs are square-ish.
- Minimum 100px. Designer may adjust upward.
- **Background**: matches header color / issue color gradient. Provides color identity even when content has no background of its own.
- Shows one of:
  - **Tree thumbnail**: `LowPolyTree` with stage-based morphology and hue-tinted canopy.
  - **Character portrait**: When a character pack is active.
  - **Empty placeholder**: Subtle empty well when neither available.

### 3.2 Info Rows (Right Column)

**Row 1 — Worktree + Branch (primary at-a-glance info)**:
- Format: tree-icon `worktree-folder/` + git-branch-icon `branch-slug` (monospace).
- **Worktree name**: folder name only — strip parent path. `grovekeeper-worktrees/gradient-tokens/` → `gradient-tokens/`.
- **Branch name**: strip conventional prefix (`feat/`, `fix/`, `refactor/`, `chore/`). `feat/gradient-tokens` → `gradient-tokens`.
- **Single line only** — never wrap to a second line. Truncate with ellipsis if too long.
- **Badges right-aligned, pinned to right edge**: sync badge, merge conflict badge, worktree error badge. Always visible, never pushed off by long names.
- When no worktree: muted "no worktree" placeholder.

**Row 2 — GitHub badges**:
- PR state badge + issue state badge.
- Maintain `min-h` for consistent spacing even when absent.

**Row 3 — GitHub labels**:
- First N as colored pills + overflow count with tooltip.
- Labels **match their GitHub color**. Uncolored/default labels render grayish.
- **Conflict resolution with action buttons**: when GitHub label pills overlap with the absolutely-positioned contextual action buttons, reduce label count and show remaining as overflow number (e.g., `+2`). Action buttons always take priority for space.

### 3.3 Priority Badge Alternative Position

If priority badge is placed at **bottom-center of preview area** instead of header:
- Overlaps the preview slightly (floating badge style).
- Works well for both adopted and ghost cards.
- Frees header space for session state chip and quick-action buttons.

---

## 4. Action Buttons (Bottom-Right)

Absolutely positioned bottom-right of card body.

### 4.1 Button Hierarchy

1. **Primary action**: filled background. **Accepts the issue's color** as its background (new button variant with WCAG-contrast text via `getContrastTextColor()`). When header is also colorized, primary button color matches header.
2. **Secondary action** (optional): **outlined** style (border visible, transparent background).
3. **Overflow ⋯ button**: **outlined** style — same visual treatment as secondary. NOT ghost.

Max 2 visible + overflow. `deriveContextualActions()` determines which actions appear.

### 4.2 Contextual Action Priority

14 priority levels from `derive_contextual_actions.ts`:
1. Session running → ViewSession (all else disabled)
2. Worktree failed → RetryWorktree / RemoveWorktree
3. Merge conflict → SyncBase / Run
4. Local changes, no PR → CommitPushAndPr / CommitAndPush
5. Local changes, PR exists → CommitAndPush / Commit
6. Ahead of remote, no PR → CreatePr / Push
7. Ahead of remote, PR exists → Push / Review
8. PR changes-requested → Run / Review
9. PR approved → Merge / Review
10. PR open/draft → Review / CheckAndFix
11. Behind base → SyncBase / Run
12. HITL label → Hitl / Run
13. No worktree → Run / SetupWorktree
14. Default → Run / Review

---

## 5. Interactive States

### 5.1 Hover State (All Cards)

**Combination of glow + vertical jump (card lift)**:
- Issue-color border glow or intensified border.
- Card lifts ~2-3px via `translateY` or shadow offset.
- Background brightens slightly.
- Works across **ALL other states** (default, active, selected, done, ghost, etc.) — hover is **always additive**.
- **Every card state must show a clear hover treatment in mockups.** Hover is not optional for any state.
- **Done + hover**: gains outline/border and subtle background (card becomes visible on hover, then fades back).
- **Ghost + hover**: dashed border becomes brighter, background gains subtle gradient stronger on left/top.

### 5.2 Core States

| State | Visual | Trigger |
|-------|--------|---------|
| **Default** | Clean border, subtle shadow | Resting |
| **Hover** | Glow + lift + bg brighten (additive) | Mouse enter |
| **Active** | Subtle green glow (not thick ring), body tint. Green `#22c55e` (dark) / `#4ade80` (light) | Single click (shows detail) |
| **Selected (batch)** | Subtle blue glow, body tint. Blue `#4a9eff` (dark) / `#3b82f6` (light). NO checkbox | Ctrl+click, Shift+click |
| **Selection-ready** | Thinner blue indication, pointer cursor | Ctrl/Shift held |
| **Done** | **Transparent bg, NO borders, NO card surface**. Floating dim content only. Color identity gone entirely. On hover: gains outline + subtle bg. | Issue closed + PR merged |
| **Ghost** | Neutral gray, dashed border, muted | Non-adopted assigned issue |

**Active and Selected rings**: use **subtle glows** rather than thick solid borders. The thick 3px ring from v1 variants is too heavy for the modern design. Explore `box-shadow` glows, inset shadows, or very thin (1px) color-shifted borders with glow backup.

### 5.3 Session-Driven Overlays

| Session State | Overlay Treatment |
|---------------|-------------------|
| **Executing** | **NO card overlay at all**. The `● EXECUTING` chip in header is the only indicator. No glow, no brightness boost, nothing on the card level |
| **Error** | Red tint on card surface, red-shifted glow. **Pulsing animation** — critical state, attention-grabbing. Design per variant, switchable in mockup |
| **Needs Input** (was HITL) | Amber pulse animation. **Pulsing animation** — critical state. Design per variant, switchable in mockup |

**Critical state animations**: Each variant designs its own error/Needs Input pulse style. Mockups include a **select box** to switch between: None / Error (pulse) / Needs Input (pulse).

### 5.4 Deferred States

- **Dragging**: rotation + lift shadow (`rotate-[-1.5deg] scale-[1.02] shadow-lg opacity-92`)
- **Loading**: shimmer/skeleton overlay
- **Disabled**: faded, no pointer events (`opacity-42 pointer-events-none`)

---

## 6. Issue Lifecycle & "Done" State

### 6.1 Current Implementation

`IssueStatus = 'active' | 'archived'` — only two states in DB (schema.rs CHECK constraint).

### 6.2 Done State (DECIDED: Derived at Render Time)

**No DB schema change**. "Done" is computed at render time from GitHub sync state:
- **Condition**: `github_issue_state === 'closed'` AND `pr_state === 'merged'`
- **Visuals**: **Transparent background, NO borders, NO card surface**. Content floats as dim/faded elements — no card structure visible. Color identity gone entirely (no gradient, no issue color). On hover: card gains outline + subtle bg (card becomes visible, then fades back). Contextual actions change to reflect completion (e.g., "Restore" button).
- **Archived**: remains a **filter category only** — no distinct visual. Archiving recategorizes for filtering. Can archive both active and done issues. `IssueStatus` stays `'active' | 'archived'` in DB.

---

## 7. Ghost Card Specifics

### 7.1 Visual Treatment

- Neutral gray surface, **dashed border** (2px dash, 4px gap).
- On hover: dashed border stays but becomes **more visible** (brighter color), background gains a subtle gradient that's stronger on the left/top side. Glow + lift same as adopted cards.

### 7.2 Label-Based Coloring (DECIDED: Show All Options in Mockups)

GitHub labels that have a color assigned on GitHub can tint the ghost card. Each mockup variant must show **three ghost cards** demonstrating:

1. **No colored labels** — fully neutral gray ghost card (all labels are default/gray).
2. **One colored label** (e.g., "Design needed" = #f97316 orange) — single label color tints the ghost card at **~20-25% opacity** (default). That label pill retains full color. The header area should be **significantly tinted** with the label color (not subtle — clearly orange for "Design needed").
3. **Two colored labels** (e.g., "Design needed" = #f97316 orange + "import" = #3b82f6 blue) — **split colorization**: orange tint from the LEFT, blue tint from the RIGHT. Colors meet and blend in the MIDDLE of the card. NOT blended across the full width. It should be visually clear that two distinct colors are present. Each side at ~15-20% opacity.

**Tint opacity**: Default 20-25%. Mockups include a **slider (5-30%)** in the floating control panel to tune label tint intensity.

- Colored labels retain their full color as pill badges.
- **Non-colorizing labels** (default gray GitHub labels) render grayish.
- The tint applies to the ghost card background/border/glow (variant-dependent).

### 7.3 Adopt Split-Button

- **Outlined style** (not vivid/filled) — consistent with the secondary button treatment.
- **No plus icon** — text only, no leading icon.
- **Visible separator** between button text and dropdown chevron.
- Default text: "Adopt + Worktree" (or user's last selection).
- Dropdown options: "Adopt (no worktree)" and "Adopt with Worktree".
- Remembers last-selected option as new default.

---

## 8. Accordion Layout

### 8.1 Adopted Issues Grid (Top)

Standard responsive grid: `repeat(auto-fill, minmax(450px, 1fr))`.

### 8.2 Assigned Issues Accordion (Below Grid)

- **Ghost accordion** — no border, no background on the accordion container itself.
- Header: "Assigned · {count} issues" + sort/filter controls as **ghost icon buttons**.
- Collapsed by default.
- Inside: same responsive card grid, populated with ghost cards.
- Own sort/filter, independent from adopted grid.

### 8.3 View Switcher

Global toggle: card grid vs. compact row view. Applies to both sections together.

---

## 9. Batch Selection

- Ctrl+click, Shift+click (Windows Explorer pattern), right-click "Select", long press (mobile).
- **No checkboxes** — selection indicated entirely through glow/ring treatment.
- Batch actions: Archive, Unarchive, Delete, Change Priority, Clean Worktrees.
- Selection does NOT clear after batch action completes.
- Ring color semantics: active = green, selected/batch = blue.

---

## 10. Design Constraints (Set in Stone)

- Issue color is the **primary visual differentiator** — must be prominent.
- WCAG contrast for all text on colored backgrounds.
- **No left colored accent border** (AI design cliché).
- **No flat solid-color headers** (what we're replacing).
- **No thin top stripe alone** (insufficient color area).
- Must use existing base components (Button, Badge, etc.).
- Must respect token system (`designs/tokens.css`), OKLCH color space.
- 450px minimum card width, responsive grid.
- Preview area: **square**, minimum 100px.
- Always-visible action buttons (not hover-revealed) — mobile/touch requirement.
- No per-card checkboxes for selection.
- **No executing card overlay at all** — chip in header only. Reserve pulsing/flashing for error/Needs Input.
- Quick-action buttons: **NO visible background** by default. Transparent. Bg on hover only.
- Worktree + branch: **single line only**, truncate with ellipsis, strip parent paths and conventional prefixes.
- Typography: Geist (sans) / Geist Mono (mono).

---

## 11. Design Freedom (Per Variant)

- Gradient direction, intensity, and layering (primary axis of exploration).
- Header-to-body visual transition (sharp, fade, seamless blend, crisp line).
- Shadow depth and glow treatment.
- Border style (solid, gradient-tinted, glow-based).
- Card corner radius (current: `rounded-lg` 8px, adjustable).
- Transition timing and easing.
- Preview area background treatment.
- Ghost card dashed border style (dash pattern, gap, color).
- Dark mode desaturation approach.
- Whether issue number carries issue color (depends on header colorization).
- Error/Needs Input animation style (each variant designs its own).

## 12. Interactive Mockup Controls

Each mockup variant includes a **floating control panel** (fixed top-right corner) with these switches:

### 12.1 Toggleable Options

| Control | Options | Purpose |
|---------|---------|---------|
| **Button color** | Issue Color / Moss Green | Primary action button background. May become a user setting |
| **Priority position** | Select: Header Right / Prev Bottom half-split / Prev Top half-split / Prev Bottom inside / Prev Top inside / Prev TL / Prev TR / Prev BL / Prev BR | 9 positions. Applies to adopted AND ghost cards |
| **Session overlay** | None / Error / Needs Input | Critical state overlays only. Executing has NO overlay |
| **Badge style** | Style A (solid) / Style B (borderless dark) / Style C (bordered dark) | 3-way toggle. Switches both priority badges and session chips simultaneously. Must look identical across variants |
| **Label tint** | Slider 5-30% (default ~22%) | Ghost card label colorization intensity |
| **Gradient intensity** | Slider 30-100% (variant-specific) | F: gradient reach. G: header saturation. H: radial emanation strength |
| **Color saturation** | Slider 30-100% (Variant F only) | Controls header color saturation/lightness in Veil variant |

### 12.2 Implementation

- HTML toggle buttons/select boxes that swap CSS classes or `data-*` attributes on affected cards.
- Cards should NOT be duplicated for each option — use class-switching.
- The floating panel must not obscure the card grid. Use semi-transparent background with backdrop blur.

---

## 13. Variant Plan (3 New Variants)

Based on review of 5 initial variants plus reference designs:

### Variant F: "Veil" (Seamless Top-Down Blend)

Inspired by reference design "Variant B: Veil". The issue color creates a seamless vertical gradient starting at full intensity at the top of the header, fading through the body into the dark surface. No hard header/body boundary — one unified gradient surface. **Header should be LIGHTER with dark text** for light/warm issue colors (reference: amber/yellow header with dark text). For dark issue colors, white text is acceptable. Text color auto-determined via `getContrastTextColor()`. **Two sliders**: gradient reach (how far color extends down) AND color saturation (how vivid the header color is). Current colors too dark for black text — saturation slider fixes this.

### Variant G: "Refined Horizon" (Improved Variant D)

Based on our Variant D (Split Horizon). Horizontal left-right header gradient with separate body gradient. Crisp header/body boundary. Square preview with matching header color background. Closest to the current implementation but elevated. Inspired by reference design "Variant A: Horizon". Most mature variant — polish focus. **PRD group ring** should ONLY appear when hovering the PRD number itself, not the entire card. Ghost card label colorization should be **significantly more visible** — "Design needed" orange should strongly tint the header. Two-label ghost cards use **split left/right** colorization (orange from left, blue from right, blending in middle).

### Variant H: "Radiant" (Brighter Variant C)

Based on our Variant C (Radial Emanation) with significantly brighter default colors. The radial gradient from the preview area at the intensity that Variant C's executing pulse reached at its peak — that brightness becomes the resting state. The "aura" effect creates unique visual identity. **Preview box must be OPAQUE dark** — NOT transparent, NOT following the radial intensity. Use a dark surface color so the preview looks "cut out" from the background, creating a natural glow effect around it. Very subtle internal gradient at most. **z-index on priority badges** must be correct so they render above the preview box borders and are never clipped. Tone down preview content. Standard button sizes.

### Per-Variant Requirements

Each variant mockup must show:
1. **4-6 adopted cards** in two-column grid — mix of issue colors (moss, amber, azure, plum, rose, teal)
2. **All core states with hover**: default, default+hover, active, active+hover, selected, selected+hover, done, done+hover. Each state's hover treatment must be clearly visible.
3. **One card with session chip** (`● EXECUTING`) — no card overlay, just the chip
4. **3 ghost cards** in accordion: no colored labels, one colored label (orange "Design needed"), two colored labels (orange + blue)
5. **Floating control panel** with all controls from §12 (toggles + sliders)
6. **Dark mode** primary (the design target)
7. **PRD group hover** demo: at least 2 cards share a PRD number to demonstrate group highlighting

---

## 14. Component Requirements

### 13.1 Existing Components to Use

- Button (`ghost-overlay` for quick-actions, issue-color variant for primary action)
- Badge (GitHub labels, status indicators)
- SessionStateChip (needs redesign: rectangular, mono, dot indicator)
- TreeThumbnailImage, GitHubBadge, SyncBadge, MergeConflictBadge
- ContextualActionButtons, WithTooltip
- `getContrastTextColor()` from color_utils.ts

### 13.2 New Components Needed

- **SplitButton**: ButtonGroup + Separator + Button + DropdownMenu. Outlined style, remembers last selection.
- **IssueColorButton**: New Button variant that accepts a color prop, computes WCAG-contrast text.
- **RectangularStateChip**: Rectangular badge variant with mono font and dot indicator for session states and priority.

---

## 15. Source Files (Current Implementation)

- `src/lib/components/blocks/issue/IssueCard.svelte` (538 lines)
- `src/lib/components/blocks/issue/IssueCardList.svelte`
- `src/lib/components/blocks/issue/ContextualActionButtons.svelte`
- `src/lib/components/blocks/issue/batch_selection_utils.ts`
- `src/lib/components/blocks/issue/AssignedIssuesPanel.svelte`
- `src/lib/modules/contextual-actions/derive_contextual_actions.ts`
- `src/lib/modules/issues/types.ts` — IssueStatus, IssuePriority, WorktreeState
- `src-tauri/src/database/schema.rs` — CHECK constraint: `status IN ('active', 'archived')`
- `src-tauri/src/commands/issue_commands.rs` — archive/unarchive mutations
