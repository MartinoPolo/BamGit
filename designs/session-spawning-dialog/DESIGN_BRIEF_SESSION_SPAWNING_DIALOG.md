# Session Spawning Dialog — Design Brief

Design brief for the modal dialog that launches AI coding sessions. This is the bridge between issue management and AI execution — the user commits to running an agent with a specific provider, model, effort level, and prompt. Pre-fills from issue context, shows smart contextual action chips, and supports unlimited prompt chaining.

**GitHub issue**: #156
**Parent PRD**: #90 (Session Management & Chat UI)
**Gold standard reference**: `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md`

---

## 1. Purpose

Launch AI sessions with smart defaults and contextual suggestions. The dialog must make the common case (Claude Code + default model + issue context + primary action) a single-click-and-go, while exposing provider/model/effort/permissions for advanced control. Only `agent`-type actions open this dialog; `deterministic` actions (push, merge, worktree ops) execute directly with a lightweight confirm toast.

---

## 2. Surrounding Context

### Modal Overlay

- **Type**: Dialog (modal), centered on window.
- **Behind**: Dashboard dimmed with **opacity overlay only** — NO backdrop blur (per DECISIONS.md).
- **Behind content**: Sidebar + topbar + forest + bottom panel all visible but darkened through the overlay.
- **Focus trap**: Standard dialog focus management. Esc to close. First interactive element receives focus on open.

### Entry Points

- **Issue card primary/secondary action button** (when action is `agent` type).
- **Issue card overflow menu** (agent actions listed there).
- **Context menu** on issue card or forest tree.
- **Command palette** (`Ctrl+K` → "Run session", "Review", etc.).
- **Keyboard shortcut** (TBD — likely `Ctrl+Enter` on active issue card).

### What Opens This Dialog vs What Doesn't

| Invocation Type | Examples | Behavior |
|-----------------|----------|----------|
| `agent` | Run, Review, Check & Fix, Commit, Commit & Push, Commit Push & PR, Create PR, Code Clean, Sync Base, HITL | Opens this dialog |
| `deterministic` | Push, Merge, Setup Worktree, Remove Worktree, Retry Worktree | Executes directly (confirm toast) |
| `ui` | View Session | Navigates directly |

---

## 3. Requirements

### 3.1 Contextual Action Chips

Smart suggestion chips derived from `derive_contextual_actions.ts`. These are the **core UX innovation** — they surface the most relevant action based on issue state, eliminating the need to think about what to do next.

**Chip source**: The 14-priority cascade from `derive_contextual_actions.ts` determines which actions appear and their order. Only `agent`-type actions from the cascade appear as chips.

**Chip behavior**:
- 3-4 chips visible. First chip = most likely action (primary from cascade). Remaining = secondary + first overflow agents.
- Clicking a chip **pre-fills the prompt field** with the action's `commandTemplate` (e.g., `mp-execute #142`, `mp-review scope=branch`).
- First chip is **pre-selected by default** — prompt field is already populated on dialog open.
- Chips are shortcuts, not separate actions. The unified prompt field is what gets sent.
- Chip selection is **single-select** — clicking a different chip replaces the prompt.
- User can edit the pre-filled prompt or clear it entirely for a custom prompt.

**Agent actions from the action pool** (potential chips):

| Action | Command Template | Icon |
|--------|-----------------|------|
| Run | `mp-execute #{{issue_number}}` | play |
| HITL | `mp-hitl #{{issue_number}}` | hand |
| Review | `mp-review scope=branch` | eye |
| Check & Fix | `mp-check-fix` | wrench |
| Commit | `mp-commit` | git-commit-vertical |
| Commit & Push | `mp-commit-push` | git-commit-vertical |
| Commit Push & PR | `mp-commit-push-pr` | git-pull-request |
| Create PR | `mp-pr` | git-pull-request-create |
| Code Clean | `mp-code-clean` | sparkles |
| Sync Base | `mp-sync-base` | refresh-cw |

### 3.2 Provider Selector

Four providers, each with distinct identity:

| Provider | Kind | Description |
|----------|------|-------------|
| Claude Code | `claude-code` | `claude` CLI via stdin/stdout stream-JSON. **Default provider.** |
| OpenCode | `open-code` | `opencode serve` via HTTP REST + SSE. |
| Codex | `codex` | `codex` CLI via stdio JSON IPC. |
| Cursor | `cursor` | `agent acp` via JSON-RPC. Requires Cursor installed. |

- Pre-select Claude Code (or last-used provider via `app_settings`).
- Unavailable providers (not installed): shown but grayed out with "Not found" hint. Data from `InstalledProvider.installed`.
- Provider selection updates the model list, permission modes, and capability indicators.

### 3.3 Model Selector

- Populated dynamically per provider.
- Show model name + context window size (e.g., `claude-opus-4-7 (200K)`).
- Default: provider's default model (e.g., `claude-opus-4-7` for Claude Code).
- Monospace font for model names.

### 3.4 Effort Level

- Controls reasoning compute budget per request.
- Options: **Low** / **Medium** (default) / **High** / **Off**.
- Segmented control or similar compact selector.
- Only shown when provider supports it (`ProviderCapabilities`).

### 3.5 Permission Mode

Three modes: **Approve each** (default) / **Auto-accept edits** / **Bypass all**.

- For Codex and OpenCode: **cannot change mid-session**. Show a warning callout: "Cannot be changed after spawn."
- For Claude Code and Cursor: can change mid-session, normal field treatment.
- Available modes from `ProviderCapabilities.available_permission_modes`.

### 3.6 Prompt Field

- Single unified `Textarea` — the prompt sent to the AI agent.
- Pre-filled by the selected action chip's `commandTemplate` (with `{{issue_number}}` resolved).
- User can freely edit, extend, or replace.
- Placeholder when empty: "Describe what the agent should do..."
- **Unlimited prompt chaining**: after a session finishes, user can return and send another prompt. This is a future behavior — the dialog always shows one prompt at a time.

### 3.7 Character Override

- Dropdown showing the issue's currently assigned character (auto-selected).
- User can override for this session only.
- Shows character avatar thumbnail + name.
- Data from character pack system (per-issue assignment with auto-random).

### 3.8 Pre-fill Logic

When opened from an issue context:
- **Issue**: number, title, linked automatically. Shown as a compact info bar (not editable here).
- **Action chip**: primary action from cascade pre-selected, prompt pre-filled.
- **Provider**: last-used or default (Claude Code).
- **Model**: provider's default.
- **Effort**: Medium.
- **Permission mode**: Approve each.
- **Character**: issue's assigned character.
- **Worktree path**: issue's worktree (if exists).

When opened without issue context (e.g., from command palette with no active issue):
- Empty state: "No issue linked — select an issue or start without context."
- Action chips unavailable (no issue state to derive from).
- Prompt field empty.

### 3.9 Resume Existing Session

- Toggle or checkbox: "Resume an existing session."
- When enabled: shows a list of recent sessions for the selected provider (session ID, started time, last message preview, state).
- User picks one to resume via `--resume` or provider equivalent.
- When no sessions available: "No previous sessions for this provider."
- Session data from `Session` type: `id`, `started_at`, `last_response_summary`, `state`.

### 3.10 Workspace / Worktree Path

- Shows the issue's worktree path (e.g., `grovekeeper-worktrees/gradient-tokens/`).
- When no worktree: muted placeholder "No worktree — will prompt to create."
- Optional browse/select for a different worktree.

---

## 4. Existing Components to Reuse

| Component | Usage |
|-----------|-------|
| **Dialog** (shadcn, all parts) | Modal container: Overlay, Content, Header, Footer, Close |
| **Button** | Primary (launch), Ghost (chips, cancel), Secondary (advanced toggle) |
| **Badge** | Provider status indicators, model context-window tags |
| **Select / CustomSelect** | Model selector, character selector, worktree picker |
| **Textarea** | Prompt input field |
| **DropdownMenu** | Provider selection, overflow actions |
| **Tooltip** | Keyboard shortcut hints, unavailable provider explanations |
| **Kbd** | Keyboard shortcut display (Enter to launch, Esc to cancel) |
| **Separator** | Between dialog sections |
| **Progress** | Session launching indicator |
| **ProviderChip** | If exists — provider identity badge with icon + name |

---

## 5. Components to Design

| Component | Description |
|-----------|-------------|
| **ActionChipRow** | Horizontal row of 3-4 contextual action chips. Each chip: icon + label. Single-select. Pre-selected first chip. Ghost/outlined style, filled on selection. Compact — must not dominate the dialog. |
| **ProviderModelSelector** | Combined provider + model selection. Could be: provider tabs/chips → model dropdown. Or: flat tile grid (variant E style). Must show availability status and default indicator. |
| **EffortSelector** | Segmented control for Low/Medium/High/Off. Compact, inline. Hidden when provider doesn't support it. |
| **PermissionModeSelector** | Radio group or segmented control. Warning callout for Codex/OpenCode. |
| **IssueContextBar** | Compact read-only bar showing linked issue: color dot + `#142` + title (truncated). Monospace issue number. |
| **CharacterOverrideDropdown** | Select with avatar thumbnail + character name. Shows issue's current character as default. |
| **ResumeSessionList** | Expandable list of previous sessions: ID, timestamp, last message, state badge. |

---

## 6. Layout and Dimensions

- **Modal width**: `max-w-lg` (512px) to `max-w-xl` (576px). Compact — not a full wizard.
- **Height**: Flexible, scrollable if needed. Target: fits without scrolling for the common case.
- **Dark theme primary**, light theme supported via semantic tokens.

### Section Organization (top to bottom)

1. **Header**: Dialog title ("Start Session") + close button.
2. **Issue context bar**: Compact issue info (when opened from issue). Issue color dot + number + title.
3. **Action chip row**: 3-4 contextual suggestion chips. First pre-selected.
4. **Prompt field**: Textarea, pre-filled from selected chip.
5. **Provider + Model row**: Provider selector (left) + model dropdown (right). Inline.
6. **Effort + Permission row**: Effort segmented control (left) + permission mode (right). Inline. Permission warning shown below when relevant.
7. **Advanced section** (collapsed by default): Character override, worktree path, resume session toggle + list.
8. **Footer**: Cancel (ghost) + **Launch Session** (primary). `Kbd` hints: `Esc` / `Enter`.

---

## 7. States and Interactions

| State | Description |
|-------|-------------|
| **Default (from issue)** | Claude Code pre-selected, default model, primary action chip active, prompt pre-filled, issue context shown. Ready to launch immediately. |
| **Default (no issue)** | No issue bar, no action chips, empty prompt. Provider/model still selectable. |
| **Chip selected** | Clicked chip fills prompt. Previous prompt replaced. Selected chip visually highlighted. |
| **Chip deselected** | User clears prompt or types custom text. No chip highlighted. |
| **Provider unavailable** | Provider shown but grayed out + "Not installed" badge. Click shows install hint tooltip. |
| **Provider selected** | Model list updates. Capability-dependent fields show/hide (effort, permission warning). |
| **Model loading** | Spinner in model dropdown while fetching model list for selected provider. |
| **Permission warning** | Amber callout below permission selector for Codex/OpenCode: "Cannot be changed after spawn." |
| **Resume mode active** | Session list visible below advanced section. User must pick a session before launching. |
| **Resume list empty** | "No previous sessions for this provider." muted text. |
| **Launching** | Launch button shows spinner + "Starting..." Disable all fields. Progress indicator. |
| **Launch error** | Red error message below launch button. Fields re-enabled. |
| **Prompt empty** | Launch button still enabled (some actions don't need a custom prompt). Subtle hint: "Using default action prompt." |
| **Hover** | Standard interactive element hover states. Chips: bg-surface-hover. |
| **Focus** | Keyboard navigation with visible focus rings on all interactive elements. |

---

## 8. Design Constraints (Non-Negotiable)

- **No backdrop blur** on overlay. Opacity-only dimming (per DECISIONS.md).
- **Agent actions only**. `deterministic` and `ui` actions never open this dialog.
- **Must show contextual action chips** when opened from an issue. This is the core differentiator from a generic "new session" form.
- **Pre-fill by default**. The dialog should be launchable with zero additional input for the common case.
- **Must respect ProviderCapabilities**. Hide/disable fields the provider doesn't support.
- **Issue context is opt-out, not opt-in** — auto-attached when available.
- **Fast path**: common case (Claude Code + default model + primary action) should be one click (just hit Enter / Launch).
- **No display-only features** (per DECISIONS.md). If a provider doesn't support effort level, hide it entirely.
- Typography: Geist (sans) / Geist Mono (mono). Model names and issue numbers in mono.
- Forest Moss palette. All colors from `tokens.css`. OKLCH color space.
- Keyboard accessible: Tab through all fields, Enter to launch, Esc to close.

---

## 9. Design Freedom

Areas where the designer has creative latitude:

- **Action chip styling**: Pill shape vs rectangular, icon-left vs icon-only, outlined vs ghost vs subtle-filled. How the selected state looks (filled, underlined, ring, etc.).
- **Provider/model selection pattern**: Tab row, card tiles (variant E), dropdown combo, inline chips. Whether provider + model are separate selectors or a unified tile grid.
- **Layout arrangement**: Whether provider/model and effort/permission are separate rows, combined rows, or stacked sections. How much fits "above the fold" vs in advanced/collapsed.
- **Advanced section treatment**: Accordion, toggle-revealed, separate tab, or always visible with lower visual weight.
- **Issue context bar style**: Full-width colored bar, compact inline badge, subtle header annotation.
- **Prompt field sizing**: Fixed height vs auto-expanding. Whether it visually dominates or is compact.
- **Character override placement**: In advanced section, inline next to prompt, or in a toolbar.
- **Resume session UX**: Inline list, separate mode, dropdown picker.
- **Transition and animation**: Dialog enter/exit, chip selection, section expand/collapse.
- **Provider identity**: Colors (moss for Claude Code, azure for OpenCode, amber for Codex, bark for Cursor — from variant E), icons, visual differentiation.
- **Error and warning styling**: Inline callouts, border tints, icon indicators.

---

## 10. Inspiration and References

- **Issue Card v2 contextual action logic** (`derive_contextual_actions.ts`): The 14-priority cascade that determines which actions surface. The spawn dialog is where these agent-type actions actually get configured and launched.
- **Variant E (Quick-Launch Grid)** (`designs/session-spawning-dialog/variants/VARIANT-E.md`): Tiles as direct launch targets, cost badges, progressive disclosure. Good ideas for provider/model combined selection.
- **Creation Wizard**: The existing 5-step issue creation wizard shows the project's approach to multi-field dialogs. The spawn dialog should be **simpler** — fewer steps, more pre-filling, less wizard-like.
- **Action pool** (`action_pool.ts`): Each action has a `commandTemplate` with `{{issue_number}}` placeholders. Chips use these templates to pre-fill the prompt.
- **Claude.ai / ChatGPT new-chat model selectors**: Compact model pickers that don't dominate the UI.
- **t3code provider adapter**: The multi-provider pattern Grovekeeper follows for spawn mechanics.

---

## 11. Source Files

### Contextual Actions
- `src/lib/modules/contextual-actions/derive_contextual_actions.ts` — 14-priority cascade
- `src/lib/modules/contextual-actions/action_pool.ts` — action definitions with `commandTemplate` and `invocationType`
- `src/lib/modules/contextual-actions/types.ts` — `ActionId`, `ActionInvocationType`, `ContextualActionInput`, `DerivedActions`

### Session Types
- `src/lib/types/generated/Session.ts` — `Session` (id, issue_id, provider, state, cost_usd, token_count, original_intent, last_prompt, execution_phase, source, working_directory)
- `src/lib/types/generated/SessionState.ts` — `"running" | "needs-input" | "needs-review" | "paused" | "finished" | "errored"`
- `src/lib/types/generated/SessionSource.ts` — `"spawned" | "adopted"`
- `src/lib/types/generated/ExecutionPhase.ts` — `"none" | "analyzing" | "tdd" | "reviewing" | "verifying" | "committing"`

### Provider Types
- `src/lib/types/generated/ProviderKind.ts` — `"claude-code" | "open-code" | "codex" | "cursor"`
- `src/lib/types/generated/ProviderCapabilities.ts` — `supports_spawn`, `supports_mid_session_mode_switch`, `supports_mid_session_model_switch`, `available_permission_modes`
- `src/lib/types/generated/InstalledProvider.ts` — `kind`, `installed`, `binary_path`

### Session Context
- `src/lib/modules/sessions/sessions.context.svelte.ts` — session state management

### Mock Layer
- `src/lib/tauri_mock.ts` — mock handlers for all invoke calls (spawn included)
- `src/lib/modules/toasts/mock_toast_bridge.ts` — `TAURI_ONLY_COMMANDS` for browser-mode warnings

---

## 12. Not Included in This Design

- **Session chat view** (message stream, tool cards, sub-agent tree) — separate design: `SESSION_CHAT_VIEW.md`.
- **Provider installation instructions** — link out to provider docs.
- **Worktree creation UI** — separate feature. Spawn dialog shows existing worktree or "no worktree" state.
- **Skill configuration** (event-based: on_start, after_execution, on_error) — part of session chat view.
- **AFK loop auto-spawn** — uses the same spawn parameters but is triggered automatically, not via dialog.
- **Session history import** — separate feature for adopting historical sessions.
