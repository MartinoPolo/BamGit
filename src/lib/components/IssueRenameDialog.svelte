<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Issue } from '$lib/modules/issues';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	interface Props {
		issue: Issue | null;
		onClose: () => void;
		onRename: (id: string, name: string) => void;
	}

	let { issue, onClose, onRename }: Props = $props();

	let name = $state('');
	const open = $derived(issue !== null);

	$effect(() => {
		if (issue !== null) {
			name = issue.name;
		}
	});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const trimmed = name.trim();
		if (issue === null || !trimmed) {
			return;
		}
		onRename(issue.id, trimmed);
		onClose();
	}

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			onClose();
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-sm">
		{#if issue}
			<form onsubmit={handleSubmit} class="flex flex-col gap-4">
				<Dialog.Header>
					<Dialog.Title>{m.rename_title()}</Dialog.Title>
				</Dialog.Header>

				<Dialog.Body>
					<div class="flex flex-col gap-1.5">
						<Label for="rename-name">{m.rename_field_name()}</Label>
						<Input id="rename-name" bind:value={name} required />
					</div>
				</Dialog.Body>

				<Dialog.Footer>
					<Button variant="ghost" type="button" onclick={onClose}>
						{m.btn_cancel()}
					</Button>
					<Button type="submit">
						{m.btn_save()}
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
