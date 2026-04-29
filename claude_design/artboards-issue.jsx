/* global React, Tree, I */

// ---------- TREE LEGEND ----------
function LegendArtboard() {
  const stages = [
    { stage: 'seed',       label: 'Seed',       desc: 'Issue exists. No worktree, no branch.', dims: 'no labels · no worktree' },
    { stage: 'sprouting',  label: 'Sprouting',  desc: 'Worktree being set up.',                dims: 'worktree: pending' },
    { stage: 'sapling',    label: 'Sapling',    desc: 'Worktree active, no session yet.',      dims: 'worktree: active · session: none' },
    { stage: 'growing',    label: 'Growing',    desc: 'Session running.',                      dims: 'session: running 💧' },
    { stage: 'leafy',      label: 'Leafy',      desc: 'Session finished, commits on branch.',  dims: 'commits: yes · session: done' },
    { stage: 'fruiting',   label: 'Fruiting',   desc: 'PR open or draft. Fruit = sessions.',   dims: 'PR: open / draft' },
    { stage: 'flowering',  label: 'Flowering',  desc: 'PR approved. Glows.',                   dims: 'PR: approved ✨' },
    { stage: 'seasonal',   label: 'Seasonal',   desc: 'PR awaiting / changes requested.',      dims: 'PR: review / changes', season: 'autumn' },
    { stage: 'bare',       label: 'Bare',       desc: 'PR merged, issue closed.',              dims: 'PR: merged · issue: closed' },
    { stage: 'dead',       label: 'Dead',       desc: 'Branch deleted upstream.',              dims: 'branch: deleted' },
    { stage: 'stump',      label: 'Stump',      desc: 'Worktree removed, archived.',           dims: 'worktree: removed' },
  ];

  const tools = [
    { name: 'Watering can', when: 'session running / paused', file: 'assets/tools/watering-can.svg' },
    { name: 'Storm cloud',  when: 'session errored / worktree failed', file: null, glyph: '⛈' },
    { name: 'Speech bubble',when: 'agent needs input', file: null, glyph: '💬' },
    { name: 'Woodpecker',   when: 'PR review requested / changes', file: 'assets/tools/woodpecker.svg' },
  ];

  return (
    <div className="gk-root theme-dark" style={{ padding: 40, height: '100%', background: 'var(--background)', overflow: 'auto' }}>
      <div className="gk-eyebrow" style={{ marginBottom: 6 }}>Tree state legend</div>
      <div className="gk-h1" style={{ fontSize: 24, marginBottom: 6 }}>Issue / PR / worktree → tree stage</div>
      <div className="gk-small" style={{ marginBottom: 24, maxWidth: 640 }}>
        Source of truth is <span className="font-mono">compute_tree_visualization.ts</span>. Stages cascade — first matching rule wins.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
        {stages.map((s, i) => (
          <div key={s.stage} className="gk-card gk-card-padded" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
            <Tree
              stage={s.stage}
              shape={['oak', 'maple', 'birch', 'baobab'][i % 4]}
              season={s.season || 'summer'}
              fruitCount={s.stage === 'fruiting' ? 3 : 0}
              fruitType="apple"
              seed={i + 12}
              size={120}
              glow={s.stage === 'flowering'}
            />
            <div className="gk-h3" style={{ fontSize: 13 }}>{s.label}</div>
            <div className="gk-small" style={{ fontSize: 11.5, lineHeight: 1.45 }}>{s.desc}</div>
            <div className="font-mono gk-tiny" style={{ marginTop: 'auto', color: 'var(--foreground-subtle)' }}>{s.dims}</div>
          </div>
        ))}
      </div>

      <div className="gk-eyebrow" style={{ marginBottom: 10 }}>Tools — accessories that appear on trees</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {tools.map(t => (
          <div key={t.name} className="gk-card gk-card-padded" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              {t.file ? <img src={t.file} style={{ width: 32, height: 32, objectFit: 'contain' }} alt="" /> : <span>{t.glyph}</span>}
            </div>
            <div>
              <div className="gk-h3" style={{ fontSize: 13 }}>{t.name}</div>
              <div className="gk-tiny">{t.when}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- ISSUE CARD STATES ----------
function IssueCardArtboard() {
  const cards = [
    { stage: 'seed',     title: 'Add usage tracking dashboard', issue: '#142', branch: null, status: { tone: 'idle', text: 'no worktree' }, labels: ['feature'] },
    { stage: 'sprouting',title: 'Refactor session state machine', issue: '#139', branch: 'refactor/session-fsm', status: { tone: 'info', text: 'setting up worktree…' }, labels: ['refactor'] },
    { stage: 'sapling',  title: 'Add Czech translation file',    issue: '#136', branch: 'i18n/cs',              status: { tone: 'idle', text: 'ready · no session' }, labels: ['i18n'] },
    { stage: 'growing',  title: 'Build kanban drag-and-drop',    issue: '#128', branch: 'feat/kanban-dnd',      status: { tone: 'moss', text: 'session running', pulse: true }, labels: ['feature'] },
    { stage: 'fruiting', title: 'Add forest view overlays',      issue: '#118', branch: 'feat/forest-overlays', status: { tone: 'info', text: 'PR draft · 2 commits' }, labels: ['feature'], fruitCount: 2 },
    { stage: 'seasonal', title: 'Fix cost calc for cache hits',  issue: '#103', branch: 'fix/cost-cache',       status: { tone: 'warning', text: 'changes requested' }, labels: ['bug'], season: 'autumn' },
    { stage: 'flowering',title: 'Provider trait expansion',      issue: '#091', branch: 'feat/provider-trait',  status: { tone: 'amber', text: 'approved · ready' }, labels: ['feature'], glow: true },
    { stage: 'bare',     title: 'Bundle Tauri icons',            issue: '#077', branch: 'chore/icons',          status: { tone: 'success', text: 'merged' }, labels: ['chore'] },
  ];

  return (
    <div className="gk-root theme-dark" style={{ padding: 36, height: '100%', background: 'var(--background)', overflow: 'auto' }}>
      <div className="gk-eyebrow" style={{ marginBottom: 6 }}>Issue card</div>
      <div className="gk-h1" style={{ fontSize: 22, marginBottom: 6 }}>States across the lifecycle</div>
      <div className="gk-small" style={{ marginBottom: 24 }}>The card is the atom of the dashboard. Tree on the left, metadata on the right.</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {cards.map((c, i) => <IssueCard key={i} {...c} seed={i + 30} />)}
      </div>
    </div>
  );
}

function IssueCard({ stage, title, issue, branch, status, labels = [], fruitCount = 0, season = 'summer', glow, seed = 1 }) {
  const toneCls = {
    idle: 'gk-badge',
    info: 'gk-badge gk-badge-info',
    moss: 'gk-badge gk-badge-moss',
    success: 'gk-badge gk-badge-success',
    warning: 'gk-badge gk-badge-warning',
    danger: 'gk-badge gk-badge-danger',
    amber: 'gk-badge gk-badge-amber',
  }[status.tone];

  return (
    <div className="gk-card" style={{ padding: 14, display: 'grid', gridTemplateColumns: '92px 1fr', gap: 12, alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 92, width: 92, background: 'linear-gradient(180deg, color-mix(in oklch, var(--surface-2) 60%, transparent), transparent)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ transform: 'translateY(20px)', display: 'flex' }}>
          <Tree stage={stage} shape={['oak','maple','birch','baobab'][seed % 4]} season={season} fruitCount={fruitCount} fruitType="apple" size={92} seed={seed} glow={glow} showGround={false} />
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <div className="gk-h3" style={{ fontSize: 13.5, lineHeight: 1.3 }}>{title}</div>
          <button className="gk-btn gk-btn-ghost gk-btn-icon gk-btn-sm" style={{ flexShrink: 0 }}><I.More size={12} /></button>
        </div>
        <div className="font-mono gk-tiny" style={{ marginBottom: 8 }}>
          {issue}{branch && <> · <span style={{ color: 'var(--foreground-muted)' }}>{branch}</span></>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <span className={toneCls}>
            {status.pulse && <span className="gk-badge-dot gk-pulse" />}
            {status.text}
          </span>
          {labels.map(l => <span key={l} className="gk-badge">{l}</span>)}
        </div>
      </div>
    </div>
  );
}

window.LegendArtboard = LegendArtboard;
window.IssueCardArtboard = IssueCardArtboard;
window.IssueCard = IssueCard;
