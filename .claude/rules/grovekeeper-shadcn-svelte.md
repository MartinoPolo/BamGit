---
paths:
    - '**/*.svelte'
    - '**/*.svelte.ts'
    - '**/*.svelte.js'
    - '**/*-variants.ts'
applyTo: '**/*.svelte,**/*.svelte.ts,**/*.svelte.js,**/*-variants.ts'
---

# Grovekeeper shadcn-svelte

Project-specific rules. This supplements the symlinked shared shadcn-svelte rule.

## Project Defaults

- UI alias is `$lib/components/shadcn`.
- Style is `vega`.
- Icons are Lucide only. Use path imports from `@lucide/svelte/icons/*`.

## Component Choice

- Use existing Grovekeeper/shadcn components before custom markup.
- Use built-in variants before one-off classes.
- Use semantic tokens and Grovekeeper theme tokens instead of raw Tailwind colors.
- Use `class` mainly for layout, sizing, and placement.
- Use `cn()` from `$lib/utils.js` for merged or conditional classes.

## Variants

Use Button as the template for variant-bearing components.

- `*-variants.ts` owns `tv()`, variant types, constants, and prop types.
- Derive types with `keyof typeof componentVariants.variants.name`.
- Full variant arrays use `Object.keys(...) as ComponentVariant[]`.
- Semantic subset arrays use `asExhaustiveArray<T>()(...)`.
- Do not use `VariantProps` when a direct keyed type is clearer.
- `.svelte` files import only what they use from `*-variants.ts`.
- `index.ts` imports `Root` from the Svelte file and re-exports variant functions, types, and constants directly from `*-variants.ts`.
- Storybook controls and all-variant grids use exported variant arrays.

## Composition

- Single-component barrels use named imports: `import { Button } from '$lib/components/shadcn/button/index.js'`.
- Multi-part components use namespace imports: `import * as Dialog from '$lib/components/shadcn/dialog/index.js'`.
- Keep shadcn/Bits primitives available for complex composition.
- For repeated product patterns, create Grovekeeper wrappers instead of repeating primitives at call sites.
- Wrappers should expose a small app-level API and preserve access to lower-level primitives when needed.

### Example Select component Strategy

- For simple use cases, use shadcn-svelte's Select with built-in variants.
- Use custom/Bits select primitives for grouped, searchable, portal, or rich item layouts.
- Create wrappers for repeated select patterns such as provider, language, grouped option, or domain-specific selects.
- Avoid one mega-select component that tries to cover every primitive use case.

## Accessibility

- Dialog, Sheet, and Drawer content must include a title. Use `sr-only` when visually hidden.
- Tabs triggers stay inside `Tabs.List`.
- Menu/select/command items stay inside their group component when the primitive provides one.
- Form invalid state uses both `data-invalid` on the field container and `aria-invalid` on the control.
- Icon-only buttons (`size="icon"` or `size="icon-sm"`) must have `aria-label`. Tooltip wrappers (`WithTooltip`) do not provide screen-reader labels.
- Use `{#snippet child({ props })}` on `Tooltip.Trigger` to avoid nested `<button>` elements (nested-interactive a11y violation).

## Event Propagation

- Floating overlays (Dropdown, ContextMenu, Popover, Sheet, Select, Combobox) must stop keyboard and pointer events from propagating to parent layers.
- Escape key must close only the topmost overlay — bits-ui escape-layer handles this by default.
- Click events inside interactive zones (cards, toolbar buttons, quick-action icons) need `stopPropagation()` to prevent parent card/row click handlers from firing.
- Custom `svelte:window` keyboard handlers must guard against firing when an overlay is open.

## Icons

- Lucide path imports: `import XIcon from '@lucide/svelte/icons/x'`.
- Use `data-icon="inline-start"` (prefix) or `data-icon="inline-end"` (suffix) on icons inside `Button`. Component CSS sizes icons automatically via these attributes.
- No `size-*` classes on icons inside components — the component handles sizing.

## Storybook Conventions

- Story files: `ComponentName.stories.svelte` using `defineMeta` + `{#snippet template(args)}`.
- Title taxonomy: `Base/` for shadcn/base, `Derived/` for derived, `Blocks/<Module>/` for blocks.
- Always include `tags: ['autodocs']` in `defineMeta`.
- Play test imports: `import { expect, fn, userEvent, waitFor, within } from 'storybook/test'` (NOT `@storybook/test`).
- Use `fn()` for callback spies in `defineMeta.args`, never `vi.fn()`.
- Play function args: use narrow types matching component callback props (`{ onclick?: unknown }`), not `Record<string, unknown>`.
- bits-ui triggers with `pointer-events: none` (child-snippet pattern): use native `element.click()` instead of `userEvent.click()` in play tests.
- Wrap post-state-change assertions in `waitFor()` — Svelte 5 `$state` updates are async.
- bits-ui highlights items via `data-highlighted` attribute, not DOM focus — assert `toHaveAttribute('data-highlighted', '')` not `toHaveFocus()`.
