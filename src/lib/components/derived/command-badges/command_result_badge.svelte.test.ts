import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CommandResultBadge from './CommandResultBadge.svelte';

function getBadgeElement(screen: Awaited<ReturnType<typeof render>>) {
	return screen.container.querySelector('[data-slot="badge"]') as HTMLElement;
}

describe('CommandResultBadge', () => {
	describe('running state', () => {
		it('renders expanded with command name visible', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'running', commandName: 'check:all' },
			});
			await expect.element(screen.getByText('check:all')).toBeVisible();
		});

		it('is not collapsed', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'running', commandName: 'test' },
			});
			const badge = getBadgeElement(screen);
			expect(badge.classList.contains('gap-0')).toBe(false);
		});

		it('has role=status and correct aria-label', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'running', commandName: 'lint' },
			});
			const badge = screen.getByRole('status');
			await expect.element(badge).toHaveAttribute('aria-label', 'lint: running');
		});
	});

	describe('passed state', () => {
		it('is collapsed', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'passed', commandName: 'test' },
			});
			const badge = getBadgeElement(screen);
			expect(badge.classList.contains('gap-0')).toBe(true);
		});

		it('has correct aria-label', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'passed', commandName: 'test' },
			});
			const badge = screen.getByRole('status');
			await expect.element(badge).toHaveAttribute('aria-label', 'test: passed');
		});
	});

	describe('failed state', () => {
		it('is collapsed', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'failed', commandName: 'lint' },
			});
			const badge = getBadgeElement(screen);
			expect(badge.classList.contains('gap-0')).toBe(true);
		});

		it('has correct aria-label', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'failed', commandName: 'lint' },
			});
			const badge = screen.getByRole('status');
			await expect.element(badge).toHaveAttribute('aria-label', 'lint: failed');
		});
	});

	describe('timeout state', () => {
		it('is collapsed', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'timeout', commandName: 'build' },
			});
			const badge = getBadgeElement(screen);
			expect(badge.classList.contains('gap-0')).toBe(true);
		});

		it('has correct aria-label', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'timeout', commandName: 'build' },
			});
			const badge = screen.getByRole('status');
			await expect.element(badge).toHaveAttribute('aria-label', 'build: timeout');
		});
	});

	describe('stopped state', () => {
		it('is collapsed', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'stopped', commandName: 'dev' },
			});
			const badge = getBadgeElement(screen);
			expect(badge.classList.contains('gap-0')).toBe(true);
		});

		it('has correct aria-label', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'stopped', commandName: 'dev' },
			});
			const badge = screen.getByRole('status');
			await expect.element(badge).toHaveAttribute('aria-label', 'dev: stopped');
		});
	});

	describe('stale state', () => {
		it('applies reduced opacity when stale', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'passed', commandName: 'test', isStale: true },
			});
			const badge = getBadgeElement(screen);
			expect(badge.classList.contains('opacity-40')).toBe(true);
		});

		it('does not apply reduced opacity when not stale', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'passed', commandName: 'test', isStale: false },
			});
			const badge = getBadgeElement(screen);
			expect(badge.classList.contains('opacity-40')).toBe(false);
		});
	});
});
