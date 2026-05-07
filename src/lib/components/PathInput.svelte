<script lang="ts">
	import { invoke } from '$lib/tauri.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import FolderIcon from '@lucide/svelte/icons/folder';

	interface Props {
		value: string;
		id?: string;
		placeholder?: string;
	}

	let { value = $bindable(''), id, placeholder }: Props = $props();

	async function handleBrowse() {
		const selected = await invoke<string | null>('pick_folder');
		if (selected !== null) {
			value = selected;
		}
	}
</script>

<div class="flex gap-1.5">
	<Input {id} bind:value {placeholder} class="flex-1" />
	<Button variant="ghost" size="icon-sm" type="button" onclick={handleBrowse} class="shrink-0">
		<FolderIcon size={14} strokeWidth={1.7} />
	</Button>
</div>
