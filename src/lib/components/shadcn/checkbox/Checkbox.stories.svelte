<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, within } from 'storybook/test';
	import { Checkbox } from './index.js';
	import { Label } from '$lib/components/shadcn/label/index.js';

	const { Story } = defineMeta({
		title: 'Base/Checkbox',
		component: Checkbox,
		tags: ['autodocs'],
		argTypes: {
			checked: { control: 'boolean' },
			indeterminate: { control: 'boolean' },
			disabled: { control: 'boolean' },
		},
	});

	const playClickToCheck = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const checkbox = canvas.getByRole('checkbox');
		await expect(checkbox).toHaveAttribute('aria-checked', 'false');
		await userEvent.click(checkbox);
		await expect(checkbox).toHaveAttribute('aria-checked', 'true');
	};

	const playClickToUncheck = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const checkbox = canvas.getByRole('checkbox');
		await expect(checkbox).toHaveAttribute('aria-checked', 'true');
		await userEvent.click(checkbox);
		await expect(checkbox).toHaveAttribute('aria-checked', 'false');
	};

	const playDisabledNoChange = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const checkboxes = canvas.getAllByRole('checkbox');
		const uncheckedDisabled = checkboxes[0];
		const checkedDisabled = checkboxes[1];

		await expect(uncheckedDisabled).toBeDisabled();
		await expect(uncheckedDisabled).toHaveAttribute('aria-checked', 'false');
		await userEvent.click(uncheckedDisabled);
		await expect(uncheckedDisabled).toHaveAttribute('aria-checked', 'false');

		await expect(checkedDisabled).toBeDisabled();
		await expect(checkedDisabled).toHaveAttribute('aria-checked', 'true');
		await userEvent.click(checkedDisabled);
		await expect(checkedDisabled).toHaveAttribute('aria-checked', 'true');
	};

	const playKeyboardToggle = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const checkbox = canvas.getByRole('checkbox');
		await expect(checkbox).toHaveAttribute('aria-checked', 'false');
		await checkbox.focus();
		await userEvent.keyboard(' ');
		await expect(checkbox).toHaveAttribute('aria-checked', 'true');
		await userEvent.keyboard(' ');
		await expect(checkbox).toHaveAttribute('aria-checked', 'false');
	};
</script>

<script lang="ts">
	import type { CheckboxProps } from './checkbox-variants.js';
</script>

<Story name="Unchecked [play: click to check]" play={playClickToCheck}>
	{#snippet template(args: CheckboxProps)}
		<Checkbox {...args} />
	{/snippet}
</Story>

<Story name="Checked [play: click to uncheck]" play={playClickToUncheck}>
	{#snippet template(args: CheckboxProps)}
		<Checkbox checked {...args} />
	{/snippet}
</Story>

<Story name="Indeterminate">
	{#snippet template(args: CheckboxProps)}
		<Checkbox indeterminate {...args} />
	{/snippet}
</Story>

<Story name="Disabled [play: disabled no change]" play={playDisabledNoChange}>
	{#snippet template(args: CheckboxProps)}
		<div class="flex items-center gap-4">
			<Checkbox disabled {...args} />
			<Checkbox disabled checked {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Keyboard Toggle [play: keyboard toggle]" play={playKeyboardToggle}>
	{#snippet template(args: CheckboxProps)}
		<div class="w-80">
			<div
				class="mb-4 rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground"
			>
				<p class="mb-1 font-medium text-foreground">Keyboard shortcuts</p>
				<ul class="flex flex-col gap-0.5">
					<li>
						<kbd class="rounded bg-muted px-1 font-mono text-xs">Space</kbd> — Toggle checked
						state
					</li>
				</ul>
			</div>
			<Checkbox {...args} />
		</div>
	{/snippet}
</Story>

<Story name="With Label">
	{#snippet template(args: CheckboxProps)}
		<div class="flex items-center gap-2">
			<Checkbox id="worktree" checked {...args} />
			<Label for="worktree" class="mb-0 cursor-pointer text-(length:--text-md)"
				>Auto-create worktree</Label
			>
		</div>
	{/snippet}
</Story>

<Story name="All States">
	{#snippet template(args: CheckboxProps)}
		<div class="grid grid-cols-4 gap-6">
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">Unchecked</span>
				<Checkbox {...args} />
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">Checked</span>
				<Checkbox checked />
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">Indeterminate</span>
				<Checkbox indeterminate />
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">Disabled</span>
				<Checkbox disabled />
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">Disabled + Checked</span>
				<Checkbox disabled checked />
			</div>
			<div class="col-span-3 flex flex-col gap-2">
				<span class="text-xs text-foreground-subtle">With label</span>
				<div class="flex items-center gap-2">
					<Checkbox id="cb-label-demo" checked />
					<Label for="cb-label-demo" class="mb-0 cursor-pointer text-(length:--text-md)"
						>Auto-create worktree</Label
					>
				</div>
			</div>
		</div>
	{/snippet}
</Story>
