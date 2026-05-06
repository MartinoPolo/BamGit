/* global React, I, SessionBadge, CtxBar, ProviderIcon, MetaField, PermModeSelect, ModelSelect,
   QuotaBars, ChatInput, AgentTreeContent, SessionTabs, SampleStream, JumpButton */

/* Variant A — Top bar + right sidebar */

function VariantA() {
  const [treeOpen, setTreeOpen] = React.useState(true);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
      {/* ── Top metadata bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0, flexWrap: 'wrap', minHeight: 42 }}>
        <SessionBadge state="running"/>
        <div style={{ width: 1, height: 18, background: 'var(--border)' }}></div>
        <ProviderIcon provider="Claude Code" size={16}/>
        <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--foreground)', fontWeight: 500 }}>Opus 4.7 <span style={{ color: 'var(--foreground-subtle)', fontWeight: 400 }}>(200K)</span></span>
        <div style={{ width: 1, height: 18, background: 'var(--border)' }}></div>
        <PermModeSelect value="Approve each"/>
        <ModelSelect value="Opus 4.7"/>
        <div style={{ width: 1, height: 18, background: 'var(--border)' }}></div>
        <I.GitBranch size={12} sw={1.6} style={{ color: 'var(--foreground-subtle)' }}/>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--foreground-muted)' }}>feat/session-ui</span>
        <span className="gk-badge gk-badge-info" style={{ height: 18, fontSize: 10 }}>#90 open</span>
        <span className="gk-badge gk-badge-moss" style={{ height: 18, fontSize: 10 }}>PR #5 draft</span>
        <div style={{ flex: 1 }}></div>
        <CtxBar pct={54} label="54% · 108K"/>
        <div style={{ width: 1, height: 18, background: 'var(--border)' }}></div>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--foreground)' }}>$4.387</span>
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)' }}>48.2K in · 12.1K out</span>
        <div style={{ width: 1, height: 18, background: 'var(--border)' }}></div>
        <QuotaBars/>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Chat column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>
          {/* Tabs */}
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <SessionTabs active="chat"/>
            <div style={{ flex: 1 }}></div>
            <button className="gk-btn gk-btn-ghost gk-btn-sm" style={{ fontSize: 11 }} onClick={() => setTreeOpen(!treeOpen)}>
              <I.Cpu size={12} sw={1.8}/>
              {treeOpen ? 'Hide' : 'Show'} agents
              <span className="gk-badge gk-badge-moss" style={{ height: 16, fontSize: 9, padding: '0 5px' }}>5</span>
            </button>
          </div>

          {/* Message stream */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
            <SampleStream/>

            {/* Inline sub-agent expansion example */}
            <div style={{ margin: '12px 0', borderLeft: '3px solid var(--azure-400)', paddingLeft: 14, background: 'color-mix(in oklch, var(--azure-400) 4%, transparent)', borderRadius: '0 6px 6px 0', padding: '10px 14px 10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <I.Cpu size={12} sw={1.8} style={{ color: 'var(--azure-400)' }}/>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Sub-agent: Explore codebase structure</span>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)' }}>Sonnet · 12 tools · 23s</span>
                <div style={{ flex: 1 }}></div>
                <button className="gk-btn gk-btn-ghost gk-btn-sm" style={{ height: 20, fontSize: 10, padding: '0 6px' }}>Collapse</button>
              </div>
              <div style={{ opacity: 0.85, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                <div style={{ color: 'var(--foreground-muted)', lineHeight: 1.5 }}>I'll explore the project structure to understand the codebase layout and key modules.</div>
                <ToolCardL1 tool="Glob" detail="**/*.rs" outputLabel="23 files" duration="0.1s"/>
                <ToolCardL1 tool="Read" detail="src/main.rs" outputLabel="84 lines" duration="0.2s"/>
                <div style={{ color: 'var(--foreground-muted)', lineHeight: 1.5 }}>Found 23 Rust source files organized in 4 modules: <code style={{ fontSize: 12, padding: '1px 5px', background: 'var(--code-bg)', borderRadius: 4, border: '1px solid var(--border)' }}>providers</code>, <code style={{ fontSize: 12, padding: '1px 5px', background: 'var(--code-bg)', borderRadius: 4, border: '1px solid var(--border)' }}>session</code>, <code style={{ fontSize: 12, padding: '1px 5px', background: 'var(--code-bg)', borderRadius: 4, border: '1px solid var(--border)' }}>ui</code>, and <code style={{ fontSize: 12, padding: '1px 5px', background: 'var(--code-bg)', borderRadius: 4, border: '1px solid var(--border)' }}>config</code>.</div>
              </div>
            </div>
          </div>

          {/* Input pinned bottom */}
          <div style={{ padding: '10px 20px 14px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
            <ChatInput/>
          </div>
        </div>

        {/* Right sidebar — agent tree */}
        {treeOpen && (
          <div style={{ width: 280, borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <I.Cpu size={13} sw={1.8} style={{ color: 'var(--foreground-subtle)' }}/>
              <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>Sub-Agents</span>
              <span className="gk-badge" style={{ height: 16, fontSize: 9, padding: '0 5px' }}>5 agents</span>
              <button className="gk-btn gk-btn-ghost gk-btn-sm gk-btn-icon" style={{ width: 22, height: 22 }} onClick={() => setTreeOpen(false)}>
                <I.X size={11} sw={2}/>
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '8px 4px' }}>
              <AgentTreeContent/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.VariantA = VariantA;
