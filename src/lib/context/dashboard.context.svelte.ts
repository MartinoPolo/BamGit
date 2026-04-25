import { createContext } from 'svelte';
import type { Dashboard } from '$lib/types/dashboard';
import { getDashboards } from '$lib/tauri/commands';

const LAST_VIEWED_KEY = 'grovekeeper_last_viewed_dashboard_id';

type DashboardContext = ReturnType<typeof createDashboardContext>;

const [useDashboard, setDashboardInternal] = createContext<DashboardContext>();
export { useDashboard };

export function setDashboardContext() {
	const ctx = createDashboardContext();
	setDashboardInternal(ctx);
	return ctx;
}

function createDashboardContext() {
	let dashboards = $state<Dashboard[]>([]);
	let activeDashboardId = $state<string | null>(null);
	let sidebarCollapsed = $state(false);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let showCreateDialog = $state(false);

	const activeDashboard = $derived(
		dashboards.find((dashboard) => dashboard.id === activeDashboardId) ?? null,
	);

	const repoDashboards = $derived(dashboards.filter((d) => d.type === 'repo'));
	const portfolioDashboards = $derived(dashboards.filter((d) => d.type === 'portfolio'));

	return {
		get dashboards() {
			return dashboards;
		},
		get activeDashboard() {
			return activeDashboard;
		},
		get activeDashboardId() {
			return activeDashboardId;
		},
		get repoDashboards() {
			return repoDashboards;
		},
		get portfolioDashboards() {
			return portfolioDashboards;
		},
		get sidebarCollapsed() {
			return sidebarCollapsed;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get showCreateDialog() {
			return showCreateDialog;
		},
		set showCreateDialog(value: boolean) {
			showCreateDialog = value;
		},

		async loadDashboards() {
			try {
				loading = true;
				dashboards = await getDashboards();
				error = null;

				const lastId = localStorage.getItem(LAST_VIEWED_KEY);
				if (lastId && dashboards.some((d) => d.id === lastId)) {
					activeDashboardId = lastId;
				} else if (dashboards.length > 0) {
					activeDashboardId = dashboards[0].id;
				} else {
					activeDashboardId = null;
				}
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		selectDashboard(id: string) {
			activeDashboardId = id;
			localStorage.setItem(LAST_VIEWED_KEY, id);
		},

		toggleSidebar() {
			sidebarCollapsed = !sidebarCollapsed;
		},

		async refresh() {
			try {
				dashboards = await getDashboards();
				error = null;
				if (activeDashboardId && !dashboards.some((d) => d.id === activeDashboardId)) {
					activeDashboardId = dashboards.length > 0 ? dashboards[0].id : null;
				}
			} catch (err) {
				error = String(err);
			}
		},
	};
}
