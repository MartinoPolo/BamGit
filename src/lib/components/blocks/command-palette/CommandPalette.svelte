<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { tick } from 'svelte';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import CornerDownLeftIcon from '@lucide/svelte/icons/corner-down-left';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import * as Command from '$lib/components/shadcn/command/index.js';
	import { Kbd } from '$lib/components/shadcn/kbd/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import {
		useCommandPalette,
		COMMAND_PALETTE_CATEGORIES,
		type CommandPaletteCategory,
	} from '$lib/modules/command-palette/index.js';

	const paletteCtx = useCommandPalette();

	const CATEGORY_LABELS: Record<CommandPaletteCategory, () => string> = {
		[COMMAND_PALETTE_CATEGORIES.actions]: () => m.command_palette_actions(),
		[COMMAND_PALETTE_CATEGORIES.navigation]: () => m.command_palette_navigation(),
		[COMMAND_PALETTE_CATEGORIES.issues]: () => m.command_palette_issues(),
	};

	function handleDialogOpenChange(isOpen: boolean) {
		paletteCtx.open = isOpen;
		if (isOpen) {
			void tick().then(() => {
				const input = document.querySelector<HTMLInputElement>('[data-command-input]');
				input?.focus();
			});
		}
	}
</script>

<Dialog.Root open={paletteCtx.open} onOpenChange={handleDialogOpenChange}>
	<Dialog.Content class="top-[20%] translate-y-0 max-w-135 overflow-hidden p-0">
		<Dialog.Title class="sr-only">{m.command_palette_title()}</Dialog.Title>

		<Command.Root loop>
			<div class="border-b border-border">
				<Command.Input placeholder={m.command_palette_placeholder()} />
			</div>

			<Command.List class="max-h-80 p-1.5">
				{#each [...paletteCtx.groupedResults] as [category, items] (category)}
					<Command.Group heading={CATEGORY_LABELS[category]()}>
						{#each items as item (item.id)}
							<Command.Item
								value={item.label}
								onSelect={() => paletteCtx.executeItem(item)}
							>
								<span class="truncate">{item.label}</span>
								<span class="ml-auto flex shrink-0 items-center gap-1.5">
									{#if item.shortcut}
										<Command.Shortcut>
											<Kbd format="mono">{item.shortcut}</Kbd>
										</Command.Shortcut>
									{/if}
									{#if item.description}
										{#if item.category === COMMAND_PALETTE_CATEGORIES.issues}
											<Badge
												tone={item.description === 'active'
													? 'success'
													: 'neutral'}
											>
												{item.description}
											</Badge>
										{:else}
											<span
												class="text-(length:--text-2xs) text-foreground-subtle"
											>
												{item.description}
											</span>
										{/if}
									{/if}
								</span>
							</Command.Item>
						{/each}
					</Command.Group>
				{/each}

				<Command.Empty>
					{m.command_palette_no_results()}
				</Command.Empty>
			</Command.List>
		</Command.Root>

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
		</div>
	</Dialog.Content>
</Dialog.Root>
