# Overview Window — Workspace Card Spec

Design spec for the workspace cards displayed in the Overview (multi-workspace launcher) window. Each card represents one configured workspace. Hand this to a designer for visual exploration.

## Card Purpose

Quick-glance health overview of a workspace. Click opens/focuses that workspace's window. The card should feel like a living dashboard widget, not a static list item.

## Required Data Points

### Identity

- **Workspace name** — equals the repository name (e.g., "Grovekeeper")
- **Accent color** — prominently visible as card background tint, border, or gradient. Each workspace has a distinct color. Should be the dominant visual differentiator between cards.
- **Custom thumbnail** — optional project icon/SVG uploaded by user. Placeholder when unset.

### Quick Access Buttons

- **GitHub link** — GitHub icon button, opens the repo URL in browser
- **Local folder** — Folder icon button, opens the project path in file explorer
- Both should be small, icon-only, positioned consistently (e.g., top-right corner or in a button row)

### Health Indicators (counts with icons)

- **Open PRs** — count of open pull requests
- **Open issues** — count of open GitHub issues (total tracked by Grovekeeper)
- **Pending HITL** — count of issues labeled HITL awaiting user resolution. This is the most important health signal. Should stand out visually (warning color, badge). Clicking navigates directly to the HITL grilling view.
- **PRs needing attention** — count of PRs with merge conflicts or behind-base. Distinct from "Open PRs" — this signals urgency.

### Status Indicators

- **AFK loop status** — on/off indicator (toggle-like or badge). When on, the workspace is autonomously processing issues. This replaces "active sessions count" as the primary activity signal.
- **Active sessions** — optional/secondary. If AFK is on, the session count is implied. Show only when informative (e.g., "3 running").
- **Last activity** — relative timestamp ("2m ago", "3h ago", "yesterday"). Signals whether the workspace is alive or dormant.

### Metrics

- **Cost today** or **Cost this week** — total USD spent on AI sessions. Small, monospace, bottom of card. Period configurable globally (today vs this week vs this month).

## Visual Hierarchy (suggested, designer should explore alternatives)

1. **Accent color** — most prominent (background tint, left border stripe, or gradient)
2. **Workspace name** — large, bold
3. **HITL count** — attention-grabbing when >0 (pulsing badge, warning color)
4. **AFK loop status** — visible but not dominant
5. **PR/issue counts** — secondary, compact row of icon+number pairs
6. **Quick access buttons** — small, top-right or bottom row
7. **Last activity + cost** — tertiary, bottom of card, muted

## Layout Constraints

- Grid layout, responsive columns (2-4 per row depending on window width)
- Cards should be roughly 280-360px wide
- "Add workspace" card at the end (dashed border, + icon)
- Cards should have hover state (slight lift/glow)
- Clicking any card area (except buttons) opens that workspace

## States to Design

- **Default** — healthy workspace, AFK off, no HITL
- **Active** — AFK on, sessions running (subtle animation or glow)
- **Needs attention** — HITL pending, pulsing/warning treatment
- **Urgent** — merge conflicts or behind-base PRs, danger treatment
- **Dormant** — no activity in >24h, slightly muted
- **Empty** — newly created, no issues tracked yet
- **Hover** — interactive lift/highlight
- **Add workspace** — dashed placeholder card

## Not Included

- Forest thumbnail (deferred — may add custom project icon later)
- Current branch display
- Detailed session list
- Inline issue cards
