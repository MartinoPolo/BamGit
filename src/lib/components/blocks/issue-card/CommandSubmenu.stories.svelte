<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CommandSubmenu from './CommandSubmenu.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/IssueCard/CommandSubmenu',
		component: CommandSubmenu,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import * as ContextMenu from '$lib/components/shadcn/context-menu/index.js';
	import { setProcessesContext } from '$lib/modules/processes/index.js';
	import { onMount } from 'svelte';
	import { MOCK_DASHBOARDS } from '$lib/tauri_mock_data.js';

	const processesCtx = setProcessesContext();
	onMount(() => {
		void processesCtx.loadProcesses();
	});

	const dashboardId = MOCK_DASHBOARDS[0].id;
</script>

<Story name="Commands Submenu (right-click)">
	{#snippet template()}
		<div class="flex items-center justify-center p-12">
			<ContextMenu.Root>
				<ContextMenu.Trigger>
					<div
						class="flex w-80 cursor-default items-center justify-center rounded-lg border border-dashed border-border bg-surface p-8 text-sm text-muted-foreground"
					>
						Right-click to open menu
					</div>
				</ContextMenu.Trigger>
				<ContextMenu.Content>
					<CommandSubmenu {dashboardId} issueId="mock-issue-auth" />
				</ContextMenu.Content>
			</ContextMenu.Root>
		</div>
	{/snippet}
</Story>

<Story name="No Commands (empty workspace)">
	{#snippet template()}
		<div class="flex items-center justify-center p-12">
			<ContextMenu.Root>
				<ContextMenu.Trigger>
					<div
						class="flex w-80 cursor-default items-center justify-center rounded-lg border border-dashed border-border bg-surface p-8 text-sm text-muted-foreground"
					>
						Right-click — no Commands submenu should appear
					</div>
				</ContextMenu.Trigger>
				<ContextMenu.Content>
					<CommandSubmenu dashboardId="non-existent-dashboard" issueId="no-issue" />
					<ContextMenu.Item disabled>No items</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		</div>
	{/snippet}
</Story>
