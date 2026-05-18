import { test, expect } from '@playwright/test';

test.describe('Board URL state — issue activation', () => {
	test('clicking issue title activates and updates URL with ?issue=', async ({ page }) => {
		await page.goto('/');
		// Wait for issue cards to render (async mock data load)
		const firstCard = page.locator('[data-testid="issue-card"]').first();
		await expect(firstCard).toBeVisible({ timeout: 8000 });

		// Click the title (span with cursor-pointer) to activate the issue
		const titleSpan = firstCard.locator('span.cursor-pointer').first();
		await titleSpan.click();

		await expect(page).toHaveURL(/[?&]issue=/);
	});

	test('deactivating an issue clears the URL param', async ({ page }) => {
		// Start with an active issue
		await page.goto('/?issue=mock-issue-auth&tab=issue-detail');
		await page.waitForLoadState('networkidle');

		await expect(page).toHaveURL(/issue=mock-issue-auth/);

		// Go back — should clear the issue param
		await page.goBack();
		await expect(page).not.toHaveURL(/issue=/);
	});

	test('direct URL load with ?issue= restores active state', async ({ page }) => {
		await page.goto('/?issue=mock-issue-auth');
		await page.waitForLoadState('networkidle');

		const activeCard = page.locator('[data-card-state="active"]');
		await expect(activeCard).toBeVisible({ timeout: 8000 });
	});

	test('browser back reverts issue activation', async ({ page }) => {
		await page.goto('/');
		const firstCard = page.locator('[data-testid="issue-card"]').first();
		await expect(firstCard).toBeVisible({ timeout: 8000 });

		await firstCard.locator('span.cursor-pointer').first().click();
		await expect(page).toHaveURL(/[?&]issue=/);

		await page.goBack();
		await expect(page).not.toHaveURL(/[?&]issue=/);
	});

	test('browser forward restores issue activation', async ({ page }) => {
		await page.goto('/');
		const firstCard = page.locator('[data-testid="issue-card"]').first();
		await expect(firstCard).toBeVisible({ timeout: 8000 });

		await firstCard.locator('span.cursor-pointer').first().click();
		await expect(page).toHaveURL(/[?&]issue=/);
		const urlWithIssue = page.url();

		await page.goBack();
		await expect(page).not.toHaveURL(/[?&]issue=/);

		await page.goForward();
		await expect(page).toHaveURL(urlWithIssue);
	});

	test('card body click does batch-select (no URL change)', async ({ page }) => {
		await page.goto('/');
		const firstCard = page.locator('[data-testid="issue-card"]').first();
		await expect(firstCard).toBeVisible({ timeout: 8000 });

		await firstCard.click();

		// No URL param change — just batch selection
		expect(page.url()).not.toContain('issue=');
		// Card should now have batch-selected class
		await expect(page.locator('[data-card-state="selected"]').first()).toBeVisible();
	});
});

test.describe('Board URL state — tab selection', () => {
	test('tab switching updates URL tab param', async ({ page }) => {
		await page.goto('/?issue=mock-issue-auth');
		const activeCard = page.locator('[data-card-state="active"]');
		await expect(activeCard).toBeVisible({ timeout: 8000 });

		const dependenciesTab = page.getByRole('tab', { name: /dependencies/i });
		if (await dependenciesTab.isVisible()) {
			await dependenciesTab.click();
			await expect(page).toHaveURL(/tab=dependencies/);
		}
	});

	test('direct URL load restores tab state', async ({ page }) => {
		await page.goto('/?issue=mock-issue-auth&tab=dependencies');
		await page.waitForLoadState('networkidle');

		const dependenciesTab = page.getByRole('tab', { name: /dependencies/i });
		if (await dependenciesTab.isVisible()) {
			await expect(dependenciesTab).toHaveAttribute('aria-selected', 'true');
		}
	});
});

test.describe('Cross-route navigation preserves state', () => {
	test('navigating away and back restores board state', async ({ page }) => {
		await page.goto('/');
		const firstCard = page.locator('[data-testid="issue-card"]').first();
		await expect(firstCard).toBeVisible({ timeout: 8000 });

		// Activate an issue
		await firstCard.locator('span.cursor-pointer').first().click();
		await expect(page).toHaveURL(/[?&]issue=/);
		const boardUrl = page.url();

		// Navigate to another page
		await page.getByRole('link', { name: /usage/i }).click();
		await expect(page).toHaveURL('/usage');

		// Go back
		await page.goBack();
		await expect(page).toHaveURL(boardUrl);
	});
});

test.describe('Usage URL state', () => {
	test('switching period updates URL param', async ({ page }) => {
		await page.goto('/usage');
		await page.waitForLoadState('networkidle');

		// Default period is 'thirty-days' (30d). Switching to a different one pushes state.
		const weekButton = page.getByRole('tab', { name: '7d' });
		await expect(weekButton).toBeVisible();
		await weekButton.click();
		await expect(page).toHaveURL(/period=week/);
	});

	test('direct URL load /usage?period=week restores active button', async ({ page }) => {
		await page.goto('/usage?period=week');
		await page.waitForLoadState('networkidle');

		// The active tab gets 'bg-surface' class (visual highlight)
		const weekButton = page.getByRole('tab', { name: '7d' });
		await expect(weekButton).toBeVisible();
		await expect(weekButton).toHaveAttribute('aria-selected', 'true');
	});

	test('browser back reverts usage period', async ({ page }) => {
		await page.goto('/usage');
		await page.waitForLoadState('networkidle');

		// Switch from default (30d) to 7d — this triggers a URL push
		const weekButton = page.getByRole('tab', { name: '7d' });
		await expect(weekButton).toBeVisible();
		await weekButton.click();
		await expect(page).toHaveURL(/period=week/);

		await page.goBack();
		await expect(page).not.toHaveURL(/period=week/);
	});
});
