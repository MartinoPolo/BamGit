import { browser, $ } from '@wdio/globals';
import {
	navigateToWorkspace,
	findCardByTitle,
	getChipLabel,
} from '../helpers/issue-card-helpers.js';

describe('Issue Card — State Chip Cascade', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	it('shows WORKTREE SETUP chip on pending worktree card', async () => {
		const card = await findCardByTitle('Worktree pending');
		const label = await getChipLabel(card);
		expect(label).toBe('WORKTREE SETUP');
	});

	it('shows SETUP FAILED chip on failed worktree card', async () => {
		const card = await findCardByTitle('Worktree failed');
		const label = await getChipLabel(card);
		expect(label).toBe('SETUP FAILED');
	});

	it('shows BEHIND BASE chip when behind_base_count > 0', async () => {
		const card = await findCardByTitle('PR open');
		const label = await getChipLabel(card);
		expect(label).toBe('BEHIND BASE');
	});

	it('shows APPROVED chip on approved PR card', async () => {
		const card = await findCardByTitle('Approved');
		const label = await getChipLabel(card);
		expect(label).toBe('APPROVED');
	});

	it('shows READY TO MERGE chip on ready-to-merge PR card', async () => {
		const card = await findCardByTitle('Ready to merge');
		const label = await getChipLabel(card);
		expect(label).toBe('READY TO MERGE');
	});

	it('shows CHANGES REQ chip on changes-requested PR card', async () => {
		const card = await findCardByTitle('Changes requested');
		const label = await getChipLabel(card);
		expect(label).toBe('CHANGES REQ');
	});

	it('shows no chip when no state condition matches', async () => {
		const card = await findCardByTitle('Ready to work');
		const label = await getChipLabel(card);
		expect(label).toBeNull();
	});

	it('shows EXECUTING chip on running session', async () => {
		const card = await findCardByTitle('Session running');
		const label = await getChipLabel(card);
		expect(label).toBe('EXECUTING');
	});

	it('shows ERROR chip on errored session', async () => {
		const card = await findCardByTitle('Session errored');
		const label = await getChipLabel(card);
		expect(label).toBe('ERROR');
	});

	it('shows NEEDS INPUT chip on needs-input session', async () => {
		const card = await findCardByTitle('Needs input');
		const label = await getChipLabel(card);
		expect(label).toBe('NEEDS INPUT');
	});
});

describe('Issue Card — Visual States', () => {
	before(async () => {
		await navigateToWorkspace();
	});

	it('worktreeSetup cards have data-card-state="worktreeSetup" and opacity 0.6', async () => {
		const card = await findCardByTitle('Worktree pending');
		expect(await card.getAttribute('data-card-state')).toBe('worktreeSetup');

		const opacity = await browser.execute(
			(el: HTMLElement) => window.getComputedStyle(el).opacity,
			card as unknown as HTMLElement,
		);
		expect(opacity).toBe('0.6');
	});

	it('card grid columns are at least 450px wide', async () => {
		const firstCard = await $('[data-testid="issue-card"]');
		const gridParent = await firstCard.parentElement();
		const columnWidths = await browser.execute(
			(el: HTMLElement) => {
				return window.getComputedStyle(el).gridTemplateColumns;
			},
			gridParent as unknown as HTMLElement,
		);

		const widths = columnWidths.split(' ').map((w: string) => parseFloat(w));
		for (const width of widths) {
			expect(width).toBeGreaterThanOrEqual(450);
		}
	});

	it('preview area is square (equal width and height, >= 100px)', async () => {
		const card = await $('[data-testid="issue-card"]');
		const preview = await card.$('[data-testid="issue-card-preview"]');
		const rect = await browser.execute(
			(el: HTMLElement) => {
				const r = el.getBoundingClientRect();
				return { width: r.width, height: r.height };
			},
			preview as unknown as HTMLElement,
		);

		expect(rect.width).toBe(rect.height);
		expect(rect.width).toBeGreaterThanOrEqual(100);
	});
});
