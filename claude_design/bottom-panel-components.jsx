/* global React, I, SessionBadge, ProviderChip, ToolCardL1, DimmedTurn */
/* Bottom Panel — Session Tab — Three Layout Variants */

/* ════════════════════════════════════════════════════════════
   SHARED COMPACT PRIMITIVES
   Tighter than the full session view — designed for 250-350px panel
   ════════════════════════════════════════════════════════════ */

const BP_PANEL_HEIGHT = 310;

/* Provider icon (small colored square with zap) */
function ProviderIcon({ provider = 'Claude Code', size = 16 }) {
  const colors = { 'Claude Code': 'var(--amber-400)', 'OpenCode': 'var(--azure-400)', 'Codex': 'var(--status-success)' };
  return (
    <div style={{ width: size, height: size, borderRadius: 3, background: colors[provider] || 'var(--foreground-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <I.Zap size={size * 0.55} sw={2.4} style={{ color: 'var(--background)' }}/>
    </div>
  );
}

/* Compact status dot (no label, just a colored dot for tight spaces) */
function StatusDot({ state, size = 6 }) {
  const colors = {
    running: 'var(--status-success)', 'needs-input': 'var(--status-warning)',
    finished: 'var(--moss-400)', errored: 'var(--status-danger)',
    stopped: 'var(--status-warning)',
  };
  const pulse = state === 'running' || state === 'needs-input';
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: colors[state] || 'var(--foreground-subtle)',
      animation: pulse ? 'gk-pulse 1.8s ease-in-out infinite' : 'none',
    }}/>
  );
}

/* Compact user message (right-aligned, single-line truncated) */
function CompactUserMsg({ text, dimmed }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', opacity: dimmed ? 0.4 : 1, transition: 'opacity 150ms ease-out' }}>
      <div style={{
        maxWidth: '85%', padding: '5px 10px', borderRadius: '10px 10px 3px 10px',
        background: 'var(--primary-soft)', color: 'var(--foreground)',
        fontSize: 12, lineHeight: 1.45,
        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>
        {text}
      </div>
    </div>
  );
}

/* Compact assistant message (left-aligned, 2-line clamp with fade) */
function CompactAssistantMsg({ children, dimmed, streaming }) {
  return (
    <div style={{ opacity: dimmed ? 0.4 : 1, transition: 'opacity 150ms ease-out' }}>
      <div style={{
        fontSize: 12, lineHeight: 1.5, color: 'var(--foreground)',
        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        position: 'relative',
      }}>
        {children}
        {streaming && <span style={{ display: 'inline-block', width: 2, height: 12, background: 'var(--primary)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'gk-pulse 1s ease-in-out infinite' }}/>}
      </div>
    </div>
  );
}

/* Compact tool call (single-line, 28px height) */
function CompactToolCall({ tool, detail, status = 'success' }) {
  const t = window.TOOL_ICONS?.[tool] || { icon: (p) => <I.Terminal {...p}/>, color: 'var(--foreground-subtle)' };
  const statusIcon = status === 'success'
    ? <I.Check size={10} sw={2.4} style={{ color: 'var(--status-success)' }}/>
    : status === 'running'
    ? <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', border: '1.5px solid var(--foreground-muted)', borderTopColor: 'transparent', animation: 'gk-spin 0.7s linear infinite' }}/>
    : <I.X size={10} sw={2.4} style={{ color: 'var(--status-danger)' }}/>;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, height: 26, padding: '0 8px',
      borderRadius: 5, background: 'var(--surface-2)', border: '1px solid var(--border)',
      fontSize: 11, opacity: 0.8,
    }}>
      <span style={{ color: t.color, display: 'flex' }}>{t.icon({ size: 11, sw: 1.8 })}</span>
      <span style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: 11 }}>{tool}</span>
      <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail}</span>
      {statusIcon}
    </div>
  );
}

/* Compact input bar (pinned at bottom) */
function CompactInput({ disabled }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
      borderTop: '1px solid var(--border)', background: 'var(--surface)',
      flexShrink: 0,
    }}>
      <div style={{
        flex: 1, height: 26, display: 'flex', alignItems: 'center',
        padding: '0 8px', borderRadius: 'var(--radius-sm)',
        background: disabled ? 'var(--surface-2)' : 'var(--surface)',
        border: '1px solid var(--border)', fontSize: 12,
        color: disabled ? 'var(--foreground-subtle)' : 'var(--foreground-subtle)',
        opacity: disabled ? 0.5 : 1,
      }}>
        <span style={{ opacity: 0.5 }}>Message or /command…</span>
      </div>
      <button className="gk-btn gk-btn-primary gk-btn-sm gk-btn-icon" style={{ width: 26, height: 26, padding: 0, borderRadius: 6 }}>
        <I.Send size={11} sw={2}/>
      </button>
    </div>
  );
}

/* "Open full session" link button */
function OpenFullLink({ style: s }) {
  return (
    <button className="gk-btn gk-btn-ghost gk-btn-sm" style={{ fontSize: 11, gap: 4, color: 'var(--primary)', padding: '0 6px', ...s }}>
      Open full session <I.ExternalLink size={10} sw={2}/>
    </button>
  );
}

/* Compact dimmed turn wrapper */
function CompactDimmedTurn({ children }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div style={{ opacity: hovered ? 1 : 0.4, transition: 'opacity 150ms ease-out', display: 'flex', flexDirection: 'column', gap: 4 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {children}
    </div>
  );
}


/* ════════════════════════════════════════════════════════════
   VARIANT A — Session tabs + truncated chat
   Horizontal tabs at top, last messages in chat stream,
   quick-action row and input at bottom.
   ════════════════════════════════════════════════════════════ */

function VariantA() {
  const [activeTab, setActiveTab] = React.useState(0);
  const sessions = [
    { id: 1, label: 'Session 1', state: 'running', provider: 'Claude Code', model: 'Opus 4.7', cost: '$4.38', lastActivity: '2m ago', startTime: '2:14 PM' },
    { id: 2, label: 'Session 2', state: 'finished', provider: 'Claude Code', model: 'Sonnet 4', cost: '$1.22', lastActivity: '18m ago', startTime: '1:42 PM' },
  ];
  const active = sessions[activeTab];

  return (
    <div className="theme-dark gk-root" data-theme="dark" style={{
      width: '100%', height: BP_PANEL_HEIGHT, display: 'flex', flexDirection: 'column',
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
      overflow: 'hidden', fontFamily: 'var(--font-sans)',
    }}>
      {/* ── Top bar: tabs + open full ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px',
        height: 36, flexShrink: 0, borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        {/* Session tabs */}
        <div style={{ display: 'flex', gap: 1, flex: 1 }}>
          {sessions.map((s, i) => (
            <button key={s.id} onClick={() => setActiveTab(i)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
              borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
              background: activeTab === i ? 'var(--surface-2)' : 'transparent',
              color: activeTab === i ? 'var(--foreground)' : 'var(--foreground-muted)',
              fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-sans)',
              transition: 'all 120ms ease',
            }}>
              <ProviderIcon provider={s.provider} size={14}/>
              <StatusDot state={s.state}/>
              <span>{s.startTime}</span>
              {activeTab === i && <SessionBadge state={s.state}/>}
            </button>
          ))}
          {/* New session button */}
          <button className="gk-btn gk-btn-ghost gk-btn-sm gk-btn-icon" style={{ width: 24, height: 24, opacity: 0.5 }}>
            <I.Plus size={12} sw={2}/>
          </button>
        </div>
        <OpenFullLink/>
      </div>

      {/* ── Status summary row ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '5px 12px',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
        fontSize: 11, color: 'var(--foreground-muted)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ProviderIcon provider={active.provider} size={13}/>
          <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>{active.provider}</span>
        </span>
        <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-subtle)' }}>{active.model}</span>
        <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-subtle)' }}>{active.cost}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--foreground-subtle)' }}>{active.lastActivity}</span>
      </div>

      {/* ── Message preview (scrollable middle) ── */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '8px 12px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {activeTab === 0 ? (
          <>
            <CompactDimmedTurn>
              <CompactUserMsg text="Implement the provider trait for OpenCode. Follow the same pattern as the Claude Code provider." dimmed/>
              <CompactAssistantMsg dimmed>I'll examine the existing provider to understand the pattern.</CompactAssistantMsg>
              <CompactToolCall tool="Read" detail="src/providers/claude_code.rs" status="success"/>
            </CompactDimmedTurn>
            <CompactUserMsg text="Good. Now run the tests to make sure everything compiles."/>
            <CompactAssistantMsg streaming>Running the test suite to verify compilation.</CompactAssistantMsg>
            <CompactToolCall tool="Bash" detail="$ cargo test --workspace" status="running"/>
          </>
        ) : (
          <>
            <CompactDimmedTurn>
              <CompactUserMsg text="Review the PR diff and check for any issues." dimmed/>
              <CompactAssistantMsg dimmed>I'll review the changes in the PR.</CompactAssistantMsg>
            </CompactDimmedTurn>
            <CompactAssistantMsg>Review complete. The PR looks good — all tests pass, no issues found. Ready to merge.</CompactAssistantMsg>
          </>
        )}
      </div>

      {/* ── Input bar ── */}
      <CompactInput disabled={activeTab === 1}/>
    </div>
  );
}


/* ════════════════════════════════════════════════════════════
   VARIANT B — Session selector + status-first
   Dropdown picker, compact status card, short message preview,
   "Reply" button expands inline input.
   ════════════════════════════════════════════════════════════ */

function VariantB() {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [replyOpen, setReplyOpen] = React.useState(false);
  const [selectedIdx, setSelectedIdx] = React.useState(0);

  const sessions = [
    { id: 1, state: 'running', provider: 'Claude Code', model: 'Opus 4.7', cost: '$4.38', lastActivity: '2m ago', startTime: '2:14 PM' },
    { id: 2, state: 'finished', provider: 'Claude Code', model: 'Sonnet 4', cost: '$1.22', lastActivity: '18m ago', startTime: '1:42 PM' },
  ];
  const active = sessions[selectedIdx];

  return (
    <div className="theme-dark gk-root" data-theme="dark" style={{
      width: '100%', height: BP_PANEL_HEIGHT, display: 'flex', flexDirection: 'column',
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
      overflow: 'hidden', fontFamily: 'var(--font-sans)',
    }}>
      {/* ── Top bar: dropdown session picker ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px',
        height: 36, flexShrink: 0, borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', position: 'relative',
      }}>
        {/* Session dropdown */}
        <div style={{ position: 'relative', flex: 1 }}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            background: 'var(--surface-2)', cursor: 'pointer',
            color: 'var(--foreground)', fontSize: 12, fontWeight: 500,
            fontFamily: 'var(--font-sans)', width: '100%', maxWidth: 280,
          }}>
            <ProviderIcon provider={active.provider} size={14}/>
            <StatusDot state={active.state}/>
            <span>{active.startTime}</span>
            <SessionBadge state={active.state}/>
            <span style={{ marginLeft: 'auto', display: 'flex' }}><I.Chevron size={11} sw={2} style={{ color: 'var(--foreground-subtle)' }}/></span>
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="gk-popover" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 280, zIndex: 30, padding: 4 }}>
              {sessions.map((s, i) => (
                <div key={s.id} onClick={() => { setSelectedIdx(i); setDropdownOpen(false); }}
                  className="gk-popover-item" style={{
                    background: selectedIdx === i ? 'var(--primary-soft)' : 'transparent',
                    gap: 6,
                  }}>
                  <ProviderIcon provider={s.provider} size={14}/>
                  <StatusDot state={s.state}/>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{s.startTime}</span>
                  <SessionBadge state={s.state}/>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)', marginLeft: 'auto' }}>{s.cost}</span>
                </div>
              ))}
              <div className="gk-popover-divider"/>
              <div className="gk-popover-item" style={{ color: 'var(--foreground-subtle)', fontSize: 12, gap: 6 }}>
                <I.Plus size={12} sw={2}/> Spawn new session
              </div>
            </div>
          )}
        </div>

        <button className="gk-btn gk-btn-ghost gk-btn-sm gk-btn-icon" style={{ width: 24, height: 24, opacity: 0.5 }}>
          <I.Plus size={12} sw={2}/>
        </button>
      </div>

      {/* ── Status summary card ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
        background: 'color-mix(in oklch, var(--surface-2) 50%, transparent)',
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <SessionBadge state={active.state}/>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ProviderIcon provider={active.provider} size={13}/>
              <span style={{ fontWeight: 500, color: 'var(--foreground)', fontSize: 11.5 }}>{active.provider}</span>
            </span>
            <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-subtle)' }}>· {active.model}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10.5, color: 'var(--foreground-subtle)' }}>
            <span className="font-mono">Cost: {active.cost}</span>
            <span>Last active: {active.lastActivity}</span>
          </div>
        </div>
        <OpenFullLink/>
      </div>

      {/* ── Message preview ── */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '8px 12px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {selectedIdx === 0 ? (
          <>
            <CompactDimmedTurn>
              <CompactUserMsg text="Implement the provider trait for OpenCode." dimmed/>
            </CompactDimmedTurn>
            <CompactAssistantMsg streaming>Running the test suite to verify compilation across all workspaces.</CompactAssistantMsg>
            <CompactToolCall tool="Bash" detail="$ cargo test --workspace" status="running"/>
          </>
        ) : (
          <>
            <CompactAssistantMsg>Review complete. The PR looks good — all tests pass, no issues found. Ready to merge.</CompactAssistantMsg>
          </>
        )}
      </div>

      {/* ── Bottom: Reply button or expanded input ── */}
      {replyOpen ? (
        <CompactInput disabled={selectedIdx === 1}/>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
          borderTop: '1px solid var(--border)', background: 'var(--surface)',
          flexShrink: 0,
        }}>
          <button className="gk-btn gk-btn-secondary gk-btn-sm" onClick={() => setReplyOpen(true)} style={{ flex: 1, justifyContent: 'center' }}>
            <I.CornerDown size={11} sw={2}/> Reply
          </button>
        </div>
      )}
    </div>
  );
}


/* ════════════════════════════════════════════════════════════
   VARIANT C — Split list + preview
   Left column (~35%): session list
   Right column (~65%): messages + input
   ════════════════════════════════════════════════════════════ */

function VariantC() {
  const [selectedIdx, setSelectedIdx] = React.useState(0);

  const sessions = [
    { id: 1, state: 'running', provider: 'Claude Code', model: 'Opus 4.7', cost: '$4.38', lastActivity: '2m ago', startTime: '2:14 PM', title: 'Implement OpenCode provider' },
    { id: 2, state: 'finished', provider: 'Claude Code', model: 'Sonnet 4', cost: '$1.22', lastActivity: '18m ago', startTime: '1:42 PM', title: 'Review PR diff' },
  ];
  const active = sessions[selectedIdx];

  return (
    <div className="theme-dark gk-root" data-theme="dark" style={{
      width: '100%', height: BP_PANEL_HEIGHT, display: 'flex',
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
      overflow: 'hidden', fontFamily: 'var(--font-sans)',
    }}>
      {/* ── Left column: session list ── */}
      <div style={{
        width: '35%', minWidth: 200, maxWidth: 280, borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--background)',
      }}>
        {/* List header */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '0 10px',
          height: 36, flexShrink: 0, borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--foreground-muted)', flex: 1, letterSpacing: '0.01em' }}>Sessions</span>
          <button className="gk-btn gk-btn-ghost gk-btn-sm gk-btn-icon" style={{ width: 24, height: 24, opacity: 0.5 }}>
            <I.Plus size={12} sw={2}/>
          </button>
        </div>

        {/* Session list items */}
        <div style={{ flex: 1, overflow: 'auto', padding: '4px' }}>
          {sessions.map((s, i) => (
            <div key={s.id} onClick={() => setSelectedIdx(i)} style={{
              display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 10px',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: selectedIdx === i ? 'var(--surface-2)' : 'transparent',
              borderLeft: selectedIdx === i ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 120ms ease',
              marginBottom: 2,
            }}>
              {/* Row 1: provider icon + state + time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <ProviderIcon provider={s.provider} size={14}/>
                <SessionBadge state={s.state}/>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)', marginLeft: 'auto' }}>{s.lastActivity}</span>
              </div>
              {/* Row 2: cost + model */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 19, fontSize: 10, color: 'var(--foreground-subtle)' }}>
                <span className="font-mono">{s.model}</span>
                <span className="font-mono" style={{ marginLeft: 'auto' }}>{s.cost}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right column: preview + input ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Preview header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
          height: 36, flexShrink: 0, borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}>
          <SessionBadge state={active.state}/>
          <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--foreground)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {active.provider} · {active.model}
          </span>
          <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-subtle)' }}>{active.cost}</span>
          <OpenFullLink/>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflow: 'auto', padding: '8px 12px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {selectedIdx === 0 ? (
            <>
              <CompactDimmedTurn>
                <CompactUserMsg text="Implement the provider trait for OpenCode. Follow the same pattern as the Claude Code provider." dimmed/>
                <CompactAssistantMsg dimmed>I'll examine the existing provider to understand the pattern.</CompactAssistantMsg>
                <CompactToolCall tool="Read" detail="src/providers/claude_code.rs" status="success"/>
              </CompactDimmedTurn>
              <CompactUserMsg text="Good. Now run the tests."/>
              <CompactAssistantMsg streaming>Running the test suite to verify compilation.</CompactAssistantMsg>
              <CompactToolCall tool="Bash" detail="$ cargo test --workspace" status="running"/>
            </>
          ) : (
            <>
              <CompactDimmedTurn>
                <CompactUserMsg text="Review the PR diff and check for any issues." dimmed/>
              </CompactDimmedTurn>
              <CompactAssistantMsg>Review complete. The PR looks good — all tests pass. Ready to merge.</CompactAssistantMsg>
            </>
          )}
        </div>

        {/* Input */}
        <CompactInput disabled={selectedIdx === 1}/>
      </div>
    </div>
  );
}


Object.assign(window, {
  ProviderIcon, StatusDot, CompactUserMsg, CompactAssistantMsg, CompactToolCall,
  CompactInput, OpenFullLink, CompactDimmedTurn,
  VariantA, VariantB, VariantC,
  BP_PANEL_HEIGHT,
});
