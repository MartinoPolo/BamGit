<script lang="ts">
	import type { Snippet } from 'svelte';
	import { PaneGroup, Pane } from 'paneforge';
	import StyledPaneResizer from './StyledPaneResizer.svelte';

	interface Props {
		collapsed?: boolean;
		onToggle?: (collapsed: boolean) => void;
		forestPanel: Snippet;
		bottomPanel: Snippet;
	}

	let { collapsed = false, onToggle, forestPanel, bottomPanel }: Props = $props();

	let topPane = $state<ReturnType<typeof Pane>>();
	let internalCollapsed = $state(false);

	$effect(() => {
		if (collapsed && !internalCollapsed) {
			topPane?.collapse();
		} else if (!collapsed && internalCollapsed) {
			topPane?.expand();
		}
	});
</script>

<PaneGroup direction="vertical" class="h-full" autoSaveId="grovekeeper-forest-split">
	<Pane
		bind:this={topPane}
		defaultSize={65}
		collapsible={true}
		collapsedSize={0}
		onCollapse={() => {
			internalCollapsed = true;
			onToggle?.(true);
		}}
		onExpand={() => {
			internalCollapsed = false;
			onToggle?.(false);
		}}
	>
		<div class="flex h-full flex-col overflow-hidden">
			{@render forestPanel()}
		</div>
	</Pane>
	<StyledPaneResizer />
	<Pane minSize={20}>
		<div class="flex h-full flex-col overflow-hidden">
			{@render bottomPanel()}
		</div>
	</Pane>
</PaneGroup>
