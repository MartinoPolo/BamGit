# Issue Creation Wizard — Design Brief

Design spec for the multi-step issue creation wizard modal in Grovekeeper. The wizard is fully implemented and functional — this brief documents the complete visual and interaction design for polish, mockup generation, and future reference.

**Related**: PRD #89 (Issue Management & Creation), issues #133 #172 #174 #181

---

## 1. Purpose

The Issue Creation Wizard guides users through creating a new tracked issue in Grovekeeper via a 5-step keyboard-first linear flow. It enables linking to existing GitHub issues, naming the issue, optionally setting up a git worktree, assigning a visual color identifier, and monitoring worktree setup progress. The wizard is the primary entry point for starting new work, accessible via `Ctrl+N` or the "+" button on the dashboard. This component consolidates all setup decisions in one focused modal experience.

---

## 2. Surrounding Context

**Parent**: Standalone modal overlay (no parent component provides layout).

**What's behind the wizard**: The full dashboard — sidebar, topbar, forest view, bottom panel — all visible but dimmed behind an **opacity-only overlay** (no CSS `backdrop-filter: blur()` per DECISIONS.md). The wizard should feel like part of the app, not a separate experience.

**What this component fills**: Full viewport overlay with centered modal content. Currently `max-w-lg` (512px), may expand to `max-w-xl` (576px) if needed for uniform color grid spacing.

**Must NOT include**: Application layout, dashboard chrome, or persistent UI elements — the wizard is an isolated creation flow.

**Mockup rendering**: Show the wizard modal centered over a dimmed application background. The wizard owns its full chrome: dialog backdrop, modal container, header with step title + progress dots, body content area, and footer with action buttons.

---

## 3. Requirements

### 3.1 Wizard Overview

5-step linear flow inside a modal dialog:

| Step | Name | Purpose |
|------|------|---------|
| 1 | Search GitHub Issues | Select an existing GitHub issue or skip |
| 2 | Issue Name | Confirm/edit the issue name (auto-filled from GitHub title) |
| 3 | Create Worktree? | Yes/no choice for git worktree setup (skipped if no local folder) |
| 4 | Pick a Color | Assign a color from the 24-color palette |
| 5 | Worktree Progress | Terminal state: shows setup progress/retry |

The wizard opens via `Ctrl+N` or the "+" button on the dashboard. Can also be opened with a pre-selected issue (from the assigned issues panel), which skips step 1.

### 3.2 Core Interaction Rules

- **Click always advances**: Clicking any selectable item (issue row, worktree card, color swatch) confirms the current step and advances to the next. On the last step (color), click creates the issue.
- **Keyboard-first**: Every action has a keyboard shortcut. Arrow keys navigate, Enter confirms, Escape/Backspace go back.
- **No preselection on step 1**: Wizard opens with empty search bar, no highlighted issue.
- **Arrow keys work from any focus within the modal** (not just inside step components). Exception: text input focused = arrows control cursor.

---

## 4. Existing Components to Reuse

| Component | Source | Usage |
|-----------|--------|-------|
| `Dialog` (Root/Overlay/Content/Header/Body/Footer) | shadcn-svelte | Modal wrapper with backdrop, focus trap, escape handling |
| `Button` (primary, ghost) | shadcn-svelte | Footer buttons — primary for advance/create, ghost for back/cancel |
| `Kbd` (default, inverted) | shadcn-svelte | Keyboard shortcut badges inside buttons |
| `Input` | shadcn-svelte | Text inputs for search, issue name, hex color |
| `SearchField` | base | Search input with icon slot (step 1) |
| `Separator` | shadcn-svelte | Divider between color grid and hex input row |
| `HelpText` | base | Validation errors and branch name preview |
| `ColorPickerContent` | derived | Shared color grid + hex input (step 4, also used in standalone popover) |
| Lucide icons | `@lucide/svelte/icons/*` | `corner-down-left`, `delete`, `search`, `circle-dot`, `circle-check`, `loader-2`, `tree-pine`, `x`, `arrow-up/down/left/right` |

---

## 5. Components to Design

These elements exist in the implementation but need visual design refinement:

| Component | Current State | Design Needs |
|-----------|--------------|--------------|
| **Step progress indicator** | Dots in header top-right: active = wider pill, completed = `bg-primary/50` circles, inactive = `bg-border-strong` | Done — shipped. Designer may polish sizing/spacing |
| **GitHub search results list** | Scrollable list with state icons, `bg-primary-soft` highlight | Row spacing, hover states, assigned heading typography |
| **Worktree choice cards** | Two `size-24` square buttons with icons | Card internal padding, icon/label spacing, border radius consistency |
| **Color grid layout** | 6x4 grid via `ColorPickerContent`, 28px swatches | Gap uniformity, centering within modal, hex input vertical centering |
| **Worktree progress view** | Centered icon + text + inline button | Loading/success/failure visual treatment |
| **Footer button layout** | Back (left) / Navigate hint (center) / Cancel + Action (right) | Spacing between zones, hint typography, responsive shrinking |
| **Step header** | `text-base font-semibold text-foreground` | Verify weight/size clearly indicates current step without dominating |

---

## 6. Step-by-Step Breakdown

### Step 1: Search GitHub Issues

**Purpose**: Select an existing GitHub issue to link, or skip to create an unlinked issue.

**Content**:
- Search input with magnifying glass icon, auto-focused on step entry
- Below: scrollable list of issues (assigned issues by default, search results when typing)
- Loads up to 20 issues by default. 10 visible without scrolling, remaining accessible via scroll
- Arrow key navigation scrolls the selected issue into view
- Each issue row shows: state icon (green `circle-dot` for OPEN, purple `circle-check` for CLOSED), `#number title`
- "Skip — create without GitHub issue" link at the bottom
- When showing assigned issues: "ASSIGNED" section heading in muted uppercase (`text-xs font-semibold uppercase tracking-wider text-muted-foreground/60`)
- **No preselection on open** — search bar empty, no issue highlighted. Enter with no selection = Skip
- **Arrow nav fills search bar** — when navigating with ArrowUp/Down, the selected issue's title and number appear in the search bar (display only, does NOT trigger a GitHub search). Typing after arrow selection clears the arrow-selected state and resumes normal search
- **Clicking an issue** = select that issue + advance to step 2 (click-to-advance rule)

**States**:
- Default: 20 assigned issues loaded
- Loading: Spinner icon in search input
- Empty results: "No issues found" centered text
- Search results: Filtered list replacing assigned issues
- Issue row: unselected / hover (`bg-surface-hover`) / selected via keyboard (`bg-primary-soft`)
- Skip notice: Brief message when auto-advancing (pre-selected issue flow)

**Keyboard**:
- Arrow Up/Down: navigate issue list. First ArrowDown selects item 0, first ArrowUp selects last item. Works from **any focus within the modal**
- Enter: select highlighted issue and advance (or Skip if no selection)
- Typing: filters the list via debounced GitHub search (300ms)

**Footer**: Cancel [Esc], Next [Enter]. No Back button (first step). Navigation hint: `Navigate [↑] [↓]` — always visible.

**Grilled decision**: Selected/highlighted issue row uses `bg-primary-soft` — subtle sage green (light: `oklch(0.92 0.03 135)`, dark: `oklch(0.305 0.045 145)`). Replaces orange `bg-accent`.

### Step 2: Issue Name

**Purpose**: Confirm or edit the issue name. Shows branch name preview when linked to a GitHub issue.

**Content**:
- Text input with the issue name, auto-focused with cursor at end
- **Issue name excludes issue number** — the number is displayed separately on the issue card and in the branch name. `generateIssueName` produces the first 4 words of the title only (e.g., "Issue card redesign states"). Trailing special characters stripped. Inline special chars kept but not counted toward word limit
- No duplicate label — the dialog header already displays the step name
- Below: branch name preview via `HelpText` in muted style (e.g., `Branch: 163-build-session-history-browsing`)

**States**:
- Empty / filled input
- Focused / not focused
- Error: "Issue name is required" validation message via `HelpText state="error"` below the input. Error clears on typing

**Keyboard**:
- Enter: confirms the name and advances. Works from **any focus within the modal**. If name is empty, shows inline error instead of advancing
- All typing goes to the input (Backspace deletes text, not navigate back)
- Escape: goes back one step (does NOT close the wizard) — because text input captures Backspace

**Footer (dynamic based on text input focus)**:
- Input focused: Back [Esc], Cancel (no hint), Next [Enter]. No navigation hint
- Input not focused: Back [⌫], Cancel [Esc], Next [Enter]. No navigation hint (step 2 has no navigable items)

### Step 3: Create Worktree?

**Purpose**: Choose whether to set up a git worktree for this issue. Skipped entirely if workspace has no local folder.

**Content**:
- Two equal-sized square choice cards (`size-24` = 96px) side by side, centered
- Yes card: `tree-pine` icon (24px) + "Yes" label
- No card: `x` icon (24px) + "No" label
- No duplicate title in body — header already displays "Create Worktree?"
- **Clicking a card selects AND advances** to the next step (click-to-advance rule)
- Yes is pre-selected by default

**States per card**:
- **Unselected**: `border-border`, `bg-transparent`
- **Hover**: `border-border`, `bg-surface-hover`
- **Selected Yes**: `border-status-success` + `bg-[color-mix(in_oklch,var(--status-success)_14%,transparent)]`
- **Selected No**: `border-status-danger` + `bg-[color-mix(in_oklch,var(--status-danger)_14%,transparent)]`

**Keyboard**:
- Left/Right arrows: toggle between Yes and No. Works from **any focus within the modal**
- Enter: confirms the selected choice and advances

**Focus on step entry**: No element is focused — `activeElement` is blurred on mount via `requestAnimationFrame`. Tab cycles through Yes → No → footer buttons.

**Footer**: Back [⌫], Cancel [Esc], Next [Enter]. Navigation hint: `Navigate [←] [→]` visible.

### Step 4: Pick a Color

**Purpose**: Assign a color to the issue from the workspace's 24-color palette.

**Content**:
- **Color grid**: 4 rows x 6 columns = 24 preset colors via `ColorPickerContent`, displayed inline
- Each swatch (28px, `h-7 w-7`) shows the letter "A" with contrast-appropriate text color. Text is not selectable (`user-select: none`, `pointer-events: none`)
- Used colors (assigned to other issues) are dimmed (`opacity-30`, disabled, skipped by arrow navigation)
- Selected swatch has `scale-110` + `ring-2 ring-ring ring-inset`. No additional `focus-visible` outline (prevents double ring)
- Below grid: `Separator`, then hex input row (native color picker swatch label + text input). Vertically centered between divider and footer separator
- Hex input and native picker always visible (not hidden)
- **Clicking a swatch** = select that color + create the issue (last step before progress)

**States**:
- Available swatch: default / hover (`hover:scale-110`)
- Selected swatch: `scale-110` + `ring-2 ring-ring ring-inset`
- Used/dimmed: `opacity-30`, `cursor-not-allowed`, disabled, skipped by navigation

**Keyboard**:
- Arrow keys: navigate the grid (wrapping, skipping disabled). Navigation selects the color — hex input + native picker update immediately. Works from **any focus within the modal**. Exception: arrows control cursor when hex text input is focused
- Enter: confirms the selection and creates the issue. Enter in hex input also creates

**Preselection**: `nextAvailableColor` (first unused color in palette) is pre-selected and focused on step load.

**Footer (dynamic based on hex input focus)**:
- Hex input focused: Back [Esc], Cancel (no hint), Create [Enter]. Navigation hint hidden
- Hex input not focused: Back [⌫], Cancel [Esc], Create [Enter]. Navigation hint: `Navigate [↑] [↓] [←] [→]` visible

### Step 5: Worktree Progress (Terminal State)

**Purpose**: Shows worktree setup progress after issue creation. Not a user-navigable step — only shown when step 4 completes with `createWorktree = true`.

**Content**: Centered vertically within body area.

**States**:
- **Pending**: `Loader2` spinner (32px) + "Setting up worktree..." text in `text-muted-foreground`
- **Success**: `CircleCheck` (32px) in `text-status-success` + success message + "OK" ghost button
- **Failed**: `CircleX` (32px) in `text-status-danger` + failure message + "Retry" ghost button

**Footer**: None — step has its own inline buttons.

---

## 7. States & Interactions

### Modal-Level States

- **Open / Closed**: Controlled by `wizard.open`. Opens via `Ctrl+N`, "+" button, or adopt action on ghost card.
- **Step progression**: Linear, steps 1-5. Can go back to any previous step (except from step 5 progress states).
- **Pre-selected issue flow**: Opens directly at step 2 with form data pre-filled from an `AssignedIssue`.

### Global Keyboard Routing

All keyboard handling is centralized in `CreationWizard.svelte` via `svelte:window onkeydown`. The global handler dispatches to step-specific `confirm()`, `handleArrow()`, and `toggleChoice()` methods via component refs.

| Key | Behavior |
|-----|----------|
| **Escape** | Closes wizard UNLESS text input focused on non-first step → goes back one step |
| **Backspace** | Goes back one step UNLESS text input focused → edits text |
| **Enter** | Per-step: selects issue / confirms name / confirms worktree / creates issue. Must not double-fire across transitions |
| **Arrow keys** | Per-step navigation from any modal focus. Exception: text input → cursor control |
| **Mouse back (button 4)** | Goes back one step |
| **Click on selectable item** | Confirms current step + advances (click-to-advance rule) |

### Footer Button Pattern

All footer buttons: `Label [Kbd badge]` with Kbd badge on the **right** side.

Layout: `[Back ⌫]  ———[Navigate ↑↓]———  [Cancel Esc] [Create ↵]`

- **Back**: ghost variant, left-aligned. Not shown on step 1. Dynamic hint: `[Esc]` when text input focused, `[⌫]` (Lucide `delete` icon) when not.
- **Cancel**: ghost variant, right-aligned. Dynamic hint: always `[Esc]` on step 1. On other steps: `[Esc]` when text input not focused, no hint when Escape is claimed by Back.
- **Next/Create**: primary variant, right-aligned. `[↵]` via Lucide `corner-down-left` inside Kbd with `tone="inverted"`.
- **Navigation hint**: non-clickable centered label. "Navigate" text + separate Kbd arrow icons. Visibility per step:
  - Step 1: `Navigate [↑] [↓]` — always visible
  - Step 2: hidden (no navigable items)
  - Step 3: `Navigate [←] [→]` — always visible
  - Step 4: `Navigate [↑] [↓] [←] [→]` — hidden when hex input focused

**Critical rule**: Every button's label + Kbd hint must match the actual key behavior at all times. Button sizes: all `default` (md) across all steps.

### Step Header + Progress Indicator

- Header title: `text-base font-semibold text-foreground` — clearly indicates current step without dominating
- Progress dots in header top-right: active step = wider pill (`w-4 rounded-sm bg-primary`), completed = `w-1.5 rounded-full bg-primary/50`, inactive = `w-1.5 rounded-full bg-border-strong`
- Progress dots hidden during worktree progress state

---

## 8. Design Constraints (Set in Stone)

These items are final and must not change:

**Flow & Structure**:
- 5-step linear flow: search → name → worktree → color → progress
- Step 3 (worktree) skipped when no local folder configured
- Modal dialog via `Dialog.Root` from shadcn-svelte
- Wizard positioned at `top-[15%] translate-y-0`

**Keyboard & Interaction**:
- Click-to-advance rule across all steps
- Keyboard shortcut routing as documented in §7
- Enter confirms from any focus (global handler routes to step)
- Escape goes back (not close) when text input focused on non-first step
- Arrow keys work from any focus within modal (text input exception)
- Step 3: no element focused on entry (blur via `requestAnimationFrame`)
- Enter must not double-fire across step transitions

**Footer**:
- Footer button pattern: `Label [Kbd]` with badge on right
- All footer buttons use `default` (md) size
- Dynamic Back/Cancel Kbd hints based on text input focus
- Navigation hint visibility per step as specified
- Step 1 Cancel always shows `[Esc]` (no Back button to compete)

**Step 1 (Search)**:
- No preselection on open
- Arrow nav fills search bar (display only, no search trigger)
- 20 issues by default, 10 visible without scrolling
- Arrow navigation scrolls selected item into view
- Issue row highlight: `bg-primary-soft` (sage green)

**Step 2 (Name)**:
- Issue name excludes issue number, trailing special chars stripped
- Empty name validation with inline error

**Step 3 (Worktree)**:
- Equal-sized `size-24` squares, labels "Yes"/"No" only
- Three visual states: unselected (transparent), hover (`bg-surface-hover`), selected Yes (green), selected No (red)
- Clicking selects AND advances

**Step 4 (Color)**:
- 24-color palette, `DEFAULT_COLOR_PALETTE` from `color_utils.ts`
- Grid: 6 columns x 4 rows, gaps must be equal in both axes
- Display text "A" on swatches, not selectable
- Used colors dimmed (`opacity-30`), disabled
- No double ring on selected swatch — `ring-2 ring-ring ring-inset` only
- `ColorPickerContent` is shared with standalone popover — changes affect both
- Hex input row vertically centered between divider and footer separator

**Step 5 (Progress)**:
- No footer buttons (inline buttons only)

---

## 9. Design Freedom (Designer Should Explore)

| Area | Current State | Freedom |
|------|--------------|---------|
| **Color grid swatch sizing** | 28px (`h-7 w-7`) with `gap-1.5` | May adjust size and gap for uniform spacing within modal. Gaps must remain equal in both axes |
| **Overall modal width** | `max-w-lg` (512px) | May increase to `max-w-xl` (576px) only if uniform grid gaps require it — not as first resort |
| **Step transition** | Instant swap | Could add subtle crossfade or slide if it improves perceived flow (not required) |
| **Modal body padding** | `py-4` via `Dialog.Body` | Increase top/bottom if content feels cramped, especially on step 3 |
| **Step header fine-tuning** | `text-base font-semibold text-foreground` | Minor weight/color adjustments — must remain clearly readable, not dominate |
| **Search result row spacing** | `gap-0.5`, `px-2 py-1.5` | May adjust for better touch targets and visual rhythm |
| **Worktree card internal layout** | Icons 24px, `text-xs font-medium` label, `gap-2` | May adjust spacing between icon and label |
| **Progress indicator animation** | Standard `animate-spin` on Loader2 | Could enhance with progress bar or step-specific animation |

---

## 10. Inspiration

**Issue Card v2 Final Decisions** (`designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md`) as the gold standard for thoroughness — this brief follows the same structure: exhaustive state documentation, clear set-in-stone vs freedom boundaries, component extraction architecture, and grilling decision records.

**External interaction pattern references**:
- **Raycast**: Modal wizard flow, keyboard-first navigation, footer button layout (`Label [Kbd]`)
- **Linear**: Issue creation modal, smooth step transitions, inline validation
- **VS Code**: Command palette keyboard hints, focus management
- **cmdk**: Keyboard shortcut conventions (Enter = confirm, Escape = cancel/back, arrows = navigate)

**Design consistency with Grovekeeper**:
- Forest Moss palette: primary greens for selected/active states, muted tones for secondary UI
- Typography: Geist (UI text), Geist Mono (branch names, hex codes, technical values)
- Control sizing: sm=26px, md=32px, lg=38px (4px base grid)
- No backdrop blur (opacity-only overlays per DECISIONS.md)
- Semantic color tokens from `designs/DESIGN_SYSTEM.md` and `claude_design/tokens.css`

---

## 11. Layout Constraints

**Modal dimensions**:
- Default: `max-w-lg` (512px), positioned at `top-[15%]`
- Centered in viewport with backdrop overlay (opacity only)
- Min window consideration: ~800x600px (desktop Tauri app)

**Color grid (Step 4)**:
- Fixed: 6 columns x 4 rows = 24 swatches
- Swatches: 28px (`h-7 w-7`), may adjust for uniform spacing
- Grid horizontally centered via `mx-auto w-fit grid-cols-6 gap-1.5`

**Issue list (Step 1)**:
- `max-h-90` overflow-y-auto on list container
- 10 visible without scrolling, remaining via scroll
- Arrow navigation scrolls selected item into view (`scrollIntoView({ block: 'nearest' })`)

**Worktree cards (Step 3)**:
- `size-24` (96px x 96px), `gap-4` between cards, centered via flex

**Spacing**:
- Modal body: `py-4`, `gap-3` (Dialog.Body)
- Footer: flex with `gap` between button groups
- Base grid: 4px spacing scale

**Responsive**: Desktop-only (Tauri native window). No mobile/tablet breakpoints.

---

## 12. Implementation Architecture

### Source Files

| File | Role |
|------|------|
| `src/lib/components/blocks/creation-wizard/CreationWizard.svelte` | Orchestrator: Dialog, footer, keyboard routing, step rendering |
| `src/lib/components/blocks/creation-wizard/StepGithubSearch.svelte` | Step 1: search input, issue list, selection |
| `src/lib/components/blocks/creation-wizard/StepIssueName.svelte` | Step 2: name input, validation, branch preview |
| `src/lib/components/blocks/creation-wizard/StepWorktreeChoice.svelte` | Step 3: yes/no cards |
| `src/lib/components/blocks/creation-wizard/StepColorSelection.svelte` | Step 4: color grid wrapper, delegates to ColorPickerContent |
| `src/lib/components/blocks/creation-wizard/StepWorktreeProgress.svelte` | Step 5: progress/retry/close |
| `src/lib/components/derived/color-picker/ColorPickerContent.svelte` | Shared color grid + hex input (used by step 4 AND standalone popover) |
| `src/lib/modules/creation-wizard/creation_wizard.context.svelte.ts` | State management: steps, form data, search, dependencies |
| `src/lib/modules/creation-wizard/types.ts` | Types: `WizardStep`, `WizardFormData`, `WizardDependencies` |
| `src/lib/modules/creation-wizard/smart_naming.ts` | `generateIssueName()`, `generateBranchName()` |

### State Management

The wizard uses Svelte 5 context (`createContext`) with a factory pattern. The `CreationWizardContext` manages:
- `open` state and step progression
- `formData` accumulation across steps
- `dependencies` from workspace (palette, used colors, GitHub repo, local folder)
- GitHub search with debounce (300ms) and abort controller
- Step sequencing (worktree step skipped when no local folder)

### Existing Mockup

`claude_design/Creation Wizard.html` — self-contained HTML mockup with tokens.css inlined.

---

## 13. Grilled Decisions Record

### 2026-05-04 — Session 6b7b1e3c

- **Issue list highlight color**: `bg-primary-soft` — soft sage green (light: `oklch(0.92 0.03 135)`, dark: `oklch(0.305 0.045 145)`). Replaces orange `bg-accent`
- **Button sizes in footer**: All footer buttons (Back, Cancel, Next/Create) use `default` (md) size
- **Worktree choice cards**: Three states — unselected (`border-border`, transparent), hover (`bg-surface-hover`), selected Yes (green fill), selected No (red fill)
- **Color grid priority**: Fix gap uniformity first. Tighten swatch gaps rather than widening modal. Only adjust modal width if uniform gaps still don't fit within `max-w-lg`

### 2026-05-05 — Session 6b7b1e3c continued

- **Click-to-advance**: Clicking any selectable item confirms + advances across all steps. Mouse click = confirm + next. On last step = create issue
- **No preselection on step 1**: Empty search bar, no highlighted issue. Enter with no selection = Skip
- **Arrow nav fills search bar**: Display only, does NOT trigger search. Typing clears arrow-selected state
- **Arrow nav from any focus**: Modal-wide, not just step component. Text input exception
- **Dynamic footer buttons**: Back shows Esc when text input focused, Backspace when not. Cancel shows Esc only when not claimed by Back
- **Navigation hint**: Per-step: ↑↓ step 1 (always), hidden step 2, ←→ step 3, ↑↓←→ step 4 (hidden when hex input focused)
- **Issue name excludes number**: Title words only, trailing special chars stripped
- **Swatch text not selectable**: `user-select: none`, `pointer-events: none`
- **No double ring**: Remove `focus-visible:outline` from swatches — selected `ring-2` is sufficient
- **Color picker vertical centering**: Hex input row centered between divider and footer separator
- **Modal content padding**: Larger top/bottom padding on body
- **Enter in hex input**: Creates the issue
- **Step 1 Cancel always shows Esc**: No Back button to compete

---

## 14. Known Bugs (Historical — All Fixed)

1. ~~Color grid shows fewer than 24 colors~~ — all 24 render in 6x4 grid
2. ~~Worktree step has no default selection~~ — Yes pre-selected
3. ~~Missing Confirm buttons on steps 1-3~~ — all footer buttons present
4. ~~Keyboard nav in color grid doesn't update hex input~~ — updates in real-time
5. ~~Backspace in text inputs propagates to wizard navigation~~ — stopped
6. ~~Escape in step 2 closes wizard instead of going back~~ — goes back correctly, Dialog's `onEscapeKeydown` suppressed
7. ~~Step header not vertically centered and too small~~ — `text-base font-semibold`
8. ~~Enter on step 2 skips step 3~~ — double-fire prevented (#181)
9. ~~Issue name includes issue number~~ — excluded (#181)
10. ~~Color swatches show double ring~~ — single ring only (#181)

---

## 15. Not Included in This Design

- Standalone `ColorPicker` popover (shares `ColorPickerContent` but has its own trigger/popover wrapper)
- Issue detail/edit modal
- Dashboard layout
- Keyboard shortcut settings panel
- Storybook stories (already exist: `CreationWizard.stories.svelte`)
- Command palette integration (separate component, shares action registry)
