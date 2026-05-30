<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
	import GroupByDropdown from './GroupByDropdown.svelte';
	import type { GroupByOption } from '$lib/modules/usage/usage_types.js';

	const { Story } = defineMeta({
		title: 'Blocks/Usage/GroupByDropdown',
		component: GroupByDropdown,
		tags: ['autodocs'],
		args: {
			value: 'none' as GroupByOption,
			onchange: fn(),
		},
	});

	const playSelectModel = async ({
		canvasElement,
		args,
	}: {
		canvasElement: HTMLElement;
		args: { onchange?: unknown };
	}) => {
		const canvas = within(canvasElement);
		const select = canvas.getByRole('combobox');
		await userEvent.selectOptions(select, 'model');
		await waitFor(() => {
			expect(args.onchange).toHaveBeenCalledWith('model');
		});
	};
</script>

<Story name="Default">
	{#snippet template(args: { value: GroupByOption; onchange: (option: GroupByOption) => void })}
		<div class="p-4">
			<GroupByDropdown {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Select Model [play: select model]" play={playSelectModel}>
	{#snippet template(args: { value: GroupByOption; onchange: (option: GroupByOption) => void })}
		<div class="p-4">
			<GroupByDropdown {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Category Selected">
	{#snippet template(args: { value: GroupByOption; onchange: (option: GroupByOption) => void })}
		<div class="p-4">
			<GroupByDropdown {...args} value="category" />
		</div>
	{/snippet}
</Story>
