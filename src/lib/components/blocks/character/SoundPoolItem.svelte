<script lang="ts">
	import { cn } from '$lib/utils.js';
	import PlayIcon from '@lucide/svelte/icons/play';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import type { SoundPoolEntry } from '$lib/modules/character-packs';

	interface Props {
		sound: SoundPoolEntry;
		isPlaying?: boolean;
		class?: string;
		onplay?: () => void;
		ondragstart?: (event: DragEvent) => void;
	}

	let { sound, isPlaying = false, class: className, onplay, ondragstart }: Props = $props();

	const displayName = $derived(sound.fileName.replace(/\.[^.]+$/, ''));

	const formattedDuration = $derived.by(() => {
		if (sound.durationMs == null) {
			return null;
		}
		const seconds = Math.floor(sound.durationMs / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	});

	function handleDragStart(event: DragEvent) {
		event.dataTransfer?.setData('application/x-grovekeeper-sound', sound.id);
		if (event.dataTransfer !== null && event.dataTransfer !== undefined) {
			event.dataTransfer.effectAllowed = 'copy';
		}
		ondragstart?.(event);
	}
</script>

<div
	class={cn(
		'group/pool-item flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-sm transition-colors hover:bg-surface-2',
		sound.assignedEventType !== null && 'opacity-50',
		isPlaying && 'bg-primary/5 border-primary/20',
		className,
	)}
	draggable="true"
	ondragstart={handleDragStart}
	role="listitem"
>
	<GripVerticalIcon
		class="size-3.5 shrink-0 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover/pool-item:opacity-100 active:cursor-grabbing"
	/>

	<button
		type="button"
		class={cn(
			'flex size-6 shrink-0 items-center justify-center rounded-full transition-colors',
			isPlaying
				? 'bg-primary text-primary-foreground'
				: 'bg-surface-2 text-muted-foreground hover:bg-primary hover:text-primary-foreground',
		)}
		onclick={onplay}
		aria-label={isPlaying ? 'Pause' : 'Play'}
	>
		{#if isPlaying}
			<PauseIcon class="size-3" />
		{:else}
			<PlayIcon class="size-3 translate-x-px" />
		{/if}
	</button>

	<div class="min-w-0 flex-1">
		<span class="block truncate font-mono text-xs text-foreground">{displayName}</span>
	</div>

	<div class="flex shrink-0 items-center gap-1.5">
		{#if formattedDuration}
			<span class="text-[10px] text-muted-foreground">{formattedDuration}</span>
		{/if}
		{#if sound.assignedEventType}
			<span class="rounded bg-primary/10 px-1 py-0.5 text-[9px] font-medium text-primary">
				{sound.assignedEventType.split('.').pop()}
			</span>
		{/if}
	</div>
</div>
