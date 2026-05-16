<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
	import { ColorThemePicker } from './index.js';
	import type { ColorThemeOption } from './color_theme_picker_types.js';

	const TEST_OPTIONS: ColorThemeOption[] = [
		{
			value: 'monochrome',
			label: 'Monochrome',
			swatchColors: ['bg-chart-1', 'bg-chart-1/60', 'bg-chart-1/30'],
		},
		{
			value: 'traffic-light',
			label: 'Traffic Light',
			swatchColors: ['bg-green-500', 'bg-amber-400', 'bg-red-500'],
		},
		{
			value: 'gradient',
			label: 'Gradient',
			swatchColors: ['bg-blue-500', 'bg-yellow-400', 'bg-red-500'],
		},
	];

	const { Story } = defineMeta({
		title: 'Derived/ColorThemePicker',
		component: ColorThemePicker,
		tags: ['autodocs'],
		args: {
			onchange: fn(),
		},
	});

	/* ------------------------------------------------------------------ */
	/*  Helpers                                                           */
	/* ------------------------------------------------------------------ */

	function getPopoverContent(canvas: HTMLElement): HTMLElement | null {
		return canvas.querySelector('[data-slot="popover-content"]');
	}

	async function expectPopoverClosed(canvas: HTMLElement) {
		const content = getPopoverContent(canvas);
		if (content) {
			await waitFor(() => expect(content.dataset.state).toBe('closed'));
			return;
		}
	}

	/* ------------------------------------------------------------------ */
	/*  Play tests                                                        */
	/* ------------------------------------------------------------------ */

	const playOpensPopoverWithRadioGroup = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const canvas = within(canvasElement);

		await expectPopoverClosed(canvasElement);

		const trigger = canvas.getByRole('button', { name: /color theme/i });
		trigger.click();

		await waitFor(() => {
			const content = getPopoverContent(canvasElement);
			expect(content).not.toBeNull();
			expect(content).toHaveAttribute('data-state', 'open');
		});

		const content = getPopoverContent(canvasElement)!;
		const contentScope = within(content);
		const radioGroup = contentScope.getByRole('radiogroup');
		await expect(radioGroup).toBeInTheDocument();

		const radios = contentScope.getAllByRole('radio');
		await expect(radios).toHaveLength(3);
	};

	const playSelectsOptionAndCloses = async ({
		canvasElement,
		args,
	}: {
		canvasElement: HTMLElement;
		args: { onchange?: unknown };
	}) => {
		const canvas = within(canvasElement);

		const trigger = canvas.getByRole('button', { name: /color theme/i });
		trigger.click();

		await waitFor(() => {
			const content = getPopoverContent(canvasElement);
			expect(content).toHaveAttribute('data-state', 'open');
		});

		const content = getPopoverContent(canvasElement)!;
		const contentScope = within(content);
		const radios = contentScope.getAllByRole('radio');

		// Click "Traffic Light" (second option)
		radios[1].click();

		await waitFor(() => expect(args.onchange).toHaveBeenCalledWith('traffic-light'));
		await expectPopoverClosed(canvasElement);
	};

	const playCheckedStateAndIcon = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		const trigger = canvas.getByRole('button', { name: /color theme/i });
		trigger.click();

		await waitFor(() => {
			const content = getPopoverContent(canvasElement);
			expect(content).toHaveAttribute('data-state', 'open');
		});

		const content = getPopoverContent(canvasElement)!;
		const contentScope = within(content);
		const radios = contentScope.getAllByRole('radio');

		// First option (monochrome) should be checked
		await expect(radios[0]).toHaveAttribute('data-state', 'checked');
		await expect(radios[1]).toHaveAttribute('data-state', 'unchecked');
		await expect(radios[2]).toHaveAttribute('data-state', 'unchecked');

		// Check icon should be present in the checked item (SVG with text-primary class)
		const checkIcon = radios[0].querySelector('svg.text-primary');
		await expect(checkIcon).not.toBeNull();
	};

	const playEscapeClosesPopover = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		const trigger = canvas.getByRole('button', { name: /color theme/i });
		trigger.click();

		await waitFor(() => {
			const content = getPopoverContent(canvasElement);
			expect(content).toHaveAttribute('data-state', 'open');
		});

		await userEvent.keyboard('{Escape}');
		await expectPopoverClosed(canvasElement);
		await expect(trigger).toBeInTheDocument();
	};

	const playKeyboardNavigation = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		const trigger = canvas.getByRole('button', { name: /color theme/i });
		trigger.click();

		await waitFor(() => {
			const content = getPopoverContent(canvasElement);
			expect(content).toHaveAttribute('data-state', 'open');
		});

		const content = getPopoverContent(canvasElement)!;
		const contentScope = within(content);
		const radios = contentScope.getAllByRole('radio');

		// Focus the first radio
		radios[0].focus();
		await expect(radios[0]).toHaveFocus();

		// ArrowDown moves to next
		await userEvent.keyboard('{ArrowDown}');
		await waitFor(() => expect(radios[1]).toHaveFocus());

		// ArrowDown again
		await userEvent.keyboard('{ArrowDown}');
		await waitFor(() => expect(radios[2]).toHaveFocus());
	};
</script>

<script lang="ts">
	import type { ColorThemePickerProps } from './color_theme_picker_types.js';

	let selectedTheme = $state('monochrome');
</script>

<Story name="Default" play={playOpensPopoverWithRadioGroup}>
	{#snippet template(args: ColorThemePickerProps)}
		<div class="flex items-start gap-4 p-8 pb-48" data-testid="story-wrapper">
			<ColorThemePicker
				{...args}
				options={TEST_OPTIONS}
				value={selectedTheme}
				onchange={(v) => {
					selectedTheme = v;
					args.onchange?.(v);
				}}
				portalDisabled={true}
			/>
			<span class="text-sm text-muted-foreground">Selected: {selectedTheme}</span>
		</div>
	{/snippet}
</Story>

<Story name="Select Option" play={playSelectsOptionAndCloses}>
	{#snippet template(args: ColorThemePickerProps)}
		<div class="flex items-start gap-4 p-8 pb-48" data-testid="story-wrapper">
			<ColorThemePicker
				{...args}
				options={TEST_OPTIONS}
				value={selectedTheme}
				onchange={(v) => {
					selectedTheme = v;
					args.onchange?.(v);
				}}
				portalDisabled={true}
			/>
			<span class="text-sm text-muted-foreground">Selected: {selectedTheme}</span>
		</div>
	{/snippet}
</Story>

<Story name="Checked State" play={playCheckedStateAndIcon}>
	{#snippet template(args: ColorThemePickerProps)}
		<div class="flex items-start gap-4 p-8 pb-48" data-testid="story-wrapper">
			<ColorThemePicker
				{...args}
				options={TEST_OPTIONS}
				value="monochrome"
				onchange={(v) => {
					args.onchange?.(v);
				}}
				portalDisabled={true}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Escape Closes" play={playEscapeClosesPopover}>
	{#snippet template(args: ColorThemePickerProps)}
		<div class="flex items-start gap-4 p-8 pb-48" data-testid="story-wrapper">
			<ColorThemePicker
				{...args}
				options={TEST_OPTIONS}
				value={selectedTheme}
				onchange={(v) => {
					selectedTheme = v;
					args.onchange?.(v);
				}}
				portalDisabled={true}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Keyboard Navigation" play={playKeyboardNavigation}>
	{#snippet template(args: ColorThemePickerProps)}
		<div class="flex items-start gap-4 p-8 pb-48" data-testid="story-wrapper">
			<ColorThemePicker
				{...args}
				options={TEST_OPTIONS}
				value={selectedTheme}
				onchange={(v) => {
					selectedTheme = v;
					args.onchange?.(v);
				}}
				portalDisabled={true}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Traffic Light Pre-selected">
	{#snippet template(args: ColorThemePickerProps)}
		<div class="flex items-start gap-4 p-8 pb-48" data-testid="story-wrapper">
			<ColorThemePicker
				{...args}
				options={TEST_OPTIONS}
				value="traffic-light"
				onchange={(v) => {
					args.onchange?.(v);
				}}
				portalDisabled={true}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Gradient Pre-selected">
	{#snippet template(args: ColorThemePickerProps)}
		<div class="flex items-start gap-4 p-8 pb-48" data-testid="story-wrapper">
			<ColorThemePicker
				{...args}
				options={TEST_OPTIONS}
				value="gradient"
				onchange={(v) => {
					args.onchange?.(v);
				}}
				portalDisabled={true}
			/>
		</div>
	{/snippet}
</Story>
