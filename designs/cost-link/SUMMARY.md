# CostLink — Refined Design Summary

**Chosen variant**: E (Contextual Color Coding)
**Refinements applied**:

## Color Adjustments

| Magnitude | Original hue | Refined hue | Rationale |
|-----------|-------------|-------------|-----------|
| Low | 142 (moss) | 142 (unchanged) | Already works well as "all clear" |
| Medium | 68 (amber) | **82 (golden yellow)** | More yellow, clearly distinct from both green and red |
| High | 15 (rose) | **8 (red)** | More red, clearly distinct from amber. Reads as "danger" |

## Two Modes

1. **Colorful** (`cost-link-low` / `cost-link-medium` / `cost-link-high`): Magnitude-coded colors for contexts where cost awareness matters (workspace cards, session sidebars, usage page)
2. **Monocolor** (`cost-link-mono`): Uses `--foreground-muted` → `--foreground` on hover. For contexts where colored text would be noisy (dense tables, export previews)

## Theme Adaptation

- **Dark**: Higher lightness, moderate chroma for readability on dark surfaces
- **Light**: Lower lightness, higher chroma for WCAG-compliant contrast on white

## States Designed

All 5 states across all magnitudes × both themes:
- Default (color at rest, no underline)
- Hover (brighter + glow + underline appears)
- Focus (ring outline, 2px offset)
- Active (brightness dimmed 18%)
- Disabled (subtle gray, 42% opacity, no pointer)

## Token Alignment

Colors derived from existing token palette:
- Low → `--moss-400` / `--moss-600` neighborhood
- Medium → between `--amber-300` and `--gold-400` (hue 82)
- High → `--rose-400` shifted toward pure red (hue 8)
