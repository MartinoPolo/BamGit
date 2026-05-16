# Grovekeeper - Reference Repositories

External repositories that contain reusable patterns, code, and architectural decisions relevant to Grovekeeper development. Agents should explore these when implementing related features.

---

## Evaluation Dashboard & Cost Analytics

### C:\_MP_github_cloned\CodeBurn

**License: MIT** | **Stack: TypeScript, React 19, Ink 7 (TUI), Vitest** | **LOC: ~7,500** | **Direct code reuse: HIGH**

Multi-provider AI coding cost and token tracker. Reads session data from disk (no proxy, no API keys) — zero-intrusion observability. **Primary reference for Grovekeeper's evaluation dashboard.**

**Key features to adapt:**

- **13-category activity classifier** (`src/classifier.ts`): Deterministic regex+keyword classification of turns into Coding, Debugging, Feature Dev, Refactoring, Testing, Exploration, Planning, Delegation, Git Ops, Build/Deploy, Conversation, Brainstorming, General. No LLM calls — pure pattern matching, reproducible.
- **One-shot success metrics** (`src/classifier.ts`): Detects Edit→Bash→Edit retry cycles. Calculates first-try success rate per category. Key differentiator for AI engineering portfolio.
- **Cost calculation engine** (`src/models.ts`): LiteLLM pricing with hardcoded fallbacks, cache-aware (cache_write/cache_read tracked separately), fast-mode multiplier (6x for Opus), model normalization, user alias support.
- **Provider plugin system** (`src/providers/`): 7 providers (Claude Code, Claude Desktop, Codex, Cursor, OpenCode, Pi/OMP, Copilot). Each implements `discoverSessions()` + `createSessionParser()`. Streaming JSONL parsing with deduplication.
- **Optimize mode** (`src/optimize.ts`): Waste detection — duplicate reads, bloated CLAUDE.md, unused MCP servers, ghost agents/skills, low read:edit ratios, junk directory scans. Health score A-F grading.
- **Model comparison** (`src/compare-stats.ts`): Side-by-side metrics: one-shot rate, retry rate, self-correction, cost/call, cost/edit, tokens/call, cache hit rate, per-category breakdowns, working style (delegation, planning, tools/turn, fast mode usage).
- **Daily cache** (`src/daily-cache.ts`): File-based per-day cost+calls cache with file locking for concurrent CLI instances.
- **Subscription plan tracking** (`src/plan-usage.ts`): Claude Pro/Max, Cursor Pro, custom budgets with overage projections.
- **162-currency support** (`src/currency.ts`): Frankfurter API exchange rates with 24h cache.

**Grovekeeper adaptation:** Port classifier + cost engine + one-shot metrics to Rust backend. Build Svelte dashboard UI inspired by CodeBurn's TUI layout (overview panel, daily chart, projects, sessions, models, activities, tools, MCP servers). Add interactive period switching (Today/7d/30d/Month/All).

---

## Multi-Provider CLI Abstraction & Agent GUI

### C:\_MP_github_cloned\t3code

**License: MIT** | **Stack: TypeScript, Effect 4, React 19, TanStack Router, Vite 8, Electron, Bun** | **LOC: ~112,500** | **Direct code reuse: MEDIUM (patterns, not code — React not Svelte)**

Minimal web GUI + CLI for coding agents. Unified WebSocket interface for Claude Agent SDK, Codex, OpenCode, and Cursor. **Primary reference for multi-provider architecture and orchestration patterns.**

**Key patterns to study:**

- **Provider adapter contracts** (`apps/server/src/provider/`): Generic `ProviderAdapter<E>` with error algebra. Event-based session management with token tracking. User input & approval request handling. Attachment/context file support.
- **Claude Agent SDK integration** (`ClaudeAdapter.ts`): Full Agent Protocol support — tool approval workflows, model selection, effort levels, prompt prefixing, session checkpointing.
- **Orchestration engine** (`apps/server/src/orchestration/`): Domain-driven event sourcing. Command reactor for async workflows. Turn-level state machine (planning, executing, complete).
- **WebSocket protocol** (`packages/contracts/src/ws.ts`): JSON-RPC style request/response + typed push events. Schema validation at transport layer. Channels: welcome, config, terminal, orchestration.
- **Git checkpointing** (`apps/server/src/checkpointing/`): Automatic git snapshots at turn start/completion. Enables session resumption across restarts.
- **Distributed tracing** (`apps/server/src/observability/`): NDJSON trace files + OTLP export. Spans for RPC, orchestration, provider, git, terminal, SQL operations.
- **Pairing auth** (`apps/server/src/auth/`): One-time bootstrap tokens, no long-lived secrets. Session-based WebSocket auth.

**Grovekeeper adaptation:** Study provider adapter pattern for session management's multi-provider expansion. The Effect system is React-specific, but the adapter contract (session lifecycle + event streaming + approval workflows) maps directly to Grovekeeper's Rust provider trait.

---

## Multi-Agent Team Platform & Autopilot System

### C:\_MP_github_cloned\Multica

**License: Modified Apache 2.0** (commercial restrictions on hosted services; internal use permitted) | **Stack: Go 1.26, Next.js 16, React 19, PostgreSQL+pgvector, Redis, Electron** | **LOC: ~84,000** | **Direct code reuse: LOW (different stack + restricted license)**

Agents-as-teammates platform. Full autonomous task lifecycle: enqueue → claim → start → complete/fail. **Primary reference for autopilot/skill system and multi-agent team collaboration patterns.**

**Key patterns to study:**

- **Agent backend abstraction** (`server/pkg/agent/`): Unified `Backend` interface for 10 CLIs (Claude, Codex, OpenClaw, OpenCode, Hermes, Gemini, Pi, Cursor, Copilot, Kimi). Each implements `Execute(ctx, prompt, opts) → Session`. Version detection, model enumeration.
- **Daemon architecture** (`server/internal/daemon/`): Local runtime that polls server for tasks. Auto-detects CLIs on PATH. Repository cache for fast git checkouts. Streams execution results via HTTP/WebSocket. Graceful shutdown + restart handling.
- **Task lifecycle state machine** (`server/internal/service/task.go`): enqueue → claim (lock) → start → complete/fail → cleanup. Single-daemon execution lock, timeout handling, resume via session checkpoints.
- **Autopilot workflows** (`server/internal/service/autopilot.go`): Trigger types: webhook, cron, manual. Execution modes: `create_issue` (ticket → agent claims → executes) or `run_only` (direct task). Skill templates, payload templating, run history.
- **Reusable skills system**: Every solution becomes a shareable skill. Versioned, documented, shared across workspace. Deployments, migrations, code reviews compound over time.
- **Real-time event bus** (`server/internal/realtime/`): WebSocket hub with scope-based authorization. Redis relay for multi-instance sync. Event types: issue/comment/agent/autopilot/chat/task updates.
- **Workspace isolation**: All data scoped by workspace_id. Multi-user teams with roles (owner/admin/member).

**Grovekeeper adaptation:** Study autopilot pattern for future "automated task execution" feature (GitHub trigger → create issue → spawn session → execute → create PR). The skill system maps to Grovekeeper's action buttons (skills). Daemon architecture is a more sophisticated version of Grovekeeper's session polling.

---

## Agent Visualization & Character Systems

### C:\_MP_github_cloned\pixel-agents

**License: MIT** | **Stack: TypeScript, React 19, Canvas 2D, Tailwind 4, Vite, esbuild** | **LOC: ~2,900** | **Direct code reuse: MEDIUM (patterns for agent state visualization)**

VS Code extension where each Claude Code agent appears as a pixel art character in an interactive office. **Primary reference for agent personality, state visualization, and sub-agent rendering.**

**Key patterns to study:**

- **Agent state machine** (`webview-ui/src/office/engine/characters.ts`): States: IDLE, WALK, TYPE. Animation frames per state. BFS pathfinding between tiles. Wandering behavior (random rest, move sequences, return to seat).
- **Dual-mode detection** (`src/agentManager.ts`, `server/src/`): Hooks-first (HTTP server receives Claude Code hook events instantly) with JSONL file-polling fallback. Both modes coexist. Heuristic-based status detection (15-30s idle → waiting; permission requests via bubbles).
- **Sub-agent visualization** (`transcriptParser.ts`): Task/Agent tool spawns linked child characters with negative IDs. Connected to parent via visual line. Matrix effect spawn/despawn animation. Parent-child state linking.
- **Agent teams** (`server/src/providers/hook/claude/claudeTeamProvider.ts`): Team metadata — lead vs teammate roles, team name tracking, tmux support for `run_in_background`.
- **Office layout editor** (`webview-ui/src/office/editor/`): Grid-based editor (64x64 tiles), 25+ furniture types with rotation, footprint-aware placement, undo/redo (50 levels), persistent layouts, export/import JSON.
- **Canvas game loop** (`webview-ui/src/office/engine/gameLoop.ts`): 60 FPS requestAnimationFrame, update all characters → render to canvas (single pass). React handles UI overlays separately. Depth sorting by y-coordinate.
- **Modular asset system** (`shared/assets/`): Per-folder manifest.json for furniture, PNG→SpriteData conversion, HSB color shifting for palette variety, external asset directories.

**Grovekeeper adaptation:** The agent state detection patterns (hooks + JSONL polling) validate Grovekeeper's existing approach. Sub-agent visualization (parent-child linking, spawn/despawn effects) informs Grovekeeper's bird system — sub-agents appear as birds in the tree canopy (owl, robin, sparrow, cardinal, hummingbird, parrot) rather than companion saplings. Character personality system is reference for the peon-ping integration (agent voices).

---

## Kanban Board & Workspace Orchestration

### C:\_MP_github_cloned\vibe-kanban

**License: Apache 2.0** | **Stack: Rust (Axum), TypeScript, React 18, Tauri 2, SQLx+SQLite, TanStack Router, Zustand** | **LOC: large (30 Rust crates + React UI)** | **Direct code reuse: HIGH (same desktop framework — Tauri 2 + Rust)**

Agent orchestration GUI with kanban issues and coding workspaces. 10+ agent executors, PR review, diff viewer, terminal emulation. **Sunsetting project — excellent source for Rust crate patterns.** **Primary reference for kanban UI, workspace management, and Tauri 2 Rust patterns.**

**Key patterns to study:**

- **Rust workspace manager** (`crates/workspace-manager/`): Git worktree management with lifecycle tracking. Branch management, commit SHA tracking, file change analysis.
- **Rust worktree manager** (`crates/worktree-manager/`): Worktree lifecycle (create, archive, delete, cleanup). Orphan detection, expiry handling.
- **Git crate** (`crates/git/`): libgit2 wrapper for git operations. Diff tracking and visualization data.
- **Review crate** (`crates/review/`): Code review infrastructure — inline diff comments, change aggregation.
- **Multi-agent executors** (`crates/executors/`): Abstraction layer for Claude Code, Gemini CLI, Codex, Copilot, Amp, Cursor, OpenCode, Droid, CCR, Qwen Code. Execution process state machine: init → setup_running → setup_complete → executor_running → executor_complete.
- **Preview proxy** (`crates/preview-proxy/`): Dev server proxy for embedded app preview. Route preview to running dev servers.
- **Kanban board UI** (`packages/ui/src/components/Kanban*.tsx`): React kanban with @hello-pangea/dnd (drag-and-drop). Columns per status (todo/inprogress/inreview/done/cancelled). Bulk actions, filters, sort.
- **Diff viewer** (`packages/ui/src/components/Diff*.tsx`): Side-by-side diff display with @git-diff-view/react. Inline comments on diff hunks.
- **Terminal emulation** (`packages/ui/src/components/Terminal*.tsx`): xterm.js 5.5 for interactive shell. Bidirectional I/O.
- **Type sharing** (`ts-rs`): Rust types → TypeScript automatic generation. No manual type syncing.
- **Database** (`crates/db/`): SQLx with compile-time query verification. Migrations tracked in git.

**Grovekeeper adaptation:** The Rust crate architecture is directly applicable — Grovekeeper already has similar modules but can study vibe-kanban's worktree cleanup, review infrastructure, and executor state machine. The kanban UI patterns (drag-and-drop, bulk actions) map to Grovekeeper's issue dashboard if kanban view is added. The ts-rs type sharing pattern could replace Grovekeeper's manual TypeScript command wrappers.

---

## Warcraft-Themed Agent Notifications & Sound System

### C:\_MP_github_cloned\peon-ping

**License: MIT** | **Stack: Bash, PowerShell, Python, Node.js (MCP), Next.js (website)** | **LOC: ~31,600** | **Direct code reuse: HIGH (notification patterns, CESP standard, sound pack system)**

Game character voice notifications for AI coding agents. 165+ sound packs from Warcraft, StarCraft, Portal, Dota 2, and more. **Primary reference for agent personality voices and notification sound system. Fun future feature: Czech Warcraft character voices.**

**Key features to adapt:**

- **CESP standard** (Coding Event Sound Pack Specification v1.0): Standard categories: `session.start`, `task.acknowledge`, `task.complete`, `task.error`, `input.required`, `resource.limit`, `user.spam`. Extended: `session.end`, `task.progress`. Open standard, any app can adopt.
- **Sound pack manifest** (`openpeon.json`): JSON format mapping CESP categories → array of `{file, label}` pairs. No-repeat logic (tracked in `.state.json`). Random selection with debouncing.
- **Six-layer pack selection hierarchy**: session_override → path_rules → ide_rules → pack_rotation → default_pack → hardcoded. Per-directory binding, per-IDE binding, rotation lists.
- **Event hook system**: Receives JSON events on stdin. Maps Claude Code hooks (Stop, SessionStart, PermissionRequest, PostToolUseFailure, PreCompact) → CESP events. Spam detection (3+ prompts in 10s → `user.spam`).
- **Desktop overlays**: macOS JXA Cocoa overlays (4 themes: neon, glass, sakura, jarvis), Windows Forms popups, Linux notify-send. Click-to-focus support, auto-dismiss timer.
- **Intelligent debouncing**: Session start cooldown (30s), stop debouncing, silent window for short tasks, suppress sub-agent completion sounds, no-repeat per category.
- **MCP server** (`mcp/peon-mcp.js`): Agents can call `play_sound` directly. Full pack catalog as MCP Resource.
- **Peon Trainer** (`trainer/`): Pavel-style exercise reminders during coding. Daily goals, 20-min reminder intervals, logging via skills.

**Grovekeeper adaptation — Future feature: Agent Voices:**

- Integrate CESP event mapping into Grovekeeper's notification system
- Allow users to assign sound packs per issue/session (like peon-ping's path_rules)
- Add Czech-language Warcraft character voices as custom pack (e.g., Orc Peon speaking Czech: "Práce, práce.", "Hotovo, pane!", "Jo, šéfe.")
- Use Grovekeeper's existing notification service as the playback layer
- Pack manifest format is simple JSON — Grovekeeper could load peon-ping packs directly

---

## Agent Session Monitoring & Process Discovery

### C:\_MP_github_cloned\c9watch

Tauri 2 + SvelteKit + Svelte 5 real-time monitor for Claude Code sessions. Discovers sessions via OS process scanning (sysinfo crate), tracks status transitions (Working/NeedsAttention/Idle), aggregates cost/tokens from JSONL session files, and broadcasts updates via Tauri events + WebSocket. Key patterns: background polling loop (`src-tauri/src/polling.rs`), session detection pipeline (`src-tauri/src/session/detector.rs`), cost aggregation from token metadata, tray popover for quick-glance monitoring.

---

## Multi-Provider LLM Abstraction & Tool Visualization

### C:\_MP_github_cloned\cline

**License: Apache 2.0** | **Stack: TypeScript, React, VS Code Extension API** | **LOC: large** | **Direct code reuse: MEDIUM (patterns, not code — VS Code extension not desktop app)**

VS Code extension providing autonomous coding agent with ~47 LLM provider implementations behind a unified API abstraction. Rich tool call visualization with inline diffs, permission approval UI, and terminal output streaming. **Primary reference for multi-provider API design and tool call UI patterns.**

**Key patterns to study:**

- **Provider factory** (`src/core/api/index.ts`): `ApiHandler` interface with `createMessage()`, `getModel()`, `abort()`. Factory function with cascading switch for 47 providers. Provider options extend `CommonApiHandlerOptions` with per-provider config.
- **Tool call visualization** (`webview-ui/src/components/chat/.../ToolGroupRenderer.tsx`): Expandable tool groups, low-stakes vs high-stakes filtering, activity text per tool type, deduplication of completed vs active tools.
- **Permission/auto-approval** (`src/core/task/tools/AutoApprove.ts`): Rule-based permission controller. Path-based glob matching, tool-specific policies (readFile auto-approve, executeCommand manual).
- **Sub-agent orchestration** (`src/core/task/tools/subagent/SubagentRunner.ts`): Nested agent spawning with isolated task contexts. Usage stats aggregated (tokens, costs, cache reads/writes). Result serialized back to parent.
- **MCP server hub** (`src/services/mcp/McpHub.ts`): Multi-server management with auto-reconnect, config file watcher for hot-reload, multi-transport support (stdio, SSE, HTTP, websocket).
- **Context management** (`src/core/context/context-management/ContextManager.ts`): File tracking, deduplication, context window budget enforcement.
- **Hook system** (`src/core/hooks/hook-executor.ts`): Shell script hooks at lifecycle points, child process execution with env vars, non-blocking failures.

**Grovekeeper adaptation:** The `ApiHandler` interface is the most battle-tested multi-provider abstraction available — study for Grovekeeper's Rust provider trait design. ToolGroupRenderer patterns directly applicable to session chat UI (collapsible tool cards, active/completed grouping). Auto-approval system is a reference for reducing HITL interruptions. McpHub patterns useful for the AI Configuration browser.

---

## Task Board & Worktree-per-Task Orchestration

### C:\_MP_github_cloned\cline-kanban

**License: MIT** | **Stack: TypeScript, React, Node.js, xterm.js, node-pty, tRPC** | **LOC: ~15,000** | **Direct code reuse: MEDIUM (patterns for session state + worktree mapping)**

CLI + React web-UI kanban board where each task gets its own git worktree and terminal session. **Primary reference for session state machines and task-to-worktree isolation patterns.**

**Key patterns to study:**

- **Session state machine** (`src/terminal/session-state-machine.ts`): Pure reducer function `reduceSessionTransition(summary, event) → SessionTransitionResult`. Events: `hook.to_review`, `hook.to_in_progress`, `agent.prompt-ready`, `process.exit`. States: running, awaiting_review, interrupted, completed.
- **Task-to-worktree mapping** (`src/workspace/task-worktree.ts`): Create isolated git worktree per task, symlink ignored files (node_modules, vendor) to avoid duplication, file lock management for safe `.git/` access, cleanup on completion.
- **Hook event ingestion** (`src/trpc/hooks-api.ts`): Hook ingest flow: parse event → validate → apply state transition → capture git checkpoint → broadcast via WebSocket. Metadata enrichment per event.
- **Task dependency chains** (`web-ui/src/hooks/use-linked-backlog-task-actions.ts`): Tasks linked as dependencies. Completion of task A auto-starts task B. Supports chains (A → B → C) for autonomous workflows.
- **Diff viewing** (`web-ui/src/components/detail-panels/diff-viewer-panel.tsx`): File-level diffs at git ref checkpoints, git history panel for task worktree commits.
- **tRPC IPC** (`src/trpc/app-router.ts`): Type-safe RPC between Node.js backend and browser frontend with WebSocket subscriptions for real-time updates.

**Grovekeeper adaptation:** The session state machine reducer is directly portable to Rust (pure function, no side effects). Task-to-worktree mapping validates Grovekeeper's worktree-per-issue approach and adds the symlink optimization for shared dependencies. Hook ingestion pipeline is a reference for integrating Claude Code hooks into Grovekeeper's event system. Dependency chains map to the AFK workflow's sequential execution.

---

## Desktop Agent Wrapper & Session Actor Pattern

### C:\_MP_github_cloned\OpenCovibe

Tauri 2 + Svelte 5 local-first desktop wrapper around Claude Code CLI. Implements session actor pattern (single-owner, race-free lifecycle via mpsc channels), turn-based event engine with timeout management, and stream-JSON bidirectional protocol for agent communication. Supports multiple communication modes (stream-JSON, PTY, pipe). Key patterns: session actor (`src-tauri/src/agent/session_actor.rs`), turn engine (`src-tauri/src/agent/turn_engine.rs`), Claude protocol handling (`src-tauri/src/agent/claude_protocol.rs`), immutable event log storage with replay, rich Svelte components for chat/tool visualization.

---

## Dashboard Data Model & GitHub/Git Integration

### C:\_MP_projects\obsidian-tasks-dashboard-plugin

Obsidian plugin implementing two dashboard types: one-repo-many-issues and many-repos-as-issues. Deep GitHub integration (REST API v3 with 5-min cache, PAT auth, rate limit tracking) and local git operations (branch status, behind-base detection via `git rev-list`, merge conflict detection via `git merge-tree`, worktree listing). Badge system with color-coded states for branches (active/local/remote-gone/deleted), PRs (open/draft/review-requested/merged/closed), issues, and sync status. Key patterns: `GitHubService` with LRU cache (`src/github/`), git status computation (`src/git-status/`), worktree lifecycle with setup state machine (`src/issues/issue-manager-worktree.ts`), cross-platform shell launchers, sync flow with conflict detection and Claude Code fallback.

---

## Skills, Agents, Hooks & Worktree Scripts

### C:\_MP_projects\mpx-claude-code

Custom Claude Code configuration system: 20+ skills (mp-execute, mp-grill-me, mp-review, mp-commit-push-pr, etc.), agent definitions with model assignments (Opus/Sonnet/Haiku), lifecycle hooks (pre-commit gate with secret detection, dangerous command guard, format-on-save, notification flash+beep), and utility scripts. Key patterns: worktree setup script (`scripts/setup-worktree.sh` - copies IDE configs, .env, Peacock color, Claude settings, installs deps), notification system (`hooks/notify-flash-beep.ps1` - Win32 taskbar flash + sound), status line script (`scripts/context-bar.sh`), centralized settings.json with hook/plugin configuration. Grovekeeper should invoke these skills and scripts via its GUI rather than reimplementing them.

---

## Session Resume & Handoff Across Providers

### https://github.com/yigitkonur/cli-continues/

CLI tool for resuming agent sessions across providers. Relevant for Grovekeeper's ability to pick up an externally-launched session and continue it inside the app, or vice versa.

### C:\_MP_github_cloned\claude-code-templates

Contains a session-handoff skill (`cli-tool/components/skills/enterprise-communication/session-handoff/`) that creates comprehensive handoff documents for fresh agents to continue work. Features CREATE/RESUME modes, handoff chaining for long-running projects, and staleness detection. Useful pattern for Grovekeeper's session continuity across app restarts or provider switches.

### C:\_MP_github_cloned\claude-code-hooks-multi-agent-observability

**License: MIT** | **Stack: TypeScript, Bun, SQLite, Vue 3, WebSocket** | **LOC: ~3,000** | **Direct code reuse: MEDIUM (event schema + dashboard patterns)**

Real-time multi-agent monitoring dashboard via Claude Code hooks. Zero-intrusion observability — agents are unmodified. **Primary reference for hook-based event capture, HITL response flow, and multi-agent monitoring UI.**

**Key patterns to study:**

- **Event capture pipeline** (`apps/server/src/index.ts`): HTTP POST `/events` receives hook events → SQLite insert (WAL mode) → WebSocket broadcast to all connected clients. Indexed by `source_app`, `session_id`, `hook_event_type`, `timestamp`.
- **SQLite event schema** (`apps/server/src/db.ts`): Rich event records with `source_app`, `session_id`, `hook_event_type`, `payload` (JSON), `chat` (conversation snapshot), `summary`, `model_name`, `humanInTheLoop`, `humanInTheLoopStatus`. Dynamic column migration.
- **HITL response flow** (`apps/server/src/index.ts`): Events include HITL data with WebSocket callback URL to agent. User responds via dashboard → server forwards response → agent resumes. Status tracking: pending → responded → timeout → error.
- **Swim lane visualization** (`apps/client/src/components/AgentSwimLane.vue`): Timeline per agent showing activities in chronological order. Live event count, connection status indicator, faceted filtering by source/session/event type.
- **Event timeline** (`apps/client/src/components/EventTimeline.vue`): Scrollable event log with expandable rows, metadata display, real-time auto-population via WebSocket.

**Grovekeeper adaptation:** The SQLite event schema is directly applicable to Grovekeeper's metrics tables (same WAL mode, similar indexes). HITL response flow is a reference for the permission approval pipeline. Swim lane visualization patterns useful for the session dashboard's multi-agent monitoring view.

### C:\_MP_github_cloned\agent-flow

Visualizes agent execution flow, subagent coordination, and tool call chains in real-time. Uses Claude Code hooks for zero-latency event streaming. Features timeline & transcript panels, multi-session tab support, and JSONL replay. Directly relevant to Grovekeeper's session log visualization feature. Also available at https://github.com/patoles/agent-flow — primary reference for the visualization grilling session.

---

## Obsidian Dashboard Data Examples

### C:\Users\snapy\OneDrive\Obsidian\ObsidianMP\Projekty\Mini Projekty\MiniProjektyDashboard.md

Example of "many-repos-as-issues" dashboard type. Each issue represents an independent mini-project with fields: issue ID, name, path, priority, optional github_link, and optional worktree metadata (branch, origin folder, expected folder, setup state, base branch, base repository). Issues organized into Active, Assigned, and Archive sections.

### C:\Users\snapy\OneDrive\Obsidian\ObsidianMP\Finteractive\WorkDashboard.md

Example of "one-repo-many-issues" dashboard type. All issues belong to a single repository (atc-backoffice). Richer worktree metadata on most issues, with dependency chains (e.g., issue based on another feature branch instead of dev). Shows the full worktree lifecycle from creation through archival.

---

## Spec-Driven Workflow Engine & AI Agent Orchestration

### C:\_MP_github_cloned\spec-kit

**License: Open Source** | **Stack: Python 3.11+, Typer CLI, YAML workflows, Jinja2 expressions** | **LOC: ~large (227KB main module + extensions)** | **Direct code reuse: LOW (Python CLI, not Rust/Svelte) — HIGH pattern reuse for workflow engine design**

Toolkit for Spec-Driven Development. Inverts traditional dev: specifications are executable source of truth that drive AI-assisted code generation. Includes a **YAML-based workflow engine** with 10 step types, state persistence, resumability, and multi-agent integration (30+ AI coding tools). **Primary reference for interactive workflow builder, step sequencing, and agentic execution pipelines.**

**Key patterns to study:**

- **Workflow engine architecture** (`src/specify_cli/workflows/`): YAML workflow definitions with sequential execution, state persistence after each step, and resume from exact interruption point. `RunState` persisted to disk enables pause/resume across sessions.
- **10 step types** (`src/specify_cli/workflows/steps/`): `command` (invoke AI agent), `shell` (run script), `gate` (human approval), `prompt` (arbitrary AI prompt), `if`/`switch` (conditional), `while`/`do-while` (loops), `fan-out`/`fan-in` (parallel dispatch + aggregation). Each implements `StepBase` with `execute()` + `validate()`.
- **Expression engine** (`workflows/expressions.py`): Jinja2-like `{{ }}` syntax for dynamic values. Access `inputs.*`, `steps.<id>.output.*`, `item` (fan-out), `fan_in` (aggregation). Filters: `default`, `join`, `contains`, `map`.
- **Gate steps for HITL** (`workflows/steps/gate/`): Interactive pause points with options (approve/reject). On reject → abort. Persists state before pausing, resumes after human input. Maps directly to Grovekeeper's approval workflow.
- **Step registry** (`workflows/__init__.py`): Explicit registration of step types into `STEP_REGISTRY` dict. New types just subclass `StepBase` + register. Clean extensibility model.
- **Workflow catalog system** (`workflows/catalog.py`): Hierarchical resolution (env var → project config → user config → built-in). Remote catalog fetching with 1hr cache. `specify workflow add <id>` installs from catalog.
- **Multi-agent integration** (`src/specify_cli/integrations/`): 30+ agent adapters. Each integration writes commands in agent-native format (Claude skills, Copilot prompts, Gemini TOML, etc.). Base classes: `MarkdownIntegration`, `SkillsIntegration`, `TomlIntegration`, `YamlIntegration`.
- **Extension hook system** (`extensions.py`): Before/after hooks on every command. Git extension auto-creates branches, commits at workflow transitions. 14+ hook points covering full lifecycle.
- **Input schema with validation** (`workflows/engine.py`): Typed inputs (string/number/boolean/enum), required/optional with defaults, coercion at resolution time. Maps to workflow builder form fields.
- **Workflow YAML format** (`workflows/speckit/workflow.yml`): Clean declarative format — `schema_version`, `workflow` metadata, `requires` (version + integration constraints), `inputs` (typed params), `steps` (sequential with IDs).

**Grovekeeper adaptation — Interactive Workflow Builder:**

The workflow engine is the most directly relevant pattern for Grovekeeper's planned interactive workflow feature:

1. **Step type taxonomy** → Grovekeeper's workflow cards: `command` = agent skill execution, `shell` = deterministic script, `gate` = HITL checkpoint, `if`/`switch` = conditional routing based on CI results or review outcome.
2. **YAML workflow definitions** → Grovekeeper persists workflow templates in SQLite. User-created via drag-and-drop canvas, stored as structured data (not YAML files).
3. **`RunState` persistence** → Map to Grovekeeper's session events. Each workflow execution tracks `current_step_index` + accumulated results. Enables resume after app restart.
4. **Gate steps** → Toggle between "auto-approve" (AFK mode) and "require approval" (HITL mode) per step. The spec-kit pattern of options (approve/reject/abort) maps to Grovekeeper's approval UI.
5. **Fan-out/fan-in** → Run same workflow across multiple issues in parallel. Each issue gets its own execution track.
6. **Expression interpolation** → Steps can reference outputs of prior steps (e.g., "if checks failed, route to fix step"). Enables conditional workflow paths.
7. **Extension hooks** → Pre/post hooks on each step (e.g., auto-commit before review, auto-push after checks pass).
8. **Workflow catalog** → Users share workflow templates. Community presets for common patterns (full review, quick fix, TDD cycle).

**Key differences from Grovekeeper's needs:**

- Spec-kit is CLI-only, text-driven. Grovekeeper needs a visual canvas with drag-and-drop.
- Spec-kit workflows are static YAML. Grovekeeper workflows are interactive, togglable per-execution.
- Spec-kit targets specification generation. Grovekeeper targets execution orchestration (worktree → code → review → ship).
- Spec-kit's "command" step calls AI once. Grovekeeper's skill steps are full multi-turn sessions.

**What NOT to copy:**

- Python implementation (wrong stack)
- YAML-as-primary-format (Grovekeeper stores in SQLite, exposes via visual UI)
- Spec-driven philosophy (Grovekeeper is execution-driven, not spec-driven)
- Extension marketplace (premature for single-user desktop app)

---

## License Compatibility

| Repository               | License             | Can Copy Code | Can Adapt Patterns | Notes                                             |
| ------------------------ | ------------------- | ------------- | ------------------ | ------------------------------------------------- |
| CodeBurn                 | MIT                 | YES           | YES                | Highest reuse — same problem domain               |
| t3code                   | MIT                 | YES           | YES                | Provider adapter contracts                        |
| vibe-kanban              | Apache 2.0          | YES           | YES                | Same Tauri 2 + Rust stack                         |
| pixel-agents             | MIT                 | YES           | YES                | Agent visualization patterns                      |
| peon-ping                | MIT                 | YES           | YES                | Sound packs, CESP standard                        |
| cline                    | Apache 2.0          | YES           | YES                | Multi-provider API, tool visualization            |
| cline-kanban             | MIT                 | YES           | YES                | Session state machine, worktree mapping           |
| OpenCovibe               | MIT                 | YES           | YES                | Session actor, Svelte chat components             |
| c9watch                  | MIT                 | YES           | YES                | Session monitoring patterns                       |
| hooks-observability      | MIT                 | YES           | YES                | Event pipeline, HITL response flow                |
| agent-flow               | MIT                 | YES           | YES                | Agent flow visualization                          |
| claude-code-templates    | MIT                 | YES           | YES                | Session handoff patterns                          |
| obsidian-tasks-dashboard | Private             | N/A (own)     | N/A (own)          | Predecessor project, same author                  |
| mpx-claude-code          | Private             | N/A (own)     | N/A (own)          | Own tooling, invoked via GUI                      |
| Multica                  | Modified Apache 2.0 | CAUTION       | YES                | No hosted-service redistribution; internal use OK |
| spec-kit                 | Open Source         | YES           | YES                | Workflow engine, step types, YAML orchestration   |

## Tech Stack Overlap

| Repository      | Tauri 2       | Rust        | Svelte     | TypeScript | SQLite        | Shared Libs              |
| --------------- | ------------- | ----------- | ---------- | ---------- | ------------- | ------------------------ |
| **Grovekeeper** | YES           | YES         | YES (5)    | YES        | YES           | —                        |
| vibe-kanban     | YES           | YES (Axum)  | no (React) | YES        | YES (SQLx)    | Tauri 2, SQLite, libgit2 |
| OpenCovibe      | YES           | YES         | YES (5)    | YES        | no            | Tauri 2, Svelte 5        |
| c9watch         | YES           | YES         | YES (5)    | YES        | no            | Tauri 2, SvelteKit       |
| CodeBurn        | no            | no          | no         | YES        | no            | TypeScript patterns      |
| t3code          | no (Electron) | no          | no (React) | YES        | YES           | TypeScript contracts     |
| cline           | no (VS Code)  | no          | no (React) | YES        | no            | Provider abstraction     |
| cline-kanban    | no            | no          | no (React) | YES        | no            | State machine, worktrees |
| hooks-obs.      | no            | no          | no (Vue)   | YES        | YES           | SQLite, WebSocket        |
| pixel-agents    | no (VS Code)  | no          | no (React) | YES        | no            | Canvas, hooks            |
| Multica         | no (Electron) | no (Go)     | no (React) | YES        | no (Postgres) | shadcn patterns          |
| peon-ping       | no            | no          | no         | no (Bash)  | no            | CESP standard            |
| spec-kit        | no            | no (Python) | no         | no         | no            | Workflow engine design   |

**Best code-level match:** vibe-kanban (Tauri 2 + Rust crates), OpenCovibe (Tauri 2 + Svelte 5)
**Best feature-level match:** CodeBurn (evaluation dashboard)
**Best pattern-level match:** t3code (provider abstraction), cline (multi-provider API), Multica (autopilot system), spec-kit (workflow engine)
