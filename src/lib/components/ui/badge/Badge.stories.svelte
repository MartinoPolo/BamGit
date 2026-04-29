<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Badge, BADGE_VARIANT_OPTIONS, BADGE_DOT_OPTIONS } from './index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'UI/Badge',
		component: Badge,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: [...BADGE_VARIANT_OPTIONS],
			},
			dot: {
				control: 'select',
				options: [undefined, ...BADGE_DOT_OPTIONS],
			},
		},
	});
</script>

<script lang="ts">
	import type { BadgeProps } from './badge-variants.js';
	import { CircleCheck as CheckIcon, AlertTriangle as AlertIcon } from 'lucide-svelte';
</script>

<Story name="Default" args={{ variant: 'default' }}>
	{#snippet template(args: BadgeProps)}
		<Badge {...args}>Default</Badge>
	{/snippet}
</Story>

<Story name="All Variants">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-wrap items-center gap-3">
			<Badge variant="default" {...args}>Default</Badge>
			<Badge variant="success" {...args}>Success</Badge>
			<Badge variant="warning" {...args}>Warning</Badge>
			<Badge variant="danger" {...args}>Danger</Badge>
			<Badge variant="info" {...args}>Info</Badge>
			<Badge variant="moss" {...args}>Moss</Badge>
			<Badge variant="amber" {...args}>Amber</Badge>
			<Badge variant="mono" {...args}>Mono</Badge>
		</div>
	{/snippet}
</Story>

<Story name="With Static Dot">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-wrap items-center gap-3">
			<Badge variant="success" dot="static" {...args}>Active</Badge>
			<Badge variant="danger" dot="static" {...args}>Error</Badge>
			<Badge variant="info" dot="static" {...args}>Info</Badge>
		</div>
	{/snippet}
</Story>

<Story name="With Pulsing Dot">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-wrap items-center gap-3">
			<Badge variant="success" dot="pulsing" {...args}>Live</Badge>
			<Badge variant="danger" dot="pulsing" {...args}>Critical</Badge>
			<Badge variant="warning" dot="pulsing" {...args}>Pending</Badge>
		</div>
	{/snippet}
</Story>

<Story name="With Icon">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-wrap items-center gap-3">
			<Badge variant="success" {...args}>
				{#snippet icon()}<CheckIcon class="size-3" />{/snippet}
				Passed
			</Badge>
			<Badge variant="warning" {...args}>
				{#snippet icon()}<AlertIcon class="size-3" />{/snippet}
				Warning
			</Badge>
		</div>
	{/snippet}
</Story>

<Story name="Mono">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-wrap items-center gap-3">
			<Badge variant="mono" {...args}>v2.1.0</Badge>
			<Badge variant="mono" {...args}>GET</Badge>
			<Badge variant="mono" {...args}>200</Badge>
		</div>
	{/snippet}
</Story>
