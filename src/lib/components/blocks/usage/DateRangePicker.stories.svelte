<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
	import DateRangePicker from './DateRangePicker.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Usage/DateRangePicker',
		component: DateRangePicker,
		tags: ['autodocs'],
	});

	/** Helper: find popover content inside the canvas (portal disabled in component). */
	function getPopoverContent(canvas: HTMLElement): HTMLElement | null {
		return canvas.querySelector('[data-slot="popover-content"]');
	}

	/** Helper: assert popover content is closed (either absent or data-state="closed"). */
	async function expectPopoverClosed(canvas: HTMLElement) {
		const content = getPopoverContent(canvas);
		if (content) {
			await waitFor(() => expect(content.dataset.state).toBe('closed'));
			return;
		}
	}

	/**
	 * Helper: get visible, enabled day buttons from the first month grid.
	 * Skips outside-month days (invisible) and disabled days.
	 */
	function getVisibleDayButtons(container: HTMLElement): HTMLElement[] {
		const allDays = [...container.querySelectorAll<HTMLElement>('[data-bits-day]')];
		return allDays.filter(
			(day) => !day.hasAttribute('data-outside-month') && !day.hasAttribute('data-disabled'),
		);
	}

	/** Click trigger -> popover opens with calendar visible. */
	const playOpenPopover = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole('tab', { name: /custom/i });

		// Popover starts closed
		await expectPopoverClosed(canvasElement);

		// Click trigger -> opens
		await userEvent.click(trigger);
		const content = getPopoverContent(canvasElement);
		await expect(content).not.toBeNull();
		await expect(content).toHaveAttribute('data-state', 'open');

		// Calendar day cells are visible inside the popover
		const dayButtons = content!.querySelectorAll('[data-bits-day]');
		await expect(dayButtons.length).toBeGreaterThan(0);
	};

	/** Select a date range -> onselect fires, popover closes. */
	const playSelectRange = async ({
		canvasElement,
		args,
	}: {
		canvasElement: HTMLElement;
		args: { onselect?: unknown };
	}) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole('tab', { name: /custom/i });

		// Open popover
		await userEvent.click(trigger);
		const content = getPopoverContent(canvasElement)!;
		const days = getVisibleDayButtons(content);

		// Pick start (5th visible day) and end (15th visible day)
		await userEvent.click(days[4]);
		await userEvent.click(days[14]);

		// onselect should have been called with start and end strings
		const spy = args.onselect as ReturnType<typeof fn>;
		await expect(spy).toHaveBeenCalledOnce();
		const call = spy.mock.calls[0][0] as {
			start: string;
			end: string;
		};
		await expect(call.start).toBeTruthy();
		await expect(call.end).toBeTruthy();

		// Popover closes after complete range selection
		await expectPopoverClosed(canvasElement);
	};

	/** Escape closes the popover. */
	const playEscapeCloses = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole('tab', { name: /custom/i });

		// Open
		await userEvent.click(trigger);
		await expect(getPopoverContent(canvasElement)).not.toBeNull();

		// Escape -> closes
		await userEvent.keyboard('{Escape}');
		await expectPopoverClosed(canvasElement);
	};

	/** Click outside closes the popover. */
	const playClickOutsideCloses = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole('tab', { name: /custom/i });

		// Open
		await userEvent.click(trigger);
		await expect(getPopoverContent(canvasElement)).not.toBeNull();

		// Click outside the popover (on the canvas wrapper)
		await userEvent.click(canvasElement);
		await expectPopoverClosed(canvasElement);
	};

	/** Escape from DateRangePicker popover does NOT propagate to parent layer. */
	const playEscapeContainment = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const trigger = canvas.getByRole('tab', { name: /custom/i });

		// Open popover
		await userEvent.click(trigger);
		const content = getPopoverContent(canvasElement);
		await expect(content).not.toBeNull();
		await expect(content).toHaveAttribute('data-state', 'open');

		// Press Escape — should close the popover
		await userEvent.keyboard('{Escape}');
		await expectPopoverClosed(canvasElement);

		// The trigger should still be in the DOM (parent layer not dismissed)
		await expect(trigger).toBeInTheDocument();
	};
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

<Story name="Open Popover" play={playOpenPopover}>
	{#snippet template()}
		<div class="flex flex-col items-start gap-4 p-8 pb-96">
			<DateRangePicker onselect={() => {}} />
		</div>
	{/snippet}
</Story>

<Story name="Select Range" play={playSelectRange} args={{ onselect: fn() }}>
	{#snippet template(args)}
		<div class="flex flex-col items-start gap-4 p-8 pb-96">
			<DateRangePicker onselect={args.onselect} />
		</div>
	{/snippet}
</Story>

<Story name="Escape Closes" play={playEscapeCloses}>
	{#snippet template()}
		<div class="flex flex-col items-start gap-4 p-8 pb-96">
			<DateRangePicker onselect={() => {}} />
		</div>
	{/snippet}
</Story>

<Story name="Click Outside Closes" play={playClickOutsideCloses}>
	{#snippet template()}
		<div class="flex flex-col items-start gap-4 p-8 pb-96">
			<DateRangePicker onselect={() => {}} />
		</div>
	{/snippet}
</Story>

<Story name="Escape Containment" play={playEscapeContainment}>
	{#snippet template()}
		<div class="flex flex-col items-start gap-4 p-8 pb-96">
			<DateRangePicker onselect={() => {}} />
		</div>
	{/snippet}
</Story>
