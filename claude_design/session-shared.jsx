/* global React, I */
/* Session Chat View — shared components */

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

/* ── Status badge ──────────────────────────────────────────── */
function SessionBadge({ state }) {
  const cfg = {
    running:      { cls: 'gk-badge-success', label: 'Running', pulse: true },
    'needs-input':{ cls: 'gk-badge-warning', label: 'Needs Input', pulse: true },
    'needs-review':{ cls: 'gk-badge-info',   label: 'Needs Review' },
    paused:       { cls: 'gk-badge-warning', label: 'Paused' },
    finished:     { cls: 'gk-badge-moss',    label: 'Finished' },
    errored:      { cls: 'gk-badge-danger',  label: 'Errored' },
  }[state] || { cls: '', label: state };
  return (
    <span className={`gk-badge ${cfg.cls}`}>
      <span className="gk-badge-dot" style={cfg.pulse ? { animation: 'gk-pulse 1.8s ease-in-out infinite' } : {}}></span>
      {cfg.label}
    </span>
  );
}

/* ── Context bar (progress) ────────────────────────────────── */
function CtxBar({ pct, label }) {
  const color = pct > 90 ? 'var(--status-danger)' : pct > 70 ? 'var(--status-warning)' : 'var(--status-success)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 5, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', borderRadius: 3, background: color, transition: 'width 300ms' }}></div>
      </div>
      <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-muted)' }}>{label || pct + '%'}</span>
    </div>
  );
}

/* ── Provider icon ─────────────────────────────────────────── */
function ProviderIcon({ provider, size = 14 }) {
  const colors = { 'Claude Code': 'var(--amber-400)', 'OpenCode': 'var(--azure-400)', 'Codex': 'var(--status-success)', 'Cursor': 'var(--foreground-muted)' };
  return (
    <div style={{ width: size, height: size, borderRadius: 3, background: colors[provider] || 'var(--foreground-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <I.Zap size={size * 0.65} sw={2.2} style={{ color: 'var(--background)' }}/>
    </div>
  );
}

/* ── Compact metadata field ────────────────────────────────── */
function MetaField({ label, children, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontSize: 10.5, color: 'var(--foreground-subtle)', letterSpacing: '0.02em' }}>{label}</span>
      <span className={mono ? 'font-mono' : ''} style={{ fontSize: mono ? 11 : 12, color: 'var(--foreground-muted)', fontWeight: 500 }}>{children}</span>
    </div>
  );
}

/* ── Permission mode selector ──────────────────────────────── */
function PermModeSelect({ value, disabled }) {
  const sty = {
    height: 24, padding: '0 8px', fontSize: 11, fontWeight: 500,
    background: disabled ? 'var(--surface-2)' : 'var(--surface-3)',
    border: '1px solid var(--border)', borderRadius: 6,
    color: disabled ? 'var(--foreground-subtle)' : 'var(--foreground)',
    fontFamily: 'var(--font-sans)', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  };
  return <select style={sty} disabled={disabled} defaultValue={value}><option>Approve each</option><option>Auto-accept edits</option><option>Bypass all</option></select>;
}

/* ── Model selector ────────────────────────────────────────── */
function ModelSelect({ value, disabled }) {
  const sty = {
    height: 24, padding: '0 8px', fontSize: 11, fontWeight: 500,
    background: disabled ? 'var(--surface-2)' : 'var(--surface-3)',
    border: '1px solid var(--border)', borderRadius: 6,
    color: disabled ? 'var(--foreground-subtle)' : 'var(--foreground)',
    fontFamily: 'var(--font-mono)', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  };
  return <select style={sty} disabled={disabled} defaultValue={value}><option>Opus 4.7</option><option>Sonnet 4</option><option>Haiku 4.5</option></select>;
}

/* ── Quota bars ────────────────────────────────────────────── */
function QuotaBars() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 10, color: 'var(--foreground-subtle)', width: 22 }}>5h</span>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--surface-3)', maxWidth: 64, overflow: 'hidden' }}>
          <div style={{ width: '42%', height: '100%', background: 'var(--status-success)', borderRadius: 2 }}></div>
        </div>
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)' }}>3h 28m</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 10, color: 'var(--foreground-subtle)', width: 22 }}>7d</span>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--surface-3)', maxWidth: 64, overflow: 'hidden' }}>
          <div style={{ width: '18%', height: '100%', background: 'var(--status-success)', borderRadius: 2 }}></div>
        </div>
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)' }}>6d 4h</span>
      </div>
    </div>
  );
}

/* ── Tool card L1 (compact) ────────────────────────────────── */
function ToolCardL1({ tool, detail, outputLabel, duration, status = 'success', dimmed }) {
  const t = TOOL_ICONS[tool] || TOOL_ICONS.Bash;
  const statusIcon = status === 'success' ? <I.Check size={12} sw={2.2} style={{ color: 'var(--status-success)' }}/> :
                     status === 'error' ? <I.X size={12} sw={2.2} style={{ color: 'var(--status-danger)' }}/> :
                     <span className="gk-pulse" style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--foreground-muted)', borderTopColor: 'transparent', animation: 'gk-spin 0.7s linear infinite' }}></span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 10px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', opacity: dimmed ? 0.55 : 0.8, transition: 'opacity 120ms' }}>
      <span style={{ color: t.color, display: 'flex' }}>{t.icon({ size: 13, sw: 1.8 })}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', minWidth: 32 }}>{tool}</span>
      <span className="font-mono" style={{ fontSize: 11, color: 'var(--foreground-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail}</span>
      <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-subtle)' }}>{outputLabel}</span>
      <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-subtle)', minWidth: 28, textAlign: 'right' }}>{duration}</span>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 10px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ color: t.color, display: 'flex' }}>{t.icon({ size: 13, sw: 1.8 })}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>{tool}</span>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--foreground-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail}</span>
        <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-subtle)' }}>{outputLabel}</span>
        <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-subtle)' }}>{duration}</span>
        {statusIcon}
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ width: 3, background: t.color, flexShrink: 0 }}></div>
        <pre className="font-mono" style={{ fontSize: 11.5, lineHeight: 1.55, padding: '10px 12px', margin: 0, color: 'var(--foreground-muted)', maxHeight: 260, overflow: 'auto', flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{content}</pre>
      </div>
    </div>
  );
}

/* ── Tool card L3 (permission prompt) ──────────────────────── */
function ToolCardL3({ tool, detail }) {
  const t = TOOL_ICONS[tool] || TOOL_ICONS.Bash;
  return (
    <div style={{ borderRadius: 8, border: '1px solid color-mix(in oklch, var(--status-warning) 40%, var(--border))', overflow: 'hidden', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px', background: 'color-mix(in oklch, var(--status-warning) 8%, var(--surface-2))', borderBottom: '1px solid color-mix(in oklch, var(--status-warning) 30%, var(--border))' }}>
        <I.AlertTriangle size={13} sw={2} style={{ color: 'var(--status-warning)' }}/>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>Agent wants to use <strong style={{ color: t.color }}>{tool}</strong></span>
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ width: 3, background: 'var(--status-warning)', flexShrink: 0 }}></div>
        <div style={{ padding: '10px 12px', flex: 1 }}>
          <pre className="font-mono" style={{ fontSize: 11.5, lineHeight: 1.5, margin: '0 0 12px', color: 'var(--foreground-muted)', whiteSpace: 'pre-wrap' }}>{detail}</pre>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="gk-btn gk-btn-primary gk-btn-sm" style={{ background: 'var(--status-success)', borderColor: 'transparent' }}>Allow <span className="gk-kbd" style={{ marginLeft: 4, fontSize: 9, height: 15, minWidth: 14, background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}>↵</span></button>
            <button className="gk-btn gk-btn-secondary gk-btn-sm">Allow Always <span className="gk-kbd" style={{ marginLeft: 4, fontSize: 9, height: 15 }}>⌃↵</span></button>
            <button className="gk-btn gk-btn-danger gk-btn-sm">Deny <span className="gk-kbd" style={{ marginLeft: 4, fontSize: 9, height: 15 }}>Esc</span></button>
          </div>
        </div>
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

/* ── Chat message (user) ───────────────────────────────────── */
function UserMsg({ text, dimmed }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', opacity: dimmed ? 0.4 : 1, transition: 'opacity 200ms' }}>
      <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: '14px 14px 4px 14px', background: 'var(--primary-soft)', color: 'var(--foreground)', fontSize: 13, lineHeight: 1.55 }}>
        {text}
      </div>
    </div>
  );
}

/* ── Chat message (assistant) ──────────────────────────────── */
function AssistantMsg({ children, dimmed, streaming }) {
  return (
    <div style={{ opacity: dimmed ? 0.4 : 1, transition: 'opacity 200ms' }}>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--foreground)' }}>
        {children}
        {streaming && <span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--primary)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'gk-pulse 1s ease-in-out infinite' }}></span>}
      </div>
    </div>
  );
}

/* ── System message ────────────────────────────────────────── */
function SystemMsg({ text, dimmed }) {
  return (
    <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--foreground-subtle)', padding: '4px 0', opacity: dimmed ? 0.35 : 0.7 }}>
      {text}
    </div>
  );
}

/* ── Code block ────────────────────────────────────────────── */
function CodeBlock({ lang, code }) {
  return (
    <div style={{ borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden', margin: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
        <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-subtle)' }}>{lang}</span>
        <button className="gk-btn gk-btn-ghost gk-btn-sm" style={{ height: 20, fontSize: 10, padding: '0 6px' }}>Copy</button>
      </div>
      <pre className="font-mono" style={{ fontSize: 11.5, lineHeight: 1.5, padding: '10px 12px', margin: 0, color: 'var(--foreground-muted)', background: 'var(--code-bg)', overflow: 'auto' }}>{code}</pre>
    </div>
  );
}

/* ── Skill buttons row ─────────────────────────────────────── */
function SkillButtons() {
  const skills = [
    { label: 'Execute', cmd: '/execute' },
    { label: 'Review', cmd: '/review' },
    { label: 'Check & Fix', cmd: '/check-and-fix' },
    { label: 'Commit', cmd: '/commit', highlight: true },
    { label: 'Ship', cmd: '/ship' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {skills.map(s => (
        <button key={s.label} className={`gk-btn gk-btn-sm ${s.highlight ? 'gk-btn-primary' : 'gk-btn-secondary'}`} style={{ fontSize: 11, height: 24, padding: '0 8px' }}>
          {s.label}
        </button>
      ))}
      <button className="gk-btn gk-btn-ghost gk-btn-sm" style={{ height: 24, padding: '0 6px', fontSize: 11, color: 'var(--foreground-subtle)' }}>
        More… <I.Chevron size={10} sw={2}/>
      </button>
    </div>
  );
}

/* ── Chat input area ───────────────────────────────────────── */
function ChatInput() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <SkillButtons/>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minHeight: 38, maxHeight: 120, padding: '8px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--foreground-muted)', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
          <span style={{ opacity: 0.45 }}>Message or /command…</span>
        </div>
        <button className="gk-btn gk-btn-primary" style={{ height: 38, width: 38, padding: 0, borderRadius: 8 }}>
          <I.Send size={15} sw={2}/>
        </button>
      </div>
    </div>
  );
}

/* ── Sub-agent tree node ───────────────────────────────────── */
function AgentNode({ name, model, status, tools, duration, depth = 0, children, expanded }) {
  const statusEl = status === 'running' ?
    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--status-success)', display: 'inline-block', animation: 'gk-pulse 1.8s ease-in-out infinite' }}></span> :
    status === 'completed' ? <I.Check size={11} sw={2.2} style={{ color: 'var(--status-success)' }}/> :
    <I.X size={11} sw={2.2} style={{ color: 'var(--status-danger)' }}/>;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', marginLeft: depth * 16, borderRadius: 5, cursor: 'pointer', background: expanded ? 'var(--surface-2)' : 'transparent', fontSize: 12 }}>
        {children && <I.Chevron size={10} sw={2} style={{ color: 'var(--foreground-subtle)', transform: expanded ? 'none' : 'rotate(-90deg)', transition: 'transform 120ms' }}/>}
        {!children && <span style={{ width: 10 }}></span>}
        {statusEl}
        <span style={{ fontWeight: 500, color: 'var(--foreground)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)' }}>{model}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: depth * 16 + 30, padding: '0 8px 3px', fontSize: 10.5, color: 'var(--foreground-subtle)' }}>
        <span className="font-mono">{tools} tools</span>
        <span className="font-mono">{duration}</span>
      </div>
    </div>
  );
}

/* ── Sub-agent tree panel content ──────────────────────────── */
function AgentTreeContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <AgentNode name="Main session" model="Opus 4.7" status="running" tools={45} duration="4m 12s" expanded>
        <AgentNode/>
      </AgentNode>
      <AgentNode name="Explore codebase structure" model="Sonnet" status="completed" tools={12} duration="23s" depth={1}/>
      <AgentNode name="Review error handling" model="Sonnet" status="completed" tools={8} duration="15s" depth={1} expanded>
        <AgentNode/>
      </AgentNode>
      <AgentNode name="Fetch library docs" model="Haiku" status="completed" tools={3} duration="4s" depth={2}/>
      <AgentNode name="Implement provider trait" model="Sonnet" status="running" tools={5} duration="…" depth={1}/>
      <AgentNode name="Run test suite" model="Haiku" status="failed" tools={2} duration="8s" depth={1}/>
    </div>
  );
}

/* ── Tabs ───────────────────────────────────────────────────── */
function SessionTabs({ active = 'chat' }) {
  return (
    <div className="gk-tabs">
      <button className={`gk-tab ${active === 'chat' ? 'is-active' : ''}`}>Chat</button>
      <button className={`gk-tab ${active === 'files' ? 'is-active' : ''}`}>Files</button>
      <button className={`gk-tab ${active === 'stats' ? 'is-active' : ''}`}>Stats</button>
    </div>
  );
}

/* ── Jump-to buttons ───────────────────────────────────────── */
function JumpButton({ label }) {
  return (
    <button className="gk-btn gk-btn-secondary gk-btn-sm" style={{ fontSize: 11, boxShadow: 'var(--shadow-md)', position: 'absolute', bottom: 80, right: 16, zIndex: 10 }}>
      <I.Chevron size={10} sw={2} style={{ transform: 'rotate(180deg)' }}/> {label}
    </button>
  );
}

/* ── Sample message stream content ─────────────────────────── */
function SampleStream() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SystemMsg text="Session started · Claude Code · feat/session-ui" dimmed/>

      <UserMsg text="Implement the provider trait for OpenCode. Follow the same pattern as the Claude Code provider but handle the different authentication flow." dimmed/>

      <div style={{ opacity: 0.4, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <AssistantMsg>
          I'll start by examining the existing Claude Code provider implementation to understand the pattern, then implement the OpenCode provider.
        </AssistantMsg>
        <ToolCardL1 tool="Read" detail="src/providers/claude_code.rs" outputLabel="142 lines" duration="0.3s" dimmed/>
        <ToolCardL1 tool="Read" detail="src/providers/mod.rs" outputLabel="58 lines" duration="0.2s" dimmed/>
        <ToolCardL1 tool="Grep" detail="impl Provider" outputLabel="4 files · 12 matches" duration="0.4s" dimmed/>
        <AssistantMsg>
          I can see the pattern. The provider trait requires implementing <code style={{ fontSize: 12, padding: '1px 5px', background: 'var(--code-bg)', borderRadius: 4, border: '1px solid var(--border)' }}>spawn()</code>, <code style={{ fontSize: 12, padding: '1px 5px', background: 'var(--code-bg)', borderRadius: 4, border: '1px solid var(--border)' }}>send_message()</code>, and <code style={{ fontSize: 12, padding: '1px 5px', background: 'var(--code-bg)', borderRadius: 4, border: '1px solid var(--border)' }}>handle_tool_result()</code>. Let me create the OpenCode provider module.
        </AssistantMsg>
        <ToolCardL1 tool="Write" detail="src/providers/opencode.rs" outputLabel="created" duration="1.2s" dimmed/>
        <ToolCardL1 tool="Edit" detail="src/providers/mod.rs" outputLabel="+4 −0" duration="0.5s" dimmed/>
        <ToolGroup count={6}/>
      </div>

      <UserMsg text="Good. Now run the tests to make sure the new provider compiles and the existing tests still pass."/>

      <AssistantMsg streaming>
        I'll run the test suite to verify everything compiles correctly and no existing tests are broken.
      </AssistantMsg>

      <ToolCardL2 tool="Bash" detail="$ cargo test --workspace" outputLabel="running…" duration="2.1s" status="running"
        content={`   Compiling grovekeeper v0.8.0
   Compiling grovekeeper-providers v0.8.0
     Running unittests src/lib.rs
running 24 tests...
test providers::claude_code::tests::test_spawn ... ok
test providers::claude_code::tests::test_auth ... ok
test providers::opencode::tests::test_spawn ... ok
test providers::opencode::tests::test_auth_flow ...`}
      />

      <ToolCardL3 tool="Bash" detail={`$ rm -rf target/debug/build/grovekeeper-*\n$ cargo build --release`}/>
    </div>
  );
}

/* Export all */
Object.assign(window, {
  TOOL_ICONS, SessionBadge, CtxBar, ProviderIcon, MetaField, PermModeSelect, ModelSelect,
  QuotaBars, ToolCardL1, ToolCardL2, ToolCardL3, ToolGroup, UserMsg, AssistantMsg, SystemMsg,
  CodeBlock, SkillButtons, ChatInput, AgentNode, AgentTreeContent, SessionTabs, JumpButton,
  SampleStream,
});
