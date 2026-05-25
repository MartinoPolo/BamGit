<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Input } from '$lib/components/shadcn/input/index.js';

	interface Props {
		open: boolean;
		workspaceName: string;
		onconfirm: () => void;
		onclose: () => void;
	}

	let { open, workspaceName, onconfirm, onclose }: Props = $props();

	let typedName = $state('');

	const nameMatches = $derived(typedName === workspaceName);

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			typedName = '';
			onclose();
		}
	}

	function handleConfirm() {
		if (nameMatches) {
			onconfirm();
			typedName = '';
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>{m.workspace_delete_confirm_title()}</Dialog.Title>
		</Dialog.Header>

		<Dialog.Body class="flex flex-col gap-3">
			<p class="text-sm text-muted-foreground">
				{m.workspace_delete_confirm_body()}
			</p>
			<Input placeholder={m.workspace_delete_name_placeholder()} bind:value={typedName} />
			{#if typedName.length > 0 && !nameMatches}
				<p class="text-xs text-destructive">{m.workspace_delete_name_mismatch()}</p>
			{/if}
		</Dialog.Body>

		<Dialog.Footer>
			<Button intent="ghost" type="button" onclick={() => handleOpenChange(false)}>
				{m.btn_cancel()}
			</Button>
			<Button intent="danger" type="button" disabled={!nameMatches} onclick={handleConfirm}>
				{m.btn_delete()}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
