<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ForestView from './ForestView.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Forest/ForestView',
		component: ForestView,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import { fn } from 'storybook/test';
	import type { Issue } from '$lib/modules/issues';
	import { MOCK_ISSUES, MOCK_ISSUE_DEPENDENCIES } from '$lib/tauri_mock_data.js';
	import ForestViewStoryWrapper from './ForestViewStoryWrapper.svelte';

	function parseMockIssue(raw: (typeof MOCK_ISSUES)[number]): Issue {
		return {
			...raw,
			labels: typeof raw.labels === 'string' ? JSON.parse(raw.labels) : (raw.labels ?? []),
		} as Issue;
	}

	const allParsedIssues = MOCK_ISSUES.map(parseMockIssue);

	const callbacks = {
		onAddIssue: fn(),
		onArchiveIssue: fn(),
		onChangeIssueColor: fn(),
	};

	function stubGetGitStatus() {
		return undefined;
	}

	function stubGetSessionsForIssue() {
		return [] as const;
	}
</script>

<Story name="Full Forest">
	{#snippet template()}
		<ForestViewStoryWrapper>
			<div class="min-h-[500px] w-full">
				<ForestView
					issues={allParsedIssues}
					allIssues={allParsedIssues}
					dependencies={MOCK_ISSUE_DEPENDENCIES}
					getGitStatus={stubGetGitStatus}
					getSessionsForIssue={stubGetSessionsForIssue}
					{...callbacks}
				/>
			</div>
		</ForestViewStoryWrapper>
	{/snippet}
</Story>

<Story name="Empty Forest">
	{#snippet template()}
		<ForestViewStoryWrapper>
			<div class="min-h-[500px] w-full">
				<ForestView
					issues={[]}
					allIssues={[]}
					dependencies={[]}
					getGitStatus={stubGetGitStatus}
					getSessionsForIssue={stubGetSessionsForIssue}
					{...callbacks}
				/>
			</div>
		</ForestViewStoryWrapper>
	{/snippet}
</Story>

<Story name="Single Issue">
	{#snippet template()}
		<ForestViewStoryWrapper>
			<div class="min-h-[500px] w-full">
				<ForestView
					issues={[allParsedIssues[0]]}
					allIssues={[allParsedIssues[0]]}
					dependencies={[]}
					getGitStatus={stubGetGitStatus}
					getSessionsForIssue={stubGetSessionsForIssue}
					{...callbacks}
				/>
			</div>
		</ForestViewStoryWrapper>
	{/snippet}
</Story>

<Story name="Many Issues">
	{#snippet template()}
		{@const duplicated = [
			...allParsedIssues,
			...allParsedIssues.map((issue, index) => ({
				...issue,
				id: `dup-${index}-${issue.id}`,
				name: `${issue.name} (copy)`,
			})),
		]}
		<ForestViewStoryWrapper>
			<div class="min-h-[500px] w-full">
				<ForestView
					issues={duplicated}
					allIssues={duplicated}
					dependencies={MOCK_ISSUE_DEPENDENCIES}
					getGitStatus={stubGetGitStatus}
					getSessionsForIssue={stubGetSessionsForIssue}
					{...callbacks}
				/>
			</div>
		</ForestViewStoryWrapper>
	{/snippet}
</Story>
