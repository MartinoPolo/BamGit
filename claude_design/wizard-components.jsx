/* Grovekeeper Creation Wizard — shared components */

const DEFAULT_COLOR_PALETTE = [
  '#e53e3e','#dd6b20','#d69e2e','#38a169','#3182ce','#805ad5',
  '#9b2c2c','#9c4221','#975a16','#276749','#2c5282','#553c9a',
  '#fc8181','#f6ad55','#f6e05e','#68d391','#63b3ed','#b794f4',
  '#1a202c','#ffffff','#a0aec0','#319795','#ed64a6','#8b5e3c',
];

const USED_COLORS = ['#dd6b20','#38a169','#3182ce','#fc8181','#319795'];

const MOCK_ISSUES = [
  { number: 172, title: 'Creation wizard design polish pass', state: 'OPEN' },
  { number: 168, title: 'Build session history browsing', state: 'OPEN' },
  { number: 165, title: 'Add workspace color picker to settings', state: 'OPEN' },
  { number: 163, title: 'Fix sidebar collapse animation glitch', state: 'OPEN' },
  { number: 160, title: 'Implement keyboard shortcut settings panel', state: 'CLOSED' },
  { number: 158, title: 'Dashboard card drag-and-drop reorder', state: 'OPEN' },
  { number: 155, title: 'Worktree auto-detection on launch', state: 'CLOSED' },
  { number: 152, title: 'Terminal output streaming for long tasks', state: 'OPEN' },
];

function relativeLuminance(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const lin = c => c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
  return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
}
function contrastText(hex) {
  return relativeLuminance(hex) > 0.2126 ? '#000000' : '#ffffff';
}

/* ─── Icons (inline SVG) ─── */
function IconSearch({size=14}) {
  return React.createElement('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},
    React.createElement('circle',{cx:11,cy:11,r:8}),
    React.createElement('path',{d:'m21 21-4.3-4.3'})
  );
}
function IconCircleDot({size=14}) {
  return React.createElement('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},
    React.createElement('circle',{cx:12,cy:12,r:10}),
    React.createElement('circle',{cx:12,cy:12,r:1,fill:'currentColor'})
  );
}
function IconCircleCheck({size=14}) {
  return React.createElement('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},
    React.createElement('circle',{cx:12,cy:12,r:10}),
    React.createElement('path',{d:'m9 12 2 2 4-4'})
  );
}
function IconTreePine({size=24}) {
  return React.createElement('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},
    React.createElement('path',{d:'m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z'}),
    React.createElement('path',{d:'M12 22v-3'})
  );
}
function IconX({size=24}) {
  return React.createElement('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},
    React.createElement('path',{d:'M18 6 6 18'}),
    React.createElement('path',{d:'m6 6 12 12'})
  );
}
function IconCornerDownLeft({size=12}) {
  return React.createElement('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},
    React.createElement('polyline',{points:'9 10 4 15 9 20'}),
    React.createElement('path',{d:'M20 4v7a4 4 0 0 1-4 4H4'})
  );
}
function IconDelete({size=12}) {
  return React.createElement('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},
    React.createElement('path',{d:'M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z'}),
    React.createElement('line',{x1:18,y1:9,x2:12,y2:15}),
    React.createElement('line',{x1:12,y1:9,x2:18,y2:15})
  );
}
function IconLoader({size=32}) {
  return React.createElement('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round',className:'wiz-spin'},
    React.createElement('path',{d:'M21 12a9 9 0 1 1-6.219-8.56'})
  );
}
function IconCircleX({size=32}) {
  return React.createElement('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'},
    React.createElement('circle',{cx:12,cy:12,r:10}),
    React.createElement('path',{d:'m15 9-6 6'}),
    React.createElement('path',{d:'m9 9 6 6'})
  );
}

/* ─── Kbd badge ─── */
function Kbd({children, inverted}) {
  return React.createElement('span', {
    className: 'wiz-kbd' + (inverted ? ' wiz-kbd-inv' : '')
  }, children);
}

/* ─── Expose everything ─── */
Object.assign(window, {
  DEFAULT_COLOR_PALETTE, USED_COLORS, MOCK_ISSUES,
  relativeLuminance, contrastText,
  IconSearch, IconCircleDot, IconCircleCheck, IconTreePine, IconX,
  IconCornerDownLeft, IconDelete, IconLoader, IconCircleX,
  Kbd,
});
