# Session Spawning Dialog — Design Spec

Design spec for the dialog used to spawn a new AI coding session. This is the entry point for every session in Grovekeeper — it selects the provider, model, permission mode, and attaches context. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Container Context

**Parent**: None — modal dialog overlay (centered, 480-600px wide)
**This component is standalone** — it owns its modal chrome (backdrop, dialog border, close button).


## Dialog Purpose

Spawning a session is a high-intent action. The user is committing to running an AI agent in a specific workspace, potentially for minutes to hours. The dialog must make the key decisions (provider, model, permissions) feel deliberate without being tedious. Fast path for common case (Claude Code, default model, issue context auto-attached); flexible path for advanced options (resume, custom path, other providers).

## Required Elements

### Provider Selection

Four providers, each with a distinct icon, name, and brief description:

| Provider | Description |
|----------|-------------|
| Claude Code | `claude` CLI via stdin/stdout stream-JSON. Default provider. |
| OpenCode | `opencode serve` via HTTP REST + SSE. Web-native. |
| Codex | `codex` CLI via stdio JSON IPC. |
| Cursor | `agent acp` via JSON-RPC. Requires Cursor installed. |

- Visual indicator for the "default" (Claude Code) — e.g., subtle badge or pre-selected
- Unavailable providers (e.g., not installed) should be shown but grayed out with a "not found" hint and install link

### Model Selection

- Depends on selected provider — each provider exposes a different model list
- Displayed as a select/dropdown populated dynamically once provider is chosen
- Show model name + context window size (e.g., "claude-opus-4-7 (200K)")
- Option to show all available models vs. curated list

### Permission Mode

- Three modes: **Approve each** / **Auto-accept edits** / **Bypass all**
- For Codex and OpenCode: this must be set at spawn time and cannot change mid-session. Make this visually prominent for those providers (e.g., warning callout: "Cannot be changed after spawn")
- For Claude Code and Cursor: less critical — can be changed mid-session. Show as a normal field
- Default: Approve each

### Context Attachment

This section shows what context will be injected into the session's opening prompt:

- **Linked issue**: shows issue number + title + state if opened from an issue page. Checkbox to include/exclude. Auto-checked.
- **Issue description preview**: collapsed by default, expandable to see the full text that will be injected
- **Custom prompt prefix**: optional text field the user can type into before the issue context (e.g., "Focus on the backend only.")
- When spawned from outside an issue context: show empty state ("No issue linked — attach one or start without context")

### Workspace / Worktree Path

- Shows the current workspace path (e.g., `/repos/Grovekeeper`)
- Dropdown or browse button to select a different worktree
- List recent worktrees for quick re-use

### Resume Existing Session

- Checkbox or toggle: "Resume an existing session"
- When enabled: shows a list of recent sessions matching the selected provider (session ID, started time, last message preview)
- User picks one to adopt/resume via `--resume` or equivalent
- When no sessions available for provider: show empty state

### Spawn Button

- Prominent primary action: **"Start Session"** (or "Spawn" / "Launch")
- Disabled until provider is selected
- Keyboard shortcut: Enter (once all required fields are filled)
- Cancel / close action (Esc)

## Constraints and Rules

- Permission mode selector must be visually emphasized for Codex and OpenCode — cannot be changed after spawn
- Unavailable providers should be discoverable but non-blocking (don't hide them)
- Issue context injection is opt-out, not opt-in — default to including it when available
- The dialog should feel fast — avoid wizards that require many clicks for the common case (Claude Code + default model + linked issue)

## Layout Constraints

- Modal dialog (not full-screen), centered on window
- Approximate dimensions: 480-600px wide, height flexible
- Dark theme primary
- Focus management: first interactive element receives focus on open

## States to Explore in Variants

For the initial three variants, show the dialog in the most common pre-spawn state:
- Claude Code pre-selected
- Default model shown
- Issue context attached (one issue linked, auto-populated)
- Standard workspace path shown

After variant selection, we will design:
- No issue context (standalone spawn)
- Provider not installed / unavailable state
- Resume mode (session list visible)
- Loading state (model list fetching)
- Codex/OpenCode selected (permission mode emphasized)
- Validation errors (required fields missing)

## Visual References

- Grovekeeper Forest Moss palette — all colors from `tokens.css`
- Provider icons should each feel distinct — not just colored squares
- The dialog should feel heavier/more intentional than the Issue Creation Wizard (this is a more consequential action)

## Not Included in This Design

- Session chat view (message stream, tool cards, sub-agent tree) → `SESSION_CHAT_VIEW.md`
- Provider installation instructions (link out)
- Worktree creation UI (separate feature)
- Skill configuration → `SESSION_CHAT_VIEW.md` (section 5)
