<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Progress } from './index.js';

	const { Story } = defineMeta({
		title: 'Base/Progress',
		component: Progress,
		tags: ['autodocs'],
		argTypes: {
			value: { control: 'range', min: 0, max: 100 },
		},
	});
</script>

<Story name="Default" args={{ value: 50 }}>
	{#snippet template(args)}
		<div class="w-80 space-y-1">
			<p class="text-muted-foreground text-sm">{args.value ?? 0}%</p>
			<Progress {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Percent 0" args={{ value: 0 }}>
	{#snippet template(args)}
		<div class="w-80 space-y-1">
			<p class="text-muted-foreground text-sm">{args.value ?? 0}%</p>
			<Progress {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Percent 25" args={{ value: 25 }}>
	{#snippet template(args)}
		<div class="w-80 space-y-1">
			<p class="text-muted-foreground text-sm">{args.value ?? 0}%</p>
			<Progress {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Percent 50" args={{ value: 50 }}>
	{#snippet template(args)}
		<div class="w-80 space-y-1">
			<p class="text-muted-foreground text-sm">{args.value ?? 0}%</p>
			<Progress {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Percent 75" args={{ value: 75 }}>
	{#snippet template(args)}
		<div class="w-80 space-y-1">
			<p class="text-muted-foreground text-sm">{args.value ?? 0}%</p>
			<Progress {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Percent 100" args={{ value: 100 }}>
	{#snippet template(args)}
		<div class="w-80 space-y-1">
			<p class="text-muted-foreground text-sm">{args.value ?? 0}%</p>
			<Progress {...args} />
		</div>
	{/snippet}
</Story>
