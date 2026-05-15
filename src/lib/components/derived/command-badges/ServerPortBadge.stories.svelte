<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import { ServerPortBadge } from './index.js';
	import { BADGE_STYLES } from '$lib/components/shadcn/badge/index.js';

	const { Story } = defineMeta({
		title: 'Derived/ServerPortBadge',
		component: ServerPortBadge,
		tags: ['autodocs'],
		args: {
			onclick: fn(),
		},
		argTypes: {
			badgeStyle: {
				control: 'select',
				options: [...BADGE_STYLES],
			},
		},
	});
</script>

<script lang="ts">
	import type { ServerPortBadgeProps } from './server_port_badge_types.js';
</script>

<Story name="Default">
	{#snippet template(args: ServerPortBadgeProps)}
		<ServerPortBadge port={5173} onclick={args.onclick} />
	{/snippet}
</Story>

<Story name="Badge Styles">
	{#snippet template(args: ServerPortBadgeProps)}
		<div class="flex flex-col gap-4">
			{#each BADGE_STYLES as style (style)}
				<div class="flex items-center gap-3">
					<span class="w-28 text-xs text-foreground-muted">{style}</span>
					<ServerPortBadge port={3000} badgeStyle={style} onclick={args.onclick} />
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Various Ports">
	{#snippet template(args: ServerPortBadgeProps)}
		<div class="flex flex-wrap gap-3">
			<ServerPortBadge port={3000} onclick={args.onclick} />
			<ServerPortBadge port={5173} onclick={args.onclick} />
			<ServerPortBadge port={8080} onclick={args.onclick} />
			<ServerPortBadge port={1420} onclick={args.onclick} />
		</div>
	{/snippet}
</Story>
