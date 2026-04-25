<script lang="ts">
	import type { Issue } from '$lib/types/issue';
	import type { Action } from '$lib/types/action';
	import type { GitHubStatusCache } from '$lib/types/github';
	import type { GitStatusCache } from '$lib/types/git_status';
	import type { IssueCardCallbacks } from '$lib/types/issue_card_callbacks';
	import IssueCard from './IssueCard.svelte';

	interface Props extends IssueCardCallbacks {
		parentIssues: Issue[];
		archivedIssues: Issue[];
		showArchived: boolean;
		isPortfolio: boolean;
		actions?: Action[];
		forceExpanded?: boolean;
		githubCacheMap?: Map<string, GitHubStatusCache>;
		ghAvailable?: boolean;
		getChildren: (parentId: string) => Issue[];
		getGitStatus: (issueId: string) => GitStatusCache | undefined;
		getNotificationDotColor?: (issueId: string) => string | null;
		getProgressLines?: (issueId: string) => readonly string[];
	}

	let {
		parentIssues,
		archivedIssues,
		showArchived,
		isPortfolio,
		actions = [],
		forceExpanded,
		githubCacheMap = new Map(),
		ghAvailable = false,
		getChildren,
		getGitStatus,
		getNotificationDotColor,
		getProgressLines,
		onArchive,
		onUnarchive,
		onEdit,
		onDelete,
		onSetupWorktree,
		onRemoveWorktree,
		onExecuteAction,
	}: Props = $props();
</script>

<div class="flex flex-col gap-2">
	{#each parentIssues as issue (issue.id)}
		{@const children = isPortfolio ? getChildren(issue.id) : []}

		<IssueCard
			{issue}
			{actions}
			githubCache={githubCacheMap.get(issue.id)}
			{ghAvailable}
			gitStatus={getGitStatus(issue.id)}
			notificationDotColor={getNotificationDotColor?.(issue.id) ?? null}
			childCount={children.length}
			{forceExpanded}
			progressLines={getProgressLines?.(issue.id) ?? []}
			{onArchive}
			{onUnarchive}
			{onEdit}
			{onDelete}
			{onSetupWorktree}
			{onRemoveWorktree}
			{onExecuteAction}
		/>

		<!-- Nested children for portfolio dashboards -->
		{#if isPortfolio && children.length > 0}
			{#each children as child, index (child.id)}
				<IssueCard
					issue={child}
					{actions}
					githubCache={githubCacheMap.get(child.id)}
					{ghAvailable}
					gitStatus={getGitStatus(child.id)}
					notificationDotColor={getNotificationDotColor?.(child.id) ?? null}
					indented={true}
					isLastChild={index === children.length - 1}
					{forceExpanded}
					progressLines={getProgressLines?.(child.id) ?? []}
					{onArchive}
					{onUnarchive}
					{onEdit}
					{onDelete}
					{onSetupWorktree}
					{onRemoveWorktree}
					{onExecuteAction}
				/>
			{/each}
		{/if}
	{/each}

	<!-- Archived section -->
	{#if showArchived && archivedIssues.length > 0}
		<div class="mt-4 border-t border-border pt-4">
			<h3
				class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60"
			>
				Archived ({archivedIssues.length})
			</h3>
			<div class="flex flex-col gap-2">
				{#each archivedIssues as issue (issue.id)}
					<IssueCard
						{issue}
						githubCache={githubCacheMap.get(issue.id)}
						{ghAvailable}
						gitStatus={getGitStatus(issue.id)}
						{onArchive}
						{onUnarchive}
						{onEdit}
						{onDelete}
					/>
				{/each}
			</div>
		</div>
	{/if}
</div>
