<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { IssueStateChip } from './index.js';
	import { BADGE_STYLES } from '$lib/components/shadcn/badge/index.js';
	import { CHIP_COLORS } from '$lib/modules/issue-card/index.js';

	const { Story } = defineMeta({
		title: 'Derived/IssueStateChip',
		component: IssueStateChip,
		tags: ['autodocs'],
		argTypes: {
			badgeStyle: {
				control: 'select',
				options: [...BADGE_STYLES],
			},
		},
	});
</script>

<script lang="ts">
	import type { IssueStateChipProps } from './issue_state_chip_types.js';
	import type { BadgeStyle } from '$lib/components/shadcn/badge/index.js';

	const ALL_CHIP_STATES: IssueStateChipProps[] = [
		{ label: 'ERROR', colorVariable: CHIP_COLORS.error },
		{ label: 'NEEDS INPUT', colorVariable: CHIP_COLORS.warning },
		{ label: 'MERGE CONFLICT', colorVariable: CHIP_COLORS.error },
		{ label: 'SETUP FAILED', colorVariable: CHIP_COLORS.error },
		{ label: 'ANALYZING', colorVariable: CHIP_COLORS.success },
		{ label: 'BUILDING', colorVariable: CHIP_COLORS.success },
		{ label: 'REVIEWING', colorVariable: CHIP_COLORS.info },
		{ label: 'VERIFYING', colorVariable: CHIP_COLORS.success },
		{ label: 'SHIPPING', colorVariable: CHIP_COLORS.success },
		{ label: 'EXECUTING', colorVariable: CHIP_COLORS.success },
		{ label: 'REVIEW', colorVariable: CHIP_COLORS.info },
		{ label: 'PAUSED', colorVariable: CHIP_COLORS.muted },
		{ label: 'RUNNING CHECKS', colorVariable: CHIP_COLORS.info },
		{ label: 'RUNNING TESTS', colorVariable: CHIP_COLORS.info },
		{ label: 'BEHIND BASE', colorVariable: CHIP_COLORS.warning },
		{ label: 'CHANGES REQ', colorVariable: CHIP_COLORS.warning },
		{ label: 'CI RUNNING', colorVariable: CHIP_COLORS.info },
		{ label: 'APPROVED', colorVariable: CHIP_COLORS.success },
		{ label: 'READY TO MERGE', colorVariable: CHIP_COLORS.success },
		{ label: 'WORKTREE SETUP', colorVariable: CHIP_COLORS.warning },
		{ label: 'REMOVING WORKTREE', colorVariable: CHIP_COLORS.warning },
		{ label: 'DONE', colorVariable: CHIP_COLORS.muted },
	];
</script>

<Story name="All 22 States">
	{#snippet template(args: { badgeStyle?: BadgeStyle })}
		<div class="flex flex-wrap gap-2">
			{#each ALL_CHIP_STATES as chip (chip.label)}
				<IssueStateChip
					label={chip.label}
					colorVariable={chip.colorVariable}
					badgeStyle={args.badgeStyle}
				/>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Badge Styles Comparison">
	{#snippet template()}
		<div class="flex flex-col gap-4">
			{#each BADGE_STYLES as style (style)}
				<div class="flex flex-col gap-2">
					<p class="text-xs font-medium text-foreground-muted">{style}</p>
					<div class="flex flex-wrap gap-2">
						<IssueStateChip
							label="ERROR"
							colorVariable={CHIP_COLORS.error}
							badgeStyle={style}
						/>
						<IssueStateChip
							label="BUILDING"
							colorVariable={CHIP_COLORS.success}
							badgeStyle={style}
						/>
						<IssueStateChip
							label="REVIEWING"
							colorVariable={CHIP_COLORS.info}
							badgeStyle={style}
						/>
						<IssueStateChip
							label="NEEDS INPUT"
							colorVariable={CHIP_COLORS.warning}
							badgeStyle={style}
						/>
						<IssueStateChip
							label="PAUSED"
							colorVariable={CHIP_COLORS.muted}
							badgeStyle={style}
						/>
					</div>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story
	name="Single Chip"
	args={{ label: 'EXECUTING', colorVariable: CHIP_COLORS.success, badgeStyle: 'borderless-dark' }}
>
	{#snippet template(args: IssueStateChipProps)}
		<IssueStateChip {...args} />
	{/snippet}
</Story>
