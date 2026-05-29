# Worktree Setup Card — Design Summary

**Base**: Variant 1 (tilted 105deg, 2.5s) | **Refined**: 2026-05-26

## Refinements Applied

Variant 1 was chosen from 6 candidates (tilted vs vertical × 3 speeds). Refined with: single variant isolation, design-system token alignment, expanded color coverage (6 issue colors). The shimmer replaces the previous `opacity: 0.6` treatment on worktree-setup cards.

## Component Map

### Codebase — Use As-Is

| Component | Path | Usage | Key Props/Variants |
| --------- | ---- | ----- | ------------------- |
| IssueCard | `src/lib/components/blocks/issue-card/IssueCard.svelte` | Card root with `data-card-state` attribute | `data-card-state="worktreeSetup"` |
| issue_card_variant_css | `src/lib/components/blocks/issue-card/issue_card_variant_css.ts` | Sets `--ic-color` on every card via `sharedCardProps` | Line 332 |

### Build Custom

| Proposed Name | Description | Why existing components don't cover it |
| ------------- | ----------- | -------------------------------------- |
| CSS-only shimmer | `@keyframes` + `::after` rule in `app.css` | Pure CSS animation targeting `data-card-state` attribute — no component needed |

## Implementation Notes

**CSS approach**: The shimmer is a `::after` pseudo-element on `[data-card-state="worktreeSetup"]`. It reads `--ic-color` (already set on every card via `sharedCardProps` in `computeVariantSlotStyles()`). No JS, no Svelte changes needed for the shimmer itself.

**Critical**: `background-repeat: no-repeat` must be set on the `::after` — without it, the gradient tiles and creates phantom double-sweep bands (discovered during mockup iteration).

**Card already has `position: relative`** via `issueCardVariants` tv() definition, so `::after` with `position: absolute` works without changes.

**Paired change**: Remove the `opacity: 0.6` override from `issue_card_variant_css.ts:201-203` (worktreeSetup state). The shimmer replaces opacity as the visual signal.

**Animation spec**:
- Angle: `105deg` (tilted diagonal)
- Duration: `2.5s`
- Easing: `ease-in-out`
- Iteration: `infinite`
- Gradient: 30%→70% band with peak at 50% using `color-mix(in oklch, var(--ic-color) 15%, transparent)`
- Background-size: `300% 100%` for smooth single sweep
