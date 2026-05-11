<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import DateRangePicker from './DateRangePicker.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Usage/DateRangePicker',
		component: DateRangePicker,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	let selectedRange = $state<{ start: string; end: string } | null>(null);
</script>

<Story name="Default">
	{#snippet template()}
		<div class="flex flex-col items-start gap-4 p-8 pb-96">
			<DateRangePicker
				onselect={(range) => {
					selectedRange = range;
				}}
			/>
			{#if selectedRange !== null}
				<p class="text-sm text-muted-foreground">
					Selected: {selectedRange.start} → {selectedRange.end}
				</p>
			{/if}
		</div>
	{/snippet}
</Story>
