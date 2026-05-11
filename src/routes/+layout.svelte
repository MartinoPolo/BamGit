<script lang="ts">
	import '@fontsource/geist';
	import '@fontsource/geist-mono';
	import '../app.css';
	import { onMount } from 'svelte';
	import { preloadCode, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import DashboardSidebar from '$lib/components/blocks/layout/DashboardSidebar.svelte';
	import DashboardCreateDialog from '$lib/components/blocks/workspace/DashboardCreateDialog.svelte';
	import DashboardEditDialog from '$lib/components/blocks/workspace/DashboardEditDialog.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import {
		setBoardContext,
		setSelectionContext,
		initUrlStateSync,
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
	import { setRawRequirementsContext } from '$lib/modules/raw-requirements';
	import { setCharacterPacksContext } from '$lib/modules/character-packs';
	import { setCreationWizardContext } from '$lib/modules/creation-wizard';
	import { setToastsContext, registerMockToastBridge } from '$lib/modules/toasts';
	import CommandPalette from '$lib/components/blocks/command-palette/CommandPalette.svelte';
	import RawRequirementsModal from '$lib/components/blocks/issue/RawRequirementsModal.svelte';
	import ToastContainer from '$lib/components/derived/toast-container/ToastContainer.svelte';
	import type { Dashboard } from '$lib/types/generated';

	let { children } = $props();

	const windowCtx = setWindowContext();
	const boardStore = setBoardContext();
	const selectionCtx = setSelectionContext();
	initUrlStateSync(selectionCtx);
	const notificationsCtx = setNotificationsContext();
	const sessionStore = setSessionsContext(notificationsCtx);
	setIssuesContext();
	const versionControlCtx = setVersionControlContext();
	setActionsContext();
	const shortcutsCtx = setKeyboardShortcutsContext();
	const commandPaletteCtx = setCommandPaletteContext();
	const toastsCtx = setToastsContext();
	const rawRequirementsCtx = setRawRequirementsContext();
	const characterPacksCtx = setCharacterPacksContext();
	setCreationWizardContext();

	let editingDashboard = $state<Dashboard | null>(null);

	onMount(() => {
		registerMockToastBridge((title, body) => toastsCtx.show({ tone: 'warning', title, body }));
		boardStore.loadDashboards(windowCtx.isWorkspace ? windowCtx.boundDashboardId : null);
		boardStore.loadPalettes();
		void preloadCode(resolve('/'));
		void preloadCode(resolve('/overview'));
		void preloadCode(resolve('/sessions'));
		void preloadCode(resolve('/settings'));
		void preloadCode(resolve('/workspace-settings'));
		void preloadCode(resolve('/usage'));
		void preloadCode(resolve('/quick-ideas'));
		void preloadCode(resolve('/ai-config'));
		void characterPacksCtx.loadPacks();
		void shortcutsCtx.loadCustomBindings();
		void versionControlCtx.checkAvailability();

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
		shortcutsCtx.registerShortcut({
			id: 'quick-ideas',
			label: 'Quick Ideas',
			defaultBinding: 'Ctrl+Shift+Q',
			allowFromEditable: true,
			callback: () => void rawRequirementsCtx.toggle(),
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
			await boardStore.archiveDashboard(id);
		} catch (err) {
			console.error('Failed to archive dashboard:', err);
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
				onEditWorkspace={() => {
					editingDashboard = boardStore.activeDashboard ?? null;
				}}
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
	onClose={() => (boardStore.showCreateDialog = false)}
	onCreate={handleCreateDashboard}
/>

<DashboardEditDialog
	dashboard={editingDashboard}
	onClose={() => (editingDashboard = null)}
	onUpdate={handleUpdateDashboard}
	onDelete={handleDeleteDashboard}
/>

<CommandPalette />
<RawRequirementsModal />
<ToastContainer />
