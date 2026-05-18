<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { setSelectionContext } from '$lib/modules/board/selection.context.svelte.js';
	import { setIssuesContext } from '$lib/modules/issues/index.js';
	import { setIssueCardSettingsContext } from './index.js';
	import { MOCK_DASHBOARDS } from '$lib/tauri_mock_data.js';

	interface Props {
		children?: Snippet;
		activeIssueId?: string;
		hoveredIssueId?: string;
		selectedIssueIds?: string[];
		modifierHeld?: boolean;
	}

	let {
		children,
		activeIssueId,
		hoveredIssueId,
		selectedIssueIds,
		modifierHeld = false,
	}: Props = $props();

	const selectionCtx = setSelectionContext();
	const issuesCtx = setIssuesContext();
	const settingsCtx = setIssueCardSettingsContext();

	// fallow-ignore-next-line complexity
	onMount(() => {
		void issuesCtx.loadIssues(MOCK_DASHBOARDS[0].id);
		void settingsCtx.loadSettings();

		if (activeIssueId !== undefined && activeIssueId !== '') {
			selectionCtx.activateIssue(activeIssueId);
		}
		if (hoveredIssueId !== undefined && hoveredIssueId !== '') {
			selectionCtx.hoverIssue(hoveredIssueId);
		}
		if (selectedIssueIds) {
			for (const id of selectedIssueIds) {
				selectionCtx.toggleBatchSelect(id);
			}
		}
		if (modifierHeld) {
			selectionCtx.setModifierHeld(true);
		}
	});
</script>

{@render children?.()}
