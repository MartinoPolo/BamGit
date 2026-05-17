<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
	import { ColorPicker } from './index.js';
	import { DEFAULT_COLOR_PALETTE } from './color_utils.js';

	const { Story } = defineMeta({
		title: 'Derived/ColorPicker',
		component: ColorPicker,
		tags: ['autodocs'],
		args: {
			onSelect: fn(),
		},
		argTypes: {
			onSelect: { action: 'selected' },
			displayText: { control: 'text' },
			side: { control: 'select', options: ['top', 'bottom', 'left', 'right'] },
			align: { control: 'select', options: ['start', 'center', 'end'] },
		},
	});

	/* ------------------------------------------------------------------ */
	/*  Helpers                                                           */
	/* ------------------------------------------------------------------ */

	/** Find popover content inside the canvas (portal disabled in stories). */
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

	/* ------------------------------------------------------------------ */
	/*  play() interaction tests                                          */
	/* ------------------------------------------------------------------ */

	/** Click trigger -> popover opens with color swatches visible. */
	const playOpensPopover = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Popover starts closed
		await expectPopoverClosed(canvasElement);

		// Click trigger -> popover opens
		const trigger = canvas.getByRole('button', { name: /color:/i });
		await userEvent.click(trigger);

		const content = getPopoverContent(canvasElement);
		await expect(content).not.toBeNull();
		await expect(content).toHaveAttribute('data-state', 'open');

		// Swatches should be visible inside the popover
		const contentScope = within(content!);
		const swatches = contentScope.getAllByRole('button', { name: /^#[0-9a-f]{6}$/i });
		await expect(swatches.length).toBeGreaterThan(0);
	};

	/** Click a color swatch -> onSelect fired, popover closes. */
	const playSwatchSelectAndClose = async ({
		canvasElement,
		args,
	}: {
		canvasElement: HTMLElement;
		args: { onSelect: unknown };
	}) => {
		const canvas = within(canvasElement);

		// Open popover
		const trigger = canvas.getByRole('button', { name: /color:/i });
		await userEvent.click(trigger);
		const content = getPopoverContent(canvasElement);
		await expect(content).not.toBeNull();

		// Click a different swatch
		const targetColor = DEFAULT_COLOR_PALETTE[3]; // '#38a169'
		const contentScope = within(content!);
		const swatch = contentScope.getByRole('button', { name: targetColor });
		await userEvent.click(swatch);

		// onSelect should have been called with the target color
		await expect(args.onSelect).toHaveBeenCalledWith(targetColor);

		// Popover should close
		await expectPopoverClosed(canvasElement);
	};

	/** Type a hex value in the input -> trigger preview updates. */
	const playHexInputUpdatesPreview = async ({
		canvasElement,
		args,
	}: {
		canvasElement: HTMLElement;
		args: { onSelect: unknown };
	}) => {
		const canvas = within(canvasElement);

		// Open popover
		const trigger = canvas.getByRole('button', { name: /color:/i });
		await userEvent.click(trigger);
		const content = getPopoverContent(canvasElement);
		await expect(content).not.toBeNull();

		// Find and clear the hex input, then type a new color
		const contentScope = within(content!);
		const hexInput = contentScope.getByPlaceholderText('#000000');
		await userEvent.clear(hexInput);
		await userEvent.type(hexInput, '#00ff00');

		// Press Enter to confirm the hex value (doesn't move focus out of popover)
		await userEvent.keyboard('{Enter}');

		// onSelect should have been called with the typed hex
		await waitFor(() => expect(args.onSelect).toHaveBeenCalledWith('#00ff00'));

		// Popover should still be open (hex input does not close it)
		await expect(getPopoverContent(canvasElement)).not.toBeNull();
	};

	/** Escape inside the popover -> only the popover closes. */
	const playEscapeClosesPopover = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Open popover
		const trigger = canvas.getByRole('button', { name: /color:/i });
		await userEvent.click(trigger);
		const content = getPopoverContent(canvasElement);
		await expect(content).not.toBeNull();
		await expect(content).toHaveAttribute('data-state', 'open');

		// Press Escape -> popover closes
		await userEvent.keyboard('{Escape}');
		await expectPopoverClosed(canvasElement);

		// Trigger is still in the DOM (parent layer not dismissed)
		await expect(trigger).toBeInTheDocument();
	};
</script>

<script lang="ts">
	import type { ColorPickerProps } from './color_picker_types.js';

	const USED_COLORS = ['#e53e3e', '#3182ce', '#38a169', '#805ad5'];

	let selectedColor = $state('#dd6b20');

	function handleSelect(color: string) {
		selectedColor = color;
	}
</script>

<Story name="Default" args={{}} play={playOpensPopover}>
	{#snippet template(args: ColorPickerProps)}
		<div class="flex items-center gap-4">
			<ColorPicker {...args} {selectedColor} onSelect={handleSelect} portalDisabled={true} />
			<span class="font-mono text-xs text-muted-foreground">{selectedColor}</span>
		</div>
	{/snippet}
</Story>

<Story name="Swatch Select" args={{}} play={playSwatchSelectAndClose}>
	{#snippet template(args: ColorPickerProps)}
		<div class="flex items-center gap-4 pb-72">
			<ColorPicker
				{...args}
				{selectedColor}
				onSelect={(color: string) => {
					handleSelect(color);
					args.onSelect?.(color);
				}}
				portalDisabled={true}
			/>
			<span class="font-mono text-xs text-muted-foreground">{selectedColor}</span>
		</div>
	{/snippet}
</Story>

<Story name="Hex Input" args={{}} play={playHexInputUpdatesPreview}>
	{#snippet template(args: ColorPickerProps)}
		<div class="flex items-center gap-4 pb-72">
			<ColorPicker
				{...args}
				{selectedColor}
				onSelect={(color: string) => {
					handleSelect(color);
					args.onSelect?.(color);
				}}
				portalDisabled={true}
			/>
			<span class="font-mono text-xs text-muted-foreground">{selectedColor}</span>
		</div>
	{/snippet}
</Story>

<Story name="Escape Closes" args={{}} play={playEscapeClosesPopover}>
	{#snippet template(args: ColorPickerProps)}
		<div class="flex items-center gap-4 pb-72">
			<ColorPicker {...args} {selectedColor} onSelect={handleSelect} portalDisabled={true} />
			<span class="font-mono text-xs text-muted-foreground">{selectedColor}</span>
		</div>
	{/snippet}
</Story>

<Story name="With Display Text" args={{ displayText: 'A' }}>
	{#snippet template(args: ColorPickerProps)}
		<div class="flex items-center gap-4">
			<ColorPicker {...args} {selectedColor} onSelect={handleSelect} />
			<span class="font-mono text-xs text-muted-foreground">{selectedColor}</span>
		</div>
	{/snippet}
</Story>

<Story name="With Used Colors" args={{ displayText: 'A' }}>
	{#snippet template(args: ColorPickerProps)}
		<div class="flex flex-col gap-3">
			<p class="text-xs text-muted-foreground">
				Grayed-out swatches are assigned to other issues
			</p>
			<div class="flex items-center gap-4">
				<ColorPicker
					{...args}
					usedColors={USED_COLORS}
					{selectedColor}
					onSelect={handleSelect}
				/>
				<span class="font-mono text-xs text-muted-foreground">{selectedColor}</span>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Dark Mode" args={{}}>
	{#snippet template(args: ColorPickerProps)}
		<div class="flex items-center gap-4">
			<ColorPicker {...args} {selectedColor} onSelect={handleSelect} />
			<span class="font-mono text-xs text-muted-foreground">{selectedColor}</span>
		</div>
	{/snippet}
</Story>

<Story name="Color Palettes">
	{#snippet template(args: ColorPickerProps)}
		<div class="flex gap-72 pb-72">
			<div>
				<p class="mb-2 text-sm font-medium text-muted-foreground">Light</p>
				<div data-theme="light" class="rounded-lg bg-background p-4">
					<ColorPicker
						{...args}
						{selectedColor}
						onSelect={handleSelect}
						open={true}
						portalDisabled={true}
					/>
				</div>
			</div>
			<div>
				<p class="mb-2 text-sm font-medium text-muted-foreground">Dark</p>
				<div data-theme="dark" class="rounded-lg bg-background p-4">
					<ColorPicker
						{...args}
						{selectedColor}
						onSelect={handleSelect}
						open={true}
						portalDisabled={true}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</Story>
