# Assigned Issues Panel — Design Spec

Redesign of the assigned issues display, moving from a collapsible section within the Issues tab to a dedicated tab in the bottom panel. Shows GitHub issues assigned to the current user with quick-import actions. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Generate Three Distinct Variants

Three structurally different approaches to displaying assigned issues. All must include every required element listed below.

**Variant A — Compact List**: Dense issue rows similar to GitHub's issue list. Each row shows essential info in a single line with action buttons on hover. Grouped by repository or PRD.

**Variant B — Card Tiles**: Small card tiles in a responsive grid (narrower than issue cards). Each tile shows issue identity + key badge + one-click action. Optimized for scanning and quick-adding multiple issues.

**Variant C — Kanban Lanes**: Three lanes: Unlinked (not in Grovekeeper), Recently Deleted (removed from dashboard, available for re-add), Already Linked (in dashboard). Each lane is a scrollable column with compact issue entries.

## Panel Purpose

Quick import of GitHub-assigned issues into the Grovekeeper workspace. The user sees what's assigned to them and can create a Grovekeeper issue (with or without worktree) in one click, bypassing the full creation wizard.

## Required Elements

### Per Issue Row/Card

- PRD number (if the issue is a sub-issue of a PRD)
- GitHub issue number (`#123`)
- Issue title (truncated)
- GitHub labels (compact badges, first 2-3)
- Issue state indicator (open/closed dot)
- Repository name (if showing cross-repo assigned issues)

### Quick Actions

- **Quick add** (Plus icon): Creates Grovekeeper issue with auto-filled name, GitHub link, next color. No worktree. One click, no wizard.
- **Quick add with worktree** (GitBranch icon): Same as above + auto-creates worktree. One click.
- Both actions bypass the creation wizard entirely (pre-defined options)

### Categories

- **Unlinked**: Not yet in the Grovekeeper dashboard. Primary focus. Full opacity, prominent actions.
- **Deleted**: Previously added to dashboard but removed. Available for re-add. Shown under separator with context.
- **Already linked**: In the dashboard. Shown at reduced opacity under separator with "Already linked" heading.

### Pagination

- "Load more" button or infinite scroll for large assigned issue lists
- Issue count in tab label: "Assigned Issues (12)"

## Reusable Components

- Button: `.gk-btn-sm` (26px) for quick-add actions, `.gk-btn-ghost` for row-level actions
- Badge: `.gk-badge` for GitHub labels and state indicators
- Tabs: bottom panel tab system (new tab entry)

## Components to Adopt

- Consider: Virtual scroll for long lists (svelte-virtual-list)

## Layout Constraints

- Tab content area: full width of its panel in multi-panel layout
- Issue row height: 36-40px (compact)
- Must work in narrow panels (multi-panel side-by-side)
- Reference: `.gk-btn-sm` (26px), `.gk-badge` (20px)

## States to Explore in Variants

Initial variants should show:
- Mix of unlinked, deleted, and linked issues (8-12 total)
- Hover state with visible action buttons
- Dark mode

States to design after variant selection:
- Empty state (no assigned issues)
- Loading state (fetching from GitHub)
- Error state (gh not authenticated)
- After quick-add action (issue moves from unlinked to linked)
- Narrow panel width (multi-panel layout)

## Visual References

- `AssignedIssuesPanel.svelte` — current implementation (baseline)
- GitHub Issues list — compact issue row pattern
- `IssueCard.svelte` — data elements and badge components to reuse

## UI Freedom

- Row vs card vs tile layout
- Grouping strategy (by repo, by PRD, by state, flat)
- Action button placement (hover-reveal vs always visible)
- Animation on quick-add (issue sliding to linked section)
- Whether to show issue body preview on hover/expand

## Not Included

- Full issue editing (use main Issues tab or Issue Detail for that)
- Cross-repository issue management (future feature)
- Issue creation wizard integration (this bypasses the wizard)
- Assigned PR display (separate concern, shown in PRs tab)
