/* global React, Tree, I, IssueCard, AppShell, TopBar */

// =====================================================================
// LIGHT MODE — buttons/cards taste + a full dashboard screen
// =====================================================================

function LightButtonsCardsArtboard() {
  return (
    <div className="gk-root theme-light" style={{ padding: 32, height: '100%', background: 'var(--background)', overflow: 'auto' }}>
      <div className="gk-eyebrow" style={{ marginBottom: 4 }}>Light mode · taste</div>
      <div className="gk-h2" style={{ marginBottom: 20 }}>Buttons & cards</div>

      <div className="gk-eyebrow" style={{ marginBottom: 8 }}>Buttons</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <button className="gk-btn gk-btn-primary"><I.Plus size={13} /> Plant tree</button>
        <button className="gk-btn gk-btn-secondary">Cancel</button>
        <button className="gk-btn gk-btn-ghost">Skip</button>
        <button className="gk-btn gk-btn-danger"><I.Trash size={13} /> Delete</button>
        <button className="gk-btn gk-btn-success"><I.Check size={13} /> Saved</button>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
        <button className="gk-btn gk-btn-primary" data-state="hover">Hover</button>
        <button className="gk-btn gk-btn-primary" data-state="active">Pressed</button>
        <button className="gk-btn gk-btn-primary" data-state="focus">Focus</button>
        <button className="gk-btn gk-btn-primary" disabled>Disabled</button>
        <button className="gk-btn gk-btn-primary" data-state="loading">Loading</button>
      </div>

      <div className="gk-eyebrow" style={{ marginBottom: 8 }}>Inputs</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 22, maxWidth: 760 }}>
        <input className="gk-input" defaultValue="feat/forest-view" />
        <input className="gk-input" data-state="focus" defaultValue="feat/forest-view" />
        <input className="gk-input" data-state="error" defaultValue="bad name with spaces" />
      </div>

      <div className="gk-eyebrow" style={{ marginBottom: 8 }}>Issue cards</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <LightCard state="default" />
        <LightCard state="hover" />
        <LightCard state="selected" />
        <LightCard state="error" tone="danger" status="branch missing" />
      </div>
    </div>
  );
}

function LightCard({ state, tone, status }) {
  const stateAttr = state === 'default' ? undefined : state;
  return (
    <div className="gk-card" data-state={stateAttr} style={{ padding: 14, display: 'grid', gridTemplateColumns: '92px 1fr', gap: 12, alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 92, width: 92, background: 'linear-gradient(180deg, color-mix(in oklch, var(--surface-2) 80%, transparent), transparent)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ transform: 'translateY(20px)' }}>
          <Tree stage={tone === 'danger' ? 'dead' : 'fruiting'} shape="maple" fruitCount={2} fruitType="apple" size={92} seed={5} showGround={false} />
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="gk-h3" style={{ fontSize: 13.5 }}>Add forest view overlays</div>
        <div className="font-mono gk-tiny" style={{ margin: '3px 0 8px' }}>#118 · feat/forest-overlays</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <span className={'gk-badge ' + (tone === 'danger' ? 'gk-badge-danger' : 'gk-badge-info')}>{status || 'PR draft · 2 commits'}</span>
          <span className="gk-badge">feature</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Full dashboard screen, light mode ----------
function LightDashboardArtboard() {
  const issues = [
    { stage: 'growing',  title: 'Build kanban drag-and-drop',    issue: '#128', branch: 'feat/kanban-dnd',      status: { tone: 'moss', text: 'session running', pulse: true }, labels: ['feature'] },
    { stage: 'fruiting', title: 'Add forest view overlays',      issue: '#118', branch: 'feat/forest-overlays', status: { tone: 'info', text: 'PR draft · 2 commits' }, labels: ['feature'], fruitCount: 2 },
    { stage: 'flowering',title: 'Provider trait expansion',      issue: '#091', branch: 'feat/provider-trait',  status: { tone: 'amber', text: 'approved · ready' }, labels: ['feature'], glow: true },
    { stage: 'seasonal', title: 'Fix cost calc for cache hits',  issue: '#103', branch: 'fix/cost-cache',       status: { tone: 'warning', text: 'changes requested' }, labels: ['bug'], season: 'autumn' },
    { stage: 'sapling',  title: 'Add Czech translation file',    issue: '#136', branch: 'i18n/cs',              status: { tone: 'idle', text: 'ready · no session' }, labels: ['i18n'] },
    { stage: 'bare',     title: 'Bundle Tauri icons',            issue: '#077', branch: 'chore/icons',          status: { tone: 'success', text: 'merged' }, labels: ['chore'] },
  ];

  return (
    <AppShell active="issues" theme="theme-light">
      <TopBar title="Issues" sub="grovekeeper · dev · 6 issues · 2 active" view="list"
        controls={['search','filter','sort','sync','notif','view','plant']} />
      <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, overflow: 'auto' }}>
        {issues.map((c, i) => <IssueCard key={i} {...c} seed={i + 4} />)}
      </div>
    </AppShell>
  );
}

window.LightButtonsCardsArtboard = LightButtonsCardsArtboard;
window.LightDashboardArtboard = LightDashboardArtboard;
