import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CommandResultBadge from './CommandResultBadge.svelte';

describe('CommandResultBadge', () => {
	describe('running state', () => {
		it('renders expanded with command name visible', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'running', commandName: 'check:all' },
			});
			await expect.element(screen.getByText('check:all')).toBeVisible();
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
		it('has correct aria-label', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'passed', commandName: 'test' },
			});
			const badge = screen.getByRole('status');
			await expect.element(badge).toHaveAttribute('aria-label', 'test: passed');
		});
	});

	describe('failed state', () => {
		it('has correct aria-label', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'failed', commandName: 'lint' },
			});
			const badge = screen.getByRole('status');
			await expect.element(badge).toHaveAttribute('aria-label', 'lint: failed');
		});
	});

	describe('timeout state', () => {
		it('has correct aria-label', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'timeout', commandName: 'build' },
			});
			const badge = screen.getByRole('status');
			await expect.element(badge).toHaveAttribute('aria-label', 'build: timeout');
		});
	});

	describe('stopped state', () => {
		it('has correct aria-label', async () => {
			const screen = await render(CommandResultBadge, {
				props: { state: 'stopped', commandName: 'dev' },
			});
			const badge = screen.getByRole('status');
			await expect.element(badge).toHaveAttribute('aria-label', 'dev: stopped');
		});
	});
});
