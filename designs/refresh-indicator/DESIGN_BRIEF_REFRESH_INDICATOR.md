# RefreshIndicator — Design Brief

Compact utility component that combines a refresh action with data freshness status. Wraps the existing `Button` component with state indicators. Appears inline in toolbars and page headers — never standalone. Reusable across any surface with manual-refresh data (workspace dashboard sync, usage metrics, sessions, overview).

## Design Tokens

Use the Grovekeeper Forest Moss palette from `designs/tokens.css`. Font: Geist / Geist Mono. OKLCH color space.

---

## 1. Purpose

Communicate sync/refresh status at a glance. Users should never have to manually check whether their data is fresh. A quick look at the indicator tells them: data age, whether a refresh is in progress, whether new data arrived in the background, and whether the last sync failed. The component is the single source of truth for "is my view current?"

---

## 2. Surrounding Context

This is a **utility component** that appears embedded in other surfaces. It never renders standalone.

### 2.1 Primary Context: TopBar (Workspace Dashboard)

The TopBar (`src/lib/components/blocks/layout/TopBar.svelte`) is a horizontal strip with:
- **Left**: workspace title (e.g., "Grovekeeper") + subtitle ("workspace · 12 issues")
- **Right**: a row of icon buttons — **Sync** (RefreshCw), Notifications (Bell), Quick Ideas (Lightbulb), Toggle Forest (Trees), Create Issue (primary button with "+" icon)

The RefreshIndicator **replaces the current bare sync button**. It sits at the same position — first in the right-side controls row, to the left of the notification bell. Surroundings: `gap-1.5` between sibling buttons, `px-5 py-3` toolbar padding, `border-b border-border` bottom edge.

Currently the TopBar passes `syncing: boolean` and `onSync` callback. The RefreshIndicator upgrades this to show richer state (freshness, errors, new-data badge) while maintaining the same compact inline footprint.

### 2.2 Secondary Context: Usage Page Header

The usage page (`src/routes/usage/+page.svelte`) renders a RefreshIndicator in its header toolbar, between the AchievementsDialog button and the Export CSV button. The existing implementation (`src/lib/components/blocks/usage/RefreshIndicator.svelte`) already uses all five states. This is the **reference implementation** — the design should unify both contexts into one shared component.

### 2.3 Tertiary Contexts (Future)

- **Overview page**: sync status for multi-workspace health polling
- **Sessions list**: refresh to pick up new session events
- **AI Config page**: manual rescan of discovery sources
- **Issue card row badges**: not a RefreshIndicator, but the SyncBadge (`src/lib/components/derived/sync-badge/SyncBadge.svelte`) shows per-issue behind-base counts — a related but distinct component

### 2.4 Mockup Rendering Rule

Show the parent toolbar at reduced opacity as read-only context. The designed component fills only its button/indicator area within the toolbar. Include at least 2 neighboring buttons (Bell, Trees) to show spacing rhythm.

---

## 3. Requirements

### 3.1 States (6 total)

| # | State | Trigger | Icon | Tooltip | Badge | Visual |
|---|-------|---------|------|---------|-------|--------|
| 1 | **Idle** | Initial, no data loaded | Static RefreshCw | "Sync GitHub data" | None | Default ghost button |
| 2 | **Syncing** | Click or auto-sync triggered | Spinning RefreshCw (CSS `animate-spin`) | "Syncing..." | None | Slightly muted, `disabled`, non-interactive |
| 3 | **Fresh** | Data loaded <30s ago | Static RefreshCw | "Synced just now" | None | Subtle success tint (green flash that fades) |
| 4 | **Stale** | Data loaded >2min ago | Static RefreshCw | "Synced {N}m ago" / "Synced {N}h ago" | None | Icon/text fade toward `text-muted-foreground` |
| 5 | **New data** | Backend event fired (e.g., `metrics-updated`, `github-state-changed`) | Static RefreshCw | "New data available — click to refresh" | Colored dot (top-right) | `bg-primary` dot badge, optional 1-2 cycle pulse |
| 6 | **Error** | Last sync failed | Static RefreshCw | "Sync failed: {error}" | Red dot (top-right) | `text-status-danger` icon tint, red dot badge |

**State transitions:**
- Click: any non-syncing state -> Syncing
- Sync completes successfully: Syncing -> Fresh
- Sync fails: Syncing -> Error
- Fresh -> Stale: automatic after `STALE_THRESHOLD_MS` (120_000ms)
- Backend event while idle/stale/fresh: -> New Data
- New Data + click: -> Syncing (badge clears)
- Error + click: -> Syncing (retry)

### 3.2 Timestamp Display

- Relative format: "just now" (<60s), "1m ago", "5m ago", "1h ago", "3h ago"
- Updates reactively every 30s via `setInterval` (existing pattern in `RefreshIndicator.svelte`)
- Font: Geist Mono, `gk-tiny` (11px), `text-foreground-subtle`
- Position varies by variant (inline next to button, tooltip-only, or split section)
- Uses `tabular-nums` for stable digit width

### 3.3 Dot Badge

- Size: 6-8px circle
- **New data**: `bg-primary` (moss green)
- **Error**: `bg-status-danger` (red)
- Position: absolute, top-right corner overlapping button border (`absolute -top-0.5 -right-0.5`)
- Optional pulse animation: 1-2 cycles then static. Uses `gk-pulse` from tokens.css
- Clears on click (triggers sync)

### 3.4 Animation Behavior

- **Syncing**: RefreshCw icon rotates via CSS `animate-spin`. No other animation on the container
- **Fresh -> idle transition**: brief green tint that fades over ~600ms (success flash)
- **New data dot appearance**: fade-in + optional 1-2 cycle pulse, then holds static
- **Error dot**: static red, no pulse (errors persist until retry)
- No animation for stale state (it just fades to muted — the absence of vibrancy IS the signal)

### 3.5 Click Behavior

- Click triggers `onRefresh` / `onSync` callback
- During syncing: button is `disabled`, click is no-op
- Error state: click retries the sync
- New data state: click refreshes and clears the badge
- Keyboard: focusable, Enter/Space triggers refresh

---

## 4. Existing Components to Reuse

| Component | From | Usage |
|-----------|------|-------|
| `Button` | `$lib/components/shadcn/button` | Base — `intent="ghost"`, `size="icon-sm"` (26px square) |
| `SimpleTooltip` | `$lib/components/shadcn/tooltip` | State-dependent tooltip text |
| `Badge` (borderless-dark style) | `$lib/components/shadcn/badge` | Optional for error/new-data states if using badge instead of raw dot |
| `cn()` | `$lib/utils` | Conditional state-based classes |
| `RefreshCwIcon` | `@lucide/svelte/icons/refresh-cw` | Primary icon |
| `REFRESH_STATES` | `$lib/modules/usage/usage_types` | State enum constants (extend with `error` state) |
| `SyncBadge` | `$lib/components/derived/sync-badge` | **Not reused directly** — different purpose (per-issue behind-base count), but same visual language for color-mix badge styling |
| `gk-pulse` animation | `designs/tokens.css` | Dot badge pulse |

---

## 5. Components to Design

| Component | Description | Storybook |
|-----------|-------------|-----------|
| **RefreshIndicator** | Unified component replacing both the TopBar sync button and the usage page RefreshIndicator. Ghost icon button + state indicators + optional inline label | Yes |

This is a single component, not a decomposition. It wraps `Button` + `SimpleTooltip` + conditional dot badge + optional timestamp label. No sub-components needed.

### 5.1 Type Changes

Extend `REFRESH_STATES` in `usage_types.ts` with `error: 'error'` and update `RefreshState` type. Alternatively, create a shared `SYNC_STATES` const if the usage-specific naming feels wrong for the broader component.

### 5.2 Props Interface

```typescript
interface RefreshIndicatorProps {
  refreshState: RefreshState;
  lastUpdatedAt: number | null;
  errorMessage?: string;
  onrefresh: () => void;
  /** Whether to show timestamp inline (vs tooltip-only). Default: false */
  showTimestamp?: boolean;
}
```

---

## 6. States & Interactions

### 6.1 Visual State Matrix

| State | Button Intent | Icon Class | Dot | Tooltip | Timestamp |
|-------|--------------|------------|-----|---------|-----------|
| Idle | `ghost` | (none) | — | "Sync GitHub data" | — |
| Syncing | `ghost` | `animate-spin text-foreground-muted` | — | "Syncing..." | — |
| Fresh | `ghost` | `text-status-success` (brief, fades) | — | "Synced just now" | "just now" |
| Stale | `ghost` | `text-foreground-muted` | — | "Synced {N}m ago" | "{N}m ago" |
| New Data | `ghost` | (none) | `bg-primary` (moss) | "New data available" | "{N}m ago" |
| Error | `ghost` | `text-status-danger` | `bg-status-danger` (red) | "Sync failed: {msg}" | — |

### 6.2 Hover

- Default hover: `ghost` button hover treatment (bg-surface-hover appears)
- All states: hover is additive (same as issue card hover principle)
- Syncing: cursor changes to `not-allowed`, no hover bg

### 6.3 Focus

- Standard `ring-ring` focus ring from Button component
- Tab-focusable, Enter/Space triggers refresh

---

## 7. Design Constraints (Non-Negotiable)

- **Max width**: 26px (icon-only) to ~120px (with inline timestamp). Must fit in TopBar's `gap-1.5` rhythm alongside Bell, Trees, Lightbulb buttons
- **Height**: matches sibling buttons — `size-[var(--size-control-sm)]` (26px)
- **Button base**: `intent="ghost"`, `size="icon-sm"` — consistent with all TopBar buttons (not `secondary` like current usage page impl)
- **Dot badge**: positioned outside button bounds (`absolute -top-0.5 -right-0.5`), 6-8px
- **No text label on the button itself** — icon-only. Timestamp is a separate adjacent element (when `showTimestamp` is true)
- **Must use existing Button component** — no custom button markup
- **Must use existing SimpleTooltip** — no custom tooltip
- **Typography**: Geist Mono for timestamp, `gk-tiny` (11px), `tabular-nums`
- **OKLCH semantic tokens only** — `text-status-success`, `text-status-danger`, `bg-primary`, `text-foreground-muted`
- **Dark mode is primary** — light mode values swap automatically via `[data-theme]`
- **No network error state separate from Error** — a failed sync IS the error state. Error message in tooltip
- **Accessible**: `aria-label` on icon button, screen reader text for dot badge states

---

## 8. Design Freedom (Explore in Variants)

- Whether timestamp is always visible (inline) or tooltip-only — `showTimestamp` prop controls this, but variants can explore both layouts
- Animation easing and duration for the success flash (green fade on Fresh)
- Dot badge pulse style: CSS `gk-pulse`, scale bounce, or opacity fade
- Whether Fresh state shows a brief checkmark overlay on the icon before reverting to RefreshCw
- Icon rotation speed and easing during Syncing (linear vs ease-in-out)
- Whether the stale state dims the entire button or just the icon
- Inline timestamp positioning: right of button, below button, or inside a wider pill container
- Whether Error state shows a persistent red tint on the button background or just the dot + icon color
- Whether clicking during Error shows a brief "retrying..." animation

---

## 9. Inspiration & Visual References

### From This Codebase

- **Issue card badge styles** (borderless-dark): `color-mix(in oklch, {color} 14%, transparent)` bg + colored text. See `ISSUE_CARD_FINAL_DECISIONS.md` §12
- **SyncBadge**: color-mix technique for warning/danger background tints (`SyncBadge.svelte`)
- **Notification dot**: TopBar Bell button already has `span.absolute.top-1.right-1.size-1.5.rounded-full.bg-accent` for hasNotifications — the RefreshIndicator dot should match this size and positioning pattern
- **StatCell pulse**: `src/lib/components/ui/stat-cell/` has similar dot animation patterns

### External

- VS Code sync indicator (bottom-left status bar — spinning arrows during sync)
- Slack channel sync (subtle spinner in sidebar)
- Discord notification dots (red circles on icons)
- GitHub PR check status badges (green/red/yellow dots)

---

## 10. Variant Exploration History

Five variants (A-E) have been explored as HTML mockups in `designs/refresh-indicator/variants/`:

| Variant | Name | Key Idea | Status |
|---------|------|----------|--------|
| A | Inline Label | Button + adjacent timestamp text | Mockup complete |
| B | (unnamed) | — | Mockup complete |
| C | (unnamed) | — | Mockup complete |
| D | Progress Ring | Circular SVG ring around icon; fill level = freshness, color = urgency (green->amber->red) | Mockup + notes (`VARIANT-D.md`) |
| E | Animated Countdown | Circular progress ring on button + trailing countdown timer text | Mockup + notes (`VARIANT-E.md`) |

### Variant D Highlights (Progress Ring)

- Ring as dual affordance: fill level shows time, color shows urgency
- Continuous depletion model (smooth spectrum, not binary fresh/stale)
- Compact at 30px — self-documenting without tooltip
- Loading = indeterminate ring spin + icon spin ("orbital" animation)

### Variant E Highlights (Animated Countdown)

- Circular ring depletes as countdown ticks
- Gradual color escalation: subtle when fresh, prominent amber when stale
- Separated icon button + floating timer text (no enclosing pill)
- Timer uses `tabular-nums` for steady digit layout

---

## 11. States to Show in Mockups

**Required (all variants):**
- All 6 states side-by-side for comparison
- Each state shown **in TopBar context** (reduced-opacity parent toolbar with neighboring buttons)
- Transition from Fresh -> Stale (opacity/color fade progression at 0s, 30s, 1m, 2m marks)
- New data badge appearance animation (if applicable)
- Syncing spin animation
- Error state with red indicators

**Deferred to post-variant selection:**
- Light mode appearance for all states
- Hover states for each base state
- Disabled state (during page navigation)
- Multiple RefreshIndicators on same page (usage page + TopBar simultaneously)
- Error state with long error message tooltip

---

## 12. Not Included

- Auto-refresh timer configuration (sync is always manual-trigger or event-driven)
- Multiple data source tracking per indicator (each indicator tracks one source)
- Sync progress percentage (GitHub sync is all-or-nothing, not incremental)
- Sync history/log (belongs to a separate sync log panel if ever built)
- Per-issue sync status (handled by SyncBadge on issue cards)
