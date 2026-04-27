<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import DashboardSidebar from '$lib/components/DashboardSidebar.svelte';
	import DashboardCreateDialog from '$lib/components/DashboardCreateDialog.svelte';
	import DashboardEditDialog from '$lib/components/DashboardEditDialog.svelte';
	import {
		setBoardContext,
		type CreateDashboardRequest,
		type UpdateDashboardRequest,
	} from '$lib/modules/board';
	import { setNotificationsContext } from '$lib/modules/notifications';
	import { setSessionsContext } from '$lib/modules/sessions';
	import { setIssuesContext } from '$lib/modules/issues';
	import { setVersionControlContext } from '$lib/modules/version-control';
	import { setActionsContext } from '$lib/modules/actions';
	import type { Dashboard } from '$lib/types/generated';

	let { children } = $props();

	const boardStore = setBoardContext();
	const notificationsCtx = setNotificationsContext();
	setSessionsContext(notificationsCtx);
	setIssuesContext();
	setVersionControlContext();
	setActionsContext();

	let editingDashboard = $state<Dashboard | null>(null);

	onMount(() => {
		boardStore.loadDashboards();
		boardStore.loadPalettes();
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
			boardStore.selectDashboard(created.id);
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
</script>

<div class="flex h-screen bg-background text-foreground">
	<DashboardSidebar
		dashboards={boardStore.dashboards}
		activeDashboardId={boardStore.activeDashboardId}
		collapsed={boardStore.sidebarCollapsed}
		onSelectDashboard={(id) => boardStore.selectDashboard(id)}
		onToggleSidebar={() => boardStore.toggleSidebar()}
		onCreateDashboard={() => (boardStore.showCreateDialog = true)}
		onEditDashboard={(d) => (editingDashboard = d)}
	/>

	<main class="flex-1 overflow-auto p-4">
		{@render children()}
	</main>
</div>

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
