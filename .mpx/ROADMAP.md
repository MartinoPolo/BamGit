# Grovekeeper Roadmap

> PRD-driven development plan. Each PRD is a standalone GitHub issue with requirements, references, dependencies, and grilling topics.

Last updated: 2026-04-29

---

## PRD Dependency Graph

```
#87 Design System ──────────────────────────────────┐
 ├── #89 Issue Management ──┐                       │
 │    ├── #88 Forest View   │                       │
 │    ├── #90 Sessions ─────┤                       │
 │    └── #91 Git/GitHub ───┤                       │
 │         ├── #92 AFK/HITL │                       │
 │         └───────┘        │                       │
 │    #90 Sessions ─────────┤                       │
 │         ├── #92 AFK/HITL │                       │
 │         └── #93 Metrics  │                       │
 ├── #94 AI Config          │                       │
 ├── #95 Notifications      │                       │
 └── #96 Platform/Settings  │                       │
```

## Priority Tiers

### P0 — Usable App (must-have)

| PRD | Title                          | Blocks        | Status                                    |
| --- | ------------------------------ | ------------- | ----------------------------------------- |
| #87 | Design System & Infrastructure | All PRDs      | Not started                               |
| #89 | Issue Management & Creation    | #88, #90, #91 | Not started                               |
| #88 | Forest View & Visualization    | —             | State mapping grilled, sub-issues pending |
| #90 | Session Management & Chat UI   | #92, #93      | Not started                               |
| #91 | Git/GitHub Integration         | #92           | Not started                               |
| #95 | Notifications & Sounds         | —             | Not started                               |
| #96 | Platform & Settings            | —             | Not started                               |

### P1 — Full Featured (planned, not blocking v1)

| PRD | Title                | Blocks | Status      |
| --- | -------------------- | ------ | ----------- |
| #92 | AFK/HITL Workflow    | —      | Not started |
| #93 | Metrics & Statistics | —      | Not started |
| #94 | AI Configuration     | —      | Not started |

## Suggested Execution Order

1. **#87 Design System** — foundation: tokens, components, app shell, i18n, shortcuts, multi-window
2. **#89 Issue Management** — core data model: creation wizard, color system, lifecycle, naming
3. **#88 Forest View** + **#91 Git/GitHub** + **#95 Notifications** + **#96 Platform/Settings** — parallel after #89
4. **#90 Sessions** — depends on #89, can overlap with step 3
5. **#92 AFK/HITL** + **#93 Metrics** + **#94 AI Config** — P1 features after P0 is stable

---

## Current State (v0.1)

### Backend (~70% done)

- 13 Tauri IPC commands, 9 DB tables, session actor system
- Git/GitHub integration via `gh` CLI + `git2`
- Stream-JSON protocol parser for Claude Code
- Notification service (toast + sound + window flash)
- r2d2 connection pool (4 readers + 1 writer, WAL mode)

### Frontend (UI not wired)

- 7 deep modules (actions, board, issues, notifications, sessions, version-control, visualization)
- 34 shadcn-svelte components
- 3 route pages (issues, sessions, settings — sessions/settings are stubs)
- ForestView.svelte with low-poly-2d-trees library integration
- Design tokens in claude_design/ (not yet applied to app)

### Remaining Open Issues

- #40 — Unresolved items tracker (5 open bugs/tech debt items)
- #76 — Monorepo migration for low-poly-2d-trees (standalone infra)

---

## Future Phases (Post-V1)

These features are designed in but not part of the current PRD plan:

| Feature                 | Career Priority | Reference Repo          | Notes                                                   |
| ----------------------- | --------------- | ----------------------- | ------------------------------------------------------- |
| RAG Integration         | P1              | —                       | Vector DB + embedding pipeline for past session search  |
| Prompt Analytics        | P2              | CodeBurn                | A/B comparison, prompt versioning, cost-per-success     |
| Full Autopilot          | P3              | Multica                 | Webhook/cron triggers, execution pipeline state machine |
| Agent Personality       | Low             | peon-ping, pixel-agents | Czech Warcraft voices, character assignment per tree    |
| Model Comparison Engine | P3              | CodeBurn                | Same task on multiple providers, side-by-side results   |
| Dev Server Management   | —               | —                       | Deterministic port assignment, embedded browser preview |

See `.mpx/REFERENCES.md` for license compatibility, tech stack overlap, and detailed repo descriptions. See `.mpx/ARCHITECTURE.md` for the feature→reference mapping table.

---

## Issue Tracking Strategy

### Where to track

- **GitHub Issues** on Grovekeeper repo — source of truth for all work items
- **PRDs** — one GitHub issue per phase, labeled `prd`
- **Sub-issues** — vertical slices under each PRD, created via `/mp-prd-to-issues`
- **This ROADMAP.md** — high-level plan and phase sequencing (update as phases complete)
- **`.mpx/CAREER_RECOMMENDATIONS.md`** — career context and priority reasoning (don't duplicate here)

### Labeling convention

| Label           | Meaning                                       |
| --------------- | --------------------------------------------- |
| `prd`           | PRD issue (one per major feature area)        |
| `task`          | Implementation task (sub-issue of a PRD)      |
| `AFK`           | Can be implemented autonomously by agent      |
| `HITL`          | Requires human interaction / design decisions |
| `unresolved`    | Tracks unresolved items from implementation   |
| `area:db`       | Database layer                                |
| `area:rust`     | Rust backend                                  |
| `area:ui`       | Frontend UI                                   |
| `area:git`      | Git integration                               |
| `area:session`  | Agent session management                      |
| `area:platform` | Cross-platform support                        |
| `area:viz`      | Visualization / Forest View                   |
