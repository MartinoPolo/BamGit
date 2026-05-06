/* global React, I */
/* Session Chat View — shared primitives */

/* ── Tool icon map ─────────────────────────────────────────── */
const TOOL_ICONS = {
  Bash:      { icon: (p) => <I.Terminal {...p}/>, color: 'oklch(0.700 0.150 145)' },
  Read:      { icon: (p) => <I.Eye {...p}/>,      color: 'oklch(0.660 0.105 220)' },
  Write:     { icon: (p) => <I.Save {...p}/>,     color: 'oklch(0.770 0.155 75)' },
  Edit:      { icon: (p) => <I.Code {...p}/>,     color: 'oklch(0.700 0.180 50)' },
  Glob:      { icon: (p) => <I.Folder {...p}/>,   color: 'oklch(0.720 0.130 250)' },
  Grep:      { icon: (p) => <I.Search {...p}/>,   color: 'oklch(0.660 0.180 320)' },
  Agent:     { icon: (p) => <I.Cpu {...p}/>,      color: 'oklch(0.620 0.150 280)' },
  WebSearch: { icon: (p) => <I.Globe {...p}/>,    color: 'oklch(0.720 0.130 165)' },
  WebFetch:  { icon: (p) => <I.ArrowRight {...p}/>, color: 'oklch(0.620 0.150 30)' },
  TodoWrite: { icon: (p) => <I.List {...p}/>,     color: 'oklch(0.730 0.165 120)' },
  Task:      { icon: (p) => <I.Settings {...p}/>, color: 'oklch(0.720 0.060 280)' },
};

/* ── Color threshold helpers ───────────────────────────────── */
function ctxColor(pct) { return pct > 60 ? 'var(--status-danger)' : pct > 40 ? 'var(--status-warning)' : 'var(--status-success)'; }
function quotaColor(pct) { return pct > 85 ? 'var(--status-danger)' : pct > 60 ? 'var(--status-warning)' : 'var(--status-success)'; }

/* ── Progress bar ──────────────────────────────────────────── */
function ProgressBar({ pct, colorFn, width, height = 5 }) {
  const c = colorFn ? colorFn(pct) : 'var(--status-success)';
  return (
    <div style={{ width: width || '100%', height, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ width: pct + '%', height: '100%', borderRadius: 3, background: c, transition: 'width 300ms' }}></div>
    </div>
  );
}

/* ── Status badge ──────────────────────────────────────────── */
function SessionBadge({ state }) {
  const cfg = {
    running:       { cls: 'gk-badge-success', label: 'Running', pulse: true },
    'needs-input': { cls: 'gk-badge-warning', label: 'Needs Input', pulse: true },
    'needs-review':{ cls: 'gk-badge-info',    label: 'Needs Review' },
    stopped:       { cls: 'gk-badge-warning', label: 'Stopped' },
    finished:      { cls: 'gk-badge-moss',    label: 'Finished' },
    errored:       { cls: 'gk-badge-danger',  label: 'Errored' },
  }[state] || { cls: '', label: state };
  return (
    <span className={`gk-badge ${cfg.cls}`}>
      <span className="gk-badge-dot" style={cfg.pulse ? { animation: 'gk-pulse 1.8s ease-in-out infinite' } : {}}></span>
      {cfg.label}
    </span>
  );
}

/* ── Provider chip ─────────────────────────────────────────── */
function ProviderChip({ provider = 'Claude Code' }) {
  const colors = { 'Claude Code': 'var(--amber-400)', 'OpenCode': 'var(--azure-400)', 'Codex': 'var(--status-success)', 'Cursor': 'var(--foreground-muted)' };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 5px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', transition: 'border-color 120ms' }}>
      <div style={{ width: 14, height: 14, borderRadius: 3, background: colors[provider] || 'var(--foreground-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <I.Zap size={9} sw={2.4} style={{ color: 'var(--background)' }}/>
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--foreground)' }}>{provider}</span>
    </div>
  );
}

/* ── Tool card L1 (compact) ────────────────────────────────── */
function ToolCardL1({ tool, detail, outputLabel, duration, status = 'success', dimmed, error }) {
  const t = TOOL_ICONS[tool] || TOOL_ICONS.Bash;
  const borderColor = error ? 'color-mix(in oklch, var(--status-danger) 40%, var(--border))' : 'var(--border)';
  const statusIcon = status === 'success' ? <I.Check size={12} sw={2.2} style={{ color: 'var(--status-success)' }}/> :
                     status === 'error' ? <I.X size={12} sw={2.2} style={{ color: 'var(--status-danger)' }}/> :
                     <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--foreground-muted)', borderTopColor: 'transparent', animation: 'gk-spin 0.7s linear infinite' }}></span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 10px', borderRadius: 6, background: 'var(--surface-2)', border: `1px solid ${borderColor}`, borderLeftWidth: error ? 3 : 1, borderLeftColor: error ? 'var(--status-danger)' : borderColor, cursor: 'pointer', opacity: dimmed ? 0.5 : 0.8, transition: 'opacity 120ms' }}>
      <span style={{ color: t.color, display: 'flex' }}>{t.icon({ size: 13, sw: 1.8 })}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', minWidth: 32 }}>{tool}</span>
      <span className="font-mono" style={{ fontSize: 11, color: 'var(--foreground-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail}</span>
      {outputLabel && <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-subtle)' }}>{outputLabel}</span>}
      {duration && <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-subtle)', minWidth: 28, textAlign: 'right' }}>{duration}</span>}
      {statusIcon}
    </div>
  );
}

/* ── Tool card L2 (expanded) ───────────────────────────────── */
function ToolCardL2({ tool, detail, outputLabel, duration, status = 'running', content }) {
  const t = TOOL_ICONS[tool] || TOOL_ICONS.Bash;
  const statusIcon = status === 'running' ?
    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--foreground-muted)', borderTopColor: 'transparent', animation: 'gk-spin 0.7s linear infinite' }}></span> :
    status === 'success' ? <I.Check size={12} sw={2.2} style={{ color: 'var(--status-success)' }}/> :
    <I.X size={12} sw={2.2} style={{ color: 'var(--status-danger)' }}/>;
  return (
    <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 10px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ color: t.color, display: 'flex' }}>{t.icon({ size: 13, sw: 1.8 })}</span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{tool}</span>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--foreground-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail}</span>
        {outputLabel && <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-subtle)' }}>{outputLabel}</span>}
        {duration && <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-subtle)' }}>{duration}</span>}
        {statusIcon}
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ width: 3, background: t.color, flexShrink: 0 }}></div>
        <pre className="font-mono" style={{ fontSize: 11.5, lineHeight: 1.55, padding: '10px 12px', margin: 0, color: 'var(--foreground-muted)', maxHeight: 260, overflow: 'auto', flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{content}</pre>
      </div>
    </div>
  );
}

/* ── Tool card L3 — Permission prompt ──────────────────────── */
function ToolCardL3Perm({ tool, detail }) {
  const t = TOOL_ICONS[tool] || TOOL_ICONS.Bash;
  return (
    <div style={{ borderRadius: 8, border: '1px solid color-mix(in oklch, var(--status-warning) 40%, var(--border))', overflow: 'hidden', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px', background: 'color-mix(in oklch, var(--status-warning) 8%, var(--surface-2))', borderBottom: '1px solid color-mix(in oklch, var(--status-warning) 30%, var(--border))' }}>
        <I.AlertTriangle size={13} sw={2} style={{ color: 'var(--status-warning)' }}/>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Agent wants to use <strong style={{ color: t.color }}>{tool}</strong></span>
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ width: 3, background: 'var(--status-warning)', flexShrink: 0 }}></div>
        <div style={{ padding: '10px 12px', flex: 1 }}>
          <pre className="font-mono" style={{ fontSize: 11.5, lineHeight: 1.5, margin: '0 0 12px', color: 'var(--foreground-muted)', whiteSpace: 'pre-wrap' }}>{detail}</pre>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="gk-btn gk-btn-sm" style={{ background: 'var(--status-success)', color: '#fff', borderColor: 'transparent' }}>Allow <span className="gk-kbd" style={{ marginLeft: 4, fontSize: 9, height: 15, minWidth: 14, background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}>↵</span></button>
            <button className="gk-btn gk-btn-secondary gk-btn-sm">Allow Always <span className="gk-kbd" style={{ marginLeft: 4, fontSize: 9, height: 15 }}>⌃↵</span></button>
            <button className="gk-btn gk-btn-danger gk-btn-sm">Deny <span className="gk-kbd" style={{ marginLeft: 4, fontSize: 9, height: 15 }}>Esc</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Tool card L3 — Elicitation ────────────────────────────── */
function ToolCardL3Elicit({ server, message }) {
  return (
    <div style={{ borderRadius: 8, border: '1px solid color-mix(in oklch, var(--status-info) 40%, var(--border))', overflow: 'hidden', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px', background: 'color-mix(in oklch, var(--status-info) 8%, var(--surface-2))', borderBottom: '1px solid color-mix(in oklch, var(--status-info) 30%, var(--border))' }}>
        <I.Database size={13} sw={1.8} style={{ color: 'var(--status-info)' }}/>
        <span style={{ fontSize: 12, fontWeight: 600 }}>MCP: {server}</span>
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ width: 3, background: 'var(--status-info)', flexShrink: 0 }}></div>
        <div style={{ padding: '10px 12px', flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--foreground)', marginBottom: 10, lineHeight: 1.5 }}>{message}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input className="gk-input" placeholder="Enter value…" style={{ fontSize: 12, flex: 1, maxWidth: 320 }}/>
            <button className="gk-btn gk-btn-primary gk-btn-sm">Submit <span className="gk-kbd" style={{ marginLeft: 4, fontSize: 9, height: 15, minWidth: 14, background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}>↵</span></button>
            <button className="gk-btn gk-btn-ghost gk-btn-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Tool card L3 — Ask user (options) ─────────────────────── */
function ToolCardL3Ask({ question, options }) {
  const [sel, setSel] = React.useState(0);
  return (
    <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
        <I.Compass size={13} sw={1.8} style={{ color: 'var(--foreground-muted)' }}/>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Agent asks</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 13, color: 'var(--foreground)', marginBottom: 10, lineHeight: 1.5 }}>{question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
          {(options || []).map((o, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, cursor: 'pointer', background: sel === i ? 'var(--primary-soft)' : 'transparent', border: `1px solid ${sel === i ? 'color-mix(in oklch, var(--primary) 30%, var(--border))' : 'transparent'}` }}>
              <input type="radio" className="gk-radio" name="ask-opt" checked={sel === i} onChange={() => setSel(i)}/>
              <span style={{ fontSize: 12.5 }}>{o}</span>
            </label>
          ))}
        </div>
        <button className="gk-btn gk-btn-primary gk-btn-sm">Confirm <span className="gk-kbd" style={{ marginLeft: 4, fontSize: 9, height: 15, minWidth: 14, background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}>↵</span></button>
      </div>
    </div>
  );
}

/* ── Tool group collapse ───────────────────────────────────── */
function ToolGroup({ count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', cursor: 'pointer', color: 'var(--foreground-subtle)', fontSize: 11, fontWeight: 500 }}>
      <I.ChevronRight size={12} sw={2}/>
      <span>{count} tool calls</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
    </div>
  );
}

/* ── Chat messages ─────────────────────────────────────────── */
function UserMsg({ text, dimmed, images }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', opacity: dimmed ? 0.4 : 1 }}>
      <div style={{ maxWidth: '75%' }}>
        {images && images.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {images.map((img, i) => (
              <div key={i} style={{ width: 80, height: 56, borderRadius: 8, background: 'var(--surface-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--foreground-subtle)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${['oklch(0.7 0.12 200)', 'oklch(0.6 0.15 260)', 'oklch(0.7 0.1 150)'][i % 3]} 0%, var(--surface-3) 100%)`, position: 'absolute', inset: 0, opacity: 0.5 }}></div>
                <span className="font-mono" style={{ position: 'relative', fontSize: 10, fontWeight: 600 }}>#{img}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ padding: '10px 14px', borderRadius: '14px 14px 4px 14px', background: 'var(--primary-soft)', color: 'var(--foreground)', fontSize: 13, lineHeight: 1.55 }}>
          {text}
        </div>
      </div>
    </div>
  );
}

function AssistantMsg({ children, dimmed, streaming }) {
  return (
    <div style={{ opacity: dimmed ? 0.4 : 1 }}>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--foreground)' }}>
        {children}
        {streaming && <span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--primary)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'gk-pulse 1s ease-in-out infinite' }}></span>}
      </div>
    </div>
  );
}

function SystemMsg({ text, dimmed }) {
  return <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--foreground-subtle)', padding: '4px 0', opacity: dimmed ? 0.35 : 0.7 }}>{text}</div>;
}

function InlineCode({ children }) {
  return <code style={{ fontSize: 12, padding: '1px 5px', background: 'var(--code-bg)', borderRadius: 4, border: '1px solid var(--border)' }}>{children}</code>;
}

/* ── Sub-agent tree node ───────────────────────────────────── */
function AgentNode({ name, model, status, tools, duration, depth = 0, hasChildren, expanded, active }) {
  const statusEl = status === 'running' ?
    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--status-success)', display: 'inline-block', animation: 'gk-pulse 1.8s ease-in-out infinite', flexShrink: 0 }}></span> :
    status === 'completed' ? <I.Check size={11} sw={2.2} style={{ color: 'var(--status-success)', flexShrink: 0 }}/> :
    <I.X size={11} sw={2.2} style={{ color: 'var(--status-danger)', flexShrink: 0 }}/>;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 6px', marginLeft: depth * 14, borderRadius: 5, cursor: 'pointer', background: active ? 'var(--primary-soft)' : expanded ? 'var(--surface-2)' : 'transparent', fontSize: 12, borderLeft: active ? '2px solid var(--primary)' : '2px solid transparent' }}>
        {hasChildren ? <I.Chevron size={10} sw={2} style={{ color: 'var(--foreground-subtle)', transform: expanded ? 'none' : 'rotate(-90deg)', transition: 'transform 120ms', flexShrink: 0 }}/> : <span style={{ width: 10, flexShrink: 0 }}></span>}
        {statusEl}
        <span style={{ fontWeight: 500, color: 'var(--foreground)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11.5 }}>{name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: depth * 14 + 28, padding: '0 6px 2px', fontSize: 10, color: 'var(--foreground-subtle)' }}>
        <span className="font-mono">{model}</span>
        <span className="font-mono">{tools} tools</span>
        <span className="font-mono">{duration}</span>
      </div>
    </div>
  );
}

function AgentTreeContent({ showActive }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <AgentNode name="Main session" model="Opus 4.7" status="running" tools={45} duration="4m 12s" hasChildren expanded/>
      <AgentNode name="Explore codebase structure" model="Sonnet" status="completed" tools={12} duration="23s" depth={1} active={showActive}/>
      <AgentNode name="Review error handling" model="Sonnet" status="completed" tools={8} duration="15s" depth={1} hasChildren expanded/>
      <AgentNode name="Fetch library docs" model="Haiku" status="completed" tools={3} duration="4s" depth={2}/>
      <AgentNode name="Implement provider trait" model="Sonnet" status="running" tools={5} duration="…" depth={1}/>
      <AgentNode name="Run test suite" model="Haiku" status="failed" tools={2} duration="8s" depth={1}/>
    </div>
  );
}

/* ── Session tabs ──────────────────────────────────────────── */
function SessionTabs({ active = 'chat' }) {
  return (
    <div className="gk-tabs">
      <button className={`gk-tab ${active === 'chat' ? 'is-active' : ''}`}>Chat</button>
      <button className={`gk-tab ${active === 'files' ? 'is-active' : ''}`}>Files</button>
      <button className={`gk-tab ${active === 'stats' ? 'is-active' : ''}`}>Stats</button>
    </div>
  );
}

/* ── Dimmed turn wrapper (hover restores opacity) ──────────── */
function DimmedTurn({ children }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div style={{ opacity: hovered ? 1 : 0.4, transition: 'opacity 150ms ease-out', display: 'flex', flexDirection: 'column', gap: 6 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {children}
    </div>
  );
}

/* ── Inline sub-agent expansion block ──────────────────────── */
function SubAgentExpansion({ name, model, tools, duration }) {
  return (
    <div style={{ margin: '10px 0', borderLeft: '3px solid var(--azure-400)', background: 'color-mix(in oklch, var(--azure-400) 4%, transparent)', borderRadius: '0 6px 6px 0', padding: '10px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <I.Cpu size={12} sw={1.8} style={{ color: 'var(--azure-400)' }}/>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Sub-agent: {name}</span>
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)' }}>{model} · {tools} tools · {duration}</span>
        <div style={{ flex: 1 }}></div>
        <button className="gk-btn gk-btn-ghost gk-btn-sm" style={{ fontSize: 10, padding: '0 6px' }}>Collapse</button>
      </div>
      <div style={{ opacity: 0.85, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ color: 'var(--foreground-muted)', fontSize: 13, lineHeight: 1.5 }}>Exploring the project structure to understand codebase layout.</div>
        <ToolCardL1 tool="Glob" detail="**/*.rs" outputLabel="23 files" duration="0.1s"/>
        <ToolCardL1 tool="Read" detail="src/main.rs" outputLabel="84 lines" duration="0.2s"/>
        <div style={{ color: 'var(--foreground-muted)', fontSize: 13, lineHeight: 1.5 }}>Found 23 Rust source files in 4 modules: <InlineCode>providers</InlineCode>, <InlineCode>session</InlineCode>, <InlineCode>ui</InlineCode>, <InlineCode>config</InlineCode>.</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  TOOL_ICONS, ctxColor, quotaColor, ProgressBar, SessionBadge, ProviderChip,
  ToolCardL1, ToolCardL2, ToolCardL3Perm, ToolCardL3Elicit, ToolCardL3Ask, ToolGroup,
  UserMsg, AssistantMsg, SystemMsg, InlineCode, DimmedTurn,
  AgentNode, AgentTreeContent, SessionTabs, SubAgentExpansion,
});
