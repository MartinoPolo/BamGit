<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Issue } from '$lib/modules/issues';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';

	interface Props {
		issue: Issue | null;
		unfinishedSessionCount: number;
		openPrCount: number;
		hasActiveWorktree: boolean;
		onClose: () => void;
		onConfirm: (removeWorktree: boolean) => void;
	}

	let {
		issue,
		unfinishedSessionCount,
		openPrCount,
		hasActiveWorktree,
		onClose,
		onConfirm,
	}: Props = $props();

	let removeWorktree = $state(false);
	const open = $derived(issue !== null);

	$effect(() => {
		if (issue !== null) {
			removeWorktree = false;
		}
	});

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			onClose();
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-sm" onEscapeKeydown={(e) => e.stopPropagation()}>
		{#if issue}
			<Dialog.Header>
				<Dialog.Title>{m.archive_confirm_title()}</Dialog.Title>
				<Dialog.Description>
					{m.archive_confirm_body({ name: issue.name })}
				</Dialog.Description>
			</Dialog.Header>

			<Dialog.Body>
				{#if unfinishedSessionCount > 0 || openPrCount > 0}
					<div class="flex flex-col gap-1">
						{#if unfinishedSessionCount > 0}
							<p class="text-sm font-medium text-destructive">
								{m.archive_unfinished_sessions({ count: unfinishedSessionCount })}
							</p>
						{/if}
						{#if openPrCount > 0}
							<p class="text-sm font-medium text-destructive">
								{m.archive_open_prs({ count: openPrCount })}
							</p>
						{/if}
					</div>
				{/if}

				{#if hasActiveWorktree}
					<label class="mt-3 flex items-center gap-2">
						<Checkbox
							checked={removeWorktree}
							onCheckedChange={(checked) => (removeWorktree = checked === true)}
						/>
						<span class="text-sm">{m.archive_remove_worktree()}</span>
					</label>
				{/if}
			</Dialog.Body>

			<Dialog.Footer>
				<Button variant="ghost" onclick={onClose}>
					{m.btn_cancel()}
				</Button>
				<Button onclick={() => onConfirm(removeWorktree)}>
					{m.issue_card_archive()}
				</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
