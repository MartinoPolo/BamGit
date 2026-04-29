<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Tabs } from './index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'UI/Tabs',
		component: Tabs,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import { Tab } from './index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Settings as SettingsIcon, User as UserIcon, Bell as BellIcon } from 'lucide-svelte';
</script>

<Story name="Default">
	{#snippet template()}
		<Tabs>
			<Tab active>Overview</Tab>
			<Tab>Activity</Tab>
			<Tab>Settings</Tab>
		</Tabs>
	{/snippet}
</Story>

<Story name="With Icons">
	{#snippet template()}
		<Tabs>
			<Tab active><UserIcon class="size-3.5" /> Profile</Tab>
			<Tab><BellIcon class="size-3.5" /> Notifications</Tab>
			<Tab><SettingsIcon class="size-3.5" /> Settings</Tab>
		</Tabs>
	{/snippet}
</Story>

<Story name="With Disabled Tab">
	{#snippet template()}
		<Tabs>
			<Tab active>Active</Tab>
			<Tab>Normal</Tab>
			<Tab disabled>Disabled</Tab>
		</Tabs>
	{/snippet}
</Story>

<Story name="With Badge">
	{#snippet template()}
		<Tabs>
			<Tab active>Inbox <Badge variant="moss" class="ml-1.5">3</Badge></Tab>
			<Tab>Drafts</Tab>
			<Tab>Archive</Tab>
		</Tabs>
	{/snippet}
</Story>

<Story name="Many Tabs">
	{#snippet template()}
		<Tabs>
			<Tab active>Day</Tab>
			<Tab>Week</Tab>
			<Tab>Month</Tab>
			<Tab>Quarter</Tab>
			<Tab>Year</Tab>
		</Tabs>
	{/snippet}
</Story>
