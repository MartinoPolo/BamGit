# Command Context Menus — Design Summary

**Base**: Variant A | **Refined**: 2026-05-18

## Refinements Applied

Variant A was chosen and refined with: icon-only action buttons, bulk run/stop actions in section headers, hybrid badge mode (pills vs circles), clickable overflow popover, port button navigating to log viewer. Key changes from the base variant: text action labels ("Stop", "Re-run", "Run") replaced with 22px icon-only ghost buttons showing hover states; group headers gained FastForward (run all) and Square (stop all) bulk action buttons; port numbers became clickable buttons opening ProcessLogViewer.

## Design Decisions (from grilling)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Badge distinguishability | Hybrid: pills (1-2 results), circles (3+) | Maximizes readability when space permits, compacts when crowded |
| Overflow badge | Clickable → popover listing all results | Natural discovery mechanism for hidden command states |
| Bulk actions | Icon-only (FastForward + Square) in headers | Compact, consistent with per-command button style |
| Port click in submenu | Opens ProcessLogViewer | Developer intent: inspect server state. Browser open stays in badge right-click menu |
| Port click on card badge | Opens browser (existing behavior) | Preserves established left-click = open browser pattern |
| Right-click on card badge | Context menu (View Logs / Kill / Open in Browser) | Full action set without leaving card |

## Component Map

### Codebase — Use As-Is

| Component | Path | Usage | Key Props/Variants |
|-----------|------|-------|--------------------|
| ContextMenu.* | `src/lib/components/shadcn/context-menu/` | All menu structure — Root, Content, Sub, SubTrigger, SubContent, Item, Separator, Portal | `variant="destructive"` for Kill/Stop items |
| Button | `src/lib/components/shadcn/button/` | Icon-only action buttons per command entry and in group headers | `variant="ghost" size="icon-sm"` (22px visible, 26px hitbox) |
| Tooltip | `src/lib/components/shadcn/tooltip/` | Tooltip on bulk action buttons and compact circle badges | Default variant |
| Popover | `src/lib/components/shadcn/popover/` | Clickable overflow badge → results popover | Lightweight, no form content |
| CommandResultBadge | `src/lib/components/derived/command-badges/CommandResultBadge.svelte` | Badge on card — extend with hybrid pill/circle mode | Add `format: 'pill' \| 'circle'` prop |
| ServerPortBadge | `src/lib/components/derived/command-badges/ServerPortBadge.svelte` | Wrap in ContextMenu.Root for right-click | Keep existing left-click behavior |
| Lucide icons | `@lucide/svelte/icons/*` | play, square, rotate-ccw, fast-forward, terminal, x, external-link, circle-check, circle-x, clock | Path imports |

### Build Custom

| Proposed Name | Description | Why New |
|---------------|-------------|--------|
| CommandSubmenuContent.svelte | Renders grouped command entries with state-aware icon buttons, bulk actions, and port buttons | Encapsulates command state → UI mapping, action dispatching, and group layout logic separate from menu container |
| CommandOverflowPopover.svelte | Clickable +N badge that opens popover listing hidden command results | Combines Popover + CommandResultBadge rendering with dynamic count |

## Implementation Notes

- **Button sizing**: Design uses 22px visible area but implementation should use `size="icon-sm"` (26px) for proper touch/click targets. The 22px in the mockup is visual only.
- **Hybrid badge threshold**: Switch from pill → circle mode when `commandResults.length >= 3`. This is a prop on CommandResultsRow, not individual badges.
- **Overflow popover items**: Each item in the popover is clickable and opens the log viewer for that command. Items show state icon + name + status text.
- **Port button in submenu**: Styled as a monospace ghost button that reveals chrome on hover. Click dispatches the same `onViewLogs(processId)` callback. Not a link — it opens the ProcessLogViewer dialog.
- **Stop propagation**: ServerPortBadge's ContextMenu.Root must use `oncontextmenu` with `stopPropagation()` to prevent bubbling to the parent IssueCardContextMenu.
- **Bulk actions visibility**: "Run All" shown when any command in the group is idle/stopped. "Stop All" shown when any command is running. Both can be visible simultaneously for mixed states.
- **Keyboard nav**: bits-ui handles arrow navigation within submenu. Icon buttons should be focusable but not part of the menu item keyboard flow — they act as secondary targets within the highlighted row.
