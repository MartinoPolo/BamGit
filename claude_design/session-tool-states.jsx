/* global React, I, ToolCardL1, ToolCardL2, ToolCardL3Perm, ToolCardL3Elicit, ToolCardL3Ask, ToolGroup, TOOL_ICONS */

/* ═══════════════════════════════════════════════════════════════
   TOOL CARD SUB-COMPONENT STATES
   Standalone showcase of every tool type at L1/L2, all L3 types,
   grouping, error, and streaming states.
   ═══════════════════════════════════════════════════════════════ */

/* ── All 11 tool types at Level 1 ──────────────────────────── */
function ToolL1Showcase() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 16, background: 'var(--background)', fontFamily: 'var(--font-sans)', color: 'var(--foreground)' }}>
      <div className="gk-eyebrow" style={{ marginBottom: 4 }}>Level 1 — All 11 Tool Types</div>
      <ToolCardL1 tool="Bash" detail="$ cargo test --workspace" outputLabel="exit 0" duration="4.2s"/>
      <ToolCardL1 tool="Read" detail="src/providers/claude_code.rs" outputLabel="142 lines" duration="0.3s"/>
      <ToolCardL1 tool="Write" detail="src/providers/opencode.rs" outputLabel="created · 89 lines" duration="1.2s"/>
      <ToolCardL1 tool="Edit" detail="src/providers/mod.rs +4 −0" outputLabel="4 lines" duration="0.5s"/>
      <ToolCardL1 tool="Glob" detail="src/**/*.rs" outputLabel="23 files" duration="0.1s"/>
      <ToolCardL1 tool="Grep" detail="impl Provider" outputLabel="4 files · 12 matches" duration="0.4s"/>
      <ToolCardL1 tool="Agent" detail="Explore codebase · Sonnet" outputLabel="12 tools · 23s" duration="23s"/>
      <ToolCardL1 tool="WebSearch" detail="Rust OAuth2 PKCE crate" outputLabel="8 results" duration="1.8s"/>
      <ToolCardL1 tool="WebFetch" detail="docs.rs/oauth2/latest" outputLabel="200 · 14KB" duration="0.9s"/>
      <ToolCardL1 tool="TodoWrite" detail="" outputLabel="5 items" duration="0.1s"/>
      <ToolCardL1 tool="Task" detail="Run CI pipeline" outputLabel="completed · 42s" duration="42s"/>

      <div className="gk-eyebrow" style={{ marginTop: 12, marginBottom: 4 }}>Level 1 — Error State</div>
      <ToolCardL1 tool="Bash" detail="$ cargo build --release" outputLabel="exit 1" duration="8.1s" status="error" error/>
      <ToolCardL1 tool="Read" detail="src/nonexistent.rs" outputLabel="not found" duration="0.1s" status="error" error/>
      <ToolCardL1 tool="WebFetch" detail="api.example.com/v2/auth" outputLabel="403 Forbidden" duration="0.4s" status="error" error/>

      <div className="gk-eyebrow" style={{ marginTop: 12, marginBottom: 4 }}>Level 1 — Running (Streaming)</div>
      <ToolCardL1 tool="Bash" detail="$ cargo test --workspace" outputLabel="running…" duration="2.1s" status="running"/>
      <ToolCardL1 tool="Agent" detail="Implement auth module · Sonnet" outputLabel="running…" duration="…" status="running"/>

      <div className="gk-eyebrow" style={{ marginTop: 12, marginBottom: 4 }}>Level 1 — Dimmed (Old Context)</div>
      <ToolCardL1 tool="Read" detail="src/config.rs" outputLabel="34 lines" duration="0.2s" dimmed/>
      <ToolCardL1 tool="Edit" detail="src/config.rs" outputLabel="+2 −1" duration="0.3s" dimmed/>

      <div className="gk-eyebrow" style={{ marginTop: 12, marginBottom: 4 }}>Tool Grouping</div>
      <ToolGroup count={5}/>
      <ToolGroup count={12}/>
      <ToolGroup count={47}/>
    </div>
  );
}

/* ── Level 2 per tool type ─────────────────────────────────── */
function ToolL2Showcase() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, background: 'var(--background)', fontFamily: 'var(--font-sans)', color: 'var(--foreground)' }}>
      <div className="gk-eyebrow" style={{ marginBottom: 4 }}>Level 2 — Bash (Running)</div>
      <ToolCardL2 tool="Bash" detail="$ cargo test --workspace" outputLabel="running…" duration="2.1s" status="running"
        content={`   Compiling grovekeeper v0.8.0\n   Compiling grovekeeper-providers v0.8.0\n     Running unittests src/lib.rs\nrunning 24 tests...\ntest providers::claude_code::tests::test_spawn ... ok\ntest providers::claude_code::tests::test_auth ... ok\ntest providers::opencode::tests::test_spawn ... ok\ntest providers::opencode::tests::test_auth_flow ...`}/>

      <div className="gk-eyebrow" style={{ marginTop: 8, marginBottom: 4 }}>Level 2 — Bash (Error)</div>
      <ToolCardL2 tool="Bash" detail="$ cargo build --release" outputLabel="exit 1" duration="8.1s" status="error"
        content={`error[E0308]: mismatched types\n  --> src/providers/opencode.rs:42:12\n   |\n42 |     return Ok(session);\n   |            ^^^^^^^^^^^ expected \`Result<Session, Error>\`,\n   |                        found \`Result<Session, AuthError>\`\n\nerror: aborting due to previous error`}/>

      <div className="gk-eyebrow" style={{ marginTop: 8, marginBottom: 4 }}>Level 2 — Read (File Content)</div>
      <ToolCardL2 tool="Read" detail="src/providers/mod.rs" outputLabel="58 lines" duration="0.2s" status="success"
        content={`  1 │ mod claude_code;\n  2 │ mod opencode;\n  3 │ mod cursor;\n  4 │ mod codex;\n  5 │\n  6 │ pub use claude_code::ClaudeCode;\n  7 │ pub use opencode::OpenCode;\n  8 │ pub use cursor::Cursor;\n  9 │ pub use codex::Codex;\n 10 │\n 11 │ pub trait Provider: Send + Sync {\n 12 │     fn spawn(&self, config: &Config) -> Result<Session>;\n 13 │     fn send_message(&self, msg: &str) -> Result<Response>;\n 14 │     fn handle_tool_result(&self, id: &str, result: Value);\n 15 │ }`}/>

      <div className="gk-eyebrow" style={{ marginTop: 8, marginBottom: 4 }}>Level 2 — Edit (Inline Diff)</div>
      <ToolCardL2 tool="Edit" detail="src/providers/mod.rs +4 −0" outputLabel="4 lines" duration="0.5s" status="success"
        content={`  1   │ mod claude_code;\n  2   │ mod opencode;\n  3   │ mod cursor;\n  4   │ mod codex;\n+ 5   │ mod gemini;\n  6   │\n  7   │ pub use claude_code::ClaudeCode;\n  8   │ pub use opencode::OpenCode;\n+ 9   │ pub use gemini::Gemini;\n 10   │`}/>

      <div className="gk-eyebrow" style={{ marginTop: 8, marginBottom: 4 }}>Level 2 — Grep (Matches)</div>
      <ToolCardL2 tool="Grep" detail="impl Provider" outputLabel="4 files · 12 matches" duration="0.4s" status="success"
        content={`src/providers/claude_code.rs:24:  impl Provider for ClaudeCode {\nsrc/providers/opencode.rs:18:    impl Provider for OpenCode {\nsrc/providers/cursor.rs:31:      impl Provider for Cursor {\nsrc/providers/codex.rs:22:        impl Provider for Codex {`}/>

      <div className="gk-eyebrow" style={{ marginTop: 8, marginBottom: 4 }}>Level 2 — Agent (Sub-agent Summary)</div>
      <ToolCardL2 tool="Agent" detail="Explore codebase structure · Sonnet" outputLabel="12 tools · 23s" duration="23s" status="success"
        content={`Summary: Explored 23 Rust source files across 4 modules.\n\nKey findings:\n• providers/ — 4 provider implementations (ClaudeCode, OpenCode, Cursor, Codex)\n• session/ — Session management, state machine, message routing\n• ui/ — TUI components, layout, theming\n• config/ — TOML parsing, defaults, env overrides\n\nRecommendation: Start with providers/mod.rs for the trait definition.`}/>

      <div className="gk-eyebrow" style={{ marginTop: 8, marginBottom: 4 }}>Level 2 — Write (Created File)</div>
      <ToolCardL2 tool="Write" detail="src/providers/gemini.rs" outputLabel="created · 67 lines" duration="1.4s" status="success"
        content={`use crate::provider::{Provider, Session, Config};\nuse crate::error::Result;\n\npub struct Gemini {\n    api_key: String,\n    model: String,\n}\n\nimpl Gemini {\n    pub fn new(api_key: &str) -> Self {\n        Self {\n            api_key: api_key.to_string(),\n            model: \"gemini-2.5-pro\".to_string(),\n        }\n    }\n}\n\nimpl Provider for Gemini {\n    fn spawn(&self, config: &Config) -> Result<Session> {\n        // ...\n    }\n}`}/>

      <div className="gk-eyebrow" style={{ marginTop: 8, marginBottom: 4 }}>Level 2 — WebSearch</div>
      <ToolCardL2 tool="WebSearch" detail="Rust OAuth2 PKCE crate" outputLabel="8 results" duration="1.8s" status="success"
        content={`1. oauth2 - crates.io — OAuth2 client library with PKCE support\n2. RFC 7636 - Proof Key for Code Exchange — IETF specification\n3. oxide-auth — Server-side OAuth2 framework for Rust\n4. Example: PKCE flow in Rust — dev.to article`}/>

      <div className="gk-eyebrow" style={{ marginTop: 8, marginBottom: 4 }}>Level 2 — Glob</div>
      <ToolCardL2 tool="Glob" detail="src/**/*.rs" outputLabel="23 files" duration="0.1s" status="success"
        content={`src/main.rs\nsrc/lib.rs\nsrc/config/mod.rs\nsrc/config/defaults.rs\nsrc/providers/mod.rs\nsrc/providers/claude_code.rs\nsrc/providers/opencode.rs\nsrc/providers/cursor.rs\nsrc/providers/codex.rs\nsrc/session/mod.rs\nsrc/session/manager.rs\nsrc/session/state.rs\nsrc/ui/mod.rs\nsrc/ui/layout.rs\nsrc/ui/theme.rs`}/>
    </div>
  );
}

/* ── All three Level 3 sub-types ───────────────────────────── */
function ToolL3Showcase() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, background: 'var(--background)', fontFamily: 'var(--font-sans)', color: 'var(--foreground)' }}>
      <div className="gk-eyebrow" style={{ marginBottom: 4 }}>Level 3 — Permission Prompt</div>
      <ToolCardL3Perm tool="Bash" detail={`$ rm -rf target/debug/build/grovekeeper-*\n$ cargo build --release`}/>

      <div className="gk-eyebrow" style={{ marginTop: 8, marginBottom: 4 }}>Level 3 — Elicitation (MCP Server)</div>
      <ToolCardL3Elicit server="postgres" message="The query requires access to the production database. Please provide the connection string or confirm the environment to use."/>

      <div className="gk-eyebrow" style={{ marginTop: 8, marginBottom: 4 }}>Level 3 — Ask User (Options)</div>
      <ToolCardL3Ask question="I found two approaches for the authentication refactor. Which would you prefer?" options={[
        "Option A: Full OAuth2 PKCE with refresh tokens (more secure, more complex)",
        "Option B: API key with session tokens (simpler, adequate for dev tools)",
        "Other (describe your preference)",
      ]}/>

      <div className="gk-eyebrow" style={{ marginTop: 8, marginBottom: 4 }}>Level 3 — Permission (Dangerous)</div>
      <ToolCardL3Perm tool="Bash" detail={`$ DROP TABLE sessions;\n$ DROP TABLE session_events;`}/>
    </div>
  );
}

Object.assign(window, { ToolL1Showcase, ToolL2Showcase, ToolL3Showcase });
