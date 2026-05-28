<script lang="ts">
	import type { Snippet } from 'svelte';
	import WorkspaceSelectorStoryWrapper from '$lib/components/blocks/workspace/WorkspaceSelectorStoryWrapper.svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<WorkspaceSelectorStoryWrapper defaultToFirstWorkspace>
	{@render children?.()}
</WorkspaceSelectorStoryWrapper>
