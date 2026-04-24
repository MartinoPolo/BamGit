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

**Grovekeeper adaptation:** Study provider adapter pattern for designing R3's multi-provider expansion. The Effect system is React-specific, but the adapter contract (session lifecycle + event streaming + approval workflows) maps directly to Grovekeeper's Rust provider trait.

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

**Grovekeeper adaptation:** Study autopilot pattern for future "automated task execution" feature (GitHub trigger → create issue → spawn session → execute → create PR). The skill system maps to Grovekeeper's R8 action buttons. Daemon architecture is a more sophisticated version of Grovekeeper's session polling.

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

**Grovekeeper adaptation:** The agent state detection patterns (hooks + JSONL polling) validate Grovekeeper's existing approach. Sub-agent visualization (parent-child linking, spawn/despawn effects) could enhance Grovekeeper's forest view with companion saplings per sub-agent. Character personality system is reference for the peon-ping integration (agent voices).

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

- Integrate CESP event mapping into Grovekeeper's notification system (R9)
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

VS Code extension providing autonomous coding agent with ~40 LLM provider implementations (Anthropic, OpenAI, Gemini, Bedrock, Azure, Ollama, OpenRouter, etc.) behind a unified API abstraction. Rich tool call visualization with inline diffs, permission approval UI, and terminal output streaming. Key patterns: multi-provider API abstraction (`src/core/api/providers/`), layered architecture (extension -> webview -> controller -> task), context window optimization, MCP tool integration, session checkpoint/resume.

---

## Task Board & Worktree-per-Task Orchestration

### C:\_MP_github_cloned\cline-kanban

CLI + React web-UI kanban board where each task gets its own git worktree and terminal session (xterm.js + node-pty). Features a finite state machine for session states (running/awaiting_review/interrupted/exit), task dependency linking with auto-start chains, and tRPC for type-safe client-server communication. Key patterns: session state machine (`src/terminal/session-state-machine.ts`), task-to-worktree mapping (`src/workspace/task-worktree.ts`), agent CLI wrapping (`src/cline-sdk/cline-session-runtime.ts`), board mutations with dependency ordering.

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

Real-time multi-agent monitoring via Claude Code hooks. Hook scripts capture events -> HTTP POST -> Bun server -> SQLite -> WebSocket -> Vue client. Key pattern: hook-based event capture pipeline for live agent orchestration tracking without modifying the agent itself.

### C:\_MP_github_cloned\agent-flow

Visualizes agent execution flow, subagent coordination, and tool call chains in real-time. Uses Claude Code hooks for zero-latency event streaming. Features timeline & transcript panels, multi-session tab support, and JSONL replay. Directly relevant to Grovekeeper's session log visualization feature. Also available at https://github.com/patoles/agent-flow — primary reference for the visualization grilling session.

---

## Obsidian Dashboard Data Examples

### C:\Users\snapy\OneDrive\Obsidian\ObsidianMP\Projekty\Mini Projekty\MiniProjektyDashboard.md

Example of "many-repos-as-issues" dashboard type. Each issue represents an independent mini-project with fields: issue ID, name, path, priority, optional github_link, and optional worktree metadata (branch, origin folder, expected folder, setup state, base branch, base repository). Issues organized into Active, Assigned, and Archive sections.

### C:\Users\snapy\OneDrive\Obsidian\ObsidianMP\Finteractive\WorkDashboard.md

Example of "one-repo-many-issues" dashboard type. All issues belong to a single repository (atc-backoffice). Richer worktree metadata on most issues, with dependency chains (e.g., issue based on another feature branch instead of dev). Shows the full worktree lifecycle from creation through archival.
