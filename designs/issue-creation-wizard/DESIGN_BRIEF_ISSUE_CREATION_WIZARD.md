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
- Loads up to 20 issues by default. 10 visible without scrolling, remaining accessible via scroll
- Arrow key navigation scrolls the selected issue into view
- Each issue row shows: state icon (green circle-dot for OPEN, purple circle-check for CLOSED), `#number title`
- "Skip — create without GitHub issue" link at the bottom
- **No preselection on open** — search bar empty, no issue highlighted. Enter with no selection = Skip
- **Arrow nav fills search bar** — when navigating with ArrowUp/Down, the selected issue's title and number appear in the search bar (display only, does NOT trigger a GitHub search). Typing after arrow selection clears the arrow-selected state and resumes normal search
- **Clicking an issue** = select that issue + advance to step 2 (acts like confirming)

**Keyboard**:
- Arrow Up/Down: navigate the issue list. First ArrowDown selects item 0, first ArrowUp selects last item. Works from **any focus within the modal** (not just the search input)
- Enter: select highlighted issue and advance (or Skip if no selection)
- Typing: filters the list

**Footer buttons**: Cancel [Esc], Next [Enter]. No Back button (this is the first step). Cancel always shows Esc hint (since no Back button competes for Escape). Navigation hint ↑↓ always visible (even when search input is focused, since arrow nav works from the input).

**Decision (grilled 2026-05-04)**: The selected/highlighted issue row uses `bg-primary-soft` — a subtle green-tinted highlight from the Forest Moss palette (light: `oklch(0.92 0.03 135)` sage green, dark: `oklch(0.305 0.045 145)` deep forest green). Replaces the previous orange `bg-accent` highlight. Designer should verify text contrast on this background in both light and dark modes.

### Step 2: Issue Name

**Purpose**: Confirm or edit the issue name. Shows branch name preview when linked to a GitHub issue.

**Content**:
- Text input with the issue name, auto-focused with cursor at end
- **Issue name excludes issue number** — the number is displayed separately on the issue card and in the branch name. `generateIssueName` produces the first 4 words of the title only (e.g., "Issue card redesign states"). Trailing special characters (commas, colons, dashes, dots, semicolons) are stripped. Inline special chars kept but not counted toward word limit
- No duplicate label — the dialog header already displays the step name
- Below: branch name preview in muted monospace (e.g., `Branch: 163-build-session-history-browsing`)

**Keyboard**:
- Enter: confirms the name and advances. Works from **any focus within the modal** (global handler routes to confirm). If name is empty, shows inline error instead of advancing
- All typing goes to the input (Backspace deletes text, not navigate back)
- Escape: goes back one step (does NOT close the wizard) — because text input captures Backspace

**Validation**: Empty name is rejected with inline error text "Issue name is required" (`text-destructive`) below the input. Error clears when user types any character.

**Footer buttons (dynamic based on focus)**:
- Input focused: Back [Esc], Cancel (no hint), Next [Enter]. No navigation hint
- Input not focused: Back [⌫], Cancel [Esc], Next [Enter]. No navigation hint (step 2 has no navigable items)

**Decision**: Wherever a text input is focused, Escape means "go back" instead of "close wizard". This applies to Step 2 and any other step with focused text input (except Step 1, where Escape closes since there's nowhere to go back). Cancel button shows no keyboard hint when Escape is claimed by Back.

### Step 3: Create Worktree?

**Purpose**: Choose whether to set up a git worktree for this issue.

**Content**:
- Two equal-sized square choice cards (`size-24`) side by side: Yes (tree-pine icon) and No (X icon)
- No duplicate title in the body — the dialog header already displays "Create Worktree?"
- Button labels: "Yes" and "No" (short, no extra text)
- **Clicking a card selects AND advances** to the next step (click-to-advance rule)
- **Decision (grilled 2026-05-04)**: Three visual states per card:
  - **Unselected**: `border-border`, `bg-transparent`
  - **Hover**: `border-border`, `bg-surface-hover`
  - **Selected Yes**: `border-green-500` + `bg-green-500/10` (green-tinted fill)
  - **Selected No**: `border-red-500` + `bg-red-500/10` (red-tinted fill)

**Keyboard**:
- Left/Right arrows: toggle between Yes and No. Works from **any focus within the modal** (not just the cards). Handled by the global keyboard router only (step component does not duplicate arrow handling)
- Enter: confirms the selected choice and advances. Works from **any focus within the modal** (global handler routes to confirm)
- Yes is pre-selected by default

**Focus on step entry**: No element is focused when entering this step — `activeElement` is blurred on mount (via `requestAnimationFrame` to run after Dialog's focus trap). This prevents the Back button or Yes card from showing a focus outline. Tab cycles through Yes → No → footer buttons normally.

**Footer buttons**: Back [⌫], Cancel [Esc], Next [Enter]. Navigation hint ←→ visible.

### Step 4: Pick a Color

**Purpose**: Assign a color to the issue from the workspace's 24-color palette.

**Content**:
- **Color grid**: 4 rows x 6 columns = 24 preset colors, displayed inline (not in a popover/dropdown)
- Each swatch shows the letter "A" with contrast-appropriate text color. **Text is not selectable** (`user-select: none`, `pointer-events: none` on the display text span)
- Used colors (assigned to other issues) are dimmed (`opacity-30`, disabled, skipped by arrow navigation)
- The selected swatch has `scale-110` + `ring-2 ring-ring ring-inset`. **No additional focus-visible outline** — remove `focus-visible:outline` to avoid double ring when keyboard navigating
- Below the grid: a divider, then the hex input row (native color picker swatch + text input). **Vertically centered** between the divider and the footer separator
- The hex input and native picker **must stay visible** (not hidden under an "Advanced" section)
- **Clicking a swatch** = select that color + advance (creates the issue since this is the last step). This follows the click-to-advance rule — if a future step is added, swatch click would advance to that step instead

**Color grid layout** (set in stone):
- Grid must be exactly 6 columns x 4 rows
- All 24 colors from `DEFAULT_COLOR_PALETTE` must be present (no omissions)
- Swatches should be horizontally centered in the modal with equal horizontal and vertical gaps
- The gap between swatches should be visually uniform (same in both axes)

**Keyboard**:
- Arrow keys: navigate the grid (wrapping, skipping disabled colors). Navigation **selects** the color — the hex input and native picker update immediately to reflect the focused color. Works from **any focus within the modal** (not just the swatch grid). Exception: arrows control cursor when hex text input is focused
- Enter: confirms the selection and creates the issue. Enter in the hex input also creates the issue

**Preselection**: The `nextAvailableColor` (first unused color in the palette) is pre-selected and focused when this step loads.

**Footer buttons (dynamic based on focus)**:
- Hex input focused: Back [Esc], Cancel (no hint), Create [Enter]. Navigation hint hidden
- Hex input not focused: Back [⌫], Cancel [Esc], Create [Enter]. Navigation hint ↑↓←→ visible

**Decision (grilled 2026-05-04)**: All footer buttons use `default` (md) size — not just Create. Consistent sizing across Back, Cancel, and Create/Next buttons in all steps.

### Step 5: Worktree Progress (terminal state)

**Purpose**: Shows worktree setup progress after issue creation. Not a user-navigable step.

**Content**: Progress indicator (pending spinner / success checkmark / failure X), retry button on failure, close button.

**Footer buttons**: None (step has its own inline buttons).

## Global Wizard Behavior

### Footer Button Pattern (set in stone)

All footer buttons follow the same visual pattern: `Label [Kbd badge]` with the Kbd badge always on the **right** side of the text. This is consistent across Raycast, Linear, VS Code, and cmdk conventions.

- **Back** button: ghost variant, left-aligned in footer. Not shown on step 1 (no previous step). **Dynamic hint based on text input focus:**
  - Text input focused: `Back [Esc]` — Escape goes back
  - Text input not focused: `Back [⌫]` — Backspace goes back (⌫ is Lucide `delete` icon)
- **Cancel** button: ghost variant, right-aligned. **Dynamic hint based on context:**
  - Step 1 (no Back button): always `Cancel [Esc]`
  - Other steps, text input focused: `Cancel` with **no Kbd hint** (Escape is claimed by Back)
  - Other steps, text input not focused: `Cancel [Esc]`
- **Create/Confirm** button: primary variant, right-aligned. `Create [↵]` where ↵ is the Lucide `corner-down-left` icon inside a Kbd pill with `variant="inverted"` (semi-transparent white on primary background)
- **Navigation hint**: ghost-style non-clickable label, centered in footer. Shows "Navigate" text followed by separate Kbd badges with individual arrow icons on the **right**. Uses `ArrowUpIcon`, `ArrowDownIcon`, `ArrowLeftIcon`, `ArrowRightIcon` (separate per direction). Visibility and arrows per step:
  - Step 1: `Navigate [↑] [↓]` — **always visible** (even when search input is focused, since arrow nav works from the input)
  - Step 2: **never visible** (no navigable items)
  - Step 3: `Navigate [←] [→]` — always visible
  - Step 4: `Navigate [↑] [↓] [←] [→]` — hidden when hex text input is focused

Layout: `[Back ⌫]  ———[Navigate ↑↓]———  [Cancel Esc] [Create ↵]`

**Critical rule:** Every button must always perform the action its label and Kbd hint describe. The keyboard shortcut shown must match the actual key behavior at all times.

### Keyboard Shortcut Routing

- **Escape**: Closes the wizard UNLESS a text input is focused on a non-first step, in which case it goes back one step (because Backspace edits the input text). This applies to Step 2 (name input) and Step 4 (hex input). Step 1 always closes on Escape (nowhere to go back)
- **Backspace**: Goes back one step on all steps EXCEPT when a text input is focused (the keypress edits the text instead). This applies to Step 1 (search input), Step 2 (name input), and Step 4 (hex input)
- **Enter**: Handled per-step (selects issue, confirms name, confirms worktree choice, creates issue). **Must not double-fire** — gate step transitions so only one advance per keypress (fixes Enter-on-step-2-skips-step-3 bug)
- **Arrow keys**: Handled per-step (navigate issue list, toggle worktree choice, navigate color grid). **Work from any focus within the modal**, not just inside the step component. Exception: when a text input is focused, arrows control the cursor instead
- **Click on selectable item**: Confirms the current step and advances to next step across all steps (click-to-advance rule)
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
- Lucide icons: `corner-down-left` (Enter), `delete` (Backspace), `search`, `circle-dot`, `circle-check`, `loader-2`, `tree-pine`, `x`, `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right` (nav hint arrows)

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
- Worktree cards: equal-sized squares (`size-24`), labels "Yes"/"No" only, clicking selects AND advances (click-to-advance)
- Click-to-advance rule: clicking any selectable item confirms + advances across all steps
- Step body must NOT duplicate the dialog header title text
- Step 1 loads 20 issues by default, 10 visible without scrolling
- Arrow navigation in issue list scrolls selected item into view
- Arrow keys work from any focus within the modal (not just inside step components). Exception: text input focused = arrows control cursor
- Next button visible on Steps 1, 2, and 3
- Escape goes back (not close) when text input is focused on any non-first step. Dialog's own Escape handler is suppressed (`onEscapeKeydown preventDefault`)
- Enter confirms the current step from **any focus within the modal** (not just inside the step component). Global handler routes to the step's confirm function
- Step 3 (Worktree): no element is focused on entry — blur active element on mount. Tab cycles through Yes → No → footer buttons
- Empty name validation: step 2 shows inline error "Issue name is required" when Enter is pressed with empty name. Error clears on typing
- Dynamic footer buttons: Back/Cancel swap Kbd hints based on text input focus state
- Navigation hint ("Navigate" text + separate arrow Kbd icons) shown per step: ↑↓ step 1 (always visible), hidden step 2, ←→ step 3, ↑↓←→ step 4 (hidden when hex input focused)
- Step 1: no preselection on open, arrow nav fills search bar (display only, no search trigger)
- Issue name excludes issue number, trailing special chars stripped
- Color swatch text ("A") not selectable (`user-select: none`, `pointer-events: none`)
- No double ring on color swatches — selected ring only, no focus-visible outline
- Color grid gaps must be equal in both axes (fix gap uniformity before adjusting modal width)

## Grilled Decisions (2026-05-04)

The following items were resolved during grilling and are now **set in stone**:

- **Issue list highlight color**: `bg-primary-soft` — soft sage green (light: `oklch(0.92 0.03 135)`, dark: `oklch(0.305 0.045 145)`). Replaces the orange `bg-accent`
- **Button sizes in footer**: All footer buttons (Back, Cancel, Next/Create) use `default` (md) size. Kbd badges scale proportionally
- **Worktree choice cards**: Three states — unselected (`border-border`, transparent), hover (`bg-surface-hover`), selected Yes (`border-green-500` + `bg-green-500/10`), selected No (`border-red-500` + `bg-red-500/10`)
- **Color grid priority**: Fix gap uniformity first (equal horizontal and vertical spacing). The grid was too spread out — tighten swatch gaps rather than widening the modal. Only adjust modal width if uniform gaps still don't fit within `max-w-lg`

### Grilled Decisions (2026-05-05)

- **Click-to-advance**: Clicking any selectable item (issue row, worktree card, color swatch) confirms the current step and advances to the next step. This is a general rule — mouse click = confirm + next. On the last step (color), this means creating the issue
- **No preselection on step 1**: Wizard opens with empty search bar and no highlighted issue. Enter with no selection = Skip (create without GitHub issue)
- **Arrow nav fills search bar**: ArrowUp/Down in step 1 fills the search bar with the selected issue's title and number. Display only — does NOT trigger a search. Typing after arrow selection clears the arrow-selected state
- **Arrow nav from any focus**: Arrow keys navigate items when any element in the modal has focus (not just the step component). Exception: text input focused = arrows control cursor. Applies to steps 1, 3, 4
- **Dynamic footer buttons**: Back shows Esc hint when text input focused, Backspace hint when not. Cancel shows Esc hint only when no Back button exists (step 1) or when text input is not focused. Cancel shows no hint when Escape is claimed by Back
- **Navigation hint in footer**: Ghost-style non-clickable label centered in footer with Kbd arrow icons + "Navigate" text. Step 1: ↑↓, Step 2: hidden, Step 3: ←→, Step 4: ↑↓←→ (hidden when hex input focused)
- **Issue name excludes number**: `generateIssueName` returns title words only, no number prefix. Trailing special characters (commas, colons, dashes, dots, semicolons) stripped. Inline special chars kept but not counted toward word limit
- **Swatch text not selectable**: `user-select: none` and `pointer-events: none` on the display text span
- **No double ring**: Remove `focus-visible:outline` from color swatches — selected `ring-2` is sufficient
- **Color picker vertical centering**: Hex input row vertically centered between divider and footer separator
- **Modal content padding**: Larger top and bottom padding on modal body
- **Enter in hex input**: Creates the issue (same as clicking Create button)
- **Step 1 Cancel always shows Esc**: Since there's no Back button to compete for Escape on step 1

## UI Freedom (designer should explore)

- **Step header styling**: Font size, weight, color. Should clearly indicate the current step without dominating. Current `text-sm font-medium text-muted-foreground` is too subtle
- **Color grid swatch sizing**: Swatches are currently 28px (`h-7 w-7`) with `gap-1.5`. Designer may adjust swatch size and gap to achieve uniform spacing within the modal, but gaps must be equal in both axes
- **Overall modal width**: Currently `max-w-lg`. May increase to `max-w-xl` (576px) only if uniform grid gaps require it — not as a first resort
- **Step transition**: Currently instant swap. Could add a subtle crossfade or slide if it improves perceived flow (not required)
- ~~**Progress indicators**: Step dots implemented in header top-right. Active step = wider pill, completed = primary/50 circles, inactive = border-strong~~ ✅ Done
- **Modal body padding**: Increase top and bottom padding — currently too tight, especially visible on the Create Worktree step. Designer should set appropriate `py-*` values

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
10. ~~Enter on step 2 (Issue Name) skips step 3 (Worktree), jumping directly to step 4 (Color). Suspected cause: keydown event double-fires across step transition. See #181~~ ✅ Fixed
11. ~~Escape with focused input on step 2 may cancel the wizard instead of going back. Button label and actual behavior must match. See #181~~ ✅ Fixed — Dialog's `onEscapeKeydown` suppressed, global handler routes correctly
12. ~~Issue name includes the issue number prefix — should be excluded. See #181~~ ✅ Fixed
13. ~~Color swatches show double ring (selected + focus-visible outline). See #181~~ ✅ Fixed
