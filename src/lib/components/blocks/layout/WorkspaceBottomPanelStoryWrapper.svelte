<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { setSelectionContext } from '$lib/modules/board/selection.context.svelte.js';
	import { setIssuesContext } from '$lib/modules/issues/index.js';
	import { setProcessesContext } from '$lib/modules/processes/index.js';
	import { setIssueCardSettingsContext } from '$lib/components/blocks/issue-card/index.js';
	import { MOCK_DASHBOARDS } from '$lib/tauri_mock_data.js';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	setSelectionContext();
	const issuesCtx = setIssuesContext();
	const processesCtx = setProcessesContext();
	setIssueCardSettingsContext();
	onMount(() => {
		void issuesCtx.loadIssues(MOCK_DASHBOARDS[0].id);
		void processesCtx.loadProcesses();
	});
</script>

{@render children?.()}
