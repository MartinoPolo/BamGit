/* global React, I, SessionBadge, CtxBar, ProviderIcon, MetaField, PermModeSelect, ModelSelect,
   QuotaBars, ChatInput, AgentTreeContent, SessionTabs, SampleStream, ToolCardL1 */

/* Variant C — Left panel layout (metadata + tree in left sidebar) */

function VariantC() {
  const [treeCollapsed, setTreeCollapsed] = React.useState(false);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
      {/* ── Left sidebar: metadata + agent tree ── */}
      {!treeCollapsed && (
        <div style={{ width: 272, borderRight: '1px solid var(--border)', background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          {/* Session metadata */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SessionBadge state="running"/>
              <div style={{ flex: 1 }}></div>
              <button className="gk-btn gk-btn-ghost gk-btn-sm gk-btn-icon" style={{ width: 22, height: 22 }} onClick={() => setTreeCollapsed(true)}>
                <I.PanelLeft size={13} sw={1.8}/>
              </button>
            </div>

            {/* Provider + model */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ProviderIcon provider="Claude Code" size={15}/>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--foreground)', fontWeight: 500 }}>Opus 4.7</span>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)' }}>(200K)</span>
            </div>

            {/* Selectors stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--foreground-subtle)', width: 56 }}>Perms</span>
                <PermModeSelect value="Approve each"/>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--foreground-subtle)', width: 56 }}>Model</span>
                <ModelSelect value="Opus 4.7"/>
              </div>
            </div>

            {/* Git + links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <I.GitBranch size={11} sw={1.6} style={{ color: 'var(--foreground-subtle)' }}/>
                <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>feat/session-ui</span>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <span className="gk-badge gk-badge-info" style={{ height: 17, fontSize: 10 }}>#90 open</span>
                <span className="gk-badge gk-badge-moss" style={{ height: 17, fontSize: 10 }}>PR #5 draft</span>
              </div>
            </div>

            {/* Context + cost */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 4, borderTop: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: 'var(--foreground-subtle)' }}>Context</span>
                <CtxBar pct={54} label="54% · 108K"/>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: 'var(--foreground-subtle)' }}>Cost</span>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--foreground)', fontWeight: 500 }}>$4.387</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: 'var(--foreground-subtle)' }}>Tokens</span>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)' }}>48.2K in · 12.1K out</span>
              </div>
              <QuotaBars/>
            </div>
          </div>

          {/* Agent tree */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <I.Cpu size={12} sw={1.8} style={{ color: 'var(--foreground-subtle)' }}/>
              <span style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>Sub-Agents</span>
              <span className="gk-badge" style={{ height: 15, fontSize: 9, padding: '0 5px' }}>5</span>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '6px 4px' }}>
              <AgentTreeContent/>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed sidebar */}
      {treeCollapsed && (
        <div style={{ width: 44, borderRight: '1px solid var(--border)', background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 6, flexShrink: 0 }}>
          <button className="gk-btn gk-btn-ghost gk-btn-sm gk-btn-icon" style={{ width: 28, height: 28 }} onClick={() => setTreeCollapsed(false)}>
            <I.PanelLeft size={14} sw={1.8}/>
          </button>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-success)', animation: 'gk-pulse 1.8s ease-in-out infinite' }}></div>
          <span className="font-mono" style={{ fontSize: 9, color: 'var(--foreground-subtle)', writingMode: 'vertical-lr', transform: 'rotate(180deg)', marginTop: 8 }}>5 agents</span>
        </div>
      )}

      {/* ── Main chat column ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Tabs */}
        <div style={{ padding: '6px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <SessionTabs active="chat"/>
        </div>

        {/* Message stream */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px', position: 'relative' }}>
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

          <div style={{ height: 20 }}></div>
        </div>

        {/* Input pinned bottom */}
        <div style={{ padding: '10px 24px 14px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <ChatInput/>
        </div>
      </div>
    </div>
  );
}

window.VariantC = VariantC;
