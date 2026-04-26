import type { Issue } from '$lib/modules/issues/index.svelte.js';

export interface IssueCardCallbacks {
	onArchive: (id: string) => void;
	onUnarchive: (id: string) => void;
	onEdit: (issue: Issue) => void;
	onDelete: (id: string) => void;
	onSetupWorktree?: (issue: Issue) => void;
	onRemoveWorktree?: (issue: Issue) => void;
	onExecuteAction?: (actionId: string, issueId: string) => void;
}
