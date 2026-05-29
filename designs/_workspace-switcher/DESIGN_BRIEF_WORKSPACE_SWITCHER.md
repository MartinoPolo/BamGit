# Workspace Switcher Dropdown — Design Brief

> **Status**: Refined (Variant A)
> **Refined mockup**: `designs/workspace-switcher/refined.html`
> **Summary**: `designs/workspace-switcher/SUMMARY.md`
> **Refinements**: design token alignment, gk-popover pattern consistency, selection state consistency

The workspace switcher replaces the static workspace name display in the sidebar with an interactive dropdown that lets users navigate between workspaces or return to the Overview page — all within a single window. This is the primary workspace navigation affordance in Grovekeeper's new single-window model (PRD #398).

**Source**: PRD #398, Issue #400
**Gold standard reference**: `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md`

---

## 1. Purpose

In the previous multi-window architecture, each workspace lived in its own window. Users switched workspaces by clicking the overview or taskbar. With the single-window model, the user needs an in-app mechanism to switch workspaces without leaving the current window. The workspace switcher sits in the sidebar — always visible, always accessible — and provides one-click navigation to any workspace or the overview.

**Key value**: Switch workspaces in one click without opening new windows, keeping the experience cohesive and theme-consistent.

---

## 2. Surrounding Context

The mockup **MUST** show the full sidebar with all chrome elements at correct proportions.

### Full Sidebar Structure (top to bottom)

**Sidebar** (`DashboardSidebar.svelte`, 240px expanded / 56px collapsed):

1. **Brand row** (top): BrandMark logo + "Grovekeeper" text + collapse button. Source: `DashboardSidebar.svelte` lines 78-128.
2. **Workspace section** (this component): "WORKSPACE" eyebrow label + workspace selector. Currently static, being replaced by this dropdown. Source: lines 131-151.
3. **Navigation section**: "NAVIGATE" eyebrow label + 3 nav items (Dashboard, Sessions, Usage). Source: lines 153-171.
4. **Spacer**: flex-1 empty area.
5. **User section** (bottom, border-top): UserAvatar + ThemeToggle + Settings gear. Source: lines 176-231.

**Sidebar properties**:
- Background: `bg-sidebar`
- Right border: `border-r border-border`
- Width transition: `transition-[width] duration-4`
- Expanded width: `--sidebar-width: 240px`
- Collapsed width: `--sidebar-width-collapsed: 56px`

**What parent provides**: The sidebar container, the "WORKSPACE" eyebrow label, the `px-2` horizontal padding on the workspace section wrapper.
**What this component fills**: The space after the eyebrow label, within `px-2` padding. Full available width minus padding.
**Must NOT include**: The "WORKSPACE" eyebrow label (parent renders it), the sidebar frame/border, nav items below.

**Mockup rendering instructions**:
- Show the full sidebar at ~240px width with all sections at actual proportions
- Sidebar in FINAL state (show accurately as implemented)
- Show both expanded (240px) and collapsed (56px) states
- Show the dropdown OPEN state with 4-6 workspace items
- Main content area to the right can be a simple dark placeholder

---

## 3. Requirements

### 3.1 Trigger (Expanded Sidebar)

- Trigger area replaces the current static `bg-surface-2 px-3 py-1.5 rounded-lg` container
- Shows: folder icon (text-primary, size 3.5) + workspace name (truncated, 12.5px font-medium) + chevron-down icon
- Clicking anywhere on the trigger opens the dropdown
- Edit (pencil) and Settings (gear) buttons remain alongside the trigger, NOT inside the dropdown — they are workspace-specific quick actions that should always be visible
- Trigger should feel interactive: hover state `bg-surface-hover`, cursor pointer
- Current styling reference: `WorkspaceSelector.svelte` line 26 — `flex items-center gap-1 rounded-lg bg-surface-2 px-3 py-1.5`

### 3.2 Trigger (Collapsed Sidebar)

- Shows folder icon only (matching `SidebarCollapsedItem` pattern — 34×34px rounded-lg, centered icon)
- Clicking opens the same dropdown, positioned to the right of the sidebar (side="right")
- Tooltip on hover: shows workspace name (consistent with other collapsed items)

### 3.3 Dropdown Content

- Uses `DropdownMenu.Content` from shadcn/bits-ui (portaled, `bg-popover`, `rounded-md`, `shadow-md`, `ring-1 ring-foreground/10`)
- Positioned: `side="bottom"` in expanded mode, `side="right"` in collapsed mode
- Width: match trigger width in expanded mode (`w-(--bits-dropdown-menu-anchor-width)`), min 200px in collapsed mode
- Max height: constrain with `max-h-80` (320px) + `overflow-y-auto` for scroll if many workspaces

### 3.4 Dropdown Items

**Group 1: Overview**
- Single item: Home icon + "Overview" label
- Clicking navigates to `/overview` via `navigateToOverview()`
- When the user is currently on Overview (not in a workspace), this item should be visually distinguished (e.g., `bg-accent/15` background or check mark)

**Separator**
- Standard `DropdownMenu.Separator` between Overview and workspace list

**Group 2: Workspaces**
- Group heading: "WORKSPACES" (optional — may be unnecessary given the separator and visual context)
- Each item: folder icon + workspace name
- Current workspace: visually distinguished — check mark icon on the right side (consistent with radio-style selection pattern) OR `bg-accent/15` highlight background
- All other workspaces: default item styling
- Clicking navigates to that workspace via `navigateToWorkspace(id)`
- Item text truncates with ellipsis if workspace name is long

**Future extension zone (issue #401, NOT designed now but layout must accommodate):**
- Workspaces open in another window: will show an `ExternalLink` or `AppWindow` icon indicator on the right
- Bottom separator + "Open in new window" item with external-link icon
- The dropdown layout should leave room for these additions without redesign

### 3.5 Keyboard Navigation

- Standard bits-ui DropdownMenu keyboard support (arrow keys, Enter, Escape)
- No custom keyboard shortcuts needed beyond what DropdownMenu provides

### 3.6 Data

- Workspace list fetched via existing `get_dashboards` Tauri command (already available in board context)
- Each workspace has: `dashboard_id`, `name`
- Current workspace identified by `windowContext.boundDashboardId`
- Overview state identified by `windowContext.isOverview`

---

## 4. States

| State | Visual Treatment | Trigger |
|---|---|---|
| **Default (closed)** | Trigger shows current workspace name + chevron-down. `bg-surface-2` background | Initial render |
| **Hover (closed)** | Trigger background shifts to `bg-surface-hover` | Mouse enter trigger |
| **Open** | Trigger shows pressed state (`bg-surface-hover`), dropdown visible below/beside | Click trigger |
| **Item hover** | Item gets `bg-accent/25` background (standard DropdownMenu focus style) | Mouse/keyboard navigation |
| **Current workspace item** | Check mark icon on right OR persistent `bg-accent/15` tint | Item matches `boundDashboardId` |
| **Overview active** | Overview item has same "current" treatment when user is on Overview page | `windowContext.isOverview === true` |
| **Loading** | Not needed — workspace list is already in memory from board context | — |
| **Empty (no workspaces)** | Should never happen — user is always in a workspace. If somehow occurs, show only Overview item | No dashboards in board store |
| **Collapsed trigger** | Folder icon only, tooltip with workspace name on hover | Sidebar collapsed |
| **Collapsed + open** | Dropdown appears to the right of sidebar | Click collapsed trigger |

---

## 5. Component Reuse Map

### Existing Components (MUST use)

| Component | Variant/Props | Usage in This Design |
|---|---|---|
| `DropdownMenu.Root` | — | Dropdown wrapper |
| `DropdownMenu.Trigger` | `{#snippet child({ props })}` pattern | Custom trigger (not default button) |
| `DropdownMenu.Content` | `side="bottom"` or `side="right"`, `align="start"` | Dropdown panel |
| `DropdownMenu.Group` | — | Group for Overview, group for workspaces |
| `DropdownMenu.Item` | default variant | Each workspace item and Overview item |
| `DropdownMenu.Separator` | — | Between Overview and workspace list |
| `SimpleTooltip` | `side="right"` | Collapsed trigger tooltip |
| `SidebarCollapsedItem` | — | Reference for collapsed state sizing/styling (but trigger is custom since it opens a dropdown, not a link) |
| `Button` | `intent="ghost"` `size="icon-sm"` | Edit (pencil) and Settings (gear) buttons alongside trigger |

### Icons (Lucide path imports)

| Icon | Usage |
|---|---|
| `folder` | Workspace items + trigger icon |
| `home` | Overview item |
| `chevron-down` | Trigger dropdown indicator |
| `pencil` | Edit workspace button (existing) |
| `settings` | Workspace settings button (existing) |
| `check` | Current workspace indicator (if using check mark approach) |

### Components to Design (new)

| Component | Description | Why New |
|---|---|---|
| `WorkspaceSwitcher.svelte` | Replaces `WorkspaceSelector.svelte`. Dropdown trigger + menu with workspace list | Existing component is static; need interactive dropdown with data fetching and navigation |

No new primitives needed — this is composed entirely from existing shadcn DropdownMenu parts.

---

## 6. Layout Constraints

- **Trigger expanded**: Full width of workspace section (240px - 2×8px padding = 224px). Height matches current: `py-1.5` = ~34px.
- **Trigger collapsed**: 34×34px centered in 56px sidebar (matches SidebarCollapsedItem).
- **Dropdown width**: In expanded mode, matches trigger width (~224px). In collapsed mode, minimum 200px.
- **Dropdown max height**: 320px (`max-h-80`). With ~38px per item, this fits ~8 workspaces before scrolling — matches the 2-8 workspace expectation.
- **Item height**: Standard DropdownMenu.Item height (~38px with `px-2 py-1.5`).
- **Icon sizing**: 14-16px for item icons, 14px (size-3.5) for trigger folder icon (matches current).
- **Text**: 12.5px for trigger name (matches current), 13px (`text-sm`) for dropdown items.
- **Spacing**: `gap-2` between icon and text in items (standard DropdownMenu.Item). `gap-1` between trigger elements (matches current selector).
- **Edit/Settings buttons**: Remain outside the dropdown, to the right of the trigger chevron. Same size and style as current (`p-1 rounded text-muted-foreground hover:bg-surface-hover hover:text-foreground`).

---

## 7. Design Tokens

Use the Grovekeeper Forest Moss palette from `designs/tokens.css`:

- **Font**: Geist (sans) for all text
- **Trigger background**: `bg-surface-2` (default), `bg-surface-hover` (hover/open)
- **Dropdown background**: `bg-popover` (standard DropdownMenu)
- **Dropdown border**: `ring-1 ring-foreground/10` (standard DropdownMenu)
- **Item hover**: `bg-accent/25` (standard DropdownMenu focus pattern — safe with all 12 accent colors)
- **Current item highlight**: `bg-accent/15` (subtle tint) or check mark icon in `text-primary`
- **Folder icon**: `text-primary` (moss green accent)
- **Overview home icon**: `text-muted-foreground` (neutral, not accented)
- **Chevron icon**: `text-muted-foreground`
- **Text colors**: `text-foreground` for names, `text-muted-foreground` for secondary
- **Eyebrow label**: `text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle` (matches existing sidebar section labels)
- **Transition timing**: `duration-2` (120ms) for hover states, `duration-1` (90ms) for dropdown appear

---

## 8. Design Constraints (Non-Negotiable)

- **Must use DropdownMenu from shadcn/bits-ui** — not a custom popover or select. DropdownMenu handles keyboard navigation, focus management, escape-to-close, and portal rendering.
- **Edit and Settings buttons must remain visible** alongside the trigger without opening the dropdown. They are high-frequency quick actions.
- **Trigger must fit in 240px sidebar** with room for edit+settings buttons. Name truncates.
- **Collapsed state must use 56px width** and match the visual pattern of `SidebarCollapsedItem` (34×34px, `rounded-lg`, centered icon, tooltip on hover).
- **Standard DropdownMenu item styling** — `focus:bg-accent/25` (never `focus:bg-accent` full, never `text-accent-foreground`). Follow the post-`shadcn add` color contrast rules.
- **Current workspace indicator must be unambiguous** — the user must immediately see which workspace they're in when the dropdown opens.
- **Works in browser mock mode** — no Tauri-only calls in the component itself (navigation methods are mocked upstream).
- **Accessible**: trigger has `aria-label`, items are keyboard-navigable via bits-ui default behavior.
- **No "WORKSPACES" group heading** in the dropdown — the separator between Overview and workspaces is sufficient visual grouping. Adding a heading wastes vertical space in a compact dropdown.

---

## 9. Design Freedom

- **Check mark vs highlight for current item**: Designer can choose between a check mark icon on the right (radio-select pattern) or a persistent `bg-accent/15` background tint, or both. The key constraint is unambiguous identification.
- **Trigger container styling**: The trigger can evolve from the current `bg-surface-2 rounded-lg` to something slightly different if it better communicates "this is a dropdown." For example, a subtle bottom border or different border radius. But it should feel cohesive with the sidebar.
- **Chevron animation**: Optional subtle rotation animation on the chevron when dropdown opens (e.g., rotate 180deg with `duration-2`).
- **Transition/animation on dropdown open**: bits-ui default animations are fine. Designer can adjust timing.
- **Overview item icon choice**: `home` icon is suggested but designer can choose another icon that better represents "overview" (e.g., `layout-grid`, `gauge`).
- **Item density**: Standard DropdownMenu.Item spacing is default. Designer can adjust padding slightly if the dropdown feels too loose or too tight for the sidebar context.
- **Collapsed trigger appearance**: Can use `SidebarCollapsedItem` directly or a custom button that matches its visual style — as long as it opens a dropdown instead of navigating.

---

## 10. Visual References

- **Internal — current workspace selector**: `src/lib/components/blocks/workspace/WorkspaceSelector.svelte` — the static version being replaced. Preserve its visual weight and position.
- **Internal — sidebar nav items**: `src/lib/components/derived/sidebar-nav-item/SidebarNavItem.svelte` — the dropdown items should feel like siblings of these nav items in visual density and icon sizing.
- **Internal — context menu usage**: `src/lib/components/blocks/workspace-card/` — existing DropdownMenu/ContextMenu usage for reference on item styling patterns.
- **Internal — sidebar collapsed items**: `src/lib/components/derived/sidebar-collapsed-item/SidebarCollapsedItem.svelte` — reference for 56px collapsed state pattern.
- **External**: VS Code workspace switcher (bottom-left status bar dropdown), JetBrains project switcher (top toolbar dropdown) — both use simple dropdown lists with current-project indicator.

---

## 11. Not Included (Scope Exclusions)

- **Search/filter field in dropdown** — future iteration if workspace count exceeds 6-8 (explicitly excluded in PRD #398 scope)
- **"Open in new window" option** — belongs to issue #401 (multi-window coexistence), added after this component exists
- **"Open in another window" indicators** — belongs to issue #401, visual indicator for workspaces already open elsewhere
- **Workspace creation from dropdown** — not in scope, users create workspaces from Overview page
- **Workspace reordering** — not in scope
- **Accent color indicators per workspace** — could be a future enhancement (show workspace accent color as a dot or left border) but not in initial scope
