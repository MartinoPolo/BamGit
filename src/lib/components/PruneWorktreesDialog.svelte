<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import type { PrunableIssue } from '$lib/types/worktree';

	interface Props {
		open: boolean;
		prunable_issues: PrunableIssue[];
		removing: boolean;
		on_close: () => void;
		on_prune: (issue_ids: string[]) => void;
	}

	let { open, prunable_issues, removing, on_close, on_prune }: Props = $props();

	let selected_ids = $state(new SvelteSet<string>());

	// Reset selection when dialog opens with new data
	$effect(() => {
		if (open) {
			selected_ids = new SvelteSet(prunable_issues.map((issue) => issue.issue_id));
		}
	});

	function toggle_selection(issue_id: string) {
		if (selected_ids.has(issue_id)) {
			selected_ids.delete(issue_id);
		} else {
			selected_ids.add(issue_id);
		}
	}

	function handle_prune() {
		on_prune([...selected_ids]);
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				on_close();
			}
		}}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="absolute inset-0" onclick={on_close}></div>
		<div
			class="relative z-10 w-full max-w-lg rounded-lg border border-border bg-popover shadow-xl"
		>
			<div class="border-b border-border px-4 py-3">
				<h2 class="text-sm font-semibold">Prune Worktrees</h2>
				<p class="mt-1 text-xs text-muted-foreground">
					These issues have merged PRs and closed GitHub issues. Select which worktrees to
					remove.
				</p>
			</div>

			<div class="max-h-64 overflow-y-auto px-4 py-3">
				{#if prunable_issues.length === 0}
					<p class="text-sm text-muted-foreground">No prunable worktrees found.</p>
				{:else}
					<div class="flex flex-col gap-2">
						{#each prunable_issues as issue (issue.issue_id)}
							<label
								class="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-accent"
							>
								<input
									type="checkbox"
									checked={selected_ids.has(issue.issue_id)}
									onchange={() => toggle_selection(issue.issue_id)}
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
										merged
									</span>
									<span
										class="rounded bg-red-900/40 px-1.5 py-0.5 text-[10px] text-red-400"
									>
										closed
									</span>
								</div>
							</label>
						{/each}
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
				<button
					onclick={on_close}
					disabled={removing}
					class="rounded px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					Cancel
				</button>
				<button
					onclick={handle_prune}
					disabled={selected_ids.size === 0 || removing}
					class="rounded bg-destructive px-3 py-1.5 text-sm text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-40"
				>
					{#if removing}
						Removing...
					{:else}
						Remove {selected_ids.size} worktree{selected_ids.size !== 1 ? 's' : ''}
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
