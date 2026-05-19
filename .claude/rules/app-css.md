---
paths:
    - 'src/app.css'
    - 'src/accent-colors.css'
applyTo: 'src/app.css,src/accent-colors.css'
---

# app.css — Global Stylesheet Rules

## What belongs in app.css

- `@import` directives (Tailwind, accent-colors.css)
- `@custom-variant` definitions
- `@theme inline` / `@theme` token registrations (colors, spacing, typography, radii, shadows, easing, durations, animations)
- `:root` design token definitions (OKLCH color scales, spacing, typography, z-index, etc.)
- `[data-theme='light']` / `[data-theme='dark']` theme color overrides
- `@keyframes` for animations registered in `@theme inline` (shimmer, badge-pulse, ws-pulse-ring, ws-led, ws-breathe)
- `@layer base` global resets (border-border, body defaults)
- Cross-cutting layout rules (dialog overlay pointer-events)

## What does NOT belong in app.css

- **Component-specific CSS classes** — scope inside the component's `<style>` block with `:global()` if needed
- **Component-specific keyframes** used by a single component — define in that component's `<style>` with `@keyframes -global-name`
- **Hardcoded duration values** — use `var(--duration-*)` tokens in inline CSS or `duration-*` Tailwind classes

## Accent colors

Accent color overrides live in `src/accent-colors.css` (imported by app.css). Each accent defines light/dark variants of `--primary`, `--accent`, `--ring`, and foreground counterparts.
