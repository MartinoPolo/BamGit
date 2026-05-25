import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import WorkspaceDeleteDialog from './WorkspaceDeleteDialog.svelte';

describe('WorkspaceDeleteDialog', () => {
	it('renders dialog with title and body when open', async () => {
		await render(WorkspaceDeleteDialog, {
			props: {
				open: true,
				workspaceName: 'My Project',
				onconfirm: () => {},
				onclose: () => {},
			},
		});

		const title = page.getByText('Delete Workspace');
		await expect.element(title).toBeVisible();

		const body = page.getByText(/This action is permanent/);
		await expect.element(body).toBeVisible();
	});

	it('delete button is disabled when input is empty', async () => {
		await render(WorkspaceDeleteDialog, {
			props: {
				open: true,
				workspaceName: 'My Project',
				onconfirm: () => {},
				onclose: () => {},
			},
		});

		const deleteButton = page.getByRole('button', { name: 'Delete' });
		await expect.element(deleteButton).toBeDisabled();
	});

	it('delete button is disabled when typed name does not match', async () => {
		await render(WorkspaceDeleteDialog, {
			props: {
				open: true,
				workspaceName: 'My Project',
				onconfirm: () => {},
				onclose: () => {},
			},
		});

		const input = page.getByPlaceholder('Type workspace name to confirm');
		await input.fill('Wrong Name');

		const deleteButton = page.getByRole('button', { name: 'Delete' });
		await expect.element(deleteButton).toBeDisabled();
	});

	it('delete button is enabled when typed name exactly matches workspaceName', async () => {
		await render(WorkspaceDeleteDialog, {
			props: {
				open: true,
				workspaceName: 'My Project',
				onconfirm: () => {},
				onclose: () => {},
			},
		});

		const input = page.getByPlaceholder('Type workspace name to confirm');
		await input.fill('My Project');

		const deleteButton = page.getByRole('button', { name: 'Delete' });
		await expect.element(deleteButton).toBeEnabled();
	});

	it('calls onconfirm when delete button is clicked with matching name', async () => {
		const onconfirm = vi.fn();
		await render(WorkspaceDeleteDialog, {
			props: {
				open: true,
				workspaceName: 'My Project',
				onconfirm,
				onclose: () => {},
			},
		});

		const input = page.getByPlaceholder('Type workspace name to confirm');
		await input.fill('My Project');

		const deleteButton = page.getByRole('button', { name: 'Delete' });
		await expect.element(deleteButton).toBeEnabled();

		await deleteButton.click();

		expect(onconfirm).toHaveBeenCalledOnce();
	});
});
