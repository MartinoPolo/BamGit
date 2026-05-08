# CostLink — Design Spec

Clickable cost value component used throughout the app. Displays a formatted dollar amount that navigates to the Usage page with appropriate filters pre-applied. Used in workspace cards, session sidebars, and any surface showing cost data. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist Mono (all cost values use monospace).

## Generate Three Distinct Variants

**Variant A — Subtle Underline**: Cost text with a dotted underline on hover, cursor-pointer. No visual distinction at rest (looks like normal cost text). Hover reveals interactivity.

**Variant B — Tinted Chip**: Cost text in a small rounded background pill (like a badge). Color indicates cost magnitude per the active color theme. Always looks interactive.

**Variant C — Icon-Appended**: Cost text with a tiny arrow-up-right icon (8px) that appears on hover, indicating navigation. At rest: plain text. On hover: icon fades in + text color shifts to primary.

## Component Purpose

Make cost values discoverable navigation points. Users see a cost number, want more detail, and can click to jump to the usage page with the right filters already set. Must not look like a button — it should feel like enriched text.

## Required Elements

### Props

- `costUsd: number` — the raw USD value to display
- `period?: MetricsPeriod` — filter to apply on navigation (defaults to current page context)
- `scope?: 'workspace' | 'global'` — workspace filter (defaults to current workspace)
- `currency?: string` — display currency (defaults to user preference, conversion applied)
- `size?: 'sm' | 'md'` — text size variant

### Display

- Formatted cost: `$X.XX` (2 decimal places)
- Currency conversion applied at render time if user preference differs from USD
- Font: Geist Mono, `tabular-nums`
- Size sm: `text-xs`, Size md: `text-sm` (default)

### Navigation

- Click calls `goto(resolve('/usage') + '?period=X&scope=Y')` within the same window
- URL search params encode the filter context
- No page reload — SvelteKit client-side navigation

### Hover State

- Cursor: `pointer`
- Visual change: underline, color shift, or icon appearance (per variant)
- `SimpleTooltip`: "View usage details" or "View cost breakdown"

### Accessibility

- `role="link"` or semantic `<a>` element
- `aria-label`: "View usage for $X.XX, {period} period"
- Keyboard: focusable, Enter/Space activates

## Reusable Components

- `SimpleTooltip`: hover explanation
- `cn()`: conditional hover/focus classes
- `resolve()` from `$app/paths`: type-safe route navigation

## Components to Adopt

None — pure component built from HTML primitives.

## Layout Constraints

- Inline element (does not break text flow)
- Size sm: `text-xs` (~10.5px), Size md: `text-sm` (~12px)
- No minimum width — adapts to content
- Padding: none at rest, minimal on hover (underline offset only)

## States to Explore in Variants

- Default (at rest)
- Hover
- Focus (keyboard navigation)
- Active (pressed)
- Different cost magnitudes ($0.12, $4.82, $124.50)

States to design after variant selection:
- With currency symbol other than $ (EUR, CZK)
- Inside a dark card background (workspace card footer)
- Inside a light surface (settings page)
- Disabled state (no usage data available)

## Visual References

- Workspace card footer: `src/lib/components/WorkspaceCard.svelte` (current cost display, not yet clickable)
- Session sidebar cost: `src/lib/components/session/` (cost in right sidebar)
- GitHub badge links: `src/lib/components/GitHubBadge.svelte` (similar click-to-navigate pattern)

## UI Freedom

- Whether interactivity is visible at rest or only on hover
- Underline style (solid, dotted, gradient)
- Color shift on hover (toward primary, toward chart color)
- Whether an icon appears on hover
- Animation timing and easing

## Not Included

- Cost trend indicators (up/down arrows) — handled by KPI cards
- Inline cost editing
- Cost comparison (handled by Compare view)
