<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import { PriorityBadge, PRIORITY_POSITION_OPTIONS } from './index.js';
	import { BADGE_STYLES } from '$lib/components/shadcn/badge/index.js';

	const { Story } = defineMeta({
		title: 'Derived/PriorityBadge',
		component: PriorityBadge,
		tags: ['autodocs'],
		args: {
			onclick: fn(),
		},
		argTypes: {
			priority: {
				control: 'select',
				options: ['top', 'high', 'low', 'lowest'],
			},
			badgeStyle: {
				control: 'select',
				options: [...BADGE_STYLES],
			},
			position: {
				control: 'select',
				options: [...PRIORITY_POSITION_OPTIONS],
			},
		},
	});
</script>

<script lang="ts">
	import type { DisplayPriority, PriorityBadgeProps } from './priority_badge_types.js';
	import { PRIORITY_LABELS } from './priority_badge_types.js';

	const ALL_PRIORITIES = Object.keys(PRIORITY_LABELS) as DisplayPriority[];
</script>

<Story name="All Variants">
	{#snippet template(args: PriorityBadgeProps)}
		<div
			class="grid gap-x-3 gap-y-2"
			style="grid-template-columns: auto repeat({BADGE_STYLES.length}, auto);"
		>
			<!-- header row -->
			<div></div>
			{#each BADGE_STYLES as badgeStyle (badgeStyle)}
				<span class="text-xs text-foreground-muted">{badgeStyle}</span>
			{/each}
			<!-- data rows -->
			{#each ALL_PRIORITIES as priority (priority)}
				<span class="text-xs text-foreground-muted self-center">{priority}</span>
				{#each BADGE_STYLES as badgeStyle (badgeStyle)}
					<PriorityBadge {priority} {badgeStyle} onclick={args.onclick} />
				{/each}
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="All Priorities">
	{#snippet template(args: PriorityBadgeProps)}
		<div class="flex flex-wrap gap-2">
			{#each ALL_PRIORITIES as priority (priority)}
				<PriorityBadge {priority} onclick={args.onclick} />
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Badge Styles Comparison">
	{#snippet template(args: PriorityBadgeProps)}
		<div class="flex flex-col gap-4">
			{#each BADGE_STYLES as style (style)}
				<div class="flex flex-col gap-2">
					<p class="text-xs font-medium text-foreground-muted">{style}</p>
					<div class="flex flex-wrap gap-2">
						{#each ALL_PRIORITIES as priority (priority)}
							<PriorityBadge {priority} badgeStyle={style} onclick={args.onclick} />
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Positions" args={{ priority: 'high' }}>
	{#snippet template(args: PriorityBadgeProps)}
		<div class="flex flex-col gap-2">
			{#each PRIORITY_POSITION_OPTIONS as position (position)}
				<div class="flex items-center gap-3">
					<span class="w-40 text-xs text-foreground-muted">{position}</span>
					<PriorityBadge priority={args.priority} {position} onclick={args.onclick} />
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Non-Interactive" args={{ priority: 'high' }}>
	{#snippet template()}
		<PriorityBadge priority="high" />
	{/snippet}
</Story>
