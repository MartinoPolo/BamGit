<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import TopBar from './TopBar.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Layout/TopBar',
		component: TopBar,
		tags: ['autodocs'],
		args: {
			title: 'Dashboard',
			onSync: fn(),
			onQuickIdeas: fn(),
			onCreateIssue: fn(),
			onToggleForest: fn(),
		},
	});
</script>

<Story name="Default">
	{#snippet template()}
		<TopBar title="Dashboard" />
	{/snippet}
</Story>

<Story name="With Subtitle">
	{#snippet template()}
		<TopBar title="Dashboard" subtitle="workspace/grovekeeper" />
	{/snippet}
</Story>

<Story name="With Notifications Badge">
	{#snippet template()}
		<TopBar
			title="Dashboard"
			hasNotifications={true}
			onSync={fn()}
			onQuickIdeas={fn()}
			onCreateIssue={fn()}
			onToggleForest={fn()}
		/>
	{/snippet}
</Story>

<Story name="Syncing State">
	{#snippet template()}
		<TopBar
			title="Dashboard"
			syncing={true}
			onSync={fn()}
			onQuickIdeas={fn()}
			onCreateIssue={fn()}
			onToggleForest={fn()}
		/>
	{/snippet}
</Story>

<Story name="Forest Collapsed">
	{#snippet template()}
		<TopBar
			title="Dashboard"
			forestCollapsed={true}
			onSync={fn()}
			onQuickIdeas={fn()}
			onCreateIssue={fn()}
			onToggleForest={fn()}
		/>
	{/snippet}
</Story>

<Story name="With All Actions">
	{#snippet template()}
		<TopBar
			title="Dashboard"
			subtitle="workspace/grovekeeper"
			hasNotifications={true}
			syncing={false}
			forestCollapsed={false}
			onSync={fn()}
			onQuickIdeas={fn()}
			onCreateIssue={fn()}
			onToggleForest={fn()}
		/>
	{/snippet}
</Story>
