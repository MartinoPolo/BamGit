# Workspace Switcher — Design Summary

**Base**: Variant A | **Refined**: 2026-05-26

## Refinements Applied

Variant A was chosen and refined with: design token alignment, selection state consistency with `gk-popover` pattern. Key changes from the base variant: dropdown now uses `--surface` bg + `--border` + `--radius-lg` + `--shadow-lg` matching `gk-popover` exactly; item hover uses `--surface-2` and active/current uses `--primary-soft` matching `gk-popover-item` states; separator uses full-bleed `margin: 6px -8px` matching `gk-popover-divider`; all hardcoded border-radius and transition values replaced with `--radius-*` and `--duration-*` tokens.

## Component Map

### Codebase — Use As-Is

| Component | Path | Usage | Key Props/Variants |
|---|---|---|---|
| DropdownMenu | `src/lib/components/shadcn/dropdown-menu/` | Dropdown wrapper, trigger, content, items, separator, group | `side="bottom"` / `side="right"`, `align="start"` |
| Button | `src/lib/components/shadcn/button/` | Edit + Settings quick-action buttons | `intent="ghost"` `size="icon-sm"` |
| SimpleTooltip | `src/lib/components/shadcn/tooltip/` | Collapsed trigger tooltip | `side="right"` |
| SidebarCollapsedItem | `src/lib/components/derived/sidebar-collapsed-item/` | Reference for collapsed trigger sizing (34×34, `rounded-lg`) | `icon`, `label` |

### Build Custom

| Proposed Name | Description | Why existing components don't cover it |
|---|---|---|
| WorkspaceSwitcher.svelte | Replaces WorkspaceSelector. DropdownMenu trigger + content with workspace list + Overview + navigation methods | Existing WorkspaceSelector is static (no dropdown). This is a composed block component, not a reusable primitive. |

## Implementation Notes

- Dropdown uses DropdownMenu from shadcn/bits-ui (not a custom Popover) for keyboard nav, focus management, escape-to-close
- Trigger uses `{#snippet child({ props })}` pattern on `DropdownMenu.Trigger` to render custom button (not default)
- `side` prop on Content switches between `"bottom"` (expanded) and `"right"` (collapsed) based on `collapsed` prop
- Current workspace detection via `windowContext.boundDashboardId` — compare against each workspace's `dashboard_id`
- Active/current state uses `--primary-soft` background (same token as active nav item `SidebarNavItem.is-active`) — visual consistency between "where I am" indicators across sidebar
- Nav item active hover uses `color-mix(in oklch, var(--primary-soft) 60%, var(--surface-2))` — same mix used in SidebarNavItem.svelte line 84
