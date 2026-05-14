<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import PoolDropZone from './PoolDropZone.svelte';
	import SoundPoolItem from './SoundPoolItem.svelte';
	import type { SoundPoolEntry } from '$lib/modules/character-packs';
	import SearchIcon from '@lucide/svelte/icons/search';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	interface Props {
		sounds: SoundPoolEntry[];
		playingSoundId?: string | null;
		class?: string;
		onimport?: () => void;
		onfiledrop?: (files: File[]) => void;
		onplay?: (soundId: string) => void;
		onclearall?: () => void;
	}

	let {
		sounds,
		playingSoundId = null,
		class: className,
		onimport,
		onfiledrop,
		onplay,
		onclearall,
	}: Props = $props();

	let filterText = $state('');
	let showClearDialog = $state(false);

	const filteredSounds = $derived.by(() => {
		if (!filterText.trim()) {
			return sounds;
		}
		const query = filterText.toLowerCase();
		return sounds.filter((s) => s.fileName.toLowerCase().includes(query));
	});

	const assignedCount = $derived(sounds.filter((s) => s.assignedEventType !== null).length);
	const unassignedCount = $derived(sounds.length - assignedCount);
</script>

<div class={cn('flex h-full flex-col border-l border-border bg-surface', className)}>
	<div class="flex items-center justify-between border-b border-border px-3 py-2">
		<div class="flex items-center gap-2">
			<h3 class="text-sm font-medium">Sound Pool</h3>
			<span class="text-xs text-muted-foreground">{sounds.length} files</span>
		</div>
		{#if sounds.length > 0}
			<Button
				intent="ghost"
				size="sm"
				class="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
				onclick={() => (showClearDialog = true)}
			>
				<Trash2Icon class="size-3" />
				Clear
			</Button>
		{/if}
	</div>

	{#if sounds.length > 0}
		<div class="border-b border-border px-3 py-2">
			<div class="relative">
				<SearchIcon
					class="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					bind:value={filterText}
					placeholder="Filter sounds..."
					class="h-7 pl-7 text-xs"
				/>
			</div>
		</div>

		{#if unassignedCount > 0 || assignedCount > 0}
			<div
				class="flex gap-3 border-b border-border px-3 py-1.5 text-[10px] text-muted-foreground"
			>
				<span>{unassignedCount} unassigned</span>
				<span>{assignedCount} assigned</span>
			</div>
		{/if}
	{/if}

	<div class="flex-1 overflow-y-auto px-1 py-1">
		{#if sounds.length === 0}
			<PoolDropZone class="m-2 h-[calc(100%-16px)]" onfolderselect={onimport} {onfiledrop} />
		{:else}
			{#each filteredSounds as sound (sound.id)}
				<SoundPoolItem
					{sound}
					isPlaying={playingSoundId === sound.id}
					onplay={() => onplay?.(sound.id)}
				/>
			{/each}

			{#if filteredSounds.length === 0}
				<p class="px-3 py-4 text-center text-xs text-muted-foreground">
					No sounds match "{filterText}"
				</p>
			{/if}

			<PoolDropZone class="m-2 mt-3" onfolderselect={onimport} {onfiledrop} />
		{/if}
	</div>
</div>

<Dialog.Root bind:open={showClearDialog}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Clear all sounds?</Dialog.Title>
			<Dialog.Description>
				This will remove all {sounds.length} sounds from the pool and unassign them from all events.
				This cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button intent="ghost" onclick={() => (showClearDialog = false)}>Cancel</Button>
			<Button
				intent="danger"
				onclick={() => {
					showClearDialog = false;
					onclearall?.();
				}}
			>
				Clear All
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
