/* global React, Tree, I */
const { useState, useEffect } = React;

// =====================================================================
// Shared scaffolding for state showcases.
//
// Approach: every cell visually displays its labeled state at rest.
// Components are tagged with data-state="…" + .is-frozen so they don't
// re-style when the viewer's cursor passes over them — what you see
// is the state.
// =====================================================================

function ArtboardFrame({ children, theme = 'theme-dark', title, subtitle, padding = 28 }) {
  return (
    <div className={'gk-root ' + theme} style={{ padding, minHeight: '100%', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      <div className="gk-eyebrow" style={{ marginBottom: 4 }}>{title}</div>
      {subtitle && <div className="gk-h2" style={{ marginBottom: 22, fontSize: 18 }}>{subtitle}</div>}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

// One labelled cell. Pass the state name; everything inside is rendered
// frozen in that state so the viewer can read it without interacting.
function Cell({ label, children, center, style }) {
  return (
    <div className={'cs-cell ' + (center ? 'cs-cell-center' : '')} style={style}>
      <div className="cs-cell-label">{label}</div>
      <div className="cs-cell-stage">{children}</div>
    </div>
  );
}

function SectionHead({ title, hint, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, ...style }}>
      <div className="gk-eyebrow">{title}</div>
      {hint && <div className="gk-tiny" style={{ color: 'var(--foreground-subtle)' }}>{hint}</div>}
    </div>
  );
}

// =====================================================================
// 1. BUTTON STATES
// =====================================================================
function ButtonStatesArtboard() {
  const variants = [
    { key: 'primary',   className: 'gk-btn-primary',   label: 'Primary' },
    { key: 'secondary', className: 'gk-btn-secondary', label: 'Secondary' },
    { key: 'ghost',     className: 'gk-btn-ghost',     label: 'Ghost' },
    { key: 'danger',    className: 'gk-btn-danger',    label: 'Destructive' },
  ];
  const states = [
    { key: 'default',  ds: undefined,  label: 'default' },
    { key: 'hover',    ds: 'hover',    label: 'hover' },
    { key: 'pressed',  ds: 'active',   label: 'pressed' },
    { key: 'focus',    ds: 'focus',    label: 'focus' },
    { key: 'disabled', ds: 'disabled', label: 'disabled' },
    { key: 'loading',  ds: 'loading',  label: 'loading' },
  ];

  const renderBtn = (variant, state) => {
    if (variant.key === 'ghost' && state.key === 'loading') {
      // ghost loading is rare; show plain ghost
      return <button className={'gk-btn ' + variant.className + ' is-frozen'} disabled>—</button>;
    }
    const txt = variant.key === 'danger' ? 'Delete' : 'Plant tree';
    const icon = variant.key === 'danger' ? <I.Trash size={13} /> : <I.Plus size={13} />;
    return (
      <button className={'gk-btn ' + variant.className + ' is-frozen'} data-state={state.ds} disabled={state.key === 'disabled'}>
        {icon} {txt}
      </button>
    );
  };

  return (
    <ArtboardFrame title="Buttons" subtitle="States × variants">
      <SectionHead title="State matrix" hint="Each tile shows the variant frozen in that state." />
      <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(6, minmax(0,1fr))', gap: 10, marginBottom: 28, alignItems: 'stretch' }}>
        {/* Header row */}
        <div />
        {states.map(s => <div key={s.key} className="cs-cell-label" style={{ alignSelf: 'end', paddingBottom: 6 }}>{s.label}</div>)}
        {/* Variant rows */}
        {variants.map(v => (
          <React.Fragment key={v.key}>
            <div className="cs-label" style={{ alignSelf: 'center', fontWeight: 500, color: 'var(--foreground)' }}>{v.label}</div>
            {states.map(s => (
              <div key={s.key} className="cs-cell cs-cell-center" style={{ minHeight: 76, padding: 12 }}>
                {renderBtn(v, s)}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      <SectionHead title="Sizes" />
      <div className="cs-cell-grid cols-3">
        <Cell label="small" center><button className="gk-btn gk-btn-primary gk-btn-sm is-frozen"><I.Plus size={12} /> Small</button></Cell>
        <Cell label="default" center><button className="gk-btn gk-btn-primary is-frozen"><I.Plus size={13} /> Default</button></Cell>
        <Cell label="large" center><button className="gk-btn gk-btn-primary gk-btn-lg is-frozen"><I.Plus size={14} /> Large</button></Cell>
      </div>

      <SectionHead title="Content layouts" />
      <div className="cs-cell-grid cols-3">
        <Cell label="text only" center><button className="gk-btn gk-btn-primary is-frozen">Plant tree</button></Cell>
        <Cell label="icon · left" center><button className="gk-btn gk-btn-primary is-frozen"><I.Plus size={13} /> Plant tree</button></Cell>
        <Cell label="icon · right" center><button className="gk-btn gk-btn-primary is-frozen">Continue <I.ArrowRight size={13} /></button></Cell>
        <Cell label="icon both sides" center><button className="gk-btn gk-btn-primary is-frozen"><I.GitBranch size={13} /> Open PR <I.ChevronRight size={13} /></button></Cell>
        <Cell label="icon only" center><button className="gk-btn gk-btn-secondary gk-btn-icon is-frozen" title="Settings"><I.Settings size={14} /></button></Cell>
        <Cell label="success state" center><button className="gk-btn gk-btn-success is-frozen"><I.Check size={13} /> Saved</button></Cell>
      </div>

      <SectionHead title="Copy button — feedback states" hint="Each cell shows one frame of the click → flash → revert sequence." />
      <div className="cs-cell-grid cols-4">
        <Cell label="idle" center><button className="gk-btn gk-btn-secondary is-frozen"><I.Layers size={13} /> Copy</button></Cell>
        <Cell label="hover" center><button className="gk-btn gk-btn-secondary is-frozen" data-state="hover"><I.Layers size={13} /> Copy</button></Cell>
        <Cell label="copied (flash)" center>
          <button className="gk-btn gk-btn-secondary is-frozen" style={{ color: 'var(--status-success)', background: 'color-mix(in oklch, var(--status-success) 14%, var(--surface))', borderColor: 'color-mix(in oklch, var(--status-success) 30%, var(--border))' }}>
            <I.Check size={13} /> Copied
          </button>
        </Cell>
        <Cell label="error" center><button className="gk-btn gk-btn-secondary is-frozen" style={{ color: 'var(--status-danger)' }}><I.X size={13} /> Couldn't copy</button></Cell>
      </div>
    </ArtboardFrame>
  );
}

// =====================================================================
// 2. INPUT / TEXTAREA / SELECT / SEARCH STATES
// =====================================================================
function InputStatesArtboard() {
  return (
    <ArtboardFrame title="Inputs" subtitle="Text · select · textarea · search">
      <SectionHead title="Text input" hint="Each tile is the same field, frozen in a different state." />
      <div className="cs-cell-grid cols-3">
        <Cell label="default"><input className="gk-input is-frozen" placeholder="Branch name" defaultValue="" style={{ width: '100%' }} /></Cell>
        <Cell label="filled"><input className="gk-input is-frozen" defaultValue="feat/forest-overlays" style={{ width: '100%' }} /></Cell>
        <Cell label="hover"><input className="gk-input is-frozen" data-state="hover" defaultValue="feat/forest-overlays" style={{ width: '100%' }} /></Cell>
        <Cell label="focus"><input className="gk-input is-frozen" data-state="focus" defaultValue="feat/forest-overlays" style={{ width: '100%' }} /></Cell>
        <Cell label="success">
          <div style={{ width: '100%' }}>
            <input className="gk-input is-frozen" data-state="success" defaultValue="feat/valid-name" style={{ width: '100%' }} />
            <div className="gk-help is-success">Branch is available.</div>
          </div>
        </Cell>
        <Cell label="error">
          <div style={{ width: '100%' }}>
            <input className="gk-input is-frozen" data-state="error" defaultValue="feat/forest overlays" style={{ width: '100%' }} />
            <div className="gk-help is-error">Branch names cannot contain spaces.</div>
          </div>
        </Cell>
        <Cell label="disabled"><input className="gk-input is-frozen" disabled defaultValue="feat/locked-branch" style={{ width: '100%' }} /></Cell>
        <Cell label="read-only"><input className="gk-input is-frozen" readOnly defaultValue="main" style={{ width: '100%' }} /></Cell>
        <Cell label="loading"><input className="gk-input is-frozen" data-state="loading" defaultValue="resolving…" style={{ width: '100%' }} /></Cell>
      </div>

      <SectionHead title="Select" />
      <div className="cs-cell-grid cols-3">
        <Cell label="default">
          <select className="gk-select is-frozen" style={{ width: '100%' }}>
            <option>Choose provider…</option>
          </select>
        </Cell>
        <Cell label="value">
          <select className="gk-select is-frozen" style={{ width: '100%' }} defaultValue="claude">
            <option value="claude">Claude · Sonnet 4.5</option>
          </select>
        </Cell>
        <Cell label="hover">
          <select className="gk-select is-frozen" data-state="hover" style={{ width: '100%' }} defaultValue="claude">
            <option value="claude">Claude · Sonnet 4.5</option>
          </select>
        </Cell>
        <Cell label="focus">
          <select className="gk-select is-frozen" data-state="focus" style={{ width: '100%' }} defaultValue="claude">
            <option value="claude">Claude · Sonnet 4.5</option>
          </select>
        </Cell>
        <Cell label="disabled">
          <select className="gk-select is-frozen" disabled style={{ width: '100%' }} defaultValue="claude">
            <option value="claude">Claude · Sonnet 4.5</option>
          </select>
        </Cell>
        <Cell label="error">
          <div style={{ width: '100%' }}>
            <select className="gk-select is-frozen" data-state="error" defaultValue="" style={{ width: '100%' }}>
              <option value="">No provider configured</option>
            </select>
            <div className="gk-help is-error">Add a provider in Settings.</div>
          </div>
        </Cell>
      </div>

      <SectionHead title="Select — open" />
      <div style={{ marginBottom: 28 }}>
        <SelectOpenExample />
      </div>

      <SectionHead title="Textarea" />
      <div className="cs-cell-grid cols-2">
        <Cell label="default"><textarea className="gk-textarea is-frozen" rows={3} placeholder="Describe the change…" style={{ width: '100%' }} /></Cell>
        <Cell label="focus"><textarea className="gk-textarea is-frozen" data-state="focus" rows={3} defaultValue="Surface session failures and PR review state directly above each tree." style={{ width: '100%' }} /></Cell>
        <Cell label="error">
          <div style={{ width: '100%' }}>
            <textarea className="gk-textarea is-frozen" data-state="error" rows={2} defaultValue="" style={{ width: '100%' }} />
            <div className="gk-help is-error">Description is required.</div>
          </div>
        </Cell>
        <Cell label="disabled"><textarea className="gk-textarea is-frozen" disabled rows={3} defaultValue="Locked while session running" style={{ width: '100%' }} /></Cell>
      </div>

      <SectionHead title="Search field with results" />
      <div className="cs-cell-grid cols-3" style={{ alignItems: 'start' }}>
        <Cell label="rest" style={{ minHeight: 80 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <I.Search size={13} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--foreground-subtle)' }} />
            <input className="gk-input is-frozen" style={{ paddingLeft: 30, width: '100%' }} placeholder="Search issues, branches…" />
          </div>
        </Cell>
        <Cell label="typing + results" style={{ minHeight: 220 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <I.Search size={13} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--primary)' }} />
            <input className="gk-input is-frozen" data-state="focus" style={{ paddingLeft: 30, width: '100%' }} defaultValue="forest" readOnly />
            <div className="gk-search-results" style={{ position: 'relative', marginTop: 6 }}>
              <div className="gk-popover-label">Issues</div>
              <div className="gk-search-result is-frozen" data-state="active"><I.Trees size={12} /> #118 · Forest view overlays <span className="gk-kbd">↵</span></div>
              <div className="gk-search-result is-frozen"><I.Trees size={12} /> #128 · Forest tag centering</div>
              <div className="gk-popover-label">Branches</div>
              <div className="gk-search-result is-frozen"><I.GitBranch size={12} /> feat/forest-overlays</div>
            </div>
          </div>
        </Cell>
        <Cell label="no results" style={{ minHeight: 220 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <I.Search size={13} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--foreground-subtle)' }} />
            <input className="gk-input is-frozen" data-state="focus" defaultValue="qqzzqz" style={{ paddingLeft: 30, width: '100%' }} readOnly />
            <div className="gk-search-results" style={{ position: 'relative', marginTop: 6, padding: 18, textAlign: 'center' }}>
              <div className="gk-tiny" style={{ color: 'var(--foreground-subtle)' }}>No matches for "qqzzqz".</div>
            </div>
          </div>
        </Cell>
      </div>
    </ArtboardFrame>
  );
}

function SelectOpenExample() {
  return (
    <div style={{ position: 'relative', width: 280 }}>
      <button className="gk-input is-frozen" data-state="focus" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'default', textAlign: 'left', width: '100%' }}>
        <span>Claude · Sonnet 4.5</span>
        <I.Chevron size={13} />
      </button>
      <div className="gk-popover" style={{ position: 'absolute', top: 36, left: 0, right: 0, zIndex: 5 }}>
        <div className="gk-popover-item is-frozen" data-state="active"><I.Check size={11} /> Claude · Sonnet 4.5</div>
        <div className="gk-popover-item is-frozen" data-state="hover"><span style={{ width: 11 }} /> Claude · Haiku 4.5</div>
        <div className="gk-popover-item is-frozen"><span style={{ width: 11 }} /> Codex · gpt-5</div>
        <div className="gk-popover-item is-frozen"><span style={{ width: 11 }} /> Cursor · auto</div>
      </div>
    </div>
  );
}

// =====================================================================
// 3. CHECKBOX / RADIO / TOGGLE STATES
// =====================================================================
function SelectionStatesArtboard() {
  return (
    <ArtboardFrame title="Selection controls" subtitle="Checkbox · radio · toggle">
      <SectionHead title="Checkbox" />
      <div className="cs-cell-grid cols-4">
        <Cell label="unchecked" center><input type="checkbox" className="gk-check is-frozen" /></Cell>
        <Cell label="checked" center><input type="checkbox" className="gk-check is-frozen" defaultChecked /></Cell>
        <Cell label="indeterminate" center><input type="checkbox" className="gk-check is-frozen" data-state="indeterminate" /></Cell>
        <Cell label="hover" center><input type="checkbox" className="gk-check is-frozen" data-state="hover" /></Cell>
        <Cell label="focus" center><input type="checkbox" className="gk-check is-frozen" data-state="focus" defaultChecked /></Cell>
        <Cell label="disabled" center><input type="checkbox" className="gk-check is-frozen" disabled /></Cell>
        <Cell label="disabled + checked" center><input type="checkbox" className="gk-check is-frozen" disabled defaultChecked /></Cell>
        <Cell label="with label" center>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
            <input type="checkbox" className="gk-check is-frozen" defaultChecked /> Auto-create worktree
          </label>
        </Cell>
      </div>

      <SectionHead title="Radio" />
      <div className="cs-cell-grid cols-4">
        <Cell label="rest" center><input type="radio" className="gk-radio is-frozen" /></Cell>
        <Cell label="selected" center><input type="radio" className="gk-radio is-frozen" defaultChecked /></Cell>
        <Cell label="hover" center><input type="radio" className="gk-radio is-frozen" data-state="hover" /></Cell>
        <Cell label="focus" center><input type="radio" className="gk-radio is-frozen" data-state="focus" defaultChecked /></Cell>
        <Cell label="disabled" center><input type="radio" className="gk-radio is-frozen" disabled /></Cell>
        <Cell label="disabled + selected" center><input type="radio" className="gk-radio is-frozen" disabled defaultChecked /></Cell>
        <Cell label="group" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}><input type="radio" className="gk-radio is-frozen" defaultChecked name="prov-grp" /> Claude</label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}><input type="radio" className="gk-radio is-frozen" name="prov-grp" /> Codex</label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}><input type="radio" className="gk-radio is-frozen" name="prov-grp" /> Cursor</label>
          </div>
        </Cell>
      </div>

      <SectionHead title="Toggle" />
      <div className="cs-cell-grid cols-4">
        <Cell label="off" center><span className="gk-toggle" data-on="false" /></Cell>
        <Cell label="on" center><span className="gk-toggle" data-on="true" /></Cell>
        <Cell label="hover · off" center><span className="gk-toggle" data-state="hover" data-on="false" /></Cell>
        <Cell label="hover · on" center><span className="gk-toggle" data-state="hover" data-on="true" /></Cell>
        <Cell label="focus · on" center><span className="gk-toggle" data-state="focus" data-on="true" /></Cell>
        <Cell label="disabled · off" center><span className="gk-toggle" data-state="disabled" data-on="false" /></Cell>
        <Cell label="disabled · on" center><span className="gk-toggle" data-state="disabled" data-on="true" /></Cell>
        <Cell label="with label" center>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="gk-toggle" data-on="true" />
            <span className="gk-small">Auto-fetch</span>
          </div>
        </Cell>
      </div>
    </ArtboardFrame>
  );
}

// =====================================================================
// 4. TABS / SEGMENTED CONTROL STATES
//    One tab strip showing all states side-by-side. We don't repeat the
//    whole strip per active option — that adds nothing.
// =====================================================================
function TabsStatesArtboard() {
  return (
    <ArtboardFrame title="Tabs & segmented control" subtitle="States and configurations">
      <SectionHead title="Tabs — every state on one strip" hint="Each tab demonstrates a different state." />
      <div className="cs-cell-grid cols-1" style={{ gridTemplateColumns: '1fr', marginBottom: 28 }}>
        <Cell label="states">
          <div className="gk-tabs">
            <button className="gk-tab is-frozen">default</button>
            <button className="gk-tab is-frozen" data-state="hover">hover</button>
            <button className="gk-tab is-active is-frozen">active</button>
            <button className="gk-tab is-frozen" data-state="focus">focus</button>
            <button className="gk-tab is-frozen" disabled>disabled</button>
          </div>
        </Cell>
      </div>

      <SectionHead title="Segmented (view switcher)" hint="The list / kanban / forest control." />
      <div className="cs-cell-grid cols-2">
        <Cell label="rest · list active">
          <div className="gk-tabs">
            <button className="gk-tab is-active is-frozen"><I.List size={11} /> List</button>
            <button className="gk-tab is-frozen"><I.Kanban size={11} /> Kanban</button>
            <button className="gk-tab is-frozen"><I.Trees size={11} /> Forest</button>
          </div>
        </Cell>
        <Cell label="hover on inactive">
          <div className="gk-tabs">
            <button className="gk-tab is-active is-frozen"><I.List size={11} /> List</button>
            <button className="gk-tab is-frozen" data-state="hover"><I.Kanban size={11} /> Kanban</button>
            <button className="gk-tab is-frozen"><I.Trees size={11} /> Forest</button>
          </div>
        </Cell>
        <Cell label="focus on inactive">
          <div className="gk-tabs">
            <button className="gk-tab is-active is-frozen"><I.List size={11} /> List</button>
            <button className="gk-tab is-frozen"><I.Kanban size={11} /> Kanban</button>
            <button className="gk-tab is-frozen" data-state="focus"><I.Trees size={11} /> Forest</button>
          </div>
        </Cell>
        <Cell label="disabled tab">
          <div className="gk-tabs">
            <button className="gk-tab is-active is-frozen"><I.List size={11} /> List</button>
            <button className="gk-tab is-frozen"><I.Kanban size={11} /> Kanban</button>
            <button className="gk-tab is-frozen" disabled><I.Trees size={11} /> Forest</button>
          </div>
        </Cell>
      </div>

      <SectionHead title="Configurations" />
      <div className="cs-cell-grid cols-2">
        <Cell label="with badge">
          <div className="gk-tabs">
            <button className="gk-tab is-active is-frozen">Inbox <span className="gk-badge gk-badge-moss" style={{ marginLeft: 6 }}>3</span></button>
            <button className="gk-tab is-frozen">Drafts</button>
            <button className="gk-tab is-frozen">Archive</button>
          </div>
        </Cell>
        <Cell label="with icon">
          <div className="gk-tabs">
            <button className="gk-tab is-active is-frozen"><I.Code size={11} /> Chat</button>
            <button className="gk-tab is-frozen"><I.GitMerge size={11} /> Diff</button>
            <button className="gk-tab is-frozen"><I.Terminal size={11} /> Terminal</button>
          </div>
        </Cell>
      </div>
    </ArtboardFrame>
  );
}

// =====================================================================
// 5. ISSUE CARD — all states + sizes
// =====================================================================
function IssueCardStatesArtboard() {
  return (
    <ArtboardFrame title="Issue card" subtitle="States × sizes — the atom of every list and kanban view">
      <SectionHead title="Comfortable size — interaction states" />
      <div className="cs-cell-grid cols-2">
        <CardCell state="default" label="default" />
        <CardCell state="hover" label="hover" />
        <CardCell state="selected" label="selected" />
        <CardCell state="focus" label="focus (keyboard)" />
        <CardCell state="dragging" label="dragging" />
        <CardCell state="loading" label="loading (skeleton overlay)" />
        <CardCell state="error" label="error · session failed" tone="danger" status="branch missing" />
        <CardCell state="success" label="success · just merged" tone="success" status="merged" />
        <CardCell state="archived" label="archived" />
        <CardCell state="disabled" label="disabled / locked" />
      </div>

      <SectionHead title="Compact size — kanban-friendly" />
      <div className="cs-cell-grid cols-3">
        <CompactCell state="default" label="default" />
        <CompactCell state="hover" label="hover" />
        <CompactCell state="selected" label="selected" />
        <CompactCell state="dragging" label="dragging" />
        <CompactCell state="error" label="error" />
        <CompactCell state="archived" label="archived" />
      </div>

      <SectionHead title="Size variants" />
      <div className="cs-cell-grid cols-3" style={{ alignItems: 'start' }}>
        <Cell label="compact"><CompactCard state="default" /></Cell>
        <Cell label="comfortable"><Card state="default" /></Cell>
        <Cell label="spacious"><SpaciousCard /></Cell>
      </div>
    </ArtboardFrame>
  );
}

function CardCell({ state, label, tone, status }) {
  return <Cell label={label}><Card state={state} tone={tone} status={status} /></Cell>;
}
function CompactCell({ state, label }) {
  return <Cell label={label}><CompactCard state={state} /></Cell>;
}

function Card({ state, tone, status }) {
  const stateAttr = state === 'default' ? undefined : state;
  return (
    <div className="gk-card is-frozen" data-state={stateAttr} style={{ padding: 14, display: 'grid', gridTemplateColumns: '92px 1fr', gap: 12, alignItems: 'center', cursor: state === 'dragging' ? 'grabbing' : 'default', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 92, width: 92, background: 'linear-gradient(180deg, color-mix(in oklch, var(--surface-2) 60%, transparent), transparent)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ transform: 'translateY(20px)', display: 'flex' }}>
          <Tree stage={tone === 'danger' ? 'dead' : tone === 'success' ? 'bare' : 'growing'} shape="oak" size={92} seed={(state || 'd').length + 3} showGround={false} />
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <div className="gk-h3" style={{ fontSize: 13.5, lineHeight: 1.3 }}>Add forest view overlays</div>
          <button className="gk-btn gk-btn-ghost gk-btn-icon gk-btn-sm is-frozen" tabIndex={-1}><I.More size={12} /></button>
        </div>
        <div className="font-mono gk-tiny" style={{ marginBottom: 8 }}>#118 · feat/forest-overlays</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <span className={'gk-badge ' + (tone === 'danger' ? 'gk-badge-danger' : tone === 'success' ? 'gk-badge-success' : 'gk-badge-moss')}>
            {!tone && <span className="gk-badge-dot gk-pulse" />}
            {status || (tone === 'danger' ? 'failed' : tone === 'success' ? 'merged' : 'session running')}
          </span>
          <span className="gk-badge">feature</span>
        </div>
      </div>
    </div>
  );
}

function CompactCard({ state }) {
  const stateAttr = state === 'default' ? undefined : state;
  return (
    <div className="gk-card is-frozen" data-state={stateAttr} style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
      <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Tree stage={state === 'error' ? 'dead' : state === 'archived' ? 'stump' : 'growing'} shape="oak" size={44} seed={(state || 'd').length + 9} showGround={false} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Forest view overlays</div>
        <div className="font-mono gk-tiny">#118</div>
      </div>
    </div>
  );
}

function SpaciousCard() {
  return (
    <div className="gk-card is-frozen" style={{ padding: 16, display: 'grid', gridTemplateColumns: '110px 1fr', gap: 14, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 110, background: 'linear-gradient(180deg, color-mix(in oklch, var(--surface-2) 60%, transparent), transparent)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ transform: 'translateY(24px)' }}><Tree stage="fruiting" shape="maple" fruitCount={3} fruitType="apple" size={110} seed={42} showGround={false} /></div>
      </div>
      <div>
        <div className="gk-h3" style={{ fontSize: 14 }}>Add forest view overlays</div>
        <div className="font-mono gk-tiny" style={{ margin: '4px 0 8px' }}>#118 · feat/forest-overlays</div>
        <div className="gk-small" style={{ marginBottom: 10 }}>Surface session failures and PR review state directly above each tree.</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <span className="gk-badge gk-badge-info">PR draft · 2 commits</span>
          <span className="gk-badge">feature</span>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// 6. TREE COMPONENT
// =====================================================================
function TreeStatesArtboard() {
  const stages = ['seed', 'sprouting', 'sapling', 'growing', 'leafy', 'fruiting', 'flowering', 'seasonal', 'bare', 'dead', 'stump'];
  return (
    <ArtboardFrame title="Tree component" subtitle="Stages · sizes · interaction states · health · accessories">
      <SectionHead title="Life stages" />
      <div className="cs-cell-grid cols-6" style={{ marginBottom: 28 }}>
        {stages.map((s, i) => (
          <Cell key={s} label={s} center>
            <Tree stage={s} shape={['oak','maple','birch','baobab','fir'][i % 5]} season={s === 'seasonal' ? 'autumn' : 'summer'} fruitCount={s === 'fruiting' ? 3 : 0} fruitType="apple" size={84} seed={i + 5} glow={s === 'flowering'} />
          </Cell>
        ))}
      </div>

      <SectionHead title="Sizes" />
      <div className="cs-cell-grid cols-3">
        <Cell label="sm · 64" center><Tree stage="growing" shape="oak" size={64} seed={1} /></Cell>
        <Cell label="md · 120" center><Tree stage="growing" shape="oak" size={120} seed={1} /></Cell>
        <Cell label="lg · 180" center><Tree stage="growing" shape="oak" size={180} seed={1} /></Cell>
      </div>

      <SectionHead title="Interaction states" />
      <div className="cs-cell-grid cols-4">
        <Cell label="rest" center><Tree stage="growing" shape="oak" size={110} seed={4} /></Cell>
        <Cell label="hover" center>
          <div style={{ filter: 'brightness(1.1) drop-shadow(0 4px 14px color-mix(in oklch, var(--moss-300) 50%, transparent))' }}>
            <Tree stage="growing" shape="oak" size={110} seed={4} />
          </div>
        </Cell>
        <Cell label="selected" center style={{ borderColor: 'var(--primary)', borderWidth: 2 }}>
          <Tree stage="growing" shape="oak" size={110} seed={4} />
        </Cell>
        <Cell label="focus" center style={{ outline: '2px solid var(--ring)', outlineOffset: -2 }}>
          <Tree stage="growing" shape="oak" size={110} seed={4} />
        </Cell>
      </div>

      <SectionHead title="Health overlays" />
      <div className="cs-cell-grid cols-3">
        <Cell label="healthy" center><Tree stage="leafy" shape="oak" size={110} seed={7} /></Cell>
        <Cell label="struggling" center>
          <div style={{ filter: 'saturate(0.5) brightness(0.85)' }}><Tree stage="leafy" shape="oak" size={110} seed={7} /></div>
        </Cell>
        <Cell label="blighted" center>
          <div style={{ filter: 'saturate(0.2) brightness(0.65) sepia(0.3)' }}><Tree stage="leafy" shape="oak" size={110} seed={7} /></div>
        </Cell>
      </div>

      <SectionHead title="Accessories" />
      <div className="cs-cell-grid cols-4">
        <Cell label="no tag" center><Tree stage="growing" shape="oak" size={110} seed={2} /></Cell>
        <Cell label="with name tag" center>
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <Tree stage="growing" shape="oak" size={110} seed={2} />
            <div className="font-mono gk-tiny" style={{ marginTop: 2 }}>#128 kanban dnd</div>
          </div>
        </Cell>
        <Cell label="with fruit badge" center>
          <div style={{ position: 'relative' }}>
            <Tree stage="fruiting" shape="maple" fruitCount={5} fruitType="apple" size={110} seed={3} />
            <span className="gk-badge gk-badge-amber" style={{ position: 'absolute', top: 6, right: 6 }}>5</span>
          </div>
        </Cell>
        <Cell label="with status bubble" center>
          <div style={{ position: 'relative', width: 110 }}>
            <span className="gk-bob" style={{ position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)', background: 'color-mix(in oklch, var(--moss-500) 80%, transparent)', color: '#fff', padding: '3px 7px', borderRadius: 999, fontSize: 10.5, display: 'inline-flex', alignItems: 'center', gap: 4, zIndex: 2 }}>
              <I.Drop size={10} /> running
            </span>
            <Tree stage="growing" shape="oak" size={110} seed={2} />
          </div>
        </Cell>
      </div>
    </ArtboardFrame>
  );
}

// =====================================================================
// 7. SIDEBAR NAV ITEM
// =====================================================================
function SidebarItemStatesArtboard() {
  return (
    <ArtboardFrame title="Sidebar nav item" subtitle="States × variants — expanded and collapsed">
      <SectionHead title="Expanded — every state" />
      <div className="cs-cell-grid cols-3">
        <SbCell label="default" icon={<I.Trees size={14} />} text="Forest" state="default" />
        <SbCell label="hover" icon={<I.List size={14} />} text="Issues" state="hover" />
        <SbCell label="active" icon={<I.Kanban size={14} />} text="Kanban" state="active" />
        <SbCell label="active + hover" icon={<I.Activity size={14} />} text="Sessions" state="active-hover" />
        <SbCell label="focus" icon={<I.GitBranch size={14} />} text="Branches" state="focus" />
        <SbCell label="disabled" icon={<I.Box size={14} />} text="Archive" state="disabled" />
        <SbCell label="with badge · default" icon={<I.Bell size={14} />} text="Inbox" state="default" badge={3} />
        <SbCell label="with badge · active" icon={<I.Bell size={14} />} text="Inbox" state="active" badge={12} />
        <SbCell label="nested · active" icon={<I.Folder size={14} />} text="low-poly-trees" state="active" nested />
      </div>

      <SectionHead title="Collapsed — icon-only" hint="On hover, a tooltip shows the label." />
      <div className="cs-cell-grid cols-6">
        <Cell label="default" center><SbCollapsed icon={<I.Trees size={16} />} state="default" /></Cell>
        <Cell label="hover" center><SbCollapsed icon={<I.List size={16} />} state="hover" /></Cell>
        <Cell label="active" center><SbCollapsed icon={<I.Kanban size={16} />} state="active" /></Cell>
        <Cell label="badge" center><SbCollapsed icon={<I.Bell size={16} />} state="default" badge /></Cell>
        <Cell label="focus" center><SbCollapsed icon={<I.GitBranch size={16} />} state="focus" /></Cell>
        <Cell label="disabled" center><SbCollapsed icon={<I.Box size={16} />} state="disabled" /></Cell>
      </div>
    </ArtboardFrame>
  );
}

function SbCell({ label, icon, text, state, badge, nested }) {
  return (
    <Cell label={label}>
      <div style={{ background: 'var(--sidebar-bg)', padding: 6, borderRadius: 8, width: '100%' }}>
        <SbExp icon={icon} text={text} state={state} badge={badge} nested={nested} />
      </div>
    </Cell>
  );
}

function SbExp({ icon, text, state, badge, nested }) {
  const isActive = state === 'active' || state === 'active-hover';
  const stateAttr = (state === 'hover' || state === 'focus' || state === 'active-hover' || state === 'disabled') ? state : undefined;
  return (
    <div className={'sb-item is-frozen ' + (isActive ? 'is-active' : '')} data-state={stateAttr} style={{
      display: 'flex', alignItems: 'center', gap: 9, padding: nested ? '6px 10px 6px 28px' : '7px 10px',
      borderRadius: 7, fontSize: 13, color: isActive ? 'var(--foreground)' : 'var(--sidebar-fg)',
      background: isActive ? (state === 'active-hover' ? 'color-mix(in oklch, var(--primary-soft) 60%, var(--surface-2))' : 'var(--primary-soft)') : (state === 'hover' ? 'var(--surface-2)' : 'transparent'),
      cursor: 'pointer', position: 'relative',
      outline: state === 'focus' ? '2px solid var(--ring)' : undefined, outlineOffset: state === 'focus' ? -2 : undefined,
      opacity: state === 'disabled' ? 0.4 : 1,
    }}>
      <span style={{ color: isActive ? 'var(--primary)' : 'inherit' }}>{icon}</span>
      <span style={{ flex: 1 }}>{text}</span>
      {badge && <span className="gk-badge gk-badge-moss" style={{ height: 16, padding: '0 5px', fontSize: 10 }}>{badge}</span>}
    </div>
  );
}

function SbCollapsed({ icon, state, badge }) {
  const isActive = state === 'active';
  return (
    <div className={'sb-item is-frozen ' + (isActive ? 'is-active' : '')} data-state={(state === 'hover' || state === 'focus' || state === 'disabled') ? state : undefined} style={{
      width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: isActive ? 'var(--primary)' : 'var(--sidebar-fg)',
      background: isActive ? 'var(--primary-soft)' : (state === 'hover' ? 'var(--surface-2)' : 'transparent'),
      cursor: 'pointer', position: 'relative',
      outline: state === 'focus' ? '2px solid var(--ring)' : undefined,
      opacity: state === 'disabled' ? 0.4 : 1,
    }}>
      {icon}
      {badge && <span style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: 999, background: 'var(--primary)' }} />}
    </div>
  );
}

// =====================================================================
// 8. COLOR SWATCH
// =====================================================================
function ColorSwatchArtboard() {
  return (
    <ArtboardFrame title="Color swatch" subtitle="Three sizes — for issue presets, theme settings, full token rows">
      <SectionHead title="Inline chips — issue color presets" />
      <div className="cs-cell-grid cols-4">
        <Cell label="rest" center>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            <SwatchChip name="Moss" color="var(--moss-500)" />
            <SwatchChip name="Amber" color="var(--amber-500)" />
            <SwatchChip name="Bark" color="var(--bark-500)" />
          </div>
        </Cell>
        <Cell label="hover" center><SwatchChip name="Moss" color="var(--moss-500)" state="hover" /></Cell>
        <Cell label="selected" center><SwatchChip name="Amber" color="var(--amber-500)" state="selected" /></Cell>
        <Cell label="focus" center><SwatchChip name="Bark" color="var(--bark-500)" state="focus" /></Cell>
        <Cell label="disabled" center><SwatchChip name="Slate" color="var(--surface-3)" state="disabled" /></Cell>
        <Cell label="full row" style={{ gridColumn: 'span 3' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              ['Moss', 'var(--moss-500)'], ['Amber', 'var(--amber-500)'], ['Bark', 'var(--bark-500)'],
              ['Sky', 'oklch(0.660 0.105 220)'], ['Rose', 'oklch(0.660 0.180 15)'], ['Lilac', 'oklch(0.660 0.150 300)'],
              ['Slate', 'oklch(0.500 0.020 240)'], ['Sand', 'oklch(0.760 0.040 80)'],
            ].map(([n, c]) => <SwatchChip key={n} name={n} color={c} />)}
          </div>
        </Cell>
      </div>

      <SectionHead title="Card swatch — theme accent picker" />
      <div className="cs-cell-grid cols-4">
        <Cell label="default" center><SwatchCard name="Amber" color="var(--amber-500)" hex="#c98a2a" /></Cell>
        <Cell label="hover" center><SwatchCard name="Bark" color="var(--bark-500)" hex="#7a5b3b" state="hover" /></Cell>
        <Cell label="selected" center><SwatchCard name="Moss" color="var(--moss-500)" hex="#5d8c44" selected /></Cell>
        <Cell label="focus" center><SwatchCard name="Sky" color="oklch(0.660 0.105 220)" hex="#5b94c2" state="focus" /></Cell>
      </div>

      <SectionHead title="Token row — full design-system reference" />
      <div className="gk-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SwatchRow name="background" desc="Page background" lightHex="#f8f7f1" darkHex="#181c19" />
        <SwatchRow name="surface" desc="Cards, popovers" lightHex="#ffffff" darkHex="#1d2820" />
        <SwatchRow name="foreground" desc="Default text" lightHex="#1d271a" darkHex="#f0eee9" />
        <SwatchRow name="primary" desc="Brand · CTA · selected" lightHex="#3f6332" darkHex="#a8d18e" />
        <SwatchRow name="border" desc="Divider · input border" lightHex="#dfe3d7" darkHex="#384538" />
        <SwatchRow name="status-danger" desc="Errors · destructive" lightHex="#c14c34" darkHex="#e6664c" last />
      </div>
    </ArtboardFrame>
  );
}

function SwatchChip({ name, color, state }) {
  const isSelected = state === 'selected';
  return (
    <button className="is-frozen" data-state={state === 'hover' || state === 'focus' || state === 'disabled' ? state : undefined} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 4px',
      background: state === 'hover' ? 'var(--surface-2)' : 'var(--surface)',
      border: '1px solid ' + (isSelected ? 'var(--primary)' : 'var(--border)'),
      boxShadow: isSelected ? '0 0 0 3px color-mix(in oklch, var(--primary) 20%, transparent)' : undefined,
      borderRadius: 999, fontSize: 12, color: 'var(--foreground)',
      cursor: state === 'disabled' ? 'not-allowed' : 'pointer',
      opacity: state === 'disabled' ? 0.5 : 1,
      outline: state === 'focus' ? '2px solid var(--ring)' : undefined, outlineOffset: state === 'focus' ? 2 : undefined,
    }}>
      <span style={{ width: 16, height: 16, borderRadius: '50%', background: color, border: '1px solid color-mix(in oklch, ' + color + ' 70%, black)' }} />
      {name}
      {isSelected && <I.Check size={10} style={{ color: 'var(--primary)' }} />}
    </button>
  );
}

function SwatchCard({ name, color, hex, selected, state }) {
  return (
    <div className="gk-card is-frozen" data-state={state} style={{ padding: 10, cursor: 'pointer', border: selected ? '1.5px solid var(--primary)' : undefined, boxShadow: selected ? '0 0 0 3px color-mix(in oklch, var(--primary) 18%, transparent)' : (state === 'focus' ? '0 0 0 2px var(--ring)' : undefined), width: '100%' }}>
      <div style={{ height: 56, borderRadius: 6, background: color, marginBottom: 8 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{name}{selected && <I.Check size={10} style={{ marginLeft: 4, color: 'var(--primary)' }} />}</div>
        <div className="font-mono gk-tiny">{hex}</div>
      </div>
    </div>
  );
}

function SwatchRow({ name, desc, lightHex, darkHex, last }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '32px 32px 1fr auto auto auto',
      gap: 10, alignItems: 'center', padding: '10px 14px',
      borderBottom: last ? 'none' : '1px solid var(--border)',
    }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: lightHex, border: '1px solid var(--border)' }} />
      <div style={{ width: 28, height: 28, borderRadius: 6, background: darkHex, border: '1px solid var(--border)' }} />
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>--{name}</div>
        <div className="gk-tiny" style={{ color: 'var(--foreground-subtle)' }}>{desc}</div>
      </div>
      <div className="font-mono gk-tiny" style={{ color: 'var(--foreground-muted)' }}>L {lightHex}</div>
      <div className="font-mono gk-tiny" style={{ color: 'var(--foreground-muted)' }}>D {darkHex}</div>
      <button className="gk-btn gk-btn-ghost gk-btn-sm is-frozen"><I.Layers size={12} /> copy</button>
    </div>
  );
}

window.ButtonStatesArtboard = ButtonStatesArtboard;
window.InputStatesArtboard = InputStatesArtboard;
window.SelectionStatesArtboard = SelectionStatesArtboard;
window.TabsStatesArtboard = TabsStatesArtboard;
window.IssueCardStatesArtboard = IssueCardStatesArtboard;
window.TreeStatesArtboard = TreeStatesArtboard;
window.SidebarItemStatesArtboard = SidebarItemStatesArtboard;
window.ColorSwatchArtboard = ColorSwatchArtboard;
