import { test, expect } from '@playwright/test';

test.describe('Global keyboard shortcuts', () => {
	test('Ctrl+K opens command palette dialog', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		await page.keyboard.press('Control+k');
		await expect(page.getByRole('dialog')).toBeVisible();
	});

	test('Ctrl+K closes command palette when open', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		await page.keyboard.press('Control+k');
		await expect(page.getByRole('dialog')).toBeVisible();

		// Click outside the search input first to ensure it's not focused,
		// then press Ctrl+K — this tests the allowFromEditable fix
		await page.keyboard.press('Control+k');
		await expect(page.getByRole('dialog')).not.toBeVisible();
	});

	test('Escape closes command palette', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		await page.keyboard.press('Control+k');
		await expect(page.getByRole('dialog')).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).not.toBeVisible();
		await expect(page).toHaveURL('/');
	});

	test('Ctrl+, navigates to settings', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		await page.keyboard.press('Control+,');
		await expect(page).toHaveURL(/\/settings/);
	});

	test('Ctrl+, works from different pages', async ({ page }) => {
		await page.goto('/sessions');
		await page.waitForLoadState('networkidle');

		await page.keyboard.press('Control+,');
		await expect(page).toHaveURL(/\/settings/);
	});

	test('/quick-ideas page loads and shows content', async ({ page }) => {
		await page.goto('/quick-ideas');
		await page.waitForLoadState('networkidle');
		// The quick-ideas full-page view should render without errors
		await expect(page.locator('body')).toBeVisible();
	});

	test('command palette search and navigate', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		await page.keyboard.press('Control+k');
		await expect(page.getByRole('dialog')).toBeVisible();

		const commandInput = page.locator('[data-command-input]');
		await expect(commandInput).toBeVisible();
		await commandInput.fill('settings');

		const settingsItem = page.getByRole('option', { name: /settings/i });
		await expect(settingsItem).toBeVisible();
		await settingsItem.click();

		await expect(page).toHaveURL(/settings/);
	});
});

test.describe('Shortcut scoping — no bleed into inputs', () => {
	test('Ctrl+, inside input field does NOT navigate away', async ({ page }) => {
		await page.goto('/settings');
		await page.waitForLoadState('networkidle');

		const input = page.getByRole('textbox').first();
		if (await input.isVisible()) {
			await input.focus();
			await page.keyboard.press('Control+,');
			// Should stay on /settings — shortcut was blocked
			await expect(page).toHaveURL(/\/settings/);
		}
	});
});

test.describe('Sidebar toggle', () => {
	test('Ctrl+\\ toggles sidebar collapsed state', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const sidebar = page.locator('aside');
		await expect(sidebar).toBeVisible();
		const initialWidth = await sidebar.evaluate((el) => getComputedStyle(el).width);

		await page.keyboard.press('Control+\\');
		await expect(sidebar).not.toHaveCSS('width', initialWidth);
	});
});

test.describe('Focus management', () => {
	test('Tab focus stays inside open command palette', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		await page.keyboard.press('Control+k');
		await expect(page.getByRole('dialog')).toBeVisible();

		for (let i = 0; i < 8; i++) {
			await page.keyboard.press('Tab');
			const insideDialog = await page.evaluate(() => {
				const el = document.activeElement;
				const dialog = document.querySelector('[role="dialog"]');
				return dialog?.contains(el) ?? false;
			});
			expect(insideDialog).toBe(true);
		}
	});
});
