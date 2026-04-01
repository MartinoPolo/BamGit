import type { Dashboard } from '$lib/types/dashboard';
import { get_dashboards } from '$lib/tauri/commands';

const LAST_VIEWED_KEY = 'bamgit_last_viewed_dashboard_id';

let dashboards = $state<Dashboard[]>([]);
let active_dashboard_id = $state<string | null>(null);
let sidebar_collapsed = $state(false);
let loading = $state(true);
let error = $state<string | null>(null);
let show_create_dialog = $state(false);

const active_dashboard = $derived(
	dashboards.find((dashboard) => dashboard.id === active_dashboard_id) ?? null,
);

const repo_dashboards = $derived(dashboards.filter((d) => d.type === 'repo'));
const portfolio_dashboards = $derived(dashboards.filter((d) => d.type === 'portfolio'));

export function get_dashboard_store() {
	return {
		get dashboards() {
			return dashboards;
		},
		get active_dashboard() {
			return active_dashboard;
		},
		get active_dashboard_id() {
			return active_dashboard_id;
		},
		get repo_dashboards() {
			return repo_dashboards;
		},
		get portfolio_dashboards() {
			return portfolio_dashboards;
		},
		get sidebar_collapsed() {
			return sidebar_collapsed;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get show_create_dialog() {
			return show_create_dialog;
		},
		set show_create_dialog(value: boolean) {
			show_create_dialog = value;
		},

		async load_dashboards() {
			try {
				loading = true;
				dashboards = await get_dashboards();
				error = null;

				// Restore last viewed dashboard
				const last_id = localStorage.getItem(LAST_VIEWED_KEY);
				if (last_id && dashboards.some((d) => d.id === last_id)) {
					active_dashboard_id = last_id;
				} else if (dashboards.length > 0) {
					active_dashboard_id = dashboards[0].id;
				} else {
					active_dashboard_id = null;
				}
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		select_dashboard(id: string) {
			active_dashboard_id = id;
			localStorage.setItem(LAST_VIEWED_KEY, id);
		},

		toggle_sidebar() {
			sidebar_collapsed = !sidebar_collapsed;
		},

		/** Call after create/update/delete to refresh the list */
		async refresh() {
			try {
				dashboards = await get_dashboards();
				error = null;
				// If active dashboard was deleted, select first available
				if (active_dashboard_id && !dashboards.some((d) => d.id === active_dashboard_id)) {
					active_dashboard_id = dashboards.length > 0 ? dashboards[0].id : null;
				}
			} catch (err) {
				error = String(err);
			}
		},
	};
}
