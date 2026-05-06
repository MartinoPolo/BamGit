/* global React, I, SessionBadge, ProviderChip, ProgressBar, ctxColor, quotaColor,
   AgentTreeContent, SessionTabs, ChatInput, ToolCardL1, ToolCardL2, ToolCardL3Perm,
   UserMsg, AssistantMsg, SystemMsg, InlineCode, ToolGroup, SubAgentExpansion */

/* ── Top Bar ───────────────────────────────────────────────── */
function TopBar({ state = 'running', title = 'Implement OpenCode provider', showTooltip }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0, height: 40 }}>
      {/* Left: title + badge */}
      <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>{title}</span>
      <SessionBadge state={state}/>

      {/* Center: git context */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <I.GitBranch size={12} sw={1.6} style={{ color: 'var(--foreground-subtle)' }}/>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--foreground-muted)' }}>feat/session-ui</span>
        <span className="gk-badge gk-badge-info" style={{ height: 17, fontSize: 10 }}>#90 open</span>
        <span className="gk-badge gk-badge-moss" style={{ height: 17, fontSize: 10 }}>PR #5 draft</span>
      </div>

      {/* Right: actions + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <button className="gk-btn gk-btn-secondary gk-btn-sm" style={{ fontSize: 11, gap: 4 }}>
            <I.ExternalLink size={11} sw={1.8}/> Open in CLI
          </button>
          {showTooltip && (
            <div className="gk-tooltip" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, whiteSpace: 'nowrap', zIndex: 50, fontSize: 11 }}>
              <span className="font-mono" style={{ fontSize: 10.5 }}>claude --resume ses_01HXK…4mZ</span>
            </div>
          )}
        </div>
        <button className="gk-btn gk-btn-ghost gk-btn-sm gk-btn-icon" style={{ width: 26, height: 26 }}>
          <I.More size={14} sw={2}/>
        </button>
        <div style={{ width: 1, height: 18, background: 'var(--border)' }}></div>
        <SessionTabs active="chat"/>
      </div>
    </div>
  );
}

/* ── Right Sidebar — expanded ──────────────────────────────── */
function RightSidebar({ onCollapse, ctxPct = 54, q5hPct = 42, q7dPct = 18, cost = '$4.387', tokIn = '48.2K', tokOut = '12.1K' }) {
  const labelW = 52;
  return (
    <div style={{ width: 272, borderLeft: '1px solid var(--border)', background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1 }}></div>
        <button className="gk-btn gk-btn-ghost gk-btn-sm gk-btn-icon" style={{ width: 24, height: 24 }} onClick={onCollapse}>
          <I.PanelLeft size={13} sw={1.8} style={{ transform: 'scaleX(-1)' }}/>
        </button>
      </div>

      {/* Provider */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
        <div className="gk-eyebrow" style={{ marginBottom: 6 }}>Provider</div>
        <ProviderChip provider="Claude Code"/>
      </div>

      {/* Global usage */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
        <div className="gk-eyebrow" style={{ marginBottom: 8 }}>Global Usage</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SidebarRow label="5h quota" pct={q5hPct} colorFn={quotaColor} right={`${Math.round((1 - q5hPct / 100) * 300)}m left`}/>
          <SidebarRow label="7d quota" pct={q7dPct} colorFn={quotaColor} right={`${Math.round((1 - q7dPct / 100) * 168)}h left`}/>
        </div>
      </div>

      {/* Session metrics — separated visually */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
        <div className="gk-eyebrow" style={{ marginBottom: 8 }}>Session</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SidebarRow label="Context" pct={ctxPct} colorFn={ctxColor} right={`${ctxPct}% · ${Math.round(ctxPct * 2)}K`}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <span style={{ fontSize: 10.5, color: 'var(--foreground-subtle)', width: labelW, flexShrink: 0 }}>Cost</span>
            <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--foreground)', fontWeight: 600, flex: 1, textAlign: 'right' }}>{cost}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <span style={{ fontSize: 10.5, color: 'var(--foreground-subtle)', width: labelW, flexShrink: 0 }}>Tokens</span>
            <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--foreground-subtle)', flex: 1, textAlign: 'right' }}>{tokIn} in · {tokOut} out</span>
          </div>
        </div>
      </div>

      {/* Sub-agents */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <I.Cpu size={12} sw={1.8} style={{ color: 'var(--foreground-subtle)' }}/>
          <span style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>Sub-Agents</span>
          <span className="gk-badge" style={{ height: 15, fontSize: 9, padding: '0 5px' }}>5</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '6px 4px' }}>
          <AgentTreeContent showActive/>
        </div>
      </div>
    </div>
  );
}

/* Sidebar metric row with aligned bar */
function SidebarRow({ label, pct, colorFn, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <span style={{ fontSize: 10.5, color: 'var(--foreground-subtle)', width: 52, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, padding: '0 8px' }}>
        <ProgressBar pct={pct} colorFn={colorFn} height={4}/>
      </div>
      <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)', whiteSpace: 'nowrap', textAlign: 'right', minWidth: 48 }}>{right}</span>
    </div>
  );
}

/* ── Collapsed sidebar (44px) ──────────────────────────────── */
function CollapsedSidebar({ onExpand, ctxPct = 54, state = 'running' }) {
  const pulseColor = state === 'running' ? 'var(--status-success)' : state === 'errored' ? 'var(--status-danger)' : 'var(--status-warning)';
  return (
    <div style={{ width: 44, borderLeft: '1px solid var(--border)', background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 10, flexShrink: 0 }}>
      <button className="gk-btn gk-btn-ghost gk-btn-sm gk-btn-icon" style={{ width: 28, height: 28 }} onClick={onExpand}>
        <I.PanelLeft size={14} sw={1.8} style={{ transform: 'scaleX(-1)' }}/>
      </button>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: pulseColor, animation: 'gk-pulse 1.8s ease-in-out infinite' }}></div>
      {/* Vertical context bar */}
      <div style={{ width: 5, height: 40, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: 0, width: '100%', height: ctxPct + '%', background: ctxColor(ctxPct), borderRadius: 3 }}></div>
      </div>
      <span className="font-mono" style={{ fontSize: 9, color: 'var(--foreground-subtle)', writingMode: 'vertical-lr', transform: 'rotate(180deg)', letterSpacing: '0.04em' }}>{ctxPct}%</span>
      <div style={{ flex: 1 }}></div>
      <span className="font-mono" style={{ fontSize: 9, color: 'var(--foreground-subtle)', writingMode: 'vertical-lr', transform: 'rotate(180deg)', marginBottom: 10 }}>5 agents</span>
    </div>
  );
}

/* ── Floating Input Panel ──────────────────────────────────── */
function FloatingInput({ showImages, longText, imageCount = 0, showToolsPopover, showModelDropdown }) {
  const skills = ['Execute', 'Review', 'Check & Fix', 'Commit', 'Ship'];
  return (
    <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 900, zIndex: 15, padding: '0 20px', pointerEvents: 'none' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', pointerEvents: 'auto' }}>
        {/* Image carousel */}
        {showImages && (
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, alignItems: 'center', overflowX: 'auto' }}>
            {Array.from({ length: imageCount || 3 }, (_, i) => (
              <div key={i} style={{ width: 64, height: 44, borderRadius: 6, background: 'var(--surface-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${['oklch(0.7 0.12 200)', 'oklch(0.6 0.15 260)', 'oklch(0.7 0.1 150)'][i % 3]}, var(--surface-3))`, position: 'absolute', inset: 0, opacity: 0.4 }}></div>
                <span className="font-mono" style={{ position: 'relative', fontSize: 10, fontWeight: 600, color: 'var(--foreground-muted)' }}>#{i + 1}</span>
                <button style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: 3, background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', fontSize: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>×</button>
              </div>
            ))}
            <button className="gk-btn gk-btn-ghost gk-btn-sm" style={{ height: 28, fontSize: 10, flexShrink: 0, padding: '0 8px' }}>+ Add</button>
          </div>
        )}
        {/* Collapsed image strip */}
        {!showImages && imageCount > 0 && (
          <div style={{ padding: '4px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <span style={{ fontSize: 11, color: 'var(--foreground-subtle)' }}>📎 {imageCount} images</span>
            <I.Chevron size={10} sw={2} style={{ color: 'var(--foreground-subtle)', transform: 'rotate(-90deg)' }}/>
          </div>
        )}

        {/* Skill chips */}
        <div style={{ padding: '8px 12px 4px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {skills.map(s => (
            <button key={s} className="gk-btn gk-btn-secondary gk-btn-sm" style={{ fontSize: 10.5, height: 22, padding: '0 8px', borderRadius: 999 }}>{s}</button>
          ))}
          <button className="gk-btn gk-btn-ghost gk-btn-sm" style={{ fontSize: 10.5, height: 22, padding: '0 6px' }}>More ▾</button>
        </div>

        {/* Textarea */}
        <div style={{ padding: '4px 12px' }}>
          <div style={{ minHeight: longText ? '30vh' : 48, maxHeight: '50vh', padding: '8px 0', fontSize: 13, color: longText ? 'var(--foreground)' : 'var(--foreground-subtle)', lineHeight: 1.55, fontFamily: 'var(--font-sans)', overflow: 'auto' }}>
            {longText || <span style={{ opacity: 0.5 }}>Message or /command…</span>}
          </div>
        </div>

        {/* Bottom controls */}
        <div style={{ padding: '6px 12px 8px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Left group */}
          <button className="gk-btn gk-btn-ghost gk-btn-sm" style={{ fontSize: 11, height: 24 }}>
            <I.Plus size={11} sw={2}/> Attach
          </button>
          <div style={{ position: 'relative' }}>
            <button className="gk-btn gk-btn-ghost gk-btn-sm" style={{ fontSize: 11, height: 24 }}>
              Tools ▾
            </button>
            {showToolsPopover && <ToolsPopover/>}
          </div>

          <div style={{ flex: 1 }}></div>

          {/* Right group */}
          <button className="gk-btn gk-btn-ghost gk-btn-sm" style={{ fontSize: 10.5, height: 24, fontFamily: 'var(--font-mono)' }}>Local ▾</button>
          <div style={{ position: 'relative' }}>
            <button className="gk-btn gk-btn-secondary gk-btn-sm" style={{ fontSize: 10.5, height: 24, fontFamily: 'var(--font-mono)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Claude Code · Opus 4.7 (1M) · High ▾
            </button>
            {showModelDropdown && <ModelDropdown/>}
          </div>
          <button className="gk-btn gk-btn-secondary gk-btn-sm" style={{ fontSize: 10.5, height: 24 }}>Approve each ▾</button>
          <button className="gk-btn gk-btn-primary gk-btn-sm" style={{ height: 28, width: 28, padding: 0, borderRadius: 7 }}>
            <I.Send size={13} sw={2}/>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Tools popover ─────────────────────────────────────────── */
function ToolsPopover() {
  return (
    <div className="gk-popover" style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 6, width: 280, zIndex: 30 }}>
      <div className="gk-popover-label">MCP Servers</div>
      <div className="gk-popover-item"><span style={{ width: 16, display: 'flex' }}><I.Database size={13} sw={1.6} style={{ color: 'var(--status-success)' }}/></span> filesystem <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--foreground-subtle)' }}>12 tools</span></div>
      <div className="gk-popover-item"><span style={{ width: 16, display: 'flex' }}><I.Database size={13} sw={1.6} style={{ color: 'var(--status-success)' }}/></span> github <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--foreground-subtle)' }}>8 tools</span></div>
      <div className="gk-popover-item"><span style={{ width: 16, display: 'flex' }}><I.Database size={13} sw={1.6} style={{ color: 'var(--foreground-subtle)' }}/></span> postgres <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--foreground-subtle)' }}>disabled</span></div>
      <div className="gk-popover-divider"></div>
      <div className="gk-popover-label">Skills</div>
      <div className="gk-popover-item"><I.Zap size={13} sw={1.6} style={{ color: 'var(--amber-400)' }}/> Execute <span className="gk-kbd" style={{ marginLeft: 'auto' }}>/execute</span></div>
      <div className="gk-popover-item"><I.Eye size={13} sw={1.6} style={{ color: 'var(--azure-400)' }}/> Review <span className="gk-kbd" style={{ marginLeft: 'auto' }}>/review</span></div>
      <div className="gk-popover-item"><I.Bug size={13} sw={1.6} style={{ color: 'var(--status-danger)' }}/> Check & Fix <span className="gk-kbd" style={{ marginLeft: 'auto' }}>/check</span></div>
      <div className="gk-popover-divider"></div>
      <div className="gk-popover-item" style={{ color: 'var(--foreground-subtle)', fontSize: 12 }}><I.Settings size={13} sw={1.6}/> Configure skills…</div>
    </div>
  );
}

/* ── Combined model dropdown ───────────────────────────────── */
function ModelDropdown() {
  return (
    <div className="gk-popover" style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 6, width: 300, zIndex: 30 }}>
      <div className="gk-popover-label">Claude Code</div>
      <div className="gk-popover-item" style={{ background: 'var(--primary-soft)' }}>
        <I.Check size={13} sw={2} style={{ color: 'var(--primary)' }}/>
        <span style={{ fontWeight: 500 }}>Opus 4.7</span>
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)', marginLeft: 'auto' }}>(1M)</span>
      </div>
      <div className="gk-popover-item"><span style={{ width: 13 }}></span> Sonnet 4 <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)', marginLeft: 'auto' }}>(200K)</span></div>
      <div className="gk-popover-item"><span style={{ width: 13 }}></span> Haiku 4.5 <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)', marginLeft: 'auto' }}>(200K)</span></div>
      <div className="gk-popover-divider"></div>
      <div className="gk-popover-label">OpenCode</div>
      <div className="gk-popover-item"><span style={{ width: 13 }}></span> GPT-4o <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)', marginLeft: 'auto' }}>(128K)</span></div>
      <div className="gk-popover-item"><span style={{ width: 13 }}></span> o3 <span className="font-mono" style={{ fontSize: 10, color: 'var(--foreground-subtle)', marginLeft: 'auto' }}>(200K)</span></div>
      <div className="gk-popover-divider"></div>
      <div className="gk-popover-label">Effort</div>
      <div className="gk-popover-item"><span style={{ width: 13 }}></span> Low</div>
      <div className="gk-popover-item" style={{ background: 'var(--primary-soft)' }}><I.Check size={13} sw={2} style={{ color: 'var(--primary)' }}/> <span style={{ fontWeight: 500 }}>High</span></div>
      <div className="gk-popover-item"><span style={{ width: 13 }}></span> Max</div>
    </div>
  );
}

/* ── Overflow menu ─────────────────────────────────────────── */
function OverflowMenu() {
  return (
    <div className="gk-popover" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 200, zIndex: 30 }}>
      <div className="gk-popover-item"><I.Pause size={13} sw={1.6}/> Pause session</div>
      <div className="gk-popover-item"><I.Square size={13} sw={1.6}/> Stop session</div>
      <div className="gk-popover-divider"></div>
      <div className="gk-popover-item"><I.Save size={13} sw={1.6}/> Export chat</div>
      <div className="gk-popover-item"><I.Refresh size={13} sw={1.6}/> Restart</div>
      <div className="gk-popover-divider"></div>
      <div className="gk-popover-item is-danger" style={{ color: 'var(--status-danger)' }}><I.Trash size={13} sw={1.6}/> Delete session</div>
    </div>
  );
}

/* ── Skill config panel ────────────────────────────────────── */
function SkillConfigPanel() {
  const events = [
    { name: 'On session start', skills: ['review-context'] },
    { name: 'After execution', skills: ['check-and-fix'] },
    { name: 'On error', skills: ['debug'] },
    { name: 'On merge conflict', skills: [] },
    { name: 'After commit', skills: ['run-tests'] },
    { name: 'After PR created', skills: [] },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'color-mix(in oklch, var(--background) 50%, transparent)', backdropFilter: 'blur(2px)' }}></div>
      <div className="gk-modal" style={{ position: 'relative', width: 520, maxWidth: '90%' }}>
        <div className="gk-modal-header">
          <span style={{ fontSize: 14, fontWeight: 600 }}>Skill Configuration</span>
          <button className="gk-btn gk-btn-ghost gk-btn-sm gk-btn-icon" style={{ width: 24, height: 24 }}><I.X size={14} sw={2}/></button>
        </div>
        <div className="gk-modal-body" style={{ padding: '12px 18px' }}>
          <div className="gk-eyebrow" style={{ marginBottom: 8 }}>Event → Skill Mapping</div>
          {events.map(ev => (
            <div key={ev.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--foreground-muted)', width: 140, flexShrink: 0 }}>{ev.name}</span>
              <div style={{ flex: 1, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {ev.skills.map(s => (
                  <span key={s} className="gk-badge gk-badge-moss" style={{ fontSize: 10 }}>{s} ×</span>
                ))}
                <button className="gk-btn gk-btn-ghost gk-btn-sm" style={{ height: 20, fontSize: 10, padding: '0 6px' }}>+ Add</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <div className="gk-eyebrow" style={{ marginBottom: 6 }}>Discovery Paths</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <span className="gk-badge" style={{ fontSize: 10 }}>.claude/skills/</span>
              <span className="gk-badge" style={{ fontSize: 10 }}>.grovekeeper/skills/</span>
              <button className="gk-btn gk-btn-ghost gk-btn-sm" style={{ height: 20, fontSize: 10, padding: '0 6px' }}>+ Add path</button>
            </div>
          </div>
        </div>
        <div className="gk-modal-footer">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 'auto', fontSize: 12, color: 'var(--foreground-muted)' }}>
            <input type="checkbox" className="gk-check" defaultChecked/> Use as defaults
          </label>
          <button className="gk-btn gk-btn-secondary gk-btn-sm">Cancel</button>
          <button className="gk-btn gk-btn-primary gk-btn-sm">Save</button>
        </div>
      </div>
    </div>
  );
}

/* ── Sample message stream ─────────────────────────────────── */
function SampleStream({ showPermCard, showSubAgent = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SystemMsg text="Session started · Claude Code · feat/session-ui" dimmed/>
      <UserMsg text="Implement the provider trait for OpenCode. Follow the same pattern as the Claude Code provider but handle the different authentication flow." dimmed/>
      <div style={{ opacity: 0.4, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <AssistantMsg>I'll examine the existing Claude Code provider to understand the pattern, then implement the OpenCode provider.</AssistantMsg>
        <ToolCardL1 tool="Read" detail="src/providers/claude_code.rs" outputLabel="142 lines" duration="0.3s" dimmed/>
        <ToolCardL1 tool="Read" detail="src/providers/mod.rs" outputLabel="58 lines" duration="0.2s" dimmed/>
        <ToolCardL1 tool="Grep" detail="impl Provider" outputLabel="4 files · 12 matches" duration="0.4s" dimmed/>
        <AssistantMsg>The provider trait requires <InlineCode>spawn()</InlineCode>, <InlineCode>send_message()</InlineCode>, and <InlineCode>handle_tool_result()</InlineCode>. Creating the module now.</AssistantMsg>
        <ToolCardL1 tool="Write" detail="src/providers/opencode.rs" outputLabel="created" duration="1.2s" dimmed/>
        <ToolCardL1 tool="Edit" detail="src/providers/mod.rs" outputLabel="+4 −0" duration="0.5s" dimmed/>
        <ToolGroup count={6}/>
      </div>
      <UserMsg text="Good. Now run the tests to make sure the new provider compiles and the existing tests still pass."/>
      <AssistantMsg streaming>I'll run the test suite to verify everything compiles correctly.</AssistantMsg>
      <ToolCardL2 tool="Bash" detail="$ cargo test --workspace" outputLabel="running…" duration="2.1s" status="running"
        content={`   Compiling grovekeeper v0.8.0\n   Compiling grovekeeper-providers v0.8.0\n     Running unittests src/lib.rs\nrunning 24 tests...\ntest providers::claude_code::tests::test_spawn ... ok\ntest providers::claude_code::tests::test_auth ... ok\ntest providers::opencode::tests::test_spawn ... ok\ntest providers::opencode::tests::test_auth_flow ...`}/>
      {showPermCard && <ToolCardL3Perm tool="Bash" detail={`$ rm -rf target/debug/build/grovekeeper-*\n$ cargo build --release`}/>}
      {showSubAgent && <SubAgentExpansion name="Explore codebase structure" model="Sonnet" tools={12} duration="23s"/>}
    </div>
  );
}

/* ── Full page layout ──────────────────────────────────────── */
function SessionPage({ sidebarCollapsed, state, ctxPct, q5hPct, q7dPct, showImages, longText, imageCount, showToolsPopover, showModelDropdown, showSkillConfig, showOverflow, showTooltip, showPermCard, showSubAgent, children }) {
  const [collapsed, setCollapsed] = React.useState(sidebarCollapsed || false);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-sans)', overflow: 'hidden', position: 'relative' }}>
      <TopBar state={state} showTooltip={showTooltip}/>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Chat column */}
        <div style={{ flex: 1, position: 'relative', overflow: 'auto', padding: '16px 24px 140px' }}>
          {children || <SampleStream showPermCard={showPermCard} showSubAgent={showSubAgent}/>}
          <FloatingInput showImages={showImages} longText={longText} imageCount={imageCount} showToolsPopover={showToolsPopover} showModelDropdown={showModelDropdown}/>
        </div>
        {/* Right sidebar */}
        {collapsed
          ? <CollapsedSidebar onExpand={() => setCollapsed(false)} ctxPct={ctxPct || 54} state={state}/>
          : <RightSidebar onCollapse={() => setCollapsed(true)} ctxPct={ctxPct || 54} q5hPct={q5hPct || 42} q7dPct={q7dPct || 18}/>
        }
      </div>
      {showSkillConfig && <SkillConfigPanel/>}
      {showOverflow && (
        <div style={{ position: 'absolute', top: 34, right: 180, zIndex: 30 }}>
          <OverflowMenu/>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  TopBar, RightSidebar, CollapsedSidebar, FloatingInput, SidebarRow,
  ToolsPopover, ModelDropdown, OverflowMenu, SkillConfigPanel,
  SampleStream, SessionPage,
});
