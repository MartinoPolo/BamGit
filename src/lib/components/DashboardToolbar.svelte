<script lang="ts">
	import { RefreshCw, Scissors } from 'lucide-svelte';
	import type { SortMode } from '$lib/modules/issues/index.svelte.js';
	import type { ViewMode } from '$lib/context/view_preference.context.svelte.js';
	import ViewToggle from '$lib/components/ViewToggle.svelte';

	interface Props {
		sortMode: SortMode;
		showArchived: boolean;
		archivedCount: number;
		allExpanded: boolean;
		ghAvailable?: boolean;
		syncing?: boolean;
		viewMode?: ViewMode;
		onAddIssue: () => void;
		onSortChange: (mode: SortMode) => void;
		onToggleArchived: () => void;
		onToggleExpandAll: () => void;
		onSyncAll?: () => void;
		onPruneWorktrees?: () => void;
		onViewModeChange?: (mode: ViewMode) => void;
	}

	let {
		sortMode,
		showArchived,
		archivedCount,
		allExpanded,
		ghAvailable = false,
		syncing = false,
		viewMode,
		onAddIssue,
		onSortChange,
		onToggleArchived,
		onToggleExpandAll,
		onSyncAll,
		onPruneWorktrees,
		onViewModeChange,
	}: Props = $props();
</script>

<div class="flex items-center gap-2">
	<button
		onclick={onAddIssue}
		class="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
	>
		+ Add Issue
	</button>

	<!-- Sync All -->
	{#if onSyncAll}
		<button
			onclick={onSyncAll}
			disabled={!ghAvailable || syncing}
			class="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-input hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
			title={ghAvailable ? 'Sync GitHub state for all issues' : 'gh CLI not available'}
		>
			<RefreshCw size={13} class={syncing ? 'animate-spin' : ''} />
			{syncing ? 'Syncing...' : 'Sync All'}
		</button>
	{/if}

	<!-- Prune Worktrees -->
	{#if onPruneWorktrees}
		<button
			onclick={onPruneWorktrees}
			class="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-input hover:text-foreground"
			title="Prune worktrees for fully-closed issues"
		>
			<Scissors size={13} />
			Prune
		</button>
	{/if}

	<div class="flex-1"></div>

	<!-- View mode toggle -->
	{#if viewMode !== undefined && onViewModeChange}
		<ViewToggle {viewMode} onChange={onViewModeChange} />
	{/if}

	<!-- Collapse/expand all -->
	<button
		onclick={onToggleExpandAll}
		class="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
		title={allExpanded ? 'Collapse all' : 'Expand all'}
	>
		{allExpanded ? '▾ Collapse' : '▸ Expand'}
	</button>

	<!-- Sort control -->
	<label class="flex items-center gap-1.5 text-sm text-muted-foreground">
		<span class="text-xs">Sort:</span>
		<select
			value={sortMode}
			onchange={(e) => onSortChange(e.currentTarget.value as SortMode)}
			class="rounded border border-border bg-muted px-2 py-1 text-xs text-foreground outline-none focus:border-ring"
		>
			<option value="date">Date</option>
			<option value="priority">Priority</option>
			<option value="name">Name</option>
		</select>
	</label>

	<!-- Show archived toggle -->
	{#if archivedCount > 0}
		<button
			onclick={onToggleArchived}
			class="rounded px-2 py-1 text-xs transition-colors {showArchived
				? 'bg-muted text-foreground'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			{showArchived ? 'Hide' : 'Show'} archived ({archivedCount})
		</button>
	{/if}
</div>
