<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import DependencyGraphView from './DependencyGraphView.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/DependencyGraph/DependencyGraphView',
		component: DependencyGraphView,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import { fn } from 'storybook/test';
	import type { Issue } from '$lib/modules/issues';
	import { MOCK_ISSUES, MOCK_ISSUE_DEPENDENCIES } from '$lib/tauri_mock_data.js';
	import DependencyGraphStoryWrapper from './DependencyGraphStoryWrapper.svelte';

	function parseMockIssue(raw: (typeof MOCK_ISSUES)[number]): Issue {
		return {
			...raw,
			labels: typeof raw.labels === 'string' ? JSON.parse(raw.labels) : (raw.labels ?? []),
		} as Issue;
	}

	const allIssues = MOCK_ISSUES.map(parseMockIssue);
	const singleIssue = allIssues.slice(0, 1);
	const onhitlquickstart = fn();
</script>

<Story name="With Dependencies">
	{#snippet template()}
		<DependencyGraphStoryWrapper>
			<div class="min-h-[400px] w-full">
				<DependencyGraphView
					issues={allIssues}
					dependencies={MOCK_ISSUE_DEPENDENCIES}
					{onhitlquickstart}
				/>
			</div>
		</DependencyGraphStoryWrapper>
	{/snippet}
</Story>

<Story name="Empty Graph">
	{#snippet template()}
		<DependencyGraphStoryWrapper>
			<div class="min-h-[400px] w-full">
				<DependencyGraphView issues={[]} dependencies={[]} {onhitlquickstart} />
			</div>
		</DependencyGraphStoryWrapper>
	{/snippet}
</Story>

<Story name="Single Isolated Node">
	{#snippet template()}
		<DependencyGraphStoryWrapper>
			<div class="min-h-[400px] w-full">
				<DependencyGraphView issues={singleIssue} dependencies={[]} {onhitlquickstart} />
			</div>
		</DependencyGraphStoryWrapper>
	{/snippet}
</Story>

<Story name="Many Dependencies">
	{#snippet template()}
		<DependencyGraphStoryWrapper>
			<div class="min-h-[400px] w-full">
				<DependencyGraphView
					issues={allIssues}
					dependencies={[
						...MOCK_ISSUE_DEPENDENCIES,
						...MOCK_ISSUE_DEPENDENCIES.map((dep, index) => ({
							...dep,
							id: `extra-dep-${index}`,
							blocker_issue_id: dep.blocked_issue_id,
							blocked_issue_id: dep.blocker_issue_id,
						})),
					]}
					{onhitlquickstart}
				/>
			</div>
		</DependencyGraphStoryWrapper>
	{/snippet}
</Story>
