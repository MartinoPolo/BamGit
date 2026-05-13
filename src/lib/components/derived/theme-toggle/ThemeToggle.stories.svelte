<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ThemeToggle from './ThemeToggle.svelte';

	const { Story } = defineMeta({
		title: 'Derived/ThemeToggle',
		component: ThemeToggle,
		tags: ['autodocs'],
		argTypes: {
			collapsed: { control: 'boolean' },
		},
	});
</script>

<script lang="ts">
	import type { ComponentProps } from 'svelte';

	type ToggleProps = ComponentProps<typeof ThemeToggle>;
</script>

<Story name="Default" args={{ collapsed: false }}>
	{#snippet template(args: ToggleProps)}
		<div class="w-56 rounded-lg bg-sidebar p-2">
			<ThemeToggle {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Collapsed" args={{ collapsed: true }}>
	{#snippet template(args: ToggleProps)}
		<div class="flex w-14 justify-center rounded-lg bg-sidebar px-2">
			<ThemeToggle {...args} />
		</div>
	{/snippet}
</Story>
