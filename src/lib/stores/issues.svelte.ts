import type { Issue } from '$lib/types/issue';
import { get_issues_for_dashboard } from '$lib/tauri/issue_commands';

export type SortMode = 'priority' | 'name' | 'date';

const PRIORITY_ORDER: Record<string, number> = { top: 0, high: 1, medium: 2, low: 3 };

let issues = $state<Issue[]>([]);
let sort_mode = $state<SortMode>('date');
let show_archived = $state(false);
let loading = $state(false);
let error = $state<string | null>(null);
let current_dashboard_id = $state<string | null>(null);

const sorted_issues = $derived.by(() => {
	const list = [...issues];
	switch (sort_mode) {
		case 'priority':
			return list.sort(
				(a, b) =>
					(PRIORITY_ORDER[a.priority ?? 'low'] ?? 4) -
					(PRIORITY_ORDER[b.priority ?? 'low'] ?? 4),
			);
		case 'name':
			return list.sort((a, b) => a.name.localeCompare(b.name));
		case 'date':
			return list.sort(
				(a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
			);
	}
});

const active_issues = $derived(sorted_issues.filter((issue) => issue.status === 'active'));
const archived_issues = $derived(sorted_issues.filter((issue) => issue.status === 'archived'));

const parent_issues = $derived(active_issues.filter((issue) => !issue.parent_issue_id));

function get_children(parent_id: string): Issue[] {
	return active_issues.filter((issue) => issue.parent_issue_id === parent_id);
}

export function get_issue_store() {
	return {
		get issues() {
			return issues;
		},
		get active_issues() {
			return active_issues;
		},
		get archived_issues() {
			return archived_issues;
		},
		get parent_issues() {
			return parent_issues;
		},
		get sort_mode() {
			return sort_mode;
		},
		get show_archived() {
			return show_archived;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},

		get_children,

		async load_issues(dashboard_id: string) {
			try {
				loading = true;
				current_dashboard_id = dashboard_id;
				issues = await get_issues_for_dashboard(dashboard_id, true);
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
					issues = await get_issues_for_dashboard(current_dashboard_id, true);
					error = null;
				} catch (err) {
					error = String(err);
				}
			}
		},

		set_sort_mode(mode: SortMode) {
			sort_mode = mode;
		},

		toggle_show_archived() {
			show_archived = !show_archived;
		},
	};
}
