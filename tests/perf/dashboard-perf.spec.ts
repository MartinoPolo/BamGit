/**
 * Dashboard performance benchmarks.
 *
 * Run against the dev server (port 1420):
 *   npx playwright test tests/perf/ --config tests/perf/playwright.perf.config.ts
 *
 * Or against a static preview build (port 4173):
 *   pnpm build && pnpm preview &
 *   npx playwright test tests/perf/ --config tests/perf/playwright.perf.config.ts --project preview
 */
import { test, expect, type Page } from '@playwright/test';

// ── Helpers ──────────────────────────────────────────────────────

interface DomMetrics {
	totalNodes: number;
	svgElements: number;
	svgPolygons: number;
	svgPaths: number;
	svgCircles: number;
	svgFilters: number;
	svgFilterPrimitives: number;
	svgClipPaths: number;
	svgGradients: number;
	issueCards: number;
	runningAnimations: number;
	forestViewPresent: boolean;
	forestViewVisible: boolean;
}

async function collectDomMetrics(page: Page): Promise<DomMetrics> {
	return page.evaluate(() => {
		const all = document.querySelectorAll('*');
		const svgEls = document.querySelectorAll('svg, svg *');
		const forestContainer = document.querySelector('[style*="sky-top"]');
		const forestRect = forestContainer?.getBoundingClientRect();

		return {
			totalNodes: all.length,
			svgElements: svgEls.length,
			svgPolygons: document.querySelectorAll('polygon').length,
			svgPaths: document.querySelectorAll('path').length,
			svgCircles: document.querySelectorAll('circle').length,
			svgFilters: document.querySelectorAll('filter').length,
			svgFilterPrimitives: document.querySelectorAll(
				'feGaussianBlur, feFlood, feComposite, feMerge, feMergeNode',
			).length,
			svgClipPaths: document.querySelectorAll('clipPath').length,
			svgGradients: document.querySelectorAll('linearGradient, radialGradient').length,
			issueCards: document.querySelectorAll('[data-testid="issue-card"]').length,
			runningAnimations: document.getAnimations().length,
			forestViewPresent: forestContainer !== null,
			forestViewVisible:
				forestContainer !== null && forestRect !== undefined && forestRect.height > 10,
		};
	});
}

interface FrameTimingResult {
	fps: number;
	frameTimes: number[];
	avgFrameTime: number;
	p95FrameTime: number;
	maxFrameTime: number;
	droppedFrames: number;
}

async function measureFrameTiming(page: Page, durationMs: number): Promise<FrameTimingResult> {
	return page.evaluate((duration) => {
		return new Promise<FrameTimingResult>((resolve) => {
			const frameTimes: number[] = [];
			let lastTime = performance.now();
			let frameCount = 0;
			const startTime = lastTime;

			function tick() {
				const now = performance.now();
				const elapsed = now - lastTime;
				frameTimes.push(elapsed);
				lastTime = now;
				frameCount++;

				if (now - startTime < duration) {
					requestAnimationFrame(tick);
				} else {
					const sorted = [...frameTimes].sort((a, b) => a - b);
					const p95Index = Math.floor(sorted.length * 0.95);
					const avgFrameTime =
						frameTimes.reduce((sum, t) => sum + t, 0) / frameTimes.length;
					resolve({
						fps: Math.round((frameCount / (now - startTime)) * 1000),
						frameTimes: sorted,
						avgFrameTime: Math.round(avgFrameTime * 100) / 100,
						p95FrameTime: Math.round(sorted[p95Index] * 100) / 100,
						maxFrameTime: Math.round(sorted[sorted.length - 1] * 100) / 100,
						droppedFrames: frameTimes.filter((t) => t > 33.33).length,
					});
				}
			}

			requestAnimationFrame(tick);
		});
	}, durationMs);
}

async function measureHoverFps(page: Page): Promise<FrameTimingResult> {
	const cards = page.locator('[data-testid="issue-card"]');
	const cardCount = await cards.count();
	if (cardCount === 0) {
		throw new Error('No issue cards found');
	}

	const measurePromise = measureFrameTiming(page, 3000);

	for (let cycle = 0; cycle < 3; cycle++) {
		const hoverCount = Math.min(cardCount, 8);
		for (let i = 0; i < hoverCount; i++) {
			const card = cards.nth(i);
			await card.hover({ force: true });
			await page.waitForTimeout(50);
		}
	}

	return measurePromise;
}

async function measureStyleRecalc(page: Page): Promise<{ recalcTimeMs: number }> {
	return page.evaluate(() => {
		const cards = document.querySelectorAll('[data-testid="issue-card"]');
		if (cards.length === 0) {
			return { recalcTimeMs: 0 };
		}

		const start = performance.now();
		for (let i = 0; i < Math.min(cards.length, 10); i++) {
			const card = cards[i] as HTMLElement;
			card.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
			// Force style recalc
			void card.offsetHeight;
			card.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
			void card.offsetHeight;
		}
		const elapsed = performance.now() - start;

		return { recalcTimeMs: Math.round(elapsed * 100) / 100 };
	});
}

// ── Test Suite ───────────────────────────────────────────────────

test.describe('Dashboard Performance Benchmarks', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1500);
	});

	test('DOM metrics — baseline snapshot', async ({ page }) => {
		const metrics = await collectDomMetrics(page);

		console.log('=== DOM METRICS ===');
		console.log(`Total DOM nodes:       ${metrics.totalNodes}`);
		console.log(`SVG elements (all):    ${metrics.svgElements}`);
		console.log(`  - polygons:          ${metrics.svgPolygons}`);
		console.log(`  - paths:             ${metrics.svgPaths}`);
		console.log(`  - circles:           ${metrics.svgCircles}`);
		console.log(`  - filters:           ${metrics.svgFilters}`);
		console.log(`  - filter primitives: ${metrics.svgFilterPrimitives}`);
		console.log(`  - clipPaths:         ${metrics.svgClipPaths}`);
		console.log(`  - gradients:         ${metrics.svgGradients}`);
		console.log(`Issue cards:           ${metrics.issueCards}`);
		console.log(`Running animations:    ${metrics.runningAnimations}`);
		console.log(`Forest present:        ${metrics.forestViewPresent}`);
		console.log(`Forest visible:        ${metrics.forestViewVisible}`);

		// Thresholds — these document "good enough" targets
		expect(metrics.totalNodes, 'DOM node count too high').toBeLessThan(8000);
		expect(metrics.svgPolygons, 'SVG polygon count too high').toBeLessThan(2000);
		expect(metrics.svgFilters, 'SVG filter count too high').toBeLessThan(30);
		expect(metrics.runningAnimations, 'Too many running animations').toBeLessThan(100);
	});

	test('DOM metrics — forest hidden', async ({ page }) => {
		const collapseButton = page.locator('button[aria-label="Toggle forest"]');
		await collapseButton.click();
		await page.waitForTimeout(500);

		const metrics = await collectDomMetrics(page);

		console.log('=== DOM METRICS (Forest Hidden) ===');
		console.log(`Total DOM nodes:       ${metrics.totalNodes}`);
		console.log(`SVG elements (all):    ${metrics.svgElements}`);
		console.log(`  - polygons:          ${metrics.svgPolygons}`);
		console.log(`  - filters:           ${metrics.svgFilters}`);
		console.log(`Running animations:    ${metrics.runningAnimations}`);
		console.log(`Forest present:        ${metrics.forestViewPresent}`);
		console.log(`Forest visible:        ${metrics.forestViewVisible}`);

		// When forest is hidden, SVG count should drop dramatically
		expect(
			metrics.svgPolygons,
			'Hiding forest should remove SVG polygons from DOM',
		).toBeLessThan(500);
		expect(metrics.runningAnimations, 'Hiding forest should stop tree animations').toBeLessThan(
			30,
		);
	});

	test('Hover FPS — issue cards', async ({ page }) => {
		const result = await measureHoverFps(page);

		console.log('=== HOVER FPS ===');
		console.log(`FPS:                ${result.fps}`);
		console.log(`Avg frame time:     ${result.avgFrameTime}ms`);
		console.log(`P95 frame time:     ${result.p95FrameTime}ms`);
		console.log(`Max frame time:     ${result.maxFrameTime}ms`);
		console.log(`Dropped frames:     ${result.droppedFrames} (>33ms)`);

		expect(result.fps, 'FPS during hover should be above 30').toBeGreaterThan(30);
		expect(result.p95FrameTime, 'P95 frame time should be under 50ms').toBeLessThan(50);
	});

	test('Hover FPS — forest hidden', async ({ page }) => {
		const collapseButton = page.locator('button[aria-label="Toggle forest"]');
		await collapseButton.click();
		await page.waitForTimeout(500);

		const result = await measureHoverFps(page);

		console.log('=== HOVER FPS (Forest Hidden) ===');
		console.log(`FPS:                ${result.fps}`);
		console.log(`Avg frame time:     ${result.avgFrameTime}ms`);
		console.log(`P95 frame time:     ${result.p95FrameTime}ms`);
		console.log(`Max frame time:     ${result.maxFrameTime}ms`);
		console.log(`Dropped frames:     ${result.droppedFrames} (>33ms)`);

		expect(result.fps, 'FPS during hover (forest hidden) should be above 45').toBeGreaterThan(
			45,
		);
		expect(
			result.p95FrameTime,
			'P95 frame time (forest hidden) should be under 40ms',
		).toBeLessThan(40);
	});

	test('Style recalculation cost — hover enter/leave', async ({ page }) => {
		const result = await measureStyleRecalc(page);

		console.log('=== STYLE RECALC ===');
		console.log(`Recalc time for 10 hover cycles: ${result.recalcTimeMs}ms`);

		expect(
			result.recalcTimeMs,
			'Style recalc for 10 hover cycles should be under 100ms',
		).toBeLessThan(100);
	});

	test('Animation audit — catalog all running animations', async ({ page }) => {
		const audit = await page.evaluate(() => {
			const animations = document.getAnimations();
			const byName = new Map<string, number>();
			const byProperty = new Map<string, number>();

			for (const anim of animations) {
				const name =
					anim instanceof CSSAnimation
						? anim.animationName
						: anim instanceof CSSTransition
							? `transition:${anim.transitionProperty}`
							: 'unknown';

				byName.set(name, (byName.get(name) ?? 0) + 1);

				if (anim.effect instanceof KeyframeEffect) {
					const target = anim.effect.target;
					if (target instanceof Element) {
						const tag = target.tagName.toLowerCase();
						byProperty.set(tag, (byProperty.get(tag) ?? 0) + 1);
					}
				}
			}

			return {
				total: animations.length,
				byName: Object.fromEntries(byName),
				byElementTag: Object.fromEntries(byProperty),
			};
		});

		console.log('=== ANIMATION AUDIT ===');
		console.log(`Total running animations: ${audit.total}`);
		console.log('By name:', JSON.stringify(audit.byName, null, 2));
		console.log('By element tag:', JSON.stringify(audit.byElementTag, null, 2));

		expect(audit.total, 'Total animations should be reasonable').toBeLessThan(100);
	});

	test('Initial load performance', async ({ page }) => {
		const startTime = Date.now();
		await page.goto('/');

		const loadMetrics = await page.evaluate(() => {
			const perf = performance.getEntriesByType(
				'navigation',
			)[0] as PerformanceNavigationTiming;
			const paint = performance.getEntriesByType('paint');
			const fcp = paint.find((e) => e.name === 'first-contentful-paint');

			return {
				domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.startTime),
				loadComplete: Math.round(perf.loadEventEnd - perf.startTime),
				fcp: fcp ? Math.round(fcp.startTime) : null,
				domInteractive: Math.round(perf.domInteractive - perf.startTime),
			};
		});

		const totalTime = Date.now() - startTime;

		console.log('=== LOAD PERFORMANCE ===');
		console.log(`DOM Content Loaded: ${loadMetrics.domContentLoaded}ms`);
		console.log(`Load Complete:      ${loadMetrics.loadComplete}ms`);
		console.log(`FCP:                ${loadMetrics.fcp}ms`);
		console.log(`DOM Interactive:    ${loadMetrics.domInteractive}ms`);
		console.log(`Total (wall clock): ${totalTime}ms`);

		expect(loadMetrics.domContentLoaded, 'DCL should be under 3s').toBeLessThan(3000);
	});
});
