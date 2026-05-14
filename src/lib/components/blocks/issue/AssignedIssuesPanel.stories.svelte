<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AssignedIssuesPanel from './AssignedIssuesPanel.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Issue/AssignedIssuesPanel',
		component: AssignedIssuesPanel,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import { fn } from 'storybook/test';
	import type { Issue } from '$lib/modules/issues';
	import { MOCK_ASSIGNED_ISSUES_RESULT, MOCK_ISSUES } from '$lib/tauri_mock_data.js';

	function parseMockIssue(raw: (typeof MOCK_ISSUES)[number]): Issue {
		return {
			...raw,
			labels: typeof raw.labels === 'string' ? JSON.parse(raw.labels) : (raw.labels ?? []),
		} as Issue;
	}

	const dashboardIssues = MOCK_ISSUES.map(parseMockIssue);
	const defaultArgs = {
		issues: MOCK_ASSIGNED_ISSUES_RESULT.issues,
		dashboardIssues,
		hasMore: false,
		loading: false,
		lastSynced: new Date(Date.now() - 30_000),
		disabled: false,
		onWizardOpen: fn(),
		onQuickAddWithWorktree: fn(),
		onLoadMore: fn(),
		onRefresh: fn(),
	};
</script>

<Story name="Default">
	{#snippet template()}
		<div class="h-[500px] w-[800px] border border-border">
			<AssignedIssuesPanel {...defaultArgs} />
		</div>
	{/snippet}
</Story>

<Story name="Empty">
	{#snippet template()}
		<div class="h-[500px] w-[800px] border border-border">
			<AssignedIssuesPanel {...defaultArgs} issues={[]} hasMore={false} />
		</div>
	{/snippet}
</Story>

<Story name="Loading">
	{#snippet template()}
		<div class="h-[500px] w-[800px] border border-border">
			<AssignedIssuesPanel {...defaultArgs} loading={true} />
		</div>
	{/snippet}
</Story>

<Story name="Has More">
	{#snippet template()}
		<div class="h-[500px] w-[800px] border border-border">
			<AssignedIssuesPanel {...defaultArgs} hasMore={true} />
		</div>
	{/snippet}
</Story>

<Story name="Disabled">
	{#snippet template()}
		<div class="h-[500px] w-[800px] border border-border">
			<AssignedIssuesPanel {...defaultArgs} disabled={true} />
		</div>
	{/snippet}
</Story>

<Story name="Recently Synced">
	{#snippet template()}
		<div class="h-[500px] w-[800px] border border-border">
			<AssignedIssuesPanel {...defaultArgs} lastSynced={new Date()} />
		</div>
	{/snippet}
</Story>

<Story name="Stale Sync">
	{#snippet template()}
		<div class="h-[500px] w-[800px] border border-border">
			<AssignedIssuesPanel {...defaultArgs} lastSynced={new Date(Date.now() - 10 * 60_000)} />
		</div>
	{/snippet}
</Story>

<Story name="Never Synced">
	{#snippet template()}
		<div class="h-[500px] w-[800px] border border-border">
			<AssignedIssuesPanel {...defaultArgs} lastSynced={null} />
		</div>
	{/snippet}
</Story>
