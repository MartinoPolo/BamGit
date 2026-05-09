# Bottom Panel Multi-Panel Layout — Design Spec

Configurable multi-panel layout for the workspace dashboard bottom panel. Allows displaying multiple views side-by-side (Issues + Issue Detail, Issues + Session, etc.). Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Container Context

**Parent**: `WorkspaceDashboardLayout` — the bottom section of the vertical paneforge split
**This component IS the bottom panel container** — it owns the tab bar, panel chrome, resizer handle, and layout management. Child tab content components (Issues, Session, Assigned Issues, etc.) fill the content area that this component provides.

## Layout Purpose

Enable viewing multiple perspectives simultaneously — e.g., issue list on the left while inspecting issue detail on the right, or watching a session while browsing dependencies. Reduces tab-switching friction.

## Required Elements

### Layout Presets (7+)

| Preset | Description | Panel Count |
|--------|-------------|-------------|
| Single | One full-width panel | 1 |
| Side-by-side | Two horizontal panels | 2 |
| Quad | Four equal panels (2×2) | 4 |
| Top-merged | One panel top, two bottom | 3 |
| Bottom-merged | Two panels top, one bottom | 3 |
| Left-merged | One panel left, two right | 3 |
| Right-merged | Two panels left, one right | 3 |

### Per-Panel Controls

- Tab bar showing available views: Issues, Kanban, Issue Detail, Dependencies, Activity, Session, Assigned Issues
- Active tab indicator
- Panel can show any view independently
- Duplicate views allowed across panels

### Panel Resizing

- Resizable borders between panels (paneforge)
- Drag handles visible on hover
- Minimum panel size enforced

### Smart Defaults

- Session spawned from issue card → auto-switch to side-by-side, Session view in right panel
- Issue activated → if second panel exists, show Issue Detail there
- First launch: Single panel

### Layout Persistence

- Per-workspace, stored in DB
- Remembers which view each panel was showing
- Restores on workspace reopen

## Reusable Components

- PaneForge `PaneGroup` + `Pane` + `PaneResizer` for resizable splits
- Tabs from bits-ui for per-panel tab bars
- StyledPaneResizer: existing styled resizer component
- All existing tab content components (IssueCardList, DependencyGraphView, etc.)

## Components to Adopt

- Consider: nested PaneForge groups for quad/three-panel layouts

## Layout Constraints

- Minimum panel size: 200px width, 150px height
- Tab bar height: 36px per panel
- Total bottom panel min-height: 20% of viewport (existing constraint)
- Must work with forest panel above (vertical split unchanged)
- Reference: existing `WorkspaceDashboardLayout.svelte` for vertical split pattern

## States to Explore in Variants

Initial variants should show:
- Side-by-side layout (most common use case)
- Layout switcher popover/UI
- Dark mode

States to design after variant selection:
- Quad layout with 4 different views
- Three-panel layouts (all 4 merge variants)
- Panel being resized (drag state)
- Narrow viewport where quad becomes impractical
- Empty panel (no view selected)
- Layout transition animation

## Visual References

- VS Code panel splits — resizable, tab-per-panel
- `WorkspaceDashboardLayout.svelte` — existing vertical paneforge split
- `WorkspaceBottomPanel.svelte` — existing tab system to extend

## UI Freedom

- Layout switcher placement and interaction pattern
- Visual style of layout preset thumbnails
- Whether tab bars are full-width or compact per panel
- Panel border/separator styling
- Transition animation when switching layouts
- Whether panels can be individually collapsed

## Not Included

- Drag-and-drop panel reordering
- Saving custom layout presets beyond the 7+ built-in
- Floating/detachable panels
- Panel maximization (double-click to full-width)
