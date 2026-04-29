/* global React, Tree, I, AppShell, TopBar */
const { useState } = React;

// ---------- SESSION DASHBOARD ----------
function SessionArtboard() {
  return (
    <AppShell active="session">
      <TopBar title="#128 Build kanban drag-and-drop" sub="feat/kanban-dnd · Claude Code · sonnet">
        <span className="gk-badge gk-badge-moss"><span className="gk-badge-dot gk-pulse" /> running</span>
        <button className="gk-btn gk-btn-secondary"><I.Pause size={13} /> Pause</button>
        <button className="gk-btn gk-btn-danger"><I.Square size={13} /> Stop</button>
      </TopBar>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', height: 'calc(100% - 60px)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="gk-tabs">
              <button className="gk-tab is-active">Chat</button>
              <button className="gk-tab">Diff</button>
              <button className="gk-tab">Terminal</button>
              <button className="gk-tab">Files</button>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="gk-tiny font-mono">turn 14 · $0.42</span>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 18, display: 'grid', gap: 14 }}>
            <Msg role="user">Add drag-and-drop between kanban columns. Use @hello-pangea/dnd.</Msg>
            <Msg role="assistant">I'll start by reading the existing Kanban component, then wrap it in a DragDropContext.</Msg>
            <ToolCard tool="Read" arg="src/lib/components/KanbanBoard.svelte" result="142 lines" />
            <ToolCard tool="Edit" arg="src/lib/components/KanbanBoard.svelte" result="+18 −2" diff />
            <Msg role="assistant">Added DragDropContext wrapper and onDragEnd handler. Each column is now a Droppable; cards are Draggables keyed by issue id.</Msg>
            <ApprovalCard tool="Bash" cmd="pnpm install @hello-pangea/dnd" />
          </div>
          <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <textarea className="gk-textarea" rows={2} placeholder="Reply to the agent…" style={{ paddingRight: 80 }} />
              <button className="gk-btn gk-btn-primary gk-btn-sm" style={{ position: 'absolute', bottom: 8, right: 8 }}><I.Send size={11} /> Send</button>
            </div>
          </div>
        </div>
        <div style={{ padding: 16, overflow: 'auto', display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}>
            <Tree stage="growing" shape="oak" fruitCount={1} fruitType="apple" seed={128} size={130} />
          </div>
          <div className="gk-card gk-card-padded">
            <div className="gk-eyebrow" style={{ marginBottom: 8 }}>Stats</div>
            <Stat label="Turns" value="14" />
            <Stat label="Cost" value="$0.42" />
            <Stat label="Tokens in" value="38.2k" />
            <Stat label="Tokens out" value="4.1k" />
            <Stat label="Cache hit" value="71%" />
            <Stat label="Tools used" value="Read · Edit · Bash" />
          </div>
          <div className="gk-card gk-card-padded">
            <div className="gk-eyebrow" style={{ marginBottom: 8 }}>Worktree</div>
            <div className="font-mono" style={{ fontSize: 11.5, color: 'var(--foreground-muted)', lineHeight: 1.7 }}>
              <div><I.GitBranch size={10} /> feat/kanban-dnd</div>
              <div>~/grovekeeper/.wt/i-128</div>
              <div>+3 commits ahead</div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button className="gk-btn gk-btn-secondary gk-btn-sm" style={{ flex: 1 }}><I.Terminal size={11} /> Terminal</button>
              <button className="gk-btn gk-btn-secondary gk-btn-sm" style={{ flex: 1 }}><I.ExternalLink size={11} /> Editor</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Msg({ role, children }) {
  const isUser = role === 'user';
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, background: isUser ? 'var(--surface-3)' : 'var(--moss-700)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
        {isUser ? 'U' : 'C'}
      </div>
      <div style={{ flex: 1, fontSize: 13, lineHeight: 1.55, color: 'var(--foreground)' }}>{children}</div>
    </div>
  );
}

function ToolCard({ tool, arg, result, diff }) {
  return (
    <div className="gk-card" style={{ padding: 8, marginLeft: 32, fontSize: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: diff ? 6 : 0 }}>
        <span className="gk-badge gk-badge-mono" style={{ background: 'var(--surface-3)', borderColor: 'transparent' }}>{tool}</span>
        <span className="font-mono gk-tiny" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{arg}</span>
        <span className="gk-tiny" style={{ color: 'var(--status-success)' }}>{result}</span>
      </div>
      {diff && (
        <pre className="font-mono" style={{ background: 'var(--code-bg)', padding: 8, borderRadius: 4, fontSize: 11, margin: 0, lineHeight: 1.5, overflow: 'auto' }}>
          <span style={{ color: 'var(--status-success)' }}>+ &lt;DragDropContext onDragEnd=&#123;handleDragEnd&#125;&gt;</span>{'\n'}
          <span style={{ color: 'var(--status-success)' }}>+   &lt;div class="kanban-grid"&gt;</span>{'\n'}
          <span style={{ color: 'var(--status-danger)' }}>- &lt;div class="kanban-grid"&gt;</span>
        </pre>
      )}
    </div>
  );
}

function ApprovalCard({ tool, cmd }) {
  return (
    <div className="gk-card" style={{ padding: 12, marginLeft: 32, borderLeft: '2px solid var(--status-warning)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <I.AlertTriangle size={13} style={{ color: 'var(--status-warning)' }} />
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>Permission required</span>
      </div>
      <div className="font-mono" style={{ fontSize: 11.5, padding: 6, background: 'var(--code-bg)', borderRadius: 4, marginBottom: 8 }}>
        $ {cmd}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="gk-btn gk-btn-primary gk-btn-sm">Allow</button>
        <button className="gk-btn gk-btn-secondary gk-btn-sm">Allow always</button>
        <button className="gk-btn gk-btn-ghost gk-btn-sm">Deny</button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed var(--border)' }}>
      <span className="gk-small">{label}</span>
      <span className="font-mono" style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

// ---------- USAGE / EVAL ----------
function UsageArtboard() {
  const days = Array.from({ length: 30 }, (_, i) => Math.random() * 0.8 + (i > 20 ? 0.2 : 0));
  const cats = [
    { name: 'Coding',       cost: 4.21, oneShot: 88, turns: 312 },
    { name: 'Debugging',    cost: 2.84, oneShot: 64, turns: 142 },
    { name: 'Refactoring',  cost: 1.95, oneShot: 71, turns:  88 },
    { name: 'Testing',      cost: 1.42, oneShot: 79, turns:  52 },
    { name: 'Exploration',  cost: 1.12, oneShot: 58, turns: 188 },
    { name: 'Planning',     cost: 0.68, oneShot: 92, turns:  18 },
    { name: 'Conversation', cost: 0.62, oneShot: 95, turns: 144 },
  ];
  const tools = [
    { name: 'Read',  calls: 1842 },
    { name: 'Edit',  calls:  892 },
    { name: 'Bash',  calls:  712 },
    { name: 'Grep',  calls:  354 },
    { name: 'Write', calls:  221 },
  ];
  const toolMax = Math.max(...tools.map(t => t.calls));

  return (
    <AppShell active="usage">
      <TopBar title="Usage" sub="Last 30 days · all providers">
        <div className="gk-tabs">
          <button className="gk-tab">Today</button>
          <button className="gk-tab">7d</button>
          <button className="gk-tab is-active">30d</button>
          <button className="gk-tab">All</button>
        </div>
        <button className="gk-btn gk-btn-secondary"><I.ExternalLink size={13} /> Export CSV</button>
      </TopBar>
      <div style={{ padding: 18, display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KPI label="Total cost" value="$12.84" sub="−18% vs prev 30d" tone="success" />
          <KPI label="Sessions" value="47" sub="+9 vs prev 30d" />
          <KPI label="One-shot rate" value="74%" sub="industry avg ≈ 62%" tone="moss" />
          <KPI label="Cache hit" value="68%" sub="saving ≈ $4.20/mo" tone="amber" />
        </div>

        <div className="gk-card gk-card-padded">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="gk-h3">Cost per day</div>
            <div className="gk-tiny font-mono">peak: $1.42 on day 24</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
            {days.map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${v * 100}%`, background: `linear-gradient(180deg, color-mix(in oklch, var(--primary) ${50 + v * 40}%, transparent), color-mix(in oklch, var(--primary) ${20 + v * 30}%, transparent))`, borderRadius: '3px 3px 0 0', minHeight: 4 }} title={`Day ${i+1}: $${(v*1.5).toFixed(2)}`} />
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
          <div className="gk-card gk-card-padded">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <div className="gk-h3">Activity breakdown</div>
              <div className="gk-tiny font-mono">cost · turns · 1-shot</div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {cats.map(c => (
                <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 64px 44px 44px', gap: 10, alignItems: 'center', fontSize: 12 }}>
                  <span>{c.name}</span>
                  <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(c.cost / 4.21) * 100}%`, height: '100%', background: 'var(--primary)' }} />
                  </div>
                  <span className="font-mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${c.cost.toFixed(2)}</span>
                  <span className="font-mono gk-tiny" style={{ textAlign: 'right', color: 'var(--foreground-subtle)', fontVariantNumeric: 'tabular-nums' }}>{c.turns}</span>
                  <span className="font-mono gk-tiny" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: c.oneShot > 75 ? 'var(--status-success)' : c.oneShot > 60 ? 'var(--status-warning)' : 'var(--status-danger)' }}>{c.oneShot}%</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="gk-card gk-card-padded">
              <div className="gk-h3" style={{ marginBottom: 14 }}>Top sessions</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  { issue: '#128', title: 'kanban dnd', cost: 1.42 },
                  { issue: '#118', title: 'forest overlays', cost: 0.94 },
                  { issue: '#103', title: 'cost calc cache', cost: 0.78 },
                  { issue: '#091', title: 'provider trait', cost: 0.62 },
                ].map(s => (
                  <div key={s.issue} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border)' }}>
                    <div>
                      <span className="font-mono gk-tiny">{s.issue}</span>{' '}
                      <span style={{ fontSize: 12.5 }}>{s.title}</span>
                    </div>
                    <span className="font-mono" style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>${s.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="gk-card gk-card-padded">
              <div className="gk-h3" style={{ marginBottom: 14 }}>Tool calls</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {tools.map(t => (
                  <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 50px', gap: 10, alignItems: 'center', fontSize: 12 }}>
                    <span>{t.name}</span>
                    <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${(t.calls / toolMax) * 100}%`, height: '100%', background: 'var(--accent)' }} />
                    </div>
                    <span className="font-mono gk-tiny" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{t.calls.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function KPI({ label, value, sub, tone }) {
  const color = tone === 'success' ? 'var(--status-success)' : tone === 'moss' ? 'var(--primary)' : tone === 'amber' ? 'var(--accent)' : 'var(--foreground-muted)';
  return (
    <div className="gk-card gk-card-padded">
      <div className="gk-eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div className="gk-tiny" style={{ color, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ---------- SETTINGS ----------
function SettingsArtboard() {
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('en');
  return (
    <AppShell active="settings">
      <TopBar title="Settings" />
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', height: 'calc(100% - 60px)' }}>
        <nav style={{ padding: 14, borderRight: '1px solid var(--border)', display: 'grid', gap: 1 }}>
          {['General', 'Appearance', 'Language', 'Providers', 'Notifications', 'GitHub', 'Worktrees', 'About'].map((s, i) => (
            <button key={s} style={{ ...({display:'flex',alignItems:'center',gap:8,padding:'6px 8px',border:'none',background:i===1?'var(--surface-2)':'transparent',color:i===1?'var(--foreground)':'var(--sidebar-fg)',fontSize:12.5,fontFamily:'inherit',cursor:'pointer',borderRadius:6,textAlign:'left'}) }}>{s}</button>
          ))}
        </nav>
        <div style={{ padding: 24, overflow: 'auto', display: 'grid', gap: 20, maxWidth: 720 }}>
          <SettingGroup title="Theme" desc="Choose how Grovekeeper looks. Trees keep their seasonal colors regardless.">
            <div style={{ display: 'flex', gap: 10 }}>
              <ThemeCard active={theme === 'light'} onClick={() => setTheme('light')} variant="light" label="Light" />
              <ThemeCard active={theme === 'dark'} onClick={() => setTheme('dark')} variant="dark" label="Dark" />
              <ThemeCard active={theme === 'system'} onClick={() => setTheme('system')} variant="system" label="System" />
            </div>
          </SettingGroup>

          <SettingGroup title="Accent">
            <div style={{ display: 'flex', gap: 8 }}>
              {['var(--moss-600)', 'var(--moss-400)', 'var(--amber-500)', 'oklch(0.55 0.13 200)', 'oklch(0.55 0.18 320)'].map((c, i) => (
                <button key={i} style={{ width: 28, height: 28, borderRadius: 999, background: c, border: i === 0 ? '2px solid var(--foreground)' : '1px solid var(--border)', cursor: 'pointer', boxShadow: i === 0 ? '0 0 0 2px var(--background) inset' : 'none' }} />
              ))}
            </div>
          </SettingGroup>

          <SettingGroup title="Language" desc="The forest is multilingual.">
            <select className="gk-select" value={lang} onChange={e => setLang(e.target.value)} style={{ maxWidth: 220 }}>
              <option value="en">English</option>
              <option value="cs">Čeština</option>
              <option value="de">Deutsch</option>
              <option value="es">Español</option>
            </select>
          </SettingGroup>

          <SettingGroup title="Density">
            <div className="gk-tabs">
              <button className="gk-tab">Compact</button>
              <button className="gk-tab is-active">Comfortable</button>
              <button className="gk-tab">Spacious</button>
            </div>
          </SettingGroup>

          <SettingGroup title="Forest view overlays">
            <Row label="Show error bubbles above failed sessions" defaultChecked />
            <Row label="Show 'needs input' speech bubbles" defaultChecked />
            <Row label="Show watering can on running sessions" defaultChecked />
            <Row label="Show woodpecker on PRs needing review" />
            <Row label="Show issue title under each tree" defaultChecked />
          </SettingGroup>

          <SettingGroup title="Providers">
            <div style={{ display: 'grid', gap: 8 }}>
              <ProviderRow name="Claude Code" status="healthy" version="1.4.2" model="sonnet" />
              <ProviderRow name="Codex" status="healthy" version="0.9.1" model="gpt-5" />
              <ProviderRow name="GitHub Copilot" status="auth-required" />
              <ProviderRow name="Cursor" status="not-installed" />
            </div>
          </SettingGroup>
        </div>
      </div>
    </AppShell>
  );
}

function SettingGroup({ title, desc, children }) {
  return (
    <div>
      <div className="gk-h3" style={{ marginBottom: 4 }}>{title}</div>
      {desc && <div className="gk-small" style={{ marginBottom: 10 }}>{desc}</div>}
      {!desc && <div style={{ height: 8 }} />}
      {children}
    </div>
  );
}

function Row({ label, defaultChecked }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 0' }}>
      <input type="checkbox" className="gk-check" defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

function ThemeCard({ active, onClick, variant, label }) {
  const bg = variant === 'light' ? '#f4f4ed' : variant === 'dark' ? '#1a2018' : 'linear-gradient(135deg, #f4f4ed 50%, #1a2018 50%)';
  const fg = variant === 'light' ? '#3a5a3a' : 'var(--moss-300)';
  return (
    <button onClick={onClick} style={{ flex: 1, padding: 10, borderRadius: 10, border: active ? '2px solid var(--primary)' : '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
      <div style={{ height: 50, borderRadius: 6, background: bg, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Tree stage="leafy" shape="oak" size={42} seed={3} showGround={false} />
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{label}</div>
    </button>
  );
}

function ProviderRow({ name, status, version, model }) {
  const tones = {
    healthy: { cls: 'gk-badge gk-badge-success', text: 'Healthy' },
    'auth-required': { cls: 'gk-badge gk-badge-warning', text: 'Auth required' },
    'not-installed': { cls: 'gk-badge', text: 'Not installed' },
  }[status];
  return (
    <div className="gk-card" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
      <I.Cpu size={16} style={{ color: 'var(--foreground-muted)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{name}</div>
        {version && <div className="gk-tiny font-mono">v{version} · {model}</div>}
      </div>
      <span className={tones.cls}>{tones.text}</span>
      <button className="gk-btn gk-btn-ghost gk-btn-icon gk-btn-sm"><I.More size={12} /></button>
    </div>
  );
}

window.SessionArtboard = SessionArtboard;
window.UsageArtboard = UsageArtboard;
window.SettingsArtboard = SettingsArtboard;
