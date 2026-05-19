<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import GitHubBadge from './GitHubBadge.svelte';
	import { ISSUE_STATE_CONFIG, PR_STATE_CONFIG } from './github_badge_variants.js';
	import type { PullRequestState } from '$lib/types/generated';

	const issueStates = Object.keys(ISSUE_STATE_CONFIG) as Array<keyof typeof ISSUE_STATE_CONFIG>;
	const prStates = Object.keys(PR_STATE_CONFIG) as Array<keyof typeof PR_STATE_CONFIG>;

	interface StoryArgs {
		type: 'issue' | 'pr';
		state: string | PullRequestState | null;
		number: number | null;
		url: string | null;
		disabled?: boolean;
	}

	const { Story } = defineMeta({
		title: 'Derived/GitHubBadge',
		component: GitHubBadge,
		tags: ['autodocs'],
		argTypes: {
			type: { control: 'select', options: ['issue', 'pr'] },
			disabled: { control: 'boolean' },
		},
	});
</script>

<Story name="All Variants">
	{#snippet template()}
		<div class="flex flex-col gap-4">
			<div>
				<p class="mb-2 text-sm font-medium text-muted-foreground">Issue States</p>
				<div class="flex flex-wrap items-center gap-3">
					{#each issueStates as state, i (state)}
						<div class="flex flex-col items-center gap-1">
							<GitHubBadge type="issue" {state} number={10 + i} url={null} />
							<span class="text-xs text-foreground-muted">{state}</span>
						</div>
					{/each}
				</div>
			</div>
			<div>
				<p class="mb-2 text-sm font-medium text-muted-foreground">PR States</p>
				<div class="flex flex-wrap items-center gap-3">
					{#each prStates as state, i (state)}
						<div class="flex flex-col items-center gap-1">
							<GitHubBadge type="pr" {state} number={20 + i} url={null} />
							<span class="text-xs text-foreground-muted">{state}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Issue Open" args={{ type: 'issue', state: 'open', number: 42, url: null }}>
	{#snippet template(args: StoryArgs)}
		<GitHubBadge {...args} />
	{/snippet}
</Story>

<Story name="Issue Closed" args={{ type: 'issue', state: 'closed', number: 42, url: null }}>
	{#snippet template(args: StoryArgs)}
		<GitHubBadge {...args} />
	{/snippet}
</Story>

<Story name="All Issue States">
	{#snippet template()}
		<div class="flex flex-wrap items-center gap-3">
			{#each issueStates as state, i (state)}
				<div class="flex flex-col items-center gap-1">
					<GitHubBadge type="issue" {state} number={10 + i} url={null} />
					<span class="text-xs text-foreground-muted">{state}</span>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="All PR States">
	{#snippet template()}
		<div class="flex flex-wrap items-center gap-3">
			{#each prStates as state, i (state)}
				<div class="flex flex-col items-center gap-1">
					<GitHubBadge type="pr" {state} number={20 + i} url={null} />
					<span class="text-xs text-foreground-muted">{state}</span>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Disabled">
	{#snippet template()}
		<div class="flex flex-wrap items-center gap-3">
			<GitHubBadge type="issue" state="open" number={10} url={null} disabled />
			<GitHubBadge type="pr" state="open" number={20} url={null} disabled />
			<GitHubBadge type="pr" state="merged" number={26} url={null} disabled />
		</div>
	{/snippet}
</Story>
