# BamGit - Reference Repositories

External repositories that contain reusable patterns, code, and architectural decisions relevant to BamGit development. Agents should explore these when implementing related features.

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

Custom Claude Code configuration system: 20+ skills (mp-execute, mp-grill-me, mp-review, mp-commit-push-pr, etc.), agent definitions with model assignments (Opus/Sonnet/Haiku), lifecycle hooks (pre-commit gate with secret detection, dangerous command guard, format-on-save, notification flash+beep), and utility scripts. Key patterns: worktree setup script (`scripts/setup-worktree.sh` - copies IDE configs, .env, Peacock color, Claude settings, installs deps), notification system (`hooks/notify-flash-beep.ps1` - Win32 taskbar flash + sound), status line script (`scripts/context-bar.sh`), centralized settings.json with hook/plugin configuration. BamGit should invoke these skills and scripts via its GUI rather than reimplementing them.

---

## Session Resume & Handoff Across Providers

### https://github.com/yigitkonur/cli-continues/

CLI tool for resuming agent sessions across providers. Relevant for BamGit's ability to pick up an externally-launched session and continue it inside the app, or vice versa.

### C:\_MP_github_cloned\claude-code-templates

Contains a session-handoff skill (`cli-tool/components/skills/enterprise-communication/session-handoff/`) that creates comprehensive handoff documents for fresh agents to continue work. Features CREATE/RESUME modes, handoff chaining for long-running projects, and staleness detection. Useful pattern for BamGit's session continuity across app restarts or provider switches.

### C:\_MP_github_cloned\claude-code-hooks-multi-agent-observability

Real-time multi-agent monitoring via Claude Code hooks. Hook scripts capture events -> HTTP POST -> Bun server -> SQLite -> WebSocket -> Vue client. Key pattern: hook-based event capture pipeline for live agent orchestration tracking without modifying the agent itself.

### C:\_MP_github_cloned\agent-flow

Visualizes agent execution flow, subagent coordination, and tool call chains in real-time. Uses Claude Code hooks for zero-latency event streaming. Features timeline & transcript panels, multi-session tab support, and JSONL replay. Directly relevant to BamGit's session log visualization feature. Also available at https://github.com/patoles/agent-flow — primary reference for the visualization grilling session.

---

## Obsidian Dashboard Data Examples

### C:\Users\snapy\OneDrive\Obsidian\ObsidianMP\Projekty\Mini Projekty\MiniProjektyDashboard.md

Example of "many-repos-as-issues" dashboard type. Each issue represents an independent mini-project with fields: issue ID, name, path, priority, optional github_link, and optional worktree metadata (branch, origin folder, expected folder, setup state, base branch, base repository). Issues organized into Active, Assigned, and Archive sections.

### C:\Users\snapy\OneDrive\Obsidian\ObsidianMP\Finteractive\WorkDashboard.md

Example of "one-repo-many-issues" dashboard type. All issues belong to a single repository (atc-backoffice). Richer worktree metadata on most issues, with dependency chains (e.g., issue based on another feature branch instead of dev). Shows the full worktree lifecycle from creation through archival.
