<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Checkbox } from './index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Base/Checkbox',
		component: Checkbox,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
		argTypes: {
			checked: { control: 'boolean' },
			indeterminate: { control: 'boolean' },
			disabled: { control: 'boolean' },
		},
	});
</script>

<script lang="ts">
	import type { CheckboxProps } from './checkbox-variants.js';
</script>

<Story name="Unchecked">
	{#snippet template(args: CheckboxProps)}
		<Checkbox {...args} />
	{/snippet}
</Story>

<Story name="Checked">
	{#snippet template(args: CheckboxProps)}
		<Checkbox checked {...args} />
	{/snippet}
</Story>

<Story name="Indeterminate">
	{#snippet template(args: CheckboxProps)}
		<Checkbox indeterminate {...args} />
	{/snippet}
</Story>

<Story name="Disabled">
	{#snippet template(args: CheckboxProps)}
		<div class="flex items-center gap-4">
			<Checkbox disabled {...args} />
			<Checkbox disabled checked {...args} />
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
