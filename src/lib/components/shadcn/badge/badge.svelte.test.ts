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

		it('does not apply collapsed utilities', async () => {
			const screen = await render(BadgeTestHarness, {
				props: { tone: 'info', text: 'Running' },
			});
			const badge = getBadgeElement(screen);
			expect(badge.classList.contains('gap-0')).toBe(false);
		});

		it('has transition style', async () => {
			const screen = await render(BadgeTestHarness, {
				props: { tone: 'neutral', text: 'Test' },
			});
			const badge = getBadgeElement(screen);
			expect(badge.style.transition).toContain('padding');
		});
	});

	describe('collapsed', () => {
		it('applies collapsed utilities', async () => {
			const screen = await render(BadgeTestHarness, {
				props: { tone: 'success', collapsed: true, text: 'Passed' },
			});
			const badge = getBadgeElement(screen);
			expect(badge.classList.contains('gap-0')).toBe(true);
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
