/* Grovekeeper Creation Wizard — step components */
const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ═══════════════════════════════════════════════════════════
   STEP 1 — Search GitHub Issues
   ═══════════════════════════════════════════════════════════ */
function StepGithubSearch({ onSelect, onSkip }) {
  const [query, setQuery] = useState('');
  const [selIdx, setSelIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const items = useMemo(() => {
    if (!query.trim()) return MOCK_ISSUES;
    const q = query.toLowerCase();
    return MOCK_ISSUES.filter(i =>
      i.title.toLowerCase().includes(q) || String(i.number).includes(q)
    );
  }, [query]);

  useEffect(() => { setSelIdx(0); }, [items.length]);

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelIdx(i => (i+1) % Math.max(items.length,1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelIdx(i => (i-1+items.length) % Math.max(items.length,1)); }
    else if (e.key === 'Enter') { e.preventDefault(); items[selIdx] ? onSelect(items[selIdx]) : onSkip(); }
  }, [items, selIdx, onSelect, onSkip]);

  return React.createElement('div', { className: 'wiz-step', onKeyDown: handleKey },
    React.createElement('div', { className: 'wiz-search-wrap' },
      React.createElement('span', { className: 'wiz-search-icon' }, React.createElement(IconSearch, { size: 14 })),
      React.createElement('input', {
        ref: inputRef,
        className: 'gk-input wiz-search-input',
        placeholder: 'Search issues…',
        value: query,
        onChange: e => setQuery(e.target.value),
      }),
    ),
    !query.trim() && React.createElement('p', { className: 'wiz-list-heading' }, 'Assigned to you'),
    items.length === 0
      ? React.createElement('div', { className: 'wiz-empty' }, 'No matching issues')
      : React.createElement('div', { className: 'wiz-issue-list' },
          items.map((item, idx) =>
            React.createElement('button', {
              key: item.number,
              className: 'wiz-issue-row' + (idx === selIdx ? ' is-selected' : ''),
              onClick: () => onSelect(item),
              onMouseEnter: () => setSelIdx(idx),
            },
              React.createElement('span', { className: 'wiz-issue-state' + (item.state === 'OPEN' ? ' is-open' : ' is-closed') },
                item.state === 'OPEN' ? React.createElement(IconCircleDot, { size: 14 }) : React.createElement(IconCircleCheck, { size: 14 })
              ),
              React.createElement('span', { className: 'wiz-issue-text' }, '#' + item.number + ' ' + item.title),
            )
          )
        ),
    React.createElement('button', { className: 'wiz-skip-link', onClick: onSkip },
      'Skip — create without GitHub issue'
    ),
  );
}

/* ═══════════════════════════════════════════════════════════
   STEP 2 — Issue Name
   ═══════════════════════════════════════════════════════════ */
function StepIssueName({ initial, issueNumber, onConfirm }) {
  const [name, setName] = useState(initial);
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current;
    if (el) { el.focus(); el.selectionStart = el.selectionEnd = el.value.length; }
  }, []);

  const branch = issueNumber
    ? issueNumber + '-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : '';

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); name.trim() && onConfirm(name.trim(), branch); }
  };

  return React.createElement('div', { className: 'wiz-step' },
    React.createElement('input', {
      ref: inputRef,
      className: 'gk-input',
      value: name,
      onChange: e => setName(e.target.value),
      onKeyDown: handleKey,
      placeholder: 'Issue name…',
    }),
    branch && React.createElement('p', { className: 'wiz-branch-preview' },
      'Branch: ', React.createElement('code', null, branch)
    ),
  );
}

/* ═══════════════════════════════════════════════════════════
   STEP 3 — Worktree Choice
   ═══════════════════════════════════════════════════════════ */
function StepWorktreeChoice({ onConfirm }) {
  const [choice, setChoice] = useState(true);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault(); setChoice(c => !c);
      } else if (e.key === 'Enter') {
        e.preventDefault(); onConfirm(choice);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [choice, onConfirm]);

  const card = (val, icon, label) => {
    const sel = choice === val;
    const colorClass = val ? 'wiz-wt-yes' : 'wiz-wt-no';
    return React.createElement('button', {
      className: 'wiz-wt-card' + (sel ? ' ' + colorClass : ''),
      onClick: () => { setChoice(val); },
    },
      icon,
      React.createElement('span', { className: 'wiz-wt-label' }, label),
    );
  };

  return React.createElement('div', { className: 'wiz-step wiz-step-center' },
    React.createElement('div', { className: 'wiz-wt-row' },
      card(true, React.createElement(IconTreePine, { size: 28 }), 'Yes'),
      card(false, React.createElement(IconX, { size: 28 }), 'No'),
    ),
  );
}

/* ═══════════════════════════════════════════════════════════
   STEP 4 — Color Selection
   ═══════════════════════════════════════════════════════════ */
function StepColorSelection({ onSelect, initial }) {
  const nextAvailable = DEFAULT_COLOR_PALETTE.find(c => !USED_COLORS.includes(c)) || DEFAULT_COLOR_PALETTE[0];
  const [selected, setSelected] = useState(initial || nextAvailable);
  const [focusIdx, setFocusIdx] = useState(() => {
    const i = DEFAULT_COLOR_PALETTE.indexOf(initial || nextAvailable);
    return i >= 0 ? i : 0;
  });
  const swatchRefs = useRef([]);
  const hexRef = useRef(null);

  useEffect(() => { swatchRefs.current[focusIdx]?.focus(); }, []);

  useEffect(() => { onSelect(selected); }, [selected]);

  const isUsed = (c) => USED_COLORS.includes(c) && c !== selected;

  const findNext = (from, step) => {
    const total = DEFAULT_COLOR_PALETTE.length;
    let idx = from;
    for (let i = 0; i < total; i++) {
      idx = (((idx + step) % total) + total) % total;
      if (!isUsed(DEFAULT_COLOR_PALETTE[idx])) return idx;
    }
    return from;
  };

  const handleGridKey = (e) => {
    let next;
    if (e.key === 'ArrowRight') next = findNext(focusIdx, 1);
    else if (e.key === 'ArrowLeft') next = findNext(focusIdx, -1);
    else if (e.key === 'ArrowDown') next = findNext(focusIdx, 6);
    else if (e.key === 'ArrowUp') next = findNext(focusIdx, -6);
    else return;
    e.preventDefault();
    setFocusIdx(next);
    setSelected(DEFAULT_COLOR_PALETTE[next]);
    swatchRefs.current[next]?.focus();
  };

  return React.createElement('div', { className: 'wiz-step' },
    React.createElement('div', { className: 'wiz-color-grid' },
      DEFAULT_COLOR_PALETTE.map((color, i) => {
        const used = isUsed(color);
        const isSel = color === selected;
        return React.createElement('button', {
          key: color,
          ref: el => swatchRefs.current[i] = el,
          className: 'wiz-swatch' + (isSel ? ' is-sel' : '') + (used ? ' is-used' : ''),
          style: { backgroundColor: color },
          disabled: used,
          tabIndex: i === focusIdx ? 0 : -1,
          onKeyDown: handleGridKey,
          onClick: () => { if (!used) { setSelected(color); setFocusIdx(i); } },
        },
          React.createElement('span', { style: { color: contrastText(color) } }, 'A'),
        );
      })
    ),
    React.createElement('hr', { className: 'gk-hr', style: { margin: '10px 0' } }),
    React.createElement('div', { className: 'wiz-hex-row' },
      React.createElement('label', {
        className: 'wiz-native-swatch',
        style: { backgroundColor: selected },
      },
        React.createElement('span', { style: { color: contrastText(selected), pointerEvents:'none' } }, 'A'),
        React.createElement('input', {
          type: 'color', value: selected,
          onChange: e => { setSelected(e.target.value); },
          style: { position:'absolute', inset:0, opacity:0, cursor:'pointer' },
        }),
      ),
      React.createElement('input', {
        ref: hexRef,
        className: 'gk-input',
        value: selected,
        onChange: e => {
          const v = e.target.value;
          if (/^#[0-9a-fA-F]{6}$/.test(v)) setSelected(v);
        },
        placeholder: '#000000',
        style: { flex:1 },
      }),
    ),
  );
}

/* ═══════════════════════════════════════════════════════════
   STEP 5 — Worktree Progress
   ═══════════════════════════════════════════════════════════ */
function StepWorktreeProgress({ onClose }) {
  const [state, setState] = useState('pending');
  useEffect(() => {
    const t = setTimeout(() => setState('active'), 2200);
    return () => clearTimeout(t);
  }, []);

  if (state === 'pending') {
    return React.createElement('div', { className: 'wiz-progress' },
      React.createElement(IconLoader, { size: 32 }),
      React.createElement('p', null, 'Setting up worktree…'),
    );
  }
  if (state === 'active') {
    return React.createElement('div', { className: 'wiz-progress is-success' },
      React.createElement(IconCircleCheck, { size: 32 }),
      React.createElement('p', null, 'Worktree ready!'),
      React.createElement('button', { className: 'gk-btn gk-btn-ghost gk-btn-sm', onClick: onClose }, 'OK'),
    );
  }
  return React.createElement('div', { className: 'wiz-progress is-fail' },
    React.createElement(IconCircleX, { size: 32 }),
    React.createElement('p', null, 'Setup failed'),
    React.createElement('button', { className: 'gk-btn gk-btn-ghost gk-btn-sm', onClick: () => setState('pending') }, 'Retry'),
  );
}

Object.assign(window, {
  StepGithubSearch, StepIssueName, StepWorktreeChoice,
  StepColorSelection, StepWorktreeProgress,
});
