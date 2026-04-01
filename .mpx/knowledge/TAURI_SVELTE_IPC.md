# Tauri + Svelte IPC Architecture

How the Rust backend communicates with the Svelte frontend in BamGit.

## Two Communication Patterns

Tauri provides two IPC mechanisms. BamGit uses both for different purposes.

### Pattern 1: Commands (Request/Response)

**Used for:** One-shot operations — CRUD, spawn session, terminate session, list sessions.

**How it works:**

1. Svelte calls `invoke("command_name", { args })` from `@tauri-apps/api/core`
2. Tauri routes to a Rust function annotated with `#[tauri::command]`
3. Rust function executes, returns `Result<T, String>`
4. Svelte receives the typed response as a Promise

**Rust side:**

```rust
#[tauri::command]
pub fn get_sessions(state: State<'_, DatabaseState>) -> Result<Vec<Session>, String> {
    let connection = state.0.lock().map_err(|e| e.to_string())?;
    // query SQLite, return rows
}

// Async variant (needed for session spawning)
#[tauri::command]
pub async fn spawn_session(
    state: State<'_, DatabaseState>,
    app_handle: AppHandle,
    request: SpawnSessionRequest,
) -> Result<String, String> {
    // spawn tokio task for the session actor
    // return session_id immediately
}
```

**Svelte side (`src/lib/tauri/commands.ts`):**

```typescript
import { invoke } from '@tauri-apps/api/core';
import type { Session } from '$lib/types/session';

export async function getSessions(): Promise<Session[]> {
	return invoke('get_sessions');
}

export async function spawnSession(request: SpawnSessionRequest): Promise<string> {
	return invoke('spawn_session', { request });
}
```

**When to use:** Any operation where Svelte asks for something and waits for a single response. The caller blocks (awaits) until the Rust function returns.

### Pattern 2: Events (Push/Stream)

**Used for:** Real-time streaming — session protocol events, state changes, progress updates.

**How it works:**

1. Rust emits events via `app_handle.emit("event-name", payload)`
2. Svelte listens via `listen("event-name", callback)` from `@tauri-apps/api/event`
3. Events are fire-and-forget from Rust's perspective
4. Multiple Svelte components can listen to the same event
5. Listeners return an unlisten function for cleanup

**Rust side (inside a session actor's tokio task):**

```rust
use tauri::Emitter;

// The session actor holds an AppHandle clone
fn emit_session_event(&self, event: &SessionEvent) {
    let payload = SessionEventPayload {
        session_id: self.session_id.clone(),
        event: event.clone(),
    };
    // emit() sends to ALL listeners (frontend windows + other Rust listeners)
    let _ = self.app_handle.emit("session-event", &payload);
}

// Example: emitting a text delta as it streams from Claude
fn on_message_delta(&self, text: &str) {
    self.emit_session_event(&SessionEvent::MessageDelta {
        text: text.to_string(),
    });
}

// Example: emitting a state change
fn on_state_change(&self, new_state: &str) {
    self.emit_session_event(&SessionEvent::RunState {
        state: new_state.to_string(),
        error: None,
    });
}
```

**Svelte side (`src/lib/stores/session-events.svelte.ts`):**

```typescript
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

interface SessionEventPayload {
	session_id: string;
	event: SessionEvent;
}

// In a Svelte 5 component or store:
let unlistenFn: UnlistenFn | null = null;

// Start listening (call in onMount or store init)
async function startListening() {
	unlistenFn = await listen<SessionEventPayload>('session-event', (event) => {
		const { session_id, event: sessionEvent } = event.payload;

		// Filter to the session we're viewing
		if (session_id !== activeSessionId) return;

		switch (sessionEvent.type) {
			case 'message_delta':
				// Append text to the current chat bubble
				appendText(sessionEvent.text);
				break;
			case 'run_state':
				// Update session state in the store
				updateSessionState(session_id, sessionEvent.state);
				break;
			case 'tool_start':
				// Add a new tool card to the chat
				addToolCard(sessionEvent);
				break;
			// ... handle other event types
		}
	});
}

// Stop listening (call in onDestroy or cleanup)
function stopListening() {
	unlistenFn?.();
	unlistenFn = null;
}
```

**When to use:** Any data that flows continuously from Rust to Svelte without Svelte asking for it. Session streaming is the primary use case.

## Why Two Patterns (Not Just One)

| Concern        | Commands                               | Events                                  |
| -------------- | -------------------------------------- | --------------------------------------- |
| Direction      | Svelte asks, Rust answers              | Rust pushes, Svelte listens             |
| Timing         | Synchronous (Svelte awaits)            | Asynchronous (arrives whenever)         |
| Cardinality    | 1 request → 1 response                 | 1 emitter → N listeners                 |
| Error handling | `Result<T, String>` returned to caller | No error channel (fire-and-forget)      |
| Use case       | CRUD, spawn, terminate, config         | Streaming text, state changes, progress |

Using only commands would require polling (Svelte repeatedly asking "any new events?"). Using only events would require complex request-ID correlation for simple queries. The split is standard Tauri architecture.

## Data Flow for a Session

```
User clicks "Execute" on issue card
        │
        ▼
Svelte: invoke('spawn_session', { issue_id, prompt })
        │
        ▼
Rust: spawn_session command
  1. Create session row in SQLite (state: 'running')
  2. Spawn tokio task (session actor)
  3. Return session_id immediately
        │
        ▼
Svelte: receives session_id, navigates to session view
        │
        ▼
[Meanwhile, inside the tokio task:]
  1. Spawn `claude -p "prompt" --output-format stream-json` as child process
  2. Read stdout line by line
  3. Parse each JSON line through protocol parser
  4. For each parsed event:
     └── app_handle.emit("session-event", { session_id, event })
        │
        ▼
Svelte: listen("session-event") callback fires
  - MessageDelta → append to chat bubble
  - ToolStart → render tool card
  - ToolEnd → complete tool card
  - RunState("idle") → update state, trigger notification
  - UsageUpdate → update cost display
        │
        ▼
[Session ends:]
  Rust: child process exits
  Rust: emit RunState("completed") or RunState("failed")
  Rust: update SQLite row (state, ended_at, cost_usd, token_count)
  Svelte: receives final RunState, updates UI
```

## Svelte 5 Reactivity Integration

Tauri events bridge into Svelte 5 runes via stores:

```typescript
// src/lib/stores/session-store.svelte.ts

class SessionStore {
	// Svelte 5 runes for reactivity
	sessions = $state<Map<string, SessionState>>(new Map());
	activeSessionId = $state<string | null>(null);

	// Derived state — automatically updates when sessions or activeSessionId changes
	activeSession = $derived(this.activeSessionId ? this.sessions.get(this.activeSessionId) : null);

	// Called from Tauri event listener
	handleSessionEvent(sessionId: string, event: SessionEvent) {
		const session = this.sessions.get(sessionId);
		if (!session) return;

		// Mutating $state triggers re-renders in any component reading it
		switch (event.type) {
			case 'message_delta':
				session.transcript.push({ type: 'text_delta', text: event.text });
				break;
			case 'run_state':
				session.state = event.state;
				break;
			case 'usage_update':
				session.costUsd = event.total_cost_usd;
				session.tokenCount = event.input_tokens + event.output_tokens;
				break;
		}
	}
}

export const sessionStore = new SessionStore();
```

## Tauri Event Naming Conventions

BamGit uses a flat event namespace:

| Event name              | Payload                                | Source                                 |
| ----------------------- | -------------------------------------- | -------------------------------------- |
| `session-event`         | `{ session_id, event: SessionEvent }`  | Session actor                          |
| `session-state-changed` | `{ session_id, old_state, new_state }` | Session actor (DB update confirmation) |

All session protocol events go through `session-event`. The frontend filters by `session_id`. This avoids proliferating event channels and keeps the listener setup simple.

## Error Handling

**Commands:** Return `Result<T, String>`. Svelte wraps in try/catch:

```typescript
try {
	const sessionId = await spawnSession({ issueId, prompt });
} catch (error) {
	// error is the String from Rust's Err()
	showErrorToast(error as string);
}
```

**Events:** No built-in error channel. Errors are encoded as event variants:

```rust
// Rust: emit error as a RunState event
self.emit_session_event(&SessionEvent::RunState {
    state: "failed".to_string(),
    error: Some("Child process crashed".to_string()),
});
```

## Cleanup

Svelte components must unlisten on destroy to prevent memory leaks:

```svelte
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { listen, type UnlistenFn } from '@tauri-apps/api/event';

    let unlisten: UnlistenFn;

    onMount(async () => {
        unlisten = await listen('session-event', (event) => {
            // handle event
        });
    });

    onDestroy(() => {
        unlisten?.();
    });
</script>
```

## Reference

- **Tauri v2 IPC docs:** https://v2.tauri.app/develop/calling-rust/
- **Tauri v2 events:** https://v2.tauri.app/develop/calling-rust/#event-system
- **OpenCovibe session actor:** Primary reference for the actor → emit pattern
- **Existing BamGit commands:** `src/lib/tauri/commands.ts` (dashboard CRUD pattern)
