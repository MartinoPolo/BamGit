import { browser, $ } from '@wdio/globals';
import { navigateToWorkspace, findCardByTitle } from '../helpers/issue-card-helpers.js';

describe('Issue Card — Worktree Lifecycle', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	it('pending worktree card has data-card-state="worktreeSetup" and opacity 0.6', async () => {
		const card = await findCardByTitle('Worktree pending');
		expect(await card.getAttribute('data-card-state')).toBe('worktreeSetup');

		const opacity = await browser.execute(
			(el: HTMLElement) => window.getComputedStyle(el).opacity,
			card as unknown as HTMLElement,
		);
		expect(opacity).toBe('0.6');
	});

	it('failed worktree card shows SETUP FAILED chip and retry actions', async () => {
		const card = await findCardByTitle('Worktree failed');

		const chip = await card.$('[role="status"]');
		expect(await chip.getAttribute('aria-label')).toBe('SETUP FAILED');

		const cardText = await card.getText();
		expect(cardText).toContain('Retry Worktree');
		expect(cardText).toContain('Remove Worktree');
	});

	it('active worktree card shows branch name in worktree row', async () => {
		const card = await findCardByTitle('Ready to work');
		const cardText = await card.getText();
		expect(cardText).toContain('4-sapling-ready');
	});
});

describe('Issue Card — PR Lifecycle', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	it('draft PR card shows PR number badge', async () => {
		const card = await findCardByTitle('Draft PR');
		const cardText = await card.getText();
		expect(cardText).toContain('#110');
	});

	it('open PR with behind_base_count > 0 shows BEHIND BASE chip', async () => {
		const card = await findCardByTitle('PR open');
		const chip = await card.$('[role="status"]');
		expect(await chip.getAttribute('aria-label')).toBe('BEHIND BASE');
	});

	it('approved PR shows APPROVED chip and Merge button', async () => {
		const card = await findCardByTitle('Approved');

		const chip = await card.$('[role="status"]');
		expect(await chip.getAttribute('aria-label')).toBe('APPROVED');

		const cardText = await card.getText();
		expect(cardText).toContain('Merge');
	});

	it('ready-to-merge PR shows READY TO MERGE chip', async () => {
		const card = await findCardByTitle('Ready to merge');
		const chip = await card.$('[role="status"]');
		expect(await chip.getAttribute('aria-label')).toBe('READY TO MERGE');
	});

	it('changes-requested PR shows CHANGES REQ chip', async () => {
		const card = await findCardByTitle('Changes requested');
		const chip = await card.$('[role="status"]');
		expect(await chip.getAttribute('aria-label')).toBe('CHANGES REQ');
	});
});

describe('Issue Card — Done State', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	it('done card has data-card-state="done" and DONE chip', async () => {
		const card = await findCardByTitle('PR merged');
		expect(await card.getAttribute('data-card-state')).toBe('done');

		const chip = await card.$('[role="status"]');
		expect(await chip.getAttribute('aria-label')).toBe('DONE');
	});
});

describe('Issue Card — Settings Page Loads', () => {
	it('issue-cards settings page loads and back button is displayed', async () => {
		await browser.url('/settings/issue-cards');
		await browser.waitUntil(
			async () => (await browser.getUrl()).includes('/settings/issue-cards'),
			{ timeout: 15_000, timeoutMsg: 'Expected URL to contain /settings/issue-cards' },
		);

		const backButton = await $('[data-testid="settings-back-button"]');
		await backButton.waitForDisplayed({
			timeout: 15_000,
			timeoutMsg: 'Settings back button not displayed on issue-cards page',
		});
		expect(await backButton.isDisplayed()).toBe(true);
	});

	it('issue-cards settings page survives navigation away and back', async () => {
		await browser.url('/settings/issue-cards');
		await browser.waitUntil(
			async () => (await browser.getUrl()).includes('/settings/issue-cards'),
			{ timeout: 15_000, timeoutMsg: 'Expected URL to contain /settings/issue-cards' },
		);

		await browser.url('/settings/appearance');
		await browser.waitUntil(
			async () => (await browser.getUrl()).includes('/settings/appearance'),
			{ timeout: 15_000, timeoutMsg: 'Expected URL to contain /settings/appearance' },
		);

		await browser.url('/settings/issue-cards');
		await browser.waitUntil(
			async () => (await browser.getUrl()).includes('/settings/issue-cards'),
			{
				timeout: 15_000,
				timeoutMsg: 'Expected URL to contain /settings/issue-cards on return',
			},
		);

		const backButton = await $('[data-testid="settings-back-button"]');
		await backButton.waitForDisplayed({
			timeout: 15_000,
			timeoutMsg: 'Settings back button not displayed after returning to issue-cards page',
		});
		expect(await backButton.isDisplayed()).toBe(true);
	});
});
