<script lang="ts">
	import type { Snippet } from 'svelte';
	import { PaneGroup, Pane, PaneResizer } from 'paneforge';

	interface Props {
		topDefaultSize?: number;
		topMinSize?: number;
		bottomMinSize?: number;
		topPanel: Snippet;
		bottomPanel: Snippet;
	}

	let {
		topDefaultSize = 70,
		topMinSize = 20,
		bottomMinSize = 15,
		topPanel,
		bottomPanel,
	}: Props = $props();
</script>

<PaneGroup direction="vertical" class="h-full">
	<Pane defaultSize={topDefaultSize} minSize={topMinSize}>
		{@render topPanel()}
	</Pane>
	<PaneResizer
		class="relative flex h-1 cursor-row-resize items-center justify-center bg-transparent transition-colors hover:bg-border data-[active]:bg-border"
	>
		<div class="absolute h-[3px] w-8 rounded-full bg-border transition-colors"></div>
	</PaneResizer>
	<Pane minSize={bottomMinSize}>
		{@render bottomPanel()}
	</Pane>
</PaneGroup>
