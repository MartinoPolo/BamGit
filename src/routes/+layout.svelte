<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import DashboardSidebar from '$lib/components/DashboardSidebar.svelte';
	import DashboardCreateDialog from '$lib/components/DashboardCreateDialog.svelte';
	import DashboardEditDialog from '$lib/components/DashboardEditDialog.svelte';
	import { setThemeContext } from '$lib/context/theme.context.svelte.js';
	import { setViewPreferenceContext } from '$lib/context/view_preference.context.svelte.js';
	import { setDashboardContext } from '$lib/context/dashboard.context.svelte.js';
	import { setColorPalettesContext } from '$lib/context/color_palettes.context.svelte.js';
	import { setNotificationsContext } from '$lib/context/notifications.context.svelte.js';
	import { setSessionsContext } from '$lib/context/sessions.context.svelte.js';
	import { setIssuesContext } from '$lib/context/issues.context.svelte.js';
	import { setGitStatusContext } from '$lib/context/git_status.context.svelte.js';
	import { setGithubContext } from '$lib/context/github.context.svelte.js';
	import { setActionsContext } from '$lib/context/actions.context.svelte.js';
	import { createDashboard, updateDashboard, deleteDashboard } from '$lib/tauri/commands';
	import { addRepoToPortfolio } from '$lib/tauri/portfolio_commands';
	import type {
		CreateDashboardRequest,
		Dashboard,
		UpdateDashboardRequest,
	} from '$lib/types/dashboard';

	let { children } = $props();

	setThemeContext();
	setViewPreferenceContext();
	const dashboardStore = setDashboardContext();
	const paletteStore = setColorPalettesContext();
	const notificationsCtx = setNotificationsContext();
	setSessionsContext(notificationsCtx);
	setIssuesContext();
	setGitStatusContext();
	setGithubContext();
	setActionsContext();

	let editingDashboard = $state<Dashboard | null>(null);

	onMount(() => {
		dashboardStore.loadDashboards();
		paletteStore.loadPalettes();
	});

	async function handleCreateDashboard(
		request: CreateDashboardRequest,
		selectedRepoIds: string[],
	) {
		try {
			const created = await createDashboard(request);

			// Add repo pointers for portfolio dashboards
			if (request.type === 'portfolio' && selectedRepoIds.length > 0) {
				for (const repoId of selectedRepoIds) {
					await addRepoToPortfolio({
						portfolio_dashboard_id: created.id,
						repo_dashboard_id: repoId,
					});
				}
			}

			await dashboardStore.refresh();
			dashboardStore.selectDashboard(created.id);
		} catch (err) {
			console.error('Failed to create dashboard:', err);
		}
	}

	async function handleUpdateDashboard(request: UpdateDashboardRequest) {
		try {
			await updateDashboard(request);
			await dashboardStore.refresh();
		} catch (err) {
			console.error('Failed to update dashboard:', err);
		}
	}

	async function handleDeleteDashboard(id: string) {
		try {
			await deleteDashboard(id);
			await dashboardStore.refresh();
		} catch (err) {
			console.error('Failed to delete dashboard:', err);
		}
	}
</script>

<div class="flex h-screen bg-background text-foreground">
	<DashboardSidebar
		dashboards={dashboardStore.dashboards}
		activeDashboardId={dashboardStore.activeDashboardId}
		collapsed={dashboardStore.sidebarCollapsed}
		onSelectDashboard={(id) => dashboardStore.selectDashboard(id)}
		onToggleSidebar={() => dashboardStore.toggleSidebar()}
		onCreateDashboard={() => (dashboardStore.showCreateDialog = true)}
		onEditDashboard={(d) => (editingDashboard = d)}
	/>

	<main class="flex-1 overflow-auto p-4">
		{@render children()}
	</main>
</div>

<DashboardCreateDialog
	open={dashboardStore.showCreateDialog}
	repoDashboards={dashboardStore.repoDashboards}
	colorPalettes={paletteStore.palettes}
	onClose={() => (dashboardStore.showCreateDialog = false)}
	onCreate={handleCreateDashboard}
/>

<DashboardEditDialog
	dashboard={editingDashboard}
	colorPalettes={paletteStore.palettes}
	onClose={() => (editingDashboard = null)}
	onUpdate={handleUpdateDashboard}
	onDelete={handleDeleteDashboard}
/>
