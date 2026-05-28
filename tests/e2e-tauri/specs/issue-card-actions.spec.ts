import { browser, $ } from '@wdio/globals';
import {
	navigateToWorkspace,
	findCardByTitle,
	getActionButtonLabels,
	getPrimaryActionLabel,
	getSecondaryActionLabel,
	getQuickActionButtons,
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

	beforeEach(async () => {
		await browser.execute(() => {
			const card = document.querySelector('[data-testid="issue-card"]');
			if (card) {
				card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
			}
		});
		await browser.pause(300);
	});

	it('clicking card body sets data-card-state to selected', async () => {
		const card = await findCardByTitle('Ready to work');
		await browser.execute(
			(el: HTMLElement) => {
				el.scrollIntoView({ block: 'center' });
				el.click();
			},
			card as unknown as HTMLElement,
		);

		await browser.waitUntil(
			async () => (await card.getAttribute('data-card-state')) === 'selected',
			{ timeout: 5_000, timeoutMsg: 'Card state did not become selected after click' },
		);
	});

	it('clicking card title activates card and appends issue= to URL', async () => {
		await navigateToWorkspace();

		const card = await findCardByTitle('Ready to work');
		await browser.execute(
			(el: HTMLElement) => {
				el.scrollIntoView({ block: 'center' });
				const title = el.querySelector('[data-testid="issue-card-title"]');
				if (title) {
					(title as HTMLElement).click();
				}
			},
			card as unknown as HTMLElement,
		);

		await browser.waitUntil(async () => (await browser.getUrl()).includes('issue='), {
			timeout: 10_000,
			timeoutMsg: 'URL did not update with issue= param after title click',
		});
	});

	it('Escape key clears batch selection', async () => {
		await browser.url('/');
		await browser.pause(2000);
		await navigateToWorkspace();

		const card = await findCardByTitle('Ready to work');
		await browser.execute(
			(el: HTMLElement) => {
				el.scrollIntoView({ block: 'center' });
				el.click();
			},
			card as unknown as HTMLElement,
		);

		await browser.waitUntil(
			async () => (await card.getAttribute('data-card-state')) === 'selected',
			{ timeout: 5_000, timeoutMsg: 'Card state did not become selected' },
		);

		await browser.execute(
			(el: HTMLElement) => {
				el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
			},
			card as unknown as HTMLElement,
		);

		await browser.waitUntil(
			async () => (await card.getAttribute('data-card-state')) !== 'selected',
			{ timeout: 5_000, timeoutMsg: 'Card state did not leave selected after Escape' },
		);
	});

	it('right-click opens context menu with Select, Archive, and Delete items', async () => {
		await navigateToWorkspace();

		const card = await findCardByTitle('Ready to work');
		await browser.execute(
			(el: HTMLElement) => {
				el.scrollIntoView({ block: 'center' });
				el.dispatchEvent(
					new MouseEvent('contextmenu', { bubbles: true, cancelable: true }),
				);
			},
			card as unknown as HTMLElement,
		);

		const menu = await $('[role="menu"]');
		await menu.waitForDisplayed({
			timeout: 5_000,
			timeoutMsg: 'Context menu did not open on right-click',
		});

		const menuText: string = await browser.execute(
			(el: HTMLElement) => el.textContent ?? '',
			menu as unknown as HTMLElement,
		);
		expect(menuText).toContain('Select');
		expect(menuText).toContain('Archive');
		expect(menuText).toContain('Delete');

		await browser.execute(
			'window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))',
		);
	});

	it('hovering card applies a negative translateY transform', async () => {
		await navigateToWorkspace();

		const card = await findCardByTitle('Ready to work');
		await browser.execute(
			(el: HTMLElement) => {
				el.scrollIntoView({ block: 'center' });
				el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
			},
			card as unknown as HTMLElement,
		);
		await browser.pause(500);

		const transform = await browser.execute(
			(el: HTMLElement) => window.getComputedStyle(el).transform,
			card as unknown as HTMLElement,
		);
		expect(transform).toContain('-');
	});

	it('clicking active card again does NOT toggle off active state', async () => {
		await browser.url('/');
		await browser.pause(2000);
		await navigateToWorkspace();

		const card = await findCardByTitle('Draft PR');
		await browser.execute(
			(el: HTMLElement) => {
				el.scrollIntoView({ block: 'center' });
				const title = el.querySelector('[data-testid="issue-card-title"]');
				if (title) {
					(title as HTMLElement).click();
				}
			},
			card as unknown as HTMLElement,
		);

		await browser.waitUntil(async () => (await browser.getUrl()).includes('issue='), {
			timeout: 10_000,
			timeoutMsg: 'URL did not update with issue= after title click',
		});

		const urlAfterActivate = await browser.getUrl();
		const issueParam = new URL(urlAfterActivate).searchParams.get('issue');
		expect(issueParam).toBeTruthy();

		// Grid unmounts when detail panel opens — click "Issues" tab to return
		// to the grid while keeping activeIssueId set
		await browser.execute(() => {
			const tabs = document.querySelectorAll('[role="tab"]');
			for (const tab of tabs) {
				if (tab.textContent?.trim() === 'Issues') {
					(tab as HTMLElement).click();
					return;
				}
			}
		});

		await browser.waitUntil(
			async () => {
				const count: number = await browser.execute(
					'return document.querySelectorAll(\'[data-testid="issue-card"]\').length',
				);
				return count > 0;
			},
			{ timeout: 10_000, timeoutMsg: 'Card grid did not reappear after tab switch' },
		);

		// Re-query card (old ref is stale after grid unmount/remount)
		const activeCard = await findCardByTitle('Draft PR');

		// Body click triggers selectExclusive which adds batch selection
		// (deriveCardState shows "selected" over "active"), but activeIssueId
		// remains set — activation is NOT toggled off
		await browser.execute(
			(el: HTMLElement) => el.click(),
			activeCard as unknown as HTMLElement,
		);
		await browser.pause(300);

		const urlAfterBodyClick = await browser.getUrl();
		const issueParamAfter = new URL(urlAfterBodyClick).searchParams.get('issue');
		expect(issueParamAfter).toBe(issueParam);
	});
});

describe('Issue Card — Batch Selection (Ctrl+Click)', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	afterEach(async () => {
		await browser.execute(() => {
			const card = document.querySelector('[data-testid="issue-card"]');
			if (card) {
				card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
			}
		});
		await browser.pause(200);
	});

	it('Ctrl+Click selects multiple cards simultaneously', async () => {
		const card1 = await findCardByTitle('Ready to work');
		const card2 = await findCardByTitle('Session running');

		await browser.execute(
			(el: HTMLElement) => {
				el.scrollIntoView({ block: 'center' });
				el.dispatchEvent(
					new MouseEvent('click', {
						bubbles: true,
						cancelable: true,
						composed: true,
						ctrlKey: true,
						view: window,
					}),
				);
			},
			card1 as unknown as HTMLElement,
		);
		await browser.pause(300);
		expect(await card1.getAttribute('data-card-state')).toBe('selected');

		await browser.execute(
			(el: HTMLElement) => {
				el.scrollIntoView({ block: 'center' });
				el.dispatchEvent(
					new MouseEvent('click', {
						bubbles: true,
						cancelable: true,
						composed: true,
						ctrlKey: true,
						view: window,
					}),
				);
			},
			card2 as unknown as HTMLElement,
		);
		await browser.pause(300);
		expect(await card2.getAttribute('data-card-state')).toBe('selected');
		expect(await card1.getAttribute('data-card-state')).toBe('selected');
	});

	it('Escape clears all selected cards', async () => {
		const card = await findCardByTitle('Ready to work');
		await browser.execute(
			(el: HTMLElement) => {
				el.scrollIntoView({ block: 'center' });
				el.click();
			},
			card as unknown as HTMLElement,
		);

		await browser.waitUntil(
			async () => (await card.getAttribute('data-card-state')) === 'selected',
			{ timeout: 5_000, timeoutMsg: 'Card state did not become selected' },
		);

		await browser.execute(
			(el: HTMLElement) => {
				el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
			},
			card as unknown as HTMLElement,
		);

		await browser.waitUntil(
			async () => (await card.getAttribute('data-card-state')) !== 'selected',
			{ timeout: 5_000, timeoutMsg: 'Card state did not leave selected after Escape' },
		);
	});
});

describe('Issue Card — Quick-Action Buttons', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	it('card with worktree shows 3 quick-action buttons', async () => {
		const card = await findCardByTitle('Ready to work');
		const buttons = await getQuickActionButtons(card);
		expect(buttons.length).toBe(3);
	});

	it('card without worktree shows quick-action buttons with reduced opacity', async () => {
		const card = await findCardByTitle('Just an idea');
		const buttons = await getQuickActionButtons(card);
		expect(buttons.length).toBe(3);

		const folderClassName: string = await browser.execute(
			(el: HTMLElement) => el.className,
			buttons[0] as unknown as HTMLElement,
		);
		expect(folderClassName).toContain('opacity');
	});
});

describe('Issue Card — Action Button Priority', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	it('running session shows View Session as primary', async () => {
		const card = await findCardByTitle('Session running');
		const primary = await getPrimaryActionLabel(card);
		expect(primary).toContain('View Session');
	});

	it('needs-input session shows View Session as primary (wins over HITL label)', async () => {
		const card = await findCardByTitle('Needs input');
		const primary = await getPrimaryActionLabel(card);
		expect(primary).toContain('View Session');
	});

	it('merge conflict shows Sync Base as primary', async () => {
		const card = await findCardByTitle('Merge conflict');
		const primary = await getPrimaryActionLabel(card);
		expect(primary).toContain('Sync Base');
	});

	it('approved PR shows Merge as primary', async () => {
		const card = await findCardByTitle('Approved');
		const primary = await getPrimaryActionLabel(card);
		expect(primary).toContain('Merge');
	});

	it('review-requested PR shows Review as primary', async () => {
		const card = await findCardByTitle('Review requested');
		const primary = await getPrimaryActionLabel(card);
		expect(primary).toContain('Review');
	});

	it('no-worktree card shows Run as primary and Setup Worktree as secondary', async () => {
		const card = await findCardByTitle('Just an idea');
		const primary = await getPrimaryActionLabel(card);
		const secondary = await getSecondaryActionLabel(card);
		expect(primary).toContain('Run');
		expect(secondary).toContain('Setup Worktree');
	});
});
