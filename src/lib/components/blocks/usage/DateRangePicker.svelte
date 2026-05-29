<script lang="ts">
	import { CalendarDate, type DateValue } from '@internationalized/date';
	import * as Tabs from '$lib/components/shadcn/tabs/index.js';
	import * as Popover from '$lib/components/shadcn/popover/index.js';
	import { RangeCalendar } from '$lib/components/shadcn/range-calendar/index.js';
	import type { DateRange } from 'bits-ui';

	interface Props {
		onselect: (range: { start: string; end: string }) => void;
	}

	let { onselect }: Props = $props();

	let open = $state(false);
	let selectedRange = $state<DateRange | undefined>(undefined);

	function dateValueToIso(date: DateValue): string {
		return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
	}

	function handleRangeChange(range: DateRange | undefined) {
		selectedRange = range;
		if (range?.start !== undefined && range?.end !== undefined) {
			onselect({
				start: dateValueToIso(range.start),
				end: dateValueToIso(range.end),
			});
			open = false;
		}
	}

	const today = new Date();
	const initialPlaceholder = new CalendarDate(
		today.getFullYear(),
		today.getMonth() + 1,
		today.getDate(),
	);
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Tabs.Trigger value="custom" {...props}>Custom</Tabs.Trigger>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0" portalProps={{ disabled: true }}>
		<RangeCalendar
			value={selectedRange}
			onValueChange={handleRangeChange}
			numberOfMonths={2}
			placeholder={initialPlaceholder}
		/>
	</Popover.Content>
</Popover.Root>
