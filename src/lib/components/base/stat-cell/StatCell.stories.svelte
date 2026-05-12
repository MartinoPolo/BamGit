<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { StatCell, STAT_CELL_TONE_OPTIONS } from './index.js';

	const { Story } = defineMeta({
		title: 'Base/StatCell',
		component: StatCell,
		tags: ['autodocs'],
		argTypes: {
			tone: {
				control: 'select',
				options: [...STAT_CELL_TONE_OPTIONS],
			},
			pulse: {
				control: 'boolean',
			},
			value: {
				control: 'text',
			},
		},
	});
</script>

<script lang="ts">
	import type { StatCellProps } from './stat-cell-variants.js';
	import ListChecksIcon from '@lucide/svelte/icons/list-checks';
	import GitPrIcon from '@lucide/svelte/icons/git-pull-request';
	import AlertIcon from '@lucide/svelte/icons/triangle-alert';
	import UserIcon from '@lucide/svelte/icons/user';
</script>

<Story name="Default" args={{ label: 'ISSUES', value: 12, tone: 'neutral' }}>
	{#snippet template(args: StatCellProps)}
		<div class="w-17.5">
			<StatCell {...args} />
		</div>
	{/snippet}
</Story>

<Story name="All Tones">
	{#snippet template(args: StatCellProps)}
		<div class="flex gap-2">
			<StatCell {...args} label="ISSUES" value={12} tone="neutral" icon={ListChecksIcon} />
			<StatCell label="ISSUES" value={0} tone="zero" icon={ListChecksIcon} />
			<StatCell label="HITL" value={3} tone="warning" icon={UserIcon} />
			<StatCell label="ATTN" value={2} tone="danger" icon={AlertIcon} />
		</div>
	{/snippet}
</Story>

<Story name="Zero Values">
	{#snippet template(args: StatCellProps)}
		<div class="flex gap-2">
			<StatCell {...args} label="ISSUES" value={0} icon={ListChecksIcon} />
			<StatCell label="PRs" value={0} icon={GitPrIcon} />
			<StatCell label="ATTN" value={0} icon={AlertIcon} />
			<StatCell label="HITL" value={0} icon={UserIcon} />
		</div>
	{/snippet}
</Story>

<Story name="With Pulse">
	{#snippet template(args: StatCellProps)}
		<div class="flex gap-2">
			<StatCell {...args} label="ATTN" value={2} tone="danger" pulse icon={AlertIcon} />
			<StatCell label="HITL" value={3} tone="warning" pulse icon={UserIcon} />
			<StatCell label="ATTN" value={0} tone="neutral" pulse icon={AlertIcon} />
		</div>
	{/snippet}
</Story>

<Story name="With Icons">
	{#snippet template(args: StatCellProps)}
		<div class="flex gap-2">
			<StatCell {...args} label="ISSUES" value={10} icon={ListChecksIcon} />
			<StatCell label="PRs" value={4} icon={GitPrIcon} />
			<StatCell label="ATTN" value={2} tone="danger" icon={AlertIcon} />
			<StatCell label="HITL" value={1} tone="warning" icon={UserIcon} />
		</div>
	{/snippet}
</Story>

<Story name="Dual Number Format">
	{#snippet template(args: StatCellProps)}
		<div class="flex gap-2">
			<StatCell {...args} label="ISSUES" value="3/10" icon={ListChecksIcon} />
			<StatCell label="ISSUES" value="0/5" icon={ListChecksIcon} />
		</div>
	{/snippet}
</Story>

<Story name="Clickable">
	{#snippet template(args: StatCellProps)}
		<div class="w-17.5">
			<StatCell
				{...args}
				label="ISSUES"
				value={12}
				icon={ListChecksIcon}
				onclick={() => alert('Clicked!')}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Health Grid">
	{#snippet template(args: StatCellProps)}
		<div class="grid w-73 grid-cols-4 gap-1.5">
			<StatCell {...args} label="ISSUES" value="3/10" icon={ListChecksIcon} />
			<StatCell label="PRs" value={4} icon={GitPrIcon} />
			<StatCell label="ATTN" value={2} tone="danger" pulse icon={AlertIcon} />
			<StatCell label="HITL" value={1} tone="warning" pulse icon={UserIcon} />
		</div>
	{/snippet}
</Story>
