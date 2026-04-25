import type { Issue } from './issue';

export interface IssueCardCallbacks {
	on_archive: (id: string) => void;
	on_unarchive: (id: string) => void;
	on_edit: (issue: Issue) => void;
	on_delete: (id: string) => void;
	on_setup_worktree?: (issue: Issue) => void;
	on_remove_worktree?: (issue: Issue) => void;
	on_execute_action?: (action_id: string, issue_id: string) => void;
}
