<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import type { Action, GitStatusCache } from '$lib/types/generated';
	import type { IssueCardCallbacks } from '$lib/modules/issues';
	import IssueCard from './IssueCard.svelte';

	interface Props extends IssueCardCallbacks {
		parentIssues: Issue[];
		archivedIssues: Issue[];
		showArchived: boolean;
		isPortfolio: boolean;
		actions?: Action[];
		forceExpanded?: boolean;
		cacheMap?: Map<string, GitStatusCache>;
		ghAvailable?: boolean;
		getChildren: (parentId: string) => Issue[];
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
		cacheMap = new Map(),
		ghAvailable = false,
		getChildren,
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
			cache={cacheMap.get(issue.id)}
			{ghAvailable}
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
					cache={cacheMap.get(child.id)}
					{ghAvailable}
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
						cache={cacheMap.get(issue.id)}
						{ghAvailable}
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
