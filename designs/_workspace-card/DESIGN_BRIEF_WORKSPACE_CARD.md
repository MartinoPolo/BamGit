# Workspace Card — Design Brief

Entry point to each workspace on the Overview page. Shows workspace health, active sessions, issue counts, GitHub repo info, and accent color. Click opens the workspace window.

---

## 1. Purpose

The workspace card is the primary health-at-a-glance widget for each workspace. It answers: "Does this workspace need my attention right now?" Users scan the card grid to triage across multiple workspaces, then click to enter one.

The card should feel like a living dashboard widget, not a static list item. Active workspaces breathe, urgent ones pulse red, dormant ones fade — visual priority is immediate.

---

## 2. Surrounding Context

The workspace card appears on the **Overview page** — a full-width launcher with **NO sidebar** and **NO forest view**.

**Overview page layout:**
- Full viewport, no sidebar navigation
- **Header row**: h1 "Grovekeeper" + subtitle (left), archive toggle + GitHub connection button (right)
- **Controls** (PRD #257): Sort, Filter, and Settings buttons in header row (planned)
- **Card grid**: `grid-template-columns: repeat(auto-fill, 340px)`, `gap: 16px`
- Workspace cards fill the grid; `AddWorkspaceCard` (dashed border, `+` icon) is always last
- **Context menu** (PRD #257 / issue #274): right-click workspace card opens `DashboardEditDialog` directly (no dropdown context menu)

**Parent component**: `src/routes/overview/+page.svelte`
**What parent provides**: Grid layout, data fetching via `getOverviewData()`, click handlers for open/github/folder/config
**What this component fills**: Individual grid cell in the auto-fill grid
**Must NOT include**: Page header, grid layout, window chrome — those belong to the parent

**Mockup rendering**: Show the FULL overview page with multiple workspace cards in a grid, the header above, controls, and NO sidebar. Show 4-6 cards demonstrating different variants (active, urgent, needs-attention, dormant, empty, default) plus the AddWorkspaceCard.

---

## 3. Requirements

### 3.1 Data to Show

All data sourced from `OverviewWorkspaceData` (ts-rs generated type):

| Field | Source | Display |
|-------|--------|---------|
| Workspace name | `name` | Bold header, 15px |
| Accent color | `accent_color` | Left bar + gradient tint + LED glow |
| GitHub repo | `github_repo` | Icon button (GitHub) |
| Local folder | `local_folder` | Icon button (Folder) |
| Default branch | `default_branch` | Subtitle: `{branch} · {N} worktrees` |
| Worktree count | `worktree_count` | Subtitle |
| Issue counts | `afk_ready_count`, `open_issue_count` | Stat cell: `{afk}/{total}` dual number |
| PR count | `open_pr_count` | Stat cell |
| Attention PRs | `prs_needing_attention` | Stat cell (danger tone when >0) |
| HITL count | `hitl_count` | Stat cell (warning tone when >0) |
| PRD tracking | `prd_count`, `prd_completed_subs`, `prd_total_subs` | PRD row with progress bar |
| AFK loop | `afk_loop_status` | StatusRow: LED + label + session meta |
| Sessions | `active_session_count` | StatusRow meta |
| Cost | `total_cost_usd` | Footer: `today $X.XX` via CostLink |
| Last activity | `last_activity` | Footer: relative timestamp |
| Status | `status` (DashboardStatus) | Archived filter |

### 3.2 Context Menu Actions (PRD #257, Issue #274)

Right-click opens `DashboardEditDialog` directly (no dropdown context menu). Planned additional actions: Open Folder, Open GitHub, Rename, Archive, Delete, Settings. Gear icon in card header alongside folder/GitHub buttons (PRD #257).

### 3.3 Click Behaviors

| Target | Action |
|--------|--------|
| Card body | Open workspace window via `openWorkspaceWindow(dashboardId)` |
| GitHub icon | Open `https://github.com/{repo}` in browser; unassigned = config wizard |
| Folder icon | Open local folder in file explorer; unassigned = config wizard |
| Right-click GitHub/Folder | Open config wizard |
| Issues stat | Navigate to workspace Issues tab (all tracked) |
| PRs stat | Navigate to workspace PRs view |
| ATTN stat | Navigate to workspace Issues tab, filtered to attention-needed |
| HITL stat | Navigate to workspace Issues tab, filtered to HITL |
| PRD row | Navigate to PRD view in workspace dashboard |
| AFK row | Navigate to AFK loop page in workspace dashboard |

---

## 4. Existing Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| **Card** | `$lib/components/shadcn/card/` | Base card with `accentBarColor` (3px left border) + `gradientTint` (::before gradient) |
| **StatCell** | `$lib/components/base/stat-cell/` | 4-cell health grid. Props: `label`, `value`, `suffix`, `tone`, `icon`, `pulse`, `onclick` |
| **StatusRow** | `$lib/components/base/status-row/` | AFK status. Props: `active`, `label`, `meta`, `onclick`, `activeColor` |
| **Button** | `$lib/components/shadcn/button/` | Ghost variant, icon-sm size for GitHub/Folder actions |
| **Badge** | `$lib/components/shadcn/badge/` | Tones: success, warning, danger, info, moss, amber |
| **Tooltip** | `$lib/components/shadcn/tooltip/` | Stat cell tooltips (e.g., "3 actionable AFK issues out of 10 tracked") |
| **ContextMenu** | `$lib/components/shadcn/context-menu/` | Right-click workspace actions (issue #274) |
| **Progress** | `$lib/components/shadcn/progress/` | Available but PRD row uses a custom inline progress bar |
| **CostLink** | `$lib/components/blocks/usage/CostLink.svelte` | Footer cost display |
| **GithubIcon** | `$lib/components/derived/icons/GithubIcon.svelte` | Stroke-based SVG matching Lucide style |
| **Typography** | Design system classes | `.gk-h3` (14px), `.gk-body` (13px), `.gk-small` (12px), `.gk-tiny` (11px), `.gk-eyebrow` (10.5px uppercase), `.font-mono` |

**Lucide icons in use**: `list-checks`, `git-pull-request`, `triangle-alert`, `user`, `folder`, `git-branch`, `clipboard-list`, `clock`, `sparkles`, `plus`

---

## 5. Components to Design

### 5.1 WorkspaceCard Layout

The overall card structure (already implemented in `WorkspaceCard.svelte`):

```
button (full card click target)
  Card (accentBarColor + gradientTint)
    [Breathing glow overlay — active variant only]
    Header: thumbnail + name/subtitle (left) + icon buttons (right)
    Content:
      [Empty state OR health grid + PRD row + AFK row]
    Footer: cost + last activity
```

### 5.2 Gear/Settings Icon Button (PRD #257 — not yet implemented)

New icon button alongside GitHub/Folder in header. Same styling: ghost, icon-sm, 26px, strokeWidth 1.7. Left-click opens `DashboardEditDialog`.

### 5.3 Overview Toolbar Controls (PRD #257 / Issue #276 — not yet implemented)

Sort, Filter, and Settings buttons in the overview header row. Sort options: Name, Activity, Issue count, Cost. Filter options: All, Active, Needs Attention, Dormant.

---

## 6. Layout & Dimensions

| Property | Value |
|----------|-------|
| Card width | 340px (grid column) |
| Card min-height | `min-h-49` (AddWorkspaceCard reference); auto-height in practice |
| Grid | `repeat(auto-fill, 340px)`, `gap-4` (16px), `auto-rows-[1fr]` |
| Card padding | 14px horizontal, 14px top, 12px bottom (`px-3.5 pt-3.5 pb-3`) |
| Internal spacing | 4px base grid, `gap-1.5` for stat grid, `mb-2` / `mb-1.5` between sections |
| Border radius | `rounded-lg` (Card default) |
| Accent bar | 3px wide, left side, card's accent color (via Card `accentBarColor`) |
| Thumbnail | 32px square, rounded-md, border, surface-2 bg, mono initials |
| Header icon buttons | 26px (`size-6.5`), ghost variant |
| Stat grid | 4 equal columns (`grid-cols-4`), `gap-1.5` |
| PRD row | Full width, `px-2.5 py-1.5`, surface-2 bg, border, rounded-sm |
| Footer | Dashed top border separator, `mt-2.5 pt-2` |
| Z-index | `isolate` on card for stacking context |
| Responsive | Cards maintain 340px width; grid wraps to available columns (1-4+) |

---

## 7. States & Interactions

### 7.1 Card Variant Priority (highest wins)

Derived by `deriveWorkspaceCardVariant()` in `workspace_card_variants.ts`:

| # | Variant | Condition | Visual Treatment |
|---|---------|-----------|-----------------|
| 1 | `urgent` | `prsNeedingAttention > 0` | Accent overridden to red `oklch(0.620 0.205 25)`, ATTN stat pulsing |
| 2 | `needs-attention` | `hitlCount > 0` | Accent overridden to amber `oklch(0.770 0.155 75)`, HITL stat pulsing |
| 3 | `active` | `afkLoopStatus === 'running'` | Breathing glow animation (inset box-shadow, accent color at 22% opacity) |
| 4 | `dormant` | No activity >24h | `opacity-[0.72] saturate-[0.7]` |
| 5 | `empty` | `openIssueCount === 0` | Health grid replaced with dashed placeholder: sparkles icon + "Newly created - open to track issues" |
| 6 | `default` | None of above | Standard healthy workspace |

### 7.2 Hover State (Orthogonal — Applies on Top of Any Variant)

- Transform: `translate-y-0.5` (negative, card lifts)
- Border: accent-blended via `gk-ws-hover-glow` class
- Shadow: elevated shadow + accent ring + accent glow
- Applied via CSS `:hover` / `group-hover` on the Card

### 7.3 StatCell States

| Tone | Trigger | Visual |
|------|---------|--------|
| `neutral` | Default, value > 0 | Surface-2 bg, standard border |
| `zero` | Value = 0 (auto-detected) | Muted number, lighter weight |
| `warning` | HITL > 0 | Amber tint bg, amber border, amber text |
| `danger` | ATTN > 0 | Red tint bg, red border, red text |
| + `pulse` | `pulse=true` and value > 0 | Animated dot next to value |

### 7.4 StatusRow States (AFK Row)

| State | LED | Label | Meta |
|-------|-----|-------|------|
| AFK on, sessions active | 8px moss-400, glowing + pulsing | "AFK loop running" (bold) | `{total} sessions ({afk} AFK)` |
| AFK on, idle | 8px moss-400, glowing + pulsing | "AFK loop running" (bold) | `idle` |
| AFK off, recent activity | 8px foreground-subtle, static | "AFK loop off" (muted) | `last {relative_time}` |
| AFK off, manual sessions | 8px foreground-subtle, static | "AFK loop off" (muted) | `{total} sessions` |
| AFK off, no activity | 8px foreground-subtle, static | "AFK loop off" (muted) | (none) |

### 7.5 Icon Button States

| State | GitHub / Folder |
|-------|----------------|
| Assigned, resting | `text-foreground-subtle`, opacity 1.0 |
| Assigned, hover | `text-foreground` + `bg-surface-2` |
| Unassigned, resting | `opacity-[0.35]` |
| Unassigned, hover | `opacity-[0.35]` + `bg-surface-2` |

Left-click: assigned = open target; unassigned = config wizard.
Right-click: always = config wizard.

### 7.6 PRD Row States

| State | Visual |
|-------|--------|
| Visible | `prd_count > 0`: icon + "N PRDs" + progress bar + "X/Y done" |
| Hidden | `prd_count === 0`: empty spacer (`h-7.5`) preserving card height |
| Hover | `border-border-strong` highlight |

### 7.7 AddWorkspaceCard

- Dashed border (1.5px), no accent bar, no gradient
- Content: centered `+` circle (36px, surface-2 bg) + "Add workspace" label (13px, 500 weight)
- Hover: border -> moss-400, text -> moss-300, subtle moss bg tint, lift

---

## 8. Design Constraints (Non-Negotiable)

- 12-preset accent color palette is the identity system — must be prominent
- 3px left accent bar as primary accent surface
- Health grid order: **Issues -> PRs -> ATTN -> HITL** (decision priority from grilling)
- Dual number format for Issues stat: `{afk_actionable}/{total_tracked}`
- Active/breathing animation must be present when AFK loop is running
- 340px card width, must work in `auto-fill` grid
- No AFK start/stop toggle on overview card (only in workspace dashboard)
- Icon buttons always visible (not hover-revealed) — touch/mobile support
- StrokeWidth 1.7 on icon buttons
- "Newly created" (not "Newly planted") in empty state
- Must use existing Card component with `accentBarColor` + `gradientTint` props
- Cost period hardcoded to "today" (configurable period deferred to PRD #93 Metrics)
- Footer config: global, applies to all workspace cards (PRD #257)

---

## 9. Design Freedom

Designer has creative latitude in:

- **Accent gradient direction and blend mode** — current: 180deg linear, 8% tint, 0-60% stop. Radial, conic, or different angle/opacity welcome
- **Hover animation easing** — spring, cubic-bezier, or CSS transition timing
- **LED dot glow parameters** — blur radius, spread, animation timing
- **Card shadow depth** — resting vs hover elevation contrast
- **Stat cell hover feedback** — background color, border treatment
- **Thumbnail treatment** — placeholder styling, aspect ratio, corner rounding, future custom icons
- **Empty state messaging** — copy and iconography for zero-issue workspaces
- **PRD progress bar styling** — fill animation, corner radius, height
- **Dormant state visual treatment** — current: opacity + saturation. Alternatives: grayscale, faded border, reduced contrast
- **Add Workspace card placeholder** — dashed border + centered icon is current; alternative empty state treatments welcome
- **Breathing glow animation timing** — current spec: 3.6s ease-in-out; tune for subtlety

Designer MUST preserve:

- 12-preset accent color palette (identity system)
- Health grid order: Issues -> PRs -> ATTN -> HITL
- 3px left accent bar (primary accent surface)
- Active/breathing animation presence (AFK loop running indicator)
- Dual number format for Issues stat (`afk_actionable/total_tracked`)

---

## 10. Inspiration

- **Issue Card v2** (`designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md`) — color treatment: gradient-based identity (not flat fills), hover glow + card lift, subtle box-shadow glows over thick borders. Follow similar visual language for workspace accent color prominence
- **Linear** — issue grid cards with status indicators and glanceable metrics
- **GitHub Desktop** — workspace switcher list for quick project overview
- **Raycast** — extension cards with icon, description, stats row
- **VS Code** — start page "Recent" section with repo cards, folder path, icons
- **Dashboard widgets** — macOS widget cards, Notion database cards (compact metric display)

Feel consistent with: Grovekeeper's existing `.cb-panel` data panels (control board style), issue cards in workspace dashboard, session status indicators, the 12-color accent system used in worktree tabs and session labels.

---

## Accent Color System (12 Presets)

Workspace accent chosen via `ColorPickerContent` (inline, no dropdown) with 12 presets in a 2x6 grid.

| Name | OKLCH | Hue | Token |
|------|-------|-----|-------|
| moss | `oklch(0.580 0.096 134)` | 134 | `--moss-500` (existing) |
| amber | `oklch(0.690 0.165 55)` | 55 | `--amber-500` (existing) |
| bark | `oklch(0.500 0.075 55)` | 55 | `--bark-500` (existing) |
| azure | `oklch(0.570 0.130 235)` | 235 | `--azure-500` (existing) |
| plum | `oklch(0.560 0.150 320)` | 320 | `--plum-500` |
| teal | `oklch(0.620 0.110 195)` | 195 | `--teal-500` |
| rose | `oklch(0.640 0.155 15)` | 15 | `--rose-500` |
| coral | `oklch(0.620 0.155 30)` | 30 | `--coral-500` |
| gold | `oklch(0.650 0.135 90)` | 90 | `--gold-500` |
| sage | `oklch(0.600 0.085 160)` | 160 | `--sage-500` |
| indigo | `oklch(0.540 0.140 275)` | 275 | `--indigo-500` |
| fuchsia | `oklch(0.580 0.155 350)` | 350 | `--fuchsia-500` |

Grid layout:
```
Row 1: moss    amber   gold    coral   rose    fuchsia
Row 2: sage    teal    azure   indigo  plum    bark
```

Each color has a 5-step scale (300-700) following the existing OKLCH pattern.

---

## Existing Implementation

### Source Files

| File | Description |
|------|-------------|
| `src/lib/components/blocks/workspace/WorkspaceCard.svelte` | Main component (~360 lines) |
| `src/lib/components/blocks/workspace/workspace_card_variants.ts` | Variant derivation + accent color override |
| `src/lib/components/blocks/workspace/workspace_card_variants.test.ts` | Unit tests for variant logic |
| `src/lib/components/blocks/workspace/WorkspaceCard.stories.svelte` | Storybook stories |
| `src/lib/components/blocks/workspace/AddWorkspaceCard.svelte` | Add workspace CTA card |
| `src/lib/components/base/stat-cell/` | StatCell component (4 tones, pulse, suffix) |
| `src/lib/components/base/status-row/` | StatusRow component (LED, label, meta) |
| `src/routes/overview/+page.svelte` | Overview page consuming WorkspaceCard |
| `src/lib/types/generated/OverviewWorkspaceData.ts` | ts-rs generated data type |

### Implementation Status

Fully implemented: card structure, variant derivation, stat grid, PRD row, AFK StatusRow, footer, accent colors, empty state, dormant state, breathing glow, icon buttons, CostLink integration.

Not yet implemented (from PRD #257):
- Gear/settings icon button in card header
- Right-click context menu (issue #274)
- Sort/filter/settings toolbar on overview page (issue #276)
- Configurable footer content (issue #276)

---

## Not Included (Explicit Scope Exclusions)

- Configurable cost period — deferred to PRD #93 Metrics
- Full PRD view/page — separate PRD #219: PRD Management & Visualization
- Forest thumbnail on card (no forest view in overview)
- Inline issue list (card shows aggregates only)
- AFK loop start/stop toggle on overview card
- Drag and drop reordering — grid order via sort controls
- Workspace creation flow — handled by AddWorkspaceCard + DashboardCreateDialog
- Session management controls — handled in workspace detail view
- Git branch switcher — branch display is read-only
- Cost breakdown tooltip — cost label shows simple total
- Card editing UI (rename, delete, archive) — handled by context menu / DashboardEditDialog
- Workspace card structural redesign or new visual variants (PRD #257 scope note)

---

## Related Issues & PRDs

| Issue | Status | Description |
|-------|--------|-------------|
| #257 | OPEN | PRD: Overview & Workspace Card Polish (sort, filter, gear icon, context menu, footer config) |
| #274 | OPEN | Add right-click context menu to workspace cards |
| #276 | OPEN | Add sorting, filtering, and configurable footer to Overview page |
| #96 | OPEN | PRD: Platform & Settings (parent PRD, overview dashboard section) |
| #212 | CLOSED | Workspace card redesign -- full visual implementation |
| #213 | CLOSED | Card component enhancements -- accentBarColor + gradientTint |
| #214 | CLOSED | New components -- StatCell + StatusRow with Storybook |
| #217 | CLOSED | Workspace accent color system -- 12-color palette + token scales |
| #218 | CLOSED | Add workspace wizard update -- remove hint, add accent picker |
