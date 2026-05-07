<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Card, CARD_STATE_OPTIONS } from './index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'UI/Card',
		component: Card,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
		argTypes: {
			padding: {
				control: 'select',
				options: ['none', 'padded'],
			},
			state: {
				control: 'select',
				options: [...CARD_STATE_OPTIONS],
			},
		},
	});
</script>

<script lang="ts">
	import type { CardProps } from './card-variants.js';
</script>

<Story name="Default" args={{ padding: 'padded' }}>
	{#snippet template(args: CardProps)}
		<Card {...args}>
			<p class="text-sm text-foreground">Default card with padded content.</p>
		</Card>
	{/snippet}
</Story>

<Story name="No Padding">
	{#snippet template(args: CardProps)}
		<Card padding="none" {...args}>
			<div class="p-4">
				<p class="text-sm text-foreground">Card with manual padding control.</p>
			</div>
		</Card>
	{/snippet}
</Story>

<Story name="All States">
	{#snippet template(args: CardProps)}
		<div class="grid grid-cols-2 gap-4">
			{#each CARD_STATE_OPTIONS as state (state)}
				<Card padding="padded" {state} {...args}>
					<p class="text-xs font-medium text-foreground-muted">{state}</p>
					<p class="text-sm text-foreground">Card in {state} state.</p>
				</Card>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Selected">
	{#snippet template(args: CardProps)}
		<Card padding="padded" state="selected" {...args}>
			<p class="text-sm text-foreground">This card is selected.</p>
		</Card>
	{/snippet}
</Story>

<Story name="Loading">
	{#snippet template(args: CardProps)}
		<Card padding="padded" state="loading" {...args}>
			<p class="text-sm text-foreground">Loading content...</p>
		</Card>
	{/snippet}
</Story>

<Story name="Error">
	{#snippet template(args: CardProps)}
		<Card padding="padded" state="error" {...args}>
			<p class="text-sm text-foreground">Something went wrong.</p>
		</Card>
	{/snippet}
</Story>

<Story name="Accent Bar Color">
	{#snippet template(args: CardProps)}
		<Card padding="padded" accentBarColor="oklch(0.580 0.096 134)" {...args}>
			<p class="text-sm text-foreground">Card with accent bar color.</p>
		</Card>
	{/snippet}
</Story>

<Story name="Gradient Tint">
	{#snippet template(args: CardProps)}
		<Card padding="padded" gradientTint="oklch(0.570 0.130 235)" {...args}>
			<p class="text-sm text-foreground">Card with gradient tint overlay.</p>
		</Card>
	{/snippet}
</Story>

<Story name="Accent Bar + Gradient Tint">
	{#snippet template(args: CardProps)}
		<Card padding="padded" accentBarColor="#e06c75" gradientTint="#e06c75" {...args}>
			<p class="text-sm text-foreground">Card with both accent bar and gradient tint.</p>
		</Card>
	{/snippet}
</Story>
