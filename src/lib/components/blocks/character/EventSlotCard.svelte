<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import SoundChip from './SoundChip.svelte';
	import type { ImportanceTier } from '$lib/types/generated';
	import type { SoundPoolEntry } from '$lib/modules/character-packs';
	import MusicIcon from '@lucide/svelte/icons/music';

	interface Props {
		eventType: string;
		label: string;
		description: string;
		tier: ImportanceTier;
		sounds: SoundPoolEntry[];
		playingSoundId?: string | null;
		class?: string;
		ondrop?: (eventType: string, soundId: string) => void;
		onremove?: (eventType: string, soundId: string) => void;
		onplay?: (soundId: string) => void;
	}

	let {
		eventType,
		label,
		description,
		tier,
		sounds,
		playingSoundId = null,
		class: className,
		ondrop,
		onremove,
		onplay,
	}: Props = $props();

	let isDragOver = $state(false);

	const isEmpty = $derived(sounds.length === 0);
	const isCriticalEmpty = $derived(tier === 'critical' && isEmpty);
	const isImportantEmpty = $derived(tier === 'important' && isEmpty);

	function handleDragOver(event: DragEvent) {
		if (
			event.dataTransfer !== null &&
			event.dataTransfer !== undefined &&
			event.dataTransfer.types.includes('application/x-grovekeeper-sound')
		) {
			event.preventDefault();
			isDragOver = true;
		}
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		const soundId = event.dataTransfer?.getData('application/x-grovekeeper-sound');
		if (soundId !== undefined && soundId !== null && soundId.length > 0) {
			ondrop?.(eventType, soundId);
		}
	}
</script>

<div
	class={cn(
		'group/event rounded-lg border bg-surface p-3 transition-all',
		isCriticalEmpty &&
			'border-status-danger/40 bg-[color-mix(in_oklch,var(--status-danger)_6%,transparent)]',
		isImportantEmpty &&
			'border-status-warning/40 bg-[color-mix(in_oklch,var(--status-warning)_6%,transparent)]',
		!isCriticalEmpty && !isImportantEmpty && 'border-border',
		isDragOver && 'border-primary/60 bg-primary/5 ring-1 ring-primary/30',
		className,
	)}
	role="region"
	aria-label="{label} event slot"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	<div class="mb-2 flex items-center gap-2">
		<span class="text-sm font-medium text-foreground">{label}</span>
		<Badge format="mono" size="compact">{eventType}</Badge>
		{#if sounds.length > 0}
			<span class="ml-auto text-[10px] text-muted-foreground">
				{sounds.length} sound{sounds.length !== 1 ? 's' : ''}
			</span>
		{/if}
	</div>

	<p class="mb-3 text-xs text-muted-foreground">{description}</p>

	{#if sounds.length > 0}
		<div class="flex flex-col gap-1.5">
			{#each sounds as sound (sound.id)}
				<SoundChip
					fileName={sound.fileName}
					durationMs={sound.durationMs}
					isPlaying={playingSoundId === sound.id}
					onplay={() => onplay?.(sound.id)}
					onremove={() => onremove?.(eventType, sound.id)}
				/>
			{/each}
		</div>
	{/if}

	<div
		class={cn(
			'mt-2 flex items-center justify-center gap-1.5 rounded border border-dashed px-3 py-2 text-xs transition-colors',
			isCriticalEmpty
				? 'border-status-danger/30 text-status-danger'
				: isImportantEmpty
					? 'border-status-warning/30 text-status-warning'
					: 'border-border text-muted-foreground',
			isDragOver && 'border-primary/50 bg-primary/10 text-primary',
		)}
	>
		<MusicIcon class="size-3.5" />
		{#if isEmpty}
			<span>Drop a sound here</span>
		{:else}
			<span>Drop another sound</span>
		{/if}
	</div>
</div>
