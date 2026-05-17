import { test, expect } from '@playwright/test';

test.describe('Smoke — all routes load', () => {
	const routes = [
		'/',
		'/sessions',
		'/settings',
		'/workspace-settings',
		'/usage',
		'/settings/ai-config',
	];

	for (const route of routes) {
		test(`${route} loads without errors`, async ({ page }) => {
			const errors: string[] = [];
			page.on('pageerror', (err) => errors.push(err.message));
			page.on('console', (msg) => {
				if (msg.type() === 'error') {
					const text = msg.text();
					// Ignore 404s for static assets — mock data references files that
					// don't exist in the static build (e.g. character pack avatars)
					if (text.includes('404') || text.includes('Failed to load resource')) {
						return;
					}
					errors.push(text);
				}
			});

			await page.goto(route);
			await page.waitForLoadState('networkidle');
			expect(errors).toHaveLength(0);
		});
	}
});

test.describe('Sidebar navigation', () => {
	test('clicking Sessions nav item navigates to /sessions', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: /sessions/i }).click();
		await expect(page).toHaveURL('/sessions');
	});

	test('clicking Usage nav item navigates to /usage', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: /usage/i }).click();
		await expect(page).toHaveURL('/usage');
	});

	test('active nav item has aria-current=page', async ({ page }) => {
		await page.goto('/sessions');
		const sessionsLink = page.getByRole('link', { name: /sessions/i });
		await expect(sessionsLink).toHaveAttribute('aria-current', 'page');
	});

	test('non-active nav item does NOT have aria-current', async ({ page }) => {
		await page.goto('/');
		const sessionsLink = page.getByRole('link', { name: /sessions/i });
		await expect(sessionsLink).not.toHaveAttribute('aria-current', 'page');
	});

	test('Dashboard nav item is active on root', async ({ page }) => {
		await page.goto('/');
		const dashboardLink = page.getByRole('link', { name: /dashboard/i });
		await expect(dashboardLink).toHaveAttribute('aria-current', 'page');
	});
});

test.describe('Route fallback', () => {
	test('unknown route does not crash', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (err) => errors.push(err.message));

		await page.goto('/this-does-not-exist');
		await page.waitForLoadState('networkidle');
		expect(errors).toHaveLength(0);
	});
});
