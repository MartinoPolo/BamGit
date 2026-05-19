<script lang="ts">
	import { cn } from '$lib/utils.js';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import UserIcon from '@lucide/svelte/icons/user';

	interface Props {
		avatarUrl?: string | null;
		size?: number;
		class?: string;
		onupload?: (imageData: number[]) => void;
	}

	let { avatarUrl = null, size = 72, class: className, onupload }: Props = $props();

	let isDragOver = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	async function processFile(file: File) {
		if (file.size > 2 * 1024 * 1024) {
			console.error('Avatar file too large (max 2MB)');
			return;
		}

		const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
		if (!validTypes.includes(file.type)) {
			console.error('Invalid image type. Use PNG, JPG, or WebP.');
			return;
		}

		const buffer = await file.arrayBuffer();
		const imageData = Array.from(new Uint8Array(buffer));
		onupload?.(imageData);
	}

	function handleClick() {
		fileInput?.click();
	}

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			void processFile(file);
			input.value = '';
		}
	}

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
		const file = event.dataTransfer?.files[0];
		if (file) {
			void processFile(file);
		}
	}
</script>

<input
	bind:this={fileInput}
	type="file"
	accept="image/png,image/jpeg,image/webp"
	class="hidden"
	onchange={handleFileChange}
/>

<button
	type="button"
	class={cn(
		'group relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-surface-2 transition-all hover:border-primary/40 hover:bg-primary/5',
		isDragOver && 'border-primary/60 bg-primary/10',
		className,
	)}
	style:width="{size}px"
	style:height="{size}px"
	onclick={handleClick}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	aria-label="Upload avatar"
>
	{#if avatarUrl}
		<img src={avatarUrl} alt="Character avatar" class="size-full object-cover" />
		<!-- intentional: bg-black/50 and text-white are overlay backdrop colors -->
		<div
			class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
		>
			<UploadIcon class="size-5 text-white" />
		</div>
	{:else}
		<div
			class="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary"
		>
			<UserIcon class="size-6" />
			<UploadIcon class="size-3 opacity-60" />
		</div>
	{/if}
</button>
