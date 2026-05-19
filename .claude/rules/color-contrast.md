# Color Contrast Rules

This project uses mid-tone accent colors (OKLCH L=0.5–0.69), unlike standard shadcn where `accent` is a near-white surface. This makes `accent-foreground` unreliable for text contrast on accent backgrounds.

## The `accent-foreground` Problem

`accent-foreground` is white (~L=0.985) for most accents in light mode. On a mid-tone accent background, white text fails WCAG AA (4.5:1) for several colors (Rose ~3.2:1, Teal ~3.5:1, Coral ~3.5:1, Sage ~3.8:1).

**Never use `text-accent-foreground` on accent-colored backgrounds.** Text should inherit `foreground` (always high contrast) or use `primary-foreground` on `primary` backgrounds.

## Color Systems

### Primary (solid, high-contrast)

Used for selected states, primary CTAs, and elements that need strong visual weight.
Always paired: `bg-primary` + `text-primary-foreground`.
Hover on primary bg: `hover:bg-primary/80` (lightens slightly, keeps text readable).

```
bg-primary text-primary-foreground          ← selected pill, CTA button
hover:bg-primary/80                         ← hover on primary bg
bg-primary-soft                             ← subtle tinted surface (sidebar active, chat bubble)
text-primary                                ← accent-colored text on neutral bg (links, active labels)
```

### Accent (tinted, 3 opacity levels)

Used for interactive highlights and indicators. Always uses opacity on `accent` — never full `bg-accent` with text. Text inherits `foreground` at all levels (dark in light mode, light in dark mode) — guaranteed WCAG AA contrast.

```
┌─────────────┬────────────┬──────────────────────────────────────────────┐
│ Level       │ Class      │ Use case                                     │
├─────────────┼────────────┼──────────────────────────────────────────────┤
│ Subtle      │ accent/15  │ Hover on already-tinted elements             │
│             │            │ (range-middle hover, unselected day hover)   │
├─────────────┼────────────┼──────────────────────────────────────────────┤
│ Highlight   │ accent/25  │ Focus states, selection bands, indicators,   │
│             │            │ list hover, today marker, table row hover    │
├─────────────┼────────────┼──────────────────────────────────────────────┤
│ Strong      │ accent/50  │ Hover on indicators, prominent highlight     │
└─────────────┴────────────┴──────────────────────────────────────────────┘
```

Only these 3 values. Do not introduce `/20`, `/30`, `/40`, or other intermediate opacities.

### Neutral surfaces (layered)

```
bg-background                               ← page level
bg-surface                                  ← card, panel
bg-surface-2                                ← nested surface (input bg, secondary panel)
bg-surface-3                                ← deeper nesting
bg-surface-hover                            ← neutral hover (non-accent hover states)
bg-muted + text-muted-foreground            ← de-emphasized content
```

### Destructive (semantic)

```
bg-destructive + text-destructive-foreground ← danger button, error state
text-destructive                            ← error text on neutral bg
```

## Safe Pairings

| Background                   | Text                                 | Status                                                 |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------ |
| `bg-primary`                 | `text-primary-foreground`            | Always safe                                            |
| `bg-accent/15`, `/25`, `/50` | inherited `text-foreground`          | Always safe                                            |
| `bg-destructive`             | `text-destructive-foreground`        | Always safe                                            |
| `bg-muted` / `bg-surface-*`  | inherited or `text-muted-foreground` | Always safe                                            |
| `bg-accent` (full)           | `text-accent-foreground`             | **UNSAFE** — fails WCAG AA for Rose, Teal, Coral, Sage |
| `bg-accent` (full)           | `text-foreground`                    | **UNSAFE** — fails for Bark (dark-on-medium)           |

## Hover Rules

- On `bg-primary`: use `hover:bg-primary/80` — lightens pill, keeps white text
- On neutral bg: use `hover:bg-accent/15` (subtle) or `hover:bg-accent/25` (standard)
- On `bg-accent/25`: use `hover:bg-accent/50` — darkens indicator
- Never use `hover:text-foreground` on dark backgrounds — dark-on-dark
- Never use `hover:text-accent-foreground` on any background — unreliable token

## When Adding shadcn Components

After running `shadcn add`, scan the new component for these patterns and fix:

1. `focus:bg-accent focus:text-accent-foreground` → `focus:bg-accent/25` (remove text class)
2. `data-open:bg-accent data-open:text-accent-foreground` → `data-open:bg-accent/25` (remove text class)
3. `hover:bg-accent` (full) → `hover:bg-accent/25`
4. Any `text-accent-foreground` → remove (let text inherit `foreground`)
