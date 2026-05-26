<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import DashboardSidebar from './DashboardSidebar.svelte';
	import DashboardSidebarStoryWrapper from './DashboardSidebarStoryWrapper.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Layout/DashboardSidebar',
		component: DashboardSidebar,
		tags: ['autodocs'],
		args: {
			username: 'Martin',
			userInitials: 'MP',
			activeSessionCount: 0,
			collapsed: false,
			onToggleSidebar: fn(),
			onEditWorkspace: fn(),
			onOpenSettings: fn(),
			onOpenWorkspaceSettings: fn(),
		},
	});
</script>

<Story name="Expanded">
	{#snippet template()}
		<DashboardSidebarStoryWrapper>
			<div class="flex h-150">
				<DashboardSidebar
					username="Martin"
					userInitials="MP"
					collapsed={false}
					onToggleSidebar={fn()}
					onEditWorkspace={fn()}
					onOpenSettings={fn()}
					onOpenWorkspaceSettings={fn()}
				/>
				<div class="flex-1 bg-background p-4">
					<span class="text-sm text-foreground-muted">Main content area</span>
				</div>
			</div>
		</DashboardSidebarStoryWrapper>
	{/snippet}
</Story>

<Story name="Collapsed">
	{#snippet template()}
		<DashboardSidebarStoryWrapper>
			<div class="flex h-150">
				<DashboardSidebar
					username="Martin"
					userInitials="MP"
					collapsed={true}
					onToggleSidebar={fn()}
					onEditWorkspace={fn()}
					onOpenSettings={fn()}
					onOpenWorkspaceSettings={fn()}
				/>
				<div class="flex-1 bg-background p-4">
					<span class="text-sm text-foreground-muted">Main content area</span>
				</div>
			</div>
		</DashboardSidebarStoryWrapper>
	{/snippet}
</Story>

<Story name="With Active Sessions">
	{#snippet template()}
		<DashboardSidebarStoryWrapper>
			<div class="flex h-150">
				<DashboardSidebar
					username="Martin"
					userInitials="MP"
					activeSessionCount={3}
					collapsed={false}
					onToggleSidebar={fn()}
					onEditWorkspace={fn()}
					onOpenSettings={fn()}
					onOpenWorkspaceSettings={fn()}
				/>
				<div class="flex-1 bg-background p-4">
					<span class="text-sm text-foreground-muted">Main content area</span>
				</div>
			</div>
		</DashboardSidebarStoryWrapper>
	{/snippet}
</Story>

<Story name="Long Workspace Name">
	{#snippet template()}
		<DashboardSidebarStoryWrapper>
			<div class="flex h-150">
				<DashboardSidebar
					username="Martin Pavelka"
					userInitials="MP"
					activeSessionCount={1}
					collapsed={false}
					onToggleSidebar={fn()}
					onEditWorkspace={fn()}
					onOpenSettings={fn()}
					onOpenWorkspaceSettings={fn()}
				/>
				<div class="flex-1 bg-background p-4">
					<span class="text-sm text-foreground-muted">Main content area</span>
				</div>
			</div>
		</DashboardSidebarStoryWrapper>
	{/snippet}
</Story>
