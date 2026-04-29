/* global React */
// Tree.jsx — Low-poly tree generator (pure SVG, deterministic by seed).
// Renders trees in 11 stages reflecting issue/PR/worktree state.

const TRUNK = {
  light:  '#a87144',
  base:   '#7a4f2c',
  dark:   '#523619',
};

const FOLIAGE_SPRING = { l: '#a8d96a', m: '#7ab84a', d: '#4a8c2c', dd: '#2f6a18' };
const FOLIAGE_SUMMER = { l: '#9ed760', m: '#6ea838', d: '#3f7818', dd: '#27580a' };
const FOLIAGE_AUTUMN = { l: '#e8a64a', m: '#cc7a28', d: '#9a4f12', dd: '#6e3208' };
const FOLIAGE_FLOWER = { l: '#f4d4e0', m: '#e8a8c0', d: '#c47a98', dd: '#9c5478' };
const FOLIAGE_DEAD   = { l: '#8a7a68', m: '#6c5d4e', d: '#4a3e34', dd: '#2e2620' };
const SNOW           = { l: '#ffffff', m: '#e8eef0', d: '#bcc7cc' };

// --- Seeded RNG ---
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build a low-poly canopy "blob" — ring of triangles from random points around a circle.
function buildBlob(cx, cy, r, jitter, rng, palette, count = 9) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rng() * 0.3;
    const rad = r * (1 - jitter * 0.5 + rng() * jitter);
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  // Triangulate as fan from center
  const tris = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    // pick shade based on position relative to light source (top-left)
    const midY = (a[1] + b[1]) / 2;
    const midX = (a[0] + b[0]) / 2;
    const lightFactor = (cx - midX) * 0.5 + (cy - midY); // higher = darker (right + bottom)
    let fill;
    if (lightFactor < -r * 0.35) fill = palette.l;
    else if (lightFactor < 0) fill = palette.m;
    else if (lightFactor < r * 0.4) fill = palette.d;
    else fill = palette.dd;
    tris.push({ pts: [[cx, cy], a, b], fill });
  }
  return tris;
}

function trianglesToPaths(tris) {
  return tris.map((t, i) => (
    <polygon
      key={i}
      points={t.pts.map(p => p.join(',')).join(' ')}
      fill={t.fill}
      stroke={t.fill}
      strokeWidth="0.6"
      strokeLinejoin="round"
    />
  ));
}

// Different canopy compositions per shape
function buildCanopy(shape, rng, palette, scale = 1) {
  const tris = [];
  const blob = (cx, cy, r, j = 0.18, n = 9) => {
    tris.push(...buildBlob(cx, cy, r * scale, j, rng, palette, n));
  };
  if (shape === 'oak') {
    blob(0, -42, 28); blob(-22, -36, 22); blob(22, -38, 24); blob(0, -56, 22);
  } else if (shape === 'birch') {
    blob(0, -50, 22); blob(-14, -38, 18); blob(16, -42, 20);
  } else if (shape === 'willow') {
    blob(-18, -38, 20); blob(18, -42, 22); blob(0, -32, 16);
    blob(-22, -22, 14, 0.25); blob(22, -24, 14, 0.25);
  } else if (shape === 'maple') {
    blob(0, -46, 26); blob(-26, -38, 20); blob(26, -40, 22); blob(-12, -58, 18); blob(14, -56, 18);
  } else if (shape === 'baobab') {
    blob(0, -54, 30); blob(-30, -50, 18); blob(30, -50, 18);
  } else {
    blob(0, -44, 26); blob(-20, -38, 20); blob(20, -40, 22);
  }
  return tris;
}

// Conifer (fir/pine/cypress/spruce) — stacked triangles
function buildConifer(shape, rng, palette, scale = 1) {
  const tris = [];
  const layers = shape === 'cypress' ? 5 : 4;
  for (let i = 0; i < layers; i++) {
    const y = -20 - i * 14 * scale;
    const w = (28 - i * 4) * scale;
    const h = 22 * scale;
    const apex = [0, y - h];
    const left = [-w, y];
    const right = [w, y];
    const mid = [0, y - h * 0.4];
    tris.push({ pts: [apex, left, mid], fill: palette.m });
    tris.push({ pts: [apex, mid, right], fill: palette.d });
    tris.push({ pts: [left, [-w * 0.4, y - h * 0.6], mid], fill: palette.l });
    tris.push({ pts: [right, mid, [w * 0.4, y - h * 0.6]], fill: palette.dd });
  }
  return tris;
}

// Snow caps for evergreens in winter
function buildSnowCaps(shape, scale = 1) {
  const caps = [];
  const layers = shape === 'cypress' ? 5 : 4;
  for (let i = 0; i < layers; i++) {
    const y = -20 - i * 14 * scale;
    const w = (28 - i * 4) * scale;
    const h = 22 * scale;
    const apex = [0, y - h];
    // small snow cap covering top portion
    caps.push({ pts: [apex, [-w * 0.45, y - h * 0.55], [0, y - h * 0.4], [w * 0.45, y - h * 0.55]], fill: SNOW.l });
    caps.push({ pts: [apex, [-w * 0.45, y - h * 0.55], [0, y - h * 0.4]], fill: SNOW.l });
    caps.push({ pts: [[-w * 0.45, y - h * 0.55], [0, y - h * 0.4], [-w * 0.2, y - h * 0.3]], fill: SNOW.m });
  }
  return caps.map((c, i) => (
    <polygon
      key={'snow-' + i}
      points={c.pts.map(p => p.join(',')).join(' ')}
      fill={c.fill}
      stroke={c.fill}
      strokeWidth="0.5"
      strokeLinejoin="round"
    />
  ));
}

// Trunk path (tapered low-poly)
function buildTrunk(rng, scale = 1, height = 28) {
  const h = height * scale;
  const wb = 6 * scale; // base width
  const wt = 4 * scale; // top width
  const left = [
    [-wb, 0], [-wb * 0.95, -h * 0.3], [-wt * 0.85, -h * 0.65], [-wt, -h]
  ];
  const right = [
    [wt, -h], [wt * 0.85, -h * 0.65], [wb * 0.95, -h * 0.3], [wb, 0]
  ];
  const path = `M ${left.map(p => p.join(',')).join(' L ')} L ${right.map(p => p.join(',')).join(' L ')} Z`;
  // Light side
  const lightPath = `M ${left.map(p => p.join(',')).join(' L ')} L ${[0, -h]} L ${[0, 0]} Z`;
  return { path, lightPath, top: -h };
}

// Small fruits
function fruit(type, x, y, key) {
  const size = 4;
  if (type === 'apple') return <circle key={key} cx={x} cy={y} r={size * 0.8} fill="#d83a2c" stroke="#7a1c14" strokeWidth="0.4" />;
  if (type === 'cherry') return (
    <g key={key}>
      <circle cx={x - 1.5} cy={y} r={2.4} fill="#c4243a" stroke="#6c0e1f" strokeWidth="0.4" />
      <circle cx={x + 1.5} cy={y + 0.5} r={2.4} fill="#c4243a" stroke="#6c0e1f" strokeWidth="0.4" />
      <path d={`M ${x - 1.5} ${y - 2} Q ${x} ${y - 6} ${x + 1.5} ${y - 1.5}`} stroke="#3a5a18" strokeWidth="0.6" fill="none" />
    </g>
  );
  if (type === 'berry') return (
    <g key={key}>
      <circle cx={x} cy={y} r={1.4} fill="#3d2748" />
      <circle cx={x + 1.6} cy={y - 0.6} r={1.4} fill="#3d2748" />
      <circle cx={x - 1.6} cy={y - 0.6} r={1.4} fill="#5a3868" />
      <circle cx={x} cy={y - 2} r={1.4} fill="#3d2748" />
    </g>
  );
  if (type === 'acorn') return (
    <g key={key}>
      <ellipse cx={x} cy={y} rx={1.6} ry={2.2} fill="#a87144" />
      <path d={`M ${x - 1.8} ${y - 1.2} Q ${x} ${y - 3.4} ${x + 1.8} ${y - 1.2} Z`} fill="#523619" />
    </g>
  );
  return <circle key={key} cx={x} cy={y} r={1.6} fill="#cf6a2c" />;
}

// --- Stages ---
// 11 stages from the engine: seed, sprouting, sapling, growing, leafy, fruiting, flowering, seasonal, bare, dead, stump
// + special: snowy (evergreen winter)

function Tree({
  stage = 'leafy',
  shape = 'oak',         // oak | birch | willow | maple | baobab | fir | pine | cypress
  season = 'summer',     // spring | summer | autumn | winter
  fruitType = 'apple',
  fruitCount = 0,
  seed = 1,
  size = 160,            // canvas px
  glow = false,
  evergreen,             // override; otherwise inferred from shape
  showGround = true,
}) {
  const rng = mulberry32(seed);
  const isEvergreen = evergreen ?? ['fir', 'pine', 'cypress', 'spruce'].includes(shape);

  // Choose palette by season
  let palette = FOLIAGE_SUMMER;
  if (season === 'spring') palette = FOLIAGE_SPRING;
  else if (season === 'autumn' && !isEvergreen) palette = FOLIAGE_AUTUMN;
  else if (season === 'winter' && !isEvergreen) palette = FOLIAGE_DEAD;

  // Stage adjustments
  if (stage === 'flowering') palette = FOLIAGE_FLOWER;
  if (stage === 'dead') palette = FOLIAGE_DEAD;
  if (stage === 'bare') palette = null;

  // Scale by stage
  let trunkH = 28;
  let canopyScale = 1;
  if (stage === 'sapling') { trunkH = 10; canopyScale = 0.35; }
  else if (stage === 'growing') { trunkH = 18; canopyScale = 0.6; }
  else if (stage === 'leafy' || stage === 'fruiting' || stage === 'seasonal' || stage === 'flowering') {
    trunkH = 28; canopyScale = 1;
  } else if (stage === 'bare' || stage === 'dead') { trunkH = 28; canopyScale = 0.9; }
  else if (stage === 'stump') { trunkH = 6; canopyScale = 0; }
  else if (stage === 'sprouting') { trunkH = 4; canopyScale = 0.18; }
  else if (stage === 'seed') { trunkH = 0; canopyScale = 0; }

  const trunk = buildTrunk(rng, 1, trunkH);

  let canopy = [];
  if (canopyScale > 0 && stage !== 'bare') {
    if (isEvergreen) {
      canopy = buildConifer(shape, rng, palette || FOLIAGE_SUMMER, canopyScale);
    } else {
      canopy = buildCanopy(shape, rng, palette || FOLIAGE_SUMMER, canopyScale);
    }
  }

  // Bare (winter): just branches
  let branches = null;
  if (stage === 'bare' || stage === 'dead' || (season === 'winter' && !isEvergreen && stage !== 'leafy')) {
    branches = (
      <g stroke={TRUNK.dark} strokeWidth="1.2" fill="none" strokeLinecap="round">
        <path d={`M 0 ${-trunkH} Q -8 ${-trunkH - 8} -16 ${-trunkH - 14}`} />
        <path d={`M 0 ${-trunkH} Q 8 ${-trunkH - 6} 18 ${-trunkH - 16}`} />
        <path d={`M 0 ${-trunkH} Q 0 ${-trunkH - 14} -4 ${-trunkH - 22}`} />
        <path d={`M 0 ${-trunkH} Q 4 ${-trunkH - 12} 10 ${-trunkH - 26}`} />
        <path d={`M -16 ${-trunkH - 14} Q -22 ${-trunkH - 18} -26 ${-trunkH - 22}`} />
      </g>
    );
  }

  // Snow caps for evergreens in winter
  let snow = null;
  if (season === 'winter' && isEvergreen && canopyScale > 0) {
    snow = buildSnowCaps(shape, canopyScale);
  }

  // Fruits — placed at canopy edge
  const fruits = [];
  if (stage === 'fruiting' && fruitCount > 0) {
    for (let i = 0; i < Math.min(fruitCount, 7); i++) {
      const a = (i / Math.max(fruitCount, 1)) * Math.PI * 2 + rng() * 0.4;
      const r = 22 + rng() * 6;
      const x = Math.cos(a) * r;
      const y = -42 + Math.sin(a) * r * 0.7;
      fruits.push(fruit(fruitType, x, y, 'f' + i));
    }
  }

  // Seed (just a sprout in soil)
  if (stage === 'seed') {
    const s = size;
    return (
      <svg width={s} height={s} viewBox={`-${s/2} -${s/2} ${s} ${s}`} className={glow ? 'gk-glow' : ''}>
        {showGround && <ellipse cx="0" cy="0" rx="32" ry="6" fill="rgba(60,40,20,0.35)" />}
        <ellipse cx="0" cy="0" rx="14" ry="4" fill="#3a2a1c" />
        <path d="M -1 -2 Q 0 -8 2 -3" stroke="#7ab84a" strokeWidth="1.2" fill="none" />
        <ellipse cx="2" cy="-7" rx="2.5" ry="1.2" fill="#7ab84a" transform="rotate(20 2 -7)" />
      </svg>
    );
  }

  if (stage === 'stump') {
    const s = size;
    return (
      <svg width={s} height={s} viewBox={`-${s/2} -${s/2} ${s} ${s}`} className={glow ? 'gk-glow' : ''}>
        {showGround && <ellipse cx="0" cy="0" rx="32" ry="6" fill="rgba(60,40,20,0.35)" />}
        <ellipse cx="0" cy="-6" rx="10" ry="3.5" fill={TRUNK.base} />
        <ellipse cx="0" cy="-7.5" rx="9.5" ry="3" fill={TRUNK.light} />
        <path d="M -8 -7.5 Q 0 -10 8 -7.5" stroke={TRUNK.dark} strokeWidth="0.5" fill="none" />
        <path d="M -5 -8 Q 0 -10 5 -8" stroke={TRUNK.dark} strokeWidth="0.5" fill="none" />
        <ellipse cx="0" cy="-8" rx="2" ry="0.8" fill={TRUNK.dark} />
      </svg>
    );
  }

  const s = size;
  return (
    <svg width={s} height={s} viewBox={`-${s/2} -${s/2} ${s} ${s}`} className={glow ? 'gk-glow' : ''} aria-hidden="true">
      {showGround && <ellipse cx="0" cy="0" rx="36" ry="6" fill="rgba(60,40,20,0.32)" />}
      {/* trunk */}
      <path d={trunk.path} fill={TRUNK.base} stroke={TRUNK.dark} strokeWidth="0.5" strokeLinejoin="round" />
      <path d={trunk.lightPath} fill={TRUNK.light} opacity="0.7" />
      {branches}
      {trianglesToPaths(canopy)}
      {snow}
      {fruits}
    </svg>
  );
}

window.Tree = Tree;
