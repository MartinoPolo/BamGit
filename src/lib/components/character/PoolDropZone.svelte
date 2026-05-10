<script lang="ts">
	import { cn } from '$lib/utils.js';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import UploadIcon from '@lucide/svelte/icons/upload';

	interface Props {
		class?: string;
		onfiledrop?: (files: File[]) => void;
		onfolderselect?: () => void;
	}

	let { class: className, onfiledrop, onfolderselect }: Props = $props();

	let isDragOver = $state(false);

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		const files = Array.from(event.dataTransfer?.files ?? []);
		const audioFiles = files.filter((f) =>
			['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/flac', 'audio/x-wav'].includes(f.type),
		);
		if (audioFiles.length > 0) {
			onfiledrop?.(audioFiles);
		}
	}
</script>

<div
	class={cn(
		'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-2/50 px-4 py-6 text-center transition-all',
		isDragOver && 'border-primary/60 bg-primary/5',
		className,
	)}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	role="region"
	aria-label="Import sounds"
>
	<div class="flex items-center gap-3 text-muted-foreground">
		<UploadIcon class="size-5" />
		<span class="text-sm">Drop audio files here</span>
	</div>
	<span class="text-xs text-muted-foreground">or</span>
	<button
		type="button"
		class="flex items-center gap-1.5 rounded-md bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
		onclick={onfolderselect}
	>
		<FolderOpenIcon class="size-3.5" />
		Import from folder
	</button>
</div>
