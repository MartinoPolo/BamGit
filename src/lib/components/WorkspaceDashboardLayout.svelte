<script lang="ts">
	import type { Snippet } from 'svelte';
	import { PaneGroup, Pane, PaneResizer } from 'paneforge';
	import TreesIcon from '@lucide/svelte/icons/trees';

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
		<div class="h-full overflow-hidden">
			{@render forestPanel()}
		</div>
	</Pane>
	<button
		type="button"
		class="flex w-full shrink-0 items-center justify-center gap-1.5 border-y border-border bg-surface-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
		onclick={handleCollapseToggle}
		aria-label={collapsed ? 'Expand forest panel' : 'Collapse forest panel'}
	>
		<TreesIcon class="size-3.5" />
	</button>
	<PaneResizer
		class="relative flex h-1 cursor-row-resize items-center justify-center bg-transparent transition-colors hover:bg-border data-[active]:bg-border"
	>
		<div class="absolute h-[3px] w-8 rounded-full bg-border transition-colors"></div>
	</PaneResizer>
	<Pane minSize={20}>
		<div class="flex h-full flex-col overflow-hidden">
			{@render bottomPanel()}
		</div>
	</Pane>
</PaneGroup>
