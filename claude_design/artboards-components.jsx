/* global React, Tree, I */
const { useState } = React;

// ---------- COMPONENTS LIBRARY ----------
function ComponentsArtboard({ theme = 'theme-dark' }) {
  return (
    <div className={'gk-root ' + theme} style={{ padding: 40, height: '100%', background: 'var(--background)', overflow: 'hidden' }}>
      <div className="gk-eyebrow" style={{ marginBottom: 6 }}>Components</div>
      <div className="gk-h1" style={{ fontSize: 24, marginBottom: 28 }}>Core primitives ({theme === 'theme-dark' ? 'dark' : 'light'})</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        <div style={{ display: 'grid', gap: 24 }}>
          <CompSection title="Buttons">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="gk-btn gk-btn-primary"><I.Plus size={14} /> New issue</button>
              <button className="gk-btn gk-btn-secondary">Cancel</button>
              <button className="gk-btn gk-btn-ghost">Skip</button>
              <button className="gk-btn gk-btn-danger"><I.Trash size={14} /> Delete</button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
              <button className="gk-btn gk-btn-primary gk-btn-sm">Small</button>
              <button className="gk-btn gk-btn-primary">Default</button>
              <button className="gk-btn gk-btn-primary gk-btn-lg">Large</button>
              <button className="gk-btn gk-btn-secondary gk-btn-icon"><I.Settings size={14} /></button>
              <button className="gk-btn gk-btn-secondary gk-btn-icon gk-btn-sm"><I.More size={12} /></button>
            </div>
          </CompSection>

          <CompSection title="Inputs">
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label className="gk-label">Issue title</label>
                <input className="gk-input" defaultValue="Add forest view overlays" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="gk-label">Repository</label>
                  <select className="gk-select" defaultValue="grovekeeper">
                    <option>grovekeeper</option>
                    <option>low-poly-2d-trees</option>
                  </select>
                </div>
                <div>
                  <label className="gk-label">Base branch</label>
                  <input className="gk-input font-mono" defaultValue="dev" />
                </div>
              </div>
              <div>
                <label className="gk-label">Description</label>
                <textarea className="gk-textarea" rows={3} defaultValue="Add error/warning bubbles above each tree to surface session failures at a glance." />
              </div>
              <div>
                <label className="gk-label">Search</label>
                <div style={{ position: 'relative' }}>
                  <I.Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--foreground-subtle)' }} />
                  <input className="gk-input" style={{ paddingLeft: 32 }} placeholder="Search issues, branches, sessions…" />
                </div>
              </div>
            </div>
          </CompSection>

          <CompSection title="Selection">
            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input type="checkbox" className="gk-check" defaultChecked /> Auto-create worktree on issue creation
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input type="checkbox" className="gk-check" /> Notify on session completion
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input type="checkbox" className="gk-check" defaultChecked /> Play sound on permission request
              </label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <RadioPill label="Claude" active />
                <RadioPill label="Codex" />
                <RadioPill label="Copilot" />
                <RadioPill label="Cursor" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                <ToggleSwitch defaultChecked />
                <span className="gk-small">Auto-fetch every 5 min</span>
              </div>
            </div>
          </CompSection>
        </div>

        <div style={{ display: 'grid', gap: 24 }}>
          <CompSection title="Tabs">
            <div className="gk-tabs">
              <button className="gk-tab is-active">Chat</button>
              <button className="gk-tab">Diff</button>
              <button className="gk-tab">Terminal</button>
              <button className="gk-tab">Files</button>
            </div>
          </CompSection>

          <CompSection title="Badges & status">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <span className="gk-badge"><span className="gk-badge-dot" style={{ background: 'var(--foreground-subtle)' }} /> idle</span>
              <span className="gk-badge gk-badge-moss"><span className="gk-badge-dot gk-pulse" /> running</span>
              <span className="gk-badge gk-badge-success"><I.Check size={10} /> healthy</span>
              <span className="gk-badge gk-badge-warning"><I.AlertTriangle size={10} /> needs input</span>
              <span className="gk-badge gk-badge-danger"><I.X size={10} /> failed</span>
              <span className="gk-badge gk-badge-info"><I.Refresh size={10} /> syncing</span>
              <span className="gk-badge gk-badge-amber">approved</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="gk-badge gk-badge-mono"><I.GitBranch size={10} /> feat/forest-view</span>
              <span className="gk-badge gk-badge-mono">a4f8c12</span>
              <span className="gk-badge gk-badge-mono">+3 ahead</span>
              <span className="gk-badge gk-badge-mono">−1 behind</span>
              <span className="gk-badge gk-badge-mono">#128</span>
            </div>
          </CompSection>

          <CompSection title="Card">
            <div className="gk-card gk-card-padded">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div className="gk-h3">Add forest view overlays</div>
                  <div className="gk-tiny font-mono" style={{ marginTop: 2 }}>#128 · feat/forest-overlays</div>
                </div>
                <button className="gk-btn gk-btn-ghost gk-btn-icon gk-btn-sm"><I.More size={12} /></button>
              </div>
              <div className="gk-small" style={{ marginBottom: 12 }}>Surface session failures and PR review state directly above each tree.</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="gk-badge gk-badge-moss"><span className="gk-badge-dot gk-pulse" /> running</span>
                <span className="gk-badge gk-badge-mono"><I.GitBranch size={10} /> feat/forest-overlays</span>
              </div>
            </div>
          </CompSection>

          <CompSection title="Toast / inline alerts">
            <div style={{ display: 'grid', gap: 8 }}>
              <Toast tone="success" icon={<I.Check size={14} />} title="Worktree created" body="Branch feat/forest-overlays checked out." />
              <Toast tone="warning" icon={<I.AlertTriangle size={14} />} title="Permission required" body="Session #128 wants to run a Bash command." />
              <Toast tone="danger" icon={<I.X size={14} />} title="Sync failed" body="GitHub returned 401 — check token in Settings → Providers." />
            </div>
          </CompSection>

          <CompSection title="Worktree progress">
            <div className="gk-card gk-card-padded">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="gk-small">Setting up worktree</span>
                <span className="gk-small font-mono">3 / 5</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['fetch', 'branch', 'install', 'env', 'hooks'].map((step, i) => (
                  <div key={step} style={{ flex: 1, height: 6, borderRadius: 3, background: i < 3 ? 'var(--primary)' : 'var(--surface-3)' }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {['fetch', 'branch', 'install', 'env', 'hooks'].map((step, i) => (
                  <span key={step} className="gk-tiny font-mono" style={{ color: i < 3 ? 'var(--primary)' : 'var(--foreground-subtle)' }}>{step}</span>
                ))}
              </div>
            </div>
          </CompSection>
        </div>
      </div>
    </div>
  );
}

function CompSection({ title, children }) {
  return (
    <div>
      <div className="gk-eyebrow" style={{ marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function RadioPill({ label, active }) {
  return (
    <button className={'gk-btn gk-btn-sm ' + (active ? 'gk-btn-primary' : 'gk-btn-secondary')}>{label}</button>
  );
}

function ToggleSwitch({ defaultChecked }) {
  const [on, setOn] = useState(!!defaultChecked);
  return (
    <button
      onClick={() => setOn(o => !o)}
      style={{
        width: 32, height: 18, borderRadius: 999,
        background: on ? 'var(--primary)' : 'var(--surface-3)',
        border: '1px solid var(--border)',
        position: 'relative', cursor: 'pointer', transition: 'background 120ms ease',
      }}
    >
      <span style={{
        position: 'absolute', top: 1, left: on ? 14 : 1,
        width: 14, height: 14, borderRadius: 999,
        background: 'var(--surface)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'left 140ms ease',
      }} />
    </button>
  );
}

function Toast({ tone, icon, title, body }) {
  const cls = tone === 'success' ? 'gk-badge-success' : tone === 'warning' ? 'gk-badge-warning' : 'gk-badge-danger';
  const color = tone === 'success' ? 'var(--status-success)' : tone === 'warning' ? 'var(--status-warning)' : 'var(--status-danger)';
  return (
    <div className="gk-card" style={{ padding: 10, display: 'flex', gap: 10, alignItems: 'flex-start', borderLeft: `2px solid ${color}` }}>
      <div style={{ color, marginTop: 1 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{title}</div>
        <div className="gk-small" style={{ marginTop: 2 }}>{body}</div>
      </div>
    </div>
  );
}

window.ComponentsArtboard = ComponentsArtboard;
