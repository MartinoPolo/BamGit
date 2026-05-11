<script lang="ts">
	import { cn } from '$lib/utils.js';
	import PlayIcon from '@lucide/svelte/icons/play';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import XIcon from '@lucide/svelte/icons/x';

	interface Props {
		fileName: string;
		label?: string | null;
		durationMs?: number | null;
		isPlaying?: boolean;
		removable?: boolean;
		class?: string;
		onplay?: () => void;
		onremove?: () => void;
	}

	let {
		fileName,
		label,
		durationMs,
		isPlaying = false,
		removable = true,
		class: className,
		onplay,
		onremove,
	}: Props = $props();

	const displayName = $derived(label ?? fileName.replace(/\.[^.]+$/, ''));

	const formattedDuration = $derived.by(() => {
		if (durationMs == null) {
			return null;
		}
		const seconds = Math.floor(durationMs / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	});
</script>

<div
	class={cn(
		'group/chip flex items-center gap-1.5 rounded-full border border-border bg-surface-2 py-0.5 pl-0.5 pr-2 text-xs transition-colors',
		isPlaying && 'border-primary/40 bg-primary/10',
		className,
	)}
>
	<button
		type="button"
		class={cn(
			'flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110',
			isPlaying && 'bg-primary',
		)}
		onclick={onplay}
		aria-label={isPlaying ? 'Pause sound' : 'Play sound'}
	>
		{#if isPlaying}
			<PauseIcon class="size-3" />
		{:else}
			<PlayIcon class="size-3 translate-x-px" />
		{/if}
	</button>

	<div class="flex items-center gap-1.5 overflow-hidden">
		{#if isPlaying}
			<div class="flex items-end gap-px">
				{#each [0.6, 1, 0.4, 0.8, 0.5] as height, index (index)}
					<div
						class="w-0.5 animate-pulse rounded-full bg-primary"
						style:height="{height * 12}px"
						style:animation-delay="{height * 200}ms"
					></div>
				{/each}
			</div>
		{/if}

		<span class="truncate font-mono text-[11px] text-foreground">{displayName}</span>

		{#if formattedDuration}
			<span class="shrink-0 text-[10px] text-muted-foreground">{formattedDuration}</span>
		{/if}
	</div>

	{#if removable}
		<button
			type="button"
			class="ml-auto flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover/chip:opacity-100"
			onclick={onremove}
			aria-label="Remove sound"
		>
			<XIcon class="size-3" />
		</button>
	{/if}
</div>
