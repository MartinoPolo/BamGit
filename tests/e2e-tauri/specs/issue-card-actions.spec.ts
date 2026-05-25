import { browser, $ } from '@wdio/globals';
import {
	navigateToWorkspace,
	findCardByTitle,
	getActionButtonLabels,
} from '../helpers/issue-card-helpers.js';

describe('Issue Card — Contextual Actions', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	it('no-worktree card shows Run + Setup Worktree (level #13)', async () => {
		const card = await findCardByTitle('Just an idea');
		const buttons = await getActionButtonLabels(card);
		expect(buttons).toContain('Run');
		expect(buttons).toContain('Setup Worktree');
	});

	it('approved PR card shows Merge + Review (level #9)', async () => {
		const card = await findCardByTitle('Approved');
		const buttons = await getActionButtonLabels(card);
		expect(buttons).toContain('Merge');
		expect(buttons).toContain('Review');
	});

	it('ready-to-merge card shows Merge + Review (level #9)', async () => {
		const card = await findCardByTitle('Ready to merge');
		const buttons = await getActionButtonLabels(card);
		expect(buttons).toContain('Merge');
		expect(buttons).toContain('Review');
	});

	it('failed worktree card shows Retry Worktree + Remove Worktree (level #2)', async () => {
		const card = await findCardByTitle('Worktree failed');
		const buttons = await getActionButtonLabels(card);
		expect(buttons).toContain('Retry Worktree');
		expect(buttons).toContain('Remove Worktree');
	});

	it('running session card shows View Session as primary action (level #1)', async () => {
		const card = await findCardByTitle('Session running');
		const buttons = await getActionButtonLabels(card);
		expect(buttons[0]).toBe('View Session');
	});
});

describe('Issue Card — Selection and Activation', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	it('clicking card body sets data-card-state to selected', async () => {
		const card = await $('[data-testid="issue-card"]');
		await card.click();
		const state = await card.getAttribute('data-card-state');
		expect(state).toBe('selected');
	});

	it('clicking card title activates card and appends issue= to URL', async () => {
		await navigateToWorkspace();

		const card = await $('[data-testid="issue-card"]');
		const title = await card.$('[data-testid="issue-card-title"]');
		await title.click();

		await browser.waitUntil(async () => (await browser.getUrl()).includes('issue='), {
			timeout: 10_000,
			timeoutMsg: 'URL did not update with issue= param after title click',
		});

		const state = await card.getAttribute('data-card-state');
		expect(state).toBe('active');
	});

	it('Escape key clears batch selection', async () => {
		await navigateToWorkspace();

		const card = await $('[data-testid="issue-card"]');
		await card.click();
		expect(await card.getAttribute('data-card-state')).toBe('selected');

		await browser.keys('Escape');

		await browser.waitUntil(
			async () => (await card.getAttribute('data-card-state')) !== 'selected',
			{ timeout: 5_000, timeoutMsg: 'Card state did not leave selected after Escape' },
		);
	});

	it('right-click opens context menu with Select, Archive, and Delete items', async () => {
		await navigateToWorkspace();

		const card = await $('[data-testid="issue-card"]');
		await card.click({ button: 'right' });

		const menu = await $('[role="menu"]');
		await menu.waitForDisplayed({
			timeout: 5_000,
			timeoutMsg: 'Context menu did not open on right-click',
		});

		const menuText = await menu.getText();
		expect(menuText).toContain('Select');
		expect(menuText).toContain('Archive');
		expect(menuText).toContain('Delete');

		await browser.keys('Escape');
	});

	it('hovering card applies a negative translateY transform', async () => {
		await navigateToWorkspace();

		const card = await $('[data-testid="issue-card"]');
		await card.moveTo();
		await browser.pause(150);

		const transform = await browser.execute(
			(el: HTMLElement) => window.getComputedStyle(el).transform,
			card as unknown as HTMLElement,
		);

		expect(transform).toContain('-3');
	});
});
