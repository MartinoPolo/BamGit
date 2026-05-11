# Grovekeeper Roadmap

Prioritized feature backlog. Work item state lives on GitHub. Architecture and stack decisions are in `ARCHITECTURE.md`. Detailed feature specs are in `REQUIREMENTS.md`. Implementation references (what to read before building each feature) are in `REFERENCES.md`; the feature→reference mapping is in `ARCHITECTURE.md § Reference Repositories`.

---

## P0 — Ship-Ready: Full Issue Lifecycle

Goal: go through a complete issue lifecycle without leaving Grovekeeper — see GitHub state, manage worktrees, open editor/terminal.

| Feature                           | Notes                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| Overview + workspace cards polish | Entry point to the app; workspace health at a glance                                           |
| Issue cards + workspace dashboard | Core visibility; all badge types, card state, context menus                                    |
| Worktree lifecycle actions        | Open VS Code, terminal, folder; create/delete worktree from card                               |
| GitHub state visibility           | Branch badge, PR state, issue state always current on cards                                    |
| Assigned issues panel             | GitHub → Grovekeeper adoption flow; quick-add with/without worktree                            |
| Dependency view + blocking graph  | See which issues block which; depth rows in forest match blocking                              |
| PRD integration polish            | PRDs as special GitHub issues; sub-issue completion rollup on workspace card; PRD progress bar |

**Reference:** vibe-kanban `crates/worktree-manager/` for worktree lifecycle; obsidian-tasks-dashboard-plugin for PRD/badge patterns.

---

## P1 — Claude Code Full Wiring

Goal: spawn, monitor, and control sessions from inside the app; see the output of every action Grovekeeper takes.

| Feature                        | Notes                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| Session spawn + state tracking | Launch Claude Code as child process; issue state reflects session state in real time   |
| Stream-JSON protocol wiring    | All event tiers parsed; execution phase drives tree accessories and session state chip |
| Script & action log viewer     | Full stdout of setup-worktree.sh, skill invocations, and all Rust-spawned commands     |
| Session chat UI                | Chat column, tool call cards (3-level), approval/HITL cards, floating input panel      |
| Session adopt + monitor        | Discover externally launched Claude Code sessions via JSONL polling                    |
| AFK/HITL workflow              | Autonomous loop picks up AFK-labeled issues; HITL blocks until resolved                |

**Reference:** t3code `provider/` + cline `api/` for provider abstraction; cline-kanban `session-state-machine` for state reducer; cline `ToolGroupRenderer` for tool call UI; c9watch + pixel-agents `agentManager.ts` for session discovery; Multica `service/autopilot.go` for AFK loop. Canonical chat spec: `claude_design/design_briefs/SESSION_CHAT_VIEW.md`.

---

## P2 — Metrics & Evaluation

Goal: understand cost, performance, and agent quality across sessions and models.

| Feature                  | Notes                                                                        |
| ------------------------ | ---------------------------------------------------------------------------- |
| Usage dashboard          | Token/cost aggregates by issue, session, day; period switching               |
| Activity classification  | Categorize turns: coding / debugging / testing / planning / git ops / etc.   |
| One-shot success metrics | First-try success rate per category; retry cycle detection                   |
| Optimize view            | Waste detection: duplicate reads, bloated CLAUDE.md, unused MCP servers      |
| Model comparison         | Side-by-side model performance on same task types; cost/edit, cache hit rate |

**Reference:** CodeBurn `classifier.ts` (classification + one-shot), `models.ts` (pricing), `optimize.ts` (waste), `compare-stats.ts` (model comparison). All in `REFERENCES.md § CodeBurn`.

---

## P3 — Nice-to-Have

Goal: personality, deeper automation, and secondary views. Not blocking any of the above.

| Feature                      | Notes                                                                       |
| ---------------------------- | --------------------------------------------------------------------------- |
| Notifications + sound packs  | CESP-compatible sounds, per-event config, importance tiers                  |
| Agent character voices       | Czech Warcraft peon voices; per-issue persona assignment                    |
| Sub-agent bird visualization | Birds in tree canopy for sub-agents (owl, robin, sparrow, cardinal…)        |
| Autopilot (GitHub trigger)   | `grovekeeper:execute` label → auto-create issue + worktree + session        |
| RAG / past session search    | "How did I solve X last time?" — index transcripts, inject relevant context |
| Kanban view                  | Drag-and-drop board view as alternative to forest                           |
| Diff viewer                  | Per-session git diff at checkpoints; inline diff for PR review              |
| Dev server management        | Per-issue dev server commands; status badge on issue card                   |

**Reference:** peon-ping (sounds + CESP); pixel-agents `transcriptParser.ts` (sub-agent birds); Multica `service/autopilot.go` (GitHub trigger); vibe-kanban `Kanban*.tsx` + `Diff*.tsx`; see `REFERENCES.md` for all repos.
