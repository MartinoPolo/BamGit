import { test, expect } from '@playwright/test';

test.describe('Settings entry points', () => {
	test('sidebar gear icon navigates to /settings/general', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const sidebar = page.locator('aside');
		const gearButton = sidebar.getByRole('button', { name: 'Settings', exact: true });
		await expect(gearButton).toBeVisible();
		await gearButton.click();

		await expect(page).toHaveURL(/\/settings\/general/);
	});

	test('overview page gear icon navigates to /settings/general', async ({ page }) => {
		await page.goto('/overview');
		await page.waitForLoadState('networkidle');

		const gearButton = page.getByRole('button', { name: 'Settings', exact: true });
		await expect(gearButton).toBeVisible();
		await gearButton.click();

		await expect(page).toHaveURL(/\/settings\/general/);
	});

	test('overview page has compact theme toggle', async ({ page }) => {
		await page.goto('/overview');
		await page.waitForLoadState('networkidle');

		const themeButton = page.getByRole('button', { name: /mode/i });
		await expect(themeButton).toBeVisible();

		// Verify it cycles on click (compact mode behavior)
		const initialLabel = await themeButton.getAttribute('aria-label');
		await themeButton.click();
		await expect(themeButton).not.toHaveAttribute('aria-label', initialLabel!);
	});

	test('sidebar gear stores returnUrl — Escape returns to pre-settings page', async ({
		page,
	}) => {
		// Use /usage (not / or /sessions) to distinguish from the default returnUrl of '/'
		await page.goto('/usage');
		await page.waitForLoadState('networkidle');

		const sidebar = page.locator('aside');
		const gearButton = sidebar.getByRole('button', { name: 'Settings', exact: true });
		await gearButton.click();
		await expect(page).toHaveURL(/\/settings\/general/);

		await page.keyboard.press('Escape');
		await expect(page).toHaveURL('/usage');
	});

	test('Ctrl+, stores returnUrl — Escape returns to pre-settings page', async ({ page }) => {
		// Use /usage to distinguish from the default returnUrl of '/'
		await page.goto('/usage');
		await page.waitForLoadState('networkidle');

		await page.keyboard.press('Control+,');
		await expect(page).toHaveURL(/\/settings\/general/);

		await page.keyboard.press('Escape');
		await expect(page).toHaveURL('/usage');
	});
});

test.describe('Settings back navigation through categories', () => {
	test('switching categories + browser Back returns to pre-settings page', async ({ page }) => {
		await page.goto('/usage');
		await page.waitForLoadState('networkidle');

		// Enter settings via Ctrl+,
		await page.keyboard.press('Control+,');
		await expect(page).toHaveURL(/\/settings\/general/);

		// Switch between 3 categories (all visible in user scope) — replaceState means no history entries
		await page.getByRole('link', { name: 'Appearance', exact: true }).click();
		await expect(page).toHaveURL(/\/settings\/appearance/);

		await page.getByRole('link', { name: 'Issue Cards', exact: true }).click();
		await expect(page).toHaveURL(/\/settings\/issue-cards/);

		await page.getByRole('link', { name: 'AI Configuration', exact: true }).click();
		await expect(page).toHaveURL(/\/settings\/ai-config/);

		// Browser back should return to /usage (pre-settings page), not to a previous category
		await page.goBack();
		await expect(page).toHaveURL('/usage');
	});
});

test.describe('Sidebar nav items', () => {
	test('sidebar shows Dashboard, Sessions, and Usage nav items', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const nav = page.locator('aside nav');
		await expect(nav.getByRole('link', { name: /dashboard/i })).toBeVisible();
		await expect(nav.getByRole('link', { name: /sessions/i })).toBeVisible();
		await expect(nav.getByRole('link', { name: /usage/i })).toBeVisible();
	});

	test('no AI Config or Workspace Settings nav items in sidebar', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const nav = page.locator('aside nav');
		await expect(nav.getByRole('link', { name: /ai config/i })).toHaveCount(0);
		await expect(nav.getByRole('link', { name: /workspace settings/i })).toHaveCount(0);
	});
});

test.describe('Sidebar theme toggle in account section', () => {
	test('expanded sidebar has compact theme toggle in account section', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const sidebar = page.locator('aside');
		const themeButton = sidebar.getByRole('button', { name: /mode/i });
		await expect(themeButton).toBeVisible();

		// Verify it cycles on click
		const initialLabel = await themeButton.getAttribute('aria-label');
		await themeButton.click();
		await expect(themeButton).not.toHaveAttribute('aria-label', initialLabel!);
	});
});
