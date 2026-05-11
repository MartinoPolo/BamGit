<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SidebarNavItem from './SidebarNavItem.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Derived/SidebarNavItem',
		component: SidebarNavItem,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
		argTypes: {
			active: { control: 'boolean' },
			disabled: { control: 'boolean' },
			collapsed: { control: 'boolean' },
			nested: { control: 'boolean' },
			badge: { control: 'number' },
		},
	});
</script>

<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import HomeIcon from '@lucide/svelte/icons/home';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import TreesIcon from '@lucide/svelte/icons/trees';
	import GitBranchIcon from '@lucide/svelte/icons/git-branch';
	import UsersIcon from '@lucide/svelte/icons/users';

	type NavItemProps = ComponentProps<typeof SidebarNavItem>;
</script>

<Story name="Default" args={{ icon: HomeIcon, label: 'Dashboard', href: '#' }}>
	{#snippet template(args: NavItemProps)}
		<div class="w-56 rounded-lg bg-sidebar p-2">
			<SidebarNavItem {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Active" args={{ icon: HomeIcon, label: 'Dashboard', href: '#', active: true }}>
	{#snippet template(args: NavItemProps)}
		<div class="w-56 rounded-lg bg-sidebar p-2">
			<SidebarNavItem {...args} />
		</div>
	{/snippet}
</Story>

<Story name="With Badge" args={{ icon: InboxIcon, label: 'Inbox', href: '#', badge: 12 }}>
	{#snippet template(args: NavItemProps)}
		<div class="w-56 rounded-lg bg-sidebar p-2">
			<SidebarNavItem {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Nested" args={{ icon: GitBranchIcon, label: 'Branches', href: '#', nested: true }}>
	{#snippet template(args: NavItemProps)}
		<div class="w-56 rounded-lg bg-sidebar p-2">
			<SidebarNavItem {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Disabled" args={{ icon: SettingsIcon, label: 'Settings', href: '#', disabled: true }}>
	{#snippet template(args: NavItemProps)}
		<div class="w-56 rounded-lg bg-sidebar p-2">
			<SidebarNavItem {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Collapsed" args={{ icon: HomeIcon, label: 'Dashboard', href: '#', collapsed: true }}>
	{#snippet template(args: NavItemProps)}
		<div class="flex w-14 flex-col items-center rounded-lg bg-sidebar px-2">
			<SidebarNavItem {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Collapsed Active"
	args={{ icon: HomeIcon, label: 'Dashboard', href: '#', collapsed: true, active: true }}
>
	{#snippet template(args: NavItemProps)}
		<div class="flex w-14 flex-col items-center rounded-lg bg-sidebar px-2">
			<SidebarNavItem {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Collapsed With Badge"
	args={{ icon: InboxIcon, label: 'Inbox', href: '#', collapsed: true, badge: 5 }}
>
	{#snippet template(args: NavItemProps)}
		<div class="flex w-14 flex-col items-center rounded-lg bg-sidebar px-2">
			<SidebarNavItem {...args} />
		</div>
	{/snippet}
</Story>

<Story name="All States">
	<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -- Storybook requires template arg -->
	{#snippet template(_args: NavItemProps)}
		<div class="flex gap-8">
			<div class="w-56 rounded-lg bg-sidebar p-2">
				<p class="mb-2 px-2 text-xs font-medium text-muted-foreground">Expanded</p>
				<nav class="flex flex-col gap-0.5">
					<SidebarNavItem icon={HomeIcon} label="Dashboard" href="#" active />
					<SidebarNavItem icon={InboxIcon} label="Inbox" href="#" badge={3} />
					<SidebarNavItem icon={TreesIcon} label="Forest" href="#" />
					<SidebarNavItem icon={UsersIcon} label="Team" href="#" />
					<SidebarNavItem icon={GitBranchIcon} label="Branches" href="#" nested />
					<SidebarNavItem icon={SettingsIcon} label="Settings" href="#" disabled />
				</nav>
			</div>
			<div class="rounded-lg bg-sidebar p-2">
				<p class="mb-2 px-2 text-xs font-medium text-muted-foreground">Collapsed</p>
				<nav class="flex flex-col items-center gap-0.5">
					<SidebarNavItem icon={HomeIcon} label="Dashboard" href="#" collapsed active />
					<SidebarNavItem icon={InboxIcon} label="Inbox" href="#" collapsed badge={3} />
					<SidebarNavItem icon={TreesIcon} label="Forest" href="#" collapsed />
					<SidebarNavItem icon={UsersIcon} label="Team" href="#" collapsed />
					<SidebarNavItem
						icon={SettingsIcon}
						label="Settings"
						href="#"
						collapsed
						disabled
					/>
				</nav>
			</div>
		</div>
	{/snippet}
</Story>
