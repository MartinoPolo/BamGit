<script lang="ts">
	import { useIssueCard } from '$lib/modules/issue-card/index.js';
	import GitHubBadge from '$lib/components/derived/github-badge/GitHubBadge.svelte';

	const ctx = useIssueCard();
</script>

<div class="flex min-h-5.5 flex-wrap items-center gap-1">
	{#if ctx.cache?.github_issue_state}
		<GitHubBadge
			type="issue"
			state={ctx.cache.github_issue_state}
			url={ctx.issue.github_issue_url}
			number={ctx.issue.github_issue_number}
			disabled={!ctx.ghAvailable}
		/>
	{/if}
	{#if ctx.cache?.pr_state}
		<GitHubBadge
			type="pr"
			state={ctx.cache.pr_state}
			url={ctx.cache.pr_url}
			number={ctx.cache.pr_number}
			disabled={!ctx.ghAvailable}
		/>
	{/if}
	<!-- CI badge: wire when prCiStatus is added to IssueCardContextProps (PRD #255) -->
</div>
