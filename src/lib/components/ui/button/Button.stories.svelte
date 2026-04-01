<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Button } from './index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'UI/Button',
		component: Button,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
			},
			size: {
				control: 'select',
				options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
			},
			disabled: { control: 'boolean' },
		},
	});
</script>

<script lang="ts">
	import type { ButtonProps } from './button-variants.js';
</script>

<Story name="Default" args={{ variant: 'default' }}>
	{#snippet template(args: ButtonProps)}
		<Button {...args}>Button</Button>
	{/snippet}
</Story>

<Story name="Secondary">
	{#snippet template(args: ButtonProps)}
		<Button variant="secondary" {...args}>Secondary</Button>
	{/snippet}
</Story>

<Story name="Outline">
	{#snippet template(args: ButtonProps)}
		<Button variant="outline" {...args}>Outline</Button>
	{/snippet}
</Story>

<Story name="Ghost">
	{#snippet template(args: ButtonProps)}
		<Button variant="ghost" {...args}>Ghost</Button>
	{/snippet}
</Story>

<Story name="Destructive">
	{#snippet template(args: ButtonProps)}
		<Button variant="destructive" {...args}>Destructive</Button>
	{/snippet}
</Story>

<Story name="Link">
	{#snippet template(args: ButtonProps)}
		<Button variant="link" {...args}>Link</Button>
	{/snippet}
</Story>

<Story name="Disabled">
	{#snippet template(args: ButtonProps)}
		<Button disabled {...args}>Disabled</Button>
	{/snippet}
</Story>

<Story name="All Variants">
	{#snippet template(args: ButtonProps)}
		<div class="flex flex-wrap items-center gap-4">
			<Button variant="default" {...args}>Default</Button>
			<Button variant="secondary" {...args}>Secondary</Button>
			<Button variant="outline" {...args}>Outline</Button>
			<Button variant="ghost" {...args}>Ghost</Button>
			<Button variant="destructive" {...args}>Destructive</Button>
			<Button variant="link" {...args}>Link</Button>
		</div>
	{/snippet}
</Story>

<Story name="All Sizes">
	{#snippet template(args: ButtonProps)}
		<div class="flex flex-wrap items-center gap-4">
			<Button size="xs" {...args}>Extra Small</Button>
			<Button size="sm" {...args}>Small</Button>
			<Button size="default" {...args}>Default</Button>
			<Button size="lg" {...args}>Large</Button>
		</div>
	{/snippet}
</Story>
