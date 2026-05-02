<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import type { Issue } from '$lib/modules/issues';
	import type { Snippet } from 'svelte';

	interface Props {
		issue: Issue;
		children: Snippet;
	}

	let { issue, children }: Props = $props();
</script>

<Tooltip.Root delayDuration={400}>
	<Tooltip.Trigger>
		{#snippet child({ props })}
			<div {...props}>
				{@render children()}
			</div>
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Content side="top" sideOffset={8}>
		<div class="flex flex-col gap-1 text-xs">
			<span class="font-medium">{issue.name}</span>
			{#if issue.priority}
				<span class="text-muted-foreground">
					{m.issue_card_tooltip_priority()}
					{issue.priority}
				</span>
			{/if}
			{#if issue.github_issue_url}
				<span class="text-muted-foreground">
					{m.issue_card_tooltip_github()} #{issue.github_issue_number}
				</span>
			{/if}
			<span class="text-muted-foreground">
				{m.issue_card_tooltip_branch()}
				{issue.branch_name ?? m.issue_card_no_branch()}
			</span>
			<span class="text-muted-foreground">
				{m.issue_card_tooltip_worktree()}
				{issue.worktree_state}
			</span>
		</div>
	</Tooltip.Content>
</Tooltip.Root>
