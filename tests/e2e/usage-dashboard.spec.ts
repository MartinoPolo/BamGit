import { test, expect } from '@playwright/test';

test.describe('Usage Dashboard', () => {
	test('period tabs are clickable and dashboard stays functional', async ({ page }) => {
		await page.goto('/usage');
		await page.waitForLoadState('networkidle');

		// Verify dashboard loads with KPI cards
		await expect(page.getByText('Total cost')).toBeVisible();
		await expect(page.getByRole('main').getByText('Sessions', { exact: true })).toBeVisible();

		// Click each period tab
		const periods = ['Today', '7d', '30d', 'Month', 'All'];
		for (const period of periods) {
			await page.getByRole('tab', { name: period }).click();
			// Verify dashboard still shows KPI cards (no crash)
			await expect(page.getByText('Total cost')).toBeVisible();
		}
	});

	test('export CSV triggers file download', async ({ page }) => {
		await page.goto('/usage');
		await page.waitForLoadState('networkidle');

		// Wait for data to load (KPI cards must be visible)
		await expect(page.getByText('Total cost')).toBeVisible();

		// Set up download listener
		const downloadPromise = page.waitForEvent('download');

		// Click Export CSV button
		await page.getByRole('button', { name: /export csv/i }).click();

		// Verify download triggers
		const download = await downloadPromise;
		expect(download.suggestedFilename()).toContain('.csv');
	});
});
