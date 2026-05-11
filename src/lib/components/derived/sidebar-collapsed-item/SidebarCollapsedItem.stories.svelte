<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SidebarCollapsedItem from './SidebarCollapsedItem.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Derived/SidebarCollapsedItem',
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
	});
</script>

<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import * as Tooltip from '$lib/components/shadcn/tooltip/index.js';
	import HomeIcon from '@lucide/svelte/icons/home';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import FolderIcon from '@lucide/svelte/icons/folder';

	type CollapsedItemProps = ComponentProps<typeof SidebarCollapsedItem>;
</script>

<Story name="Default" args={{ icon: HomeIcon, label: 'Dashboard' }}>
	{#snippet template(args: CollapsedItemProps)}
		<Tooltip.Provider>
			<div class="flex w-14 justify-center rounded-lg bg-sidebar px-2">
				<SidebarCollapsedItem {...args} />
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="Active" args={{ icon: HomeIcon, label: 'Dashboard', active: true }}>
	{#snippet template(args: CollapsedItemProps)}
		<Tooltip.Provider>
			<div class="flex w-14 justify-center rounded-lg bg-sidebar px-2">
				<SidebarCollapsedItem {...args} />
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="With Badge" args={{ icon: InboxIcon, label: 'Inbox', badge: 3 }}>
	{#snippet template(args: CollapsedItemProps)}
		<Tooltip.Provider>
			<div class="flex w-14 justify-center rounded-lg bg-sidebar px-2">
				<SidebarCollapsedItem {...args} />
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="Disabled" args={{ icon: SettingsIcon, label: 'Settings', disabled: true }}>
	{#snippet template(args: CollapsedItemProps)}
		<Tooltip.Provider>
			<div class="flex w-14 justify-center rounded-lg bg-sidebar px-2">
				<SidebarCollapsedItem {...args} />
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="All States">
	<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -- Storybook requires template arg -->
	{#snippet template(_args: CollapsedItemProps)}
		<Tooltip.Provider>
			<div class="flex gap-4 rounded-lg bg-sidebar p-4">
				<div class="flex flex-col items-center gap-2">
					<p class="text-xs text-muted-foreground">Default</p>
					<SidebarCollapsedItem icon={HomeIcon} label="Dashboard" />
				</div>
				<div class="flex flex-col items-center gap-2">
					<p class="text-xs text-muted-foreground">Active</p>
					<SidebarCollapsedItem icon={HomeIcon} label="Dashboard" active />
				</div>
				<div class="flex flex-col items-center gap-2">
					<p class="text-xs text-muted-foreground">Badge</p>
					<SidebarCollapsedItem icon={InboxIcon} label="Inbox" badge={5} />
				</div>
				<div class="flex flex-col items-center gap-2">
					<p class="text-xs text-muted-foreground">Disabled</p>
					<SidebarCollapsedItem icon={SettingsIcon} label="Settings" disabled />
				</div>
				<div class="flex flex-col items-center gap-2">
					<p class="text-xs text-muted-foreground">Icon Class</p>
					<SidebarCollapsedItem
						icon={FolderIcon}
						label="Workspace"
						iconClass="text-primary"
					/>
				</div>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>
