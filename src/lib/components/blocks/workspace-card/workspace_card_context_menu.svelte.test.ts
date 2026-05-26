import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import WorkspaceCardContextMenuTestWrapper from './WorkspaceCardContextMenuTestWrapper.svelte';
import type { OverviewWorkspaceData } from '$lib/types/generated';

function makeWorkspace(overrides: Partial<OverviewWorkspaceData> = {}): OverviewWorkspaceData {
	return {
		dashboard_id: 'ws-1',
		name: 'Test Workspace',
		github_repo: 'org/repo',
		local_folder: 'C:/projects/repo',
		color_palette_id: null,
		accent_color: null,
		open_issue_count: 5,
		active_session_count: 0,
		last_activity: new Date().toISOString(),
		total_cost_usd: 0,
		hitl_count: 0,
		open_pr_count: 0,
		prs_needing_attention: 0,
		afk_loop_status: 'off',
		default_branch: 'main',
		worktree_count: 1,
		afk_ready_count: 0,
		prd_count: 0,
		prd_completed_subs: 0,
		prd_total_subs: 0,
		status: 'active',
		...overrides,
	};
}

function makeCallbacks() {
	return {
		onEdit: vi.fn(),
		onSettings: vi.fn(),
		onArchive: vi.fn(),
		onUnarchive: vi.fn(),
		onDelete: vi.fn(),
		onOpenInNewWindow: vi.fn(),
	};
}

async function openContextMenu() {
	const trigger = page.getByText('Test Workspace');
	await trigger
		.element()
		.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
}

describe('WorkspaceCardContextMenu', () => {
	it('renders children as the trigger content', async () => {
		const workspace = makeWorkspace();
		await render(WorkspaceCardContextMenuTestWrapper, {
			props: { workspace, ...makeCallbacks() },
		});

		await expect.element(page.getByText('Test Workspace')).toBeVisible();
	});

	it('shows all menu items after right-click', async () => {
		const workspace = makeWorkspace();
		await render(WorkspaceCardContextMenuTestWrapper, {
			props: { workspace, ...makeCallbacks() },
		});

		await openContextMenu();

		await expect.element(page.getByText('Edit...')).toBeVisible();
		await expect.element(page.getByText('Settings')).toBeVisible();
		await expect.element(page.getByText('Open Folder')).toBeVisible();
		await expect.element(page.getByText('Open in GitHub')).toBeVisible();
		await expect.element(page.getByText('Open in new window')).toBeVisible();
		await expect.element(page.getByText('Archive')).toBeVisible();
		await expect.element(page.getByText('Delete...')).toBeVisible();
	});

	it('shows Unarchive instead of Archive for archived workspaces', async () => {
		const workspace = makeWorkspace({ status: 'archived' });
		await render(WorkspaceCardContextMenuTestWrapper, {
			props: { workspace, ...makeCallbacks() },
		});

		await openContextMenu();

		await expect.element(page.getByText('Unarchive')).toBeVisible();
	});

	it('calls onEdit when Edit... is clicked', async () => {
		const workspace = makeWorkspace();
		const callbacks = makeCallbacks();
		await render(WorkspaceCardContextMenuTestWrapper, {
			props: { workspace, ...callbacks },
		});

		await openContextMenu();
		await page.getByText('Edit...').click();

		expect(callbacks.onEdit).toHaveBeenCalledWith(workspace);
	});

	it('calls onSettings when Settings is clicked', async () => {
		const workspace = makeWorkspace();
		const callbacks = makeCallbacks();
		await render(WorkspaceCardContextMenuTestWrapper, {
			props: { workspace, ...callbacks },
		});

		await openContextMenu();
		await page.getByText('Settings').click();

		expect(callbacks.onSettings).toHaveBeenCalledWith(workspace);
	});

	it('calls onArchive when Archive is clicked', async () => {
		const workspace = makeWorkspace();
		const callbacks = makeCallbacks();
		await render(WorkspaceCardContextMenuTestWrapper, {
			props: { workspace, ...callbacks },
		});

		await openContextMenu();
		await page.getByText('Archive').click();

		expect(callbacks.onArchive).toHaveBeenCalledWith(workspace);
	});

	it('calls onUnarchive when Unarchive is clicked', async () => {
		const workspace = makeWorkspace({ status: 'archived' });
		const callbacks = makeCallbacks();
		await render(WorkspaceCardContextMenuTestWrapper, {
			props: { workspace, ...callbacks },
		});

		await openContextMenu();
		await page.getByText('Unarchive').click();

		expect(callbacks.onUnarchive).toHaveBeenCalledWith(workspace);
	});

	it('calls onDelete when Delete... is clicked', async () => {
		const workspace = makeWorkspace();
		const callbacks = makeCallbacks();
		await render(WorkspaceCardContextMenuTestWrapper, {
			props: { workspace, ...callbacks },
		});

		await openContextMenu();
		await page.getByText('Delete...').click();

		expect(callbacks.onDelete).toHaveBeenCalledWith(workspace);
	});

	it('disables Open Folder when local_folder is null', async () => {
		const workspace = makeWorkspace({ local_folder: null });
		await render(WorkspaceCardContextMenuTestWrapper, {
			props: { workspace, ...makeCallbacks() },
		});

		await openContextMenu();

		const folderItem = page.getByText('Open Folder');
		await expect.element(folderItem).toBeVisible();
		const menuItem = folderItem.element().closest('[role="menuitem"]');
		expect(menuItem).toHaveAttribute('data-disabled');
	});

	it('disables Open in GitHub when github_repo is null', async () => {
		const workspace = makeWorkspace({ github_repo: null });
		await render(WorkspaceCardContextMenuTestWrapper, {
			props: { workspace, ...makeCallbacks() },
		});

		await openContextMenu();

		const githubItem = page.getByText('Open in GitHub');
		await expect.element(githubItem).toBeVisible();
		const menuItem = githubItem.element().closest('[role="menuitem"]');
		expect(menuItem).toHaveAttribute('data-disabled');
	});

	it('shows Open in new window menu item', async () => {
		const workspace = makeWorkspace();
		await render(WorkspaceCardContextMenuTestWrapper, {
			props: { workspace, ...makeCallbacks() },
		});

		await openContextMenu();

		await expect.element(page.getByText('Open in new window')).toBeVisible();
	});

	it('calls onOpenInNewWindow when Open in new window is clicked', async () => {
		const workspace = makeWorkspace();
		const callbacks = makeCallbacks();
		await render(WorkspaceCardContextMenuTestWrapper, {
			props: { workspace, ...callbacks },
		});

		await openContextMenu();
		await page.getByText('Open in new window').click();

		expect(callbacks.onOpenInNewWindow).toHaveBeenCalledWith(workspace);
	});
});
