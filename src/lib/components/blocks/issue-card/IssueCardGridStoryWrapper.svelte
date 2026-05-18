<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { setSelectionContext } from '$lib/modules/board/selection.context.svelte.js';
	import { setIssuesContext } from '$lib/modules/issues/index.js';
	import { setIssueCardSettingsContext } from './index.js';
	import { MOCK_DASHBOARDS } from '$lib/tauri_mock_data.js';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	setSelectionContext();
	const issuesCtx = setIssuesContext();
	setIssueCardSettingsContext();
	onMount(() => issuesCtx.loadIssues(MOCK_DASHBOARDS[0].id));
</script>

{@render children?.()}
