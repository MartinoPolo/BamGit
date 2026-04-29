/* global React, Tree, I */
// Foundations artboards — design tokens.
// One artboard per token category. Each artboard is sized to fit ALL its
// content (no clipping). Read tokens directly from the live document so
// the page is the spec.

const { useState, useEffect, useRef } = React;

// Read a CSS custom property off `:root` (light theme + dark theme inherit
// what's on :root, so non-themed tokens like --space-*, --radius-* etc.
// resolve here cleanly).
function useTokenReader() {
  const [, force] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => force(1));
    return () => cancelAnimationFrame(id);
  }, []);
  return (name) => {
    if (typeof document === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  };
}

// Shared helpers
const RowDivider = () => <div style={{ height: 1, background: 'var(--border)', margin: 'var(--space-12) 0' }} />;

function SectionHeader({ eyebrow, title, sub }) {
  return (
    <div style={{ marginBottom: 'var(--space-16)' }}>
      <div className="gk-eyebrow" style={{ marginBottom: 'var(--space-3)' }}>{eyebrow}</div>
      <div className="gk-h1" style={{ marginBottom: 'var(--space-3)' }}>{title}</div>
      {sub && <div className="gk-small" style={{ maxWidth: 540 }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BRAND
// ─────────────────────────────────────────────────────────────
function BrandArtboard() {
  return (
    <div className="gk-root theme-dark" style={{ background: 'linear-gradient(180deg, oklch(0.20 0.025 220) 0%, oklch(0.18 0.030 150) 100%)', padding: 56, height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 48 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginBottom: 'var(--space-14)' }}>
            <BrandMark size={44} />
            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-tight)' }}>Grovekeeper</div>
              <div className="font-mono gk-tiny">v0.1 · design system</div>
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--weight-medium)', letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-tight)', maxWidth: 620, marginBottom: 'var(--space-10)', color: 'var(--foreground)' }}>
            An orchestration layer for coding agents — visualised as a forest you keep.
          </div>
          <div className="gk-body" style={{ maxWidth: 580, color: 'var(--foreground-muted)', fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-relaxed)' }}>
            Each issue is a tree. Each session waters it. Pull requests bloom, merges drop fruit, dead branches get pruned. The metaphor is the interface.
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-5)', marginTop: 'var(--space-14)' }}>
            <button className="gk-btn gk-btn-primary gk-btn-lg"><I.Plus size={14} /> New issue</button>
            <button className="gk-btn gk-btn-secondary gk-btn-lg"><I.Github size={14} /> Connect GitHub</button>
          </div>
        </div>

        <div style={{ width: 320, display: 'grid', gap: 'var(--space-6)' }}>
          <PrincipleCard title="Calm by default" body="Low chroma, generous whitespace. No alerts that don't matter." />
          <PrincipleCard title="State at a glance" body="Trees encode worktree, branch, session, PR — readable across the room." />
          <PrincipleCard title="One forest, many tools" body="Multi-provider: Claude, Codex, Copilot. The trees don't care which." />
        </div>
      </div>

      <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: 'var(--space-5)', alignItems: 'end' }}>
        {[
          { stage: 'seed', label: 'seed' },
          { stage: 'sprouting', label: 'sprout' },
          { stage: 'sapling', label: 'sapling' },
          { stage: 'growing', label: 'growing' },
          { stage: 'leafy', label: 'leafy' },
          { stage: 'fruiting', label: 'fruiting', fruitCount: 4 },
          { stage: 'flowering', label: 'flowering' },
          { stage: 'seasonal', label: 'seasonal', season: 'autumn' },
          { stage: 'bare', label: 'bare' },
          { stage: 'dead', label: 'dead' },
          { stage: 'stump', label: 'stump' },
        ].map((s, i) => (
          <div key={s.stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Tree {...s} shape={i % 3 === 0 ? 'oak' : i % 3 === 1 ? 'maple' : 'birch'} size={80} seed={i + 1} />
            <div className="font-mono gk-tiny" style={{ color: 'var(--foreground-subtle)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrandMark({ size = 32 }) {
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

function PrincipleCard({ title, body }) {
  return (
    <div className="gk-card gk-card-padded" style={{ background: 'color-mix(in oklch, var(--surface) 70%, transparent)', backdropFilter: 'blur(8px)' }}>
      <div className="gk-h3" style={{ marginBottom: 'var(--space-2)' }}>{title}</div>
      <div className="gk-small">{body}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COLOR — light + dark side-by-side
// ─────────────────────────────────────────────────────────────
function ColorArtboard() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
      <ColorPanel theme="theme-light" label="Light" />
      <ColorPanel theme="theme-dark" label="Dark" />
    </div>
  );
}

function ColorPanel({ theme, label }) {
  const semantic = [
    'background', 'surface', 'surface-2', 'surface-3',
    'foreground', 'foreground-muted', 'foreground-subtle',
    'border', 'border-strong',
    'primary', 'primary-fg', 'primary-soft', 'accent',
  ];
  const status = [
    { name: 'success', label: 'Healthy / merged' },
    { name: 'warning', label: 'Needs input' },
    { name: 'danger', label: 'Failed / dead' },
    { name: 'info', label: 'Syncing' },
  ];
  const mossSteps = [50,100,200,300,400,500,600,700,800,900,950];
  return (
    <div className={'gk-root ' + theme} style={{ padding: 40, background: 'var(--background)', color: 'var(--foreground)', overflow: 'hidden' }}>
      <div className="gk-eyebrow" style={{ marginBottom: 'var(--space-3)' }}>{label} mode</div>
      <div className="gk-h1" style={{ marginBottom: 'var(--space-12)' }}>Color tokens</div>

      <div style={{ marginBottom: 'var(--space-12)' }}>
        <div className="gk-eyebrow" style={{ marginBottom: 'var(--space-5)' }}>Moss scale (brand)</div>
        <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {mossSteps.map(s => (
            <div key={s} style={{ flex: 1, height: 48, background: `var(--moss-${s})`, display: 'flex', alignItems: 'flex-end', padding: 4 }}>
              <span className="font-mono" style={{ fontSize: 9, color: s >= 500 ? '#fff' : '#000', opacity: 0.7 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-12)' }}>
        <div className="gk-eyebrow" style={{ marginBottom: 'var(--space-5)' }}>Semantic</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
          {semantic.map(t => (
            <div key={t} className="gk-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: `var(--${t})`, border: '1px solid var(--border)', flexShrink: 0 }} />
              <div className="font-mono" style={{ fontSize: 'var(--text-xs)' }}>{t}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="gk-eyebrow" style={{ marginBottom: 'var(--space-5)' }}>Status accents</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
          {status.map(s => (
            <div key={s.name} className="gk-card" style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
              <div style={{ width: 20, height: 20, borderRadius: 'var(--radius-full)', background: `var(--status-${s.name})`, flexShrink: 0 }} />
              <div>
                <div className="gk-h3" style={{ fontSize: 'var(--text-sm)' }}>{s.name}</div>
                <div className="gk-tiny">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="gk-card gk-card-padded" style={{ marginTop: 'var(--space-10)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <div className="gk-h3">Sample card</div>
          <span className="gk-badge gk-badge-moss"><span className="gk-badge-dot" /> running</span>
        </div>
        <div className="gk-small">Cards sit on surface, popovers on surface-2.</div>
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
          <button className="gk-btn gk-btn-primary gk-btn-sm">Confirm</button>
          <button className="gk-btn gk-btn-secondary gk-btn-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────
function TypeArtboard() {
  const rows = [
    { token: '--text-5xl', size: 44, weight: 500, tracking: 'var(--tracking-tight)', lh: 'var(--leading-tight)', label: 'Display', sample: 'Forest grows quietly.' },
    { token: '--text-4xl', size: 36, weight: 500, tracking: 'var(--tracking-tight)', lh: 'var(--leading-tight)', label: 'Hero', sample: 'A garden for agents' },
    { token: '--text-3xl', size: 28, weight: 600, tracking: 'var(--tracking-snug)', lh: 'var(--leading-tight)', label: 'H1', sample: 'Issue dashboard' },
    { token: '--text-2xl', size: 22, weight: 600, tracking: 'var(--tracking-snug)', lh: 'var(--leading-snug)', label: 'H1·compact / page', sample: 'Active worktrees' },
    { token: '--text-xl',  size: 17, weight: 600, tracking: 'var(--tracking-snug)', lh: 'var(--leading-snug)', label: 'H2', sample: 'Recent activity' },
    { token: '--text-lg',  size: 15, weight: 500, tracking: '0', lh: 'var(--leading-relaxed)', label: 'Lead body', sample: 'Spin up Claude on any GitHub issue.' },
    { token: '--text-base',size: 14, weight: 600, tracking: '0', lh: 'var(--leading-snug)', label: 'H3', sample: 'Worktrees' },
    { token: '--text-md',  size: 13, weight: 400, tracking: '0', lh: 'var(--leading-relaxed)', label: 'Body / UI base', sample: 'A worktree is a checkout of a branch into its own folder.' },
    { token: '--text-sm',  size: 12, weight: 400, tracking: '0', lh: 'var(--leading-normal)', label: 'Small / muted', color: 'var(--foreground-muted)', sample: 'Updated 4 minutes ago · 3 commits ahead' },
    { token: '--text-xs',  size: 11, weight: 400, tracking: 'var(--tracking-wide)', lh: 'var(--leading-normal)', label: 'Tiny', color: 'var(--foreground-subtle)', sample: '#128 · feature/forest-view' },
    { token: '--text-2xs', size: 10.5, weight: 600, tracking: 'var(--tracking-wider)', lh: 1, label: 'Eyebrow', color: 'var(--foreground-subtle)', upper: true, sample: 'WORKTREE' },
  ];
  return (
    <div className="gk-root theme-dark" style={{ padding: 56, height: '100%', background: 'var(--background)', overflow: 'hidden' }}>
      <SectionHeader eyebrow="Typography" title="Geist Sans · Geist Mono" sub="Type scale tokens drive every heading and body. Mono is reserved for paths, hashes, branches, numerals." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40 }}>
        <div style={{ display: 'grid', gap: 'var(--space-12)' }}>
          {rows.map((r) => (
            <div key={r.token} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 'var(--space-12)', alignItems: 'baseline', borderBottom: '1px dashed var(--border)', paddingBottom: 'var(--space-8)' }}>
              <div>
                <div className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>{r.token}</div>
                <div className="font-mono gk-tiny" style={{ color: 'var(--foreground-subtle)', marginTop: 2 }}>{r.size}px · {r.weight}</div>
                <div className="gk-tiny" style={{ marginTop: 2 }}>{r.label}</div>
              </div>
              <div style={{ fontSize: r.size, fontWeight: r.weight, letterSpacing: r.tracking, lineHeight: r.lh, color: r.color || 'var(--foreground)', textTransform: r.upper ? 'uppercase' : undefined }}>
                {r.sample}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 'var(--space-8)', alignContent: 'start' }}>
          <div className="gk-card gk-card-padded">
            <div className="gk-eyebrow" style={{ marginBottom: 'var(--space-6)' }}>Mono — paths, hashes</div>
            <div className="font-mono" style={{ fontSize: 'var(--text-md)', lineHeight: 'var(--leading-loose)' }}>
              <div>feature/forest-view-overlays</div>
              <div style={{ color: 'var(--foreground-muted)' }}>commit a4f8c12 · pushed 2h ago</div>
              <div style={{ color: 'var(--foreground-subtle)' }}>~/grovekeeper/.worktrees/issue-128</div>
            </div>
          </div>
          <div className="gk-card gk-card-padded">
            <div className="gk-eyebrow" style={{ marginBottom: 'var(--space-6)' }}>Numerals · tabular</div>
            <div className="font-mono" style={{ fontSize: 22, fontVariantNumeric: 'tabular-nums', letterSpacing: 'var(--tracking-tight)', lineHeight: 1.3 }}>
              $12.84<br/>1,247 turns<br/>92.4% one-shot
            </div>
          </div>
          <div className="gk-card gk-card-padded">
            <div className="gk-eyebrow" style={{ marginBottom: 'var(--space-6)' }}>Weights</div>
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 400 }}>Regular · 400</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 500 }}>Medium · 500</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Semibold · 600</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Bold · 700</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────────────────────
function SpacingArtboard() {
  const steps = [
    { name: '--space-1',  px: 2 },
    { name: '--space-2',  px: 4 },
    { name: '--space-3',  px: 6 },
    { name: '--space-4',  px: 8 },
    { name: '--space-5',  px: 10 },
    { name: '--space-6',  px: 12 },
    { name: '--space-7',  px: 14 },
    { name: '--space-8',  px: 16 },
    { name: '--space-10', px: 20 },
    { name: '--space-12', px: 24 },
    { name: '--space-14', px: 28 },
    { name: '--space-16', px: 32 },
    { name: '--space-20', px: 40 },
    { name: '--space-24', px: 48 },
    { name: '--space-32', px: 64 },
  ];
  return (
    <div className="gk-root theme-dark" style={{ padding: 56, height: '100%', background: 'var(--background)', overflow: 'hidden' }}>
      <SectionHeader eyebrow="Spacing" title="4-px base scale" sub="One scale for paddings, gaps, margins. Numeric step (×2) maps to pixels — easy to recall, easy to tokenize." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56 }}>
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {steps.map((s) => (
            <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '120px 60px 1fr', alignItems: 'center', gap: 'var(--space-6)' }}>
              <div className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>{s.name}</div>
              <div className="font-mono gk-tiny" style={{ textAlign: 'right' }}>{s.px}px</div>
              <div style={{ height: 14, width: s.px, background: 'var(--primary)', borderRadius: 2, opacity: 0.85 }} />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 'var(--space-12)', alignContent: 'start' }}>
          <div>
            <div className="gk-eyebrow" style={{ marginBottom: 'var(--space-6)' }}>Density · in context</div>

            <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
              <DensityRow label="Compact · gap-2 · pad-3"   gap={4} pad={6} />
              <DensityRow label="Default · gap-4 · pad-6"   gap={8} pad={12} />
              <DensityRow label="Comfortable · gap-6 · pad-8" gap={12} pad={16} />
              <DensityRow label="Spacious · gap-8 · pad-12"   gap={16} pad={24} />
            </div>
          </div>

          <div>
            <div className="gk-eyebrow" style={{ marginBottom: 'var(--space-6)' }}>Layout rhythm</div>
            <div className="gk-card gk-card-padded">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-full)', background: 'var(--primary-soft)' }} />
                <div>
                  <div className="gk-h3">128 · Forest view overlays</div>
                  <div className="gk-tiny">Updated 4m ago</div>
                </div>
                <span className="gk-badge gk-badge-moss" style={{ marginLeft: 'auto' }}><span className="gk-badge-dot" /> running</span>
              </div>
              <div className="gk-small" style={{ marginBottom: 'var(--space-6)' }}>Sticky popover for tree state — uses padding-12 on the card and gap-6 between rows.</div>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <button className="gk-btn gk-btn-primary gk-btn-sm">Open</button>
                <button className="gk-btn gk-btn-ghost gk-btn-sm">Hide</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DensityRow({ label, gap, pad }) {
  return (
    <div>
      <div className="font-mono gk-tiny" style={{ marginBottom: 'var(--space-3)' }}>{label}</div>
      <div style={{ display: 'flex', gap, padding: pad, background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ flex: 1, height: 22, background: 'var(--surface-3)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RADIUS
// ─────────────────────────────────────────────────────────────
function RadiusArtboard() {
  const radii = [
    { name: '--radius-none', px: 0,  used: 'flush bars' },
    { name: '--radius-xs',   px: 4,  used: 'checkbox, mini chip' },
    { name: '--radius-sm',   px: 6,  used: 'sm button, popover row' },
    { name: '--radius-md',   px: 8,  used: 'button, input, panel' },
    { name: '--radius-lg',   px: 10, used: 'card' },
    { name: '--radius-xl',   px: 14, used: 'modal' },
    { name: '--radius-2xl',  px: 20, used: 'hero / large modal' },
    { name: '--radius-full', px: 9999, used: 'badge, avatar, toggle' },
  ];

  return (
    <div className="gk-root theme-dark" style={{ padding: 56, height: '100%', background: 'var(--background)', overflow: 'hidden' }}>
      <SectionHeader eyebrow="Radius" title="Corner radii" sub="Eight steps. 8px is the workhorse — every interactive surface inherits it unless larger context demands otherwise." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-12)', marginBottom: 'var(--space-20)' }}>
        {radii.map((r) => (
          <div key={r.name} className="gk-card gk-card-padded" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-5)' }}>
            <div style={{ width: 84, height: 84, borderRadius: r.name === '--radius-full' ? '50%' : `var(${r.name})`, background: 'var(--primary-soft)', border: '1px solid var(--border-strong)' }} />
            <div style={{ textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>{r.name}</div>
              <div className="font-mono gk-tiny">{r.px === 9999 ? '∞' : r.px + 'px'}</div>
              <div className="gk-tiny" style={{ marginTop: 'var(--space-2)' }}>{r.used}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="gk-eyebrow" style={{ marginBottom: 'var(--space-6)' }}>Borders & focus</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-12)' }}>
        <BorderCard token="--border-width-1" px={1} sample={<div style={{ width: 80, height: 30, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} />} />
        <BorderCard token="--border-width-2" px={1.5} sample={<div style={{ width: 16, height: 16, border: '1.5px solid var(--border-strong)', borderRadius: 'var(--radius-xs)' }} />} />
        <BorderCard token="--border-width-3" px={2} sample={<div style={{ width: 60, height: 30, border: '2px solid var(--ring)', borderRadius: 'var(--radius-sm)' }} />} />
        <div className="gk-card gk-card-padded" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-5)' }}>
          <div style={{ width: 80, height: 30, border: '1px solid var(--ring)', borderRadius: 'var(--radius-md)', boxShadow: '0 0 0 3px color-mix(in oklch, var(--ring) 22%, transparent)' }} />
          <div style={{ textAlign: 'center' }}>
            <div className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>--focus-ring</div>
            <div className="font-mono gk-tiny">3px / 22% ring</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BorderCard({ token, px, sample }) {
  return (
    <div className="gk-card gk-card-padded" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-5)' }}>
      {sample}
      <div style={{ textAlign: 'center' }}>
        <div className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>{token}</div>
        <div className="font-mono gk-tiny">{px}px</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SHADOW + Z + MOTION
// ─────────────────────────────────────────────────────────────
function ElevationArtboard() {
  const shadows = [
    { name: '--shadow-sm', use: 'resting card, button' },
    { name: '--shadow-md', use: 'hovered card, popover' },
    { name: '--shadow-lg', use: 'modal, overlay' },
    { name: '--shadow-xl', use: 'lifted hero, focus mode' },
  ];
  const zs = [
    { token: '--z-base',     v: 0 },
    { token: '--z-raised',   v: 10 },
    { token: '--z-dropdown', v: 20 },
    { token: '--z-sticky',   v: 30 },
    { token: '--z-overlay',  v: 40 },
    { token: '--z-modal',    v: 50 },
    { token: '--z-toast',    v: 60 },
    { token: '--z-tooltip',  v: 70 },
  ];
  const durations = [
    { token: '--duration-1', v: 90,  use: 'micro press · radio fill' },
    { token: '--duration-2', v: 120, use: 'button hover · color' },
    { token: '--duration-3', v: 160, use: 'popover · tooltip' },
    { token: '--duration-4', v: 220, use: 'toast · drawer' },
    { token: '--duration-5', v: 320, use: 'modal · overlay' },
  ];
  const eases = [
    { token: '--ease-standard', v: 'cubic-bezier(.2,.7,.3,1)' },
    { token: '--ease-out',      v: 'cubic-bezier(.16,.84,.44,1)' },
    { token: '--ease-in',       v: 'cubic-bezier(.5,0,.75,0)' },
  ];
  return (
    <div className="gk-root theme-dark" style={{ padding: 56, height: '100%', background: 'var(--background)', overflow: 'hidden' }}>
      <SectionHeader eyebrow="Elevation · z · motion" title="Depth & time" sub="Four shadow steps, eight z-bands, five durations. Standard ease unless something is asserting (popover) or releasing (toast)." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-20)' }}>
        <div>
          <div className="gk-eyebrow" style={{ marginBottom: 'var(--space-6)' }}>Shadows</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)' }}>
            {shadows.map((sh) => (
              <div key={sh.name} style={{ background: 'var(--surface-2)', padding: 'var(--space-12)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ width: '100%', height: 70, background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: `var(${sh.name})`, marginBottom: 'var(--space-6)' }} />
                <div className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>{sh.name}</div>
                <div className="gk-tiny">{sh.use}</div>
              </div>
            ))}
          </div>

          <div className="gk-eyebrow" style={{ marginTop: 'var(--space-16)', marginBottom: 'var(--space-6)' }}>Z-index scale</div>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {zs.map((z) => (
              <div key={z.token} style={{ display: 'grid', gridTemplateColumns: '160px 60px 1fr', alignItems: 'center', gap: 'var(--space-6)' }}>
                <div className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>{z.token}</div>
                <div className="font-mono gk-tiny" style={{ textAlign: 'right' }}>{z.v}</div>
                <div style={{ height: 6, background: 'var(--primary-soft)', borderRadius: 999, width: `${(z.v / 70) * 100}%` }} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="gk-eyebrow" style={{ marginBottom: 'var(--space-6)' }}>Durations</div>
          <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
            {durations.map((d) => (
              <DurationRow key={d.token} {...d} />
            ))}
          </div>

          <div className="gk-eyebrow" style={{ marginTop: 'var(--space-16)', marginBottom: 'var(--space-6)' }}>Easing</div>
          <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
            {eases.map((e) => (
              <div key={e.token} className="gk-card gk-card-padded" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                <EaseCurve curve={e.v} />
                <div>
                  <div className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>{e.token}</div>
                  <div className="font-mono gk-tiny" style={{ marginTop: 2 }}>{e.v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DurationRow({ token, v, use }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((x) => x + 1), v + 600);
    return () => clearInterval(id);
  }, [v]);
  return (
    <div className="gk-card gk-card-padded" style={{ display: 'grid', gridTemplateColumns: '140px 1fr 80px', gap: 'var(--space-6)', alignItems: 'center' }}>
      <div>
        <div className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>{token}</div>
        <div className="font-mono gk-tiny">{v}ms</div>
        <div className="gk-tiny" style={{ marginTop: 2 }}>{use}</div>
      </div>
      <div style={{ position: 'relative', height: 8, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
        <div key={n} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 24, background: 'var(--primary)', borderRadius: 4, animation: `gk-glide ${v}ms var(--ease-standard) forwards` }} />
      </div>
      <div className="font-mono gk-tiny" style={{ textAlign: 'right' }}>{v}ms</div>
    </div>
  );
}

function EaseCurve({ curve }) {
  const m = curve.match(/cubic-bezier\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)/);
  if (!m) return null;
  const [, x1, y1, x2, y2] = m.map((v, i) => i === 0 ? v : parseFloat(v));
  const w = 60, h = 40;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ flexShrink: 0 }}>
      <line x1="0" y1={h} x2={w} y2="0" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 3" />
      <path d={`M0 ${h} C${x1 * w} ${h - y1 * h}, ${x2 * w} ${h - y2 * h}, ${w} 0`} fill="none" stroke="var(--primary)" strokeWidth="2" />
    </svg>
  );
}

// Inject local keyframes
if (typeof document !== 'undefined' && !document.getElementById('gk-foundations-anim')) {
  const s = document.createElement('style');
  s.id = 'gk-foundations-anim';
  s.textContent = `
    @keyframes gk-glide { from { left: 0; } to { left: calc(100% - 24px); } }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────
// SIZING — control heights, sidebar, layout
// ─────────────────────────────────────────────────────────────
function SizingArtboard() {
  return (
    <div className="gk-root theme-dark" style={{ padding: 56, height: '100%', background: 'var(--background)', overflow: 'hidden' }}>
      <SectionHeader eyebrow="Sizing" title="Control heights & layout" sub="Three control heights. Sidebar widths. Picked so a row of [input · button] always lines up." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-20)' }}>
        <div>
          <div className="gk-eyebrow" style={{ marginBottom: 'var(--space-6)' }}>Controls</div>
          <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
            <SizeRow token="--size-control-sm" px={26} demo={(
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <input className="gk-input" style={{ height: 26, fontSize: 12 }} defaultValue="search" />
                <button className="gk-btn gk-btn-primary gk-btn-sm">Run</button>
                <button className="gk-btn gk-btn-secondary gk-btn-sm">Cancel</button>
              </div>
            )} />
            <SizeRow token="--size-control-md" px={32} demo={(
              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                <input className="gk-input" defaultValue="search" />
                <button className="gk-btn gk-btn-primary">Run</button>
                <button className="gk-btn gk-btn-secondary">Cancel</button>
              </div>
            )} />
            <SizeRow token="--size-control-lg" px={38} demo={(
              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                <input className="gk-input" style={{ height: 38, fontSize: 14 }} defaultValue="search" />
                <button className="gk-btn gk-btn-primary gk-btn-lg">Run</button>
                <button className="gk-btn gk-btn-secondary gk-btn-lg">Cancel</button>
              </div>
            )} />
          </div>
        </div>

        <div>
          <div className="gk-eyebrow" style={{ marginBottom: 'var(--space-6)' }}>Sidebar widths</div>
          <div className="gk-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'stretch', height: 220 }}>
              <div style={{ width: 56, background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-6)', gap: 'var(--space-5)' }}>
                <div style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)', background: 'var(--primary)' }} />
                <div style={{ width: 22, height: 22, borderRadius: 'var(--radius-xs)', background: 'var(--surface-3)' }} />
                <div style={{ width: 22, height: 22, borderRadius: 'var(--radius-xs)', background: 'var(--surface-3)' }} />
                <div style={{ width: 22, height: 22, borderRadius: 'var(--radius-xs)', background: 'var(--surface-3)' }} />
              </div>
              <div style={{ width: 240, background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)', padding: 'var(--space-8)', display: 'grid', gap: 'var(--space-3)', alignContent: 'start' }}>
                <div className="gk-eyebrow">Workspace</div>
                {['Inbox','My trees','Forest','Activity','Settings'].map((it, i) => (
                  <div key={it} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', background: i === 0 ? 'var(--primary-soft)' : 'transparent', fontSize: 'var(--text-md)', color: i === 0 ? 'var(--foreground)' : 'var(--foreground-muted)' }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: 'currentColor', opacity: 0.4 }} />
                    {it}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, padding: 'var(--space-10)' }}>
                <div className="gk-h2" style={{ marginBottom: 'var(--space-4)' }}>Inbox</div>
                <div className="gk-small">Content area — fills remaining width.</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
            <div className="gk-card gk-card-padded">
              <div className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>--sidebar-width-collapsed</div>
              <div className="font-mono gk-tiny">56px · icon-only</div>
            </div>
            <div className="gk-card gk-card-padded">
              <div className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>--sidebar-width</div>
              <div className="font-mono gk-tiny">240px · expanded</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SizeRow({ token, px, demo }) {
  return (
    <div className="gk-card gk-card-padded">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
        <div>
          <div className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>{token}</div>
          <div className="font-mono gk-tiny">{px}px</div>
        </div>
      </div>
      {demo}
    </div>
  );
}

Object.assign(window, { BrandArtboard, TypeArtboard, ColorArtboard, SpacingArtboard, RadiusArtboard, ElevationArtboard, SizingArtboard });
