# Process Badges & Issue Card Integration — Design Brief

> **Status**: Refined (Variant A)
> **Refined mockup**: `designs/process-badges/refined.html`
> **Summary**: `designs/process-badges/SUMMARY.md`
> **Refinements**: port colon prefix (`:3000`), bidirectional collapse/expand animations

Issue cards show live process state via badges in Row 4 (CommandResultsRow). The backend is complete — 5 Tauri commands, event emission, log buffer — but badges currently receive no data. This brief covers wiring live data to existing badge components, adding two new states (timeout, stopped), and the stale dimming behavior.

**Source**: PRD #339, sub-issue #340
**Gold standard reference**: `designs/issue-card-v2/ISSUE_CARD_FINAL_DECISIONS.md` §3.2 Row 4, §6.1 states 13–14

---

## 1. Purpose

Developers running workspace commands (dev servers, test suites, linters) need at-a-glance feedback on each issue card. A green dot + port means the server is up; a spinner means checks are running; a green check means tests passed. This eliminates context-switching to a terminal to check process status.

**Key value**: See process health for every active issue without leaving the dashboard.

---

## 2. Surrounding Context

The badges live inside an issue card on the workspace dashboard. The card occupies a responsive grid cell (min 450px wide).

### Full Viewport Structure

**Left Sidebar** (~240px, FINAL STATE):
- Brand mark, workspace selector
- Nav: Dashboard, Sessions, Usage, Settings
- Theme toggle, user avatar
- Source: `DashboardSidebar.svelte`

**Main Area** (remaining width):
- **TopBar** (FINAL): dashboard name + action buttons
- **Forest Panel** (~25% height, collapsible): tree visualizations
- **StyledPaneResizer** (4px)
- **Bottom Panel** (~75% height): issue card grid — `repeat(auto-fill, minmax(450px, 1fr))`

**What parent provides**: IssueCard renders IssueCardBody → IssueCardInfoRows → Row 4 (CommandResultsRow)
**What this component fills**: Row 4 within the card body's right column (info rows)

**Mockup rendering instructions**:
- Show one issue card at ~500px width, zoomed in on the body section
- Include all 4 info rows to show Row 4 in context
- Show multiple badge state combinations side-by-side as a state matrix
- Use actual card variant (Refined Horizon default) with a representative issue color

---

## 3. Requirements

### 3.1 CommandResultBadge — 5 States

The existing badge handles 3 states (`running`, `passed`, `failed`). Add `timeout` and `stopped`.

| State | Icon | Color Token | Shape | Animation |
|-------|------|-------------|-------|-----------|
| **Running** | Spinner (CSS border-spin) | `--status-info` | Pill: spinner + command name | Spin animation |
| **Passed** | `CircleCheck` (lucide) | `--status-success` | Collapsed circle (20×20) | Collapse from pill → circle |
| **Failed** | `CircleX` (lucide) | `--status-danger` | Collapsed circle (20×20) | Collapse from pill → circle |
| **Timeout** | `Clock` (lucide) | `--status-warning` | Collapsed circle (20×20) | Collapse from pill → circle |
| **Stopped** | `Square` (lucide) | `--foreground-subtle` | Collapsed circle (20×20) | Collapse from pill → circle |

- Running state: full pill width showing `⟳ commandName` (e.g., `⟳ check:all`)
- Completed states (passed/failed/timeout/stopped): animates down to icon-only circle
- Timeout uses **orange/amber** to distinguish from red failure — it's a different signal (command may have been working fine but exceeded time limit)
- Stopped uses **gray** — user-initiated, not an error condition

### 3.2 ServerPortBadge

Already functional. Shows green dot + port number.

- **Port prefix**: Display port with `:` prefix (`:3000` not `3000`) — the colon immediately signals "port number" and avoids ambiguity with other numeric values
- Click opens `http://localhost:{port}` (already implemented)
- `aria-label` remains `"Open port {port}"` without colon for screen reader clarity
- Right-click context menu is covered by issue #341's design brief

### 3.2.1 Bidirectional Collapse/Expand Animation

CommandResultBadge must animate smoothly in **both** directions:

- **Collapse** (running → completed): pill shrinks to 20×20 circle, text/spinner fades out, status icon fades in
- **Expand** (completed → running): circle expands to pill, icon fades out, spinner/text fade in (triggered when a command is re-run)

Timing: width/padding `300ms ease-in-out`, color/background `200ms`, text/spinner opacity `200ms`, icon opacity `150ms` with `100ms` delay. CSS `transition` on the element handles both directions — no JavaScript animation needed.

Storybook stories must demonstrate both directions with interactive controls and/or play tests.

### 3.3 Stale Badge Behavior

When `hasLocalChanges` becomes true (file changes detected after last check run), command result badges dim to indicate results may be outdated.

- **Stale treatment**: `opacity-40` on the badge (already implemented in CommandResultBadge via `isStale` prop)
- **Trigger**: `hasLocalChanges` flag from git status context
- **Applies to**: CommandResultBadge only. ServerPortBadge does NOT go stale (server is still running regardless of file changes)
- **Recovery**: Badge returns to full opacity when the command is re-run

### 3.4 Restart Count Indicator

When a server command has a restart policy and is actively restarting:

- Badge shows running state with restart indicator: small text `2/3` appended after command name
- Format: `⟳ dev-server 2/3` (attempt 2 of 3 max retries)
- After 3 failed retries: badge transitions to permanent `failed` state
- No restart indicator for `restart_policy = 'never'`

### 3.5 CommandResultsRow Layout

Existing component. Shows up to `MAX_VISIBLE_COMMAND_RESULTS` badges + overflow count + ServerPortBadge.

- Layout: `flex flex-wrap items-center gap-1`
- Max visible: 3 badges + overflow `+N` chip
- ServerPortBadge renders last (rightmost)
- Maintain `min-h-5` for consistent card height even when no commands configured
- Multiple server ports possible (one per server command) — each gets its own ServerPortBadge

### 3.6 Issue State Chip Integration

Two new chip states from ISSUE_CARD_FINAL_DECISIONS §6.1:

| # | Chip Label | Dot Color | Trigger |
|---|-----------|-----------|---------|
| 13 | `● RUNNING CHECKS` | Blue/Cyan | `activeCheckCommands.length > 0` |
| 14 | `● RUNNING TESTS` | Blue/Cyan | `activeTestCommands.length > 0` |

These fit into the existing 22-state cascade in `derive_issue_state_chip.ts`.

---

## 4. States

### CommandResultBadge States

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Running | Info-blue pill, spinning border icon + command name text | Process spawned, stdout streaming |
| Running + Restarting | Same as running + `N/3` count after name | Restart policy active, retrying |
| Passed | Green circle-check icon, collapsed to circle | Exit code 0 |
| Failed | Red circle-X icon, collapsed to circle | Non-zero exit code |
| Timeout | Orange/amber clock icon, collapsed to circle | Configured timeout exceeded |
| Stopped | Gray square icon, collapsed to circle | User killed the process |
| Stale (any completed) | Same icon but opacity-40 | `hasLocalChanges` became true |

### ServerPortBadge States

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Active | Green dot + port number, full opacity | Server running, port detected |
| No port yet | Not rendered | Server running but port not yet detected |

### CommandResultsRow States

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| No commands | Empty row, `min-h-5` preserved | No workspace commands configured |
| Commands running | Pill badges animating | Active processes |
| Mixed results | Mix of circles (completed) and pills (running) | Some done, some active |
| All completed | All collapsed circles | All processes finished |
| Overflow | Visible badges + `+N` chip | More than MAX_VISIBLE |

---

## 5. Component Reuse Map

### Existing Components (MUST use)

| Component | Variant/Props | Usage in This Design |
|-----------|--------------|---------------------|
| CommandResultBadge | `state`, `commandName`, `isStale`, `badgeStyle` | Row 4 check/test result indicators |
| ServerPortBadge | `port`, `badgeStyle`, `onclick` | Row 4 server port indicator |
| CommandResultsRow | `commandResults`, `serverPort` | Row 4 container (already wired in IssueCard) |
| Badge | `badgeStyle: borderless-dark` (default) | Badge style system (A/B/C) via appearance settings |
| `resolveBadgeStyleClass()` | From `badge_style_utils.ts` | Consistent badge styling across all badge components |

### Components to Adopt

None — all primitives exist.

### Components to Modify

| Component | Change | Rationale |
|-----------|--------|-----------|
| CommandResultBadge | Add `timeout` and `stopped` states | PRD requires 5 states, currently has 3 |
| CommandResultBadge | Add restart count display (`N/3`) | Restart policy visibility |
| `command_result_badge_types.ts` | Extend `CommandResultState` type | New states need type support |

---

## 6. Layout Constraints

- Row 4 width: determined by card body right column (card width minus ~100px preview)
- Badge height: 20px (`h-5`) — matches existing badge system
- Badge gap: 4px (`gap-1`)
- Collapsed badge: 20×20px circle
- Running pill: auto-width based on command name text
- Overflow chip: same height (20px), `px-1.5`, `text-[10px]`
- Row min-height: 20px even when empty

---

## 7. Design Tokens

| Token | Usage |
|-------|-------|
| `--status-success` | Passed badge, server port dot |
| `--status-danger` | Failed badge |
| `--status-warning` | Timeout badge (orange/amber) |
| `--status-info` | Running badge |
| `--foreground-subtle` | Stopped badge (gray) |
| `--font-mono` + `10px` | Badge text |
| `--border` | Overflow chip border |

Badge style tokens (from `resolveBadgeStyleClass`):
- Style A (solid): `--badge-color` as background, contrast text
- Style B (borderless-dark): `color-mix(--badge-color 14%, transparent)` bg, colored text
- Style C (bordered-dark): Same as B + border at `color-mix(--badge-color 30%, transparent)`

---

## 8. Design Constraints (Non-Negotiable)

- Badge style follows `issue_card_badge_style` user setting (A/B/C) — same setting that controls priority badges and state chips
- Timeout must be **visually distinct** from failed — different icon AND different color
- Stopped must be **visually distinct** from failed — gray, not red
- Stale opacity is exactly `opacity-40` (matches existing implementation)
- Max 3 visible badges + overflow — same as GitHub labels pattern
- ServerPortBadge does NOT dim when stale
- Badge collapse animation must use `transition-all duration-300 ease-in-out` (matches existing)
- `min-h-5` on the row even when empty (consistent card height)
- Icons from Lucide only, path imports: `@lucide/svelte/icons/*`

---

## 9. Design Freedom

- Exact icon choice for timeout (Clock, Timer, Hourglass — designer picks best at 12px)
- Exact icon choice for stopped (Square, StopCircle, CircleStop)
- Whether restart count `N/3` is plain text or uses a subtle sub-badge treatment
- Animation easing for the pill-to-circle collapse
- Whether the overflow `+N` chip uses the same badge style (A/B/C) or stays neutral

---

## 10. Visual References

- **Internal**: `src/lib/components/derived/command-badges/CommandResultBadge.svelte` — current 3-state implementation
- **Internal**: `src/lib/components/derived/command-badges/ServerPortBadge.svelte` — green dot + port
- **Internal**: `src/lib/components/blocks/issue-card/CommandResultsRow.svelte` — container layout
- **Issue card v2 variants**: `designs/issue-card-v2/variants/variant-{f,g,h}.html` — see Row 4 area for badge placement context
- **Badge variants**: `src/lib/components/shadcn/badge/badge-variants.ts` — style A/B/C definitions

---

## 11. Not Included (Scope Exclusions)

- Context menu interactions on badges — covered by #341's design brief
- ProcessLogViewer dialog — covered by #342's design brief
- Process context module (code architecture) — not a visual concern
- Port detection regex fix — backend-only, no visual impact
- Terminal mode execution — no badge tracking for terminal mode
- Settings UI for command modes/policies — covered by #343 and #344
