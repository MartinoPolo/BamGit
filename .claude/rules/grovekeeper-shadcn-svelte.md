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

## Icons

- Current standard: Lucide path imports.
- Pending decision: adopt `data-icon="inline-start"` / `data-icon="inline-end"` only after a Storybook showcase verifies sizing and spacing.
- Until adopted, do not require `data-icon`; rely on component CSS where already implemented.
