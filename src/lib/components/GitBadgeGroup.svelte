<script lang="ts">
	import type { BranchStatus, GitStatusCache } from '$lib/types/git_status';
	import BranchStatusBadge from './BranchStatusBadge.svelte';
	import SyncBadge from './SyncBadge.svelte';
	import MergeConflictBadge from './MergeConflictBadge.svelte';

	interface Props {
		branch_name: string;
		git_status: GitStatusCache | undefined;
	}

	let { branch_name, git_status }: Props = $props();

	const branch_status = $derived(git_status?.branch_status ?? 'unknown');
</script>

<div class="flex items-center gap-1">
	<BranchStatusBadge {branch_name} status={branch_status} />

	{#if git_status?.behind_base_count != null}
		<SyncBadge behind_base_count={git_status.behind_base_count} />
	{/if}

	{#if git_status?.merge_conflict === true}
		<MergeConflictBadge />
	{/if}
</div>
