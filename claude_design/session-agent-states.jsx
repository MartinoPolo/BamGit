/* global React, I, AgentNode */

/* ═══════════════════════════════════════════════════════════════
   SUB-AGENT TREE — SUB-COMPONENT STATES
   ═══════════════════════════════════════════════════════════════ */

const agentPanelStyle = { padding: 12, background: 'var(--sidebar-bg)', fontFamily: 'var(--font-sans)', color: 'var(--foreground)', width: '100%', borderRadius: 8, border: '1px solid var(--border)' };
const headerStyle = { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderBottom: '1px solid var(--border)', marginBottom: 6 };

/* ── Empty (no sub-agents) ─────────────────────────────────── */
function AgentTreeEmpty() {
  return (
    <div style={agentPanelStyle}>
      <div style={headerStyle}>
        <I.Cpu size={12} sw={1.8} style={{ color: 'var(--foreground-subtle)' }}/>
        <span style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>Sub-Agents</span>
        <span className="gk-badge" style={{ height: 15, fontSize: 9, padding: '0 5px' }}>0</span>
      </div>
      <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--foreground-subtle)', fontSize: 11 }}>
        No sub-agents spawned yet
      </div>
    </div>
  );
}

/* ── Single agent (no tree needed) ─────────────────────────── */
function AgentTreeSingle() {
  return (
    <div style={agentPanelStyle}>
      <div style={headerStyle}>
        <I.Cpu size={12} sw={1.8} style={{ color: 'var(--foreground-subtle)' }}/>
        <span style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>Sub-Agents</span>
        <span className="gk-badge" style={{ height: 15, fontSize: 9, padding: '0 5px' }}>1</span>
      </div>
      <AgentNode name="Main session" model="Opus 4.7" status="running" tools={12} duration="1m 30s" hasChildren expanded/>
      <AgentNode name="Review auth module" model="Sonnet" status="running" tools={4} duration="…" depth={1}/>
    </div>
  );
}

/* ── Canonical (spec sample) ───────────────────────────────── */
function AgentTreeCanonical() {
  return (
    <div style={agentPanelStyle}>
      <div style={headerStyle}>
        <I.Cpu size={12} sw={1.8} style={{ color: 'var(--foreground-subtle)' }}/>
        <span style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>Sub-Agents</span>
        <span className="gk-badge" style={{ height: 15, fontSize: 9, padding: '0 5px' }}>5</span>
      </div>
      <AgentNode name="Main session" model="Opus 4.7" status="running" tools={45} duration="4m 12s" hasChildren expanded/>
      <AgentNode name="Explore codebase structure" model="Sonnet" status="completed" tools={12} duration="23s" depth={1} active/>
      <AgentNode name="Review error handling" model="Sonnet" status="completed" tools={8} duration="15s" depth={1} hasChildren expanded/>
      <AgentNode name="Fetch library docs" model="Haiku" status="completed" tools={3} duration="4s" depth={2}/>
      <AgentNode name="Implement provider trait" model="Sonnet" status="running" tools={5} duration="…" depth={1}/>
      <AgentNode name="Run test suite" model="Haiku" status="failed" tools={2} duration="8s" depth={1}/>
    </div>
  );
}

/* ── Deep nesting (4+ levels) ──────────────────────────────── */
function AgentTreeDeep() {
  return (
    <div style={agentPanelStyle}>
      <div style={headerStyle}>
        <I.Cpu size={12} sw={1.8} style={{ color: 'var(--foreground-subtle)' }}/>
        <span style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>Sub-Agents</span>
        <span className="gk-badge" style={{ height: 15, fontSize: 9, padding: '0 5px' }}>8</span>
      </div>
      <AgentNode name="Main session" model="Opus 4.7" status="running" tools={82} duration="8m 45s" hasChildren expanded/>
      <AgentNode name="Implement auth system" model="Sonnet" status="running" tools={34} duration="5m 12s" depth={1} hasChildren expanded/>
      <AgentNode name="Research OAuth2 crates" model="Haiku" status="completed" tools={6} duration="12s" depth={2}/>
      <AgentNode name="Write PKCE module" model="Sonnet" status="completed" tools={14} duration="2m 8s" depth={2} hasChildren expanded/>
      <AgentNode name="Generate test fixtures" model="Haiku" status="completed" tools={3} duration="5s" depth={3} hasChildren expanded/>
      <AgentNode name="Fetch RFC examples" model="Haiku" status="completed" tools={2} duration="3s" depth={4}/>
      <AgentNode name="Write token cache" model="Sonnet" status="running" tools={8} duration="…" depth={2}/>
      <AgentNode name="Update CI config" model="Haiku" status="completed" tools={4} duration="9s" depth={1}/>
    </div>
  );
}

/* ── Many agents (15+ nodes, scrollable) ───────────────────── */
function AgentTreeMany() {
  const agents = [
    { name: 'Main session', model: 'Opus 4.7', status: 'running', tools: 120, duration: '18m 32s', depth: 0, hasChildren: true, expanded: true },
    { name: 'Explore codebase', model: 'Sonnet', status: 'completed', tools: 12, duration: '23s', depth: 1 },
    { name: 'Review auth module', model: 'Sonnet', status: 'completed', tools: 8, duration: '15s', depth: 1 },
    { name: 'Implement PKCE flow', model: 'Sonnet', status: 'completed', tools: 18, duration: '3m 4s', depth: 1 },
    { name: 'Write token cache', model: 'Sonnet', status: 'completed', tools: 10, duration: '1m 42s', depth: 1 },
    { name: 'Update provider trait', model: 'Sonnet', status: 'completed', tools: 6, duration: '45s', depth: 1 },
    { name: 'Migrate Claude Code provider', model: 'Sonnet', status: 'completed', tools: 14, duration: '2m 18s', depth: 1 },
    { name: 'Migrate OpenCode provider', model: 'Sonnet', status: 'completed', tools: 11, duration: '1m 55s', depth: 1 },
    { name: 'Migrate Cursor provider', model: 'Sonnet', status: 'completed', tools: 9, duration: '1m 30s', depth: 1 },
    { name: 'Migrate Codex provider', model: 'Sonnet', status: 'completed', tools: 7, duration: '1m 10s', depth: 1 },
    { name: 'Run integration tests', model: 'Haiku', status: 'completed', tools: 3, duration: '42s', depth: 1 },
    { name: 'Fix test failures', model: 'Sonnet', status: 'completed', tools: 5, duration: '38s', depth: 1 },
    { name: 'Update documentation', model: 'Haiku', status: 'completed', tools: 4, duration: '15s', depth: 1 },
    { name: 'Verify migration paths', model: 'Sonnet', status: 'running', tools: 6, duration: '…', depth: 1 },
    { name: 'Generate changelog', model: 'Haiku', status: 'completed', tools: 2, duration: '4s', depth: 1 },
    { name: 'Final review pass', model: 'Sonnet', status: 'running', tools: 3, duration: '…', depth: 1 },
  ];
  return (
    <div style={{ ...agentPanelStyle, maxHeight: 400, display: 'flex', flexDirection: 'column' }}>
      <div style={headerStyle}>
        <I.Cpu size={12} sw={1.8} style={{ color: 'var(--foreground-subtle)' }}/>
        <span style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>Sub-Agents</span>
        <span className="gk-badge" style={{ height: 15, fontSize: 9, padding: '0 5px' }}>16</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {agents.map((a, i) => <AgentNode key={i} {...a}/>)}
      </div>
    </div>
  );
}

/* ── Hover / selection states ──────────────────────────────── */
function AgentTreeStates() {
  return (
    <div style={agentPanelStyle}>
      <div style={headerStyle}>
        <I.Cpu size={12} sw={1.8} style={{ color: 'var(--foreground-subtle)' }}/>
        <span style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>Interaction States</span>
      </div>
      <div className="gk-eyebrow" style={{ padding: '4px 6px', fontSize: 9 }}>default</div>
      <AgentNode name="Default node" model="Sonnet" status="completed" tools={8} duration="15s" depth={0}/>
      <div className="gk-eyebrow" style={{ padding: '4px 6px', fontSize: 9, marginTop: 4 }}>hover (bg highlight)</div>
      <AgentNode name="Hovered node" model="Sonnet" status="completed" tools={12} duration="23s" depth={0} expanded/>
      <div className="gk-eyebrow" style={{ padding: '4px 6px', fontSize: 9, marginTop: 4 }}>active (expanded inline, primary border)</div>
      <AgentNode name="Active / expanded inline" model="Sonnet" status="completed" tools={12} duration="23s" depth={0} active/>
      <div className="gk-eyebrow" style={{ padding: '4px 6px', fontSize: 9, marginTop: 4 }}>running (pulse dot)</div>
      <AgentNode name="Currently running" model="Opus 4.7" status="running" tools={5} duration="…" depth={0}/>
      <div className="gk-eyebrow" style={{ padding: '4px 6px', fontSize: 9, marginTop: 4 }}>failed (red X)</div>
      <AgentNode name="Failed agent" model="Haiku" status="failed" tools={2} duration="8s" depth={0}/>
    </div>
  );
}

Object.assign(window, {
  AgentTreeEmpty, AgentTreeSingle, AgentTreeCanonical, AgentTreeDeep,
  AgentTreeMany, AgentTreeStates,
});
