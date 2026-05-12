<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import GitHubBadge from './GitHubBadge.svelte';
	import type { PullRequestState } from '$lib/types/generated';

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
			<GitHubBadge type="issue" state="open" number={10} url={null} />
			<GitHubBadge type="issue" state="closed" number={11} url={null} />
		</div>
	{/snippet}
</Story>

<Story name="All PR States">
	{#snippet template()}
		<div class="flex flex-wrap items-center gap-3">
			<GitHubBadge type="pr" state="open" number={20} url={null} />
			<GitHubBadge type="pr" state="draft" number={21} url={null} />
			<GitHubBadge type="pr" state="review-requested" number={22} url={null} />
			<GitHubBadge type="pr" state="changes-requested" number={23} url={null} />
			<GitHubBadge type="pr" state="approved" number={24} url={null} />
			<GitHubBadge type="pr" state="ready-to-merge" number={25} url={null} />
			<GitHubBadge type="pr" state="merged" number={26} url={null} />
			<GitHubBadge type="pr" state="closed" number={27} url={null} />
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

<Story name="All Variants (Issue + PR)">
	{#snippet template()}
		<div class="flex flex-col gap-4">
			<div>
				<p class="mb-2 text-sm font-medium text-muted-foreground">Issue States</p>
				<div class="flex flex-wrap items-center gap-3">
					<GitHubBadge type="issue" state="open" number={10} url={null} />
					<GitHubBadge type="issue" state="closed" number={11} url={null} />
				</div>
			</div>
			<div>
				<p class="mb-2 text-sm font-medium text-muted-foreground">PR States</p>
				<div class="flex flex-wrap items-center gap-3">
					<GitHubBadge type="pr" state="open" number={20} url={null} />
					<GitHubBadge type="pr" state="draft" number={21} url={null} />
					<GitHubBadge type="pr" state="review-requested" number={22} url={null} />
					<GitHubBadge type="pr" state="changes-requested" number={23} url={null} />
					<GitHubBadge type="pr" state="approved" number={24} url={null} />
					<GitHubBadge type="pr" state="ready-to-merge" number={25} url={null} />
					<GitHubBadge type="pr" state="merged" number={26} url={null} />
					<GitHubBadge type="pr" state="closed" number={27} url={null} />
				</div>
			</div>
		</div>
	{/snippet}
</Story>
