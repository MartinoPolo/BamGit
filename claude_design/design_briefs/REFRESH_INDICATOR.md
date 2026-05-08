# RefreshIndicator — Design Spec

Compound button component that combines a refresh action with data freshness status. Wraps the existing `Button` component with additional state indicators. Reusable across any page with manual-refresh data (usage, sessions, overview). Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono.

## Generate Three Distinct Variants

**Variant A — Inline Label**: Square icon button with a separate text label to its left showing "Updated 2m ago". New-data state adds a colored dot badge on the button corner. Compact horizontal arrangement.

**Variant B — Tooltip-Revealed**: Square icon button only. Hover tooltip shows last-updated timestamp. New-data state: button border pulses subtly + dot badge. Stale state: icon color fades to muted. Minimal footprint.

**Variant C — Split Indicator**: Two-part component: left section shows relative timestamp text, right section is the icon button. New-data state: left section shows "New data" in primary color with a refresh arrow. Acts as a single clickable unit.

## Component Purpose

Show users when data was last refreshed and whether new data is available, without requiring them to manually check. The component must be glanceable — a quick look tells you if the data is fresh or stale.

## Required Elements

### Button Core

- Uses existing `Button` component with `size="icon-sm"` and `variant="secondary"`
- Icon: `RefreshCw` from Lucide (rotates during loading state)
- Wrapped in `SimpleTooltip` with contextual text per state

### States (5 total)

| State | Trigger | Icon | Label/Tooltip | Badge | Visual |
|---|---|---|---|---|---|
| **Idle** | Initial, no data loaded | Static RefreshCw | "Refresh metrics" | None | Default secondary button |
| **Loading** | Click or auto-refresh triggered | Spinning RefreshCw (CSS animation) | "Refreshing..." | None | Slightly muted, non-interactive |
| **Fresh** | Data loaded <30s ago | Static RefreshCw | "Updated just now" | None | Subtle green tint or checkmark flash |
| **Stale** | Data loaded >2min ago | Static RefreshCw | "Updated {N}m ago" | None | Text/icon fades toward muted-foreground |
| **New data** | metrics-updated event received | Static RefreshCw | "New data available" | Colored dot (top-right) | Primary-colored dot badge, optional subtle pulse |

### Timestamp Display

- Relative time format: "just now", "1m ago", "5m ago", "1h ago"
- Updates reactively (re-derives every 30s)
- Geist Mono, `text-xs`, `text-muted-foreground`
- Position varies by variant (inline, tooltip, or split section)

### Dot Badge (new-data state)

- Size: 6-8px circle
- Color: `bg-primary` (moss green)
- Position: top-right corner of the button, overlapping the border
- Optional: subtle pulse animation (1-2 cycles, then static)
- Clears on click (triggers refresh)

### Interaction

- Click: triggers `onRefresh` callback, transitions to Loading state
- Loading → Fresh transition: automatic after data loads
- Fresh → Stale transition: automatic after 2 minutes
- New-data badge: appears when `metrics-updated` Tauri event fires, clears on next refresh

## Reusable Components

- `Button`: `icon-sm`, `secondary` variant as the base
- `SimpleTooltip`: state-dependent tooltip text
- `cn()`: conditional classes for state-based styling

## Components to Adopt

None — built entirely from existing primitives.

## Layout Constraints

- Button: `size-[var(--size-control-sm)]` (26px square, zero padding)
- Dot badge: 6-8px, positioned `absolute -top-0.5 -right-0.5`
- Inline label (if used): `text-xs`, `text-muted-foreground`, `tabular-nums`
- Total component width: 26px (icon-only) to ~120px (with inline label)

## States to Explore in Variants

- All 5 states shown side-by-side for comparison
- Transition from Fresh → Stale (opacity/color fade)
- New-data badge appearance animation
- Loading spin animation

States to design after variant selection:
- Dark mode appearance for all states
- Hover states for each base state
- Disabled state (during page transition)
- Multiple RefreshIndicators on same page (e.g., different data sources)

## Visual References

- Current refresh button: `src/routes/usage/+page.svelte` line 167 (basic Button with RefreshCwIcon)
- Notification dot badges in other apps (Slack, Discord)
- StatCell pulse dots: `src/lib/components/ui/stat-cell/` (similar dot animation)

## UI Freedom

- Whether the timestamp is always visible or tooltip-only
- Badge pulse animation style and duration
- Transition animation between states (fade, scale, color shift)
- Whether Fresh state shows a brief green checkmark overlay
- Icon rotation speed and easing during Loading

## Not Included

- Multiple data source tracking (single timestamp for now)
- Auto-refresh timer configuration
- Network error state (handle at page level)
