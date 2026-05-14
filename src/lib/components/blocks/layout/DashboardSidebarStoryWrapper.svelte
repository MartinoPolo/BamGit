<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setKeyboardShortcutsContext } from '$lib/modules/keyboard-shortcuts/keyboard_shortcuts.context.svelte.js';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
	setKeyboardShortcutsContext();
</script>

{@render children?.()}
