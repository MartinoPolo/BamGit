<script lang="ts">
	import type { Snippet } from 'svelte';
	import { PaneGroup, Pane } from 'paneforge';
	import StyledPaneResizer from './StyledPaneResizer.svelte';

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
	<StyledPaneResizer />
	<Pane minSize={bottomMinSize}>
		{@render bottomPanel()}
	</Pane>
</PaneGroup>
