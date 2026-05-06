/* global React, I, SessionBadge, CtxBar, ProviderIcon, MetaField, PermModeSelect, ModelSelect,
   QuotaBars, ChatInput, AgentTreeContent, SessionTabs, SampleStream, ToolCardL1 */

/* Variant B — Floating HUD + slide-over tree */

function VariantB() {
  const [treeOpen, setTreeOpen] = React.useState(true);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-sans)', overflow: 'hidden', position: 'relative' }}>
      {/* Tabs at very top */}
      <div style={{ padding: '6px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <SessionTabs active="chat"/>
        <div style={{ flex: 1 }}></div>
        <button className="gk-btn gk-btn-ghost gk-btn-sm" style={{ fontSize: 11 }} onClick={() => setTreeOpen(!treeOpen)}>
          <I.Cpu size={12} sw={1.8}/>
          Agents
          <span className="gk-badge gk-badge-moss" style={{ height: 16, fontSize: 9, padding: '0 5px' }}>5</span>
        </button>
      </div>

      {/* Main chat area (full width) */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', padding: '16px 20px' }}>
        {/* ── Floating HUD metadata overlay ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 15,
          background: 'color-mix(in oklch, var(--surface) 85%, transparent)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid color-mix(in oklch, var(--border) 60%, transparent)',
          borderRadius: 10, padding: '8px 14px',
          marginBottom: 16, boxShadow: 'var(--shadow-md)',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <SessionBadge state="running"/>
          <ProviderIcon provider="Claude Code" size={15}/>
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--foreground)', fontWeight: 500 }}>Opus 4.7 <span style={{ color: 'var(--foreground-subtle)', fontWeight: 400 }}>(200K)</span></span>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }}></div>
          <PermModeSelect value="Approve each"/>
          <ModelSelect value="Opus 4.7"/>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }}></div>
          <I.GitBranch size={11} sw={1.6} style={{ color: 'var(--foreground-subtle)' }}/>
          <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-muted)' }}>feat/session-ui</span>
          <span className="gk-badge gk-badge-info" style={{ height: 17, fontSize: 10 }}>#90 open</span>
          <span className="gk-badge gk-badge-moss" style={{ height: 17, fontSize: 10 }}>PR #5 draft</span>
          <div style={{ flex: 1 }}></div>
          <CtxBar pct={54} label="54%"/>
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--foreground)', fontWeight: 500 }}>$4.387</span>
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)' }}>48.2K / 12.1K</span>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }}></div>
          <QuotaBars/>
        </div>

        {/* Message stream */}
        <SampleStream/>

        {/* Inline sub-agent expansion */}
        <div style={{ margin: '12px 0', borderLeft: '3px solid var(--azure-400)', background: 'color-mix(in oklch, var(--azure-400) 4%, transparent)', borderRadius: '0 6px 6px 0', padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <I.Cpu size={12} sw={1.8} style={{ color: 'var(--azure-400)' }}/>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Sub-agent: Explore codebase structure</span>
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)' }}>Sonnet · 12 tools · 23s</span>
            <div style={{ flex: 1 }}></div>
            <button className="gk-btn gk-btn-ghost gk-btn-sm" style={{ height: 20, fontSize: 10, padding: '0 6px' }}>Collapse</button>
          </div>
          <div style={{ opacity: 0.85, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ color: 'var(--foreground-muted)', fontSize: 13, lineHeight: 1.5 }}>Exploring the project structure to understand codebase layout.</div>
            <ToolCardL1 tool="Glob" detail="**/*.rs" outputLabel="23 files" duration="0.1s"/>
            <ToolCardL1 tool="Read" detail="src/main.rs" outputLabel="84 lines" duration="0.2s"/>
          </div>
        </div>

        {/* Extra space for input */}
        <div style={{ height: 20 }}></div>
      </div>

      {/* Input pinned bottom */}
      <div style={{ padding: '10px 20px 14px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0, position: 'relative', zIndex: 20 }}>
        <ChatInput/>
      </div>

      {/* ── Slide-over agent tree (overlays from right) ── */}
      {treeOpen && (
        <>
          <div onClick={() => setTreeOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 25, background: 'color-mix(in oklch, var(--background) 40%, transparent)' }}></div>
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 300, zIndex: 30,
            background: 'var(--surface)', borderLeft: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column',
          }}>
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
        </>
      )}
    </div>
  );
}

window.VariantB = VariantB;
