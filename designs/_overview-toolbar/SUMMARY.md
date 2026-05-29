# Overview Toolbar — Design Summary

**Base**: Variant B (Contained Bar) | **Refined**: 2026-05-25

## Refinements Applied

Variant B was chosen and refined with: GitHub icon-only status, Theme Toggle + Settings buttons, sort direction toggle, optional secondary sort, SimpleTooltip examples, DropdownMenu.RadioGroup pattern, component mapping table. Key changes from the base variant: GitHub changed from a text chip to an icon-only ghost button with status dot overlay; Theme Toggle and Settings button added between Footer Settings and GitHub; Sort popover expanded with DIRECTION toggle group and optional THEN BY secondary criteria.

## Component Map

### Codebase — Use As-Is

| Component | Path | Usage | Key Props/Variants |
|-----------|------|-------|---------------------|
| Button | `$lib/components/shadcn/button` | All toolbar triggers, archive toggle | `intent="ghost"` `size="icon-sm"` (26px); archive uses `intent="primary"` when active |
| DropdownMenu | `$lib/components/shadcn/dropdown-menu` | Sort, Filter, Footer Settings popovers | `RadioGroup` + `RadioItem` for single-select with auto check marks |
| DropdownMenu.RadioGroup | `$lib/components/shadcn/dropdown-menu` | Sort direction (Ascending/Descending) inside sort dropdown | Second RadioGroup in the same DropdownMenu, consistent styling with sort mode items |
| Popover | `$lib/components/shadcn/popover` | GitHub status detail (opens GitHubStatusCard) | Trigger is the ghost button with status dot |
| Separator | `$lib/components/shadcn/separator` | Vertical dividers between control groups | Vertical orientation, 16px height |
| SimpleTooltip | `$lib/components/shadcn/tooltip` | Labels on every icon button | `asChild` pattern, `side="bottom"`, `sideOffset={6}` |
| SearchField | `$lib/components/base/search-field` | Workspace name search | Existing component with `Ctrl+F` kbd hint |
| ThemeToggle | `$lib/components/derived/theme-toggle` | Theme switching | `compact` prop for icon-only rendering |
| GitHubStatusCard | `$lib/components/blocks/github` | GitHub detail popover content | Existing component, no changes needed |

### Adopt from shadcn-svelte / Bits UI

None required — all components already available in the project.

### Build Custom

| Proposed Name | Description | Why existing components don't cover it |
|---------------|-------------|----------------------------------------|
| OverviewToolbar | Toolbar composition orchestrating all controls, layout, and spacing | No generic toolbar component exists; layout is specific to the overview page |
| OverviewToolbarContext | Svelte context (`overview-toolbar.context.svelte.ts`) managing sort, filter, search, footer content state | State management for toolbar-specific persisted preferences |

## Implementation Notes

- **Sort DropdownMenu** uses `DropdownMenu.RadioGroup` for the primary sort mode. Below, a `DropdownMenu.Separator` then a second `RadioGroup` for Ascending/Descending direction (same item style, with chevron icons as meta). Optionally (controlled by `secondarySort` prop), another separator + a third `RadioGroup` for "THEN BY" secondary criteria with a "None" default.
- **Secondary sort** is opt-in via a boolean prop on the toolbar component. For the overview page it's disabled (simple workspace sorting doesn't need it). For the Issues tab dashboard, it can be enabled (e.g., sort by priority THEN BY name).
- **GitHub status dot** uses absolute positioning on the ghost button (same technique as `active-dot`). Status is derived from the existing GitHub auth context — no new backend calls needed.
- **Active intent** state for archive toggle uses `intent="primary"` on the Button component. The `--primary` / `--primary-fg` tokens render correctly as moss-400 background with dark foreground text.
- **Sort/filter persistence**: Sort mode + direction + filter mode persist to `localStorage` via `Persisted<T>`. Footer content persists to `app_settings` DB via existing `get_app_setting` / `set_app_setting` Tauri commands. Search query is ephemeral (not persisted).
- **Keyboard navigation**: `Ctrl+F` focuses search field. Tab cycles through toolbar triggers. Enter/Space opens dropdowns. Arrow keys navigate dropdown items. Escape closes dropdown and returns focus to trigger.
- **Reusability for Issues tab**: The DropdownMenu.RadioGroup pattern for sort/filter is the same in both Overview and Issues views. Only the sort mode options differ (Overview: name/activity/issue-count/cost; Issues: priority/name/date). The toolbar component itself is Overview-specific, but the sort/filter dropdown pattern can be extracted into a shared snippet or utility if needed.
