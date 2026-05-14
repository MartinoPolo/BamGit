<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import CornerDownLeftIcon from '@lucide/svelte/icons/corner-down-left';
	import SearchIcon from '@lucide/svelte/icons/search';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import * as Popover from '$lib/components/shadcn/popover/index.js';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import { Kbd } from '$lib/components/shadcn/kbd/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import {
		useCommandPalette,
		COMMAND_PALETTE_CATEGORIES,
		type CommandPaletteCategory,
	} from '$lib/modules/command-palette/index.js';

	const paletteCtx = useCommandPalette();

	let searchInputElement = $state<HTMLInputElement | null>(null);

	const CATEGORY_LABELS: Record<CommandPaletteCategory, () => string> = {
		[COMMAND_PALETTE_CATEGORIES.actions]: () => m.command_palette_actions(),
		[COMMAND_PALETTE_CATEGORIES.navigation]: () => m.command_palette_navigation(),
		[COMMAND_PALETTE_CATEGORIES.issues]: () => m.command_palette_issues(),
	};

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			paletteCtx.selectNext();
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			paletteCtx.selectPrevious();
		} else if (event.key === 'Enter') {
			event.preventDefault();
			paletteCtx.executeSelected();
		}
	}

	function handleDialogOpenChange(isOpen: boolean) {
		paletteCtx.open = isOpen;
		if (isOpen) {
			requestAnimationFrame(() => {
				searchInputElement?.focus();
			});
		}
	}
</script>

<Dialog.Root open={paletteCtx.open} onOpenChange={handleDialogOpenChange}>
	<Dialog.Content
		class="top-[20%] translate-y-0 max-w-135 overflow-hidden p-0"
		onkeydown={handleKeydown}
	>
		<Dialog.Title class="sr-only">{m.command_palette_title()}</Dialog.Title>

		<!-- Search row -->
		<div class="flex items-center gap-2.5 border-b border-border px-3.5 py-3">
			<SearchIcon size={14} class="shrink-0 text-foreground-subtle" />
			<Input
				bind:ref={searchInputElement}
				class="h-6 flex-1 border-none bg-transparent py-0 pl-2 text-sm shadow-none outline-none focus-visible:shadow-none placeholder:text-foreground-subtle"
				placeholder={m.command_palette_placeholder()}
				value={paletteCtx.query}
				oninput={(event) => {
					paletteCtx.query = event.currentTarget.value;
				}}
			/>
			<Kbd>Esc</Kbd>
		</div>

		<!-- Results area -->
		<div class="max-h-80 overflow-y-auto p-1.5">
			{#each [...paletteCtx.groupedResults] as [category, items], groupIndex (category)}
				{#if groupIndex > 0}
					<Popover.Divider />
				{/if}

				<Popover.Label>{CATEGORY_LABELS[category]()}</Popover.Label>

				{#each items as item (item.id)}
					{@const flatIdx = paletteCtx.flatIndexByItemId.get(item.id) ?? -1}
					{@const isSelected = flatIdx === paletteCtx.selectedIndex}
					<Popover.Item
						active={isSelected}
						role="option"
						aria-selected={isSelected}
						tabindex={-1}
						class="data-[state=active]:bg-surface-2"
						onclick={() => paletteCtx.executeItem(item)}
						onkeydown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								paletteCtx.executeItem(item);
							}
						}}
						onmouseenter={() => {
							paletteCtx.selectedIndex = flatIdx;
						}}
					>
						<span class="truncate">{item.label}</span>
						<span class="ml-auto flex shrink-0 items-center gap-1.5">
							{#if item.shortcut}
								<Kbd format="mono">{item.shortcut}</Kbd>
							{/if}
							{#if item.description}
								{#if item.category === COMMAND_PALETTE_CATEGORIES.issues}
									<Badge
										tone={item.description === 'active' ? 'success' : 'neutral'}
									>
										{item.description}
									</Badge>
								{:else}
									<span class="text-(length:--text-2xs) text-foreground-subtle">
										{item.description}
									</span>
								{/if}
							{/if}
						</span>
					</Popover.Item>
				{/each}
			{/each}

			{#if paletteCtx.resultCount === 0 && paletteCtx.query.trim() !== ''}
				<div class="px-2 py-4 text-center text-sm text-foreground-subtle">
					{m.command_palette_no_results()}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div
			class="flex items-center gap-3 border-t border-border px-3 py-2 text-(length:--text-2xs) text-foreground-subtle"
		>
			<span class="flex items-center gap-1">
				<Kbd format="lucide"><ArrowUpIcon /><ArrowDownIcon /></Kbd>
				{m.command_palette_navigate()}
			</span>
			<span class="flex items-center gap-1">
				<Kbd format="lucide"><CornerDownLeftIcon /></Kbd>
				{m.command_palette_select()}
			</span>
			<span class="flex items-center gap-1">
				<Kbd>Esc</Kbd>
				{m.command_palette_close()}
			</span>
			<span class="ml-auto">
				{m.command_palette_results({ count: paletteCtx.resultCount })}
			</span>
		</div>
	</Dialog.Content>
</Dialog.Root>
