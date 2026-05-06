/* Grovekeeper Issue Card — Banner variant (V1)
   Shared component used by the states showcase page.
   Globals expected: React, I (icons), Tree */

/* ─── 24-color palette from color_utils.ts ────────────────── */
const ISSUE_PALETTE = [
  '#e53e3e','#dd6b20','#d69e2e','#38a169','#3182ce','#805ad5',
  '#9b2c2c','#9c4221','#975a16','#276749','#2c5282','#553c9a',
  '#fc8181','#f6ad55','#f6e05e','#68d391','#63b3ed','#b794f4',
  '#1a202c','#ffffff','#a0aec0','#319795','#ed64a6','#8b5e3c',
];

const PALETTE_ROWS = [
  { label: 'Normal',  colors: ISSUE_PALETTE.slice(0, 6) },
  { label: 'Dark',    colors: ISSUE_PALETTE.slice(6, 12) },
  { label: 'Light',   colors: ISSUE_PALETTE.slice(12, 18) },
  { label: 'Special', colors: ISSUE_PALETTE.slice(18, 24) },
];

/* ─── Contrast helpers (matches color_utils.ts exactly) ────── */
function icRelLum(hex) {
  const m = hex.replace('#','');
  const r = parseInt(m.slice(0,2),16) / 255;
  const g = parseInt(m.slice(2,4),16) / 255;
  const b = parseInt(m.slice(4,6),16) / 255;
  const f = c => c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
  return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
}
/* Threshold 0.2126 — matches codebase so saturated red gets white text */
function icContrastText(hex) { return icRelLum(hex) > 0.2126 ? '#000000' : '#ffffff'; }
function icTextMode(hex) { return icRelLum(hex) > 0.2126 ? 'dark' : 'light'; }
function pickShape(seed) { return ['oak','maple','birch','baobab'][seed % 4]; }

/* ─── Badge sub-components ─────────────────────────────────── */
function PRBadge({ state }) {
  const cfg = {
    open:              { tone: 'is-success', label: 'PR open' },
    draft:             { tone: 'is-info',    label: 'PR draft' },
    'review-requested':{ tone: 'is-warn',    label: 'review' },
    approved:          { tone: 'is-amber',   label: 'approved' },
    merged:            { tone: 'is-purple',  label: 'merged' },
    closed:            { tone: 'is-danger',  label: 'closed' },
    'ready-to-merge':  { tone: 'is-amber',   label: 'ready' },
  }[state] || { tone: '', label: 'pr' };
  return React.createElement('span', { className: `ic-mini-badge ${cfg.tone}` },
    React.createElement(I.GitPull, { size: 10, sw: 1.8 }),
    cfg.label
  );
}

function IssueStateBadge({ state, num }) {
  const isOpen = state === 'open';
  return React.createElement('span', { className: `ic-mini-badge ${isOpen ? 'is-success' : 'is-purple'}` },
    React.createElement('span', { className: 'ic-dot' }),
    `#${num}`
  );
}

function BranchStatusBadge({ status }) {
  const map = {
    active:       { tone: 'is-moss',   label: 'active' },
    'local-only': { tone: 'is-info',   label: 'local' },
    'remote-gone':{ tone: 'is-warn',   label: 'remote gone' },
    deleted:      { tone: 'is-danger', label: 'deleted' },
  };
  const c = map[status]; if (!c) return null;
  return React.createElement('span', { className: `ic-mini-badge ${c.tone}` },
    React.createElement(I.GitBranch, { size: 9, sw: 1.8 }),
    c.label
  );
}

function SyncBadge({ behind }) {
  if (!behind) return null;
  return React.createElement('span', { className: 'ic-mini-badge is-warn' },
    React.createElement(I.Refresh, { size: 9, sw: 1.8 }),
    `${behind} behind`
  );
}

function ConflictBadge({ on }) {
  if (!on) return null;
  return React.createElement('span', { className: 'ic-mini-badge is-danger' },
    React.createElement(I.AlertTriangle, { size: 9, sw: 1.8 }),
    'conflict'
  );
}

function LabelPill({ name, color }) {
  return React.createElement('span', { className: 'ic-label-pill', style: { '--lbl': color } }, name);
}

/* ═══════════════════════════════════════════════════════════
   ISSUE CARD — BANNER VARIANT
   ═══════════════════════════════════════════════════════════ */
function IssueCard({
  color = '#525252', name, num, branch, state = 'open', stage = 'leafy',
  pr, priority, labels = [], childCount = 0, behind = 0,
  branchStatus, conflict, notify, fruitCount = 0, season = 'summer', glow = false,
  seed = 1, noWorktree = false,
  /* ── State overrides ── */
  cardState = null,       // null | 'hover' | 'selected' | 'active' | 'multi-selected' | 'selection-ready' | 'dragging' | 'loading' | 'archived' | 'error' | 'disabled'
  showActions = false,    // legacy — actions are now always visible
}) {
  const fg = icContrastText(color);
  const mode = icTextMode(color);
  const shape = pickShape(seed);

  const cls = ['ic-card'];
  if (cardState) cls.push(`is-${cardState}`);

  const hasWorktree = !noWorktree && !!branch;
  const qaDisabledStyle = { opacity: 0.35 };
  const qaStyle = hasWorktree ? {} : qaDisabledStyle;

  return (
    React.createElement('div', {
      className: cls.join(' '),
      style: { '--ic': color, '--ic-fg': fg },
      'data-text-color': mode,
      'data-state': cardState || undefined,
    },
      /* Header band */
      React.createElement('div', { className: 'ic-header' },
        React.createElement('div', { className: 'ic-header-left' },
          React.createElement('a', { className: 'ic-num', href: `https://github.com/org/repo/issues/${num}`, onClick: e => e.preventDefault(), title: `Open issue #${num} on GitHub` }, `#${num}`),
          React.createElement('span', { className: 'ic-name' }, name),
        ),
        React.createElement('div', { className: 'ic-header-right' },
          childCount > 0 && React.createElement('span', { className: 'ic-child-chip' },
            React.createElement(I.Layers, { size: 10, sw: 1.8 }),
            childCount
          ),
          priority && priority !== 'medium' && priority !== 'none' &&
            React.createElement('span', { className: 'ic-pri-chip' }, priority),
          /* Quick-action buttons */
          React.createElement('div', { className: 'ic-qa-group' },
            React.createElement('button', { className: 'ic-qa-btn', style: qaStyle, title: 'Open Folder' },
              React.createElement(I.Folder, { size: 12, sw: 1.8 })),
            React.createElement('button', { className: 'ic-qa-btn', style: qaStyle, title: 'Open Terminal' },
              React.createElement(I.Terminal, { size: 12, sw: 1.8 })),
            React.createElement('button', { className: 'ic-qa-btn', style: qaStyle, title: 'Open Editor' },
              React.createElement(I.Code, { size: 12, sw: 1.8 })),
          ),
        ),
      ),

      /* Body: tree | info rows */
      React.createElement('div', { className: 'ic-body' },
        React.createElement('div', { className: 'ic-tree' },
          React.createElement('div', { className: 'ic-tree-inner' },
            React.createElement(Tree, { stage, shape, season, fruitCount, fruitType: 'apple', size: 72, seed, glow, showGround: false }),
          ),
          notify && React.createElement('span', { className: `ic-notify is-${notify}` }),
        ),
        React.createElement('div', { className: 'ic-info' },
          /* Row 1: branch + worktree */
          React.createElement('div', { className: 'ic-branch-row' },
            React.createElement(I.GitBranch, { size: 10, sw: 1.8 }),
            React.createElement('span', { className: `ic-branch ${!branch ? 'ic-no-branch' : ''}` },
              branch || 'no worktree'),
            React.createElement(BranchStatusBadge, { status: branchStatus }),
            React.createElement(SyncBadge, { behind }),
            React.createElement(ConflictBadge, { on: conflict }),
          ),
          /* Row 2: issue + PR state */
          React.createElement('div', { className: 'ic-state-row' },
            React.createElement(IssueStateBadge, { state, num }),
            pr && React.createElement(PRBadge, { state: pr }),
          ),
          /* Row 3: labels */
          labels.length > 0 && React.createElement('div', { className: 'ic-labels-row' },
            ...labels.map(l => React.createElement(LabelPill, { key: l.name, ...l })),
          ),
        ),
      ),

      /* Action buttons — always visible */
      React.createElement('div', { className: 'ic-actions' },
        React.createElement('button', { className: 'ic-action-btn is-primary' },
          React.createElement(I.Play, { size: 9, sw: 2 }), 'Run'),
        React.createElement('button', { className: 'ic-action-btn' },
          React.createElement(I.Eye, { size: 9, sw: 1.8 }), 'Review'),
        React.createElement('button', { className: 'ic-action-btn is-icon' },
          React.createElement(I.More, { size: 10 })),
      ),
    )
  );
}

/* ─── Expose ───────────────────────────────────────────────── */
Object.assign(window, {
  IssueCard, ISSUE_PALETTE, PALETTE_ROWS,
  icRelLum, icContrastText, icTextMode,
  PRBadge, IssueStateBadge, BranchStatusBadge, SyncBadge, ConflictBadge, LabelPill,
});
