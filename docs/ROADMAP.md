# BamGit Roadmap

> Master plan for transforming BamGit from a Git+agent tool into a portfolio-grade AI agent orchestration platform.
> Each phase is designed to be grilled into a PRD, then broken into vertical-slice issues.

Last updated: 2026-04-24

---

## Current State (v0.1 — 56 PRs shipped)

### Done

| Requirement                                         | Status   | PRs                                  |
| --------------------------------------------------- | -------- | ------------------------------------ |
| R1: Issue Dashboard (cards, badges, palettes)       | Complete | #1-#18                               |
| R2: Issue Creation (manual, quick add, GitHub)      | Complete | early PRs                            |
| R3: Session Management (spawn, monitor, adopt)      | Complete | stream-JSON parser, provider trait   |
| R6: Worktree Lifecycle (setup/remove scripts)       | Complete | state machine, progress UI           |
| R7: Git & GitHub Integration (sync, fetch, merge)   | Complete | GraphQL bulk sync, fetch coordinator |
| R8: Action Buttons / Skills                         | Complete | template variables, defaults         |
| R9: Notification System (toasts, sounds, flash)     | Complete | per-event config, SQLite             |
| R10: Configuration & Data (SQLite, export/import)   | Complete | dashboard management                 |
| R12: Forest View (11 tree stages, overlays, canvas) | Complete | #20-#26, #52-#58                     |

### Partially Done

| Requirement                                             | Status  | Remaining                                         |
| ------------------------------------------------------- | ------- | ------------------------------------------------- |
| R4: Session Dashboard (chat view, terminal)             | Partial | Rich chat view, embedded browser, session history |
| R5: Workspace Management (dev server, editor, terminal) | Partial | Embedded terminal, dev server launch, preview     |
| R11: Cross-Platform                                     | Partial | Windows primary, macOS/Linux untested             |

### Not Started (from career recommendations)

| Feature                 | Career Priority | Reference Repo               |
| ----------------------- | --------------- | ---------------------------- |
| Evaluation Dashboard    | P0              | CodeBurn                     |
| RAG Integration         | P1              | —                            |
| Prompt Analytics        | P2              | CodeBurn                     |
| Multi-Provider Support  | P3              | t3code, vibe-kanban, Multica |
| Model Comparison Engine | P3              | CodeBurn                     |

---

## License Compatibility

| Repository   | License             | Can Copy Code | Can Adapt Patterns | Notes                                             |
| ------------ | ------------------- | ------------- | ------------------ | ------------------------------------------------- |
| CodeBurn     | MIT                 | YES           | YES                | Highest reuse — same problem domain               |
| t3code       | MIT                 | YES           | YES                | Provider adapter contracts                        |
| vibe-kanban  | Apache 2.0          | YES           | YES                | Same Tauri 2 + Rust stack                         |
| pixel-agents | MIT                 | YES           | YES                | Agent visualization patterns                      |
| peon-ping    | MIT                 | YES           | YES                | Sound packs, CESP standard                        |
| Multica      | Modified Apache 2.0 | CAUTION       | YES                | No hosted-service redistribution; internal use OK |

---

## Tech Stack Overlap

| Repository   | Tauri 2       | Rust       | Svelte     | TypeScript | SQLite        | Shared Libs              |
| ------------ | ------------- | ---------- | ---------- | ---------- | ------------- | ------------------------ |
| **BamGit**   | YES           | YES        | YES (5)    | YES        | YES           | —                        |
| vibe-kanban  | YES           | YES (Axum) | no (React) | YES        | YES (SQLx)    | Tauri 2, SQLite, libgit2 |
| CodeBurn     | no            | no         | no         | YES        | no            | TypeScript patterns      |
| t3code       | no (Electron) | no         | no (React) | YES        | YES           | TypeScript contracts     |
| pixel-agents | no (VS Code)  | no         | no (React) | YES        | no            | Canvas, hooks            |
| Multica      | no (Electron) | no (Go)    | no (React) | YES        | no (Postgres) | shadcn patterns          |
| peon-ping    | no            | no         | no         | no (Bash)  | no            | CESP standard            |

**Best code-level match:** vibe-kanban (Tauri 2 + Rust crates)
**Best feature-level match:** CodeBurn (evaluation dashboard)
**Best pattern-level match:** t3code (provider abstraction), Multica (autopilot system)

---

## Phased Roadmap

### Phase 1: Design System Overhaul

**Goal:** Establish polished, consistent visual identity before building new features.
**Effort:** 1-2 weeks | **Career value:** Portfolio polish
**Prerequisite:** Core Design tool integration

#### What to do

1. Audit existing components — catalog every UI element, identify inconsistencies
2. Define design tokens — OKLCH color scales, spacing, typography, shadows, radii
3. Build component library — upgrade shadcn-svelte components with new tokens
4. Apply to existing pages — Issue Dashboard, Settings, Forest View
5. Create dark/light theme variants with proper contrast ratios
6. Document in Storybook — ensure every component has a story

#### References

- **Multica** `packages/ui/`: 56 shadcn-style components with CVA variants, dark mode via next-themes
- **t3code** `apps/web/src/components/ui/`: 42 base primitives, OKLCH theming, Base UI + CVA
- **vibe-kanban** `packages/ui/src/components/`: 100+ Radix-based components, Tailwind + shadcn pattern
- **pixel-agents** `webview-ui/src/`: Pixel-perfect retro aesthetic with CSS variables for theming

#### PRD scope

- Component inventory + gap analysis
- Design token system (OKLCH palette, spacing scale, type scale)
- Storybook coverage targets
- Accessibility checklist (WCAG AA)

---

### Phase 2: Evaluation Dashboard (Career P0)

**Goal:** Track and visualize agent session metrics — the #1 differentiator for AI engineering hiring.
**Effort:** 2-3 weeks | **Career value:** CRITICAL — evaluation methodology, AI observability
**Primary reference:** CodeBurn

#### What to build

**2a. Data Collection Layer (Rust backend)**

- Extend session model with per-turn metrics: input/output/cache tokens, cost (USD), tool names, duration
- Port CodeBurn's 13-category activity classifier to Rust (regex + keyword matching, no LLM calls)
- Add one-shot success detection (Edit→Bash→Edit retry cycle counting)
- Store metrics in SQLite: `session_metrics`, `turn_metrics`, `daily_aggregates` tables
- Pricing engine: LiteLLM-compatible model pricing with hardcoded fallbacks, cache-aware cost calculation

**2b. Dashboard UI (Svelte)**

- Overview panel: total cost, API calls, sessions, tokens (input/output/cache), cache hit %
- Daily cost chart: cost per day with gradient heatmap
- Activity breakdown: 13 categories with turns, cost, one-shot rate
- Model breakdown: cost + call count by model
- Top sessions: most expensive sessions with date, project, cost
- Tool usage: Read, Write, Edit, Bash, Grep, Agent distribution
- Period switching: Today / 7 Days / 30 Days / Month / All Time

**2c. Optimize Mode**

- Scan session data for waste patterns (duplicate reads, low read:edit ratio, bloated context)
- Health score (A-F grading)
- Actionable recommendations with estimated savings

#### Key files to study in CodeBurn

| Feature             | File                   | What to port                                           |
| ------------------- | ---------------------- | ------------------------------------------------------ |
| Activity classifier | `src/classifier.ts`    | 13-category regex+keyword rules                        |
| Cost engine         | `src/models.ts`        | LiteLLM pricing, cache-aware calc, model normalization |
| One-shot metrics    | `src/classifier.ts`    | Edit→Bash→Edit retry detection                         |
| Optimize            | `src/optimize.ts`      | Waste patterns, health scoring                         |
| Dashboard layout    | `src/dashboard.tsx`    | Panel arrangement, data flow                           |
| Model comparison    | `src/compare-stats.ts` | Side-by-side metric computation                        |
| Daily cache         | `src/daily-cache.ts`   | Per-day aggregation with file locking                  |

#### PRD scope

- Data model (tables, fields, indexes)
- Classifier rules (13 categories with trigger patterns)
- One-shot detection algorithm
- Dashboard wireframes (panel layout, charts)
- Optimize mode rules and scoring
- Export format (JSON/CSV)

---

### Phase 3: Session Dashboard Completion (R4)

**Goal:** Complete the session interface — rich chat view, terminal, embedded preview.
**Effort:** 2 weeks | **Career value:** Core product functionality

#### What to build

**3a. Rich Chat View**

- Markdown rendering with code blocks, syntax highlighting
- Tool call cards showing tool name, arguments, result summary
- Diff views for Edit/Write tool calls (inline diff rendering)
- Approval/permission request cards
- Collapsible thinking blocks

**3b. Terminal View**

- xterm.js terminal per session showing raw CLI output
- Toggle between rich chat and terminal views

**3c. Session History**

- Browse past sessions for any issue
- Session timeline showing key events (start, tool calls, errors, completion)

#### References

- **t3code** `apps/web/src/components/chat/`: Lexical-based composer, approval cards, terminal context
- **vibe-kanban** `packages/ui/src/components/Chat*.tsx`: 22 chat components — assistant/user/system messages, aggregated diffs, approval cards, todo lists
- **OpenCovibe**: Rich Svelte components for chat/tool visualization (same Svelte stack)
- **pixel-agents** `webview-ui/src/components/ToolOverlay.tsx`: Agent status overlay with tool tracking
- **agent-flow**: Timeline & transcript panels, tool call chain visualization

#### PRD scope

- Chat message types (user, assistant, tool call, error, thinking)
- Tool call card designs per tool type
- Diff rendering approach (inline vs side-by-side)
- Terminal integration (xterm.js config)
- Session history data model + UI

---

### Phase 4: Multi-Provider Support (Career P3)

**Goal:** Expand beyond Claude Code to support Codex, Copilot, Gemini, local models.
**Effort:** 3-4 weeks | **Career value:** HIGH — multi-model architecture, provider-agnostic design

#### What to build

**4a. Provider Trait Expansion (Rust)**

- Generalize existing Claude Code provider trait to support multiple backends
- Add Codex provider (OpenAI CLI, stdio JSON-RPC)
- Add Copilot provider (GitHub Copilot session state)
- Add OpenCode provider (SDK-based)
- Each provider: session lifecycle, event streaming, token tracking, tool approval

**4b. Model Comparison Engine**

- Run same task on multiple providers
- Side-by-side results display
- Compare: cost, speed, token usage, output quality (manual rating)
- Recommendation engine ("For this task type, Provider X is 40% cheaper with similar quality")

**4c. Provider Configuration UI**

- Provider selection per session
- Model selection within provider
- Provider health status (CLI installed, authenticated, version)

#### References

- **t3code** `apps/server/src/provider/`: Generic `ProviderAdapter<E>` with 4 implementations (Claude Agent SDK, Codex, OpenCode, Cursor). Error algebra, event streaming, approval workflows.
- **Multica** `server/pkg/agent/`: Unified `Backend` interface for 10 CLIs. `Execute(ctx, prompt, opts)` contract. Version detection, model enumeration. Auto-detect CLIs on PATH.
- **vibe-kanban** `crates/executors/`: Execution process state machine: init → setup → running → complete. 10+ agent adapters.
- **CodeBurn** `src/providers/`: Provider plugin system for session discovery + parsing (7 providers). Good for the "read session data" side.
- **cline** `src/core/api/providers/`: 40 LLM provider implementations behind unified API.

#### PRD scope

- Provider trait contract (Rust)
- Per-provider: data locations, protocols, event types, capabilities
- Provider discovery (PATH scanning, config detection)
- Model comparison algorithm + UI wireframes
- Session migration between providers

---

### Phase 5: RAG Integration (Career P1)

**Goal:** Index past session transcripts for context-aware agent spawning.
**Effort:** 2-3 weeks | **Career value:** HIGH — vector databases, embedding models, retrieval pipelines

#### What to build

**5a. Embedding Pipeline**

- Index session transcripts into vector store (LanceDB — Rust-native, no server)
- Generate embeddings via local model (all-MiniLM-L6-v2 via ONNX) or API (Voyage/OpenAI)
- Chunking strategy: split by tool-call boundaries (natural semantic units from stream-JSON)

**5b. Search UI**

- "How did I solve X last time?" → retrieves relevant past sessions
- Show matching chunks with source session + issue context
- Click to navigate to full session transcript

**5c. Context Injection**

- When spawning new session, optionally inject relevant past context from RAG
- Smart context selection: only inject chunks relevant to current issue description
- Token budget management: don't exceed context window with injected chunks

#### References

- **Multica** `server/pkg/db/`: pgvector integration for embeddings (PostgreSQL-based, BamGit would use LanceDB for local-first)
- Career recommendations (P1 section): ChromaDB/LanceDB, chunking strategies, embedding model options

#### PRD scope

- Vector store choice (LanceDB vs ChromaDB vs SQLite-vss)
- Embedding model (local ONNX vs API)
- Chunking algorithm (tool-call boundaries, max chunk size)
- Search interface wireframes
- Context injection UX (opt-in, preview, token budget)
- Storage and indexing performance requirements

---

### Phase 6: Prompt Analytics (Career P2)

**Goal:** Systematic prompt engineering — track which skill templates produce better outcomes.
**Effort:** 1-2 weeks | **Career value:** MEDIUM — prompt engineering at systems level

#### What to build

- Track which action/skill templates (R8) produce better outcomes
- A/B comparison: same task, different prompt → which performed better?
- Prompt versioning: store prompt history per skill, correlate with eval metrics from Phase 2
- Token budget analysis: which prompts are cost-efficient?
- Dashboard: prompt effectiveness rankings, cost-per-success trends

#### References

- **CodeBurn** `src/compare-stats.ts`: Model comparison metrics pattern — adapt for prompt comparison
- **Multica** skills system: Versioned, documented skills with execution logs — adapt for prompt versioning

#### PRD scope

- Prompt versioning data model
- Comparison methodology (controlled variables, sample size)
- Dashboard wireframes
- Integration with Phase 2 eval metrics

---

### Phase 7: Autopilot & Automated Workflows

**Goal:** GitHub trigger → create issue → spawn session → execute → create PR. Fully autonomous.
**Effort:** 2-3 weeks | **Career value:** HIGH — autonomous agent orchestration

#### What to build

**7a. Enhanced GitHub Trigger**

- Expand existing `bamgit:execute` label polling into full autopilot
- Webhook support (when available) alongside polling fallback
- Trigger types: label, issue creation, PR event, cron schedule

**7b. Execution Pipeline**

- Trigger fires → create BamGit issue + worktree automatically
- Spawn session with issue description as prompt
- Monitor execution → handle errors, retries, permission requests
- On completion: create PR, update issue status, notify

**7c. Skill Library**

- Save successful execution patterns as reusable skills
- Versioning, documentation, team sharing
- Skill marketplace: browse community-contributed skills

#### References

- **Multica** `server/internal/service/autopilot.go`: Full autopilot system — webhook/cron/manual triggers, create_issue vs run_only modes, skill templates, run history
- **Multica** `server/internal/daemon/daemon.go`: Task polling loop, CLI auto-detection, repo cache, execution streaming
- **Multica** `server/internal/service/task.go`: Task lifecycle state machine — enqueue → claim → start → complete

#### PRD scope

- Trigger types and configuration
- Execution pipeline state machine
- Error handling and retry strategy
- Skill system data model
- Permission/approval handling for autonomous mode

---

### Phase 8: Agent Personality & Warcraft Voices

**Goal:** Give agents character — Warcraft-themed sounds, Czech translations, personality system.
**Effort:** 1-2 weeks | **Career value:** LOW (but fun, memorable differentiator)

#### What to build

**8a. CESP Integration**

- Adopt peon-ping's Coding Event Sound Pack Specification
- Map BamGit notification events (R9) to CESP categories
- Load peon-ping sound packs directly (compatible manifest format)

**8b. Pack Management**

- Browse and install packs from peon-ping registry (openpeon.com)
- Assign packs per issue or per session (like peon-ping's path_rules)
- Pack rotation and no-repeat logic

**8c. Czech Warcraft Voices (Custom Pack)**

- Create custom sound pack with Czech-language Warcraft character lines
- Orc Peon: "Práce, práce.", "Hotovo, pane!", "Jo, šéfe.", "Co teď?", "Připraven k práci!"
- Human Peasant: "Ano, můj pane?", "Práce hotova!", "Rozkaz, pane."
- Record or synthesize Czech voice lines
- Package as openpeon.json manifest

**8d. Agent Personality in Forest View**

- Each tree/issue can have an assigned character voice
- Sound plays on state transitions (seed planted, tree growing, fruiting, etc.)
- Visual character indicator near tree (small icon showing assigned pack)

#### References

- **peon-ping**: CESP standard, sound pack manifest format, event mapping, selection hierarchy, debouncing
- **pixel-agents** `webview-ui/src/office/sprites/`: Character palette system, personality assignment per agent
- **pixel-agents** `src/transcriptParser.ts`: Agent state → character animation mapping

#### PRD scope

- CESP event mapping for BamGit events
- Pack manifest format compatibility
- Czech voice line script (all CESP categories)
- Forest view integration points
- User preferences UI

---

### Phase 9: Polish, Marketing & Launch

**Goal:** Demo-ready, portfolio-showcasing application.
**Effort:** 2-3 weeks | **Career value:** CRITICAL — presentation, blog posts, demo video

#### What to do

1. **Cross-platform testing** — macOS and Linux builds, fix platform-specific issues
2. **Performance audit** — profile Forest View rendering, optimize SQLite queries
3. **Rename consideration** — Evaluate names from career recommendations (Grovekeeper, Dendrite, Arboretum)
4. **Blog post 1:** "Building a Multi-Agent Orchestration Platform from Scratch"
5. **Blog post 2:** "Measuring AI Agent Performance: What I Learned from 500 Sessions"
6. **Demo video:** 3-5 minute walkthrough of key features
7. **README rewrite** — position as AI orchestration platform, not Git tool
8. **CV rewrite** — AI Engineer framing per career recommendations
9. **Release v1.0** — GitHub release, tag, changelog

---

## Grilling Order

Each phase should go through the `/mp-grill-me` process before implementation. Recommended grilling order:

| #   | Phase             | Grill Focus                          | Key Questions                                                                             |
| --- | ----------------- | ------------------------------------ | ----------------------------------------------------------------------------------------- |
| 1   | Design System     | Token system, component API          | Which OKLCH palette? shadcn defaults or custom? Component variant strategy?               |
| 2   | Eval Dashboard    | Data model, classifier rules         | Which metrics are most valuable for hiring? How to handle sessions with mixed activities? |
| 3   | Session Dashboard | Chat rendering, terminal integration | Rich view vs terminal — always both? How to handle very long sessions?                    |
| 4   | Multi-Provider    | Provider trait design                | Which providers first? How to handle different capability sets?                           |
| 5   | RAG               | Vector store, chunking               | Local vs API embeddings? How much historical context to index?                            |
| 6   | Prompt Analytics  | Comparison methodology               | How to define "better outcome"? Sample size requirements?                                 |
| 7   | Autopilot         | Execution pipeline                   | How much autonomy? Approval gates? Error budget?                                          |
| 8   | Agent Voices      | Pack selection, Czech script         | Which characters? How many lines per category? TTS vs recorded?                           |

---

## Issue Tracking Strategy

### Where to track

- **GitHub Issues** on BamGit repo — source of truth for all work items
- **PRDs** — one GitHub issue per phase, labeled `prd`
- **Sub-issues** — vertical slices under each PRD, linked via task lists
- **This ROADMAP.md** — high-level plan and phase sequencing (update as phases complete)
- **CAREER_RECOMMENDATIONS.md** — career context and priority reasoning (don't duplicate here)

### Labeling convention

| Label                    | Meaning                                              |
| ------------------------ | ---------------------------------------------------- |
| `prd`                    | PRD issue (one per phase)                            |
| `phase-N`                | Phase number (e.g., `phase-2` for Eval Dashboard)    |
| `grilled`                | PRD has been grilled and is ready for implementation |
| `reference:codeburn`     | References CodeBurn patterns                         |
| `reference:t3code`       | References t3code patterns                           |
| `reference:multica`      | References Multica patterns                          |
| `reference:vibe-kanban`  | References vibe-kanban patterns                      |
| `reference:peon-ping`    | References peon-ping patterns                        |
| `reference:pixel-agents` | References pixel-agents patterns                     |

---

## Timeline (Aligned with Career Recommendations)

```
WEEK 1-2          WEEK 3-5          WEEK 6-7          WEEK 8-10
|                 |                 |                  |
| Phase 1:        | Phase 2:        | Phase 3:         | Phase 4:
| Design System   | Eval Dashboard  | Session Dashboard| Multi-Provider
| + Core Design   | (Career P0)     | (R4 completion)  | (Career P3)
|                 |                 |                  |
                  DEMO-READY ──────────────────────────> PORTFOLIO-READY

WEEK 10-12        WEEK 12-14        WEEK 14+
|                 |                  |
| Phase 5:        | Phase 6+7:       | Phase 8+9:
| RAG Integration | Prompt Analytics | Agent Voices
| (Career P1)     | + Autopilot      | + Polish + Launch
|                 |                  |
```

**Critical path:** Phases 1 → 2 → 3 → 9. These make the app demo-ready and portfolio-worthy.
**Parallel work:** Phases 4-8 can be interleaved based on energy and interview preparation needs.

---

## Quick Reference: Which Repo Helps With What

| BamGit Feature          | Primary Reference              | Secondary Reference  | What to Copy/Adapt                        |
| ----------------------- | ------------------------------ | -------------------- | ----------------------------------------- |
| Eval Dashboard          | CodeBurn                       | —                    | Classifier, cost engine, dashboard layout |
| Activity Classification | CodeBurn `classifier.ts`       | —                    | 13-category rules, one-shot detection     |
| Cost Tracking           | CodeBurn `models.ts`           | —                    | LiteLLM pricing, cache-aware calc         |
| Optimize Mode           | CodeBurn `optimize.ts`         | —                    | Waste patterns, health scoring            |
| Model Comparison        | CodeBurn `compare-stats.ts`    | t3code               | Side-by-side metrics                      |
| Provider Abstraction    | t3code `provider/`             | Multica `pkg/agent/` | Adapter contract, event streaming         |
| Claude Agent SDK        | t3code `ClaudeAdapter.ts`      | —                    | Full Agent Protocol                       |
| Multi-CLI Detection     | Multica `daemon/`              | t3code               | PATH scanning, version detection          |
| Autopilot / Workflows   | Multica `service/autopilot.go` | —                    | Trigger→execute→complete pipeline         |
| Task State Machine      | Multica `service/task.go`      | vibe-kanban          | Enqueue→claim→start→complete              |
| Skill/Template System   | Multica skills                 | peon-ping skills     | Versioned, shareable templates            |
| Kanban Board            | vibe-kanban `Kanban*.tsx`      | Multica views        | Drag-drop, bulk actions, filters          |
| Rust Worktree Mgmt      | vibe-kanban `crates/`          | —                    | Worktree lifecycle, cleanup               |
| Diff Viewer             | vibe-kanban `Diff*.tsx`        | —                    | @git-diff-view patterns                   |
| Review Infrastructure   | vibe-kanban `crates/review/`   | —                    | Inline diff comments                      |
| Type Sharing (Rust→TS)  | vibe-kanban (ts-rs)            | —                    | Eliminate manual TS wrappers              |
| Notification Sounds     | peon-ping                      | —                    | CESP standard, pack manifests             |
| Czech Warcraft Voices   | peon-ping (custom pack)        | —                    | Character lines, TTS/recording            |
| Agent Visualization     | pixel-agents                   | —                    | State machine, sub-agent rendering        |
| Agent Teams/Sub-agents  | pixel-agents                   | —                    | Parent-child linking, spawn effects       |
| Chat UI Components      | OpenCovibe                     | t3code, vibe-kanban  | Svelte chat components                    |
| Session Monitoring      | c9watch                        | pixel-agents         | Process scanning, JSONL polling           |
| Session Handoff         | claude-code-templates          | cli-continues        | Handoff documents, resume                 |
| Agent Flow Viz          | agent-flow                     | —                    | Timeline, tool chains, replay             |
