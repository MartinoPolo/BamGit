<script lang="ts">
	import type { Issue } from '$lib/types/issue';
	import type { GitStatusCache } from '$lib/types/git_status';
	import IssueCard from './IssueCard.svelte';

	interface Props {
		parent_issues: Issue[];
		archived_issues: Issue[];
		show_archived: boolean;
		is_portfolio: boolean;
		force_expanded?: boolean;
		get_children: (parent_id: string) => Issue[];
		get_git_status: (issue_id: string) => GitStatusCache | undefined;
		on_archive: (id: string) => void;
		on_unarchive: (id: string) => void;
		on_edit: (issue: Issue) => void;
		on_delete: (id: string) => void;
	}

	let {
		parent_issues,
		archived_issues,
		show_archived,
		is_portfolio,
		force_expanded,
		get_children,
		get_git_status,
		on_archive,
		on_unarchive,
		on_edit,
		on_delete,
	}: Props = $props();
</script>

<div class="flex flex-col gap-2">
	{#each parent_issues as issue (issue.id)}
		{@const children = is_portfolio ? get_children(issue.id) : []}

		<IssueCard
			{issue}
			git_status={get_git_status(issue.id)}
			child_count={children.length}
			{force_expanded}
			{on_archive}
			{on_unarchive}
			{on_edit}
			{on_delete}
		/>

		<!-- Nested children for portfolio dashboards -->
		{#if is_portfolio && children.length > 0}
			{#each children as child, index (child.id)}
				<IssueCard
					issue={child}
					git_status={get_git_status(child.id)}
					indented={true}
					is_last_child={index === children.length - 1}
					{force_expanded}
					{on_archive}
					{on_unarchive}
					{on_edit}
					{on_delete}
				/>
			{/each}
		{/if}
	{/each}

	<!-- Archived section -->
	{#if show_archived && archived_issues.length > 0}
		<div class="mt-4 border-t border-neutral-800 pt-4">
			<h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
				Archived ({archived_issues.length})
			</h3>
			<div class="flex flex-col gap-2">
				{#each archived_issues as issue (issue.id)}
					<IssueCard
						{issue}
						git_status={get_git_status(issue.id)}
						{on_archive}
						{on_unarchive}
						{on_edit}
						{on_delete}
					/>
				{/each}
			</div>
		</div>
	{/if}
</div>
