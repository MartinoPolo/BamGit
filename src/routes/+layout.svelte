<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import DashboardSidebar from '$lib/components/DashboardSidebar.svelte';
	import DashboardCreateDialog from '$lib/components/DashboardCreateDialog.svelte';
	import DashboardEditDialog from '$lib/components/DashboardEditDialog.svelte';
	import { get_dashboard_store } from '$lib/stores/dashboard.svelte';
	import { initialize_theme } from '$lib/stores/theme.svelte';
	import { create_dashboard, update_dashboard, delete_dashboard } from '$lib/tauri/commands';
	import { add_repo_to_portfolio } from '$lib/tauri/portfolio_commands';
	import type {
		CreateDashboardRequest,
		Dashboard,
		UpdateDashboardRequest,
	} from '$lib/types/dashboard';

	let { children } = $props();

	const dashboard_store = get_dashboard_store();
	initialize_theme();

	let editing_dashboard = $state<Dashboard | null>(null);

	onMount(() => {
		dashboard_store.load_dashboards();
	});

	async function handle_create_dashboard(
		request: CreateDashboardRequest,
		selected_repo_ids: string[],
	) {
		try {
			const created = await create_dashboard(request);

			// Add repo pointers for portfolio dashboards
			if (request.type === 'portfolio' && selected_repo_ids.length > 0) {
				for (const repo_id of selected_repo_ids) {
					await add_repo_to_portfolio({
						portfolio_dashboard_id: created.id,
						repo_dashboard_id: repo_id,
					});
				}
			}

			await dashboard_store.refresh();
			dashboard_store.select_dashboard(created.id);
		} catch (err) {
			console.error('Failed to create dashboard:', err);
		}
	}

	async function handle_update_dashboard(request: UpdateDashboardRequest) {
		try {
			await update_dashboard(request);
			await dashboard_store.refresh();
		} catch (err) {
			console.error('Failed to update dashboard:', err);
		}
	}

	async function handle_delete_dashboard(id: string) {
		try {
			await delete_dashboard(id);
			await dashboard_store.refresh();
		} catch (err) {
			console.error('Failed to delete dashboard:', err);
		}
	}
</script>

<div class="flex h-screen bg-background text-foreground">
	<DashboardSidebar
		dashboards={dashboard_store.dashboards}
		active_dashboard_id={dashboard_store.active_dashboard_id}
		collapsed={dashboard_store.sidebar_collapsed}
		on_select_dashboard={(id) => dashboard_store.select_dashboard(id)}
		on_toggle_sidebar={() => dashboard_store.toggle_sidebar()}
		on_create_dashboard={() => (dashboard_store.show_create_dialog = true)}
		on_edit_dashboard={(d) => (editing_dashboard = d)}
	/>

	<main class="flex-1 overflow-auto p-4">
		{@render children()}
	</main>
</div>

<DashboardCreateDialog
	open={dashboard_store.show_create_dialog}
	repo_dashboards={dashboard_store.repo_dashboards}
	on_close={() => (dashboard_store.show_create_dialog = false)}
	on_create={handle_create_dashboard}
/>

<DashboardEditDialog
	dashboard={editing_dashboard}
	on_close={() => (editing_dashboard = null)}
	on_update={handle_update_dashboard}
	on_delete={handle_delete_dashboard}
/>
