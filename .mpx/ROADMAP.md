# Grovekeeper Roadmap

Prioritized feature backlog. Work item state lives on GitHub. Architecture and stack decisions are in `ARCHITECTURE.md`. Detailed feature specs are in `REQUIREMENTS.md`. Implementation references are in `REFERENCES.md`.

---

## Completed (as of 2026-05-14)

Features that are implemented and merged. Listed for context — see git history for details.

| Feature                           | PRD/PRs                             | Notes                                                      |
| --------------------------------- | ----------------------------------- | ---------------------------------------------------------- |
| Overview + workspace cards        | PRD #87, PRs #242-#245              | Health grid, accent colors, card variants, gear icon       |
| Issue cards + workspace dashboard | PRD #89, PRs #138-#211              | Full card system, badges, context menus, batch selection   |
| Worktree lifecycle actions        | PRD #89                             | Create/remove worktree, folder/terminal/editor buttons     |
| GitHub state visibility           | PRD #89                             | Branch, PR, issue, sync badges on cards                    |
| Assigned issues panel             | PR #278                             | Sortable table, batch actions, quick-add                   |
| Dependency view + blocking graph  | PR #283                             | DAG visualization, blocking relationships                  |
| Issue creation wizard             | PRD #89                             | 5-step keyboard-driven modal                               |
| Color system + palettes           | PRD #89                             | 24-color palette, auto-rotation, picker                    |
| Metrics & usage dashboard         | PRD #93, PRs #241, #248, #279, #289 | KPI cards, cost chart, activity breakdown, CSV export      |
| Notifications + sound packs       | PRD #95, PRs #240, #264, #268, #286 | 15 events, importance tiers, playback queue, volume        |
| Character packs + creator         | PRD #95, PR #290                    | Per-issue characters, bulk import, creator UI              |
| AI configuration browser          | PRD #94, PRs #243, #288             | Provider-scoped tabs, discovery, edit/delete, settings     |
| GitHub OAuth                      | PRs #267, #280                      | Device flow + keyring storage + CLI status card            |
| Workspace settings                | PR #261                             | Commands, process management, archive/delete               |
| Keyboard shortcuts                | PRD #89                             | Registry, inline rebinding, SQLite persistence             |
| Command palette                   | PRD #89                             | Ctrl+K, fuzzy search, action/navigation/issue items        |
| Storybook standardization         | PRs #291, recent commits            | 57 stories, conventions, component variant system          |
| Base component refactor           | Recent commits (May 2026)           | shadcn-svelte conventions, tv() variants, 4-tier structure |

---

## Current Focus: Testing & Component Quality

Active work area. Establishing testing infrastructure and component quality standards.

| Feature                           | Status      | Notes                                                          |
| --------------------------------- | ----------- | -------------------------------------------------------------- |
| Storybook play tests (Phase 3)    | In progress | Interaction tests + a11y CI. Highest ROI phase                 |
| Storybook block stories (Phase 2) | In progress | Stories for issue, workspace, session, layout blocks           |
| Vitest unit tests (Phase 4)       | Planned     | Fill coverage gaps for business logic modules                  |
| Event propagation testing         | In progress | Core architectural rule: floating overlays as event boundaries |
| Component variant standardization | In progress | Tailwind tv() variants, shadcn-svelte conventions              |

**Reference:** `.mpx/testing-framework/` for phase prompts and conventions.

---

## P0 — Ship-Ready: Session Wiring

Goal: spawn, monitor, and control sessions from inside the app.

| Feature                        | Notes                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------- |
| Session spawn + state tracking | Launch Claude Code as child process; real-time state on cards                     |
| Stream-JSON protocol wiring    | All event tiers parsed; execution phase drives tree accessories                   |
| Session chat UI                | Chat column, tool call cards (3-level), approval/HITL cards, floating input panel |
| Session adopt + monitor        | Discover externally launched sessions via JSONL polling                           |
| Script & action log viewer     | Full stdout of setup-worktree.sh, skill invocations, spawned commands             |

**Reference:** See `ARCHITECTURE.md § Provider Abstraction` and knowledge files `PROVIDER_TRAIT.md`, `STREAM_JSON_PROTOCOL.md`, `TAURI_SVELTE_IPC.md`.

---

## P1 — Autonomy & Workflow

Goal: automated task execution and human-in-the-loop checkpoints.

| Feature                    | Notes                                                                   |
| -------------------------- | ----------------------------------------------------------------------- |
| AFK/HITL workflow          | Autonomous loop picks up AFK-labeled issues; HITL blocks until resolved |
| GitHub trigger (autopilot) | `grovekeeper:execute` label → auto-create issue + worktree + session    |
| Forest view polish         | Sub-agent birds, execution phase tools, glow overlays, tree animations  |
| PRD management view        | PRD cards, sub-issue progress, blocking visualization                   |

**Reference:** `STATE_MAPPING.md` for tree visualization rules. Multica `service/autopilot.go` for autopilot patterns.

---

## P2 — Nice-to-Have

| Feature                      | Notes                                                            |
| ---------------------------- | ---------------------------------------------------------------- |
| Optimize view                | Waste detection (duplicate reads, bloated CLAUDE.md, unused MCP) |
| Compare view                 | Side-by-side model comparison on metrics                         |
| Kanban view                  | Drag-and-drop board as alternative to forest                     |
| Diff viewer                  | Per-session git diff at checkpoints                              |
| Dev server management        | Per-issue dev server with status badges, embedded log viewer     |
| Rust backend tests (Phase 5) | `#[cfg(test)]` for commands and business logic                   |
| Playwright E2E (Phase 6)     | Navigation, URL state, keyboard, workflows                       |

---

## Out of Scope for V1

- RAG integration, vector databases, embedding models
- Advanced prompt analytics, A/B testing, prompt versioning
- Fine-tuning experiments
- GitHub App / webhook relay (using label polling instead)
- Built-in code editor, embedded terminal (xterm.js)
- Mobile push notifications, RTL language support
