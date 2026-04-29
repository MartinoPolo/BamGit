/* global React, Tree, I, AppShell, TopBar */
const { useState } = React;

// ---------- FOREST VIEW (revised) ----------
function ForestArtboard() {
  const [legendOpen, setLegendOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState('chat'); // chat | deps | activity
  const [topPct, setTopPct] = useState(60);

  const trees = [
    { stage: 'growing',   shape: 'oak',    title: '#128 kanban dnd',     overlay: { kind: 'session', text: 'Claude · 2m 14s' } },
    { stage: 'fruiting',  shape: 'maple',  title: '#118 forest overlays', fruitCount: 2, overlay: { kind: 'pr', text: 'PR draft #44' } },
    { stage: 'flowering', shape: 'oak',    title: '#091 provider trait', glow: true, overlay: { kind: 'pr', text: 'PR approved' } },
    { stage: 'seasonal',  shape: 'maple',  title: '#103 cost calc',     season: 'autumn', overlay: { kind: 'warn', text: 'changes requested' } },
    { stage: 'sapling',   shape: 'birch',  title: '#136 cs translations' },
    { stage: 'leafy',     shape: 'oak',    title: '#114 stream parser', overlay: { kind: 'commits', text: '3 ahead' } },
    { stage: 'fruiting',  shape: 'baobab', title: '#099 SQLite migrations', fruitCount: 4 },
    { stage: 'dead',      shape: 'maple',  title: '#066 deprecated polling', overlay: { kind: 'error', text: 'branch deleted' } },
    { stage: 'sapling',   shape: 'oak',    title: '#140 i18n loader' },
    { stage: 'growing',   shape: 'fir',    title: '#131 worktree cleanup', evergreen: true, season: 'winter', overlay: { kind: 'session', text: 'Codex · running' } },
  ];

  return (
    <AppShell active="forest">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative' }}>
        {/* Top: forest scene */}
        <div style={{ position: 'relative', flexBasis: `${topPct}%`, minHeight: 200, overflow: 'hidden', background: 'linear-gradient(180deg, oklch(0.28 0.030 235) 0%, oklch(0.22 0.030 200) 45%, oklch(0.20 0.035 150) 70%)' }}>
          <TopBar
            title="10 trees · 3 active sessions"
            sub="grovekeeper · refreshed 12s ago"
            view="forest"
            transparent
            controls={['search','filter','sync','legend','notif','view','plant']}
            onLegend={() => setLegendOpen(o => !o)}
            legendOpen={legendOpen}
          />

          {/* Distant hills */}
          <svg viewBox="0 0 1200 240" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 80, left: 0, right: 0, width: '100%', height: 200, opacity: 0.55, pointerEvents: 'none' }}>
            <path d="M0,180 Q150,120 300,160 T600,140 T900,170 T1200,150 L1200,240 L0,240 Z" fill="oklch(0.22 0.025 160)" />
            <path d="M0,200 Q200,150 400,180 T800,170 T1200,190 L1200,240 L0,240 Z" fill="oklch(0.18 0.022 155)" />
          </svg>

          {/* Ground */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, background: 'linear-gradient(180deg, oklch(0.22 0.04 150) 0%, oklch(0.16 0.035 150) 100%)' }} />

          {/* Trees scatter */}
          <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', padding: '0 24px' }}>
            {trees.map((t, i) => <ForestTree key={i} {...t} seed={i + 5} index={i} />)}
          </div>

          {/* Legend popover */}
          {legendOpen && <LegendPopover onClose={() => setLegendOpen(false)} />}
        </div>

        {/* Resizer */}
        <div
          className="gk-resizer"
          title="Drag to resize"
          onMouseDown={(e) => {
            e.preventDefault();
            const startY = e.clientY;
            const startPct = topPct;
            const total = e.currentTarget.parentElement.getBoundingClientRect().height;
            const move = (ev) => {
              const dy = ev.clientY - startY;
              const next = Math.max(20, Math.min(80, startPct + (dy / total) * 100));
              setTopPct(next);
            };
            const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
          }}
        />

        {/* Bottom panel */}
        <div style={{ flex: 1, minHeight: 120, background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="gk-tabs">
              <button className={'gk-tab ' + (bottomTab === 'chat' ? 'is-active' : '')} onClick={() => setBottomTab('chat')}><I.Code size={11} /> Active session</button>
              <button className={'gk-tab ' + (bottomTab === 'deps' ? 'is-active' : '')} onClick={() => setBottomTab('deps')}><I.GitMerge size={11} /> Dependencies</button>
              <button className={'gk-tab ' + (bottomTab === 'activity' ? 'is-active' : '')} onClick={() => setBottomTab('activity')}><I.Activity size={11} /> Activity</button>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button className="gk-btn gk-btn-ghost gk-btn-icon gk-btn-sm" title="Add panel"><I.Plus size={12} /></button>
              <button className="gk-btn gk-btn-ghost gk-btn-icon gk-btn-sm" title="Layout options"><I.More size={12} /></button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
            {bottomTab === 'chat' && <BottomChat />}
            {bottomTab === 'deps' && <BottomDeps />}
            {bottomTab === 'activity' && <BottomActivity />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function LegendPopover({ onClose }) {
  return (
    <div className="gk-popover" style={{ position: 'absolute', top: 56, right: 86, zIndex: 10, width: 280, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="gk-eyebrow">Tree state legend</div>
        <button className="gk-btn gk-btn-ghost gk-btn-icon gk-btn-sm" onClick={onClose}><I.X size={11} /></button>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {[
          { c: 'var(--moss-400)', t: 'Growing — session active' },
          { c: 'var(--amber-400)', t: 'Fruiting — PR open' },
          { c: '#e8a8c0', t: 'Flowering — PR approved' },
          { c: '#e8a64a', t: 'Seasonal — review needed' },
          { c: 'var(--foreground-muted)', t: 'Bare — merged' },
          { c: '#6c5d4e', t: 'Dead — branch gone' },
        ].map(r => (
          <div key={r.t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: r.c }} />
            <span className="gk-tiny" style={{ color: 'var(--foreground)' }}>{r.t}</span>
          </div>
        ))}
      </div>
      <div className="gk-popover-divider" />
      <div className="gk-tiny" style={{ color: 'var(--foreground-subtle)' }}>Bubble icons above trees signal session, PR, errors, and commits.</div>
    </div>
  );
}

function ForestTree({ stage, shape, season = 'summer', fruitCount = 0, glow, evergreen, overlay, title, seed, index }) {
  const lift = (index % 3) * 6;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transform: `translateY(${-lift}px)`, position: 'relative', width: 110 }}>
      <div style={{ position: 'relative', width: 110, height: 130, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
        {/* tag is positioned absolutely, horizontally centered within the same wrapper as the tree */}
        {overlay && <ForestOverlay {...overlay} />}
        <Tree stage={stage} shape={shape} season={season} fruitCount={fruitCount} fruitType="apple" seed={seed} size={120} glow={glow} evergreen={evergreen} />
      </div>
      <div className="gk-tiny font-mono" style={{ color: 'var(--foreground-muted)', textAlign: 'center', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title}
      </div>
    </div>
  );
}

function ForestOverlay({ kind, text }) {
  const styles = {
    session: { bg: 'color-mix(in oklch, var(--moss-500) 80%, transparent)', fg: '#fff', icon: <I.Drop size={10} /> },
    pr:      { bg: 'color-mix(in oklch, var(--status-info) 80%, transparent)', fg: '#fff', icon: <I.GitPull size={10} /> },
    warn:    { bg: 'color-mix(in oklch, var(--status-warning) 85%, transparent)', fg: '#1a1408', icon: <I.AlertTriangle size={10} /> },
    error:   { bg: 'color-mix(in oklch, var(--status-danger) 85%, transparent)', fg: '#fff', icon: <I.X size={10} /> },
    commits: { bg: 'color-mix(in oklch, var(--surface) 90%, transparent)', fg: 'var(--foreground)', icon: <I.GitCommit size={10} /> },
  }[kind];
  return (
    <div className="gk-bob" style={{
      position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
      background: styles.bg, color: styles.fg, padding: '3px 7px', borderRadius: 999,
      fontSize: 10.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4,
      backdropFilter: 'blur(6px)', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)',
      zIndex: 2,
    }}>
      {styles.icon} {text}
    </div>
  );
}

function BottomChat() {
  return (
    <div style={{ display: 'grid', gap: 10, maxWidth: 760 }}>
      <div className="gk-eyebrow" style={{ color: 'var(--primary)' }}>#128 — Build kanban drag-and-drop · Claude · running</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--moss-700)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>C</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--foreground)' }}>Wired the DragDropContext and onDragEnd handler. Tested manually — cards move between columns. Want me to add persistence to localStorage next, or wait on the API?</div>
      </div>
      <div style={{ position: 'relative', maxWidth: 560 }}>
        <textarea className="gk-textarea" rows={2} placeholder="Reply to the agent…" style={{ paddingRight: 80 }} defaultValue=""/>
        <button className="gk-btn gk-btn-primary gk-btn-sm" style={{ position: 'absolute', bottom: 8, right: 8 }}><I.Send size={11} /> Send</button>
      </div>
    </div>
  );
}

function BottomDeps() {
  return (
    <div>
      <div className="gk-eyebrow" style={{ marginBottom: 10 }}>Blocking dependencies — top to bottom</div>
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', overflow: 'auto' }}>
        <DepNode title="#091 provider trait" status="approved" stage="flowering" seed={3} />
        <I.ArrowRight size={14} style={{ marginTop: 24, color: 'var(--foreground-subtle)' }} />
        <div style={{ display: 'grid', gap: 10 }}>
          <DepNode title="#118 forest overlays" status="PR draft" stage="fruiting" seed={4} />
          <DepNode title="#128 kanban dnd" status="running" stage="growing" seed={5} />
        </div>
        <I.ArrowRight size={14} style={{ marginTop: 24, color: 'var(--foreground-subtle)' }} />
        <DepNode title="#142 usage dashboard" status="blocked" stage="seed" seed={6} />
      </div>
    </div>
  );
}

function DepNode({ title, status, stage, seed }) {
  return (
    <div className="gk-card" style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
      <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Tree stage={stage} shape="oak" size={36} seed={seed} showGround={false} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        <div className="gk-tiny" style={{ color: 'var(--foreground-subtle)' }}>{status}</div>
      </div>
    </div>
  );
}

function BottomActivity() {
  const events = [
    { t: '12s', text: '#128 Claude pushed 1 commit to feat/kanban-dnd' },
    { t: '1m',  text: '#118 PR draft updated · 2 file changes' },
    { t: '4m',  text: '#091 PR #38 approved by @reviewer' },
    { t: '12m', text: '#103 GitHub: changes requested on PR #29' },
    { t: '1h',  text: '#066 Branch deleted upstream' },
  ];
  return (
    <div style={{ display: 'grid', gap: 6, maxWidth: 700 }}>
      {events.map((e, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, fontSize: 12, padding: '4px 0', borderBottom: '1px dashed var(--border)' }}>
          <span className="font-mono gk-tiny" style={{ width: 32, color: 'var(--foreground-subtle)' }}>{e.t}</span>
          <span>{e.text}</span>
        </div>
      ))}
    </div>
  );
}

window.ForestArtboard = ForestArtboard;
