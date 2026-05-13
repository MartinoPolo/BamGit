<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { RangeCalendar } from './index.js';

	const { Story } = defineMeta({
		title: 'Base/RangeCalendar',
		component: RangeCalendar,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import { CalendarDate } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';

	const partialRange: DateRange = {
		start: new CalendarDate(2026, 5, 10),
		end: undefined,
	};

	const fullRange: DateRange = {
		start: new CalendarDate(2026, 5, 10),
		end: new CalendarDate(2026, 5, 20),
	};

	const placeholder = new CalendarDate(2026, 5, 1);
</script>

<Story name="Empty">
	{#snippet template()}
		<div class="p-4">
			<RangeCalendar {placeholder} />
		</div>
	{/snippet}
</Story>

<Story name="Partial Selection">
	{#snippet template()}
		<div class="p-4">
			<RangeCalendar value={partialRange} {placeholder} />
		</div>
	{/snippet}
</Story>

<Story name="Full Range">
	{#snippet template()}
		<div class="p-4">
			<RangeCalendar value={fullRange} {placeholder} />
		</div>
	{/snippet}
</Story>

<Story name="Single Month">
	{#snippet template()}
		<div class="p-4">
			<RangeCalendar numberOfMonths={1} {placeholder} />
		</div>
	{/snippet}
</Story>

<Story name="Two Month">
	{#snippet template()}
		<div class="p-4">
			<RangeCalendar numberOfMonths={2} {placeholder} />
		</div>
	{/snippet}
</Story>
