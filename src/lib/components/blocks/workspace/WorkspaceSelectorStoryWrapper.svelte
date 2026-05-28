<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { setWindowContext, useWindow } from '$lib/modules/window/index.js';
	import { useBoard } from '$lib/modules/board/board.context.svelte.js';
	import { setKeyboardShortcutsContext } from '$lib/modules/keyboard-shortcuts/keyboard_shortcuts.context.svelte.js';

	interface Props {
		initialDashboardId?: string | null;
		defaultToFirstWorkspace?: boolean;
		children?: Snippet;
	}

	let { initialDashboardId = null, defaultToFirstWorkspace = false, children }: Props = $props();

	setWindowContext();
	setKeyboardShortcutsContext();
	const boardCtx = useBoard();
	const windowCtx = useWindow();

	onMount(async () => {
		await boardCtx.loadDashboards();
		if (initialDashboardId !== null) {
			windowCtx.navigateToWorkspace(initialDashboardId);
		} else if (defaultToFirstWorkspace && boardCtx.dashboards.length > 0) {
			windowCtx.navigateToWorkspace(boardCtx.dashboards[0].id);
		} else {
			windowCtx.navigateToOverview();
		}
	});
</script>

{@render children?.()}
