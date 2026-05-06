/* global React, I, SessionPage, SessionBadge, SampleStream, FloatingInput,
   ToolCardL1, ToolCardL2, ToolCardL3Perm, ToolCardL3Elicit, ToolCardL3Ask,
   ToolGroup, UserMsg, AssistantMsg, SystemMsg, InlineCode, SubAgentExpansion */

/* ═══════════════════════════════════════════════════════════════
   15 PAGE-LEVEL STATE ARTBOARDS
   Each renders a full SessionPage with the right props/children.
   ═══════════════════════════════════════════════════════════════ */

/* ── 1. Active session, mid-conversation (canonical) ───────── */
function State01_Active() {
  return <SessionPage state="running" showPermCard showSubAgent/>;
}

/* ── 2. Needs-input — permission card focused ──────────────── */
function State02_NeedsInput() {
  return (
    <SessionPage state="needs-input">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SystemMsg text="Session started · Claude Code · feat/session-ui" dimmed/>
        <UserMsg text="Refactor the authentication module to support OAuth2 PKCE flow." dimmed/>
        <div style={{ opacity: 0.4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <AssistantMsg>I'll update the auth module. Let me first check the current implementation.</AssistantMsg>
          <ToolCardL1 tool="Read" detail="src/auth/mod.rs" outputLabel="89 lines" duration="0.2s" dimmed/>
          <ToolCardL1 tool="Read" detail="src/auth/oauth.rs" outputLabel="134 lines" duration="0.3s" dimmed/>
        </div>
        <UserMsg text="Go ahead and make the changes."/>
        <AssistantMsg>I need to modify several files to add the PKCE flow. I'll start with the core auth module.</AssistantMsg>
        <ToolCardL1 tool="Edit" detail="src/auth/mod.rs" outputLabel="+28 −4" duration="0.8s"/>
        <AssistantMsg>Now I need to run a destructive build step to regenerate the auth bindings:</AssistantMsg>
        <ToolCardL3Perm tool="Bash" detail={`$ rm -rf target/debug/build/grovekeeper-auth-*\n$ cargo build --release --features oauth2-pkce`}/>
      </div>
    </SessionPage>
  );
}

/* ── 3. Empty / just spawned ───────────────────────────────── */
function State03_Empty() {
  return (
    <SessionPage state="running" ctxPct={2} q5hPct={38} q7dPct={12}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SystemMsg text="Session started · Claude Code · feat/new-feature"/>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 12, opacity: 0.5 }}>
          <I.Terminal size={32} sw={1.2} style={{ color: 'var(--foreground-subtle)' }}/>
          <span style={{ fontSize: 14, color: 'var(--foreground-subtle)', fontWeight: 500 }}>Session ready</span>
          <span style={{ fontSize: 12, color: 'var(--foreground-subtle)', maxWidth: 320, textAlign: 'center', lineHeight: 1.5 }}>Type a message or use a slash command to begin. The agent will start working in your worktree.</span>
        </div>
      </div>
    </SessionPage>
  );
}

/* ── 4. Errored ────────────────────────────────────────────── */
function State04_Errored() {
  return (
    <SessionPage state="errored" ctxPct={72}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SystemMsg text="Session started · Claude Code · fix/memory-leak" dimmed/>
        <UserMsg text="Find and fix the memory leak in the session manager." dimmed/>
        <div style={{ opacity: 0.4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <AssistantMsg>I'll investigate the session manager for memory leaks.</AssistantMsg>
          <ToolCardL1 tool="Read" detail="src/session/manager.rs" outputLabel="245 lines" duration="0.4s" dimmed/>
          <ToolCardL1 tool="Grep" detail="Arc::new|Rc::new" outputLabel="8 files · 23 matches" duration="0.6s" dimmed/>
        </div>
        <UserMsg text="Check the event loop too."/>
        <AssistantMsg>Running valgrind to profile memory usage:</AssistantMsg>
        <ToolCardL2 tool="Bash" detail="$ valgrind --tool=memcheck ./target/debug/grovekeeper" outputLabel="error" duration="12.4s" status="error"
          content={`==24601== Memcheck, a memory error detector\n==24601== Invalid read of size 8\n==24601==    at 0x4C2AB80: memcpy (vg_replace_strmem.c:1036)\n==24601==    by 0x1234: session::manager::EventLoop::poll\n==24601== Process terminating with default action of signal 11 (SIGSEGV)\n==24601== ERROR SUMMARY: 1 errors from 1 contexts`}/>
        {/* Error card */}
        <div style={{ borderRadius: 8, border: '1px solid color-mix(in oklch, var(--status-danger) 50%, var(--border))', borderLeftWidth: 3, borderLeftColor: 'var(--status-danger)', overflow: 'hidden', background: 'color-mix(in oklch, var(--status-danger) 4%, var(--surface))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
            <I.AlertTriangle size={14} sw={2} style={{ color: 'var(--status-danger)' }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--status-danger)', marginBottom: 3 }}>Session errored</div>
              <div style={{ fontSize: 12, color: 'var(--foreground-muted)', lineHeight: 1.5 }}>Process terminated with SIGSEGV. The session has been paused. You can retry the last action or provide new instructions.</div>
            </div>
          </div>
          <div style={{ padding: '8px 12px', borderTop: '1px solid color-mix(in oklch, var(--status-danger) 20%, var(--border))', display: 'flex', gap: 6 }}>
            <button className="gk-btn gk-btn-sm" style={{ background: 'var(--status-danger)', color: '#fff', borderColor: 'transparent' }}><I.Refresh size={11} sw={2}/> Retry</button>
            <button className="gk-btn gk-btn-secondary gk-btn-sm">Provide new instructions</button>
          </div>
        </div>
        <SystemMsg text="Session errored at 2:34 PM"/>
      </div>
    </SessionPage>
  );
}

/* ── 5. Long conversation — dimmed content + jump buttons ──── */
function State05_LongConvo() {
  return (
    <SessionPage state="running" ctxPct={78} q5hPct={65}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
        <SystemMsg text="Session started · Claude Code · feat/session-ui" dimmed/>
        {/* Many dimmed old messages */}
        {[1,2,3].map(i => (
          <React.Fragment key={i}>
            <UserMsg text={`Earlier instruction #${i} — this content is from earlier in the conversation and has been dimmed to reduce visual noise.`} dimmed/>
            <div style={{ opacity: 0.4, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <AssistantMsg>Acknowledged. Working on task #{i}.</AssistantMsg>
              <ToolCardL1 tool="Read" detail={`src/module_${i}.rs`} outputLabel={`${40 + i * 20} lines`} duration="0.3s" dimmed/>
              <ToolCardL1 tool="Edit" detail={`src/module_${i}.rs`} outputLabel={`+${i * 5} −${i * 2}`} duration="0.5s" dimmed/>
              <ToolGroup count={4 + i}/>
            </div>
          </React.Fragment>
        ))}
        <SystemMsg text="— 34 earlier messages hidden —" dimmed/>
        <UserMsg text="Now update the test suite for the new provider."/>
        <AssistantMsg streaming>I'll update the test suite to cover the new OpenCode provider.</AssistantMsg>
        <ToolCardL2 tool="Bash" detail="$ cargo test --workspace" outputLabel="running…" duration="3.2s" status="running"
          content={`running 48 tests...\ntest session::tests::test_new ... ok\ntest session::tests::test_resume ... ok\ntest providers::opencode::tests::test_spawn ... ok`}/>
        {/* Jump buttons */}
        <div style={{ position: 'sticky', bottom: 140, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 10, pointerEvents: 'none' }}>
          <button className="gk-btn gk-btn-secondary gk-btn-sm" style={{ pointerEvents: 'auto', boxShadow: 'var(--shadow-md)', fontSize: 11 }}><I.ChevronUp size={11} sw={2}/> Jump to latest prompt</button>
          <button className="gk-btn gk-btn-secondary gk-btn-sm" style={{ pointerEvents: 'auto', boxShadow: 'var(--shadow-md)', fontSize: 11 }}><I.Chevron size={11} sw={2}/> Jump to latest response</button>
        </div>
      </div>
    </SessionPage>
  );
}

/* ── 6. Image attached (mid-composition) ───────────────────── */
function State06_ImageAttached() {
  return (
    <SessionPage state="running" showImages imageCount={4}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SystemMsg text="Session started · Claude Code · feat/ui-polish"/>
        <UserMsg text="Here's the current state of the dashboard. Fix the alignment issues I marked." images={[1, 2]}/>
        <AssistantMsg>I can see the alignment issues in images #1 and #2. Let me examine the relevant CSS.</AssistantMsg>
        <ToolCardL1 tool="Read" detail="src/ui/dashboard.css" outputLabel="88 lines" duration="0.2s"/>
        <ToolCardL1 tool="Edit" detail="src/ui/dashboard.css" outputLabel="+12 −8" duration="0.6s"/>
        <AssistantMsg>Fixed the grid alignment. Here's what changed in the layout.</AssistantMsg>
        <UserMsg text="Good. Now look at image #3 — there's a color contrast issue in the sidebar." images={[3]}/>
        <AssistantMsg streaming>I see the contrast issue in image #3. The sidebar text is using <InlineCode>--foreground-subtle</InlineCode> which doesn't meet WCAG AA on that background.</AssistantMsg>
      </div>
    </SessionPage>
  );
}

/* ── 7. Image carousel collapsed ───────────────────────────── */
function State07_ImageCollapsed() {
  return (
    <SessionPage state="running" imageCount={5}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SystemMsg text="Session started · Claude Code · feat/ui-polish" dimmed/>
        <UserMsg text="Fix the layout issues shown in images #1-#3." dimmed images={[1, 2, 3]}/>
        <div style={{ opacity: 0.4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <AssistantMsg>Fixed the layout issues across all three screenshots.</AssistantMsg>
          <ToolGroup count={8}/>
        </div>
        <UserMsg text="Now check image #5 — the mobile breakpoint is broken."/>
        <AssistantMsg streaming>Looking at image #5. The mobile breakpoint issue appears to be in the media query.</AssistantMsg>
        <ToolCardL1 tool="Read" detail="src/ui/responsive.css" outputLabel="62 lines" duration="0.2s"/>
      </div>
    </SessionPage>
  );
}

/* ── 8. Sidebar collapsed ──────────────────────────────────── */
function State08_SidebarCollapsed() {
  return <SessionPage state="running" sidebarCollapsed/>;
}

/* ── 9. Quota warning (red zone) ───────────────────────────── */
function State09_QuotaWarning() {
  return (
    <SessionPage state="running" ctxPct={82} q5hPct={92} q7dPct={45}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SystemMsg text="Session started · Claude Code · feat/session-ui" dimmed/>
        <UserMsg text="Continue implementing the remaining provider methods." dimmed/>
        <AssistantMsg dimmed>Working on the remaining methods.</AssistantMsg>
        <ToolGroup count={18}/>
        <UserMsg text="The context is getting long. Summarize what you've done and continue."/>
        <AssistantMsg streaming>Let me summarize the progress so far and continue with a fresh context.</AssistantMsg>
        {/* Context warning inline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, background: 'color-mix(in oklch, var(--status-danger) 8%, var(--surface-2))', border: '1px solid color-mix(in oklch, var(--status-danger) 30%, var(--border))' }}>
          <I.AlertTriangle size={13} sw={2} style={{ color: 'var(--status-danger)' }}/>
          <span style={{ fontSize: 12, color: 'var(--status-danger)', fontWeight: 500 }}>Context at 82% — consider starting a new session or summarizing</span>
          <div style={{ flex: 1 }}></div>
          <button className="gk-btn gk-btn-sm" style={{ fontSize: 10.5, height: 22 }}>Compact</button>
        </div>
      </div>
    </SessionPage>
  );
}

/* ── 10. Long-text input ───────────────────────────────────── */
function State10_LongInput() {
  const longText = `I need you to refactor the entire authentication module. Here's what needs to change:

1. Replace the current basic auth flow with OAuth2 PKCE
2. Add support for refresh tokens with automatic rotation
3. Implement a token cache that persists across sessions
4. Add rate limiting on the auth endpoints (max 5 attempts per minute)
5. Create a migration path for existing users — they should be prompted to re-authenticate on next login but not lose any session data
6. Update all provider implementations to use the new auth interface
7. Add comprehensive tests for each flow:
   - Happy path: fresh login → token → refresh → re-auth
   - Error paths: expired token, revoked token, network failure during refresh
   - Edge cases: concurrent refresh requests, clock skew handling

Please start with the core auth module, then update each provider one at a time. Run the full test suite after each provider update to catch regressions early.

Also, make sure the error messages are user-friendly — no raw HTTP status codes in the UI.`;
  return (
    <SessionPage state="running" longText={longText}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SystemMsg text="Session started · Claude Code · refactor/auth"/>
        <UserMsg text="Let me describe the full refactor plan." dimmed/>
        <AssistantMsg dimmed>Ready to hear the plan.</AssistantMsg>
      </div>
    </SessionPage>
  );
}

/* ── 11. Tools popover open ────────────────────────────────── */
function State11_ToolsPopover() {
  return <SessionPage state="running" showToolsPopover/>;
}

/* ── 12. Model dropdown open ───────────────────────────────── */
function State12_ModelDropdown() {
  return <SessionPage state="running" showModelDropdown/>;
}

/* ── 13. Skill config panel open ───────────────────────────── */
function State13_SkillConfig() {
  return <SessionPage state="running" showSkillConfig/>;
}

/* ── 14. Open in CLI tooltip ───────────────────────────────── */
function State14_CLITooltip() {
  return <SessionPage state="running" showTooltip/>;
}

/* ── 15. Overflow menu open ────────────────────────────────── */
function State15_Overflow() {
  return <SessionPage state="running" showOverflow/>;
}

Object.assign(window, {
  State01_Active, State02_NeedsInput, State03_Empty, State04_Errored,
  State05_LongConvo, State06_ImageAttached, State07_ImageCollapsed,
  State08_SidebarCollapsed, State09_QuotaWarning, State10_LongInput,
  State11_ToolsPopover, State12_ModelDropdown, State13_SkillConfig,
  State14_CLITooltip, State15_Overflow,
});
