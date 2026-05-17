# Grovekeeper Context

## What This Is

Desktop AI agent orchestration platform for developers running parallel Claude Code / Cursor / Codex / OpenCode sessions across GitHub issues. Built with Tauri v2 (Rust) + SvelteKit (Svelte 5, SPA mode) + SQLite. Visualizes issues as trees in a forest — lifecycle stages, blocking relationships, and execution state are all rendered as botanical metaphors.

## Domain Language

**Workspace** — Top-level container: one GitHub repo + one project folder + one window.
**Overview** — Multi-workspace launcher view showing all workspaces as cards with health indicators.
**Issue** — Atomic work unit. One GitHub issue, one worktree, one branch, one color. Priority defaults to medium.
**Session** — One AI agent CLI execution tied to an issue. Has transcript, cost, turns, state. Multiple per issue.
**Provider** — AI agent CLI backend (Claude Code, Cursor, Codex, OpenCode). Each session runs on one provider.
**Issue Environment** — Per-issue bundle: worktree folder, editor instance, terminal session.

_Avoid_: "task" for Issue, "project" for Workspace, "run" for Session.

**Worktree** — Git worktree checked out for an issue's branch. One-to-one with an issue. Stored in `{parent}/{name}-worktrees/`.
**Forest** — Visual metaphor for issue state. Each tree = one issue. PRD tree at center, blocking = depth rows. Default landing page.
**Tree Stage** — 12 lifecycle stages: seed → sprouting → sapling → growing → leafy → flowering → fruiting → seasonal → wilting → bare → dead → stump.
**Badge** — Color-coded status indicator on issue cards. Types: branch, PR, GitHub state, sync, merge conflict.
**Glow Overlay** — Visual emphasis (SVG blur on trees, CSS box-shadow on cards) using the issue's own color.

**Active (issue)** — Single-click inspect. One at a time. Shows details in bottom panel. Green glow. No toggle-off.
**Selected (batch)** — Multi-select for bulk ops (Ctrl/Shift+click, right-click, long press). Blue glow. Windows Explorer range pattern.

_Avoid_: "selected" for single-click inspect, "active" for batch selection.

**AFK** — GitHub label: autonomous execution. AFK loop auto-spawns sessions for AFK-labeled issues.
**HITL** — Human-In-The-Loop label. One-way flip to AFK after resolution. Never flips back.
**Effort** — Per-session model reasoning intensity (Low / Medium / High / off).
**Stopped** — Session halted by user (renamed from "paused" — no native pause exists in CLIs).

**Skill** — Named Claude Code slash command (`/mp-execute`, `/mp-review`). Clickable in UI, browsable in AI Config.
**Agent Skills Standard** — Cross-provider open standard (agentskills.io) for portable AI agent skills.
**Discovery Source** — Filesystem location scanned for AI config items. Types: User, Project, Custom (with editable labels).
**Skill Override** — Per-workspace skill visibility control in `.claude/settings.local.json`.
**Rules** — Per-language/pattern context files loaded by providers (`.claude/rules/`, `.cursor/rules/`, `.opencode/rules/`).

**Deep Module** — Ousterhout pattern: small interface, large implementation. Each module exposes `use{Feature}()` factory.
**Design Token** — OKLCH CSS custom property in `app.css` under `@theme inline`. Semantic tokens swap via `[data-theme]`.
**Accent Color** — Theme applied via `data-accent` on `<html>`. 12 presets. Overrides `--primary`, `--accent`, `--ring`.
**State Mapping** — Priority-ordered rule table for tree stage, accessories, overlays, glow, animations. See `.mpx/STATE_MAPPING.md`.

**CESP** — Common Event Sound Protocol. Manifest format from peon-ping for notification sound packs.
**Character Pack** — Per-issue character with avatar + sound assignments for 15 notification events.
**Execution Phase** — Current step in an active session: analyzing, tdd, reviewing, testing, fixing, shipping.
**Sub-Agent Bird** — Visual bird on tree canopy for spawned sub-agents. Six types: owl, robin, sparrow, cardinal, hummingbird, parrot.

**Creation Wizard** — 5-step keyboard-driven modal: GitHub search → name → worktree → color → progress.
**Command Palette** — `Ctrl+K` overlay. Fuzzy search across actions, navigation, issues. Consumes action registry.
**Action Registry** — Module maintaining executable actions. Auto-appear in command palette with keyboard shortcuts.
**Quick Ideas** — `Ctrl+Shift+I` modal for raw notes into `.mpx/RAW_REQUIREMENTS.md`.
**Priority** — Issue importance: lowest/low/medium/high/top. Medium = default, no badge. Clickable on card to change.

## Relationships

- A **Workspace** has many **Issues** (1:N). One window per workspace.
- An **Issue** has many **Sessions** (1:N), one **Worktree** (1:1), one **Character Pack** (1:1).
- A **Session** runs on one **Provider** (N:1).
- A **Provider** has many **Discovery Sources** (1:N), each yielding **Skills**, **Rules**, **MCP Servers**.
- **Tree Stages** are determined by **State Mapping** rules applied to issue state dimensions.
- **Glow Overlays** are shared between forest trees and issue cards (two-way bound).

## Flagged Ambiguities

- "workspace" — resolved: Grovekeeper container only. Never for VS Code workspace or git worktree.
- "selected" / "active" — resolved: "active" = single inspect, "selected" = batch only.
- "paused" — resolved: renamed to "stopped" (no native pause in CLIs).
- "tracked" on workspace card — resolved: means active git worktrees, not issues or PRs.
- "backlog" — avoided entirely. Use "assigned issues" or "GitHub issues."

## Core Features

| Feature                | Status                           | PRD       | Design                                                |
| ---------------------- | -------------------------------- | --------- | ----------------------------------------------------- |
| Workspace Dashboard    | implemented                      | #87, #89  | `designs/issue-card-v2/`                              |
| Issue Card v2 Redesign | ready for implementation         | #296      | `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md` |
| Overview Dashboard     | implemented                      | #96       | `claude_design/Workspace Card.html`                   |
| Issue Creation         | implemented                      | #89       | `claude_design/Creation Wizard.html`                  |
| Session Management     | partial (UI done)                | #90       | `claude_design/Session Chat View.html`                |
| Session Chat UI        | partial (components built)       | #90       | `claude_design/Session Chat View.html`                |
| Forest Visualization   | partial (rendering done)         | #88       | `.mpx/STATE_MAPPING.md`                               |
| Git/GitHub Integration | implemented                      | #91       | —                                                     |
| Notification System    | implemented                      | #95       | —                                                     |
| Character Pack System  | implemented                      | #95       | —                                                     |
| Metrics & Statistics   | implemented                      | #93       | —                                                     |
| AI Configuration       | implemented (moving to Settings) | #94       | —                                                     |
| AFK/HITL Workflow      | not started                      | #92       | —                                                     |
| Settings (Two-Layer)   | refactoring                      | #96, #255 | —                                                     |
| PRD Management         | planned                          | #219      | —                                                     |
| Keyboard Shortcuts     | implemented                      | #87       | —                                                     |
| Internationalization   | implemented (en + cs)            | #87       | —                                                     |

## Key Constraints

- SPA mode (ssr=false, static adapter with fallback). No server-side rendering.
- Single Tauri process, multiple windows via `single_instance` plugin.
- Frontend owns all user-facing text. Rust returns error keys. Paraglide for i18n.
- No versioned DB migrations (pre-production). `schema::create_tables()` + `seed_defaults()`.
- GitHub issues are source of truth for work items. No internal task database.
- Dark theme is primary. Light theme supported but secondary.
- Android planned via Tauri v2 mobile. Never dismiss touch/mobile features.
- No RAG, no vector DB, no embedded terminal, no built-in code editor in V1.
