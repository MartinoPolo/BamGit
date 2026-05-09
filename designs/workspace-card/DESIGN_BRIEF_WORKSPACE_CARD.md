# Workspace Card — Design Brief

Quick-glance health overview of a workspace. Click opens/focuses that workspace's window.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `designs/tokens.css`. Font: Geist / Geist Mono.

## Container Context

**Parent**: Standalone (Overview window — `src/routes/overview/+page.svelte`)
**What parent provides**: Full viewport, header with app name/subtitle, toggle for archived workspaces, grid container
**What this component fills**: Individual grid cell (320×196px minimum) in auto-fill responsive grid
**Must NOT include**: Window chrome, page header, grid layout — these belong to the parent

**Mockup rendering**: Show the card as standalone with minimal surrounding context. The Overview window displays multiple cards in a grid, but focus the mockup on a single card's design.

## Purpose

Quick-glance health overview of a workspace. Click opens/focuses that workspace's window. The card should feel like a living dashboard widget, not a static list item.

---

## Required Elements

### Identity (Header)

- **Workspace name** — equals the repository name (e.g., "grovekeeper"). Bold, 15px, 600 weight
- **Accent color** — prominently visible as card background gradient tint (8% opacity, 135deg), left accent bar (3px solid), and AFK LED glow. Each workspace has a distinct color from the 12-preset palette. Dominant visual differentiator between cards
- **Custom thumbnail** — optional project icon/SVG uploaded by user. When unset: hatched placeholder square with 2-letter uppercase initials (mono font)
- **Subtitle line** — mono, 10.5px, muted: `{branch_icon} {default_branch} · {N} worktrees`
    - Branch = repo default branch (the main worktree's branch, e.g., "main", "develop")
    - Worktrees = count of active git worktrees in this workspace

### Quick Access Buttons (top-right corner)

- **GitHub link** — custom stroke-based `GithubIcon.svelte` (Lucide/Feather style, matching the design's icon). Opens repo URL in browser
- **Local folder** — Lucide `folder` (closed). Opens project path in file explorer
- Both: 26×26px (`icon-sm`), `ghost` variant, `text-foreground-subtle` at rest, `text-foreground` + `bg-surface-2` on hover, strokeWidth 1.7
- **Unassigned state**: opacity 0.35. Left-click AND right-click open workspace config wizard for that field
- **Assigned state**: opacity 1.0 (via `text-foreground-subtle`). Left-click opens target. Right-click opens workspace config wizard

### Health Indicators (stat grid — 4 cells, equal width)

Order: **Issues → PRs → ATTN → HITL**

Each cell: label row (icon + uppercase mono text, 9.5px) + value row (mono number, 16px, 600 weight).

| Stat      | Label    | Icon (Lucide)      | Tone when >0      | Pulse dot |
| --------- | -------- | ------------------ | ----------------- | --------- |
| Issues    | `ISSUES` | `list-checks`      | neutral           | No        |
| PRs       | `PRs`    | `git-pull-request` | neutral           | No        |
| Attention | `ATTN`   | `triangle-alert`   | `danger` (red)    | Yes       |
| HITL      | `HITL`   | `user`             | `warning` (amber) | Yes       |

**Issues dual number**: displayed as `{afk_actionable}/{total_tracked}`. The AFK numerator = issues with AFK label, unblocked, regardless of session state. Total = non-PRD Grovekeeper issues in this workspace. Example: `3/10`. Tooltip: "3 actionable AFK issues out of 10 tracked"

- AFK numerator styling: normal weight `--foreground`
- Slash + denominator: lighter weight `--foreground-muted`
- When AFK count = 0: "zero" tone (muted)

**Tone variants** (StatCell component):

- `neutral` — default: `surface-2` bg, `border`, normal colors
- `zero` — when value = 0: muted number, lighter weight
- `warning` — amber tint bg, amber border, amber number + label
- `danger` — red tint bg, red border, red number + label

**Click behavior**:

- Issues → workspace dashboard, Issues tab (all tracked)
- PRs → workspace dashboard, PRs view
- ATTN → workspace dashboard, Issues tab filtered to attention-needed
- HITL → workspace dashboard, Issues tab filtered to HITL issues

### PRD Row (compact inline, below health grid)

Layout: `{icon} {N} PRDs · {completed}/{total} done [{progress_bar}]`

- Icon: a small icon (TBD — tree or clipboard-list) at 12px
- "3 PRDs" = count of open PRDs in this workspace
- Progress bar: thin horizontal bar showing aggregate sub-issue completion across all PRDs
- `12/31 done` = total completed sub-issues / total sub-issues across all open PRDs
- Click → navigates to PRD view in workspace dashboard
- Styling: same container style as AFK row (surface-2 bg, border, rounded)

### AFK Status Row

Container: `surface-2` bg, `border`, `radius-sm`, 8px 10px padding.

| Element              | AFK On                                         | AFK Off                                      |
| -------------------- | ---------------------------------------------- | -------------------------------------------- |
| LED dot              | 8px, `moss-400`, glowing + pulsing animation   | 8px, `foreground-subtle`, static             |
| Label                | "AFK loop running" (500 weight, `foreground`)  | "AFK loop off" (`foreground-muted`)          |
| Meta (right-aligned) | `{total} sessions ({afk_count} AFK)` or `idle` | `{total} sessions` or `last {relative_time}` |

- Session count: total active sessions in workspace. AFK count = sessions spawned by AFK loop (not manually spawned)
- When AFK on, 0 sessions: show `idle`
- When AFK off, 0 sessions: show `last {time_since_last_afk_run}`
- Container border gets moss tint when AFK is on
- Click → navigates to AFK loop page in workspace dashboard
- Start/stop AFK toggle: only available inside workspace dashboard, NOT on overview card

### Footer (cost + activity)

- Dashed top border separator
- Left: `today $4.82` — period hardcoded to "today" (configurable period deferred to PRD #93 Metrics)
- Right: `{clock_icon} {relative_timestamp}` — when any activity last happened in workspace
- Mono 10.5px, `foreground-subtle`

---

## States

List every state that must be designed:

- **Default**: Standard healthy workspace, AFK off, no alerts
- **Active/Breathing**: Breathing glow animation (3.6s ease-in-out, inset box-shadow pulsing 0.7–1.0 opacity) when AFK loop running
- **Hover**: Transform translateY(-2px), border accent blend, shadow-md + 1px accent ring + 28px accent glow
- **Needs-attention**: Accent overridden to amber when HITL pending (hitl_count > 0)
- **Urgent**: Accent overridden to red when PRs needing attention (attn_count > 0)
- **Dormant**: opacity 0.72, saturate(0.7) when no activity >24h
- **Empty**: Health grid replaced with dashed placeholder: "Newly planted — open to track issues" with sparkle icon when no Grovekeeper issues tracked
- **Add Workspace Card state**: Dashed border, centered `+` circle with "Add workspace" label, hover effects

## Reusable Components

Specify which existing components to use:

- **Card**: Base `Card` component from `$lib/components/ui/card` with new props: `accentBarColor` (3px left border) and `gradientTint` (::before gradient overlay)
- **Button**: Lucide icon buttons (26px, `icon-sm`, `ghost` variant) for GitHub/folder actions with opacity states
- **Badge**: `.gk-badge` with tone variants for status indicators if needed
- **StatCell**: New component (see below) for health grid metrics
- **StatusRow**: New component (see below) for AFK status display
- **GithubIcon**: New stroke-based icon matching Lucide style
- **ColorPickerContent**: Inline 12-preset color picker (2×6 grid)

## Components to Adopt

shadcn-svelte or Bits UI components to install if needed:

None currently required. All interactive elements use existing Button, Card, and custom components.

## Layout Constraints

- **Card size**: 320px width (grid column minimum), 196px min-height
- **Grid layout**: `auto-fill` responsive grid with 340px columns (parent provides)
- **Padding**: 14px 14px 12px
- **Spacing**: 4px base grid, consistent internal spacing using `--space-*` tokens
- **Responsive**: Cards maintain fixed width; grid wraps to available space
- **Z-index isolation**: Cards use `isolation: isolate` for stacking context

## Visual References

- **GitHub Desktop** — workspace switcher list (side panel) for quick project overview
- **Linear** — issue grid cards with status indicators and glanceable metrics
- **Raycast** — extension cards with icon, description, stats row
- **VS Code** — start page "Recent" section with repo cards, folder path, icons
- **Dashboard widgets** — macOS widget cards, Notion database cards (compact metric display with icon + number pattern)

Feel consistent with: Grovekeeper's existing `.cb-panel` data panels (control board style), issue cards in workspace dashboard, session status indicators.

## UI Freedom

Designer has creative latitude in:

- **Accent gradient direction and blend mode** — current spec uses 180deg linear, 8% tint, 0–60% stop. Experiment with radial, conic, or different angle/opacity if it reads better
- **Hover animation easing** — spring physics, cubic-bezier, or CSS transition timing
- **LED dot glow parameters** — blur radius, spread, animation timing (current: 3.6s ease-in-out)
- **Stat cell icon style** — any Lucide icon that feels appropriate for each metric (current suggestions: list-checks, git-pull-request, triangle-alert, user)
- **Add Workspace card placeholder style** — dashed border + centered icon is suggested, but alternative empty state treatments welcome
- **Dormant state visual treatment** — opacity + saturation is current spec; alternative: grayscale filter, reduced contrast, faded border

Designer MUST preserve:

- 12-preset accent color palette (identity system)
- Health grid order: Issues → PRs → ATTN → HITL (decision priority)
- 3px left accent bar (primary accent surface)
- Active/breathing animation presence (AFK loop running indicator)
- Dual number format for Issues stat (afk_actionable/total_tracked)

## Not Included

[Explicit scope exclusions]

- Configurable cost period (PRD #93 Metrics)
- Full PRD view/page (new PRD: PRD Management & Visualization)
- Forest thumbnail on card
- Inline issue list
- AFK loop start/stop toggle on overview card

---

## Visual Design

### Card Structure

- Width: 320px (grid column minimum)
- Min-height: 196px
- Padding: 14px 14px 12px
- Background: `linear-gradient(180deg, accent_tint 0%, transparent 60%), var(--surface)`
    - `accent_tint` = `color-mix(in oklch, {accent} 8%, transparent)`
- Border: 1px solid `var(--border)`, radius: `var(--radius-lg)`
- Shadow: `var(--shadow-sm)`
- Left accent bar: 3px, `{accent_color}`, 85% opacity (CSS `::before`)
- Cursor: pointer
- Isolation: isolate (for stacking context)

### Card Component Integration

WorkspaceCard derives from the base `Card` component with two new Card props:

- `accentBarColor?: string` — renders 3px left border in the given color
- `gradientTint?: string` — renders a `::before` pseudo-element gradient overlay

WorkspaceCard handles its own state variants (active/breathing, needs-attention, urgent, dormant, empty) — these are NOT Card-level states.

### Hover State

- Transform: `translateY(-2px)`
- Border: `color-mix(in oklch, accent 50%, var(--border))`
- Shadow: `shadow-md` + 1px accent ring (22% opacity) + 28px accent glow (50% opacity, -10px spread)

### Add Workspace Card

- Dashed border (1.5px), no accent bar, no gradient
- Content: centered `+` circle (36px, `surface-2` bg) + "Add workspace" label (13px, 500 weight)
- No subtitle text
- Hover: border → `moss-400`, text → `moss-300`, subtle moss bg tint, translateY(-2px)

---

## Accent Color System (12 presets)

Workspace accent chosen via `ColorPickerContent` (inline, no dropdown) with 12 presets in a 2×6 grid.

| Name    | OKLCH                    | Hue  | Token                              |
| ------- | ------------------------ | ---- | ---------------------------------- |
| moss    | `oklch(0.580 0.096 134)` | 134° | `--moss-500` (existing)            |
| amber   | `oklch(0.690 0.165 55)`  | 55°  | `--amber-500` (existing)           |
| bark    | `oklch(0.500 0.075 55)`  | 55°  | `--bark-500` (existing)            |
| azure   | `oklch(0.570 0.130 235)` | 235° | `--azure-500` (fix to match token) |
| plum    | `oklch(0.560 0.150 320)` | 320° | NEW `--plum-500`                   |
| teal    | `oklch(0.620 0.110 195)` | 195° | NEW `--teal-500`                   |
| rose    | `oklch(0.640 0.155 15)`  | 15°  | NEW `--rose-500`                   |
| coral   | `oklch(0.620 0.155 30)`  | 30°  | NEW `--coral-500`                  |
| gold    | `oklch(0.650 0.135 90)`  | 90°  | NEW `--gold-500`                   |
| sage    | `oklch(0.600 0.085 160)` | 160° | NEW `--sage-500`                   |
| indigo  | `oklch(0.540 0.140 275)` | 275° | NEW `--indigo-500`                 |
| fuchsia | `oklch(0.580 0.155 350)` | 350° | NEW `--fuchsia-500`                |

Each new color needs a 5-step scale (300–700) following the existing OKLCH pattern. Grid layout:

```
Row 1: moss    amber   gold    coral   rose    fuchsia
Row 2: sage    teal    azure   indigo  plum    bark
```

---

## New Components Required

### StatCell (`src/lib/components/ui/stat-cell/`)

Mini metric display for dashboard cards.

**Props**: `label: string`, `value: number | string`, `tone?: 'neutral' | 'zero' | 'warning' | 'danger'`, `icon?: Component`, `pulse?: boolean`, `onclick?: () => void`

**States**: neutral (default bg), zero (muted everything), warning (amber tint), danger (red tint). Pulse dot animates when `pulse=true` and value > 0.

**Storybook**: all tones, zero vs non-zero, with/without pulse, with/without icon, clickable vs static.

### StatusRow (`src/lib/components/ui/status-row/`)

Horizontal status indicator with LED, label, and right-aligned metadata.

**Props**: `active: boolean`, `label: string`, `meta?: string`, `onclick?: () => void`, `activeColor?: string` (default moss)

**States**: active (glowing LED, tinted border, bold label), inactive (muted LED, muted label).

**Storybook**: active/inactive, with/without meta text, different active colors.

### GithubIcon (`src/lib/components/icons/`)

Stroke-based SVG matching Lucide/Feather style (same path as in `claude_design/icons.jsx`). Props: `size`, `strokeWidth`, `class`. Matches Lucide component API so it blends with other icons.

### VscodeIcon (rewrite)

Replace current stroke-based approximation with proper Simple Icons fill-based SVG (`fill="currentColor"`, no stroke). Props: `size`, `class`. No `strokeWidth` (fill icon).

---

## Grid Layout

- `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`
- Gap: 16px
- Responsive: 1–4 columns depending on window width
- Add Workspace card always last
