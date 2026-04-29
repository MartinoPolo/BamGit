/* global React, Tree, I, IssueCard */
const { useState } = React;

// ---------- APP SHELL ----------
function AppShell({ active = 'forest', children, theme = 'theme-dark', defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div className={'gk-root ' + theme} style={{ display: 'grid', gridTemplateColumns: (collapsed ? '56px' : '220px') + ' 1fr', height: '100%', background: 'var(--background)', overflow: 'hidden' }}>
      <Sidebar active={active} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div style={{ overflow: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

function Sidebar({ active, collapsed, onToggle }) {
  const items = [
    { id: 'forest', icon: <I.Trees size={14} />, label: 'Forest' },
    { id: 'issues', icon: <I.List size={14} />, label: 'Issues' },
    { id: 'kanban', icon: <I.Kanban size={14} />, label: 'Kanban' },
    { id: 'session', icon: <I.Code size={14} />, label: 'Session' },
    { id: 'usage',  icon: <I.Activity size={14} />, label: 'Usage' },
    { id: 'settings', icon: <I.Settings size={14} />, label: 'Settings' },
  ];

  return (
    <div className="sb-root" style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)', padding: collapsed ? '14px 8px' : 14, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="sb-brand-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, padding: collapsed ? 0 : '4px 6px 4px 6px', justifyContent: collapsed ? 'center' : 'space-between', position: 'relative', minHeight: 28 }}>
        {collapsed ? (
          <button onClick={onToggle} title="Expand sidebar (⌘\)" aria-label="Expand sidebar" className="sb-brand-collapsed" style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, position: 'relative' }}>
            <span className="sb-brand-mark"><BrandMark size={22} /></span>
            <span className="sb-brand-chev" style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', inset: 0, color: 'var(--foreground)', opacity: 0, transition: 'opacity 120ms', background: 'var(--surface-2)', borderRadius: 8 }}>
              <I.ChevronRight size={14} />
            </span>
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <BrandMark size={22} />
              <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Grovekeeper</div>
            </div>
            <button onClick={onToggle} title="Collapse sidebar (⌘\)" aria-label="Collapse sidebar" className="sb-collapse-btn" style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'transparent', color: 'var(--foreground-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
              <I.PanelLeft size={14} />
            </button>
          </>
        )}
      </div>

      {!collapsed && <div className="gk-eyebrow" style={{ padding: '0 6px', marginBottom: 6 }}>Workspace</div>}
      {collapsed ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <button title="grovekeeper" style={collapsedItemStyle(false)}>
            <I.Folder size={14} style={{ color: 'var(--primary)' }} />
          </button>
        </div>
      ) : (
        <div style={{ padding: '6px 8px', borderRadius: 6, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <I.Folder size={13} style={{ color: 'var(--primary)' }} />
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>grovekeeper</div>
          <I.Chevron size={12} style={{ marginLeft: 'auto', color: 'var(--foreground-subtle)' }} />
        </div>
      )}

      {!collapsed && <div className="gk-eyebrow" style={{ padding: '0 6px', marginBottom: 6 }}>Navigate</div>}
      <nav style={{ display: 'grid', gap: collapsed ? 4 : 1 }}>
        {items.map(it => (
          collapsed ? (
            <div key={it.id} style={{ display: 'flex', justifyContent: 'center' }}>
              <button title={it.label} className={active === it.id ? 'is-active' : ''} style={collapsedItemStyle(active === it.id)}>
                {React.cloneElement(it.icon, { size: 15 })}
              </button>
            </div>
          ) : (
            <button key={it.id} className={'sb-item ' + (active === it.id ? 'is-active' : '')} style={sbItemStyle(active === it.id)}>
              {it.icon} <span>{it.label}</span>
            </button>
          )
        ))}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        {collapsed ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div title="MartinoPolo · 4 active" style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--moss-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600, position: 'relative' }}>
              MP
              <span style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: 999, background: 'var(--moss-400)', border: '2px solid var(--sidebar-bg)' }} />
            </div>
          </div>
        ) : (
          <div className="gk-card" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 26, height: 26, borderRadius: 999, background: 'var(--moss-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600 }}>MP</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>MartinoPolo</div>
              <div className="gk-tiny" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>4 active</div>
            </div>
            <I.ChevronUp size={13} style={{ color: 'var(--foreground-subtle)' }} />
          </div>
        )}
      </div>
    </div>
  );
}

function collapsedItemStyle(active) {
  return {
    width: 36, height: 36, borderRadius: 8,
    border: 'none',
    background: active ? 'var(--surface-2)' : 'transparent',
    color: active ? 'var(--primary)' : 'var(--sidebar-fg)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  };
}

function sbItemStyle(active) {
  return {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '6px 8px',
    border: 'none', background: active ? 'var(--surface-2)' : 'transparent',
    color: active ? 'var(--foreground)' : 'var(--sidebar-fg)',
    fontSize: 12.5, fontWeight: active ? 500 : 400,
    fontFamily: 'inherit', cursor: 'pointer', borderRadius: 6,
    textAlign: 'left',
  };
}

function BrandMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="19" fill="var(--moss-700)" />
      <g transform="translate(20 26)">
        <rect x="-1.5" y="-4" width="3" height="6" fill="#7a4f2c" />
        <polygon points="0,-18 -8,-4 8,-4" fill="var(--moss-300)" />
        <polygon points="0,-18 0,-4 8,-4" fill="var(--moss-500)" />
        <polygon points="0,-14 -10,-2 10,-2" fill="var(--moss-300)" />
        <polygon points="0,-14 0,-2 10,-2" fill="var(--moss-500)" />
      </g>
    </svg>
  );
}

// ---------- UNIFIED TOP BAR ----------
// Available controls: search, filter, sort, sync, legend, notif, view (List/Kanban/Forest), plant
// Pass `controls` array to choose which appear, in this order: left-of-view, view, right-of-view.
// `onLegend` toggles legend popover (forest); `transparent` sets glass styling for forest.
function TopBar({ title, sub, view = null, controls = ['search','filter','sort','sync','legend','notif','view','plant'], onLegend, legendOpen, transparent = false, children }) {
  const has = (k) => controls.includes(k);
  const glass = transparent ? { background: 'color-mix(in oklch, var(--surface) 60%, transparent)', backdropFilter: 'blur(8px)' } : {};
  const wrap = transparent
    ? { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }
    : { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)', gap: 12 };

  return (
    <div style={wrap}>
      <div style={{ minWidth: 0 }}>
        {transparent && <div className="gk-eyebrow" style={{ marginBottom: 2 }}>The Grove</div>}
        <div className="gk-h1" style={{ fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {sub && <div className="gk-tiny font-mono" style={{ marginTop: 2 }}>{sub}</div>}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        {has('search') && (
          <div style={{ position: 'relative', width: 200 }}>
            <I.Search size={12} style={{ position: 'absolute', left: 9, top: 9, color: 'var(--foreground-subtle)', pointerEvents: 'none' }} />
            <input className="gk-input" style={{ paddingLeft: 28, height: 30, fontSize: 12.5, ...glass }} placeholder="Search…" />
            <span className="gk-kbd" style={{ position: 'absolute', right: 6, top: 6, height: 18 }}>⌘K</span>
          </div>
        )}
        {has('filter') && <button className="gk-btn gk-btn-secondary gk-btn-sm" style={glass} title="Filter"><I.Filter size={12} /> Filter</button>}
        {has('sort') && <button className="gk-btn gk-btn-secondary gk-btn-sm" style={glass} title="Sort"><I.Layers size={12} /> Sort</button>}
        {has('sync') && <button className="gk-btn gk-btn-secondary gk-btn-sm gk-btn-icon" style={glass} title="Sync · 12s ago"><I.Refresh size={13} /></button>}
        {has('legend') && (
          <button className={'gk-btn gk-btn-secondary gk-btn-sm gk-btn-icon ' + (legendOpen ? 'is-active' : '')} style={glass} title="Legend" onClick={onLegend}>
            <I.Sparkles size={13} />
          </button>
        )}
        {has('notif') && (
          <button className="gk-btn gk-btn-secondary gk-btn-sm gk-btn-icon" style={{ ...glass, position: 'relative' }} title="Notifications">
            <I.Bell size={13} />
            <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 999, background: 'var(--accent)' }} />
          </button>
        )}

        {has('view') && (
          <div className="gk-tabs" style={glass}>
            <button className={'gk-tab ' + (view === 'list' ? 'is-active' : '')} title="List"><I.List size={11} /> List</button>
            <button className={'gk-tab ' + (view === 'kanban' ? 'is-active' : '')} title="Kanban"><I.Kanban size={11} /> Kanban</button>
            <button className={'gk-tab ' + (view === 'forest' ? 'is-active' : '')} title="Forest"><I.Trees size={11} /> Forest</button>
          </div>
        )}

        {has('plant') && (
          <button className="gk-btn gk-btn-primary gk-btn-sm" title="Plant a tree"><I.Plus size={12} /> Plant</button>
        )}

        {children}
      </div>
    </div>
  );
}

// ---------- ISSUE DASHBOARD (List view) ----------
function DashboardArtboard() {
  const issues = [
    { stage: 'growing',  title: 'Build kanban drag-and-drop',    issue: '#128', branch: 'feat/kanban-dnd',      status: { tone: 'moss', text: 'session running', pulse: true }, labels: ['feature'] },
    { stage: 'fruiting', title: 'Add forest view overlays',      issue: '#118', branch: 'feat/forest-overlays', status: { tone: 'info', text: 'PR draft' }, labels: ['feature'], fruitCount: 2 },
    { stage: 'seasonal', title: 'Fix cost calc for cache hits',  issue: '#103', branch: 'fix/cost-cache',       status: { tone: 'warning', text: 'changes requested' }, labels: ['bug'], season: 'autumn' },
    { stage: 'flowering',title: 'Provider trait expansion',      issue: '#091', branch: 'feat/provider-trait',  status: { tone: 'amber', text: 'approved' }, labels: ['feature'], glow: true },
    { stage: 'sapling',  title: 'Add Czech translation file',    issue: '#136', branch: 'i18n/cs',              status: { tone: 'idle', text: 'ready' }, labels: ['i18n'] },
    { stage: 'leafy',    title: 'Wire stream-JSON parser',       issue: '#114', branch: 'feat/stream-parser',   status: { tone: 'success', text: '3 commits ahead' }, labels: ['feature'] },
    { stage: 'bare',     title: 'Bundle Tauri icons',            issue: '#077', branch: 'chore/icons',          status: { tone: 'success', text: 'merged' }, labels: ['chore'] },
    { stage: 'seed',     title: 'Add usage tracking dashboard',  issue: '#142', branch: null,                   status: { tone: 'idle', text: 'no worktree' }, labels: ['feature'] },
  ];

  return (
    <AppShell active="issues">
      <TopBar title="Issues" sub="grovekeeper · dev · 8 issues · 4 active" view="list"
        controls={['search','filter','sort','sync','notif','view','plant']} />

      <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {issues.map((c, i) => <IssueCard key={i} {...c} seed={i + 4} />)}
      </div>
    </AppShell>
  );
}

// ---------- KANBAN ----------
function KanbanArtboard() {
  const columns = [
    { id: 'backlog',  title: 'Backlog',     count: 6, accent: 'var(--foreground-subtle)', items: [
      { stage: 'seed', title: 'Add usage tracking dashboard', issue: '#142', status: { tone: 'idle', text: 'no worktree' } },
      { stage: 'seed', title: 'Embed xterm.js in session pane', issue: '#143', status: { tone: 'idle', text: 'no worktree' } },
    ]},
    { id: 'doing',    title: 'In progress', count: 3, accent: 'var(--primary)', items: [
      { stage: 'sapling', title: 'Czech translation file', issue: '#136', branch: 'i18n/cs', status: { tone: 'idle', text: 'ready' } },
      { stage: 'growing', title: 'Build kanban drag-and-drop', issue: '#128', branch: 'feat/kanban-dnd', status: { tone: 'moss', text: 'session running', pulse: true } },
    ]},
    { id: 'review',   title: 'In review',   count: 2, accent: 'var(--accent)', items: [
      { stage: 'fruiting', title: 'Add forest view overlays', issue: '#118', branch: 'feat/forest-overlays', status: { tone: 'info', text: 'PR draft' }, fruitCount: 2 },
      { stage: 'seasonal', title: 'Fix cost calc cache', issue: '#103', branch: 'fix/cost-cache', status: { tone: 'warning', text: 'changes requested' }, season: 'autumn' },
    ]},
    { id: 'ready',    title: 'Ready',       count: 1, accent: 'var(--status-success)', items: [
      { stage: 'flowering', title: 'Provider trait expansion', issue: '#091', branch: 'feat/provider-trait', status: { tone: 'amber', text: 'approved' }, glow: true },
    ]},
    { id: 'done',     title: 'Done',        count: 4, accent: 'var(--foreground-muted)', items: [
      { stage: 'bare', title: 'Bundle Tauri icons', issue: '#077', branch: 'chore/icons', status: { tone: 'success', text: 'merged' } },
    ]},
  ];

  return (
    <AppShell active="kanban">
      <TopBar title="Kanban" sub="grovekeeper · 5 lanes" view="kanban"
        controls={['search','filter','sync','notif','view','plant']} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(220px, 1fr))', gap: 12, padding: 18, height: 'calc(100% - 60px)' }}>
        {columns.map(col => (
          <div key={col.id} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '0 4px' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: col.accent }} />
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{col.title}</div>
              <div className="gk-tiny font-mono">{col.count}</div>
              <I.Plus size={12} style={{ marginLeft: 'auto', color: 'var(--foreground-subtle)', cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'grid', gap: 8, padding: 4, borderRadius: 8, background: 'color-mix(in oklch, var(--surface-2) 50%, transparent)', overflow: 'auto', flex: 1 }}>
              {col.items.map((it, i) => <KanbanCard key={i} {...it} seed={i + col.id.length * 5} />)}
              <button style={{ padding: 8, fontSize: 12, color: 'var(--foreground-subtle)', background: 'transparent', border: '1px dashed var(--border)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Add issue
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function KanbanCard({ stage, title, issue, branch, status, fruitCount = 0, season = 'summer', glow, seed }) {
  const toneCls = {
    idle: 'gk-badge', info: 'gk-badge gk-badge-info', moss: 'gk-badge gk-badge-moss',
    success: 'gk-badge gk-badge-success', warning: 'gk-badge gk-badge-warning',
    danger: 'gk-badge gk-badge-danger', amber: 'gk-badge gk-badge-amber',
  }[status.tone];
  return (
    <div className="gk-card" style={{ padding: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {/* FIX: tree centered + sized so canopy is visible. Use 64px tree in a 64px box. */}
        <div style={{ width: 56, height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in oklch, var(--surface-2) 50%, transparent)', borderRadius: 6 }}>
          <Tree stage={stage} shape={['oak','maple','birch'][seed % 3]} season={season} fruitCount={fruitCount} fruitType="apple" size={56} seed={seed} glow={glow} showGround={false} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          <div className="font-mono gk-tiny">{issue}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <span className={toneCls}>{status.pulse && <span className="gk-badge-dot gk-pulse" />}{status.text}</span>
        {branch && <span className="gk-badge gk-badge-mono"><I.GitBranch size={9} /> {branch.split('/').pop()}</span>}
      </div>
    </div>
  );
}

window.AppShell = AppShell;
window.TopBar = TopBar;
window.BrandMark = BrandMark;
window.DashboardArtboard = DashboardArtboard;
window.KanbanArtboard = KanbanArtboard;
