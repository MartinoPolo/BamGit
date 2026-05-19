import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ServerPortBadge from './ServerPortBadge.svelte';

describe('ServerPortBadge', () => {
	it('renders port with colon prefix', async () => {
		const screen = await render(ServerPortBadge, {
			props: { port: 3000 },
		});
		await expect.element(screen.getByText(':3000')).toBeVisible();
	});

	it('has accessible label without colon', async () => {
		const screen = await render(ServerPortBadge, {
			props: { port: 8080 },
		});
		const button = screen.getByRole('button', { name: 'Open port 8080' });
		await expect.element(button).toBeVisible();
	});

	it('calls onclick handler when clicked', async () => {
		const handleClick = vi.fn();
		const screen = await render(ServerPortBadge, {
			props: { port: 3000, onclick: handleClick },
		});
		const button = screen.getByRole('button', { name: 'Open port 3000' });
		await button.click();
		expect(handleClick).toHaveBeenCalledOnce();
	});

	it('shows green dot indicator', async () => {
		const screen = await render(ServerPortBadge, {
			props: { port: 3000 },
		});
		const dot = screen.container.querySelector('[data-slot="badge"] .rounded-full.bg-current');
		expect(dot).not.toBeNull();
	});

	it('renders context menu trigger when processId is provided', async () => {
		const screen = await render(ServerPortBadge, {
			props: { port: 3000, processId: 'proc-1' },
		});
		const button = screen.getByRole('button', { name: 'Open port 3000' });
		await expect.element(button).toBeVisible();
		const trigger = screen.container.querySelector('[data-slot="context-menu-trigger"]');
		expect(trigger).not.toBeNull();
	});

	it('calls onKillProcess with processId when Kill is clicked', async () => {
		const handleKill = vi.fn();
		const screen = await render(ServerPortBadge, {
			props: { port: 3000, processId: 'proc-42', onKillProcess: handleKill },
		});
		const trigger = screen.container.querySelector('[data-slot="context-menu-trigger"]');
		trigger!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
		const killItem = screen.getByRole('menuitem', { name: 'Kill' });
		await expect.element(killItem).toBeVisible();
		await killItem.click();
		expect(handleKill).toHaveBeenCalledOnce();
		expect(handleKill).toHaveBeenCalledWith('proc-42');
	});

	it('calls onViewLogs with processId when View Logs is clicked', async () => {
		const handleViewLogs = vi.fn();
		const screen = await render(ServerPortBadge, {
			props: { port: 3000, processId: 'proc-7', onViewLogs: handleViewLogs },
		});
		const trigger = screen.container.querySelector('[data-slot="context-menu-trigger"]');
		trigger!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
		const viewLogsItem = screen.getByRole('menuitem', { name: 'View Logs' });
		await expect.element(viewLogsItem).toBeVisible();
		await viewLogsItem.click();
		expect(handleViewLogs).toHaveBeenCalledOnce();
		expect(handleViewLogs).toHaveBeenCalledWith('proc-7');
	});

	it('does not render context menu items when processId is not provided', async () => {
		const screen = await render(ServerPortBadge, {
			props: { port: 3000 },
		});
		const button = screen.getByRole('button', { name: 'Open port 3000' });
		await expect.element(button).toBeVisible();
		const trigger = screen.container.querySelector('[data-slot="context-menu-trigger"]');
		expect(trigger).toBeNull();
	});
});
