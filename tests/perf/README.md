# Dashboard Performance Benchmarks

Playwright-based performance tests for the main dashboard (`/`). Measures DOM complexity, hover responsiveness, and rendering cost.

## Running

Requires a running dev server (`pnpm tauri dev` or `pnpm dev`):

```bash
npx playwright test tests/perf/ --config tests/perf/playwright.perf.config.ts --project dev
```

Or against a static preview build:

```bash
pnpm build && pnpm preview &
npx playwright test tests/perf/ --config tests/perf/playwright.perf.config.ts --project preview
```

## Tests

| Test                            | What it measures                                                                                              | Key thresholds                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **DOM metrics — baseline**      | Total DOM nodes, SVG element breakdown (polygons, paths, filters, etc.), issue card count, running animations | < 8000 nodes, < 2000 polygons, < 30 filters, < 100 animations  |
| **DOM metrics — forest hidden** | Same metrics after collapsing the ForestView                                                                  | < 500 polygons (verifies forest is unmounted, not just hidden) |
| **Hover FPS — forest visible**  | FPS and frame timing during rapid card hover with forest visible                                              | > 30 fps, P95 < 50ms                                           |
| **Hover FPS — forest hidden**   | Same with forest collapsed                                                                                    | > 45 fps, P95 < 40ms                                           |
| **Style recalculation cost**    | Time to force 10 hover enter/leave cycles with layout recalc                                                  | < 100ms                                                        |
| **Animation audit**             | Catalogs all running CSS animations by name and element tag                                                   | < 100 total                                                    |
| **Initial load performance**    | DOMContentLoaded, load complete, FCP, DOM interactive                                                         | DCL < 3s                                                       |

## Reading the output

Each test prints a labeled section to the console:

```
=== HOVER FPS ===
FPS:                57        # frames per second during the measurement window
Avg frame time:     17.4ms    # mean time between frames
P95 frame time:     29.7ms    # 95th percentile (worst 5% of frames)
Max frame time:     67.7ms    # single worst frame
Dropped frames:     5 (>33ms) # frames that took longer than 30fps target
```

**What to look for:**

- **FPS** should be 50+ for smooth interaction. Below 30 is visibly laggy.
- **P95 frame time** is more informative than average — it captures the stutters users actually feel.
- **Dropped frames** should be in single digits. High counts indicate jank.
- **DOM metrics (forest hidden)** verifies the ForestView is truly unmounted from DOM when collapsed. If polygon count stays high, the `{#if}` guard in `WorkspaceDashboardLayout.svelte` may have regressed.

## Reference: healthy numbers (May 2026, 24 mock issues)

```
Forest visible:  3000 DOM nodes, 604 SVG polygons, 57 fps hover, P95 ~30ms
Forest hidden:   1785 DOM nodes, 4 SVG polygons, 60 fps hover, P95 ~29ms
```
