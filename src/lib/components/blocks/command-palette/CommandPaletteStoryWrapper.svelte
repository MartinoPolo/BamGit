<script lang="ts">
	import type { Dialog as DialogPrimitive } from 'bits-ui';
	import { setBoardContext } from '$lib/modules/board';
	import { setActionsContext } from '$lib/modules/actions';
	import { setIssuesContext } from '$lib/modules/issues';
	import { setKeyboardShortcutsContext } from '$lib/modules/keyboard-shortcuts';
	import { setCommandPaletteContext } from '$lib/modules/command-palette';
	import CommandPalette from './CommandPalette.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		portalProps?: Omit<DialogPrimitive.PortalProps, 'children'>;
	}

	let { children, portalProps }: Props = $props();

	setBoardContext();
	setActionsContext();
	setIssuesContext();
	setKeyboardShortcutsContext();
	const paletteCtx = setCommandPaletteContext();

	paletteCtx.open = true;
</script>

{@render children?.()}
<CommandPalette {portalProps} />
