import { createContext } from 'svelte';
import { invoke } from '@tauri-apps/api/core';
import type { Action } from '$lib/types/generated';

// ─── Frontend-only request types ──────────────────────────────────────────

// fallow-ignore-next-line unused-types
export interface CreateActionRequest {
	dashboard_id?: string | null;
	name: string;
	icon?: string | null;
	command_template: string;
	sort_order?: number;
	visible?: boolean;
}

// fallow-ignore-next-line unused-types
export interface UpdateActionRequest {
	id: string;
	name?: string;
	icon?: string | null;
	command_template?: string;
	sort_order?: number;
	visible?: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────

type ActionsContext = ReturnType<typeof createActionsContext>;

const [useActions, setActionsInternal] = createContext<ActionsContext>();
export { useActions };

export function setActionsContext() {
	const ctx = createActionsContext();
	setActionsInternal(ctx);
	return ctx;
}

// ─── Factory ──────────────────────────────────────────────────────────────

function createActionsContext() {
	let actions = $state<Action[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let currentDashboardId = $state<string | null>(null);

	const visibleActions = $derived(actions.filter((action) => action.visible));

	async function fetchAndSetActions(showLoading: boolean) {
		if (currentDashboardId === null) {
			return;
		}
		try {
			if (showLoading) {
				loading = true;
			}
			actions = await invoke<Action[]>('get_actions_for_dashboard', {
				dashboardId: currentDashboardId,
			});
			error = null;
		} catch (err) {
			error = String(err);
		} finally {
			if (showLoading) {
				loading = false;
			}
		}
	}

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
			currentDashboardId = dashboardId;
			await fetchAndSetActions(true);
		},

		async refresh() {
			await fetchAndSetActions(false);
		},

		// Action commands (inlined)
		async createAction(request: CreateActionRequest): Promise<Action> {
			return invoke('create_action', { request });
		},

		async getAction(id: string): Promise<Action> {
			return invoke('get_action', { id });
		},

		async updateAction(request: UpdateActionRequest): Promise<Action> {
			return invoke('update_action', { request });
		},

		async deleteAction(id: string): Promise<void> {
			return invoke('delete_action', { id });
		},

		async reorderActions(actionIds: string[]): Promise<void> {
			return invoke('reorder_actions', { actionIds });
		},

		async executeAction(actionId: string, issueId: string): Promise<string> {
			return invoke('execute_action', { actionId, issueId });
		},
	};
}
