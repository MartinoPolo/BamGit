<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { CommandResultBadge, COMMAND_RESULT_STATES } from './index.js';
	import { BADGE_STYLES } from '$lib/components/shadcn/badge/index.js';

	const { Story } = defineMeta({
		title: 'Derived/CommandResultBadge',
		component: CommandResultBadge,
		tags: ['autodocs'],
		argTypes: {
			state: {
				control: 'select',
				options: [...COMMAND_RESULT_STATES],
			},
			badgeStyle: {
				control: 'select',
				options: [...BADGE_STYLES],
			},
		},
	});
</script>

<script lang="ts">
	import type { CommandResultBadgeProps } from './command_result_badge_types.js';
</script>

<Story name="All Variants">
	{#snippet template()}
		<div class="flex flex-col gap-6">
			{#each BADGE_STYLES as badgeStyle (badgeStyle)}
				<div class="flex flex-col gap-2">
					<p class="text-xs text-foreground-muted">{badgeStyle}</p>
					<div class="flex flex-wrap items-center gap-3">
						{#each COMMAND_RESULT_STATES as state (state)}
							<CommandResultBadge {state} commandName="check:all" {badgeStyle} />
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="All States">
	{#snippet template()}
		<div class="flex flex-wrap items-center gap-3">
			{#each COMMAND_RESULT_STATES as state (state)}
				<CommandResultBadge {state} commandName="check:all" />
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Stale Results">
	{#snippet template()}
		<div class="flex flex-wrap items-center gap-3">
			<CommandResultBadge state="passed" commandName="test" isStale />
			<CommandResultBadge state="failed" commandName="lint" isStale />
			<CommandResultBadge state="passed" commandName="test" isStale={false} />
		</div>
	{/snippet}
</Story>

<Story name="Badge Styles">
	{#snippet template()}
		<div class="flex flex-col gap-4">
			{#each BADGE_STYLES as style (style)}
				<div class="flex flex-col gap-2">
					<p class="text-xs font-medium text-foreground-muted">{style}</p>
					<div class="flex flex-wrap items-center gap-3">
						<CommandResultBadge
							state="running"
							commandName="check"
							badgeStyle={style}
						/>
						<CommandResultBadge state="passed" commandName="check" badgeStyle={style} />
						<CommandResultBadge state="failed" commandName="check" badgeStyle={style} />
					</div>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Interactive" args={{ state: 'running', commandName: 'pnpm test' }}>
	{#snippet template(args: CommandResultBadgeProps)}
		<CommandResultBadge {...args} />
	{/snippet}
</Story>
