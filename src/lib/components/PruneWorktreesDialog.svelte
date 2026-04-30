<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { SvelteSet } from 'svelte/reactivity';
	import type { PrunableIssue } from '$lib/types/generated';

	interface Props {
		open: boolean;
		prunableIssues: PrunableIssue[];
		removing: boolean;
		onClose: () => void;
		onPrune: (issueIds: string[]) => void;
	}

	let { open, prunableIssues, removing, onClose, onPrune }: Props = $props();

	let selectedIds = $state(new SvelteSet<string>());

	// Reset selection when dialog opens with new data
	$effect(() => {
		if (open) {
			selectedIds = new SvelteSet(prunableIssues.map((issue) => issue.issue_id));
		}
	});

	function toggleSelection(issueId: string) {
		if (selectedIds.has(issueId)) {
			selectedIds.delete(issueId);
		} else {
			selectedIds.add(issueId);
		}
	}

	function handlePrune() {
		onPrune([...selectedIds]);
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/60"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				onClose();
			}
		}}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="absolute inset-0" onclick={onClose}></div>
		<div
			class="relative z-[var(--z-raised)] w-full max-w-lg rounded-lg border border-border bg-popover shadow-xl"
		>
			<div class="border-b border-border px-4 py-3">
				<h2 class="text-sm font-semibold">{m.prune_title()}</h2>
				<p class="mt-1 text-xs text-muted-foreground">
					{m.prune_description()}
				</p>
			</div>

			<div class="max-h-64 overflow-y-auto px-4 py-3">
				{#if prunableIssues.length === 0}
					<p class="text-sm text-muted-foreground">{m.prune_empty()}</p>
				{:else}
					<div class="flex flex-col gap-2">
						{#each prunableIssues as issue (issue.issue_id)}
							<label
								class="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-accent"
							>
								<input
									type="checkbox"
									checked={selectedIds.has(issue.issue_id)}
									onchange={() => toggleSelection(issue.issue_id)}
									class="rounded border-input"
								/>
								<div class="min-w-0 flex-1">
									<div class="truncate text-sm">{issue.name}</div>
									<div class="text-xs text-muted-foreground">
										{issue.branch_name}
										{#if issue.worktree_folder}
											<span class="text-muted-foreground/60">
												— {issue.worktree_folder}
											</span>
										{/if}
									</div>
								</div>
								<div class="flex items-center gap-1">
									<span
										class="rounded bg-purple-900/40 px-1.5 py-0.5 text-[10px] text-purple-400"
									>
										{m.prune_badge_merged()}
									</span>
									<span
										class="rounded bg-red-900/40 px-1.5 py-0.5 text-[10px] text-red-400"
									>
										{m.prune_badge_closed()}
									</span>
								</div>
							</label>
						{/each}
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
				<button
					onclick={onClose}
					disabled={removing}
					class="rounded px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					{m.btn_cancel()}
				</button>
				<button
					onclick={handlePrune}
					disabled={selectedIds.size === 0 || removing}
					class="rounded bg-destructive px-3 py-1.5 text-sm text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-40"
				>
					{#if removing}
						{m.prune_removing()}
					{:else}
						{selectedIds.size !== 1
							? m.prune_remove_count_plural({ count: selectedIds.size })
							: m.prune_remove_count({ count: selectedIds.size })}
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
