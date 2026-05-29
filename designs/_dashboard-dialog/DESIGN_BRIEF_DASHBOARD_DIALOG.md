# Dashboard Create/Edit Dialog — Design Brief

> **Status**: Refined (Variant A)
> **Refined mockup**: `designs/dashboard-dialog/refined.html`
> **Summary**: `designs/dashboard-dialog/SUMMARY.md`
> **Refinements**: compact centered color grid

Redesign the Create Dashboard and Edit Dashboard dialogs with improved field ordering, removed portfolio type, branch suggestions via GitHub API, auto-defaulting worktree paths, and consistent combobox styling. The dialog is the primary entry point for workspace creation — it must be frictionless, with smart defaults that reduce manual input.

**Source**: Issue #394, PRD #257 (Overview & Workspace Card Polish)
**Gold standard reference**: `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md`

---

## 1. Purpose

The Create/Edit Dashboard dialog is how developers set up workspaces in Grovekeeper. Each workspace maps 1:1 with a GitHub repository and a local folder. The dialog collects: name, GitHub repo, default base branch, local folder path, worktree parent folder, and accent color. Currently the dialog has unnecessary portfolio mode, poor field ordering (color before repo), no branch suggestions, and inconsistent combobox styling.

**Key value**: Reduce workspace creation from 6 manual inputs to 2-3 (name + repo selection, everything else auto-populates).

---

## 2. Surrounding Context

### Full Viewport Structure

**This is a modal dialog** — it floats centered above the Overview page (or any page that triggers dashboard creation/editing).

**Backdrop**: `DialogOverlay` — opacity overlay, no blur (per DECISIONS.md: "No backdrop blur on overlays").

**Dialog container**: `Dialog.Content` — centered, `max-w-md` (448px), `rounded-xl`, `border border-border`, `bg-surface`, `shadow-lg`. Contains Header, Body (scrollable), Footer.

**Trigger sources**:
- Overview page "+" button → Create dialog
- Workspace card right-click → Edit dialog
- Workspace card gear icon → Edit dialog
- Sidebar workspace selector → Edit dialog

**Mockup rendering instructions**:
- Show the dialog floating over a dimmed Overview page background
- Dialog is the focus — background shows workspace cards at reduced opacity
- Dialog width is ~448px, height determined by content (no fixed height)
- Show dark theme (primary mode)

---

## 3. Requirements

### 3.1 Portfolio Removal

- Remove the Repo/Portfolio `ToggleGroup` at the top of the dialog
- All fields are always visible (no conditional rendering based on type)
- Dashboard type is always `'repo'` — no user choice needed

### 3.2 Field Order

Fields appear in this order, top to bottom:

1. **Name** — text input, required (`*` indicator)
2. **GitHub Repo** — combobox with search and auto-suggestions
3. **Default Base Branch** — combobox with branch suggestions from GitHub API
4. **Local Folder** — path input with folder browser button
5. **Worktree Parent Folder** — path input with folder browser button
6. **Accent Color** — color palette grid + hex input (at bottom, with "Accent Color" label)

Each field has a `Label` above it. Fields are separated by the dialog's `gap-4` (16px) spacing.

### 3.3 GitHub Repo Combobox (RepoCombobox)

**Behavior changes**:
- Dropdown opens on input **click** AND **focus** (currently only opens via chevron trigger icon)
- On open: fetches user's repos via `list_user_repos` Tauri command
- Typing filters locally first, then searches remotely after 400ms debounce (2+ chars)
- Recent repos highlighted with a "Recent" badge

**Styling alignment** (match Select component pattern):
- Container: `bg-surface`, `rounded-lg`, `border border-border`, `p-1.5`, `shadow-lg`
- Items: `rounded-sm`, `px-2 py-1.5`, `text-(length:--text-md)`, `text-foreground`
- Highlight: `data-highlighted:bg-surface-2`
- Selected: `data-[selected=]:bg-primary-soft` with check icon
- Currently broken: `bg-surface-3`, no padding, `px-3`, no rounded corners

### 3.4 Base Branch Combobox (New Component)

**Behavior**:
- Disabled state when no GitHub repo is selected — shows placeholder "Select a repo first"
- After repo selection: fetches branches via `list_repo_branches` Tauri command (GitHub REST API, sorted by last commit date)
- User can type a custom branch name OR select from suggestions
- Branches show as simple text items (branch name only)
- Changing the selected repo clears the branch field and re-fetches suggestions
- Default branch (usually `main` or `master`) should be visually distinguishable (e.g., "Default" badge like the "Recent" badge on repos)

**Styling**: Same as RepoCombobox (aligned to Select component pattern). Simpler items — no icons, no descriptions, just branch names.

### 3.5 Local Folder (PathInput)

**Existing component** — no changes to PathInput itself.

**New behavior**: When a local folder is selected (via browse or manual input), auto-set Worktree Parent Folder to `{localFolder}-worktrees` — UNLESS the user has already manually edited the worktree field.

### 3.6 Worktree Parent Folder (PathInput)

**Existing component** — no changes to PathInput itself.

**New behavior**:
- Auto-populated from local folder selection: `{path}-worktrees`
- Once user manually edits this field, auto-updating stops (`worktreeManuallyEdited` flag)
- Visual hint showing it was auto-derived (e.g., muted text or subtle indicator) — designer's choice

### 3.7 Color Picker Section

**Layout changes**:
- Moved to bottom of dialog (last field before footer)
- Label: "Accent Color" (using existing `Label` component)
- Remove `<Separator>` between palette grid and selected color row
- Palette grid (6x2, 12 workspace accent colors) flows directly into the selected color row (swatch + hex input)
- The gap between grid and color row should be `gap-2` (8px) — natural section flow without a hard line

### 3.8 Dialog Structure

- **Header**: "Create Dashboard" title (create) / "Edit Dashboard" title (edit)
- **Body**: All fields in order, `flex flex-col gap-4`
- **Footer**: Cancel (ghost) + Create/Save (primary) buttons. Right-aligned. Background: `bg-surface-2` with top border.

### 3.9 Edit Dialog Parity

The Edit dialog (`DashboardEditDialog.svelte`) receives all the same changes:
- Same field order
- Same combobox improvements
- Same auto-default behavior
- Pre-populated with existing dashboard values
- "Save" button instead of "Create"

---

## 4. States

### Dialog Level

| State   | Visual Treatment                                       | Trigger                 |
| ------- | ------------------------------------------------------ | ----------------------- |
| Default | All fields empty (create) or pre-filled (edit)         | Dialog opens            |
| Filled  | Fields populated, Create/Save button enabled           | User fills required     |
| Loading | Spinner on Create/Save button, fields disabled         | Form submission         |
| Error   | Red border on invalid field, error message below field | Validation failure      |

### GitHub Repo Combobox

| State       | Visual Treatment                                      | Trigger                   |
| ----------- | ----------------------------------------------------- | ------------------------- |
| Empty       | Placeholder "owner/repo"                              | Initial                   |
| Focused     | Ring focus style, dropdown opens, shows user repos     | Click/Tab into input      |
| Typing      | Filters locally, "Loading..." if remote search fires   | User types                |
| Highlighted | `bg-surface-2` on hovered/arrow-navigated item         | Mouse hover or arrow keys |
| Selected    | `bg-primary-soft` with check icon, input shows value   | Click or Enter on item    |
| No results  | "No repos found" message in dropdown                   | Search returns empty      |

### Base Branch Combobox

| State         | Visual Treatment                                           | Trigger                    |
| ------------- | ---------------------------------------------------------- | -------------------------- |
| Disabled      | Muted text "Select a repo first", `opacity-0.7`, no focus | No repo selected           |
| Empty         | Placeholder "main"                                         | Repo selected, no branch   |
| Loading       | Shimmer animation on input                                 | Fetching branches from API |
| Populated     | Dropdown shows branch list sorted by last commit           | Branches fetched           |
| Highlighted   | `bg-surface-2` on hovered item                             | Mouse hover or arrow keys  |
| Selected      | Input shows branch name                                    | Click or Enter on item     |
| Custom typed  | User types freely, dropdown still shows suggestions        | User types custom name     |
| Error         | Red border, "Failed to load branches" message              | API call fails             |

### Color Picker

| State    | Visual Treatment                                           | Trigger              |
| -------- | ---------------------------------------------------------- | -------------------- |
| Default  | First palette color selected (moss), ring indicator        | Initial              |
| Hovered  | Swatch scales up (`hover:scale-110`)                       | Mouse hover on swatch|
| Selected | `scale-110 ring-2 ring-ring ring-inset`                    | Click on swatch      |
| Custom   | Native color picker opens from swatch label click          | Click color preview  |
| Hex edit | Hex input validates on change, updates preview live        | Type in hex input    |

### Worktree Parent Folder

| State         | Visual Treatment                                      | Trigger                      |
| ------------- | ----------------------------------------------------- | ---------------------------- |
| Empty         | Placeholder text                                      | Initial                      |
| Auto-filled   | Shows `{localFolder}-worktrees`, normal input styling | Local folder selected        |
| Manually set  | Normal input styling, auto-update stops               | User types or browses        |
| Disabled      | `opacity-0.7`, not focusable                          | N/A (always enabled)         |

---

## 5. Component Reuse Map

### Existing Components (MUST use)

| Component          | Variant/Props                          | Usage in This Design                          |
| ------------------ | -------------------------------------- | --------------------------------------------- |
| Dialog.Root        | default                                | Dialog container                              |
| Dialog.Content     | `class="max-w-md"`                     | Dialog frame (448px max)                      |
| Dialog.Header      | default                                | Title area                                    |
| Dialog.Title       | default                                | "Create Dashboard" / "Edit Dashboard"         |
| Dialog.Body        | `class="flex flex-col gap-4"`          | Scrollable field area                         |
| Dialog.Footer      | default                                | Cancel + Submit buttons                       |
| Button             | `intent="ghost"` for Cancel            | Cancel action                                 |
| Button             | default (primary) for Create/Save      | Submit action                                 |
| Input              | `required` for Name                    | Name text field                               |
| Label              | default                                | Field labels ("Name *", "GitHub Repo", etc.)  |
| RepoCombobox       | with auto-open + styling fixes         | GitHub repo selection                         |
| PathInput          | default                                | Local Folder and Worktree Parent Folder       |
| ColorPickerContent | `colors={WORKSPACE_ACCENT_PALETTE}`    | Accent color selection (no separator)         |

### Components to Design (new)

| Component         | Description                                       | Why New                                                    |
| ----------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| BranchCombobox    | Combobox for branch selection with disabled state  | No existing branch picker. Simpler than RepoCombobox — no remote search, no icons. Same styling pattern. Could be a generic combobox or a specialized component. |

---

## 6. Layout Constraints

- Dialog max-width: `max-w-md` (448px), centered horizontally and vertically
- Dialog body: `flex flex-col gap-4` (16px between fields)
- Each field wrapper: `flex flex-col gap-1.5` (6px between label and input)
- Color palette grid: `grid-cols-6 gap-1.5` (6 columns, 6px gap)
- Color swatches: `h-7 w-7` (28px square)
- Selected color row: `flex items-center gap-2` (8px gap between swatch and hex input)
- Input heights: 32px (`--size-control-md`)
- PathInput: `flex gap-1.5` (input + browse button)
- Footer: `flex justify-end gap-2` (8px between buttons)
- Dialog should not exceed viewport height — body scrolls if content overflows
- Minimum touch target: 32px for all interactive elements

---

## 7. Design Tokens

- **Font**: Geist (sans) for all UI text
- **Labels**: `text-sm` (12px), `text-foreground-muted`, `font-medium`
- **Inputs**: `bg-surface`, `border border-border`, `rounded-md`, 32px height, 13px font
- **Input focus**: `border-color: var(--ring)`, `box-shadow: 0 0 0 3px color-mix(in oklch, var(--ring) 22%, transparent)`
- **Disabled input**: `bg-surface-2`, `text-foreground-subtle`, `opacity-0.7`
- **Dialog surface**: `bg-surface`, `border border-border`, `rounded-xl`
- **Footer surface**: `bg-surface-2`, `border-t border-border`
- **Combobox dropdown**: `bg-surface`, `rounded-lg`, `border border-border`, `p-1.5`, `shadow-lg`
- **Combobox items**: `rounded-sm`, `px-2 py-1.5`, `data-highlighted:bg-surface-2`
- **Selected item**: `data-[selected=]:bg-primary-soft` with CheckIcon
- **Color swatches**: 28px square, `rounded-sm`, `border border-border`
- **Selected swatch**: `scale-110 ring-2 ring-ring ring-inset`
- **Placeholder text**: `text-foreground-subtle`
- **Spacing between sections**: 16px (gap-4)
- **Spacing label → input**: 6px (gap-1.5)

---

## 8. Design Constraints (Non-Negotiable)

- Dialog uses existing `Dialog.*` component composition — no custom modal
- `max-w-md` width constraint — dialog must not be wider
- No backdrop blur (per DECISIONS.md)
- Color palette uses `WORKSPACE_ACCENT_PALETTE` (12 presets) — no changes to the palette itself
- RepoCombobox and BranchCombobox must both use Select component styling pattern (see section 3.3)
- Field order is fixed: Name → GitHub Repo → Base Branch → Local Folder → Worktree → Color
- Footer has Cancel (ghost) + primary action button — no additional buttons
- All changes apply to both Create and Edit variants
- Keyboard navigation must work: Tab between fields, arrow keys in combobox dropdowns, Enter to submit
- Color picker swatch grid must remain 6-column layout
- No separator between color palette grid and selected color row

---

## 9. Design Freedom

- **Disabled branch combobox visual**: Could be grayed out, could show an info icon, could use a tooltip explaining why it's disabled
- **Auto-derived worktree indicator**: Subtle visual cue that worktree path was auto-generated (e.g., small link icon, muted text, italic style — or no indicator at all)
- **Branch list item detail**: Could show last commit date, could show "default" badge for main branch, could be plain text only
- **Transition animations**: How the branch combobox enables/disables when repo changes
- **Loading states**: Skeleton vs. spinner vs. shimmer for branch fetching
- **Error presentation**: Inline message vs. toast for API failures
- **Color section visual separation**: Whether to add a subtle visual break (extra spacing, eyebrow label, or nothing) between the filesystem fields and the color section at the bottom
- **Combobox empty state**: Visual treatment for "No repos found" / "No branches found"

---

## 10. Visual References

- **Internal — Select component**: `src/lib/components/shadcn/select/select-custom-content.svelte` and `select-custom-item.svelte` — target styling for all combobox dropdowns
- **Internal — Dialog structure**: `src/lib/components/shadcn/dialog/dialog-content.svelte` — container styling
- **Internal — ColorPickerContent**: `src/lib/components/derived/color-picker/ColorPickerContent.svelte` — palette grid + hex input (remove separator)
- **Internal — PathInput**: `src/lib/components/derived/path-input/PathInput.svelte` — input + browse button pattern
- **Internal — RepoCombobox**: `src/lib/components/derived/repo-combobox/RepoCombobox.svelte` — current implementation (fix styling)
- **Internal — Creation Wizard**: `designs/issue-creation-wizard/` — reference for multi-field dialog patterns in Grovekeeper
- **Internal — Overview page**: `designs/overview-page/` — context for where the dialog appears

---

## 11. Not Included (Scope Exclusions)

- Redesigning the color picker component itself — only removing the separator and relocating
- Changing the 12-preset workspace accent palette
- Adding local git branch listing as fallback to GitHub API
- Portfolio dashboard type in any form
- Dialog animation/transition changes
- Responsive/mobile layout (desktop-only for now)
- Validation rules beyond required name field
- Storybook stories for the dialog (existing stories may need updates but are not in scope of the design)
