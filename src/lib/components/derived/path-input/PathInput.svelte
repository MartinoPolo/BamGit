<script lang="ts">
	import { invoke } from '$lib/tauri.js';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import FolderIcon from '@lucide/svelte/icons/folder';

	interface Props {
		value: string;
		id?: string;
		placeholder?: string;
		disabled?: boolean;
		onchange?: () => void;
	}

	let { value = $bindable(''), id, placeholder, disabled = false, onchange }: Props = $props();

	async function handleBrowse() {
		if (disabled) {
			return;
		}
		const selected = await invoke<string | null>('pick_folder');
		if (selected !== null) {
			value = selected;
			onchange?.();
		}
	}
</script>

<div class="flex gap-1.5">
	<Input {id} bind:value {placeholder} {disabled} oninput={() => onchange?.()} class="flex-1" />
	<Button
		intent="ghost"
		size="icon-sm"
		type="button"
		{disabled}
		onclick={handleBrowse}
		class="shrink-0"
	>
		<FolderIcon size={14} strokeWidth={1.7} />
	</Button>
</div>
