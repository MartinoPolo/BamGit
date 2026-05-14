<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import GhSetupBanner from './GhSetupBanner.svelte';
	import type { GhAuthStatus } from '$lib/types/generated';

	const { Story } = defineMeta({
		title: 'Blocks/GitHub/GhSetupBanner',
		component: GhSetupBanner,
		tags: ['autodocs'],
	});

	const notConnected: GhAuthStatus = { status: 'not-connected' };
	const oauthConnected: GhAuthStatus = {
		status: 'oauth-connected',
		user: { login: 'octocat', avatar_url: 'https://avatars.githubusercontent.com/u/583231' },
	};
	const cliConnected: GhAuthStatus = { status: 'cli-connected' };
</script>

<Story name="Not Connected (with callback)" args={{ authStatus: notConnected, onconnect: fn() }}>
	{#snippet template(args)}
		<div class="max-w-xl p-4">
			<GhSetupBanner {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Not Connected (no callback)" args={{ authStatus: notConnected }}>
	{#snippet template(args)}
		<div class="max-w-xl p-4">
			<GhSetupBanner {...args} />
		</div>
	{/snippet}
</Story>

<Story name="OAuth Connected" args={{ authStatus: oauthConnected }}>
	{#snippet template(args)}
		<div class="max-w-xl p-4">
			<GhSetupBanner {...args} />
		</div>
	{/snippet}
</Story>

<Story name="CLI Connected" args={{ authStatus: cliConnected }}>
	{#snippet template(args)}
		<div class="max-w-xl p-4">
			<GhSetupBanner {...args} />
		</div>
	{/snippet}
</Story>
