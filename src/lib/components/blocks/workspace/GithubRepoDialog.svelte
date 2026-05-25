<script lang="ts">
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import RepoCombobox from '$lib/components/derived/repo-combobox/RepoCombobox.svelte';

	interface Props {
		open: boolean;
		currentRepo: string;
		onconfirm: (repo: string | null) => void;
		onclose: () => void;
	}

	let { open, currentRepo, onconfirm, onclose }: Props = $props();

	let repoValue = $state('');

	$effect(() => {
		if (open) {
			repoValue = currentRepo;
		}
	});

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			onclose();
		}
	}

	function handleConfirm() {
		const trimmed = repoValue.trim();
		onconfirm(trimmed.length > 0 ? trimmed : null);
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-sm">
		<Dialog.Header>
			<Dialog.Title>Set GitHub Repository</Dialog.Title>
		</Dialog.Header>

		<Dialog.Body class="flex flex-col gap-3">
			<p class="text-sm text-muted-foreground">
				Enter the repository in <code class="text-xs">owner/repo</code> format.
			</p>
			<RepoCombobox bind:value={repoValue} placeholder="owner/repo" />
		</Dialog.Body>

		<Dialog.Footer>
			<Button intent="ghost" type="button" onclick={() => handleOpenChange(false)}>
				Cancel
			</Button>
			<Button intent="primary" type="button" onclick={handleConfirm}>Save</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
