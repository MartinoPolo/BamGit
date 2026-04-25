<script lang="ts">
	import type { GitStatusCache } from '$lib/types/git_status';
	import BranchStatusBadge from './BranchStatusBadge.svelte';
	import SyncBadge from './SyncBadge.svelte';
	import MergeConflictBadge from './MergeConflictBadge.svelte';

	interface Props {
		branchName: string;
		gitStatus: GitStatusCache | undefined;
	}

	let { branchName, gitStatus }: Props = $props();

	const branchStatus = $derived(gitStatus?.branch_status ?? 'unknown');
</script>

<div class="flex items-center gap-1">
	<BranchStatusBadge {branchName} status={branchStatus} />

	{#if gitStatus?.behind_base_count != null}
		<SyncBadge behindBaseCount={gitStatus.behind_base_count} />
	{/if}

	{#if gitStatus?.merge_conflict === true}
		<MergeConflictBadge />
	{/if}
</div>
