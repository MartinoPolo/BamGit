<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Issue } from '$lib/modules/issues';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Kbd } from '$lib/components/shadcn/kbd/index.js';
	import CornerDownLeftIcon from '@lucide/svelte/icons/corner-down-left';
	import { Checkbox } from '$lib/components/shadcn/checkbox/index.js';

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
					<Kbd>Esc</Kbd>
				</Button>
				<Button variant="primary-destructive" onclick={() => onConfirm(removeWorktree)}>
					{m.btn_confirm_delete()}
					<Kbd variant="lucide" tone="inverted"><CornerDownLeftIcon /></Kbd>
				</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
