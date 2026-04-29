<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Switch } from './index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'UI/Switch',
		component: Switch,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
		argTypes: {
			checked: { control: 'boolean' },
			disabled: { control: 'boolean' },
		},
	});
</script>

<script lang="ts">
	import type { SwitchProps } from './switch-variants.js';
</script>

<Story name="Off">
	{#snippet template(args: SwitchProps)}
		<Switch {...args} />
	{/snippet}
</Story>

<Story name="On">
	{#snippet template(args: SwitchProps)}
		<Switch checked {...args} />
	{/snippet}
</Story>

<Story name="Disabled Off">
	{#snippet template(args: SwitchProps)}
		<Switch disabled {...args} />
	{/snippet}
</Story>

<Story name="Disabled On">
	{#snippet template(args: SwitchProps)}
		<Switch disabled checked {...args} />
	{/snippet}
</Story>

<Story name="With Label">
	{#snippet template(args: SwitchProps)}
		<div class="flex items-center gap-2.5">
			<Switch id="auto-fetch" checked {...args} />
			<Label for="auto-fetch" class="mb-0 cursor-pointer text-[length:var(--text-md)]"
				>Auto-fetch</Label
			>
		</div>
	{/snippet}
</Story>

<Story name="All States">
	{#snippet template(_args: SwitchProps)}
		<div class="grid grid-cols-4 gap-6">
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">Off</span>
				<Switch />
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">On</span>
				<Switch checked />
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">Disabled Off</span>
				<Switch disabled />
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">Disabled On</span>
				<Switch disabled checked />
			</div>
			<div class="col-span-4 flex flex-col gap-2">
				<span class="text-xs text-foreground-subtle">With label</span>
				<div class="flex items-center gap-2.5">
					<Switch id="sw-label-demo" checked />
					<Label
						for="sw-label-demo"
						class="mb-0 cursor-pointer text-[length:var(--text-md)]"
						>Auto-fetch every 5 min</Label
					>
				</div>
			</div>
		</div>
	{/snippet}
</Story>
