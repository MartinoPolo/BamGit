<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Tabs } from './index.js';

	const { Story } = defineMeta({
		title: 'Base/Tabs',
		component: Tabs,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import { Tab } from './index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import UserIcon from '@lucide/svelte/icons/user';
	import BellIcon from '@lucide/svelte/icons/bell';

	let defaultActive = $state('Overview');
	let iconsActive = $state('Profile');
	let disabledActive = $state('Active');
	let badgeActive = $state('Inbox');
	let manyActive = $state('Day');
</script>

<Story name="Default">
	{#snippet template()}
		<Tabs>
			<Tab active={defaultActive === 'Overview'} onclick={() => (defaultActive = 'Overview')}
				>Overview</Tab
			>
			<Tab active={defaultActive === 'Activity'} onclick={() => (defaultActive = 'Activity')}
				>Activity</Tab
			>
			<Tab active={defaultActive === 'Settings'} onclick={() => (defaultActive = 'Settings')}
				>Settings</Tab
			>
		</Tabs>
	{/snippet}
</Story>

<Story name="With Icons">
	{#snippet template()}
		<Tabs>
			<Tab active={iconsActive === 'Profile'} onclick={() => (iconsActive = 'Profile')}
				><UserIcon class="size-3.5" /> Profile</Tab
			>
			<Tab
				active={iconsActive === 'Notifications'}
				onclick={() => (iconsActive = 'Notifications')}
				><BellIcon class="size-3.5" /> Notifications</Tab
			>
			<Tab active={iconsActive === 'Settings'} onclick={() => (iconsActive = 'Settings')}
				><SettingsIcon class="size-3.5" /> Settings</Tab
			>
		</Tabs>
	{/snippet}
</Story>

<Story name="With Disabled Tab">
	{#snippet template()}
		<Tabs>
			<Tab active={disabledActive === 'Active'} onclick={() => (disabledActive = 'Active')}
				>Active</Tab
			>
			<Tab active={disabledActive === 'Normal'} onclick={() => (disabledActive = 'Normal')}
				>Normal</Tab
			>
			<Tab disabled>Disabled</Tab>
		</Tabs>
	{/snippet}
</Story>

<Story name="With Badge">
	{#snippet template()}
		<Tabs>
			<Tab active={badgeActive === 'Inbox'} onclick={() => (badgeActive = 'Inbox')}
				>Inbox <Badge variant="moss" class="ml-1.5">3</Badge></Tab
			>
			<Tab active={badgeActive === 'Drafts'} onclick={() => (badgeActive = 'Drafts')}
				>Drafts</Tab
			>
			<Tab active={badgeActive === 'Archive'} onclick={() => (badgeActive = 'Archive')}
				>Archive</Tab
			>
		</Tabs>
	{/snippet}
</Story>

<Story name="Many Tabs">
	{#snippet template()}
		<Tabs>
			<Tab active={manyActive === 'Day'} onclick={() => (manyActive = 'Day')}>Day</Tab>
			<Tab active={manyActive === 'Week'} onclick={() => (manyActive = 'Week')}>Week</Tab>
			<Tab active={manyActive === 'Month'} onclick={() => (manyActive = 'Month')}>Month</Tab>
			<Tab active={manyActive === 'Quarter'} onclick={() => (manyActive = 'Quarter')}
				>Quarter</Tab
			>
			<Tab active={manyActive === 'Year'} onclick={() => (manyActive = 'Year')}>Year</Tab>
		</Tabs>
	{/snippet}
</Story>
