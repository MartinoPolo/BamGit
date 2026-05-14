<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import DiscoveredSessionCard from './DiscoveredSessionCard.svelte';
	import type { DiscoveredSession } from '$lib/types/generated';
	import type { DiscoveredSessionStatus } from '$lib/types/generated';

	const { Story } = defineMeta({
		title: 'Blocks/Workspace/DiscoveredSessionCard',
		component: DiscoveredSessionCard,
		tags: ['autodocs'],
	});

	function makeMockDiscoveredSession(
		overrides: Partial<DiscoveredSession> = {},
	): DiscoveredSession {
		return {
			id: 'my-project/abc-123-def',
			pid: 12345,
			working_directory: '/home/user/projects/my-project',
			project_directory_name: 'my-project',
			session_id: 'abc-123-def',
			project_name: 'my-project',
			status: 'working',
			first_prompt: 'Fix the authentication token refresh logic',
			git_branch: 'feat/auth-refresh',
			message_count: 14,
			cost_usd: 0,
			token_count: 0,
			latest_message: null,
			modified_at: null,
			...overrides,
		};
	}

	const onAdopt = fn();
</script>

<Story name="Default" args={{ session: makeMockDiscoveredSession(), onAdopt }}>
	{#snippet template(args: {
		session: DiscoveredSession;
		onAdopt: (s: DiscoveredSession) => void;
	})}
		<div class="max-w-lg p-8">
			<DiscoveredSessionCard session={args.session} onAdopt={args.onAdopt} />
		</div>
	{/snippet}
</Story>

<Story
	name="With Cost Info"
	args={{
		session: makeMockDiscoveredSession({
			cost_usd: 2.847,
			token_count: 48200,
			message_count: 32,
			first_prompt: 'Refactor the database layer to use connection pooling',
			git_branch: 'refactor/db-pooling',
		}),
		onAdopt,
	}}
>
	{#snippet template(args: {
		session: DiscoveredSession;
		onAdopt: (s: DiscoveredSession) => void;
	})}
		<div class="max-w-lg p-8">
			<DiscoveredSessionCard session={args.session} onAdopt={args.onAdopt} />
		</div>
	{/snippet}
</Story>

<Story
	name="With Process ID"
	args={{
		session: makeMockDiscoveredSession({
			pid: 98712,
			status: 'idle',
			first_prompt: null,
			git_branch: null,
			message_count: 0,
			project_name: 'backend-api',
			project_directory_name: 'backend-api',
		}),
		onAdopt,
	}}
>
	{#snippet template(args: {
		session: DiscoveredSession;
		onAdopt: (s: DiscoveredSession) => void;
	})}
		<div class="max-w-lg p-8">
			<DiscoveredSessionCard session={args.session} onAdopt={args.onAdopt} />
		</div>
	{/snippet}
</Story>

<Story name="All Statuses">
	{#snippet template()}
		<div class="flex max-w-lg flex-col gap-4 p-8">
			{#each ['working', 'needs_attention', 'idle', 'finished', 'unknown'] as status (status)}
				<DiscoveredSessionCard
					session={makeMockDiscoveredSession({
						status: status as DiscoveredSessionStatus,
						first_prompt: `Session in "${status}" state`,
						message_count: 8,
						cost_usd: 0.45,
						token_count: 12000,
					})}
					onAdopt={fn()}
				/>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Long Content (Truncation)">
	{#snippet template()}
		<div class="max-w-lg p-8">
			<DiscoveredSessionCard
				session={makeMockDiscoveredSession({
					project_name:
						'super-long-project-name-that-should-truncate-gracefully-in-the-card',
					first_prompt:
						'Implement a comprehensive end-to-end testing suite covering all authentication flows including OAuth, SAML, and passwordless login with proper mocking of external identity providers',
					git_branch: 'feat/very-long-branch-name-for-testing-truncation',
					cost_usd: 15.234,
					token_count: 285000,
					message_count: 142,
				})}
				onAdopt={fn()}
			/>
		</div>
	{/snippet}
</Story>
