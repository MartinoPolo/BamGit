<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Kbd } from '$lib/components/ui/kbd/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
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
		class="top-[20%] -translate-y-0 max-w-[540px] overflow-hidden p-0"
		onkeydown={handleKeydown}
	>
		<Dialog.Title class="sr-only">{m.command_palette_title()}</Dialog.Title>

		<!-- Search row -->
		<div class="flex items-center gap-2.5 border-b border-border px-3.5 py-3">
			<SearchIcon size={14} class="shrink-0 text-foreground-subtle" />
			<Input
				bind:ref={searchInputElement}
				class="h-6 flex-1 border-none bg-transparent p-0 text-sm shadow-none outline-none placeholder:text-foreground-subtle"
				placeholder={m.command_palette_placeholder()}
				value={paletteCtx.query}
				oninput={(event) => {
					paletteCtx.query = event.currentTarget.value;
				}}
			/>
			<Kbd>esc</Kbd>
		</div>

		<!-- Results area -->
		<div class="max-h-[320px] overflow-y-auto p-1.5">
			{#each [...paletteCtx.groupedResults] as [category, items], groupIndex (category)}
				{#if groupIndex > 0}
					<hr data-slot="popover-divider" class="my-1 border-t border-border" />
				{/if}

				<div
					data-slot="popover-label"
					class="px-2 pb-1 pt-1.5 text-[length:var(--text-2xs)] font-medium uppercase tracking-wider text-foreground-subtle"
				>
					{CATEGORY_LABELS[category]()}
				</div>

				{#each items as item (item.id)}
					{@const flatIdx = paletteCtx.flatIndexByItemId.get(item.id) ?? -1}
					{@const isSelected = flatIdx === paletteCtx.selectedIndex}
					<div
						data-slot="popover-item"
						data-state={isSelected ? 'active' : undefined}
						role="option"
						aria-selected={isSelected}
						tabindex={-1}
						class="flex min-h-[28px] w-full cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1 text-[length:var(--text-sm)] text-foreground outline-none hover:bg-surface-2 focus-visible:bg-surface-2 data-[state=active]:bg-surface-2 data-[state=active]:text-primary"
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
								<Kbd>{item.shortcut}</Kbd>
							{/if}
							{#if item.description}
								{#if item.category === COMMAND_PALETTE_CATEGORIES.issues}
									<Badge
										variant={item.description === 'active'
											? 'success'
											: 'default'}
									>
										{item.description}
									</Badge>
								{:else}
									<span
										class="text-[length:var(--text-2xs)] text-foreground-subtle"
									>
										{item.description}
									</span>
								{/if}
							{/if}
						</span>
					</div>
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
			class="flex items-center gap-3 border-t border-border px-3 py-2 text-[length:var(--text-2xs)] text-foreground-subtle"
		>
			<span class="flex items-center gap-1">
				<Kbd>↑↓</Kbd>
				{m.command_palette_navigate()}
			</span>
			<span class="flex items-center gap-1">
				<Kbd>↵</Kbd>
				{m.command_palette_select()}
			</span>
			<span class="flex items-center gap-1">
				<Kbd>esc</Kbd>
				{m.command_palette_close()}
			</span>
			<span class="ml-auto">
				{m.command_palette_results({ count: paletteCtx.resultCount })}
			</span>
		</div>
	</Dialog.Content>
</Dialog.Root>
