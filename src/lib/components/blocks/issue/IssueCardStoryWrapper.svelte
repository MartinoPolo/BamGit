<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { setIssuesContext } from '$lib/modules/issues/index.js';
	import { MOCK_DASHBOARDS } from '$lib/tauri_mock_data.js';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	const issuesCtx = setIssuesContext();
	onMount(() => issuesCtx.loadIssues(MOCK_DASHBOARDS[0].id));
</script>

{@render children?.()}
