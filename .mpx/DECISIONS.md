# Grovekeeper Decisions

Settled architectural and design decisions. Each entry records what was chosen, why, and what was rejected. Updated after grilling sessions.

---

## Platform & Infrastructure

### Single process, multi-window via Tauri single_instance

Decided: 2026-04-28
What: One Tauri process. Each workspace gets its own WebviewWindow.
Why: Shared SQLite, IPC between windows, simpler auth flow.
Rejected: Electron multi-process (too heavy), separate processes per workspace (IPC complexity).

### SQLite with r2d2 pool in WAL mode (4 readers + 1 writer)

Decided: 2026-04-28
What: rusqlite (bundled), r2d2 connection pool, WAL journal mode.
Why: Single-file embedded DB, no external dependencies, concurrent read support.
Rejected: PostgreSQL (overkill for desktop), IndexedDB (no Rust access).

### ts-rs for Rust → TypeScript type generation

Decided: 2026-04-28
What: Rust structs are the single source of truth. TypeScript types generated via ts-rs.
Why: Eliminates type drift between backend and frontend.
Rejected: Manual type sync, protobuf (too heavy for desktop app).

### Provider adapter pattern from t3code

Decided: 2026-05-02
What: Each provider pushes unified events into a channel. Follow t3code's `ProviderAdapterShape`.
Why: Current trait was broken — sent `user_message` instead of `control_response` for approvals. t3code has battle-tested multi-provider impl.
Rejected: Original Provider trait (broken approval flow), per-provider custom integration.

### Four providers from day one

Decided: 2026-05-02
What: Claude Code + Cursor (ACP JSON-RPC) + Codex (stdio JSON) + OpenCode (HTTP/SSE). Full spawn+interact+monitor for all.
Why: Multi-provider is core value proposition; single-provider would miss the point.
Rejected: Claude Code only first (would bake in provider-specific assumptions).

### Stream-JSON protocol for session communication

Decided: 2026-04-28
What: JSONL streaming between Rust backend and AI provider processes.
Why: Standard format, easy to parse incrementally, matches Claude Code's native output.
Rejected: WebSocket (adds server complexity), gRPC (overkill).

### Frontend owns user-facing text

Decided: 2026-04-28
What: Rust returns error keys. Paraglide handles i18n (en + cs). No user-visible strings from backend.
Why: Centralized translation, consistent tone, frontend can format contextually.
Rejected: Backend-generated messages (hard to translate, inconsistent formatting).

### Sound formats: WAV + OGG + MP3

Decided: 2026-05-08
What: WAV for bundled sounds (lossless, tiny clips). OGG for user packs. MP3 via minimp3 rodio feature.
Why: WAV matches CESP/peon-ping. OGG is royalty-free. MP3 added because existing packs use it and minimp3 is MIT.
Rejected: WAV-only (too restrictive for imports), format conversion on import (friction).

### No discovery cache — scan fresh on navigate

Decided: 2026-05-10
What: AI Config page scans filesystem on every navigate. Manual "Refresh" button as fallback.
Why: ~50 files on local SSD is sub-second. Cache adds invalidation complexity.
Rejected: LRU cache (complexity), file watcher (overhead for infrequent page).

### No backdrop blur on overlays

Decided: 2026-05-10
What: Opacity-only overlays for all Sheet and Dialog components. No CSS backdrop-filter blur.
Why: Performance concern on weaker hardware. Standardized across all overlay components.
Rejected: Blur (laggy on low-end GPUs).

### AI Config: provider-agnostic adapter pattern for MCP

Decided: 2026-05-10
What: MCP server discovery uses same adapter pattern as session providers. Ship with Claude Code adapter first.
Why: Multiple providers will be supported; hardcoding Claude Code paths would need rewriting.
Rejected: Claude Code settings parsing only.

### AI Config: configurable discovery paths

Decided: 2026-05-10
What: Custom source folders added via native file browser (`pick_folder`). Stored as JSON array in `app_settings`. Each gets a user-defined label.
Why: User explicitly rejects hardcoded local paths.
Rejected: Hardcoded `mpx-claude-code` path.

---

## UI & Design System

### OKLCH design tokens, dark theme primary

Decided: 2026-04-29
What: All colors defined in OKLCH via CSS custom properties. `[data-theme]` selectors swap values. Dark is primary, light supported.
Why: Perceptually uniform color space. Dark theme matches developer preference.
Rejected: HSL (perceptual non-uniformity), light-first (audience preference).

### 12-preset accent color palette

Decided: 2026-05-07
What: moss, amber, bark, azure, plum, teal, rose, coral, gold, sage, indigo, fuchsia. Moss is default.
Why: Enough variety for workspace differentiation. OKLCH values hand-tuned for dark+light themes.
Rejected: Unlimited custom colors only (no presets), fewer than 12 (insufficient differentiation).

### Gradient-based color identity on issue cards

Decided: 2026-05-15
What: Issue cards use gradient backgrounds for color identity. No flat solid fills.
Why: Better visual hierarchy, works across dark/light themes, more visible color differentiation.
Rejected: Left accent border (AI design cliché), solid header band (too heavy), thin stripe alone (insufficient).

### Issue-color rings for hover/active, --primary for batch selection

Decided: 2026-05-06
What: Hover = 2px ring in issue color, no glow. Active = 3px ring + 14px glow in issue color. Selected (batch) = `--primary` moss green. Implemented via `box-shadow` (not Tailwind ring utilities).
Why: Issue-color rings create strong visual identity per card. Batch selection is system-level, not issue-specific.
Rejected: Fixed yellow/green for all states (no issue identity), blue for batch (collides with blue issues), Tailwind ring-\* (can't do blur glow).

### Ghost cards for non-adopted issues in accordion

Decided: 2026-05-15
What: Non-adopted GitHub-assigned issues appear as neutral gray cards (dashed border, muted) in a collapsible accordion below the adopted grid. Same card structure, most fields empty. Adopt split-button.
Why: Clear visual separation from adopted issues while keeping them contextually visible.
Rejected: Same grid mixed together (confusing), separate tab (tab-switching friction).

### No animation for executing state

Decided: 2026-05-15
What: Executing sessions show steady glow or header brightness boost. No breathing/pulsing animation.
Why: Executing is routine — animation would be distracting during normal work. Critical states (error, HITL) earn attention-drawing animation (red/amber pulse).
Rejected: Breathing glow (too distracting for common state), ambient oscillation.

### Session chat: right sidebar + 900px content column

Decided: 2026-05-06
What: Chat on left, metadata + sub-agents in 272px right sidebar (44px collapsed). All content shares 900px max-width column. Floating input panel with gradient fade mask.
Why: App-level left nav already occupies left side. 900px matches every production tool (Claude.ai, ChatGPT, Cursor).
Rejected: Left sidebar (conflicts with workspace nav), wider/narrower columns, full-width input bar.

### Settings: full sidebar with sections

Decided: 2026-05-08
What: Full sidebar navigation with all sections (placeholder tabs for undefined ones). No significant scrolling — split into sections if content exceeds ~2x visible height.
Why: User does not tolerate settings requiring significant scrolling.
Rejected: Horizontal tab bar (doesn't scale), single scrollable page.

### AI Config: 4th sidebar nav item, centered Dialog for details

Decided: 2026-05-10
What: Separate `/ai-config` route with Sparkles icon. Item details in centered Dialog (max-w-2xl, h-[80vh]), not Sheet.
Why: AI Config is conceptually separate from Settings. Dialog is more focused than Sheet and doesn't push content.
Rejected: Nesting under Settings (too buried), Sheet side panel (pushes content, inconsistent).

### ColorPicker: swatch trigger + popover dropdown, 24-preset palette

Decided: 2026-05-02
What: 32px swatch trigger opens Popover. 6×4 preset grid + hex input + native picker. Single design (no variants).
Why: Compact, one-click for common colors, hex input for precision.
Rejected: Inline color grid (too large), variant system (unnecessary complexity).

### Done state derived at render, not stored

Decided: 2026-05-15
What: "Done" computed from `github_issue_state='closed'` + `pr_state='merged'`. No DB status column. Visual: transparent bg, no borders, floating dim content.
Why: No schema migration needed. Archiving remains the only explicit status toggle.
Rejected: New `active/done/archived` DB column (unnecessary migration).

### View switcher: card grid vs compact rows

Decided: 2026-05-15
What: Global toggle between card grid and compact row view. Applies to both adopted and assigned sections. No per-card collapse/expand.
Why: Per-card expand was never fully implemented. Global density toggle is cleaner.
Rejected: Per-card collapse/expand (partially implemented, messy), rows only.

---

## Data & State

### AFK/HITL one-way flip

Decided: 2026-04-28
What: HITL flips to AFK after resolution. Never flips back. Unresolved items from execution create new linked issues.
Why: Prevents infinite loops. Clean separation between "needs input" and "ready to run."
Rejected: Bidirectional flip (risk of stuck loops), manual-only transitions.

### Character assignment per-issue with auto-random

Decided: 2026-05-08
What: Random character from enabled pool on issue creation. Manual override via issue card context menu + spawn dialog dropdown. Sessions without a Grovekeeper issue get no character.
Why: Per-issue makes the character persistent and meaningful on the card. Auto-random removes friction.
Rejected: Per-session (no persistence), user-picks-every-time (friction), round-robin (predictable).

### Notification: 3 importance tiers with per-session debounce

Decided: 2026-05-08
What: Critical (never debounced, sound ON): needs-input, session.end. Important (sound ON, debounce-able): error, conflict, pr.ready, resource.limit. Normal (sound OFF default): all others. Per-session debounce only, 2s default window.
Why: Importance tier controls default mute state directly. Per-session ensures distinct events from different sessions both play.
Rejected: Global debounce (would suppress distinct session events), all-on (noise), manual-only config.

### Volume: global × per-sound, no manifest layer

Decided: 2026-05-08
What: Two layers: global volume (0.0–1.0 in DB) × per-sound user override. No manifest-level volume.
Why: Internet-sourced sounds have wildly different volumes. Per-sound override handles this.
Rejected: Global only (can't fix loud individual sounds), 3-layer with manifest (overkill).

### Activity classification: deterministic tool-pattern + keyword regex

Decided: 2026-05-08
What: 163-line classifier ported from CodeBurn. Two-stage: tool-pattern dispatch → keyword refinement. 13 categories.
Why: Per-turn classification; LLM would be too costly.
Rejected: LLM-based classification (too expensive per turn).

### Pricing: LiteLLM with 24h TTL, bundled fallback

Decided: 2026-05-08
What: Fetch from LiteLLM GitHub raw JSON, 24h TTL. Bundled snapshot via `include_str!` as fallback. Fast mode = 6x for Opus.
Why: Same proven approach as CodeBurn. No API key required.
Rejected: Hardcoded prices (stale), real-time API (fragile).

### Session spawn: pre-fill from context, smart action chips

Decided: 2026-05-08
What: Dialog pre-populates from issue context. 3-4 contextual action chips ordered by issue state. First chip = most likely action. Single unified prompt field (chips are shortcuts). Unlimited prompt chaining.
Why: Reduces friction for common actions. Chips are discoverable without cluttering.
Rejected: Blank form every time, separate skill dropdown (extra click), limited chaining.

---

## Session & Providers

### Provider adapter with approval flow fix

Decided: 2026-05-02
What: `respond_to_request` + `respond_to_user_input` methods on provider trait. Fixes broken approval flow that sent `user_message` instead of `control_response`.
Why: Critical bug — current approval flow doesn't work. t3code's implementation is proven.
Rejected: Patching existing trait (fundamental design mismatch).

### Tool cards: 3-level system

Decided: 2026-05-02
What: Compact (one-line header), Expanded (header + preview), Interactive (full content + controls). Per-tool colors and icons.
Why: Most tool calls don't need full display. Progressive disclosure keeps chat readable.
Rejected: All-expanded (clutters chat), all-compact (hides important details).

### Session history import: 3-provider Rust parser

Decided: 2026-05-08
What: Full Rust port. Claude Code (JSONL), Cursor (SQLite state.vscdb), Codex (JSONL date-partitioned). Common `HistoricalImporter` trait. Dedup via `import_history` table. Parallel via rayon.
Why: All three providers supported from day one. Rust for performance on large histories.
Rejected: Frontend JS parsing (slow), Claude-only (misses user's other sessions).

---

## Workflow & UX Patterns

### Batch selection: right-click + modifiers, no checkboxes

Decided: 2026-05-04
What: Right-click "Select", Ctrl+click toggle, Shift+click range (Windows Explorer pattern), long press 500ms on mobile. No visible checkboxes. Persistent toolbar with contextual batch actions.
Why: Checkboxes waste space for an infrequent feature. Right-click is natural and discoverable.
Rejected: Always-visible checkboxes (visual noise), selection mode toggle button.

### Context menu: bits-ui ContextMenu, hybrid behavior

Decided: 2026-05-04
What: bits-ui ContextMenu for both forest and card. Right-clicking a batch-selected card shows batch actions. Right-clicking an unselected card clears selection, activates that card, shows single actions. Overflow button opens same menu programmatically.
Why: File manager pattern (Windows Explorer, macOS Finder). Overflow button essential for touch and keyboard-only.
Rejected: Separate batch/single menus, removing overflow button (breaks accessibility).

### Selection clears on tab change and Escape

Decided: 2026-05-04
What: Tab change clears all selection. Escape deselects. Batch action completion does NOT clear selection. Ctrl+A selects all regardless of scroll.
Why: Tab change implies context switch. Preserving selection after actions lets user chain operations.
Rejected: Clear after every action (can't chain), never clear (confusing on tab switch).

### Creation wizard: click always advances

Decided: 2026-05-05
What: All mouse click actions proceed to the next step instantly. If a step N is the last step, clicking creates the issue. Enter in inputs also advances.
Why: Consistent, predictable. No ambiguity about what click does.
Rejected: Explicit "Next" button required (extra click), different behavior per step.

### Only agent-type actions open spawn dialog

Decided: 2026-05-08
What: `agent` actions → spawn dialog. `deterministic` actions (git push, PR merge) → execute directly with lightweight confirm toast. `ui` actions → navigate.
Why: Deterministic actions don't need provider/model selection. Dialog would add unnecessary friction.
Rejected: Everything opens dialog (too much friction), everything executes directly (no config for agents).

### No display-only features

Decided: 2026-05-10
What: If a feature (like skill disable toggle) can't actually work with the provider, don't show a cosmetic-only UI for it. Skip entirely.
Why: User explicitly rejects cosmetic-only features that create false expectations.
Rejected: Display-only toggles as "coming soon" placeholders.

### IssueCard decomposed via Svelte createContext (not prop drilling)

Decided: 2026-05-16
What: IssueCard is a thin orchestrator (~130 lines) that creates an IssueCardContext via createContext(). Eight sub-components (IssueCardHeader, GitHubStatusRow, WorktreeRow, CommandResultsRow, etc.) consume the context directly — no prop chains.
Why: 526-line monolith was unmaintainable. Context avoids deeply nested prop drilling while keeping sub-components independently testable via IssueCardSubComponentStoryWrapper.
Rejected: Prop drilling (verbose, brittle), single-component monolith (untestable).

### Card variants are CSS-only via data-variant attribute

Decided: 2026-05-16
What: Three card visual modes (Veil, Horizon, Radiant) are switched by setting data-variant on the card root element. Each variant is defined as a CSS block overriding --card-\* custom properties. No JavaScript branching in component logic for variant differences.
Why: Runtime CSS is instant (no re-render), variants remain fully composable with state classes, and adding a new variant requires only a CSS block.
Rejected: Conditional Svelte markup per variant (bloats component), separate component per variant (duplication).

### Issue card appearance: two-tier settings cascade (user + workspace)

Decided: 2026-05-16
What: 10 appearance settings (variant, badge style, label tint, etc.) stored in app*settings table. User-level keys use `issue_card*`prefix. Workspace overrides use`ws*{dashboard_id}\_issue_card*` prefix and take priority.
Why: Allows per-dashboard visual tuning without a separate settings table. Matches existing app_settings pattern used by other features.
Rejected: Separate appearance table (schema migration cost), single global setting (no per-workspace override).

### Issue card: hide priority badge for "medium" priority

Decided: 2026-05-17
What: IssueCardHeaderActions suppresses the priority badge when the issue priority is "medium". Only non-default priorities (low, high, critical, urgent) show a badge.
Why: Medium is the default priority. Showing it on every card adds visual noise without information value — the absence of a badge communicates "medium" implicitly.
Rejected: Always show badge (clutter), configurable threshold (over-engineering for a UX heuristic).

### IssueCard self-contained folder: blocks/issue-card/

Decided: 2026-05-17
What: All IssueCard-specific files (sub-components, context, settings, variant CSS, utilities, stories) collapse into `components/blocks/issue-card/`. The `modules/issue-card/` directory is eliminated. General issue files (IssueDetail, AssignedIssuesPanel, dialogs) stay in `blocks/issue/`.
Why: Module/component boundary was leaky — context imported from blocks, blocks imported from modules. Single folder makes the component self-contained and discoverable.
Rejected: Keep split across modules + blocks (leaky boundary), flat blocks/issue/ with everything mixed (no separation of concerns).

### WorkspaceCard extracted to blocks/workspace-card/

Decided: 2026-05-17
What: WorkspaceCard.svelte + workspace_card_variants.ts + stories extracted to `components/blocks/workspace-card/`. No context decomposition needed (9 props, no sub-components).
Why: Same principle as IssueCard — card components get their own folder. Workspace folder keeps dialogs, selectors, and other workspace-level components.
Rejected: Leave in blocks/workspace/ mixed with 15+ unrelated files (poor discoverability).

### IssueCard consumes selection context directly (prop reduction)

Decided: 2026-05-17
What: IssueCard reads selection state (isActive, isHovered, isBatchSelected, isModifierHeld) and wires interaction callbacks (onCardClick, onTitleClick, onMouseEnter, onMouseLeave) by consuming the selection context directly, instead of receiving them as 8 separate props from IssueCardList.
Why: Selection state and interaction callbacks are tightly coupled — always derived from the same useSelection() context. Direct consumption drops 8 props, leaving ~14 genuine data dependencies as explicit props.
Rejected: Keep all 22 props explicit (verbose, most are selection plumbing), group into prop objects (adds indirection without reducing coupling).

### IssueCardList renamed to IssueCardGrid

Decided: 2026-05-17
What: IssueCardList.svelte renamed to IssueCardGrid.svelte. Stays mostly as-is — layout + interaction coordinator is appropriate for a block component.
Why: "Grid" more accurately describes the component's role (CSS grid layout, not a list). Consistent with the component's actual rendering.
Rejected: Further decomposition (already clean), keep "List" name (misleading — it renders a grid).
