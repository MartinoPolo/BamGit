<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Issue } from '$lib/modules/issues';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';

	interface Props {
		issue: Issue | null;
		hasActiveWorktree: boolean;
		onClose: () => void;
		onConfirm: (removeWorktree: boolean) => void;
	}

	let { issue, hasActiveWorktree, onClose, onConfirm }: Props = $props();

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
				<Dialog.Title>{m.delete_confirm_title()}</Dialog.Title>
				<Dialog.Description>
					{m.delete_confirm_body({ name: issue.name })}
				</Dialog.Description>
			</Dialog.Header>

			<Dialog.Body>
				{#if hasActiveWorktree}
					<label class="flex items-center gap-2">
						<Checkbox
							checked={removeWorktree}
							onCheckedChange={(checked) => (removeWorktree = checked === true)}
						/>
						<span class="text-sm">{m.delete_remove_worktree()}</span>
					</label>
				{/if}
			</Dialog.Body>

			<Dialog.Footer>
				<Button variant="ghost" onclick={onClose}>
					{m.btn_cancel()}
				</Button>
				<Button variant="danger" onclick={() => onConfirm(removeWorktree)}>
					{m.btn_confirm_delete()}
				</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
