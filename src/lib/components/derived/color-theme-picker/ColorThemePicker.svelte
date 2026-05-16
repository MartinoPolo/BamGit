<script lang="ts">
	import { RadioGroup } from 'bits-ui';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import * as Popover from '$lib/components/shadcn/popover/index.js';
	import { cn } from '$lib/utils.js';
	import type { ColorThemePickerProps } from './color_theme_picker_types.js';

	let {
		options,
		value,
		onchange,
		triggerLabel = 'Color theme',
		portalDisabled = false,
	}: ColorThemePickerProps = $props();

	let open = $state(false);

	function handleValueChange(newValue: string) {
		onchange(newValue);
	}

	function handleItemClick() {
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button intent="secondary" size="sm" {...props} aria-label={triggerLabel}>
				<PaletteIcon data-icon="inline-start" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-50" portalProps={portalDisabled ? { disabled: true } : undefined}>
		<Popover.Label>{triggerLabel}</Popover.Label>
		<RadioGroup.Root
			{value}
			onValueChange={handleValueChange}
			aria-label={triggerLabel}
			class="flex flex-col gap-0.5"
		>
			{#each options as option (option.value)}
				<RadioGroup.Item
					value={option.value}
					onclick={handleItemClick}
					class={cn(
						'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-(length:--text-sm) outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:bg-surface-2',
					)}
				>
					{#snippet children({ checked })}
						<div class="flex gap-0.5">
							{#each option.swatchColors as color (color)}
								<span class={cn('size-3 rounded-sm', color)}></span>
							{/each}
						</div>
						<span class="flex-1 truncate">{option.label}</span>
						{#if checked}
							<CheckIcon class="size-3 shrink-0 text-primary" />
						{/if}
					{/snippet}
				</RadioGroup.Item>
			{/each}
		</RadioGroup.Root>
	</Popover.Content>
</Popover.Root>
