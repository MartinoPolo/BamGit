import { test, expect } from '@playwright/test';

test.describe('Issue creation wizard', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		// Wait for issue cards to ensure page is fully loaded + contexts initialized
		await page.locator('.card-ic-interactive').first().waitFor({ timeout: 8000 });
	});

	test('wizard opens via Create Issue button', async ({ page }) => {
		await page.getByRole('button', { name: /create issue/i }).click();
		await expect(page.getByRole('dialog')).toBeVisible();
	});

	test('wizard dialog shows step title', async ({ page }) => {
		await page.getByRole('button', { name: /create issue/i }).click();
		const dialog = page.getByRole('dialog');
		await expect(dialog).toBeVisible();
		// Step 1 title is "Search GitHub Issues"
		await expect(dialog.getByText('Search GitHub Issues')).toBeVisible();
	});

	test('Enter in step 1 advances to step 2 (issue name)', async ({ page }) => {
		await page.getByRole('button', { name: /create issue/i }).click();
		await expect(page.getByRole('dialog')).toBeVisible();

		await page.keyboard.press('Enter');

		// Step 2 has the issue name input with id="wizard-issue-name"
		const nameInput = page.locator('#wizard-issue-name');
		await expect(nameInput).toBeVisible({ timeout: 3000 });
	});

	test('Escape on step 1 closes wizard', async ({ page }) => {
		await page.getByRole('button', { name: /create issue/i }).click();
		await expect(page.getByRole('dialog')).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).not.toBeVisible();
		await expect(page).toHaveURL('/');
	});

	test('Escape in step 2 with text input focused goes back to step 1', async ({ page }) => {
		await page.getByRole('button', { name: /create issue/i }).click();
		await expect(page.getByRole('dialog')).toBeVisible();

		// Press Enter to skip GitHub search (step 1) and advance to step 2
		await page.keyboard.press('Enter');

		// Wait for step 2's issue name input to appear
		const nameInput = page.locator('#wizard-issue-name');
		await expect(nameInput).toBeVisible({ timeout: 5000 });

		// Focus the input, then press Escape
		await nameInput.click();
		await page.keyboard.press('Escape');

		// Wizard should still be open (went back to step 1)
		await expect(page.getByRole('dialog')).toBeVisible();
		// Issue name input should be gone (we're back on step 1)
		await expect(nameInput).not.toBeVisible();
	});

	test('Backspace on non-first step (non-editable focused) goes back', async ({ page }) => {
		await page.getByRole('button', { name: /create issue/i }).click();
		await page.keyboard.press('Enter');

		const nameInput = page.locator('#wizard-issue-name');
		await expect(nameInput).toBeVisible({ timeout: 3000 });

		// Blur the input so Backspace isn't consumed as text editing
		await nameInput.evaluate((el) => el.blur());
		await page.keyboard.press('Backspace');

		// Should be back on step 1 — wizard still open, name input gone
		await expect(page.getByRole('dialog')).toBeVisible();
		await expect(nameInput).not.toBeVisible();
	});

	test('wizard closes without side effects on page', async ({ page }) => {
		await page.getByRole('button', { name: /create issue/i }).click();
		await expect(page.getByRole('dialog')).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).not.toBeVisible();

		await expect(page).toHaveURL('/');
		await expect(page.locator('aside')).toBeVisible();
	});
});
