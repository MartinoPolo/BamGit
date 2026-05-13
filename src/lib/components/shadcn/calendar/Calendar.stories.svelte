<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Calendar } from './index.js';
	import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
	import type { DateValue } from '@internationalized/date';

	const tz = getLocalTimeZone();
	const todayDate = today(tz);

	const { Story } = defineMeta({
		title: 'Base/Calendar',
		component: Calendar,
		tags: ['autodocs'],
	});
</script>

<!-- 1. Default — no preselected date, shows current month -->
<Story name="Default">
	{#snippet template()}
		<div class="p-4">
			<Calendar type="single" />
		</div>
	{/snippet}
</Story>

<!-- 2. Preselected Date — May 15, 2026 -->
<Story name="Preselected Date">
	{#snippet template()}
		<div class="p-4">
			<Calendar type="single" value={new CalendarDate(2026, 5, 15) as DateValue} />
		</div>
	{/snippet}
</Story>

<!-- 3. Min Max Constraint — selectable range: today-7d to today+30d -->
<Story name="Min Max Constraint">
	{#snippet template()}
		<div class="p-4">
			<Calendar
				type="single"
				minValue={todayDate.subtract({ days: 7 }) as DateValue}
				maxValue={todayDate.add({ days: 30 }) as DateValue}
			/>
		</div>
	{/snippet}
</Story>

<!-- 4. Disabled Dates — weekends (Sat/Sun) are non-interactive -->
<Story name="Disabled Weekends">
	{#snippet template()}
		<div class="p-4">
			<Calendar
				type="single"
				isDateDisabled={(date: DateValue) => {
					const day = date.toDate(tz).getDay();
					return day === 0 || day === 6;
				}}
			/>
		</div>
	{/snippet}
</Story>
