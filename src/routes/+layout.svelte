<script lang="ts">
	import '@fontsource/geist';
	import '@fontsource/geist-mono';
	import '../app.css';
	import { onMount } from 'svelte';
	import { preloadCode, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import DashboardSidebar from '$lib/components/blocks/layout/DashboardSidebar.svelte';
	import DashboardCreateDialog from '$lib/components/blocks/workspace/DashboardCreateDialog.svelte';
	import DashboardEditDialog from '$lib/components/blocks/workspace/DashboardEditDialog.svelte';
	import * as Tooltip from '$lib/components/shadcn/tooltip/index.js';
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
	import { setSettingsContext } from '$lib/modules/settings';
	import { setIssueCardSettingsContext } from '$lib/components/blocks/issue-card/index.js';
	import { setToastsContext, registerMockToastBridge } from '$lib/modules/toasts';
	import CommandPalette from '$lib/components/blocks/command-palette/CommandPalette.svelte';
	import RawRequirementsModal from '$lib/components/blocks/issue/RawRequirementsModal.svelte';
	import ToastContainer from '$lib/components/derived/toast-container/ToastContainer.svelte';
	import type { Dashboard } from '$lib/types/generated';

	let { children } = $props();

	const windowCtx = setWindowContext();
	const settingsCtx = setSettingsContext();
	const boardStore = setBoardContext();
	const username = $derived(settingsCtx.get('username'));
	const userInitials = $derived(settingsCtx.get('userInitials'));
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
	const issueCardSettingsCtx = setIssueCardSettingsContext();

	let editingDashboard = $state<Dashboard | null>(null);

	onMount(() => {
		registerMockToastBridge((title, body) => toastsCtx.show({ tone: 'warning', title, body }));
		void issueCardSettingsCtx.loadSettings();
		boardStore.loadDashboards(windowCtx.isWorkspace ? windowCtx.boundDashboardId : null);
		boardStore.loadPalettes();
		void preloadCode(resolve('/'));
		void preloadCode(resolve('/overview'));
		void preloadCode(resolve('/sessions'));
		void preloadCode(resolve('/settings/general'));
		void preloadCode(resolve('/usage'));
		void preloadCode(resolve('/quick-ideas'));
		void settingsCtx.loadSettings();
		void characterPacksCtx.loadPacks();
		void shortcutsCtx.loadCustomBindings();
		void versionControlCtx.checkAvailability();

		shortcutsCtx.registerShortcut({
			id: 'command-palette',
			label: 'Command Palette',
			defaultBinding: 'Ctrl+K',
			allowFromEditable: true,
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
			callback: () => {
				if (!isSettingsRoute) {
					settingsCtx.setReturnUrl(page.url.pathname + page.url.search);
				}
				void goto(resolve('/settings/general'));
			},
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
	const isSettingsRoute = $derived(page.url.pathname.startsWith('/settings'));
</script>

<svelte:window onkeydown={(event) => shortcutsCtx.handleKeydown(event)} />

<Tooltip.Provider delayDuration={300} skipDelayDuration={300}>
	{#if windowCtx.isOverview}
		<div class="h-screen overflow-auto bg-background text-foreground">
			{@render children()}
		</div>
	{:else if isSettingsRoute}
		<div class="h-screen overflow-hidden bg-background text-foreground">
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
				{username}
				{userInitials}
				{activeSessionCount}
				collapsed={boardStore.sidebarCollapsed}
				onToggleSidebar={() => boardStore.toggleSidebar()}
				onEditWorkspace={() => {
					editingDashboard = boardStore.activeDashboard ?? null;
				}}
				onOpenSettings={() => {
					settingsCtx.setReturnUrl(page.url.pathname + page.url.search);
					void goto(resolve('/settings/general'));
				}}
				onOpenWorkspaceSettings={() => {
					settingsCtx.setReturnUrl(page.url.pathname + page.url.search);
					const dashboardId = boardStore.activeDashboard?.id;
					if (dashboardId !== undefined) {
						// eslint-disable-next-line svelte/no-navigation-without-resolve -- dynamically constructed query params
						void goto(`${resolve('/settings/workspace')}?scope=ws&id=${dashboardId}`);
					}
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
