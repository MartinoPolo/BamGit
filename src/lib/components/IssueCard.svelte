<script lang="ts">
	import type { Issue } from '$lib/types/issue';

	interface Props {
		issue: Issue;
		indented?: boolean;
		is_last_child?: boolean;
		child_count?: number;
		force_expanded?: boolean;
		on_archive: (id: string) => void;
		on_unarchive: (id: string) => void;
		on_edit: (issue: Issue) => void;
		on_delete: (id: string) => void;
	}

	let {
		issue,
		indented = false,
		is_last_child = false,
		child_count = 0,
		force_expanded,
		on_archive,
		on_unarchive,
		on_edit,
		on_delete,
	}: Props = $props();

	let local_expanded = $state(false);
	const expanded = $derived(force_expanded ?? local_expanded);
	let show_overflow = $state(false);

	const color = $derived(issue.color ?? '#525252');
	const is_archived = $derived(issue.status === 'archived');

	const priority_border_class = $derived.by(() => {
		switch (issue.priority) {
			case 'top':
				return 'border-l-red-500';
			case 'high':
				return 'border-l-orange-400';
			case 'medium':
				return 'border-l-yellow-400';
			case 'low':
				return 'border-l-blue-400';
			default:
				return 'border-l-transparent';
		}
	});
</script>

<div
	class="group flex rounded border border-l-[3px] border-neutral-800 transition-colors {priority_border_class} {is_archived
		? 'opacity-50'
		: 'hover:border-neutral-700'}"
	class:ml-6={indented}
>
	<!-- Tree connector for nested children -->
	{#if indented}
		<div class="relative -ml-6 w-6 flex-shrink-0">
			<div
				class="absolute top-0 left-3 h-1/2 w-px bg-neutral-700"
				class:h-full={!is_last_child}
			></div>
			<div class="absolute top-1/2 left-3 h-px w-3 bg-neutral-700"></div>
		</div>
	{/if}

	<!-- Color identity strip -->
	<div class="w-10 flex-shrink-0 rounded-l" style="background-color: {color}">
		<div class="flex h-full items-start justify-center pt-3">
			<div class="h-2 w-2 rounded-full bg-white/30" title="Session state: idle"></div>
		</div>
	</div>

	<!-- Content area -->
	<div class="flex min-w-0 flex-1 flex-col">
		<!-- Header -->
		<div class="flex items-center gap-2 px-3 py-2">
			<button
				onclick={() => (local_expanded = !local_expanded)}
				class="text-xs text-neutral-500 transition-transform {expanded
					? 'rotate-90'
					: ''} hover:text-neutral-300"
				title={expanded ? 'Collapse' : 'Expand'}
			>
				▸
			</button>

			<span class="min-w-0 flex-1 truncate text-sm font-medium">{issue.name}</span>

			<!-- Child count for parent issues -->
			{#if child_count > 0}
				<span class="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
					{child_count} child{child_count > 1 ? 'ren' : ''}
				</span>
			{/if}

			<!-- Placeholder badge area -->
			<div class="flex items-center gap-1">
				{#if issue.github_issue_number}
					<span class="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
						#{issue.github_issue_number}
					</span>
				{/if}
				<span
					class="rounded bg-neutral-800/50 px-1.5 py-0.5 text-[10px] text-neutral-600"
					title="Badges populated in later slices"
				>
					badges
				</span>
			</div>

			<!-- Action buttons -->
			<div class="relative">
				<button
					onclick={() => (show_overflow = !show_overflow)}
					class="rounded p-1 text-neutral-500 opacity-0 transition-opacity hover:bg-neutral-800 hover:text-neutral-300 group-hover:opacity-100"
				>
					⋯
				</button>

				{#if show_overflow}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="absolute right-0 z-10 mt-1 min-w-[140px] rounded border border-neutral-700 bg-neutral-800 py-1 shadow-lg"
						onmouseleave={() => (show_overflow = false)}
					>
						<button
							onclick={() => {
								on_edit(issue);
								show_overflow = false;
							}}
							class="w-full px-3 py-1.5 text-left text-sm text-neutral-300 hover:bg-neutral-700"
						>
							Edit
						</button>
						{#if is_archived}
							<button
								onclick={() => {
									on_unarchive(issue.id);
									show_overflow = false;
								}}
								class="w-full px-3 py-1.5 text-left text-sm text-neutral-300 hover:bg-neutral-700"
							>
								Unarchive
							</button>
						{:else}
							<button
								onclick={() => {
									on_archive(issue.id);
									show_overflow = false;
								}}
								class="w-full px-3 py-1.5 text-left text-sm text-neutral-300 hover:bg-neutral-700"
							>
								Archive
							</button>
						{/if}
						<button
							onclick={() => {
								on_delete(issue.id);
								show_overflow = false;
							}}
							class="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-neutral-700"
						>
							Delete
						</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Expanded section (placeholder for future slices) -->
		{#if expanded}
			<div class="border-t border-neutral-800 px-3 py-3 text-xs text-neutral-500">
				<div class="grid grid-cols-2 gap-2">
					<div>
						<span class="text-neutral-600">Status:</span>
						{issue.status}
					</div>
					<div>
						<span class="text-neutral-600">Worktree:</span>
						{issue.worktree_state}
					</div>
					{#if issue.priority}
						<div>
							<span class="text-neutral-600">Priority:</span>
							{issue.priority}
						</div>
					{/if}
					{#if issue.created_at}
						<div>
							<span class="text-neutral-600">Created:</span>
							{new Date(issue.created_at).toLocaleDateString()}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
