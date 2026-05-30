<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
	import ScopeToggle from './ScopeToggle.svelte';
	import type { UsageScope } from '$lib/modules/usage/usage_types.js';

	const { Story } = defineMeta({
		title: 'Blocks/Usage/ScopeToggle',
		component: ScopeToggle,
		tags: ['autodocs'],
		args: {
			value: 'workspace' as UsageScope,
			onchange: fn(),
		},
	});

	const playToggleToGlobal = async ({
		canvasElement,
		args,
	}: {
		canvasElement: HTMLElement;
		args: { onchange?: unknown };
	}) => {
		const canvas = within(canvasElement);
		const select = canvas.getByRole('combobox');
		await userEvent.selectOptions(select, 'global');
		await waitFor(() => {
			expect(args.onchange).toHaveBeenCalledWith('global');
		});
	};
</script>

<Story name="Default">
	{#snippet template(args: { value: UsageScope; onchange: (scope: UsageScope) => void })}
		<div class="p-4">
			<ScopeToggle {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Toggle to Global [play: select global]" play={playToggleToGlobal}>
	{#snippet template(args: { value: UsageScope; onchange: (scope: UsageScope) => void })}
		<div class="p-4">
			<ScopeToggle {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Global Selected">
	{#snippet template(args: { value: UsageScope; onchange: (scope: UsageScope) => void })}
		<div class="p-4">
			<ScopeToggle {...args} value="global" />
		</div>
	{/snippet}
</Story>
