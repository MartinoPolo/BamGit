<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setWindowContext } from '$lib/modules/window/index.js';
	import { setToastsContext } from '$lib/modules/toasts/index.js';
	import { setRawRequirementsContext } from '$lib/modules/raw-requirements/index.js';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	setWindowContext();
	setToastsContext();
	setRawRequirementsContext();
</script>

{@render children?.()}
