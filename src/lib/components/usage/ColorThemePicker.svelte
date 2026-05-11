<script lang="ts">
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils.js';
	import { CHART_COLOR_THEMES, type ChartColorTheme } from '$lib/modules/usage/usage_types.js';

	interface ThemeOption {
		value: ChartColorTheme;
		label: string;
		swatchColors: string[];
	}

	interface Props {
		value: ChartColorTheme;
		onchange: (theme: ChartColorTheme) => void;
	}

	let { value, onchange }: Props = $props();

	let open = $state(false);

	const themeOptions: ThemeOption[] = [
		{
			value: CHART_COLOR_THEMES.monochrome,
			label: 'Monochrome',
			swatchColors: ['bg-chart-1', 'bg-chart-1/60', 'bg-chart-1/30'],
		},
		{
			value: CHART_COLOR_THEMES.trafficLight,
			label: 'Traffic Light',
			swatchColors: ['bg-green-500', 'bg-amber-400', 'bg-red-500'],
		},
		{
			value: CHART_COLOR_THEMES.gradient,
			label: 'Gradient',
			swatchColors: ['bg-blue-500', 'bg-yellow-400', 'bg-red-500'],
		},
	];

	function handleSelect(theme: ChartColorTheme) {
		onchange(theme);
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button variant="secondary" size="sm" {...props}>
				<PaletteIcon class="size-3.5" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-50" portalProps={{ disabled: true }}>
		<Popover.Label>Color theme</Popover.Label>
		{#each themeOptions as option (option.value)}
			<button
				class={cn(
					'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-(length:--text-sm) transition-colors hover:bg-surface-2',
					value === option.value && 'bg-surface-2',
				)}
				onclick={() => handleSelect(option.value)}
			>
				<div class="flex gap-0.5">
					{#each option.swatchColors as color (color)}
						<span class={cn('size-3 rounded-sm', color)}></span>
					{/each}
				</div>
				<span class="flex-1 truncate">{option.label}</span>
				{#if value === option.value}
					<CheckIcon class="size-3 shrink-0 text-primary" />
				{/if}
			</button>
		{/each}
	</Popover.Content>
</Popover.Root>
