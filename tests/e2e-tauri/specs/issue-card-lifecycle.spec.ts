import { browser, $ } from '@wdio/globals';
import { navigateToWorkspace, findCardByTitle } from '../helpers/issue-card-helpers.js';

describe('Issue Card — Worktree Lifecycle', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	it('pending worktree card has data-card-state="worktreeSetup" and transparent border', async () => {
		const card = await findCardByTitle('Worktree pending');
		expect(await card.getAttribute('data-card-state')).toBe('worktreeSetup');

		const borderColor = await browser.execute(
			(el: HTMLElement) => window.getComputedStyle(el).borderColor,
			card as unknown as HTMLElement,
		);
		expect(borderColor).toContain('0, 0, 0, 0');
	});

	it('failed worktree card shows SETUP FAILED chip and retry actions', async () => {
		const card = await findCardByTitle('Worktree failed');

		const chip = await card.$('[role="status"]');
		const setupFailedLabel: string | null = await browser.execute(
			(el: HTMLElement) => el.getAttribute('aria-label'),
			chip as unknown as HTMLElement,
		);
		expect(setupFailedLabel).toBe('SETUP FAILED');

		const cardText: string = await browser.execute(
			(el: HTMLElement) => el.textContent ?? '',
			card as unknown as HTMLElement,
		);
		expect(cardText).toContain('Retry Worktree');
		expect(cardText).toContain('Remove Worktree');
	});

	it('active worktree card shows branch name in worktree row', async () => {
		const card = await findCardByTitle('Ready to work');
		const cardText: string = await browser.execute(
			(el: HTMLElement) => el.textContent ?? '',
			card as unknown as HTMLElement,
		);
		expect(cardText).toContain('4-sapling-ready');
	});
});

describe('Issue Card — PR Lifecycle', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	it('draft PR card shows PR number badge', async () => {
		const card = await findCardByTitle('Draft PR');
		const cardText: string = await browser.execute(
			(el: HTMLElement) => el.textContent ?? '',
			card as unknown as HTMLElement,
		);
		expect(cardText).toContain('#110');
	});

	it('open PR with behind_base_count > 0 shows BEHIND BASE chip', async () => {
		const card = await findCardByTitle('PR open');
		const chip = await card.$('[role="status"]');
		const behindBaseLabel: string | null = await browser.execute(
			(el: HTMLElement) => el.getAttribute('aria-label'),
			chip as unknown as HTMLElement,
		);
		expect(behindBaseLabel).toBe('BEHIND BASE');
	});

	it('approved PR shows APPROVED chip and Merge button', async () => {
		const card = await findCardByTitle('Approved');

		const chip = await card.$('[role="status"]');
		const approvedLabel: string | null = await browser.execute(
			(el: HTMLElement) => el.getAttribute('aria-label'),
			chip as unknown as HTMLElement,
		);
		expect(approvedLabel).toBe('APPROVED');

		const cardText: string = await browser.execute(
			(el: HTMLElement) => el.textContent ?? '',
			card as unknown as HTMLElement,
		);
		expect(cardText).toContain('Merge');
	});

	it('ready-to-merge PR shows READY TO MERGE chip', async () => {
		const card = await findCardByTitle('Ready to merge');
		const chip = await card.$('[role="status"]');
		const readyToMergeLabel: string | null = await browser.execute(
			(el: HTMLElement) => el.getAttribute('aria-label'),
			chip as unknown as HTMLElement,
		);
		expect(readyToMergeLabel).toBe('READY TO MERGE');
	});

	it('changes-requested PR shows CHANGES REQ chip', async () => {
		const card = await findCardByTitle('Changes requested');
		const chip = await card.$('[role="status"]');
		const changesReqLabel: string | null = await browser.execute(
			(el: HTMLElement) => el.getAttribute('aria-label'),
			chip as unknown as HTMLElement,
		);
		expect(changesReqLabel).toBe('CHANGES REQ');
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
		const doneLabel: string | null = await browser.execute(
			(el: HTMLElement) => el.getAttribute('aria-label'),
			chip as unknown as HTMLElement,
		);
		expect(doneLabel).toBe('DONE');
	});
});

describe('Issue Card — Worktree Row Details', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	it('card without worktree shows "no worktree" text', async () => {
		const card = await findCardByTitle('Just an idea');
		const cardText: string = await browser.execute(
			(el: HTMLElement) => el.textContent ?? '',
			card as unknown as HTMLElement,
		);
		expect(cardText.toLowerCase()).toContain('no worktree');
	});

	it('card with worktree shows branch name', async () => {
		const card = await findCardByTitle('Ready to work');
		const cardText: string = await browser.execute(
			(el: HTMLElement) => el.textContent ?? '',
			card as unknown as HTMLElement,
		);
		expect(cardText).toContain('4-sapling-ready');
	});
});

describe('Issue Card — GitHub Labels', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	it('card with labels renders label pills', async () => {
		const card = await findCardByTitle('Needs input');
		const labels: number = await browser.execute(
			(el: HTMLElement) => el.querySelectorAll('.rounded-full').length,
			card as unknown as HTMLElement,
		);
		expect(labels).toBeGreaterThanOrEqual(1);
	});
});

describe('Issue Card — Issue Number Display', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	it('card header shows issue number with # prefix', async () => {
		const card = await findCardByTitle('Ready to work');
		const headerText: string = await browser.execute(
			(el: HTMLElement) => {
				const header = el.querySelector('[class*="font-mono"]');
				return header?.textContent ?? '';
			},
			card as unknown as HTMLElement,
		);
		expect(headerText).toContain('#');
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
