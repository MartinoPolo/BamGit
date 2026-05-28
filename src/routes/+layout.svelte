<script lang="ts">
	import '@fontsource/geist';
	import '@fontsource/geist-mono';
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { afterNavigate, preloadCode, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { isTauri } from '$lib/tauri.js';
	import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
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
	import { setProcessesContext } from '$lib/modules/processes';
	import { setWindowContext } from '$lib/modules/window';
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
	import { ProcessLogViewer } from '$lib/components/blocks/process-log/index.js';
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

	const RESTART_CI_REFRESH_DELAY_MS = 5_000;
	const pendingRefreshIssueIds = new SvelteSet<string>();
	let restartRefreshTimeout: ReturnType<typeof setTimeout> | null = null;

	function batchedCiRefreshOnRestart(issueId: string) {
		pendingRefreshIssueIds.add(issueId);
		if (restartRefreshTimeout !== null) {
			clearTimeout(restartRefreshTimeout);
		}
		restartRefreshTimeout = setTimeout(() => {
			for (const id of pendingRefreshIssueIds) {
				versionControlCtx.refreshGitStatus(id);
			}
			pendingRefreshIssueIds.clear();
			restartRefreshTimeout = null;
		}, RESTART_CI_REFRESH_DELAY_MS);
	}

	setProcessesContext(batchedCiRefreshOnRestart);

	onDestroy(() => {
		if (restartRefreshTimeout !== null) {
			clearTimeout(restartRefreshTimeout);
		}
		pendingRefreshIssueIds.clear();
	});
	const shortcutsCtx = setKeyboardShortcutsContext();
	const commandPaletteCtx = setCommandPaletteContext();
	const toastsCtx = setToastsContext();
	const rawRequirementsCtx = setRawRequirementsContext();
	const characterPacksCtx = setCharacterPacksContext();
	setCreationWizardContext();
	setIssueCardSettingsContext();

	let editingDashboard = $state<Dashboard | null>(null);

	$effect(() => {
		const dashboardId = windowCtx.boundDashboardId;
		void boardStore.loadDashboards(dashboardId);
		void settingsCtx.loadSettings(dashboardId);
	});

	$effect(() => {
		if (!isTauri()) {
			return;
		}
		const title = windowCtx.isOverview
			? 'Overview — Grovekeeper'
			: `${boardStore.activeDashboard?.name ?? 'Workspace'} — Grovekeeper`;
		void getCurrentWebviewWindow().setTitle(title);
	});

	afterNavigate((navigation) => {
		if (navigation.to !== null) {
			windowCtx.syncNavigationState(navigation.to.url.pathname, page.state);
		}
	});

	onMount(() => {
		registerMockToastBridge((title, body) => toastsCtx.show({ tone: 'warning', title, body }));
		boardStore.loadPalettes();
		void preloadCode(resolve('/'));
		void preloadCode(resolve('/overview'));
		void preloadCode(resolve('/sessions'));
		void preloadCode(resolve('/settings/general'));
		void preloadCode(resolve('/usage'));
		void preloadCode(resolve('/quick-ideas'));
		void characterPacksCtx.loadPacks();
		void shortcutsCtx.loadCustomBindings();
		void versionControlCtx.checkAvailability();
		void sessionStore.loadSessions();

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

	async function handleCreateDashboard(request: CreateDashboardRequest) {
		try {
			const created = await boardStore.createDashboard(request);
			await boardStore.refreshDashboards();
			if (windowCtx.isOverview) {
				windowCtx.navigateToWorkspace(created.id);
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

	async function handleArchiveDashboard(id: string) {
		try {
			await boardStore.archiveDashboard(id);
		} catch (err) {
			console.error('Failed to archive dashboard:', err);
		}
	}

	const activeSessionCount = $derived(sessionStore.activeSessions.length);
	const isSettingsRoute = $derived(page.url.pathname.startsWith('/settings'));
</script>

<svelte:window onkeydown={(event) => shortcutsCtx.handleKeydown(event)} />

<Tooltip.Provider delayDuration={300} skipDelayDuration={300} disableHoverableContent>
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
	onClose={() => (boardStore.showCreateDialog = false)}
	onCreate={handleCreateDashboard}
/>

<DashboardEditDialog
	dashboard={editingDashboard}
	onClose={() => (editingDashboard = null)}
	onUpdate={handleUpdateDashboard}
	onArchive={handleArchiveDashboard}
/>

<CommandPalette />
<RawRequirementsModal />
<ProcessLogViewer />
<ToastContainer />
