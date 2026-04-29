/* global React, Tree, I */
const { useState, useEffect } = React;

// =====================================================================
// OVERLAYS — split across multiple artboards so nothing overlaps:
//   1. Tooltips
//   2. Popovers (filter / sort / legend)
//   3. Account dropdown + Notifications
//   4. Toasts
//   5. Modal — plant tree
//   6. Modal — destructive confirm
//   7. Command palette
// =====================================================================

function Frame({ children, title, subtitle }) {
  return (
    <div className="gk-root theme-dark" style={{ padding: 28, minHeight: '100%', background: 'var(--background)' }}>
      <div className="gk-eyebrow" style={{ marginBottom: 4 }}>{title}</div>
      {subtitle && <div className="gk-h2" style={{ marginBottom: 22, fontSize: 18 }}>{subtitle}</div>}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------
// 1. Tooltips
// ---------------------------------------------------------------------
function TooltipsArtboard() {
  return (
    <Frame title="Tooltips" subtitle="Placements & content variants">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 24, padding: '40px 20px 20px' }}>
        <TooltipCell placement="top" text="Sync now" />
        <TooltipCell placement="bottom" text="Plant a tree" hasKbd />
        <TooltipCell placement="left" text="Filter issues" />
        <TooltipCell placement="right" text="Forest view" />
        <RichTooltipCell />
        <TooltipCell placement="top" text="Long tooltip text wraps onto multiple lines if it has to" wide />
      </div>
    </Frame>
  );
}

function TooltipCell({ placement, text, hasKbd, wide }) {
  return (
    <div className="cs-cell cs-cell-center" style={{ minHeight: 130, padding: '40px 16px 24px' }}>
      <div className="cs-cell-label" style={{ position: 'absolute', top: 10, left: 14 }}>{placement}{wide ? ' · multi-line' : ''}</div>
      <div className="cs-cell-stage" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative' }}>
          {placement === 'top' && (
            <div className="gk-tooltip" style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', whiteSpace: wide ? 'normal' : 'nowrap', width: wide ? 200 : 'auto' }}>
              {text}{hasKbd && <span className="gk-kbd" style={{ marginLeft: 6 }}>⌘N</span>}
              <span className="gk-tooltip-arrow" style={{ bottom: -4, left: '50%', marginLeft: -4 }} />
            </div>
          )}
          {placement === 'bottom' && (
            <div className="gk-tooltip" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }}>
              {text}{hasKbd && <span className="gk-kbd" style={{ marginLeft: 6 }}>⌘N</span>}
              <span className="gk-tooltip-arrow" style={{ top: -4, left: '50%', marginLeft: -4 }} />
            </div>
          )}
          {placement === 'left' && (
            <div className="gk-tooltip" style={{ position: 'absolute', right: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' }}>
              {text}<span className="gk-tooltip-arrow" style={{ right: -4, top: '50%', marginTop: -4 }} />
            </div>
          )}
          {placement === 'right' && (
            <div className="gk-tooltip" style={{ position: 'absolute', left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' }}>
              {text}<span className="gk-tooltip-arrow" style={{ left: -4, top: '50%', marginTop: -4 }} />
            </div>
          )}
          <button className="gk-btn gk-btn-secondary gk-btn-icon is-frozen"><I.Settings size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function RichTooltipCell() {
  return (
    <div className="cs-cell cs-cell-center" style={{ minHeight: 130, padding: '60px 16px 24px' }}>
      <div className="cs-cell-label" style={{ position: 'absolute', top: 10, left: 14 }}>rich · on tree</div>
      <div className="cs-cell-stage" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative' }}>
          <div className="gk-tooltip" style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'normal', width: 220, padding: '8px 10px' }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>#128 · Build kanban DnD</div>
            <div style={{ opacity: 0.8, fontSize: 10.5, lineHeight: 1.4 }}>Claude · 2m 14s · 3 commits ahead</div>
            <span className="gk-tooltip-arrow" style={{ bottom: -4, left: '50%', marginLeft: -4 }} />
          </div>
          <div style={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tree stage="growing" shape="oak" size={56} seed={4} showGround={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 2. Popovers
// ---------------------------------------------------------------------
function PopoversArtboard() {
  return (
    <Frame title="Popovers" subtitle="Filter, sort, legend">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
        <PopoverCell title="Filter" content={<FilterPopoverContent />} icon={<I.Filter size={13} />} />
        <PopoverCell title="Sort by" content={<SortPopoverContent />} icon={<I.Layers size={13} />} />
        <PopoverCell title="Legend" content={<LegendPopoverContent />} icon={<I.Sparkles size={13} />} />
      </div>
    </Frame>
  );
}

function PopoverCell({ title, content, icon }) {
  return (
    <div className="cs-cell" style={{ minHeight: 380, padding: 16 }}>
      <div className="cs-cell-label">{title.toLowerCase()}</div>
      <div style={{ position: 'relative', flex: 1 }}>
        <button className="gk-btn gk-btn-secondary is-frozen">{icon} {title}</button>
        <div className="gk-popover" style={{ position: 'absolute', top: 38, left: 0, zIndex: 4 }}>{content}</div>
      </div>
    </div>
  );
}

function FilterPopoverContent() {
  return (
    <div style={{ width: 240 }}>
      <div className="gk-popover-label">Status</div>
      <label className="gk-popover-item is-frozen"><input type="checkbox" className="gk-check is-frozen" defaultChecked /> Running</label>
      <label className="gk-popover-item is-frozen"><input type="checkbox" className="gk-check is-frozen" defaultChecked /> PR draft</label>
      <label className="gk-popover-item is-frozen"><input type="checkbox" className="gk-check is-frozen" /> Approved</label>
      <label className="gk-popover-item is-frozen"><input type="checkbox" className="gk-check is-frozen" /> Merged</label>
      <div className="gk-popover-divider" />
      <div className="gk-popover-label">Provider</div>
      <label className="gk-popover-item is-frozen"><input type="checkbox" className="gk-check is-frozen" defaultChecked /> Claude</label>
      <label className="gk-popover-item is-frozen"><input type="checkbox" className="gk-check is-frozen" /> Codex</label>
      <div className="gk-popover-divider" />
      <div style={{ display: 'flex', gap: 6, padding: '4px 4px 0' }}>
        <button className="gk-btn gk-btn-ghost gk-btn-sm is-frozen" style={{ flex: 1 }}>Reset</button>
        <button className="gk-btn gk-btn-primary gk-btn-sm is-frozen" style={{ flex: 1 }}>Apply</button>
      </div>
    </div>
  );
}

function SortPopoverContent() {
  return (
    <div style={{ width: 220 }}>
      <div className="gk-popover-label">Sort by</div>
      <div className="gk-popover-item is-frozen" data-state="active"><I.Check size={11} /> Updated · newest</div>
      <div className="gk-popover-item is-frozen"><span style={{ width: 11 }} /> Created · newest</div>
      <div className="gk-popover-item is-frozen"><span style={{ width: 11 }} /> Issue # · ascending</div>
      <div className="gk-popover-item is-frozen"><span style={{ width: 11 }} /> Tree stage</div>
      <div className="gk-popover-item is-frozen"><span style={{ width: 11 }} /> Provider</div>
      <div className="gk-popover-divider" />
      <div className="gk-popover-label">Group by</div>
      <div className="gk-popover-item is-frozen"><span style={{ width: 11 }} /> None</div>
      <div className="gk-popover-item is-frozen" data-state="active"><I.Check size={11} /> Repository</div>
      <div className="gk-popover-item is-frozen"><span style={{ width: 11 }} /> Status</div>
    </div>
  );
}

function LegendPopoverContent() {
  const rows = [
    { c: 'var(--moss-400)', t: 'Growing — session active' },
    { c: 'var(--amber-400)', t: 'Fruiting — PR open' },
    { c: '#e8a8c0', t: 'Flowering — approved' },
    { c: '#e8a64a', t: 'Seasonal — review' },
    { c: 'var(--foreground-muted)', t: 'Bare — merged' },
    { c: '#6c5d4e', t: 'Dead — branch gone' },
  ];
  return (
    <div style={{ width: 240 }}>
      <div className="gk-popover-label">Tree state legend</div>
      <div style={{ display: 'grid', gap: 5, padding: '0 8px 6px' }}>
        {rows.map(r => (
          <div key={r.t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: r.c }} />
            <span className="gk-tiny" style={{ color: 'var(--foreground)' }}>{r.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 3. Account & notifications
// ---------------------------------------------------------------------
function AccountMenusArtboard() {
  return (
    <Frame title="Quick menus" subtitle="Account dropdown · notifications inbox">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="cs-cell" style={{ minHeight: 480, padding: 16 }}>
          <div className="cs-cell-label">account dropdown</div>
          <div style={{ position: 'relative', flex: 1 }}>
            <AccountDropdown />
          </div>
        </div>
        <div className="cs-cell" style={{ minHeight: 480, padding: 16 }}>
          <div className="cs-cell-label">notifications popover</div>
          <div style={{ position: 'relative', flex: 1 }}>
            <NotificationsPopover />
          </div>
        </div>
      </div>
    </Frame>
  );
}

function AccountDropdown() {
  return (
    <div style={{ position: 'relative', width: 280 }}>
      <button className="gk-btn gk-btn-secondary is-frozen" style={{ width: '100%', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--moss-700)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>L</span>
          Lukas
        </span>
        <I.Chevron size={13} />
      </button>
      <div className="gk-popover" style={{ position: 'absolute', top: 38, left: 0, right: 0, zIndex: 4, padding: 0 }}>
        <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
          <span style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--moss-700)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>L</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Lukas Hron</div>
            <div className="gk-tiny" style={{ color: 'var(--foreground-subtle)', overflow: 'hidden', textOverflow: 'ellipsis' }}>lukas@grovekeeper.dev</div>
          </div>
        </div>
        <div style={{ padding: 6 }}>
          <div className="gk-popover-item is-frozen"><I.User size={13} /> Profile <span className="gk-kbd">⌘P</span></div>
          <div className="gk-popover-item is-frozen" data-state="hover"><I.Settings size={13} /> Settings <span className="gk-kbd">⌘,</span></div>
          <div className="gk-popover-item is-frozen"><I.Database size={13} /> Billing & usage</div>
          <div className="gk-popover-divider" />
          <div className="gk-popover-label">Theme</div>
          <div style={{ display: 'flex', gap: 4, padding: '0 8px 6px' }}>
            <button className="gk-btn gk-btn-secondary gk-btn-sm is-frozen" style={{ flex: 1 }}><I.Sun size={11} /> Light</button>
            <button className="gk-btn gk-btn-primary gk-btn-sm is-frozen" style={{ flex: 1 }}><I.Moon size={11} /> Dark</button>
            <button className="gk-btn gk-btn-secondary gk-btn-sm is-frozen" style={{ flex: 1 }}>Auto</button>
          </div>
          <div className="gk-popover-divider" />
          <div className="gk-popover-item is-frozen"><I.Globe size={13} /> Workspaces <I.ChevronRight size={11} style={{ marginLeft: 'auto' }} /></div>
          <div className="gk-popover-item is-frozen"><I.Github size={13} /> GitHub integrations</div>
          <div className="gk-popover-divider" />
          <div className="gk-popover-item is-frozen" style={{ color: 'var(--status-danger)' }}><I.Logout size={13} /> Sign out</div>
        </div>
      </div>
    </div>
  );
}

function NotificationsPopover() {
  return (
    <div style={{ position: 'relative', width: 320 }}>
      <button className="gk-btn gk-btn-secondary gk-btn-icon is-frozen" style={{ position: 'relative' }}>
        <I.Bell size={14} />
        <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: 999, background: 'var(--status-danger)' }} />
      </button>
      <div className="gk-popover" style={{ position: 'absolute', top: 38, left: 40, zIndex: 4, padding: 0, width: 300 }}>
        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Inbox · 3 unread</div>
          <button className="gk-btn gk-btn-ghost gk-btn-sm is-frozen">Mark all read</button>
        </div>
        <div style={{ maxHeight: 320 }}>
          <NotifRow tone="warning" title="#103 changes requested" body="@reviewer left 2 comments on PR #29" time="4m" unread />
          <NotifRow tone="success" title="#091 PR approved" body="Provider trait expansion is ready to merge" time="1h" unread />
          <NotifRow tone="info" title="#118 PR draft pushed" body="2 new commits on feat/forest-overlays" time="3h" unread />
          <NotifRow tone="muted" title="#066 branch deleted" body="Upstream removed feat/deprecated-polling" time="yest" />
        </div>
      </div>
    </div>
  );
}

function NotifRow({ tone, title, body, time, unread }) {
  const dotColor = tone === 'warning' ? 'var(--status-warning)' : tone === 'success' ? 'var(--status-success)' : tone === 'info' ? 'var(--status-info)' : 'var(--foreground-subtle)';
  return (
    <div style={{ padding: '10px 12px', display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', background: unread ? 'color-mix(in oklch, var(--primary) 4%, transparent)' : 'transparent' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: dotColor, marginTop: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: unread ? 600 : 500 }}>{title}</div>
        <div className="gk-tiny" style={{ color: 'var(--foreground-muted)', marginTop: 1 }}>{body}</div>
      </div>
      <div className="gk-tiny font-mono" style={{ color: 'var(--foreground-subtle)', flexShrink: 0 }}>{time}</div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 4. Toasts
// ---------------------------------------------------------------------
function ToastsArtboard() {
  return (
    <Frame title="Toasts" subtitle="Inline feedback — info, success, warning, danger, loading">
      <div style={{ display: 'grid', gap: 12, maxWidth: 540 }}>
        <ToastEx tone="info" icon={<I.Refresh size={14} />} title="Syncing grovekeeper…" body="Fetching 3 new commits from origin." />
        <ToastEx tone="success" icon={<I.Check size={14} />} title="Worktree created" body="Branch feat/forest-overlays checked out." />
        <ToastEx tone="warning" icon={<I.AlertTriangle size={14} />} title="Permission required" body="Session #128 wants to run a Bash command." action="Review" />
        <ToastEx tone="danger" icon={<I.X size={14} />} title="Sync failed" body="GitHub returned 401 — check token in Settings." action="Retry" />
        <ToastEx tone="loading" icon={<I.Refresh size={14} className="gk-pulse" />} title="Planting tree…" body="Setting up worktree for #142" />
      </div>
    </Frame>
  );
}

function ToastEx({ tone, icon, title, body, action }) {
  const color = tone === 'success' ? 'var(--status-success)' : tone === 'warning' ? 'var(--status-warning)' : tone === 'danger' ? 'var(--status-danger)' : tone === 'info' ? 'var(--status-info)' : 'var(--primary)';
  return (
    <div className="gk-card is-frozen" style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'center', borderLeft: `2px solid ${color}` }}>
      <div style={{ color }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{title}</div>
        <div className="gk-small" style={{ marginTop: 2 }}>{body}</div>
      </div>
      {action && <button className="gk-btn gk-btn-secondary gk-btn-sm is-frozen">{action}</button>}
      <button className="gk-btn gk-btn-ghost gk-btn-icon gk-btn-sm is-frozen"><I.X size={11} /></button>
    </div>
  );
}

// ---------------------------------------------------------------------
// 5. Plant tree modal
// ---------------------------------------------------------------------
function PlantModalArtboard() {
  return (
    <Frame title="Modal" subtitle="Plant a tree — start a new agent session">
      <div style={{ position: 'relative', height: 540, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'color-mix(in oklch, oklch(0.10 0.02 150) 50%, transparent)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="gk-modal" style={{ width: '90%', maxWidth: 460 }}>
            <div className="gk-modal-header">
              <div>
                <div className="gk-eyebrow" style={{ marginBottom: 2 }}>Modal · plant a tree</div>
                <div className="gk-h2" style={{ fontSize: 16 }}>Start a new agent session</div>
              </div>
              <button className="gk-btn gk-btn-ghost gk-btn-icon gk-btn-sm is-frozen"><I.X size={12} /></button>
            </div>
            <div className="gk-modal-body" style={{ display: 'grid', gap: 12 }}>
              <div>
                <label className="gk-label">Issue</label>
                <select className="gk-select is-frozen" defaultValue="142"><option value="142">#142 · Add usage tracking dashboard</option></select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="gk-label">Provider</label>
                  <select className="gk-select is-frozen" defaultValue="claude"><option value="claude">Claude · Sonnet 4.5</option></select>
                </div>
                <div>
                  <label className="gk-label">Base branch</label>
                  <input className="gk-input is-frozen font-mono" defaultValue="dev" />
                </div>
              </div>
              <div>
                <label className="gk-label">Initial prompt (optional)</label>
                <textarea className="gk-textarea is-frozen" rows={2} placeholder="Pick up from the existing PR draft and add the per-day chart…" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                <input type="checkbox" className="gk-check is-frozen" defaultChecked /> Auto-create worktree
              </label>
            </div>
            <div className="gk-modal-footer">
              <button className="gk-btn gk-btn-ghost is-frozen">Cancel</button>
              <button className="gk-btn gk-btn-primary is-frozen"><I.Plus size={13} /> Plant tree</button>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ---------------------------------------------------------------------
// 6. Destructive confirm modal
// ---------------------------------------------------------------------
function ConfirmModalArtboard() {
  return (
    <Frame title="Modal" subtitle="Destructive confirm — archive an issue">
      <div style={{ position: 'relative', height: 540, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'color-mix(in oklch, oklch(0.10 0.02 150) 50%, transparent)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="gk-modal" style={{ width: '90%', maxWidth: 420 }}>
            <div className="gk-modal-header">
              <div>
                <div className="gk-eyebrow" style={{ marginBottom: 2, color: 'var(--status-danger)' }}>Modal · destructive confirm</div>
                <div className="gk-h2" style={{ fontSize: 16 }}>Archive #066?</div>
              </div>
              <button className="gk-btn gk-btn-ghost gk-btn-icon gk-btn-sm is-frozen"><I.X size={12} /></button>
            </div>
            <div className="gk-modal-body">
              <div className="gk-small" style={{ marginBottom: 10 }}>This will remove the worktree and stop any running session. The branch and PR remain untouched on GitHub.</div>
              <div className="gk-card is-frozen" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)' }}>
                <Tree stage="dead" shape="maple" size={48} seed={9} showGround={false} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>Deprecate polling system</div>
                  <div className="font-mono gk-tiny">#066 · feat/deprecated-polling</div>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, marginTop: 12 }}>
                <input type="checkbox" className="gk-check is-frozen" /> Also delete the local branch
              </label>
            </div>
            <div className="gk-modal-footer">
              <button className="gk-btn gk-btn-ghost is-frozen">Cancel</button>
              <button className="gk-btn gk-btn-danger is-frozen"><I.Trash size={13} /> Archive</button>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ---------------------------------------------------------------------
// 7. Command palette
// ---------------------------------------------------------------------
function CommandPaletteArtboard() {
  return (
    <Frame title="Command palette" subtitle="⌘K · type a command, fuzzy-search">
      <div style={{ position: 'relative', height: 480, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'color-mix(in oklch, oklch(0.10 0.02 150) 60%, transparent)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 50 }}>
          <div className="gk-popover" style={{ width: 540, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <I.Search size={14} style={{ color: 'var(--foreground-subtle)' }} />
              <input className="gk-input is-frozen" style={{ border: 'none', padding: 0, height: 24, background: 'transparent', boxShadow: 'none' }} defaultValue="forest" placeholder="Type a command, search…" readOnly />
              <span className="gk-kbd">esc</span>
            </div>
            <div style={{ padding: 6 }}>
              <div className="gk-popover-label">Actions</div>
              <div className="gk-popover-item is-frozen" data-state="active"><I.Plus size={12} /> Plant tree (new agent session) <span className="gk-kbd">⌘N</span></div>
              <div className="gk-popover-item is-frozen"><I.Trees size={12} /> Switch to forest view <span className="gk-kbd">⌘3</span></div>
              <div className="gk-popover-item is-frozen"><I.List size={12} /> Switch to list view <span className="gk-kbd">⌘1</span></div>
              <div className="gk-popover-divider" />
              <div className="gk-popover-label">Issues</div>
              <div className="gk-popover-item is-frozen"><I.Drop size={12} style={{ color: 'var(--moss-400)' }} /> #128 · Build kanban drag-and-drop <span className="gk-tiny" style={{ marginLeft: 'auto', color: 'var(--foreground-subtle)' }}>session running</span></div>
              <div className="gk-popover-item is-frozen"><I.GitPull size={12} style={{ color: 'var(--status-info)' }} /> #118 · Add forest view overlays <span className="gk-tiny" style={{ marginLeft: 'auto', color: 'var(--foreground-subtle)' }}>PR draft</span></div>
              <div className="gk-popover-item is-frozen"><I.Sparkles size={12} style={{ color: 'var(--accent)' }} /> #091 · Provider trait expansion <span className="gk-tiny" style={{ marginLeft: 'auto', color: 'var(--foreground-subtle)' }}>approved</span></div>
            </div>
            <div className="cb-statusbar" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none' }}>
              <span className="cb-key"><span className="cb-keycap">↑↓</span> navigate</span>
              <span className="cb-key"><span className="cb-keycap">↵</span> select</span>
              <span className="cb-key"><span className="cb-keycap">esc</span> close</span>
              <span style={{ marginLeft: 'auto' }}>3 results</span>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

window.TooltipsArtboard = TooltipsArtboard;
window.PopoversArtboard = PopoversArtboard;
window.AccountMenusArtboard = AccountMenusArtboard;
window.ToastsArtboard = ToastsArtboard;
window.PlantModalArtboard = PlantModalArtboard;
window.ConfirmModalArtboard = ConfirmModalArtboard;
window.CommandPaletteArtboard = CommandPaletteArtboard;
