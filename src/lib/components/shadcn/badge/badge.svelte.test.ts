import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import BadgeTestHarness from './BadgeTestHarness.svelte';

function getBadgeElement(screen: Awaited<ReturnType<typeof render>>) {
	return screen.container.querySelector('[data-slot="badge"]') as HTMLElement;
}

describe('Badge collapse/expand', () => {
	describe('expanded (default)', () => {
		it('renders text content visibly', async () => {
			const screen = await render(BadgeTestHarness, {
				props: { tone: 'success', text: 'Passed' },
			});
			await expect.element(screen.getByText('Passed')).toBeVisible();
		});

		it('does not apply collapsed class', async () => {
			const screen = await render(BadgeTestHarness, {
				props: { tone: 'info', text: 'Running' },
			});
			const badge = getBadgeElement(screen);
			expect(badge.classList.contains('badge-collapsed')).toBe(false);
		});

		it('has collapsible transition class', async () => {
			const screen = await render(BadgeTestHarness, {
				props: { tone: 'neutral', text: 'Test' },
			});
			const badge = getBadgeElement(screen);
			expect(badge.classList.contains('badge-collapsible')).toBe(true);
		});
	});

	describe('collapsed', () => {
		it('applies badge-collapsed class', async () => {
			const screen = await render(BadgeTestHarness, {
				props: { tone: 'success', collapsed: true, text: 'Passed' },
			});
			const badge = getBadgeElement(screen);
			expect(badge.classList.contains('badge-collapsed')).toBe(true);
		});

		it('hides text via data-badge-text wrapper', async () => {
			const screen = await render(BadgeTestHarness, {
				props: { tone: 'danger', collapsed: true, text: 'Failed' },
			});
			const textWrapper = screen.container.querySelector('[data-badge-text]') as HTMLElement;
			expect(textWrapper).not.toBeNull();
			const style = window.getComputedStyle(textWrapper);
			expect(style.opacity).toBe('0');
		});

		it('keeps icon visible when collapsed', async () => {
			const screen = await render(BadgeTestHarness, {
				props: { tone: 'success', collapsed: true, showIcon: true },
			});
			await expect.element(screen.getByTestId('badge-icon')).toBeVisible();
		});
	});
});
