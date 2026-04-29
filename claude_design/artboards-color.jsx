/* global React, I */
// Color tokens — comprehensive reference page.
//
// Structure:
//   1. Hero strip: brand identity in moss
//   2. Moss scale (11 stops, 50→950) — primary brand
//   3. Amber + Bark scales — accents
//   4. Status colors (success, warning, danger, info)
//   5. Sky gradients (forest backdrop)
//   6. Semantic tokens — shown in BOTH light + dark, side-by-side
//   7. Example usage panel — same component rendered in both themes
//
// Resolves OKLCH → hex live by reading off a hidden DOM probe so users
// can copy real hex values, not the OKLCH string.

const { useState, useEffect, useRef, useMemo } = React;

// ─── helpers ────────────────────────────────────────────────────────

// Resolve a CSS color token to a 6-digit hex string by painting it on a
// canvas. Works for any CSS color (oklch, var(...), color-mix, ...).
function resolveColor(cssValue, hostEl) {
  if (typeof document === 'undefined') return null;
  // Use a probe element so var(...) resolves in the right scope.
  const probe = document.createElement('span');
  probe.style.color = cssValue;
  (hostEl || document.body).appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  probe.remove();
  // rgb(r, g, b) or rgba(...)
  const m = rgb.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
  const [r, g, b] = parts;
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

// Hook: resolves an array of {token} entries → {token, hex} once mounted,
// scoped to a specific element (so light/dark theme overrides apply).
function useResolvedHex(tokens, scopeRef) {
  const [hexes, setHexes] = useState({});
  useEffect(() => {
    const host = scopeRef?.current || document.body;
    const out = {};
    tokens.forEach((t) => { out[t] = resolveColor(`var(${t})`, host); });
    setHexes(out);
  }, [tokens.join('|')]);
  return hexes;
}

// Copyable mono pill
function Mono({ children, copy, dim, size = 11 }) {
  const [flash, setFlash] = useState(false);
  const onClick = (e) => {
    if (!copy) return;
    e.stopPropagation();
    navigator.clipboard?.writeText(copy);
    setFlash(true);
    setTimeout(() => setFlash(false), 700);
  };
  return (
    <span
      onClick={onClick}
      className="font-mono"
      style={{
        fontSize: size,
        color: dim ? 'var(--foreground-subtle)' : 'var(--foreground-muted)',
        cursor: copy ? 'pointer' : 'default',
        userSelect: 'all',
        background: flash ? 'color-mix(in oklch, var(--status-success) 22%, transparent)' : 'transparent',
        padding: copy ? '1px 5px' : 0,
        borderRadius: 3,
        transition: 'background 200ms',
        whiteSpace: 'nowrap',
      }}
      title={copy ? `Copy ${copy}` : undefined}
    >
      {flash ? 'copied' : children}
    </span>
  );
}

// Shared section header
function ColorSectionHeader({ eyebrow, title, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="gk-eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>
      <div className="gk-h2" style={{ marginBottom: 4 }}>{title}</div>
      {sub && <div className="gk-small" style={{ color: 'var(--foreground-muted)', maxWidth: 540 }}>{sub}</div>}
    </div>
  );
}

// ─── ramp: a single horizontal scale (e.g. moss-50 → moss-950) ────

function Ramp({ family, stops, primary }) {
  const ref = useRef(null);
  const tokens = stops.map((s) => `--${family}-${s}`);
  const hexes = useResolvedHex(tokens, ref);
  return (
    <div ref={ref}>
      <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {stops.map((s) => {
          const tok = `--${family}-${s}`;
          const hex = hexes[tok];
          const isLight = s <= 300;
          const isPrimary = primary && primary.includes(s);
          return (
            <div
              key={s}
              title={`${tok}\n${hex || ''}`}
              onClick={() => hex && navigator.clipboard?.writeText(hex)}
              style={{
                flex: 1,
                height: 76,
                background: `var(${tok})`,
                position: 'relative',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 6,
                color: isLight ? '#1d271a' : '#f5f3ee',
              }}
            >
              <div className="font-mono" style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>
                {s}
                {isPrimary && (
                  <span style={{ marginLeft: 4, padding: '0 4px', borderRadius: 3, background: 'rgba(0,0,0,0.18)', fontSize: 8.5, fontWeight: 600, letterSpacing: '0.04em' }}>★</span>
                )}
              </div>
              <div className="font-mono" style={{ fontSize: 9, opacity: 0.65, letterSpacing: '0.02em' }}>
                {hex ? hex.replace('#', '') : '·····'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── card: one swatch with full info (token, hex, usage) ──────────

function ColorCard({ token, label, usage, large, scopeRef }) {
  const ref = useRef(null);
  const [hex, setHex] = useState('—');
  useEffect(() => {
    const host = scopeRef?.current || ref.current;
    setHex(resolveColor(`var(${token})`, host) || '—');
  }, [token]);
  const [copied, setCopied] = useState(false);
  const onCopy = (val) => {
    navigator.clipboard?.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 800);
  };
  return (
    <div ref={ref} className="gk-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div
        onClick={() => onCopy(hex)}
        style={{
          height: large ? 70 : 52,
          background: `var(${token})`,
          borderBottom: '1px solid var(--border)',
          cursor: 'pointer',
          position: 'relative',
        }}
      />
      <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--foreground)', fontWeight: 500 }}>{token}</span>
          <Mono copy={hex} dim>{copied ? 'copied' : hex}</Mono>
        </div>
        {label && <div className="gk-tiny" style={{ color: 'var(--foreground-subtle)' }}>{label}</div>}
        {usage && <div className="gk-tiny" style={{ color: 'var(--foreground-subtle)', marginTop: 2 }}>{usage}</div>}
      </div>
    </div>
  );
}

// ─── Theme panel: a self-contained light or dark slice ────────────

const SEMANTIC_GROUPS = [
  {
    title: 'Surfaces · backgrounds',
    items: [
      { token: '--background',   usage: 'Page background, app shell' },
      { token: '--surface',      usage: 'Cards, popovers, modal body' },
      { token: '--surface-2',    usage: 'Sidebar bg, raised input field' },
      { token: '--surface-3',    usage: 'Hover wash, nested panels' },
      { token: '--sidebar-bg',   usage: 'Left navigation column' },
      { token: '--code-bg',      usage: 'Inline code, kbd caps' },
    ],
  },
  {
    title: 'Foreground · text',
    items: [
      { token: '--foreground',         usage: 'Default text, headings' },
      { token: '--foreground-muted',   usage: 'Secondary text, labels' },
      { token: '--foreground-subtle',  usage: 'Tertiary, timestamps, hints' },
      { token: '--sidebar-fg',         usage: 'Nav item text' },
    ],
  },
  {
    title: 'Borders',
    items: [
      { token: '--border',         usage: 'Cards, dividers, default outlines' },
      { token: '--border-strong',  usage: 'Inputs (hover), checkbox idle' },
    ],
  },
  {
    title: 'Brand · primary',
    items: [
      { token: '--primary',       usage: 'CTAs, active nav, focus ring base' },
      { token: '--primary-fg',    usage: 'Text on primary surfaces' },
      { token: '--primary-soft',  usage: 'Active nav background, soft chips' },
      { token: '--ring',          usage: 'Focus ring color (3px halo)' },
    ],
  },
  {
    title: 'Accent',
    items: [
      { token: '--accent',     usage: 'Approved PR glow, "ready to ship" bloom' },
      { token: '--accent-fg',  usage: 'Text on accent backgrounds' },
    ],
  },
];

function ThemePanel({ themeClass, label, sub }) {
  const ref = useRef(null);
  return (
    <div
      ref={ref}
      className={'gk-root ' + themeClass}
      style={{
        background: 'var(--background)',
        color: 'var(--foreground)',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        flex: 1,
        minWidth: 0,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 0 }}>
        <div>
          <div className="gk-eyebrow" style={{ marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>Semantic tokens</div>
        </div>
        <ThemeBadge themeClass={themeClass} />
      </div>

      {SEMANTIC_GROUPS.map((g) => (
        <div key={g.title}>
          <div className="gk-eyebrow" style={{ marginBottom: 10 }}>{g.title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {g.items.map((it) => (
              <ColorCard key={it.token} {...it} scopeRef={ref} />
            ))}
          </div>
        </div>
      ))}

      {/* Live example */}
      <div>
        <div className="gk-eyebrow" style={{ marginBottom: 10 }}>In context</div>
        <ExampleCard />
      </div>
    </div>
  );
}

function ThemeBadge({ themeClass }) {
  const dark = themeClass === 'theme-dark';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      border: '1px solid var(--border)',
      background: 'var(--surface-2)',
      fontSize: 11, color: 'var(--foreground-muted)',
      fontFamily: 'var(--font-mono)',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: dark ? '#0e1410' : '#fbf9f3', border: '1px solid var(--border-strong)' }} />
      .{themeClass}
    </div>
  );
}

function ExampleCard() {
  return (
    <div className="gk-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 24, borderRadius: 999, background: 'var(--primary-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: 11, fontWeight: 600 }}>128</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Forest view overlays</div>
            <div className="gk-tiny" style={{ color: 'var(--foreground-subtle)' }}>feature/forest-overlays · updated 4m</div>
          </div>
        </div>
        <span className="gk-badge gk-badge-moss"><span className="gk-badge-dot" /> running</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className="gk-badge gk-badge-success"><span className="gk-badge-dot" /> tests pass</span>
        <span className="gk-badge gk-badge-warning"><span className="gk-badge-dot" /> 1 review</span>
        <span className="gk-badge gk-badge-amber"><I.Sparkles size={10} /> approved</span>
      </div>
      <div style={{ display: 'flex', gap: 6, paddingTop: 4, borderTop: '1px dashed var(--border)' }}>
        <button className="gk-btn gk-btn-primary gk-btn-sm">Open</button>
        <button className="gk-btn gk-btn-secondary gk-btn-sm">Diff</button>
        <button className="gk-btn gk-btn-ghost gk-btn-sm">Hide</button>
      </div>
    </div>
  );
}

// ─── Status row — compact card per status color ───────────────────

function StatusCard({ name, token, role, example, scopeRef }) {
  const ref = useRef(null);
  const [hex, setHex] = useState('—');
  useEffect(() => {
    const host = scopeRef?.current || ref.current;
    setHex(resolveColor(`var(${token})`, host) || '—');
  }, [token]);
  return (
    <div ref={ref} className="gk-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `color-mix(in oklch, var(${token}) 18%, transparent)`,
          border: `1px solid color-mix(in oklch, var(${token}) 35%, transparent)`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: `var(${token})`,
        }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: `var(${token})` }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{name}</div>
          <div className="gk-tiny" style={{ color: 'var(--foreground-subtle)' }}>{role}</div>
        </div>
        <Mono copy={hex} dim>{hex}</Mono>
      </div>
      <Mono>{token}</Mono>
      <div style={{ paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
        {example}
      </div>
    </div>
  );
}

// ─── Sky gradient previews ────────────────────────────────────────

function SkyTile({ label, top, bot, scopeRef }) {
  const ref = useRef(null);
  const [topHex, setTopHex] = useState('—');
  const [botHex, setBotHex] = useState('—');
  useEffect(() => {
    const host = scopeRef?.current || ref.current;
    setTopHex(resolveColor(`var(${top})`, host) || '—');
    setBotHex(resolveColor(`var(${bot})`, host) || '—');
  }, [top, bot]);
  return (
    <div ref={ref} className="gk-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ height: 90, background: `linear-gradient(180deg, var(${top}) 0%, var(${bot}) 100%)`, position: 'relative' }}>
        {/* Tiny pine silhouettes for atmosphere */}
        <svg viewBox="0 0 200 60" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 28, opacity: 0.55 }}>
          <polygon points="0,60 14,30 28,42 44,18 60,38 78,24 96,46 116,30 136,40 156,22 176,38 200,28 200,60" fill="oklch(0.18 0.025 145)" />
        </svg>
      </div>
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <Mono copy={topHex}>{top}</Mono>
          <Mono dim>{topHex}</Mono>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <Mono copy={botHex}>{bot}</Mono>
          <Mono dim>{botHex}</Mono>
        </div>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────

function ColorHero() {
  const ref = useRef(null);
  const stops = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  return (
    <div
      ref={ref}
      className="gk-root theme-dark"
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, var(--moss-900) 0%, var(--moss-700) 60%, var(--moss-500) 100%)',
        padding: '36px 40px',
        color: '#f5f3ee',
        overflow: 'hidden',
      }}
    >
      {/* Faint topographic texture */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none',
        backgroundImage: 'repeating-radial-gradient(circle at 30% 70%, transparent 0, transparent 22px, rgba(255,255,255,0.06) 22px, rgba(255,255,255,0.06) 23px)' }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32 }}>
        <div>
          <div className="gk-eyebrow" style={{ color: 'rgba(245,243,238,0.7)', marginBottom: 6 }}>Color tokens</div>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05 }}>Forest moss palette</div>
          <div style={{ fontSize: 14, color: 'rgba(245,243,238,0.7)', marginTop: 8, maxWidth: 520, lineHeight: 1.5 }}>
            Every color is OKLCH so steps stay perceptually even.
            Click any swatch to copy its hex; click a token name to copy the variable.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {stops.map((s) => (
            <div key={s} style={{
              width: 18, height: 60, borderRadius: 3,
              background: `var(--moss-${s})`,
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Top-level artboards (one per theme) ──────────────────────────

function ScalesAndStatus({ themeClass }) {
  const ref = useRef(null);
  return (
    <div ref={ref} className={'gk-root ' + themeClass} style={{ background: 'var(--background)', color: 'var(--foreground)', padding: '32px 40px 28px', display: 'flex', flexDirection: 'column', gap: 36 }}>
      {/* ── 1. MOSS PRIMARY SCALE ───────────────────────── */}
      <section>
        <ColorSectionHeader
          eyebrow="Brand · primary"
          title="Moss"
          sub="The full 11-step ramp. Stops marked ★ are aliased as the semantic --primary token (700 in light, 400 in dark)."
        />
        <Ramp family="moss" stops={[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]} primary={[400, 700]} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
          <UsageRow stop="50" usage="Subtle wash, soft chip bg (light)" />
          <UsageRow stop="300" usage="Sidebar accent text (dark), tree leaves" />
          <UsageRow stop="500" usage="Tree fills, brand mark" />
          <UsageRow stop="700" usage="--primary in light · CTA buttons" highlight />
          <UsageRow stop="400" usage="--primary in dark · CTA in dark mode" highlight />
          <UsageRow stop="600" usage="Avatar bg, brand swatch" />
          <UsageRow stop="800" usage="Tree shadows, dark hover" />
          <UsageRow stop="950" usage="App bg in dark mode" />
        </div>
      </section>

      {/* ── 2. AMBER ────────────────────────────────────── */}
      <section>
        <ColorSectionHeader
          eyebrow="Accent"
          title="Amber"
          sub="Autumn fruit. Used sparingly — approved PRs, ready-to-ship glow, and ‘bloom’ moments."
        />
        <Ramp family="amber" stops={[300, 400, 500, 600]} primary={[400, 500]} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
          <UsageRow family="amber" stop="300" usage="Highlights, fruit on trees" />
          <UsageRow family="amber" stop="400" usage="--accent in dark mode" highlight />
          <UsageRow family="amber" stop="500" usage="--accent in light mode" highlight />
          <UsageRow family="amber" stop="600" usage="Hover state, deep accent" />
        </div>
      </section>

      {/* ── 3. BARK ─────────────────────────────────────── */}
      <section>
        <ColorSectionHeader
          eyebrow="Secondary accent"
          title="Bark"
          sub="Warm brown. Tree trunks, secondary tagging, neutral-warm chips."
        />
        <Ramp family="bark" stops={[300, 500, 700]} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
          <UsageRow family="bark" stop="300" usage="Trunk highlight, warm chip text" />
          <UsageRow family="bark" stop="500" usage="Trunk fill, swatch chip" />
          <UsageRow family="bark" stop="700" usage="Deep wood, dark trunk shadow" />
        </div>
      </section>

      {/* ── 4. STATUS ───────────────────────────────────── */}
      <section>
        <ColorSectionHeader
          eyebrow="Status"
          title="Feedback colors"
          sub="Keep these reserved for what they mean. No decorative use."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatusCard name="success" token="--status-success" role="Healthy · merged · tests pass" scopeRef={ref}
            example={<span className="gk-badge gk-badge-success"><span className="gk-badge-dot" /> tests pass</span>} />
          <StatusCard name="warning" token="--status-warning" role="Needs input · review pending" scopeRef={ref}
            example={<span className="gk-badge gk-badge-warning"><span className="gk-badge-dot" /> needs review</span>} />
          <StatusCard name="danger" token="--status-danger" role="Failed · destructive · dead branch" scopeRef={ref}
            example={<span className="gk-badge gk-badge-danger"><span className="gk-badge-dot" /> build failed</span>} />
          <StatusCard name="info" token="--status-info" role="Syncing · informational" scopeRef={ref}
            example={<span className="gk-badge gk-badge-info"><span className="gk-badge-dot" /> syncing</span>} />
        </div>
      </section>

      {/* ── 5. SKY ──────────────────────────────────────── */}
      <section>
        <ColorSectionHeader
          eyebrow="Atmosphere"
          title="Sky gradients"
          sub="Forest backdrop. Used as the linear-gradient on the canvas view."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <SkyTile label="Light · daytime" top="--sky-light-top" bot="--sky-light-bot" scopeRef={ref} />
          <SkyTile label="Dark · dusk" top="--sky-dark-top" bot="--sky-dark-bot" scopeRef={ref} />
        </div>
      </section>
    </div>
  );
}

function ColorTokensLightArtboard() {
  return (
    <div className="gk-root theme-light" style={{ background: 'var(--background)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <ColorHero />
      <ScalesAndStatus themeClass="theme-light" />
      <ThemePanel themeClass="theme-light" label="Light mode" sub="Default for marketing surfaces" />
    </div>
  );
}

function ColorTokensDarkArtboard() {
  return (
    <div className="gk-root theme-dark" style={{ background: 'var(--background)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <ColorHero />
      <ScalesAndStatus themeClass="theme-dark" />
      <ThemePanel themeClass="theme-dark" label="Dark mode" sub="Default for the desktop tool" />
    </div>
  );
}

function UsageRow({ family = 'moss', stop, usage, highlight }) {
  const ref = useRef(null);
  const token = `--${family}-${stop}`;
  const [hex, setHex] = useState('—');
  useEffect(() => { setHex(resolveColor(`var(${token})`, ref.current) || '—'); }, [token]);
  return (
    <div
      ref={ref}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px',
        background: highlight ? 'color-mix(in oklch, var(--primary) 8%, transparent)' : 'var(--surface)',
        border: '1px solid ' + (highlight ? 'color-mix(in oklch, var(--primary) 30%, var(--border))' : 'var(--border)'),
        borderRadius: 8,
      }}
    >
      <div style={{ width: 28, height: 28, borderRadius: 6, background: `var(${token})`, border: '1px solid var(--border-strong)', flexShrink: 0 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="font-mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--foreground)' }}>{family}-{stop}</span>
          {highlight && <span className="gk-tiny" style={{ color: 'var(--primary)', fontWeight: 600 }}>★ alias</span>}
        </div>
        <div className="gk-tiny" style={{ color: 'var(--foreground-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usage}</div>
        <Mono copy={hex} dim size={10}>{hex}</Mono>
      </div>
    </div>
  );
}

window.ColorTokensLightArtboard = ColorTokensLightArtboard;
window.ColorTokensDarkArtboard = ColorTokensDarkArtboard;
