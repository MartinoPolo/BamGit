# Provider Trait Architecture

How BamGit abstracts over different agent CLI backends.

## The Problem

BamGit v1 only supports Claude Code. But the PRD explicitly calls out future support for GPT Codex, GitHub Copilot, and other agent CLIs. Each has a different:

- CLI command and flags
- Output format (stream-JSON, SSE, plain text)
- Session resume mechanism
- State detection approach

Without abstraction, every session management function would have `if provider == "claude-code" { ... } else if provider == "codex" { ... }` branching.

## The Solution: Provider Trait

A Rust trait that defines the contract any agent CLI backend must implement. BamGit's session manager calls trait methods, not provider-specific code.

```rust
/// A provider is an agent CLI backend (Claude Code, Codex, etc.)
/// Each provider knows how to spawn, communicate with, and control its CLI.
#[async_trait]
pub trait SessionProvider: Send + Sync {
    /// Spawn a new CLI process and return a handle for communication.
    /// The provider chooses the right CLI command, flags, and output format.
    async fn spawn(&self, config: SpawnConfig) -> Result<SessionHandle, ProviderError>;

    /// Send a text message (prompt) to a running session via stdin.
    /// The provider formats it according to its protocol.
    async fn send_message(&self, handle: &SessionHandle, message: &str) -> Result<(), ProviderError>;

    /// Gracefully interrupt the current turn.
    /// For Claude Code: sends `control_request { interrupt }` to stdin.
    /// For other providers: sends whatever interrupt mechanism they support.
    async fn interrupt(&self, handle: &SessionHandle) -> Result<(), ProviderError>;

    /// Kill the CLI process immediately.
    async fn terminate(&self, handle: &SessionHandle) -> Result<(), ProviderError>;

    /// Parse a raw JSON line from stdout into zero or more SessionEvents.
    /// Each provider has its own protocol format.
    fn parse_event(&self, raw: &serde_json::Value) -> Result<Vec<SessionEvent>, ProviderError>;
}
```

### Why These Specific Methods

| Method         | Why it's on the trait                            | What varies per provider                                  |
| -------------- | ------------------------------------------------ | --------------------------------------------------------- |
| `spawn`        | Each CLI has different command, flags, env vars  | `claude -p --output-format stream-json` vs `codex --json` |
| `send_message` | Each CLI accepts input differently               | JSON to stdin vs newline-delimited text                   |
| `interrupt`    | Each CLI has a different graceful stop mechanism | JSON control_request vs SIGINT vs protocol message        |
| `terminate`    | Universal (kill process), but cleanup may differ | Claude Code needs Job Object cleanup on Windows           |
| `parse_event`  | Each CLI emits different JSON format             | Claude's `stream_event` envelope vs Codex's format        |

### Why `get_state` Is NOT on the Trait

State is derived from events, not queried from the provider. When `parse_event` returns a `SessionEvent::RunState { state: "idle" }`, BamGit updates SQLite. There's no need to ask the provider "what state are you in?" — the event stream IS the state source.

## Supporting Types

```rust
/// Configuration for spawning a new session
pub struct SpawnConfig {
    pub prompt: String,
    pub working_directory: PathBuf,
    pub resume_session_id: Option<String>,  // for --resume
    pub permission_mode: Option<String>,     // e.g., "auto_read"
    pub model: Option<String>,               // override default model
    pub max_turns: Option<u32>,              // limit turns
    pub env_vars: HashMap<String, String>,   // extra env vars
}

/// Handle to a running CLI process
pub struct SessionHandle {
    pub child: tokio::process::Child,
    pub stdin: Option<tokio::process::ChildStdin>,
    pub stdout: tokio::process::ChildStdout,
    pub stderr: tokio::process::ChildStderr,
    pub pid: u32,
    pub session_id: Option<String>,  // captured from SessionInit event
}

/// Unified event type that all providers map to.
/// BamGit only deals with SessionEvent, never raw provider formats.
pub enum SessionEvent {
    SessionInit { session_id: String, model: String, tools: Vec<String> },
    MessageDelta { text: String },
    MessageComplete { text: String, message_id: String },
    ThinkingDelta { text: String },
    ToolStart { tool_use_id: String, tool_name: String, input: Value },
    ToolInputDelta { tool_use_id: String, partial_json: String },
    ToolEnd { tool_use_id: String, tool_name: String, output: Value, is_error: bool },
    ToolProgress { tool_use_id: String, elapsed_seconds: f64 },
    ToolUseSummary { tool_use_id: String, summary: String },
    RunState { state: String, error: Option<String> },
    UsageUpdate { input_tokens: u64, output_tokens: u64, cost_usd: f64 },
    PermissionPrompt { request_id: String, tool_name: String, tool_input: Value },
    ElicitationPrompt { request_id: String, message: String },
    CompactBoundary { trigger: String },
    SystemStatus { status: String },
    Raw { source: String, data: Value },
}
```

## How It Fits Together

```
┌──────────────────────────────────────────────┐
│ Session Actor (tokio task)                   │
│                                              │
│  1. Calls provider.spawn(config)             │
│  2. Reads stdout line by line                │
│  3. Calls provider.parse_event(json)         │
│  4. Gets Vec<SessionEvent> back              │
│  5. Emits each SessionEvent via Tauri events │
│  6. Updates SQLite on state changes          │
│                                              │
│  The actor doesn't know which CLI is running │
│  — it only works with SessionEvent.          │
└──────────────────────────────────────────────┘
         │ uses
         ▼
┌──────────────────────────────────────────────┐
│ dyn SessionProvider                          │
├──────────────────────────────────────────────┤
│ ClaudeCodeProvider (v1)                      │
│  - spawn: `claude -p --output-format ...`    │
│  - parse_event: stream_event envelope unwrap │
│  - interrupt: control_request to stdin       │
├──────────────────────────────────────────────┤
│ CodexProvider (future)                       │
│  - spawn: `codex --json ...`                 │
│  - parse_event: codex-specific format        │
│  - interrupt: different mechanism            │
└──────────────────────────────────────────────┘
```

## V1 Scope

For v1, only `ClaudeCodeProvider` is implemented. The trait exists so that:

1. The session actor is cleanly separated from Claude Code specifics
2. Adding a new provider later means implementing 5 methods, not touching session management
3. The `provider` field on each session record already tracks which provider was used

The trait is NOT over-engineered — it has exactly the methods needed for the session actor's lifecycle loop. No speculative methods for hypothetical requirements.
