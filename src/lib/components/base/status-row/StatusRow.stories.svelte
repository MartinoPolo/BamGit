<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';

	import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
	import { StatusRow } from './index.js';

	const { Story } = defineMeta({
		title: 'Base/StatusRow',
		component: StatusRow,
		tags: ['autodocs'],
		argTypes: {
			active: { control: 'boolean' },
			label: { control: 'text' },
			meta: { control: 'text' },
		},
	});

	const playClickCallsOnclick = async ({
		canvasElement,
		args,
	}: {
		canvasElement: HTMLElement;
		args: { onclick?: unknown };
	}) => {
		const spy = args.onclick as ReturnType<typeof fn>;
		const canvas = within(canvasElement);
		const row = canvas.getByRole('button', { name: /AFK loop/i });
		await userEvent.click(row);
		await waitFor(() => expect(spy).toHaveBeenCalledOnce());
	};
</script>

<script lang="ts">
	import type { StatusRowProps } from './status-row-variants.js';
</script>

<Story name="Active" args={{ active: true, label: 'AFK loop running', meta: '3 sessions (2 AFK)' }}>
	{#snippet template(args: StatusRowProps)}
		<div class="w-73">
			<StatusRow {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Inactive" args={{ active: false, label: 'AFK loop off', meta: '2 sessions' }}>
	{#snippet template(args: StatusRowProps)}
		<div class="w-73">
			<StatusRow {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Active Idle" args={{ active: true, label: 'AFK loop running', meta: 'idle' }}>
	{#snippet template(args: StatusRowProps)}
		<div class="w-73">
			<StatusRow {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Custom Active Color">
	{#snippet template(args: StatusRowProps)}
		<div class="flex w-73 flex-col gap-2">
			<StatusRow
				{...args}
				active
				label="Azure status"
				meta="online"
				activeColor="var(--azure-400)"
			/>
			<StatusRow active label="Amber status" meta="warning" activeColor="var(--amber-400)" />
		</div>
	{/snippet}
</Story>

<Story name="Active Without Meta" args={{ active: true, label: 'AFK loop running' }}>
	{#snippet template(args: StatusRowProps)}
		<div class="w-73">
			<StatusRow {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Inactive Without Meta" args={{ active: false, label: 'AFK loop off' }}>
	{#snippet template(args: StatusRowProps)}
		<div class="w-73">
			<StatusRow {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Clickable">
	{#snippet template(args: StatusRowProps)}
		<div class="w-73">
			<StatusRow
				{...args}
				active
				label="AFK loop running"
				meta="3 sessions"
				onclick={() => alert('Clicked!')}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Test: Click Calls Onclick" args={{ onclick: fn() }} play={playClickCallsOnclick}>
	{#snippet template(args: StatusRowProps)}
		<div class="w-73">
			<StatusRow {...args} active label="AFK loop running" meta="3 sessions" />
		</div>
	{/snippet}
</Story>
