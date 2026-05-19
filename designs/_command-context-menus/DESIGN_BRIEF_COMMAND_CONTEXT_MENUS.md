# Command Context Menus & Badge Interactions — Design Brief

> **Status**: Refined (Variant A)
> **Refined mockup**: `designs/command-context-menus/refined.html`
> **Summary**: `designs/command-context-menus/SUMMARY.md`
> **Refinements**: icon-only action buttons, bulk run/stop in headers, hybrid badge pills/circles, clickable overflow popover, port button → log viewer

Add the user-facing interaction layer for running, stopping, and inspecting workspace commands from issue cards. The "Commands" submenu in the issue card context menu is the primary trigger; badge context menus provide quick actions on running processes.

**Source**: PRD #339, sub-issue #341
**Gold standard reference**: `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md`

---

## 1. Purpose

Users need a way to launch workspace commands (dev servers, test suites, linters) and manage running processes directly from issue cards. The context menu is low visual noise and matches the established right-click pattern used throughout Grovekeeper. Badge context menus provide shortcut actions on visible process indicators.

**Key value**: Run, stop, and inspect workspace commands without leaving the dashboard or switching to a terminal.

---

## 2. Surrounding Context

Context menus float above the dashboard as overlays. They trigger from right-clicking issue cards (existing pattern) and right-clicking badges within cards.

### Full Viewport Structure

**Left Sidebar** (~240px, FINAL STATE):
- Brand mark, workspace selector
- Nav: Dashboard, Sessions, Usage, Settings
- Source: `DashboardSidebar.svelte`

**Main Area**:
- TopBar (FINAL) + Forest (~25%) + Resizer + Bottom Panel (~75% with card grid)
- Context menu overlays float above everything via bits-ui portal

**What parent provides**: `IssueCardContextMenu.svelte` wraps the card in a `ContextMenu.Root`
**What this component adds**: A "Commands" submenu within the existing context menu structure + a new `ContextMenu.Root` on ServerPortBadge
**Must NOT include**: Dialog components (ProcessLogViewer is #342's scope — wire "View Logs" as a callback)

**Mockup rendering instructions**:
- Show an issue card with the context menu open, "Commands" submenu expanded
- Show the submenu with 2-3 server commands and 2-3 check commands, various states
- Show a separate view: ServerPortBadge right-click context menu (3 items)
- Dark theme, Refined Horizon card variant

---

## 3. Requirements

### 3.1 Commands Submenu in IssueCardContextMenu

Add a "Commands ▸" submenu item to the existing `IssueCardContextMenu.svelte`.

**Position in menu**: After the "Actions" submenu, before the separator that leads to Edit/Rename. This groups all execution-related items together.

**Menu structure**:
```
Select / Deselect
───────────────────
Actions ▸
Commands ▸          ← NEW
───────────────────
Edit
Rename (standalone only)
Priority ▸
Change Color
───────────────────
Setup / Remove Worktree
Archive / Unarchive
Delete
```

**Submenu content**:
- **Server commands group** (top): commands where `category = 'server'`
- **Separator**
- **Check commands group** (bottom): commands where `category = 'check'`
- Each group has a subtle label header: `SERVERS` / `CHECKS` (eyebrow style, `gk-eyebrow`)

**When no commands are configured**: The "Commands ▸" submenu item is **hidden entirely** (not disabled).

### 3.2 Submenu Entry States

Each command entry shows different content and actions based on its process state:

| Command State | Left Content | Center | Right Content | Available Actions |
|--------------|-------------|--------|---------------|-------------------|
| **Idle** (no process) | Subtle dot + name | — | Play button | Click row or button → Run |
| **Running** (server) | Green dot + name | Port button | Stop button | Click row → View Logs, port → Log Viewer, stop → Kill |
| **Running** (check) | Spinner + name | — | Stop button | Click row → View Logs, stop → Kill |
| **Passed** | Green CircleCheck + name | — | RotateCcw button | Click row → View Logs, button → Re-run |
| **Failed** | Red CircleX + name | — | RotateCcw button | Click row → View Logs, button → Re-run |
| **Timeout** | Orange Clock + name | — | RotateCcw button | Click row → View Logs, button → Re-run |
| **Stopped** | Gray Square + name | — | Play button | Click row or button → Run |

**Entry layout** (each row):
```
[StateIcon 16px] [CommandName]   [:port]   [ActionButton 22px]
```

- State icon: matches CommandResultBadge icons (CircleCheck, CircleX, Clock, Square, spinner, green dot)
- Command name: regular text, truncated if needed
- Port button (servers only): monospace ghost button, click opens ProcessLogViewer
- Action button: icon-only ghost button (`size="icon-sm"`). Play (run), Square (stop, destructive hover), RotateCcw (re-run)
- Primary click on the row: the more common action (View Logs when running/completed, Run when idle/stopped)

**Button hover states**:
- Run (Play): default muted → hover neutral background
- Stop (Square): default muted → hover red background + red icon (destructive)
- Re-run (RotateCcw): default muted → hover neutral background
- Run All (FastForward): default muted → hover green background (success)
- Port (:1420): transparent → hover subtle border + background chrome

**Stop action**: When user clicks Stop button on a running command:
- Calls `killProcess(processId)` from process context
- Badge on the card updates to stopped state
- Entry in submenu updates to stopped state with Play button

### 3.2b Bulk Actions in Group Headers

Each group header (SERVERS / CHECKS) includes icon-only bulk action buttons:

```
SERVERS                    [▶▶ Run All] [■ Stop All]
```

| Button | Icon | Hover | Shown When |
|--------|------|-------|------------|
| Run All | `fast-forward` (lucide) | Green background (success) | Any command in group is idle/stopped |
| Stop All | `square` (lucide) | Red background (destructive) | Any command in group is running |

Both buttons can be visible simultaneously for mixed states. Each has a Tooltip explaining the action.

### 3.3 ServerPortBadge Context Menu

A new right-click context menu directly on the ServerPortBadge component within the card body.

**Trigger**: Right-click on the green dot + port badge in Row 4
**Structure** (3 items, no groups):

```
View Logs
Kill
───────────────────
Open in Browser
```

| Item | Icon | Action |
|------|------|--------|
| View Logs | `Terminal` (lucide) | Opens ProcessLogViewer dialog (callback to #342) |
| Kill | `X` (lucide) | Calls `killProcess(processId)`, badge disappears |
| Open in Browser | `ExternalLink` (lucide) | Opens `http://localhost:{port}` via `openUrl()` |

**Separator**: Between Kill and Open in Browser — Kill is destructive-adjacent, Open in Browser is navigation.

### 3.4 Keyboard & Accessibility

- Context menu items are keyboard-navigable (bits-ui default)
- Submenu opens on arrow-right, closes on arrow-left (bits-ui default)
- Each menu item has appropriate `aria-label` describing the action
- "Stop" / "Kill" items use `variant="destructive"` styling (red text) in the context menu

---

## 4. States

### Commands Submenu Trigger States

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Visible | "Commands ▸" with icon in menu | Workspace has ≥1 command configured |
| Hidden | Not rendered | Workspace has 0 commands |
| Highlighted | Standard bits-ui highlight (`data-highlighted`) | Keyboard/mouse navigation |

### Submenu Entry States

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Idle | Plain text, no state icon (or subtle dash) | No process running for this command |
| Running (server) | Green dot + port, "Stop" action | Active server process |
| Running (check) | Spinner icon, "Stop" action | Active check process |
| Passed | Green CircleCheck icon, "Re-run" action | Process exited code 0 |
| Failed | Red CircleX icon, "Re-run" action | Process exited non-zero |
| Timeout | Orange Clock icon, "Re-run" action | Process timed out |
| Stopped | Gray Square icon, "Run" action | User killed process |
| Highlighted | Background highlight (bits-ui default) | Keyboard/mouse focus |

### ServerPortBadge Context Menu States

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Open | 3-item menu at badge position | Right-click on badge |
| Kill hover | Red text (destructive variant) | Hovering "Kill" item |

---

## 5. Component Reuse Map

### Existing Components (MUST use)

| Component | Variant/Props | Usage in This Design |
|-----------|--------------|---------------------|
| `ContextMenu.Root/Content/Item/Sub/SubTrigger/SubContent/Separator/Portal` | From `$lib/components/shadcn/context-menu` | All menu structure |
| `ContextMenu.Item variant="destructive"` | Red text styling | Kill/Stop items |
| Lucide icons (path imports) | `size-4` class | State icons and action icons |

### Components to Modify

| Component | Change | Rationale |
|-----------|--------|-----------|
| `IssueCardContextMenu.svelte` | Add "Commands" submenu section | New feature integration |
| `ServerPortBadge.svelte` | Wrap in `ContextMenu.Root` for right-click | Badge needs its own context menu |

### New Components

| Component | Description | Why New |
|-----------|-------------|---------|
| `CommandSubmenuContent.svelte` | Renders the Commands submenu entries with state-aware items | Encapsulates command-fetching, state-checking, and action-dispatching logic separate from the menu container |

---

## 6. Layout Constraints

- Context menu min-width: 220px (`min-w-[220px]`, matches `gk-popover`)
- Submenu entries: icon (16px) + gap (8px) + name (flex-1) + action label (auto)
- Entry height: matches ContextMenu.Item default (~32px)
- Group labels: `gk-eyebrow` style (10.5px uppercase, `--foreground-subtle`)
- ServerPortBadge context menu: 3 items, no group labels, standard sizing
- Portal: submenu uses `ContextMenu.Portal` for correct z-indexing (standard bits-ui pattern)
- Submenu offset: `alignOffset={0} sideOffset={10}` (matches existing Priority submenu)

---

## 7. Design Tokens

| Token | Usage |
|-------|-------|
| `--status-success` | Running server dot, passed icon |
| `--status-danger` | Failed icon, Kill/Stop destructive text |
| `--status-warning` | Timeout icon |
| `--status-info` | Running check spinner |
| `--foreground-subtle` | Stopped icon, group labels |
| `--foreground-muted` | Action labels (Stop, Re-run, Run) |
| `--surface` | Menu background |
| `--border` | Menu border, separators |
| `--surface-2` | Highlighted item background |

---

## 8. Design Constraints (Non-Negotiable)

- Must use bits-ui `ContextMenu` primitives (established pattern in codebase)
- "Commands" submenu hidden when no commands exist — not disabled, not empty
- Server commands grouped above checks with separator (PRD decision)
- "Kill" and "Stop" actions use destructive variant styling
- ServerPortBadge right-click must NOT interfere with left-click (which opens browser)
- Menu items must be keyboard-accessible (bits-ui handles this)
- Stop propagation: badge context menu must not trigger card context menu
- View Logs wires to a callback (ProcessLogViewer not built yet in this issue's scope)

---

## 9. Resolved Design Decisions

- **Submenu trigger icon**: TerminalSquare (matches terminal/command semantics)
- **Idle commands**: Show subtle dot icon (low opacity)
- **Action controls**: Icon-only ghost buttons (`size="icon-sm"`, 22px visible). Play = run, Square = stop, RotateCcw = re-run
- **Port display**: Separate clickable button after name, monospace, opens log viewer on click
- **Bulk actions**: FastForward + Square icon buttons in section headers
- **Badge mode on card**: Hybrid — pills with abbreviated name (1-2 results), compact circles (3+ results)
- **Overflow badge**: Clickable `+N` badge → Popover listing all hidden command results with state icon + name + status
- **Animation**: bits-ui default submenu transition

---

## 10. Visual References

- **Internal**: `src/lib/components/blocks/issue-card/IssueCardContextMenu.svelte` — existing context menu with Actions and Priority submenus (205 lines, established pattern)
- **Internal**: `src/lib/components/shadcn/context-menu/` — bits-ui context menu primitives
- **Internal**: `src/lib/components/derived/command-badges/ServerPortBadge.svelte` — badge needing right-click
- **DECISIONS.md**: "Command trigger via context menu submenu" (2026-05-18)
- **DECISIONS.md**: "Context menu: bits-ui ContextMenu, hybrid behavior" (2026-05-04)

---

## 11. Not Included (Scope Exclusions)

- ProcessLogViewer dialog (opened by "View Logs") — covered by #342
- Badge visual states (running/passed/failed/timeout/stopped) — covered by #340's brief
- Process context module and event subscriptions — backend/state architecture, not visual
- Command test button in settings — covered by #344
- Terminal mode launch — no context menu entry needed (terminal mode commands don't track)
