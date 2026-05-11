<script lang="ts">
	import { setBoardContext } from '$lib/modules/board';
	import { setActionsContext } from '$lib/modules/actions';
	import { setIssuesContext } from '$lib/modules/issues';
	import { setKeyboardShortcutsContext } from '$lib/modules/keyboard-shortcuts';
	import { setCommandPaletteContext } from '$lib/modules/command-palette';
	import CommandPalette from './CommandPalette.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	setBoardContext();
	setActionsContext();
	setIssuesContext();
	setKeyboardShortcutsContext();
	const paletteCtx = setCommandPaletteContext();

	paletteCtx.open = true;
</script>

{@render children?.()}
<CommandPalette />
