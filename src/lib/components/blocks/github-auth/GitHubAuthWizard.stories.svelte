<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import GitHubAuthWizard from './GitHubAuthWizard.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/GitHubAuth/GitHubAuthWizard',
		component: GitHubAuthWizard,
		tags: ['autodocs'],
	});

	const connectedHandler = fn();
</script>

<!-- Dialog open: shows initial loading state, then fires device flow (no-op in Storybook) -->
<Story name="Default">
	{#snippet template()}
		<GitHubAuthWizard open={true} onconnected={connectedHandler} />
	{/snippet}
</Story>

<!-- Dialog closed: should render nothing -->
<Story name="Closed">
	{#snippet template()}
		<GitHubAuthWizard open={false} onconnected={connectedHandler} />
	{/snippet}
</Story>
