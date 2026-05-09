# Workspace Card — Claude Design Update Instructions

Instructions for updating `claude_design/Workspace Card.html` to match the grilled spec from 2026-05-07. Also includes new component designs to add to the artboard.

---

## 1. Changes to Existing Card Layout

### 1.1 Stat Box Reorder

**Current order**: PRs, ATTN, ISSUES, HITL
**New order**: ISSUES, PRs, ATTN, HITL

In the `WorkspaceCard` component's health section, reorder the `<Stat>` elements:
```
<Stat label="Issues" value={issues} icon={I.ListChecks} />
<Stat label="PRs" value={prs} icon={I.GitPull} />
<Stat label="Attn" value={prsAttention} tone={...} icon={I.AlertTriangle} pulse={...} />
<Stat label="HITL" value={hitl} tone={...} icon={I.User} pulse={...} />
```

### 1.2 Issues Stat — Dual Number

Replace the single `issues` number with a dual format `{afk}/{total}`:

```jsx
<div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
  <span className="ws-stat-num">{afkReady}</span>
  <span className="ws-stat-num" style={{
    fontWeight: 400,
    fontSize: 12,
    color: 'var(--foreground-muted)'
  }}>/{totalTracked}</span>
</div>
```

Add tooltip: `title="N actionable AFK issues out of M tracked"`

### 1.3 Issues Icon Change

Replace `I.Bug` with a new `I.ListChecks` icon in `icons.jsx`:

```jsx
ListChecks: ({size=16, sw=2, ...p}) => (
  <svg {...p} width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 17 2 2 4-4"/>
    <path d="m3 7 2 2 4-4"/>
    <path d="M13 6h8"/>
    <path d="M13 12h8"/>
    <path d="M13 18h8"/>
  </svg>
),
```

### 1.4 Subtitle Line Change

**Current**: `{branch_icon} {branch} · {issues + prs} tracked`
**New**: `{branch_icon} {branch} · {N} worktrees`

In `WorkspaceCard`, change the subtitle:
```jsx
<span>{isEmpty ? "no issues yet" : `${worktreeCount} worktrees`}</span>
```

### 1.5 GitHub Icon — Keep Stroke-Based

**No change needed.** The existing stroke-based `I.Github` in `icons.jsx` is correct and matches the desired style. The `GithubIcon.svelte` component in production should replicate this same stroke-based path. Do NOT replace with a fill-based icon.

### 1.6 Folder Icon — Closed

Replace `I.Folder` (if it currently renders an open folder) with a closed folder path. Lucide's `folder` icon:

```jsx
Folder: ({size=16, sw=2, ...p}) => (
  <svg {...p} width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
  </svg>
),
```

### 1.7 Azure Accent Fix

In the `ACCENTS` object, change azure to match the token system:

**Current**: `azure: 'oklch(0.620 0.130 230)'`
**New**: `azure: 'oklch(0.570 0.130 235)'`

### 1.8 Add Workspace — Remove Subtitle

Remove `<span className="ws-add-hint">connect a GitHub repo</span>` from `AddWorkspaceCard`.

### 1.9 Icon strokeWidth

Change all Lucide icon `sw` defaults from `1.8` or `2` to `1.7` on the icon buttons (`.ws-icon-btn` usage). The stat box icons keep their current small size (10px, sw 1.8).

---

## 2. New Element: PRD Row

Add a new row between the health grid and the AFK row. Same container styling as AFK row.

### CSS

```css
.ws-prd {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-bottom: 6px;
  cursor: pointer;
}
.ws-prd:hover {
  border-color: var(--border-strong);
}
.ws-prd-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--foreground-muted);
  white-space: nowrap;
}
.ws-prd-progress {
  flex: 1;
  height: 4px;
  background: color-mix(in oklch, var(--foreground) 10%, transparent);
  border-radius: 2px;
  overflow: hidden;
}
.ws-prd-progress-fill {
  height: 100%;
  background: var(--ws-accent);
  border-radius: 2px;
  transition: width 300ms ease-out;
}
.ws-prd-count {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--foreground-subtle);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
```

### JSX

```jsx
function PRDRow({ prdCount, completedSubs, totalSubs }) {
  const pct = totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0;
  return (
    <div className="ws-prd">
      <I.ClipboardList size={12} sw={1.7} style={{ color: 'var(--foreground-subtle)', flexShrink: 0 }} />
      <span className="ws-prd-label">{prdCount} PRDs</span>
      <div className="ws-prd-progress">
        <div className="ws-prd-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="ws-prd-count">{completedSubs}/{totalSubs} done</span>
    </div>
  );
}
```

Insert in `WorkspaceCard` between the health grid and `AFKRow`:
```jsx
{!isEmpty && prdCount > 0 && (
  <PRDRow prdCount={prdCount} completedSubs={completedSubs} totalSubs={totalSubs} />
)}
```

Add props to `WorkspaceCard`: `prdCount`, `completedSubs`, `totalSubs`.

### Demo data for each card

| Card | prdCount | completedSubs | totalSubs |
|------|----------|---------------|-----------|
| grovekeeper | 3 | 12 | 31 |
| codeburn | 2 | 8 | 15 |
| orchard-api | 1 | 3 | 10 |
| moss-cli | 1 | 0 | 6 |
| fern-ui | 0 | — | — |
| acorn-deploy | 0 | — | — |
| sapling | 0 | — | — |

---

## 3. Update WorkspaceCard Props and Demo Data

### New/changed props

```jsx
function WorkspaceCard({
  // ... existing props ...
  worktreeCount = 0,       // NEW: replaces computed "tracked" count
  afkReady = 0,            // NEW: AFK actionable issue count
  prdCount = 0,            // NEW
  completedSubs = 0,       // NEW
  totalSubs = 0,           // NEW
})
```

### Updated demo data in the grid

```jsx
<WorkspaceCard
  name="grovekeeper" accent={ACCENTS.moss} variant="active" branch="main"
  worktreeCount={5}
  afkReady={3} issues={10}
  prs={2} prsAttention={0} hitl={0}
  prdCount={3} completedSubs={12} totalSubs={31}
  afk={true} sessions={3}
  lastActivity="just now" cost="$4.82" costLabel="today"
  hasThumb={true}
/>
```

(Repeat pattern for all cards — adjust numbers for variety.)

---

## 4. New Component Showcase Section

Add a new `<section>` after the States section to showcase the individual components with all their states.

### 4.1 StatCell Component States

```
SECTION TITLE: "StatCell component"
SUBTITLE: "four tones · zero state · pulse dot · clickable"
```

Grid of 8 stat cells showing all variants:

| Label | Value | Tone | Pulse | Description |
|-------|-------|------|-------|-------------|
| ISSUES | 3/10 | neutral | No | Dual number, normal |
| ISSUES | 0/0 | zero | No | Empty workspace |
| PRs | 4 | neutral | No | Standard count |
| PRs | 0 | zero | No | Zero state |
| ATTN | 3 | danger | Yes | Attention needed, pulsing |
| ATTN | 0 | zero | No | No attention needed |
| HITL | 2 | warning | Yes | HITL pending, pulsing |
| HITL | 0 | zero | No | No HITL pending |

Show each cell at actual size (roughly 75px wide). Include a "clickable" variant with cursor pointer and hover bg change.

### 4.2 StatusRow Component States

```
SECTION TITLE: "StatusRow component"
SUBTITLE: "AFK on/off · with meta · PRD row"
```

Show 5 rows stacked vertically at card width (320px):

1. **AFK on, sessions**: LED green glowing, "AFK loop running", "5 sessions (3 AFK)"
2. **AFK on, idle**: LED green glowing, "AFK loop running", "idle"
3. **AFK off, recent**: LED gray, "AFK loop off", "last 14m ago"
4. **AFK off, manual sessions**: LED gray, "AFK loop off", "2 sessions"
5. **PRD row**: clipboard icon, "3 PRDs", progress bar at 39%, "12/31 done"

### 4.3 Icon Button States

```
SECTION TITLE: "Icon buttons"
SUBTITLE: "ghost variant · assigned vs unassigned · hover"
```

Show a row of button pairs at actual size:

| State | GitHub | Folder |
|-------|--------|--------|
| Assigned, resting | `text-foreground-subtle` | `text-foreground-subtle` |
| Assigned, hover | `text-foreground` + `bg-surface-2` | `text-foreground` + `bg-surface-2` |
| Unassigned, resting | opacity 0.35 | opacity 0.35 |
| Unassigned, hover | opacity 0.35 + `bg-surface-2` | opacity 0.35 + `bg-surface-2` |

Show both the GitHub (fill-based) and Folder (stroke-based) icons side by side in each state.

### 4.4 Workspace Accent Picker

```
SECTION TITLE: "Workspace accent picker"
SUBTITLE: "12 presets · 2×6 grid · inline (no dropdown)"
```

Show the `ColorPickerContent` grid at actual size with 12 color swatches:

```
Row 1: [moss] [amber] [gold]  [coral]  [rose]   [fuchsia]
Row 2: [sage] [teal]  [azure] [indigo] [plum]   [bark]
```

Each swatch: 32px circle, border on hover, ring on selected. Show one swatch (moss) as selected with the ring treatment. Below the grid, show the hex input field.

---

## 5. Card Variant Priority Rules

When multiple conditions are true, use this priority (highest wins):

1. `urgent` — attn_count > 0 (red accent override)
2. `needs-attention` — hitl_count > 0 (amber accent override)
3. `active` — AFK loop running (breathing glow animation)
4. `dormant` — no activity >24h (desaturated, reduced opacity)
5. `empty` — zero tracked issues (placeholder content)
6. `default` — none of the above

`hover` is orthogonal — it applies on top of any variant via `:hover` / `data-state="hover"`.
