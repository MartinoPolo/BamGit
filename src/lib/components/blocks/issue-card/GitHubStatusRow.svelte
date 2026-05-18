<script lang="ts">
	import { useIssueCard } from './index.js';
	import GitHubBadge from '$lib/components/derived/github-badge/GitHubBadge.svelte';
	import { CiBadge } from '$lib/components/derived/ci-badge/index.js';

	const ctx = useIssueCard();

	const ciStatus = $derived(ctx.cache?.pr_ci_status as 'passed' | 'failed' | 'running' | null);
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
	{#if ciStatus !== null && ciStatus !== undefined}
		<CiBadge status={ciStatus} />
	{/if}
</div>
