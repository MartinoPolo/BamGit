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
});
