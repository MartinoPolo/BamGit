import { createContext } from 'svelte';
import type { Action } from '$lib/types/action';
import { getActionsForDashboard } from '$lib/tauri/action_commands';

type ActionsContext = ReturnType<typeof createActionsContext>;

const [useActions, setActionsInternal] = createContext<ActionsContext>();
export { useActions };

export function setActionsContext() {
	const ctx = createActionsContext();
	setActionsInternal(ctx);
	return ctx;
}

function createActionsContext() {
	let actions = $state<Action[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let currentDashboardId = $state<string | null>(null);

	const visibleActions = $derived(actions.filter((action) => action.visible));

	return {
		get actions() {
			return actions;
		},
		get visibleActions() {
			return visibleActions;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},

		async loadActions(dashboardId: string) {
			try {
				loading = true;
				currentDashboardId = dashboardId;
				actions = await getActionsForDashboard(dashboardId);
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		async refresh() {
			if (currentDashboardId) {
				try {
					actions = await getActionsForDashboard(currentDashboardId);
					error = null;
				} catch (err) {
					error = String(err);
				}
			}
		},
	};
}
