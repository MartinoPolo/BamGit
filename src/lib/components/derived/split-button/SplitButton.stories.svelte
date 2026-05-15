<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import { SplitButton } from './index.js';

	const ADOPT_OPTIONS = [
		{ value: 'adopt', label: 'Adopt' },
		{ value: 'adopt-start', label: 'Adopt & Start' },
		{ value: 'adopt-setup', label: 'Adopt & Setup' },
	] as const;

	const { Story } = defineMeta({
		title: 'Derived/SplitButton',
		component: SplitButton,
		tags: ['autodocs'],
		args: {
			onselect: fn(),
			options: [...ADOPT_OPTIONS],
			defaultValue: 'adopt',
		},
	});
</script>

<script lang="ts">
	import { expect, userEvent, waitFor, within } from 'storybook/test';
	import type { SplitButtonProps } from './split_button_types.js';
</script>

<Story name="Default" args={{ options: [...ADOPT_OPTIONS], defaultValue: 'adopt' }}>
	{#snippet template(args: SplitButtonProps)}
		<SplitButton {...args} />
	{/snippet}
</Story>

<Story name="Sizes">
	{#snippet template(args: SplitButtonProps)}
		<div class="flex flex-col gap-4">
			<div class="flex items-center gap-3">
				<span class="w-12 text-xs text-foreground-muted">sm</span>
				<SplitButton {...args} size="sm" />
			</div>
			<div class="flex items-center gap-3">
				<span class="w-12 text-xs text-foreground-muted">md</span>
				<SplitButton {...args} size="md" />
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Disabled">
	{#snippet template(args: SplitButtonProps)}
		<SplitButton {...args} disabled />
	{/snippet}
</Story>

<Story
	name="Dropdown Selection"
	args={{ options: [...ADOPT_OPTIONS], defaultValue: 'adopt' }}
	play={async ({ canvasElement, args: playArgs }) => {
		const canvas = within(canvasElement);

		const group = canvas.getByRole('group');
		expect(group).toBeInTheDocument();

		const groupCanvas = within(group);
		const mainButton = groupCanvas.getByRole('button', { name: 'Adopt' });
		expect(mainButton).toBeInTheDocument();

		await userEvent.click(mainButton);
		await waitFor(() => {
			expect(playArgs.onselect).toHaveBeenCalledWith('adopt');
		});

		const groupButtons = groupCanvas.getAllByRole('button');
		expect(groupButtons.length).toBe(2);
	}}
>
	{#snippet template(args: SplitButtonProps)}
		<SplitButton {...args} />
	{/snippet}
</Story>
