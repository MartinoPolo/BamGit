<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setSelectionContext } from '$lib/modules/board/selection.context.svelte.js';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
	setSelectionContext();
</script>

{@render children?.()}
