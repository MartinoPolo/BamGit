<script lang="ts">
	import type { Snippet } from 'svelte';
	import { PaneGroup, Pane } from 'paneforge';
	import StyledPaneResizer from './StyledPaneResizer.svelte';
	import TreesIcon from '@lucide/svelte/icons/trees';
	import { Button } from '$lib/components/ui/button/index.js';

	interface Props {
		forestPanel: Snippet;
		bottomPanel: Snippet;
	}

	let { forestPanel, bottomPanel }: Props = $props();

	let topPane = $state<ReturnType<typeof Pane>>();
	let collapsed = $state(false);

	function handleCollapseToggle() {
		if (collapsed) {
			topPane?.expand();
		} else {
			topPane?.collapse();
		}
	}
</script>

<PaneGroup direction="vertical" class="h-full" autoSaveId="grovekeeper-forest-split">
	<Pane
		bind:this={topPane}
		defaultSize={65}
		collapsible={true}
		collapsedSize={0}
		onCollapse={() => (collapsed = true)}
		onExpand={() => (collapsed = false)}
	>
		<div class="flex h-full flex-col overflow-hidden">
			{@render forestPanel()}
		</div>
	</Pane>
	<Button
		variant="ghost"
		onclick={handleCollapseToggle}
		class="w-full shrink-0 rounded-none border-y border-border py-1 text-xs"
		aria-label={collapsed ? 'Expand forest panel' : 'Collapse forest panel'}
	>
		<TreesIcon class="size-3.5" />
	</Button>
	<StyledPaneResizer />
	<Pane minSize={20}>
		<div class="flex h-full flex-col overflow-hidden">
			{@render bottomPanel()}
		</div>
	</Pane>
</PaneGroup>
