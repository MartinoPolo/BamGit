# Issue Creation Wizard — Design Spec

Design spec for the multi-step issue creation wizard modal in Grovekeeper. The wizard currently works but has visual/UX inconsistencies that need a unified redesign. Hand this to a designer for implementation. This is a polish pass — the functional flow exists and should not change.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono. All UI components come from shadcn-svelte (Bits UI primitives + Tailwind).

## Wizard Overview

The wizard creates a new tracked issue through a linear step sequence inside a modal dialog. Steps flow left-to-right:

1. **Search GitHub Issues** — select an existing GitHub issue or skip
2. **Issue Name** — confirm/edit the issue name (auto-filled from GitHub issue title)
3. **Create Worktree?** — yes/no choice for git worktree setup
4. **Pick a Color** — assign a color from the 24-color palette
5. **Worktree Progress** — (terminal state) shows setup progress/retry

The wizard is opened via `Ctrl+N` or the "+" button on the dashboard.

## Step-by-Step Requirements

### Step 1: Search GitHub Issues

**Purpose**: Select an existing GitHub issue to link, or skip to create an unlinked issue.

**Content**:
- Search input with magnifying glass icon, auto-focused on step entry
- Below: scrollable list of issues (assigned issues by default, search results when typing)
- Each issue row shows: state icon (green circle-dot for OPEN, purple circle-check for CLOSED), `#number title`
- "Skip — create without GitHub issue" link at the bottom

**Keyboard**:
- Arrow Up/Down: navigate the issue list
- Enter: select highlighted issue and advance
- Typing: filters the list

**Footer buttons**: Cancel [Esc]. No Back button (this is the first step). No Confirm button (Enter selects from the list).

**Decision (grilled 2026-05-04)**: The selected/highlighted issue row uses `bg-primary-soft` — a subtle green-tinted highlight from the Forest Moss palette (light: `oklch(0.92 0.03 135)` sage green, dark: `oklch(0.305 0.045 145)` deep forest green). Replaces the previous orange `bg-accent` highlight. Designer should verify text contrast on this background in both light and dark modes.

### Step 2: Issue Name

**Purpose**: Confirm or edit the issue name. Shows branch name preview when linked to a GitHub issue.

**Content**:
- Text input with the issue name, auto-focused with cursor at end
- Below: branch name preview in muted monospace (e.g., `Branch: 163-build-session-history-browsing`)

**Keyboard**:
- Enter: confirms the name and advances
- All typing goes to the input (Backspace deletes text, not navigate back)

**Footer buttons**: Cancel [Esc]. No Back button — Backspace must edit text, not navigate. The Escape key goes back one step from this screen (does NOT close the wizard). Add a visible Confirm/Next button with Enter [kbd] hint so users know how to proceed.

**Decision**: Escape behavior in this step is "go back" (not "close wizard") because the text input captures Backspace. This is the only step where Escape means "back" instead of "close".

### Step 3: Create Worktree?

**Purpose**: Choose whether to set up a git worktree for this issue.

**Content**:
- Two large choice cards side by side: Yes (tree-pine icon) and No (X icon)
- **Decision (grilled 2026-05-04)**: Three visual states per card:
  - **Unselected**: `border-border`, `bg-transparent`
  - **Hover**: `border-border`, `bg-surface-hover`
  - **Selected Yes**: `border-green-500` + `bg-green-500/10` (green-tinted fill)
  - **Selected No**: `border-red-500` + `bg-red-500/10` (red-tinted fill)

**Keyboard**:
- Left/Right arrows: toggle between Yes and No
- Enter: confirms the selected choice and advances
- **Yes should be pre-selected by default** (currently nothing is selected, which is confusing)

**Footer buttons**: Back [kbd], Cancel [Esc]. Consider adding a Confirm/Next button with Enter [kbd] hint for discoverability.

### Step 4: Pick a Color

**Purpose**: Assign a color to the issue from the workspace's 24-color palette.

**Content**:
- **Color grid**: 4 rows x 6 columns = 24 preset colors, displayed inline (not in a popover/dropdown)
- Each swatch shows the letter "A" with contrast-appropriate text color
- Used colors (assigned to other issues) are dimmed (`opacity-30`, disabled, skipped by arrow navigation)
- The selected swatch has `scale-110` + `ring-2 ring-ring ring-inset`
- Below the grid: a divider, then the hex input row (native color picker swatch + text input)
- The hex input and native picker **must stay visible** (not hidden under an "Advanced" section)

**Color grid layout** (set in stone):
- Grid must be exactly 6 columns x 4 rows
- All 24 colors from `DEFAULT_COLOR_PALETTE` must be present (no omissions)
- Swatches should be horizontally centered in the modal with equal horizontal and vertical gaps
- The gap between swatches should be visually uniform (same in both axes)

**Keyboard**:
- Arrow keys: navigate the grid (wrapping, skipping disabled colors). Navigation **selects** the color — the hex input and native picker update immediately to reflect the focused color
- Enter: confirms the selection and creates the issue

**Preselection**: The `nextAvailableColor` (first unused color in the palette) is pre-selected and focused when this step loads.

**Footer buttons**: Back [kbd], Cancel [Esc], Create [Enter kbd]. The Create button is the primary action button for the entire wizard. **Decision (grilled 2026-05-04)**: All footer buttons use `default` (md) size — not just Create. Consistent sizing across Back, Cancel, and Create/Next buttons in all steps.

### Step 5: Worktree Progress (terminal state)

**Purpose**: Shows worktree setup progress after issue creation. Not a user-navigable step.

**Content**: Progress indicator (pending spinner / success checkmark / failure X), retry button on failure, close button.

**Footer buttons**: None (step has its own inline buttons).

## Global Wizard Behavior

### Footer Button Pattern (set in stone)

All footer buttons follow the same visual pattern: `Label [Kbd badge]` with the Kbd badge always on the **right** side of the text. This is consistent across Raycast, Linear, VS Code, and cmdk conventions.

- **Back** button: ghost variant, left-aligned in footer. `Back [⌫]` where ⌫ is the Lucide `delete` icon (backspace key with X inside, not the thin-line variant) inside a Kbd pill
- **Cancel** button: ghost variant, right-aligned. `Cancel [Esc]` with text "Esc" inside a Kbd pill
- **Create/Confirm** button: primary variant, right-aligned. `Create [↵]` where ↵ is the Lucide `corner-down-left` icon inside a Kbd pill with `variant="inverted"` (semi-transparent white on primary background)

Layout: `[Back ⌫]  ———spacer———  [Cancel Esc] [Create ↵]`

### Keyboard Shortcut Routing

- **Escape**: Closes the wizard on all steps EXCEPT Step 2 (Issue Name), where it goes back one step (because Backspace edits the input text)
- **Backspace**: Goes back one step on all steps EXCEPT when a text input is focused and non-empty (the keypress edits the text instead). This applies to Step 1 (search input), Step 2 (name input), and Step 4 (hex input)
- **Enter**: Handled per-step (selects issue, confirms name, confirms worktree choice, creates issue)
- **Arrow keys**: Handled per-step (navigate issue list, toggle worktree choice, navigate color grid)
- Mouse back button (button 4): Goes back one step (already implemented)

### Step Header

- The step title (e.g., "Search GitHub Issues", "Issue Name", "Pick a Color") serves as the modal header
- **UI freedom**: The current header text is small (`text-sm font-medium text-muted-foreground`) and feels under-styled. The designer should increase the font size and weight to make it clearly indicate what the current step does. Consider `text-base font-semibold text-foreground` or similar — it should be the first thing the user reads but not dominate the content area. Vertical centering in the header area should be verified.

## Components

### Files involved

- `src/lib/components/creation-wizard/CreationWizard.svelte` — orchestrator (Dialog, footer, keyboard routing)
- `src/lib/components/creation-wizard/StepGithubSearch.svelte` — Step 1
- `src/lib/components/creation-wizard/StepIssueName.svelte` — Step 2
- `src/lib/components/creation-wizard/StepWorktreeChoice.svelte` — Step 3
- `src/lib/components/creation-wizard/StepColorSelection.svelte` — Step 4
- `src/lib/components/creation-wizard/StepWorktreeProgress.svelte` — Step 5
- `src/lib/components/color-picker/ColorPickerContent.svelte` — shared color grid (used by Step 4 and standalone ColorPicker popover)
- `src/lib/components/color-picker/ColorPicker.svelte` — popover wrapper (NOT used in wizard, but shares ColorPickerContent)
- `src/lib/modules/creation-wizard/creation_wizard.context.svelte.ts` — state management
- `src/lib/modules/creation-wizard/types.ts` — types and step constants

### Shared components used

- `Dialog` (shadcn) — modal wrapper
- `Button` (shadcn) — footer buttons, all variants
- `Kbd` (shadcn) — keyboard shortcut badges inside buttons. Supports `variant="default"` (for ghost/secondary buttons) and `variant="inverted"` (for primary buttons)
- `Input` (shadcn) — search input, name input, hex input
- Lucide icons: `corner-down-left` (Enter), `delete` (Backspace), `search`, `circle-dot`, `circle-check`, `loader-2`, `tree-pine`, `x`

## What Is Set in Stone

- The 5-step linear flow (search → name → worktree → color → progress)
- The 24-color palette (`DEFAULT_COLOR_PALETTE` in `color_utils.ts`)
- Footer button pattern: `Label [Kbd]` with badge on right, consistent across all buttons
- Footer button size: `default` (md) for all buttons in all steps
- Keyboard shortcut behavior (Enter, Escape, Backspace, arrows) as described above
- ColorPickerContent is shared between wizard and standalone popover — changes affect both
- The wizard is a modal dialog (`Dialog.Root` from shadcn)
- Display text "A" on color swatches
- Used colors are dimmed and disabled
- Color grid is 6 columns x 4 rows
- Issue list highlight: `bg-primary-soft` (sage green / deep forest green)
- Worktree card states: unselected (transparent), hover (`bg-surface-hover`), selected Yes (green fill), selected No (red fill)
- Color grid gaps must be equal in both axes (fix gap uniformity before adjusting modal width)

## Grilled Decisions (2026-05-04)

The following items were resolved during grilling and are now **set in stone**:

- **Issue list highlight color**: `bg-primary-soft` — soft sage green (light: `oklch(0.92 0.03 135)`, dark: `oklch(0.305 0.045 145)`). Replaces the orange `bg-accent`
- **Button sizes in footer**: All footer buttons (Back, Cancel, Next/Create) use `default` (md) size. Kbd badges scale proportionally
- **Worktree choice cards**: Three states — unselected (`border-border`, transparent), hover (`bg-surface-hover`), selected Yes (`border-green-500` + `bg-green-500/10`), selected No (`border-red-500` + `bg-red-500/10`)
- **Color grid priority**: Fix gap uniformity first (equal horizontal and vertical spacing). The grid was too spread out — tighten swatch gaps rather than widening the modal. Only adjust modal width if uniform gaps still don't fit within `max-w-lg`

## UI Freedom (designer should explore)

- **Step header styling**: Font size, weight, color. Should clearly indicate the current step without dominating. Current `text-sm font-medium text-muted-foreground` is too subtle
- **Color grid swatch sizing**: Swatches are currently 28px (`h-7 w-7`) with `gap-1.5`. Designer may adjust swatch size and gap to achieve uniform spacing within the modal, but gaps must be equal in both axes
- **Overall modal width**: Currently `max-w-lg`. May increase to `max-w-xl` (576px) only if uniform grid gaps require it — not as a first resort
- **Step transition**: Currently instant swap. Could add a subtle crossfade or slide if it improves perceived flow (not required)
- **Progress indicators**: Step dots, progress bar, or breadcrumb to show wizard position (optional — may add clutter for a 4-step flow)

## Not Included in This Design

- The standalone `ColorPicker` popover (used in settings) — shares `ColorPickerContent` but its trigger/popover wrapper is separate
- Issue detail/edit modal
- Dashboard layout
- Keyboard shortcut settings panel
- Storybook stories for individual components (already exist)

## Known Bugs to Fix During Implementation

1. Color grid shows fewer than 24 colors — all 24 must render in a 6x4 grid
2. ~~Worktree step has no default selection — Yes should be pre-selected~~ ✅ Fixed on dev
3. ~~Issue Name step has no visible Confirm button~~ ✅ Fixed on dev
4. ~~GitHub Search step has no visible Confirm button~~ ✅ Fixed on dev
5. ~~Worktree step has no Create/Confirm button~~ ✅ Fixed on dev
6. ~~Keyboard navigation in color grid should update the hex input and native picker in real-time~~ ✅ Fixed on dev
7. ~~Backspace in text inputs (search, name, hex) must not propagate to wizard navigation~~ ✅ Fixed on dev
8. ~~Escape in Issue Name step should go back (not close wizard) since Backspace edits text~~ ✅ Fixed on dev
9. ~~Step header text is not vertically centered and is too small~~ ✅ Fixed on dev
