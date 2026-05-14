<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { SvelteSet } from 'svelte/reactivity';
	import type { PrunableIssue } from '$lib/types/generated';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Kbd } from '$lib/components/shadcn/kbd/index.js';
	import CornerDownLeftIcon from '@lucide/svelte/icons/corner-down-left';
	import { Checkbox } from '$lib/components/shadcn/checkbox/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';

	interface Props {
		open: boolean;
		prunableIssues: PrunableIssue[];
		removing: boolean;
		onClose: () => void;
		onPrune: (issueIds: string[]) => void;
	}

	let { open, prunableIssues, removing, onClose, onPrune }: Props = $props();

	const selectedIds = new SvelteSet<string>();

	$effect(() => {
		if (open) {
			selectedIds.clear();
			for (const issue of prunableIssues) {
				selectedIds.add(issue.issue_id);
			}
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

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			onClose();
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-lg" onEscapeKeydown={(e) => e.stopPropagation()}>
		<Dialog.Header>
			<Dialog.Title>{m.prune_title()}</Dialog.Title>
			<Dialog.Description>{m.prune_description()}</Dialog.Description>
		</Dialog.Header>

		<Dialog.Body class="max-h-64 overflow-y-auto">
			{#if prunableIssues.length === 0}
				<p class="text-sm text-muted-foreground">{m.prune_empty()}</p>
			{:else}
				<div class="flex flex-col gap-2">
					{#each prunableIssues as issue (issue.issue_id)}
						<label
							class="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-accent"
						>
							<Checkbox
								checked={selectedIds.has(issue.issue_id)}
								onCheckedChange={() => toggleSelection(issue.issue_id)}
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
								<Badge tone="merged" size="compact">{m.prune_badge_merged()}</Badge>
								<Badge tone="danger" size="compact">{m.prune_badge_closed()}</Badge>
							</div>
						</label>
					{/each}
				</div>
			{/if}
		</Dialog.Body>

		<Dialog.Footer>
			<Button intent="ghost" onclick={onClose} disabled={removing}>
				{m.btn_cancel()}
				<Kbd>Esc</Kbd>
			</Button>
			<Button
				intent="primary-destructive"
				onclick={handlePrune}
				disabled={selectedIds.size === 0 || removing}
			>
				{#if removing}
					{m.prune_removing()}
				{:else}
					{selectedIds.size !== 1
						? m.prune_remove_count_plural({ count: selectedIds.size })
						: m.prune_remove_count({ count: selectedIds.size })}
				{/if}
				<Kbd format="lucide" tone="inverted"><CornerDownLeftIcon /></Kbd>
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
