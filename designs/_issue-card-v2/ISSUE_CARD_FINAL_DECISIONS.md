# Issue Card v2 — Final Decisions

Implementation-ready specification for the Grovekeeper issue card redesign. Consolidates all decisions from: design brief grilling (2026-05-15), four rounds of variant review feedback, final grilling session (2026-05-15), existing implementation analysis, state mapping, and contextual action logic.

**Supersedes**: `ISSUE_CARD_REQUIREMENTS.md` and `DESIGN_BRIEF_ISSUE_CARD_V2.md` for any conflicts. Raw feedback preserved in `V2_REFINEMENT_RAW_PROMPT.md`, `V2_ROUND2_RAW_PROMPT.md`, `V2_ROUND3_RAW_PROMPT.md`, `V2_ROUND4_RAW_PROMPT.md`.

---

## 1. Card Types

### 1.1 Adopted Issue Card (Full Card)

Primary card. Represents a GitHub issue imported into Grovekeeper with full tracking, worktree, and session capabilities.

### 1.2 Ghost Card (Non-Adopted)

Represents a GitHub issue assigned to the user but not yet imported. Appears in the **Assigned Issues accordion** below the adopted grid.

- Neutral gray by default
- **Dashed border** (2px dash, 4px gap) — stays on hover but becomes brighter
- Same card structure as adopted, but most fields naturally empty
- No quick-action buttons (folder/terminal/editor/mute)
- No tree/character preview (empty placeholder)
- No issue state chip
- Adopt split-button replaces contextual action buttons

---

## 2. Header Zone

### 2.1 Header Background

Issue color as a **gradient** (not flat fill). Exact gradient treatment is variant-dependent (§13). WCAG-contrast text via `getContrastTextColor()`.

Dark mode: desaturate ~20-30% compared to light mode.

### 2.2 Header Left Content

- **PRD parent number** (if sub-issue): `#87 /` — just `#` + number, NO "PRD" prefix. Monospace, **clickable link** to PRD GitHub issue. Text color matches title text, slightly dimmed.
- **PRD group hover**: Hovering over the **PRD number itself** (not the whole card) highlights **ALL cards sharing that PRD with a ring**, including the hovered card. Ring has ~25% larger offset/size than normal state rings so it remains visible on active/selected cards.
- **Issue number**: `#142` — monospace, clickable, linked to GitHub issue URL. **When header background is dark/non-colorized, issue number text carries the issue's assigned color** for at-a-glance identification.
- **Issue title**: truncated with ellipsis, clickable to open Issue Detail.

### 2.3 Header Right Content

**Issue state chip** (when any reportable state is active):
- **Rectangular shape** — NOT rounded pill.
- **Monospace font** with dot indicator: `● EXECUTING`, `● CONFLICT`, etc.
- Each state has a **defined color** (does NOT follow header color).
- Full state cascade in §6.

**Priority badge** (if non-medium and priorities enabled):
- **Full text** label: `LOWEST`, `LOW`, `HIGH`, `TOP`.
- **Rectangular shape** consistent with issue state chip style.
- Clickable, spawns priority change menu.
- **Default position**: Header Right (next to state chip and quick-action buttons).
- **Alternative positions** available via user settings (§11): Preview Bottom half-split, Preview Top half-split, Preview Bottom/Top inside, Preview corners (TL, TR, BL, BR). All positions inside preview have small padding from borders. Correct z-index to render above preview content.
- Same positioning applies to both adopted and ghost cards.

**Quick-action buttons**: Open Folder, Open Terminal, Open Editor, Mute toggle.
- Icon-only, standard component button sizes (`gk-btn-icon` / `gk-btn-sm`).
- **Ghost style** — NO visible background in default state. Fully transparent. Background appears **only on hover**.
- Always visible (not hover-revealed) — critical for touch/mobile.
- When no worktree: ghost appearance (reduced opacity), click opens file picker.

### 2.4 Removed from Header

- ~~Child count / sub-issues chip~~ — REMOVED. Issue cards never represent PRDs.

---

## 3. Body (Two-Column Grid)

`grid-template-columns: ~100px 1fr`

### 3.1 Preview Area (Left Column)

- **Square** shape — character packs are square-ish.
- Minimum 100px.
- **Background**: matches header color / issue color gradient.
- Shows one of: **tree thumbnail** (stage-based morphology, hue-tinted canopy), **character portrait**, or **empty placeholder**.

### 3.2 Info Rows (Right Column)

**Row 1 — Worktree + Branch** (primary at-a-glance info):
- Format: tree-icon `worktree-folder/` + git-branch-icon `branch-slug` (monospace).
- **Worktree name**: folder name only — strip parent path. `grovekeeper-worktrees/gradient-tokens/` → `gradient-tokens/`.
- **Branch name**: strip conventional prefix (`feat/`, `fix/`, `refactor/`, `chore/`).
- **Single line only** — truncate with ellipsis, never wrap.
- **Badges right-aligned, pinned**: sync badge, merge conflict badge, worktree error badge.
- When no worktree: muted "no worktree" placeholder.

**Row 2 — GitHub badges**: Issue state badge (left) + PR state badge (middle) + CI status badge (right, when PR exists). Order follows lifecycle: issue → PR → CI. Maintain `min-h` for consistent spacing.
- **CI status badge**: Green circle-check when passed, red circle-X when failed, spinner when running. Positioned right of PR badge (tied to the PR). Uses badge style system (A/B/C). Refreshes via GitHub sync.

**Row 3 — GitHub labels**: First N as colored pills + overflow count (`+2`) with tooltip. Labels **match their GitHub color**. Uncolored labels render grayish. When pills overlap with action buttons, reduce label count.

**Row 4 — Command Results** (check commands, test results, dev server status):
- Shows results from workspace check/test/server commands (PRD #255).
- Each result rendered as a **CommandResultBadge** — an animated collapsing pill:
  - **Running**: pill with spinner icon + command name (e.g., `⟳ check:all`, `⟳ test`)
  - **Passed**: pill animates down to a green circle-check icon (●✓)
  - **Failed**: pill animates down to a red circle-X icon (●✗)
- **Dev server**: **ServerPortBadge** — green dot + port number. Badge style B (borderless dark) as default. Click opens `localhost:{port}`. Uses the 3-style system (A/B/C).
- **Staleness**: Results invalidate when `hasLocalChanges` becomes true after a commit, or when `commits_ahead` changes. Stale results gray out, then disappear after next push or re-run. CI results refresh via GitHub sync.
- Max visible results: up to 3 badges + overflow count. Same pattern as GitHub labels.
- Maintain `min-h` for consistent spacing even when no commands are configured.

---

## 4. Action Buttons (Bottom-Right)

Absolutely positioned bottom-right of card body. Max 2 visible + overflow.

### 4.1 Button Hierarchy

1. **Primary action**: filled background. Uses the **issue's color** as background with WCAG-contrast text via `getContrastTextColor()`. This is the default; moss green is available as a user setting alternative (§11). **Fallback**: Done cards and ghost cards (no issue color) use **neutral/gray** primary button.
2. **Secondary action**: **outlined** style (border visible, transparent background).
3. **Overflow ⋯ button**: **outlined** style — same visual treatment as secondary.

### 4.2 Contextual Action Priority

14 priority levels from `derive_contextual_actions.ts`:

| # | Condition | Primary | Secondary |
|---|-----------|---------|-----------|
| 1 | Session running | ViewSession | (all else disabled) |
| 2 | Worktree failed | RetryWorktree | RemoveWorktree |
| 3 | Merge conflict | SyncBase | Run |
| 4 | Local changes, no PR | CommitPushAndPr | CommitAndPush |
| 5 | Local changes, PR exists | CommitAndPush | Commit |
| 6 | Ahead of remote, no PR | CreatePr | Push |
| 7 | Ahead of remote, PR exists | Push | Review |
| 8 | PR changes-requested | Run | Review |
| 9 | PR approved | Merge | Review |
| 10 | PR open/draft | Review | CheckAndFix |
| 11 | Behind base | SyncBase | Run |
| 12 | HITL label | Hitl | Run |
| 13 | No worktree | Run | SetupWorktree |
| 14 | Default | Run | Review |

---

## 5. Interactive States

### 5.1 Hover State (All Cards)

**Combination of glow + vertical jump (card lift)**:
- Issue-color border glow or intensified border.
- Card lifts ~2-3px via `translateY` or shadow offset.
- Background brightens slightly.
- Works across **ALL other states** — hover is **always additive**.
- **Done + hover**: gains outline/border and subtle background, then fades back.
- **Ghost + hover**: dashed border becomes brighter, background gains subtle gradient stronger on left/top.

### 5.2 Core States

| State | Visual | Trigger |
|-------|--------|---------|
| **Default** | Clean border, subtle shadow | Resting |
| **Hover** | Glow + lift + bg brighten (additive) | Mouse enter |
| **Active** | **Issue-color** glow + body tint. Uses the card's own color — NOT generic green. Amplifies the card's color identity. `box-shadow` glow in the issue color, subtle body tint in the issue color | Single click (shows detail) |
| **Selected (batch)** | Blue `#4a9eff` (dark) / `#3b82f6` (light) border glow + **blue body overlay** (~5% blue tint wash on card body). NO checkbox | Ctrl+click, Shift+click |
| **Selection-ready** | Blue border at ~30% opacity, pointer cursor. Previews selection without committing | Ctrl/Shift held |
| **Done** | **Transparent bg, NO borders, NO card surface**. Content remains **fully readable** (NOT dimmed). Color identity (issue color gradient) removed entirely. Action buttons preserved with normal styling. `● DONE` chip shown. On hover: gains border + generic (non-issue-color) background, then fades back. Full batch selection support | Issue closed + PR merged |
| **Ghost** | Neutral gray, dashed border, muted | Non-adopted assigned issue |
| **Worktree Setup** | Muted/borderless card — similar to Done but for "not yet born." No gradient, no color identity. Card "materializes" (border, gradient, color appear) once worktree is active. `● WORKTREE SETUP` chip + spinner in worktree badge | `worktreeState = pending` |
| **Worktree Removing** | Card fades toward muted/borderless state. `● REMOVING WORKTREE` chip. Brief transition, then settles into no-worktree look | `worktreeState = removing` |

**Active and Selected**: use **subtle glows** (`box-shadow`, inset shadows, or thin 1px color-shifted borders with glow) rather than thick 3px solid borders. Active = issue color (reinforces identity), Selected = blue (group membership).

### 5.3 Session-Driven Overlays

| Session State | Overlay Treatment |
|---------------|-------------------|
| **Executing** | **NO card overlay at all**. Strictly chip-only across ALL variants — no header brightening, no glow changes, no variant-specific exceptions |
| **Error** | Red tint on card surface, red-shifted glow. **Pulsing animation**. **Orange/red border color** |
| **Needs Input** | Amber pulse animation. **Pulsing animation**. **Orange/red border color** |

Only Error and Needs Input get pulsing/flashing — these are critical attention states. Default overlay glow intensity: **150%**.

### 5.4 Other States

- **Disabled**: `opacity-42 pointer-events-none`. Used when a card can't be interacted with (e.g., during a batch operation).
- **Archived**: No distinct visual. Archiving is a filter category only — archived cards look the same as active ones. They simply don't appear unless the "Show Archived" filter is on.

### 5.5 Removed States

- ~~**Dragging**~~: **REMOVED**. The card grid is `auto-fill` responsive — there's no meaningful position to drag to. Sort order is controlled by sort controls. Kanban drag-and-drop (PRD #168) belongs to its own component, not the card grid. Remove `dragging` from `CARD_STATE_CLASSES`.
- ~~**Loading (generic)**~~: **REMOVED**. Replaced by specific sub-states: Worktree Setup (§5.2), Worktree Removing (§5.2), Running Checks/Tests (Row 4, §3.2), CI Running (§6). Each has its own visual treatment.

---

## 6. Issue State Chip — Full Cascade

The header chip represents the **most important state across all dimensions**, not just the session. Priority-ordered cascade — first match wins. This mirrors the tree stage cascade from `state_mapping.ts`.

### 6.1 State Cascade (Priority Order)

**Single chip only** — highest priority state wins. No secondary chips. PR/sync states that don't show as chips are already visible via GitHubBadge and SyncBadge in Row 2.

| # | Chip Label | Source Dimension | Dot + Text Color | Trigger Condition |
|---|-----------|-----------------|-----------------|-------------------|
| 1 | `● ERROR` | session | Red | `aggregateSessionState = errored` |
| 2 | `● NEEDS INPUT` | session | Amber/Orange | `aggregateSessionState = needs-input` |
| 3 | `● MERGE CONFLICT` | sync | Red | `syncStatus = merge-conflict` |
| 4 | `● SETUP FAILED` | worktree | Red | `worktreeState = failed` |
| 5 | `● ANALYZING` | execution phase | Green | `session = running` AND `executionPhase = analyzing` |
| 6 | `● BUILDING` | execution phase | Green | `session = running` AND `executionPhase = tdd` |
| 7 | `● REVIEWING` | execution phase | Blue/Cyan | `session = running` AND `executionPhase = reviewing` |
| 8 | `● VERIFYING` | execution phase | Green | `session = running` AND `executionPhase = verifying` |
| 9 | `● SHIPPING` | execution phase | Green | `session = running` AND `executionPhase = committing` |
| 10 | `● EXECUTING` | session | Green | `aggregateSessionState = running` AND `executionPhase = none` |
| 11 | `● REVIEW` | session | Blue/Cyan | `aggregateSessionState = needs-review` |
| 12 | `● PAUSED` | session | Gray/Muted | `aggregateSessionState = paused` |
| 13 | `● RUNNING CHECKS` | commands | Blue/Cyan | `activeCheckCommands.length > 0` |
| 14 | `● RUNNING TESTS` | commands | Blue/Cyan | `activeTestCommands.length > 0` |
| 15 | `● BEHIND BASE` | sync | Amber | `syncStatus = behind-base` |
| 16 | `● CHANGES REQ` | PR | Amber | `prState = changes-requested` |
| 17 | `● CI RUNNING` | PR/CI | Blue/Cyan | `prCiStatus = running` |
| 18 | `● APPROVED` | PR | Green | `prState = approved` |
| 19 | `● READY TO MERGE` | PR | Green | `prState = ready-to-merge` |
| 20 | `● WORKTREE SETUP` | worktree | Amber | `worktreeState = pending` |
| 21 | `● REMOVING WORKTREE` | worktree | Amber | `worktreeState = removing` |
| 22 | `● DONE` | derived | Muted Green/Gray | `githubIssueState = closed` AND `prState = merged` |

**Not shown as chips** (handled by other visual indicators):
- `session = finished` — no chip. Finished is the normal end state; nothing requires attention.
- `branchStatus = deleted/remote-gone` — visible via tree stage (dead/stump) and worktree badges.
- CI passed/failed — shown in Row 4 (CommandResultsRow) and as CI badge next to PR badge in Row 2, not as a chip.

### 6.2 Design Rules

- **Rectangular** shape, NOT rounded pill. Distinct from GitHub badges.
- **Monospace font** (Geist Mono), uppercase.
- **Dot indicator** (`●`) prefix, colored to match the state.
- Each state has a **defined color** independent of the issue/header color.
- REVIEWING phase uses **blue/cyan** (inspection, not construction). All other execution phases use **green**.
- When no state matches (e.g., active issue with no session, clean worktree, no PR), **no chip shown**.
- Cascade logic lives in a **separate utility function** `deriveIssueStateChipLabel(dimensions)` — same pattern as `deriveContextualActions()`. The IssueStateChip component is a pure display component receiving resolved `{label, color}`.
- Colors defined for **both dark and light modes** via CSS custom properties (`--chip-error`, `--chip-success`, `--chip-warning`, `--chip-info`, `--chip-muted`).

### 6.3 Aggregate Session State Priority

When an issue has multiple sessions, worst active state wins:
```
needs-input > errored > needs-review > running > paused > finished > no-session
```

---

## 7. Issue Lifecycle & "Done" State

### 7.1 Database Schema

`IssueStatus = 'active' | 'archived'` — only two states. No schema change needed.

### 7.2 Done State (Derived at Render Time)

**No DB change**. Computed from GitHub sync state:
- **Condition**: `github_issue_state === 'closed'` AND `pr_state === 'merged'`
- **Visuals**: Transparent background, NO borders, NO card surface. Content remains **fully readable** — NOT dimmed, NOT faded. Text, badges, and buttons all at normal opacity. Color identity (issue color gradient) removed entirely. `● DONE` chip displayed in header. Action buttons preserved with normal styling (contextual actions based on post-completion state). Full batch selection support.
- **On hover**: Card gains border + generic (non-issue-color) background, then fades back.
- **Primary action button**: Falls back to **neutral/gray** since issue color identity is removed.
- **Archived**: remains a **filter category only**. Archiving recategorizes but has no visual effect. Can archive both active and done issues.

---

## 8. Ghost Card Specifics

### 8.1 Visual Treatment

- Neutral gray surface, **dashed border** (2px dash, 4px gap).
- On hover: dashed border stays but becomes **brighter**, background gains subtle gradient stronger on left/top. Glow + lift same as adopted.

### 8.2 Label-Based Coloring

GitHub labels with a color assigned on GitHub can tint the ghost card:

1. **No colored labels** — fully neutral gray ghost card.
2. **One colored label** (e.g., "Design needed" = `#f97316` orange) — single label color tints the ghost card at **~20% opacity** (default). Header area should be **significantly tinted** (clearly orange, not subtle).
3. **Two colored labels** (e.g., "Design needed" orange + "import" blue) — **split colorization**: orange from LEFT, blue from RIGHT, blending in MIDDLE. Each side at ~15-20% opacity. Must be visually clear that two distinct colors are present.
4. **Three+ colored labels** — pick first 2 alphabetically by label name, apply split colorization. Remaining colored labels ignored for tinting but still shown as full-color pill badges.

**Label ordering for split colorization**: alphabetically by label name. First = left, second = right. Deterministic and predictable.

**Tint opacity default**: 20%. Configurable via user settings (§11, range 5-30%).

- Colored labels retain full color as pill badges.
- Non-colorizing labels (default gray GitHub labels) render grayish.

### 8.3 Adopt Split-Button

- **Outlined style** (not filled) — consistent with secondary button treatment.
- **No plus icon** — text only.
- **Visible separator** between button text and dropdown chevron.
- Default text: "Adopt + Worktree" (or user's last selection).
- Dropdown: "Adopt (no worktree)" and "Adopt with Worktree".
- Remembers last-selected option as new default. Persisted in `app_settings` table (key: `adopt_default_action`).

---

## 9. Accordion Layout

### 9.1 Adopted Issues Grid (Top)

Standard responsive grid: `repeat(auto-fill, minmax(450px, 1fr))`.

### 9.2 Assigned Issues Accordion (Below Grid)

- **Ghost accordion** — no border, no background on the container.
- Header: "Assigned · {count} issues" + sort/filter as **ghost icon buttons**.
- Collapsed by default.
- Inside: same responsive card grid with ghost cards.
- Own sort/filter, independent from adopted grid.

### 9.3 View Switcher

Global toggle: card grid vs. compact row view. Applies to both sections together.

---

## 10. Batch Selection

- Ctrl+click, Shift+click (Windows Explorer), right-click "Select", long press (mobile).
- **No checkboxes** — selection via glow/ring treatment only.
- Batch actions: Archive, Unarchive, Delete, Change Priority, Clean Worktrees.
- Selection does NOT clear after batch action.
- Ring semantics: active = **issue color** (reinforces card identity), selected/batch = **blue** (group membership).

---

## 11. User Settings (Issue Card Appearance)

### 11.1 Settings Cascade

**User settings** (global defaults) → **Workspace settings** (per-workspace overrides). Workspace settings mirror user values until explicitly overridden. Overridden values show a visual indicator (dot/badge) in the settings UI. This follows the broader settings cascade pattern (see PRD #255).

Settings stored in `app_settings` table via `get_app_setting` / `set_app_setting`. Keys prefixed with `issue_card_`. Workspace overrides use `ws_{dashboard_id}_issue_card_` prefix.

Settings UI lives in a dedicated **"Issue Cards"** section within both User Settings and Workspace Settings pages.

### 11.2 Setting Definitions

| Setting Key | Type | Default | Range/Options | Description |
|------------|------|---------|---------------|-------------|
| `issue_card_button_color` | enum | `issue-color` | `issue-color`, `moss-green` | Primary action button background source |
| `issue_card_priority_position` | enum | `header-right` | `header-right`, `preview-bottom-half`, `preview-top-half`, `preview-bottom-inside`, `preview-top-inside`, `preview-tl`, `preview-tr`, `preview-bl`, `preview-br` | Priority badge placement |
| `issue_card_badge_style` | enum | `borderless-dark` | `solid` (A), `borderless-dark` (B), `bordered-dark` (C) | Badge style for priority and state chips |
| `issue_card_label_tint` | number | `20` | 5–30 | Ghost card label colorization intensity (%) |
| `issue_card_overlay_glow` | number | `150` | 100–200 | Error/Needs Input overlay glow intensity (%) |
| `issue_card_variant` | enum | `refined-horizon` | `veil` (F), `refined-horizon` (G), `radiant` (H) | Card visual variant |
| `issue_card_gradient_reach` | number | `60` | 30–100 | Veil variant: how far color extends down (%) |
| `issue_card_color_saturation` | number | `150` | 30–200 | Veil variant: header color saturation (%) |
| `issue_card_header_saturation` | number | `85` | 30–100 | Refined Horizon variant: header color saturation (%) |
| `issue_card_radial_intensity` | number | `75` | 30–100 | Radiant variant: radial emanation strength (%) |

Variant-specific settings (gradient_reach, color_saturation, header_saturation, radial_intensity) only apply when the corresponding variant is active. The settings UI should conditionally show/hide them.

---

## 12. Badge Styles

Three badge styles, applied simultaneously to **both priority badges and issue state chips**. Must look identical across all card variants.

### Style A — Solid
Solid colored background with WCAG-contrast text. Traditional look.

### Style B — Borderless Dark (DEFAULT)
Darker shade of the state/priority color as background, colored text, **NO border**. Subtle, integrates with dark themes. Examples: dark olive bg + gold "HIGH", dark red bg + coral "CRITICAL", dark green bg + green "● EXECUTING".

### Style C — Bordered Dark
Same as Style B (dark bg + colored text) but **WITH a subtle border** in the state/priority color at low opacity (~20-30%). Slightly more defined.

---

## 13. Variant Plan (3 Variants, All Implemented)

All three variants implemented and switchable via user settings from day one. Default variant: **Refined Horizon (G)**.

### 13.0 Implementation Architecture

**Single IssueCard.svelte component** for all variants. Variants are CSS-only, driven by CSS custom properties (e.g., `--ic-gradient-direction`, `--ic-header-blend`, `--ic-body-tint`). A `data-variant="veil|horizon|radiant"` attribute on the card element switches the property set. Minimal JS branching — the CSS cascade handles variant differences.

### 13.1 Variant F: "Veil" (Seamless Top-Down Blend)

**Core identity**: Issue color creates a seamless vertical gradient starting at full intensity at the top, fading through the body into the dark surface. No hard header/body boundary — one unified gradient surface.

**Specific behaviors**:
- Header text auto-determined via `getContrastTextColor()`. Warm/light issue colors (Amber, Rose) get dark text; dark/cool colors (Moss, Azure, Plum, Teal) get light text.
- **Gradient reach** (default 60%): controls how far the color veil extends. At 30%, concentrated at top; at 100%, washes through entire card.
- **Color saturation** (default 150%, range 30–200%): controls header color vividness. At 30%, strongly desaturated toward neutral gray. At 100%, true issue color. At 150%+ (boost mode), enhanced chroma and lightness for vivid header presence. Mix target is `#1e1e1e` (true neutral gray) to avoid OKLCH hue interpolation artifacts that cause purple/pink contamination at low saturation.
- Two dedicated sliders exposed in settings when this variant is active.

**Current state**: Mockup complete (`variant-f.html`). Needs the following fixes for implementation:
- Badge Style B/C consistency across all badge instances.
- PRD group ring including hovered card, ~25% larger offset.
- Ghost card "Design needed" colorization more visibly orange in header.
- Two-label ghost cards: orange-LEFT / blue-RIGHT split.

### 13.2 Variant G: "Refined Horizon" (DEFAULT — Improved Split Horizon)

**Core identity**: Sunset horizon metaphor. Header gradient sweeps vivid issue color from LEFT (desaturated RIGHT), meeting darker body at a crisp 1px boundary. Square preview with matching header color background. Most mature variant.

**Specific behaviors**:
- **No executing card overlay** — strict chip-only, same as all variants. (The mockup's "steady glow for executing" is overridden by the cross-variant decision in §5.3.)
- Soft glow states: Active (green) and Selected (blue) use diffused box-shadow glows + body tinting instead of thick rings.
- Rectangular session/state chips with monospace font + colored dot prefix.
- **Header saturation** (default 85%): controls header color saturation.

**Current state**: Most polished mockup (`variant-g.html`). Needs:
- PRD group ring only on PRD number hover (not card hover), includes hovered card.
- Ghost card label tinting significantly more visible for "Design needed" orange.
- Two-label ghost cards: orange-LEFT / blue-RIGHT split.
- Badge Style C (bordered) as third option.

### 13.3 Variant H: "Radiant" (Bright Radial Emanation)

**Core identity**: Preview area acts as light source, radiating outward via a large (~340x300px) radial gradient at resting intensity. Trees/characters toned to ~35% opacity so the colored glow IS the focal point.

**Specific behaviors**:
- **Preview box is OPAQUE dark** — NOT transparent, NOT following radial intensity. Dark surface color creates a "cut out" look with natural glow around it. Very subtle internal gradient OK.
- **Radial intensity** (default 75%): controls emanation strength.
- Priority badges must have correct z-index to render above preview box borders.
- No executing card overlay — radial emanation is the signature.

**Current state**: Mockup complete (`variant-h.html`). Needs:
- Opaque dark preview box (not transparent).
- Correct z-index on priority badges over preview borders.
- Ghost card "Design needed" colorization more orange.
- Two-label ghost cards: orange-LEFT / blue-RIGHT split.
- Badge Style B consistency with other variants.

---

## 14. Light Mode

Light mode is implemented alongside dark mode from day one — NOT deferred.

### 14.1 Light Mode Treatment

- **Header gradients**: Full saturation (no desaturation). Vivid issue colors.
- **Card body**: White/light surface (`--surface-1` or similar).
- **Text**: Dark text on light surfaces, auto-contrast on colored headers via `getContrastTextColor()`.
- **Dark mode**: Desaturate headers ~20-30% compared to light mode.
- **State chip colors**: Defined for both modes via CSS custom properties. Same semantic tokens, different values per theme.
- **Done state**: Same treatment (transparent bg) works on both light and dark backgrounds.
- **Ghost cards**: Gray tones adapted for light backgrounds.

### 14.2 Color Token Strategy

All state chip, badge, and overlay colors use semantic CSS custom properties that swap between themes:

```css
[data-theme="dark"] {
  --chip-error: oklch(0.65 0.25 25);
  --chip-warning: oklch(0.75 0.18 70);
  --chip-success: oklch(0.7 0.2 145);
  --chip-info: oklch(0.7 0.15 230);
  --chip-muted: oklch(0.5 0.02 260);
}
[data-theme="light"] {
  --chip-error: oklch(0.55 0.25 25);
  --chip-warning: oklch(0.6 0.2 70);
  --chip-success: oklch(0.5 0.2 145);
  --chip-info: oklch(0.5 0.17 230);
  --chip-muted: oklch(0.45 0.03 260);
}
```

Exact values tuned during implementation. The structure is non-negotiable.

---

## 15. Design Constraints (Non-Negotiable)

- Issue color is the **primary visual differentiator** — must be prominent.
- WCAG contrast for all text on colored backgrounds.
- **No left colored accent border** (AI design cliche).
- **No flat solid-color headers** (what we're replacing).
- **No thin top stripe alone** (insufficient color area).
- Must use existing base components (Button, Badge, etc.).
- Must respect token system (`designs/tokens.css`), OKLCH color space.
- 450px minimum card width, responsive grid.
- Preview area: **square**, minimum 100px.
- Always-visible action buttons (not hover-revealed) — mobile/touch.
- No per-card checkboxes for selection.
- **No executing card overlay** — chip in header only. Pulsing/flashing reserved for Error/Needs Input.
- **No drag-and-drop on card grid** — sort order via controls. Kanban drag-drop is a separate component (PRD #168).
- Quick-action buttons: NO visible background by default. Bg on hover only.
- Worktree + branch: **single line only**, truncate, strip parent paths and prefixes.
- Typography: Geist (sans) / Geist Mono (mono).

---

## 16. Design Freedom (Per Variant)

- Gradient direction, intensity, and layering.
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

---

## 17. Components

### 17.1 Component Extraction Architecture

The IssueCard is a complex component (currently 538 lines). To keep it maintainable, it should be decomposed into clear sub-components sharing state via an `IssueCardContext`.

```
IssueCard.svelte (orchestrator — ~150 lines)
├── IssueCardContext (Svelte context)
│   Provides: issue, color, headerTextColor, isLightHeader,
│   cache, sessionState, variant, settings, derivedChipState
│
├── IssueCardHeader.svelte (~120 lines)
│   ├── PRD link + issue number + title (left)
│   └── IssueCardHeaderActions.svelte (~80 lines)
│       ├── IssueStateChip
│       ├── PriorityBadge
│       └── QuickActionButtons.svelte (~60 lines)
│           └── 4× Button (folder/terminal/editor/mute)
│
├── IssueCardBody.svelte (~60 lines, grid layout)
│   ├── IssueCardPreview.svelte (~40 lines)
│   │   └── TreeThumbnailImage | CharacterPortrait | Placeholder
│   │
│   └── IssueCardInfoRows.svelte (~120 lines)
│       ├── Row 1: WorktreeRow.svelte (branch + badges)
│       ├── Row 2: GitHubStatusRow.svelte (issue + PR + CI badges)
│       ├── Row 3: IssueLabelsRow.svelte (pills + overflow)
│       └── Row 4: CommandResultsRow.svelte (check/test/CI/server)
│
└── ContextualActionButtons.svelte (already extracted)
```

### 17.2 Existing Components to Use

- **Button** (`ghost-overlay` for quick-actions, new issue-color variant for primary action)
- **Badge** (GitHub labels, status indicators — needs Style B/C additions)
- **TreeThumbnailImage**, **GitHubBadge**, **SyncBadge**, **MergeConflictBadge**
- **ContextualActionButtons**, **WithTooltip**
- `getContrastTextColor()` from `color_utils.ts`

### 17.3 Components to Create

| Component | Description | Storybook |
|-----------|-------------|-----------|
| **IssueCardContext** | Svelte context providing shared issue state to all sub-components | No |
| **IssueCardHeader** | Header band: gradient bg, PRD/issue/title (left), actions (right) | Yes |
| **IssueCardHeaderActions** | State chip + priority badge + quick-action buttons cluster | Yes |
| **QuickActionButtons** | 4 icon buttons (folder/terminal/editor/mute). Ghost style, bg on hover only | Yes |
| **IssueCardBody** | Grid layout orchestrator: preview (left) + info rows (right) | No |
| **IssueCardPreview** | Square preview: tree thumbnail, character portrait, or placeholder | Yes |
| **WorktreeRow** | Row 1: branch icon + worktree name + branch name + right-pinned badges (sync, merge conflict, worktree error) | Yes |
| **GitHubStatusRow** | Row 2: issue badge (left) + PR badge (middle) + CI badge (right) | Yes |
| **IssueLabelsRow** | Row 3: colored label pills + overflow count + tooltip | Yes |
| **CommandResultsRow** | Row 4: check/test result badges + dev server badge. Shows running/passed/failed states | Yes |
| **CommandResultBadge** | Animated collapsing pill: spinner + name while running → circle icon (✓/✗) when finished. Width animates from pill to circle | Yes |
| **ServerPortBadge** | Green dot + port number. Badge style B/C. Click opens `localhost:{port}` | Yes |
| **IssueStateChip** | Replaces `SessionStateChip`. Pure display — receives resolved `{label, color}` from `deriveIssueStateChipLabel()`. Rectangular, monospace, dot indicator. All 22 states per §6 | Yes |
| **IssueColorButton** | New `intent: 'issue-color'` in `button-variants.ts`. Accepts `color` prop, WCAG-contrast text. Falls back to neutral/gray (Done/Ghost). For primary contextual action | Yes |
| **SplitButton** | `ButtonGroup.Root` + Separator + `Button` + `DropdownMenu`. Outlined, remembers last selection (DB-persisted). For ghost card adopt action | Yes |
| **PriorityBadge** | Priority label with 9 positions (§2.3), 3 badge styles (A/B/C). Clickable, spawns priority change menu | Yes |

### 17.4 Utility Functions to Create

| Function | Description |
|----------|-------------|
| `deriveIssueStateChipLabel(dimensions)` | 22-state cascade (§6). Returns `{label, color} \| null`. Same pattern as `deriveContextualActions()` |
| `deriveWorktreeBadge(worktreeState)` | Returns `{label, tone} \| null` for worktree state badge |
| `deriveCardStateClass(flags)` | Returns CSS class string from `{isArchived, isBatchSelected, isActive, isHovered, isModifierHeld, worktreeState}` |

### 17.5 Badge Component Updates

Add two new style variants to the existing Badge component:

- **Style B (borderless-dark)**: dark shade of semantic color as bg, colored text, no border. Uses `color-mix(in oklch, {color} 14%, transparent)`.
- **Style C (bordered-dark)**: same as B but with subtle border at ~20-30% opacity.

These apply to priority badges, issue state chips, and server port badges via a shared `badgeStyle` prop driven by the `issue_card_badge_style` user setting.

### 17.6 PRD Group Hover Implementation

Cross-card communication via **Svelte store in context**. `IssueCardList` provides a `hoveredPrdNumber` writable store. Each card's PRD number `mouseenter`/`mouseleave` updates it. All cards reactively check if their PRD matches and apply the ring class. Works across both adopted grid and assigned accordion sections.

---

## 18. Source Files (Current Implementation)

- `src/lib/components/blocks/issue/IssueCard.svelte` (538 lines)
- `src/lib/components/blocks/issue/IssueCardList.svelte`
- `src/lib/components/blocks/issue/ContextualActionButtons.svelte`
- `src/lib/components/blocks/issue/batch_selection_utils.ts`
- `src/lib/components/blocks/issue/AssignedIssuesPanel.svelte`
- `src/lib/modules/contextual-actions/derive_contextual_actions.ts`
- `src/lib/modules/issues/types.ts` — IssueStatus, IssuePriority, WorktreeState
- `src/lib/modules/visualization/state_mapping.ts` — aggregate session state
- `src/lib/modules/visualization/tree_computation.ts` — 14-rule stage cascade
- `src/lib/components/derived/session-state-chip/SessionStateChip.svelte`
- `src/lib/components/shadcn/badge/Badge.svelte` + `badge-variants.ts`
- `src/lib/components/shadcn/button/Button.svelte` + `button-variants.ts`
- `src-tauri/src/database/schema.rs` — CHECK constraint: `status IN ('active', 'archived')`
- `src-tauri/src/commands/window_commands.rs` — `get_app_setting` / `set_app_setting`
