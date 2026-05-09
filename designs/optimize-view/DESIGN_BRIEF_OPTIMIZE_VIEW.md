# Optimize View (Waste Detection) — Design Spec

Advisory panel within the usage dashboard that scans session history and workspace configuration to detect token waste and configuration issues. Displays findings with actionable fixes and a health score. Inspired by CodeBurn's optimize view, adapted for Grovekeeper's GUI. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Container Context

**Parent**: Usage Dashboard page — advisory section within the dashboard
**What parent provides**: Usage page layout, navigation header, period/scope filters
**What this component fills**: A full-width section within the Usage Dashboard scrollable content
**Must NOT include**: Page-level navigation, period filter bar — these belong to the Usage Dashboard page

**Mockup rendering**: Show the Usage page header as read-only context at ~40% opacity. The designed component fills a section within the page content area.

## Optimize View Purpose

Help users reduce token waste and improve their Claude Code configuration. The view answers: "Am I spending tokens efficiently?" and "What can I fix to save money?"

## Required Elements

### Health Score

- Score: integer 0-100
- Grade: A (>=90) / B (>=75) / C (>=55) / D (>=30) / F (<30)
- Grade color: A/B = green, C = amber/gold, D = orange, F = red/destructive
- Penalty breakdown: `{highCount} high + {medCount} medium + {lowCount} low findings`
- Formula: `max(0, 100 - min(80, sum(penalties)))` where high=15, medium=7, low=3

### Finding Cards (10 detectors)

Each finding shows:

| Field | Description |
|---|---|
| **Impact badge** | `Badge` component: high (destructive), medium (warning/amber), low (muted) |
| **Title** | Finding name (e.g., "Reading junk directories") |
| **Summary** | One-line explanation (e.g., "12 reads into node_modules/ detected") |
| **Token savings** | Estimated tokens saved (e.g., "~7,200 tokens") |
| **Cost savings** | Estimated USD saved (e.g., "~$0.04/session") |
| **Detail** | Expandable: full explanation with specific file/directory names |
| **Fix** | Actionable instruction: copyable command, config snippet, or file content |

### Findings List

- Sorted by urgency: `impact_weight * 0.7 + (tokensSaved / 500_000) * 0.3`
- Grouped or filterable by impact level
- Empty state: "Your configuration is clean!" with health score A

### Detectors (10 total)

| # | Name | Impact | Data Source |
|---|---|---|---|
| 1 | Junk directory reads | High | tool_usage (Read calls to node_modules, .git, dist, etc.) |
| 2 | Duplicate file reads | High | tool_usage (same file_path read multiple times per session) |
| 3 | Low read/edit ratio | High | tool_usage (ratio of reads to edits, healthy >= 4:1) |
| 4 | Cache bloat | High | turn_metrics (cache_creation_tokens median vs baseline) |
| 5 | Unused MCP servers | Medium | tool_usage + filesystem (~/.claude/settings.json) |
| 6 | Bloated CLAUDE.md | Medium | Filesystem (line count with @-import expansion) |
| 7 | Ghost agents | Medium | tool_usage + filesystem (~/.claude/agents/) |
| 8 | Ghost skills | Medium | tool_usage + filesystem (~/.claude/skills/) |
| 9 | Ghost commands | Medium | turn_metrics (user messages) + filesystem (~/.claude/commands/) |
| 10 | Bash output limit | Low | Filesystem (shell profile check) |

## Reusable Components

- `Card.Card`: finding cards, health score card
- `Badge`: impact level indicators (high=destructive, medium=warning, low=secondary)
- `Button`: "Copy fix" action buttons
- `Collapsible` or `Accordion`: expandable detail sections
- `SimpleTooltip`: hover explanations on scores and metrics
- `cn()`: conditional styling based on grade/impact

## Components to Adopt

- Consider `Progress` from shadcn-svelte for health score ring visualization
- Consider `Accordion` from shadcn-svelte for expandable findings

## Layout Constraints

- Full width within the usage page content area
- Health score section: fixed height (~80px), always visible
- Findings area: scrollable, no fixed height limit
- Finding cards: minimum 300px width, responsive grid or list
- Copy buttons: `icon-sm` size, right-aligned within fix section

## States to Explore in Variants

- Score A: all green, 0-1 findings (clean config)
- Score C: mixed findings, amber overall tone
- Score F: many high-impact findings, red urgent tone
- Single finding expanded with fix detail visible
- Empty state (no session data to analyze)

States to design after variant selection:
- Loading state (analyzing session history)
- Finding with copyable command (hover to reveal copy button)
- Finding with multi-step fix instructions
- Dark mode appearance for all grade colors

## Visual References

- CodeBurn optimize view: `C:/_MP_github_cloned/codeburn/src/optimize.ts` (findings, scoring, fix text)
- StatCell component: `src/lib/components/ui/stat-cell/` (tone variants: neutral/warning/danger)
- Badge component: `src/lib/components/ui/badge/` (impact level indicators)

## UI Freedom

- Health score visualization (number only, ring chart, gauge, letter grade prominence)
- Finding card layout (compact list vs spacious cards)
- How the fix section is revealed (accordion, slide-out, modal)
- Whether findings can be dismissed/acknowledged
- Animation on initial score calculation
- Whether the grade letter uses a circular background or standalone

## Not Included

- Auto-fixing (findings are advisory, user applies fixes manually)
- Historical score tracking (no trend line for score over time)
- Per-workspace optimize scoring (global only in v1)
- Integration with Claude Code CLI for automated fix application
