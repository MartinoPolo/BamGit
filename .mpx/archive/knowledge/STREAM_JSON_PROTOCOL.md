# Claude Code Stream-JSON Protocol Reference

Complete reference for the bidirectional protocol between Grovekeeper and spawned Claude Code CLI sessions.

## Overview

When Grovekeeper spawns `claude -p "prompt" --output-format stream-json`, it gets:

- **stdout:** Newline-delimited JSON objects (one per line), each representing a protocol event
- **stdin:** JSON messages for sending prompts, control requests (interrupt), and permission responses

## Implementation Priority by Tier

Events grouped by what they enable in Grovekeeper and when to implement them.

### Tier 1: Session Lifecycle (state machine + cost tracking) — Must Have

| Event           | What it is                                                                                                                                  | Grovekeeper use                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **SessionInit** | Fires at session start. Carries `session_id`, `model`, available `tools`, `permission_mode`, `mcp_servers`, `claude_code_version`.          | Capture session ID for resume. Show model in session card. Store MCP server status.                                                            |
| **RunState**    | State transitions: `running`, `idle`, `failed`, `stopped`, `completed`.                                                                     | **Core of the state machine.** Maps to: `running`=running, `idle`=needs-input, `failed`=errored, `completed`=finished. Triggers notifications. |
| **UsageUpdate** | End-of-turn stats: `input_tokens`, `output_tokens`, `cache_read_tokens`, `total_cost_usd`, `duration_ms`, `num_turns`, per-model breakdown. | Populate `cost_usd` and `token_count` on session record. Show cost in expanded card section. Track spend across sessions.                      |

### Tier 2: Text Streaming (rich chat view) — Must Have

| Event               | What it is                                                                                | Grovekeeper use                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **MessageDelta**    | Streaming text tokens, one chunk at a time (e.g., `"Hello, "`, `"I'll "`, `"run that."`). | **Live text streaming** in chat view — render tokens as they arrive for real-time feel.                                |
| **MessageComplete** | Full assistant message with all text joined, `message_id`, `stop_reason`, `model`.        | Finalize the chat bubble. Store in transcript. `stop_reason` tells you if Claude stopped naturally or hit a tool call. |
| **ThinkingDelta**   | Extended thinking (reasoning) text, streamed incrementally.                               | Optional "show reasoning" toggle in chat view. Lets user see Claude's thought process.                                 |

### Tier 3: Tool Execution (tool call cards in chat) — Must Have

| Event              | What it is                                                                                                   | Grovekeeper use                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ToolStart**      | Tool call began. Carries `tool_name` (e.g., "Bash", "Edit", "Read"), `tool_use_id`, `input` (the arguments). | Render tool card header: "Running Bash: `ls -la`". Show spinner.                                                                                                               |
| **ToolInputDelta** | Streaming partial JSON of tool input as Claude types it.                                                     | Live preview of what Claude is about to do — e.g., watching the Edit diff build up in real-time. Advanced UX. Can defer to v2 — full input arrives in the `assistant` message. |
| **ToolProgress**   | Elapsed time update while tool runs (e.g., `4.7 seconds`).                                                   | Show timer on tool card: "Bash running... 4.7s". User knows it's not stuck.                                                                                                    |
| **ToolEnd**        | Tool finished. Carries `output`, `status` (success/error), `tool_name`.                                      | Complete the tool card: show output, mark success/error. For Read tool: show file content. For Bash: show command output.                                                      |
| **ToolUseSummary** | Human-readable summary after tool(s) finish (e.g., "Read 3 files from /src").                                | Show concise summary instead of raw output. Collapse verbose tool output behind this summary.                                                                                  |

### Tier 4: Permission & Interaction (HITL triggers) — Must Have

| Event                 | What it is                                                                                                            | Grovekeeper use                                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PermissionPrompt**  | Claude wants to run a tool but needs user approval. Carries `tool_name`, `tool_input`, `suggestions`.                 | **Critical for notifications.** This IS the "needs-input" state. Show approval dialog. Flash taskbar. Play urgent sound. Suggestions can pre-fill approve/deny buttons. |
| **PermissionDenied**  | Permission was denied (reported in the result event).                                                                 | Log in transcript. Could show "Permission denied for Bash: rm -rf" card.                                                                                                |
| **ElicitationPrompt** | MCP server needs user input (e.g., OAuth login, API key entry). Carries `message`, `mode`, `url`, `requested_schema`. | Show input dialog. If `mode: "oauth"`, open browser. Also a "needs-input" trigger for notifications.                                                                    |
| **HookCallback**      | A user-defined hook needs approval (specifically `PreToolUse` hooks).                                                 | If you run custom hooks via Grovekeeper, show an approval UI. For non-PreToolUse hooks, auto-approve.                                                                   |
| **ControlCancelled**  | CLI cancelled a pending permission/hook request before user responded.                                                | Dismiss the approval dialog. Clean up pending notification.                                                                                                             |

### Tier 5: System Events (informational / polish) — Add Incrementally

| Event                             | What it is                                                                            | Grovekeeper use                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **CompactBoundary**               | Context was auto-compacted (conversation too long). Shows `trigger` and `pre_tokens`. | Show "Context compacted" indicator in chat. Warn user that early context may be summarized. |
| **SystemStatus**                  | CLI status string (e.g., `"compacting"`).                                             | Show status pill on session tab: "Compacting..."                                            |
| **HookStarted/Progress/Response** | Lifecycle of user-defined hook scripts running.                                       | Show hook execution in transcript if hooks are configured.                                  |
| **TaskNotification**              | Background task (file indexer, etc.) status change.                                   | Informational indicator. Low priority for v1.                                               |
| **FilesPersisted**                | Files saved to disk.                                                                  | Could trigger "files changed" notification or auto-refresh dev server preview.              |
| **AuthStatus**                    | OAuth flow state (`isAuthenticating`, `output` messages).                             | Show auth flow UI if Claude Code needs re-authentication mid-session.                       |
| **CommandOutput**                 | Output from slash commands (e.g., `/cost`, `/context`).                               | Display in chat transcript.                                                                 |

### Tier 6: Synthetic (Grovekeeper generates these itself) — Trivial

| Event            | What it is                             | Grovekeeper use                                                              |
| ---------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| **UserMessage**  | What the user sent to the session.     | Store in transcript for the chat view. Show "You: fix the login bug" bubble. |
| **Raw** (stderr) | Unparseable output or stderr from CLI. | Debug logging. Could show as dimmed text in terminal view.                   |

---

## Event Categories (Detailed Reference)

Events are grouped by what Grovekeeper feature they serve.

### Category 1: Session Lifecycle

#### SessionInit (`type: "system"`, `subtype: "init"`)

Fires once per turn (and at session start). Carries full session metadata.

```json
{
	"type": "system",
	"subtype": "init",
	"session_id": "ses-abc",
	"model": "claude-opus-4-6",
	"tools": [{ "name": "Bash" }, { "name": "Read" }, { "name": "Edit" }],
	"cwd": "/home/user/project",
	"mcp_servers": [{ "name": "my-server", "status": "connected", "type": "stdio" }],
	"permissionMode": "auto_read",
	"claude_code_version": "1.2.3"
}
```

**Grovekeeper use:** Capture `session_id` (needed for `--resume`). Store `model` on session record. Show available tools and MCP server status.

#### RunState (derived from `type: "result"` and synthetic events)

State transitions for the session. Not a raw CLI event — derived by the protocol parser from `result` events and process lifecycle.

States: `running`, `idle`, `failed`, `completed`, `stopped`

**Grovekeeper mapping:**
| RunState | Grovekeeper state | Notification? |
|---|---|---|
| `running` | `running` | No |
| `idle` | `needs-input` | Yes (urgent) |
| `failed` | `errored` | Yes (urgent) |
| `completed` | `finished` | Yes (gentle) |
| `stopped` | `finished` | No (user-initiated) |

#### UsageUpdate (from `type: "result"`)

End-of-turn cost and token stats.

```json
{
	"type": "result",
	"subtype": "success",
	"usage": {
		"input_tokens": 1234,
		"output_tokens": 567,
		"cache_read_input_tokens": 100,
		"cache_creation_input_tokens": 50
	},
	"cost_usd": 0.012,
	"total_cost_usd": 0.045,
	"duration_ms": 4100,
	"num_turns": 3
}
```

**Grovekeeper use:** Update `cost_usd` and `token_count` on session record. Show in expanded issue card.

### Category 2: Text Streaming

#### MessageDelta (`content_block_delta` with `text_delta`)

Streaming text tokens from the assistant.

```json
{
	"type": "stream_event",
	"event": {
		"type": "content_block_delta",
		"delta": { "type": "text_delta", "text": "I'll fix that bug " }
	},
	"session_id": "ses-abc",
	"parent_tool_use_id": null
}
```

**Grovekeeper use:** Live text rendering in chat view. Append each delta to the current chat bubble.

#### MessageComplete (from `type: "assistant"`)

Full assistant message with all content blocks resolved.

```json
{
	"type": "assistant",
	"message": {
		"id": "msg_01xyz",
		"model": "claude-opus-4-6",
		"stop_reason": "tool_use",
		"content": [
			{ "type": "text", "text": "I'll run that command." },
			{
				"type": "tool_use",
				"id": "toolu_01abc",
				"name": "Bash",
				"input": { "command": "ls" }
			}
		]
	}
}
```

**Grovekeeper use:** Finalize chat bubble. Store full text for `last_response_summary`. Extract tool_use blocks for tool cards.

#### ThinkingDelta (`content_block_delta` with `thinking_delta`)

Extended thinking (reasoning) text.

**Grovekeeper use:** Optional "show reasoning" toggle in chat view.

### Category 3: Tool Execution

#### ToolStart (`content_block_start` with `tool_use` or from `assistant` message)

A tool call is beginning.

```json
{
	"type": "content_block_start",
	"content_block": { "type": "tool_use", "id": "toolu_01abc", "name": "Bash" }
}
```

**Grovekeeper use:** Render tool card header with tool name and spinner. In streaming mode, input comes later.

#### ToolInputDelta (`content_block_delta` with `input_json_delta`)

Partial JSON of the tool's input, streamed incrementally.

```json
{
	"type": "content_block_delta",
	"delta": { "type": "input_json_delta", "partial_json": "{\"command\": \"git status" }
}
```

**Grovekeeper use:** Live preview of what Claude is about to do (e.g., watching an Edit diff build in real-time). Requires accumulating partial JSON across multiple deltas. Can be deferred to v2 — the full input arrives in the `assistant` message.

#### ToolEnd (from `type: "user"` with `tool_result` content)

A tool finished executing.

```json
{
	"type": "user",
	"message": {
		"content": [
			{
				"type": "tool_result",
				"tool_use_id": "toolu_01abc",
				"content": "file1.ts\nfile2.rs\n",
				"is_error": false
			}
		]
	}
}
```

**Grovekeeper use:** Complete tool card — show output, mark success/error. Collapse behind summary.

#### ToolProgress (`type: "tool_progress"`)

Elapsed time while a tool runs.

```json
{ "type": "tool_progress", "tool_use_id": "toolu_01abc", "elapsed_time_seconds": 4.7 }
```

**Grovekeeper use:** Show timer on running tool cards: "Bash running... 4.7s".

#### ToolUseSummary (`type: "tool_use_summary"`)

Human-readable summary after tool(s) finish.

```json
{
	"type": "tool_use_summary",
	"tool_use_id": "toolu_01abc",
	"summary": "Read 3 files from /src",
	"preceding_tool_use_ids": ["toolu_xyz"]
}
```

**Grovekeeper use:** Collapsed tool card label. Show summary instead of verbose output.

### Category 4: Permission & Interaction

#### PermissionPrompt (`control_request` with `can_use_tool`)

Claude wants to run a tool but needs user approval.

```json
{
	"type": "control_request",
	"request_id": "req_123",
	"request": {
		"subtype": "can_use_tool",
		"tool_name": "Bash",
		"tool_use_id": "toolu_01abc",
		"input": { "command": "rm -rf node_modules" },
		"suggestions": [{ "allow": true, "always": false }]
	}
}
```

**Grovekeeper use:** This IS the "needs-input" trigger. Show approval dialog with tool details. Flash taskbar. Play urgent sound. Respond via stdin with permission decision.

**Response (sent to stdin):**

```json
{
	"type": "control_response",
	"request_id": "req_123",
	"response": { "decision": "allow" }
}
```

#### ElicitationPrompt (`control_request` with `elicitation`)

MCP server needs user input (OAuth, API key, etc.).

```json
{
	"type": "control_request",
	"request_id": "req_456",
	"request": {
		"subtype": "elicitation",
		"mcp_server_name": "github",
		"message": "Please authenticate",
		"mode": "oauth",
		"url": "https://github.com/login/oauth/authorize"
	}
}
```

**Grovekeeper use:** Show auth dialog or open browser. Also a "needs-input" notification trigger.

#### HookCallback (`control_request` with `hook_callback`)

User-defined hook needs approval (PreToolUse hooks only).

**Grovekeeper use:** Show hook approval dialog if `hook_event == "PreToolUse"`. Auto-approve all other hook types.

#### ControlCancelled (`control_cancel_request`)

CLI cancelled a pending permission/hook request.

**Grovekeeper use:** Dismiss the pending approval dialog.

### Category 5: System Events

#### CompactBoundary (`system/compact_boundary`)

Context auto-compacted (conversation too long).

**Grovekeeper use:** Show "Context compacted" marker in chat timeline. Informational.

#### SystemStatus (`system/status`)

CLI status string (e.g., "compacting").

**Grovekeeper use:** Show status indicator on session tab.

#### HookStarted/Progress/Response (`system/hook_*`)

Hook script lifecycle.

**Grovekeeper use:** Show hook execution in transcript if hooks are configured.

#### AuthStatus (`system/auth_status`)

OAuth flow state.

**Grovekeeper use:** Show auth flow progress if re-authentication needed.

#### FilesPersisted (`system/files_persisted`)

Files saved to disk.

**Grovekeeper use:** Could trigger dev server refresh or file watcher notification.

#### TaskNotification (`system/task_notification`)

Background task (indexer) status.

**Grovekeeper use:** Low priority. Informational only.

## Stdin Protocol (Grovekeeper → Claude Code)

### Send a new prompt

```json
{ "type": "user_message", "message": "Fix the login bug in auth.ts" }
```

### Interrupt current turn (graceful pause)

```json
{
	"type": "control_request",
	"request_id": "grovekeeper_ctrl_<uuid>",
	"request": { "subtype": "interrupt" }
}
```

Effect: Claude stops current turn, emits `result` with state → `idle`. Session stays alive.

### Respond to permission prompt

```json
{
	"type": "control_response",
	"request_id": "<original_request_id>",
	"response": { "decision": "allow" }
}
```

Decisions: `"allow"`, `"deny"`, `"allow_always"` (adds to session allowlist)

### Respond to elicitation

```json
{
	"type": "control_response",
	"request_id": "<original_request_id>",
	"response": { "decision": "submit", "data": { "api_key": "..." } }
}
```

## Stream Event Envelope

Most streaming events arrive wrapped in a `stream_event` envelope:

```json
{
	"type": "stream_event",
	"event": {
		/* actual event */
	},
	"uuid": "evt_unique_id",
	"session_id": "ses-abc",
	"parent_tool_use_id": null
}
```

The parser must unwrap the inner `event` before dispatching. `parent_tool_use_id` is set when events come from a sub-agent.

## Process Lifecycle

1. **Spawn:** `claude -p "prompt" --output-format stream-json --verbose`
2. **Session ID:** Captured from first `system/init` event
3. **Multi-turn:** Write new prompt to stdin → Claude emits new `system/init` + streaming events
4. **Interrupt:** Write `control_request { interrupt }` to stdin → Claude stops, emits `result(idle)`
5. **Terminate:** Close stdin (EOF) + kill process
6. **Resume (new process):** `claude --resume <session_id> -p "continue" --output-format stream-json`

## Known Issues

- Stream-JSON mode may hang after final `result` event (stdout stays open). Workaround: detect `result` event, wait briefly, then kill if process hasn't exited.
- SIGINT to the process orphans bash tool child processes on some platforms.
- `--resume` does not restore session-scoped permissions — user must re-approve.

## Reference

- OpenCovibe `claude_protocol.rs` — production-grade parser implementation
- OpenCovibe `session_actor.rs` — actor lifecycle and control message handling
- OpenCovibe `process_ext.rs` — Windows Job Object for child process cleanup
