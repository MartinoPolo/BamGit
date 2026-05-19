# Process Badges — Design Summary

**Base**: Variant A | **Refined**: 2026-05-18

## Refinements Applied

Variant A was chosen and refined with: port colon prefix, bidirectional collapse/expand animations.
See the design brief for full requirements (5 states, stale dimming, restart count, overflow).
Key changes from the base variant:
- ServerPortBadge displays `:3000` instead of `3000` — colon prefix signals port number unambiguously
- Interactive animation demo added to refined mockup showing collapse (running → completed) and expand (completed → running) transitions
- Animation timing specified: width/padding 300ms ease-in-out, color 200ms, text fade 200ms, icon fade 150ms with 100ms delay

## Component Map

### Codebase — Use As-Is

| Component | Path | Usage | Key Props/Variants |
| --- | --- | --- | --- |
| Badge | `src/lib/components/shadcn/badge/` | Badge style system (A/B/C), `badgeVariants` TV definition | `tone`, `badgeStyle`, `format`, `size`, `dot` |
| `resolveBadgeStyleClass()` | `src/lib/components/shadcn/badge/badge_style_utils.ts` | Maps `BadgeStyleOption` → CSS class for all badge components | `solid`, `borderless-dark`, `bordered-dark` |
| CommandResultsRow | `src/lib/components/blocks/issue-card/CommandResultsRow.svelte` | Row 4 container — flex wrap, max 3 visible + overflow | `commandResults`, `serverPort` |
| `computeCommandResultsOverflow()` | `src/lib/components/blocks/issue-card/command_results_overflow.ts` | Overflow count logic | — |

### Components to Modify

| Component | Path | Change |
| --- | --- | --- |
| CommandResultBadge | `src/lib/components/derived/command-badges/CommandResultBadge.svelte` | Add `timeout` + `stopped` states, restart count display, bidirectional collapse/expand animation |
| `command_result_badge_types.ts` | `src/lib/components/derived/command-badges/command_result_badge_types.ts` | Extend `CommandResultState` to include `'timeout' \| 'stopped'`, add optional `restartCount` + `restartMax` props |
| ServerPortBadge | `src/lib/components/derived/command-badges/ServerPortBadge.svelte` | Add `:` prefix before port number in display text |
| CommandResultsRow | `src/lib/components/blocks/issue-card/CommandResultsRow.svelte` | Update `CommandResult` interface to accept 5 states |

### Build Custom

None — all primitives exist.

## Implementation Notes

- **Bidirectional animation**: CSS `transition` on the badge element handles both directions automatically — toggling between `is-running` (pill) and `is-collapsed` (circle) classes triggers the same transition properties in reverse. No JavaScript animation needed. Storybook play tests should verify both collapse and expand by toggling the `state` prop.
- **Port prefix**: Simply prepend `:` to the port number text in `ServerPortBadge.svelte` template (change `{port}` to `:{port}`). The `aria-label` should remain `"Open port {port}"` without the colon for screen reader clarity.
- **Color variable**: Timeout uses `var(--status-warning)` and stopped uses `var(--foreground-subtle)` — both already exist in the token system.
- **Icon imports**: Add `ClockIcon` from `@lucide/svelte/icons/clock` (timeout) and `SquareIcon` from `@lucide/svelte/icons/square` (stopped).
- **Storybook**: Add stories for all 5 states, stale variants, restart count, and an interactive story that toggles state to demonstrate bidirectional animation.
