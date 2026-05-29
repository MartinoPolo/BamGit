import { browser, $, $$ } from '@wdio/globals';
import { navigateToWorkspace, navigateToIssueCardSettings } from '../helpers/issue-card-helpers.js';

async function selectVariantByLabel(variantLabel: string): Promise<void> {
	const option = await $(`//button[contains(., "${variantLabel}")]`);
	if (await option.isExisting()) {
		await option.click();
		await browser.pause(500);
	}
}

describe('Issue Card — Variants', () => {
	afterEach(async () => {
		await navigateToIssueCardSettings();
		await selectVariantByLabel('Refined Horizon');
	});

	it('default variant uses a linear-gradient background', async () => {
		await navigateToWorkspace();
		const card = await $('[data-testid="issue-card"]');
		const backgroundImage = await browser.execute(
			(el: HTMLElement) => window.getComputedStyle(el).backgroundImage,
			card as unknown as HTMLElement,
		);
		expect(backgroundImage).toContain('linear-gradient');
	});

	it('switching to Veil variant applies a gradient background', async () => {
		await navigateToIssueCardSettings();
		await selectVariantByLabel('Veil');
		await navigateToWorkspace();

		const card = await $('[data-testid="issue-card"]');
		const backgroundImage = await browser.execute(
			(el: HTMLElement) => window.getComputedStyle(el).backgroundImage,
			card as unknown as HTMLElement,
		);
		expect(backgroundImage).toContain('gradient');
	});

	it('switching to Radiant variant applies a radial-gradient background', async () => {
		await navigateToIssueCardSettings();
		await selectVariantByLabel('Radiant');
		await navigateToWorkspace();

		const card = await $('[data-testid="issue-card"]');
		const backgroundImage = await browser.execute(
			(el: HTMLElement) => window.getComputedStyle(el).backgroundImage,
			card as unknown as HTMLElement,
		);
		expect(backgroundImage).toContain('radial-gradient');
	});
});

describe('Issue Card — Design Constraints', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	it('no card has a thick left accent border — borderLeftWidth <= 1.5px (REQ-DC-2)', async () => {
		const cards = await $$('[data-testid="issue-card"]');
		for (const card of cards.slice(0, 5)) {
			const borderLeftWidth = await browser.execute(
				(el: HTMLElement) => parseFloat(window.getComputedStyle(el).borderLeftWidth),
				card as unknown as HTMLElement,
			);
			expect(borderLeftWidth).toBeLessThanOrEqual(1.5);
		}
	});

	it('card background uses a gradient, not a flat color (REQ-DC-2)', async () => {
		const card = await $('[data-testid="issue-card"]');
		const backgroundImage = await browser.execute(
			(el: HTMLElement) => window.getComputedStyle(el).backgroundImage,
			card as unknown as HTMLElement,
		);
		expect(backgroundImage).not.toBe('none');
		expect(backgroundImage).toContain('gradient');
	});

	it('no card width is below 450px minimum', async () => {
		const cards = await $$('[data-testid="issue-card"]');
		for (const card of cards.slice(0, 5)) {
			const width = await browser.execute(
				(el: HTMLElement) => el.getBoundingClientRect().width,
				card as unknown as HTMLElement,
			);
			expect(width).toBeGreaterThanOrEqual(450);
		}
	});

	it('document root has a data-theme attribute', async () => {
		const theme = await browser.execute(() =>
			document.documentElement.getAttribute('data-theme'),
		);
		expect(['dark', 'light']).toContain(theme);
	});
});
