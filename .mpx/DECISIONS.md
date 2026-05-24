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
What: Hover = 2px ring in issue color, no glow. Active = 3px ring + 14px glow in issue color. Selected (batch) = `--primary` moss green. selectionHover also uses `--primary`. Implemented via `box-shadow` (not Tailwind ring utilities).
Why: Issue-color rings create strong visual identity per card. Batch selection is system-level, not issue-specific.
Rejected: Fixed yellow/green for all states (no issue identity), blue for batch (collides with blue issues), Tailwind ring-\* (can't do blur glow).
Note: Re-confirmed 2026-05-24: selected + selectionHover use `--primary`. Active uses issue color. Requirements doc updated to match.

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

### AI Config: absorbed into settings as category (was: 4th sidebar nav item)

Decided: 2026-05-10. **Superseded by PRD #320 — AI Config now absorbed into /settings/ai-config.**
What: AI Config moved from standalone `/ai-config` route to `/settings/ai-config` category. Item details still use centered Dialog. Settings layout renders AI config full-width (no `max-w-3xl` constraint).
Why: PRD #320 unifies all configuration under `/settings/*`. AI Config as a separate nav item fragmented the settings experience.
Rejected (original): Nesting under Settings (too buried). Reversed because the settings shell now has proper sidebar navigation making it easy to find.

### Settings: two-layer system with full-page route shell

Decided: 2026-05-17 (supersedes 2026-05-08 "full sidebar with sections")
What: Settings is a full SvelteKit route (`/settings/*`) replacing the entire page. Sidebar switches to category navigation with "← Back to app" at top. Escape exits settings immediately. Two scopes via segmented control in sidebar header: User (global defaults) and Workspace (per-workspace overrides). Workspace scope shows filtered categories (only overridable ones) plus a dedicated Workspace category. Codex-inspired UX.
Why: Consolidates all settings into one coherent system. Two-layer cascade (user → workspace) formalizes the ad-hoc pattern from issue card settings. Full-page approach gives room for dense categories.
Rejected: Overlay mode (no deep-linking), side panel (constrained width), separate workspace settings page (duplicates UI).

### Settings: replaceState for category navigation, stored returnUrl for back

Decided: 2026-05-17
What: Settings replaces the existing DashboardSidebar (root layout hides it on `/settings/*` routes). Category navigation within settings uses `goto(path, { replaceState: true })` so only the initial entry creates a browser history entry. Back button and Escape use a stored `returnUrl` (set on settings entry) instead of `history.back()`. Browser back also returns to pre-settings page.
Why: Prevents double sidebar, history pollution, and broken back navigation. State-based overlay was rejected because it adds complexity (mount/unmount cycles, dual DOM), and the meaningful page state (active dashboard, selection) lives in context/URL params and survives navigation.
Rejected: State-based overlay (complex mount/unmount, settings components lose state too), history.back() (walks through category history), hybrid state+URL (two systems to sync).

### Settings: 9 categories with two subcategory patterns

### Settings: entry points

Decided: 2026-05-17
Why: Balances granularity with navigability. Two subcategory patterns serve different needs: nested sidebar for related-but-distinct sections (Notifications), horizontal tabs for provider-scoped content (AI Config).
What: General, Account, Appearance, Issue Cards, Notifications (nested sidebar items: Events/Packs/Characters), AI Configuration (horizontal tabs with provider selector above), Keyboard Shortcuts, Language, Developer Tools (dev builds only). Workspace-overridable: Appearance, Issue Cards, Notifications, AI Config. User-only: Account, General, Shortcuts, Language, Dev Tools.

Rejected: 6 categories (too consolidated), 10+ categories (too granular), tabs for all categories (unnecessary).

### Settings: AI Config absorbed into settings

Decided: 2026-05-17 (supersedes 2026-05-10 "4th sidebar nav item")
What: AI Config moves from standalone `/ai-config` route to `/settings/ai-config` as a settings category. Provider selector + horizontal tabs (Skills, Agents, Hooks, MCP, Memories, Instructions, Rules, Settings) preserved. Item detail views stay as centered Dialogs. Sidebar nav reduced to Dashboard, Sessions, Usage.
Why: User wants all configuration in one place. AI Config's complexity is handled by horizontal tabs within the settings category.
Rejected: Keeping as separate nav item (scattered configuration), splitting into multiple settings categories (fragments the AI experience).

### Settings: SQLite-only persistence with localStorage mirror

Decided: 2026-05-17
What: All settings stored in SQLite: `user_settings(key PK, value)` + `workspace_settings(dashboard_id, key, value, PK(dashboard_id, key))`. Resolution: workspace → user → hardcoded default. Theme and accent also written to localStorage as mirror for instant application before Tauri bridge loads (FOUC prevention).
Why: Single source of truth simplifies cascade resolution, backup, and export. localStorage mirror solves the startup flash problem without complexity.
Rejected: localStorage-only (no workspace override), hybrid persistence (two sources of truth), accept FOUC (noticeable flash).

### Settings: override indicators and scope switching

Decided: 2026-05-17
Why: Clear visual feedback for what's overridden. Segmented control is always visible and switchable.
What: Workspace settings show colored dot + "Reset to default" button next to overridden values. Scope switcher is a segmented control in sidebar header (`[User] [Workspace: Name]`). Hidden when no workspace active (Overview page). Gear icon from workspace header auto-selects workspace scope. Back button reads "← Back to WorkspaceName" in workspace scope.
Rejected: Side-by-side values (too wide), background highlight (too noisy), disabled segment (confusing).

Rejected: Settings as sidebar nav item (removed), language switcher in account section (rarely used).
Why: Multiple contextual entry points. Quick edit modal preserved for fast workspace property changes.
What: User settings: account section gear button (bottom-left sidebar) + Ctrl+, + Overview page gear icon. Workspace settings: gear icon next to pencil in workspace header. Quick workspace edit: pencil icon opens DashboardEditDialog modal (stays). Overview page also gets compact theme toggle. Account section keeps theme toggle, removes language switcher.
Decided: 2026-05-17

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

### Badge styles: Solid / Subtle / Outlined (renamed)

Decided: 2026-05-24
What: Badge styles renamed from solid/borderless-dark/bordered-dark to Solid/Subtle/Outlined. Style A (Solid) is truly opaque background with WCAG contrast text. Style B (Subtle) is tinted background, no border. Style C (Outlined) is tinted background with border.
Why: Old names referenced dark mode ("borderless-dark"), meaningless in light mode. "Solid" was misleading (was actually 20% opacity tint).
Rejected: Keeping old names (confusing in light mode), numbered styles (not descriptive).

### Badge color-mix uses sRGB, not OKLCH

Decided: 2026-05-24
What: Badge background color-mix formulas in `badge_style_utils.ts` use `color-mix(in srgb, ...)` instead of `color-mix(in oklch, ...)`.
Why: OKLCH hue rotation artifact — mixing saturated colors with achromatic white in light mode causes hue to swing through pink/magenta instead of maintaining the source hue.
Rejected: OKLCH with custom surface blend (adds complexity), higher opacity percentage (doesn't fix root cause).

### Mute button moved from header to context menu

Decided: 2026-05-24
What: Mute toggle removed from header quick-action buttons. Moved to context menu. Header retains 3 quick-action buttons: Open Folder, Open Terminal, Open Editor.
Why: Header was crowded (PRD#, issue#, title, chip, priority badge, 4 buttons). Mute is less frequently used than open actions.
Rejected: Remove all 4 buttons (open actions are high-frequency), keep all 4 (header too crowded).

### Context menu "Open" nested submenu

Decided: 2026-05-24
What: Context menu has a "Commands and Actions" section with an "Open" submenu containing Open Folder, Open Terminal, Open Editor — each with appropriate icons. Mute toggle in the middle section near worktree items.
Why: Groups related open actions. Follows VS Code context menu pattern.
Rejected: Flat list (too many top-level items), separate "Open" top-level group.

### Session overlays as composable layer on top of IssueCardState

Decided: 2026-05-24
What: Error (red tint + pulse) and needs-input (amber pulse) visual overlays are a CSS layer composed on top of the existing IssueCardState, not new state entries. A card can be active + errored simultaneously. Executing state has NO overlay (chip only) — confirmed.
Why: Session state is orthogonal to interaction state. A card shouldn't lose its active/selected appearance when a session errors.
Rejected: Adding error/needs-input to IssueCardState (prevents active+errored combo), separate overlay component (unnecessary DOM).

### worktreeSetup state is borderless, not dashed

Decided: 2026-05-24
What: worktreeSetup cards are muted/borderless (similar to Done — "not yet born"). No dashed border. Dashed borders are reserved exclusively for ghost cards.
Why: Spec REQ-IS-8 explicitly says "muted/borderless". The previous implementation incorrectly applied ghost card dashing to worktreeSetup.
Rejected: Dashed border on worktreeSetup (wrong spec mapping, looks broken at sub-pixel widths).

### Issue number color: radiant-only uses issue color

Decided: 2026-05-24
What: In the Radiant variant, the issue number (#NNN) renders in the issue's assigned color. In Veil and Refined Horizon, it inherits the header text color. Controlled via `--ic-number-color` CSS custom property.
Why: Radiant has a dark/non-colorized header where issue color aids identification. Veil/Horizon headers are already color-saturated — issue color on the number would be too similar to the background.
Rejected: Issue color on all variants (poor contrast on Horizon), foreground on all variants (loses color identity on Radiant).

### Ghost cards extend IssueCard via 'ghost' state

Decided: 2026-05-24
What: Ghost cards (non-adopted assigned issues) rendered by adding 'ghost' to IssueCardState and handling it in applyStateOverrides(). Same IssueCard component reused. Table view kept as "compact row" alternative via view switcher.
Why: Ghost cards share structure (header, preview, labels, body grid). Separate component would duplicate the shell. View switcher already planned (REQ-LY-3).
Rejected: Separate GhostCard component (duplication), table-only (loses visual context).

### Dev-only comparison toggle for A/B visual testing

Decided: 2026-05-24
What: Dev-only toggle in the existing Issues preview panel. Toggles a specific setting and all cards update live. Small label explains what's being compared and where to observe it.
Why: Need visual comparison for design decisions (e.g., radiant preview opacity). Dev-only keeps it out of the user-facing product.
Rejected: Storybook-only (can't see in context of real dashboard), private GitHub repo (overkill), user-facing feature (not needed for end users).

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

Decided: 2026-05-16. Updated: 2026-05-17 per PRD #320.
What: 10 appearance settings (variant, badge style, label tint, etc.) stored via the settings engine. User-level keys use `issue_card_` prefix in `user_settings(key PK, value)`. Workspace overrides stored in `workspace_settings(dashboard_id, key, value)` with `issue_card_` key prefix and take priority via cascade (workspace → user → hardcoded default).
Why: Allows per-dashboard visual tuning. Two dedicated tables (user*settings, workspace_settings) provide a clean cascade without key-prefix hacks.
Rejected: Separate appearance table (schema migration cost), single global setting (no per-workspace override), app_settings with ws* prefix (ad-hoc, no type safety).

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

---

## Process Management

### Headless execution with terminal mode escape hatch

Decided: 2026-05-18
What: Workspace commands run headlessly by default (piped stdout/stderr, port detection, log capture, badge integration). A `mode` field on `workspace_commands` supports `'headless'` (default) and `'terminal'` (fire-and-forget in external terminal, no tracking). Future `'embedded'` mode reserved for in-app terminal (xterm.js/PTY).
Why: Headless enables all tracking features (badges, logs, port detection). Terminal mode covers interactive commands that need TTY input (e.g., Storybook without `--ci`). User configures commands for headless compatibility.
Rejected: Always headless (can't handle interactive prompts), always terminal (loses tracking), auto-inject CI=true (surprising side effects).

### Process state as context module with Tauri event listeners

Decided: 2026-05-18
What: `processes.context.svelte.ts` subscribes to `process-output`, `process-port-detected`, `process-exited` events. Maintains `SvelteMap<processId, RunningProcess>` + `SvelteMap<issueId, processId[]>` index. Follows existing issues/sessions context pattern.
Why: Cross-issue state (multiple cards show process badges). Context pattern is established and proven.
Rejected: Per-component listeners (duplicate subscriptions), global store without context (breaks cleanup).

### Command trigger via context menu submenu

Decided: 2026-05-18
What: Right-click issue card → "Commands ▸" submenu. Grouped: servers on top, checks below, separated. Running processes show "Stop" + "View Logs". Stopped/completed show "Run" + "View Logs". ServerPortBadge right-click → context menu with "View Logs", "Kill", "Open in Browser".
Why: Multiple commands per workspace need selection. Context menu is low visual noise, matches existing right-click patterns.
Rejected: Quick action button (can't select which command), contextual action buttons (conflicts with session-spawning actions), dedicated panel (too prominent).

### Log viewer as near-fullscreen dialog

Decided: 2026-05-18
What: ProcessLogViewer rendered as Dialog, ~85vh height, ~27:20 aspect ratio, monospace, auto-scroll, stderr coloring, copy button. "Load full log" reads from temp file on disk. In-memory tail cache (1000 lines) for fast display. Future panelization may move logs into a dashboard panel.
Why: Dialog is front-and-center for focused log reading. Sheet (side drawer) covers other content. Panel system is future work.
Rejected: Sheet/drawer (obscures cards), inline expansion (too small), full-width (reduces readability).

### Process cleanup on app exit

Decided: 2026-05-18
What: Tauri `on_exit` hook calls `ProcessManager::cleanup_all()` to kill all tracked processes. No process survives app restart.
Why: Orphaned processes consume resources and confuse users. External terminal is the escape hatch for persistent processes.
Rejected: Let processes survive (orphan confusion), optional per-process (complexity without value).

### Pre-compiled regex for port detection

Decided: 2026-05-18
What: Compile port pattern regex once when process is registered, store `Option<Regex>` in `TrackedProcess`. Current `try_extract_port` recompiles on every stdout line — fix to use stored regex.
Why: Performance. Regex compilation is expensive; matching is cheap. Hot path (every stdout line).
Rejected: Keep per-line compilation (wasteful), lazy_static (pattern is per-command, not global).

### Log buffer: 1000-line in-memory + temp file for full history

Decided: 2026-05-18
What: In-memory `Vec<String>` stays capped at 1000 lines as a tail cache for fast display. Each spawned process additionally writes all stdout/stderr to a temp file via `BufWriter<File>`. `get_process_logs` returns the tail cache; `get_full_process_logs` reads from the temp file. Buffer size is hardcoded, not configurable.
Why: 1000 lines is sufficient for real-time monitoring. Temp file provides full history without unbounded memory growth. Configurable buffer size adds complexity without meaningful user value.
Rejected: Configurable buffer size (over-engineering), unlimited in-memory (OOM risk), no full log access (frustrating for long-running processes).

### HMR port re-detection handled by continuous regex matching

Decided: 2026-05-18
What: Port pattern regex runs on every new stdout line. If a new port is detected that differs from the current one, the badge updates automatically via `set_port()` + `process-port-detected` event. No special HMR handling needed.
Why: Frameworks that restart (nodemon, Vite HMR) re-log their listen address. The existing per-line matching catches it naturally. Frameworks that restart silently without re-logging the port cannot be detected — this is a framework limitation, not a Grovekeeper limitation.
Rejected: Special HMR detection logic (unnecessary — covered by existing architecture), port polling (wasteful).

### Five process states with distinct badge visuals

Decided: 2026-05-18
What: `running` (spinner), `passed` (green check), `failed` (red X), `timeout` (orange clock), `stopped` (gray square). Timeout is distinct from failure — configurable per command. Stale badges dim (opacity) when `hasLocalChanges` detected.
Why: Timeout is a different signal than failure (command may have been working). Stale dimming matches v2 design spec.
Rejected: Three states only (timeout indistinguishable from failure), no stale behavior (misleading results).

### Restart policy with hardcoded limits

Decided: 2026-05-18
What: `restart_policy` field on `workspace_commands`: `'never'` (default), `'on_failure'`, `'always'`. Max 3 retries, exponential backoff (1s, 2s, 4s). Badge shows restart count. After max retries → failed.
Why: Dev servers crash; manual restart is tedious. Hardcoded limits prevent restart storms without per-command config complexity.
Rejected: No restart (tedious for flaky servers), unlimited restart (resource bomb), configurable limits (over-engineering for v1).
