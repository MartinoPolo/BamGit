<script lang="ts">
	import { RefreshCw, Scissors } from 'lucide-svelte';
	import type { SortMode } from '$lib/stores/issues.svelte';

	interface Props {
		sort_mode: SortMode;
		show_archived: boolean;
		archived_count: number;
		all_expanded: boolean;
		gh_available?: boolean;
		syncing?: boolean;
		on_add_issue: () => void;
		on_sort_change: (mode: SortMode) => void;
		on_toggle_archived: () => void;
		on_toggle_expand_all: () => void;
		on_sync_all?: () => void;
		on_prune_worktrees?: () => void;
	}

	let {
		sort_mode,
		show_archived,
		archived_count,
		all_expanded,
		gh_available = false,
		syncing = false,
		on_add_issue,
		on_sort_change,
		on_toggle_archived,
		on_toggle_expand_all,
		on_sync_all,
		on_prune_worktrees,
	}: Props = $props();
</script>

<div class="flex items-center gap-2">
	<button
		onclick={on_add_issue}
		class="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
	>
		+ Add Issue
	</button>

	<!-- Sync All -->
	{#if on_sync_all}
		<button
			onclick={on_sync_all}
			disabled={!gh_available || syncing}
			class="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-input hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
			title={gh_available ? 'Sync GitHub state for all issues' : 'gh CLI not available'}
		>
			<RefreshCw size={13} class={syncing ? 'animate-spin' : ''} />
			{syncing ? 'Syncing...' : 'Sync All'}
		</button>
	{/if}

	<!-- Prune Worktrees -->
	{#if on_prune_worktrees}
		<button
			onclick={on_prune_worktrees}
			class="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-input hover:text-foreground"
			title="Prune worktrees for fully-closed issues"
		>
			<Scissors size={13} />
			Prune
		</button>
	{/if}

	<div class="flex-1"></div>

	<!-- Collapse/expand all -->
	<button
		onclick={on_toggle_expand_all}
		class="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
		title={all_expanded ? 'Collapse all' : 'Expand all'}
	>
		{all_expanded ? '▾ Collapse' : '▸ Expand'}
	</button>

	<!-- Sort control -->
	<label class="flex items-center gap-1.5 text-sm text-muted-foreground">
		<span class="text-xs">Sort:</span>
		<select
			value={sort_mode}
			onchange={(e) => on_sort_change(e.currentTarget.value as SortMode)}
			class="rounded border border-border bg-muted px-2 py-1 text-xs text-foreground outline-none focus:border-ring"
		>
			<option value="date">Date</option>
			<option value="priority">Priority</option>
			<option value="name">Name</option>
		</select>
	</label>

	<!-- Show archived toggle -->
	{#if archived_count > 0}
		<button
			onclick={on_toggle_archived}
			class="rounded px-2 py-1 text-xs transition-colors {show_archived
				? 'bg-muted text-foreground'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			{show_archived ? 'Hide' : 'Show'} archived ({archived_count})
		</button>
	{/if}
</div>
