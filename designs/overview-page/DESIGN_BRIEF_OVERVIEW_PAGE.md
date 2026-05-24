# Overview Page Liveliness - Design Brief

The Overview page is Grovekeeper's startup surface: a multi-workspace launcher showing workspace health cards and global controls. This exploration keeps the current information model and refines the radial understory visual system for the full page and the workspace card.

## Context

- Parent route: `src/routes/overview/+page.svelte`
- Primary card: `src/lib/components/blocks/workspace-card/WorkspaceCard.svelte`
- Add card: `src/lib/components/blocks/workspace/AddWorkspaceCard.svelte`
- Data source: `OverviewWorkspaceData`
- Grid: `repeat(auto-fill, 340px)`, 16px gap, no sidebar, no forest view
- Current header controls: theme toggle, settings, archive toggle, GitHub connection

## Goals

- Make the startup page feel alive and unique without reducing scan speed.
- Preserve current card shape, density, and displayed information.
- Remove the left-border accent treatment for these concepts. It reads like an active slot indicator.
- Give the top-right controls styling that belongs to the same system as the cards.
- Continue only the radial understory direction from Variant C.

## Required Page Elements

- Page title: Grovekeeper
- Subtitle: Your workspaces
- Top-right controls: theme, settings, archive, GitHub connection
- Mockup theme preview links: `?theme=dark` and `?theme=light`
- Workspace card grid with at least these states:
  - Healthy/default
  - Dormant
  - Active AFK loop
  - Needs attention / HITL
  - Urgent PR attention
  - Active AFK loop with sessions
  - Active AFK loop idle
  - Missing configuration
  - Archived
  - Empty/new workspace
  - Add workspace card
- Bottom summary area:
  - Cost and usage summary sourced from the existing Usage page metrics
  - Recent activity list

## Required Workspace Card Data

- Workspace initials or mark
- Workspace name
- Branch and worktree count
- GitHub and folder icon actions
- Four stats in order: Issues, PRs, ATTN, HITL
- Issues stat uses actionable/total format
- PRD progress row when PRD data exists
- AFK status row with active/inactive/session meta
- Footer with today's cost and last activity

## Design Constraints

- Dark theme is primary; light theme may be hinted but not required.
- Use Geist and Geist Mono.
- Reference `../../tokens.css`; do not inline token definitions.
- Use `gk-root theme-dark`, `gk-*`, and `cb-*` classes where practical.
- Keep cards readable at 340px.
- Do not use heavy marketing hero layout. This is a developer launcher.
- Do not use decorative orbs/blobs.
- Use the Grovekeeper forest/tooling identity: moss, bark, amber, repo/worktree/session language.
- Use the issue-card radial/gradient inspiration with restraint: the gradient provides identity, while stat cells remain plain and legible.
- Bottom summary must reuse Usage page concepts instead of creating a separate "workspace forest health" concept:
  - Total cost with delta
  - Session count
  - One-shot rate
  - Cache hit ratio / savings
  - Cost trend
  - Tool usage
  - Recent activity

## Variant Direction

### Variant C - Radial Understory

Inspired by issue-card v2 variant C: color blooms from the lower-left / workspace mark area. Cards use radial emanation, inner glow, and richer depth while keeping stats plain and legible.

The bottom section combines compact Usage page metrics with recent activity so wide Overview layouts do not feel empty. It is an overview glance surface, not a replacement for `/usage`; values should link or navigate to `/usage` when implemented.

## Output

Create and refine `designs/overview-page/variants/variant-c.html`.

The HTML file must be self-contained except the shared `../../tokens.css` stylesheet.
