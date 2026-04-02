import type { Action } from '$lib/types/action';
import { get_actions_for_dashboard } from '$lib/tauri/action_commands';

let actions = $state<Action[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let current_dashboard_id = $state<string | null>(null);

const visible_actions = $derived(actions.filter((action) => action.visible));

export function get_action_store() {
	return {
		get actions() {
			return actions;
		},
		get visible_actions() {
			return visible_actions;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},

		async load_actions(dashboard_id: string) {
			try {
				loading = true;
				current_dashboard_id = dashboard_id;
				actions = await get_actions_for_dashboard(dashboard_id);
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		async refresh() {
			if (current_dashboard_id) {
				try {
					actions = await get_actions_for_dashboard(current_dashboard_id);
					error = null;
				} catch (err) {
					error = String(err);
				}
			}
		},
	};
}
