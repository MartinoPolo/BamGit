<script lang="ts">
	import '@fontsource/geist';
	import '@fontsource/geist-mono';
	import '../app.css';
	import { onMount } from 'svelte';
	import { preloadCode, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import DashboardSidebar from '$lib/components/DashboardSidebar.svelte';
	import DashboardCreateDialog from '$lib/components/DashboardCreateDialog.svelte';
	import DashboardEditDialog from '$lib/components/DashboardEditDialog.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import {
		setBoardContext,
		setSelectionContext,
		type CreateDashboardRequest,
		type UpdateDashboardRequest,
	} from '$lib/modules/board';
	import { setNotificationsContext } from '$lib/modules/notifications';
	import { setSessionsContext } from '$lib/modules/sessions';
	import { setIssuesContext } from '$lib/modules/issues';
	import { setVersionControlContext } from '$lib/modules/version-control';
	import { setActionsContext } from '$lib/modules/actions';
	import { setWindowContext, openWorkspaceWindow } from '$lib/modules/window';
	import { setKeyboardShortcutsContext } from '$lib/modules/keyboard-shortcuts';
	import { setCommandPaletteContext } from '$lib/modules/command-palette';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import type { Dashboard } from '$lib/types/generated';

	let { children } = $props();

	const windowCtx = setWindowContext();
	const boardStore = setBoardContext();
	setSelectionContext();
	const notificationsCtx = setNotificationsContext();
	const sessionStore = setSessionsContext(notificationsCtx);
	setIssuesContext();
	setVersionControlContext();
	setActionsContext();
	const shortcutsCtx = setKeyboardShortcutsContext();
	const commandPaletteCtx = setCommandPaletteContext();

	let editingDashboard = $state<Dashboard | null>(null);

	onMount(() => {
		boardStore.loadDashboards();
		boardStore.loadPalettes();
		void preloadCode(resolve('/'));
		void preloadCode(resolve('/overview'));
		void preloadCode(resolve('/sessions'));
		void preloadCode(resolve('/settings'));
		void shortcutsCtx.loadCustomBindings();

		shortcutsCtx.registerShortcut({
			id: 'command-palette',
			label: 'Command Palette',
			defaultBinding: 'Ctrl+K',
			callback: () => commandPaletteCtx.toggle(),
		});
		shortcutsCtx.registerShortcut({
			id: 'toggle-sidebar',
			label: 'Toggle Sidebar',
			defaultBinding: 'Ctrl+\\',
			callback: () => boardStore.toggleSidebar(),
		});
		shortcutsCtx.registerShortcut({
			id: 'open-settings',
			label: 'Open Settings',
			defaultBinding: 'Ctrl+,',
			callback: () => void goto(resolve('/settings')),
		});
	});

	async function handleCreateDashboard(
		request: CreateDashboardRequest,
		selectedRepoIds: string[],
	) {
		try {
			const created = await boardStore.createDashboard(request);
			if (request.type === 'portfolio' && selectedRepoIds.length > 0) {
				for (const repoId of selectedRepoIds) {
					await boardStore.addRepoToPortfolio({
						portfolio_dashboard_id: created.id,
						repo_dashboard_id: repoId,
					});
				}
			}
			await boardStore.refreshDashboards();
			if (windowCtx.isOverview) {
				await openWorkspaceWindow(created.id);
			} else {
				boardStore.selectDashboard(created.id);
			}
		} catch (err) {
			console.error('Failed to create dashboard:', err);
		}
	}

	async function handleUpdateDashboard(request: UpdateDashboardRequest) {
		try {
			await boardStore.updateDashboard(request);
			await boardStore.refreshDashboards();
		} catch (err) {
			console.error('Failed to update dashboard:', err);
		}
	}

	async function handleDeleteDashboard(id: string) {
		try {
			await boardStore.deleteDashboard(id);
			await boardStore.refreshDashboards();
		} catch (err) {
			console.error('Failed to delete dashboard:', err);
		}
	}

	const workspaceName = $derived(boardStore.activeDashboard?.name ?? 'Grovekeeper');
	const activeSessionCount = $derived(sessionStore.activeSessions.length);
</script>

<svelte:window onkeydown={(event) => shortcutsCtx.handleKeydown(event)} />

<Tooltip.Provider>
	{#if windowCtx.isOverview}
		<div class="h-screen overflow-auto bg-background text-foreground">
			{@render children()}
		</div>
	{:else}
		<div
			class="grid h-screen overflow-hidden bg-background text-foreground"
			style:grid-template-columns={boardStore.sidebarCollapsed
				? 'var(--sidebar-width-collapsed) 1fr'
				: 'var(--sidebar-width) 1fr'}
		>
			<DashboardSidebar
				{workspaceName}
				username={boardStore.username}
				userInitials={boardStore.userInitials}
				{activeSessionCount}
				collapsed={boardStore.sidebarCollapsed}
				onToggleSidebar={() => boardStore.toggleSidebar()}
			/>

			<main class="flex min-w-0 flex-1 flex-col overflow-auto">
				{@render children()}
			</main>
		</div>
	{/if}
</Tooltip.Provider>

<DashboardCreateDialog
	open={boardStore.showCreateDialog}
	repoDashboards={boardStore.repoDashboards}
	colorPalettes={boardStore.palettes}
	onClose={() => (boardStore.showCreateDialog = false)}
	onCreate={handleCreateDashboard}
/>

<DashboardEditDialog
	dashboard={editingDashboard}
	colorPalettes={boardStore.palettes}
	onClose={() => (editingDashboard = null)}
	onUpdate={handleUpdateDashboard}
	onDelete={handleDeleteDashboard}
/>

<CommandPalette />
