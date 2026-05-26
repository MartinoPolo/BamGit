<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import WorkspaceSelector from './WorkspaceSelector.svelte';
	import WorkspaceSelectorStoryWrapper from './WorkspaceSelectorStoryWrapper.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Workspace/WorkspaceSelector',
		component: WorkspaceSelector,
		tags: ['autodocs'],
		args: {
			collapsed: false,
			onEdit: fn(),
			onOpenSettings: fn(),
			portalProps: { disabled: true },
		},
	});
</script>

<Story name="Expanded">
	{#snippet template()}
		<WorkspaceSelectorStoryWrapper initialDashboardId="mock-dash-grovekeeper">
			<div class="w-56 rounded-lg bg-sidebar p-2">
				<WorkspaceSelector
					onEdit={fn()}
					onOpenSettings={fn()}
					portalProps={{ disabled: true }}
				/>
			</div>
		</WorkspaceSelectorStoryWrapper>
	{/snippet}
</Story>

<Story name="Collapsed">
	{#snippet template()}
		<WorkspaceSelectorStoryWrapper initialDashboardId="mock-dash-grovekeeper">
			<div class="flex w-14 items-center justify-center rounded-lg bg-sidebar p-2">
				<WorkspaceSelector
					collapsed
					onEdit={fn()}
					onOpenSettings={fn()}
					portalProps={{ disabled: true }}
				/>
			</div>
		</WorkspaceSelectorStoryWrapper>
	{/snippet}
</Story>

<Story name="On Overview">
	{#snippet template()}
		<WorkspaceSelectorStoryWrapper>
			<div class="w-56 rounded-lg bg-sidebar p-2">
				<WorkspaceSelector
					onEdit={fn()}
					onOpenSettings={fn()}
					portalProps={{ disabled: true }}
				/>
			</div>
		</WorkspaceSelectorStoryWrapper>
	{/snippet}
</Story>
