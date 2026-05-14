<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setSessionsContext } from '$lib/modules/sessions/sessions.context.svelte.js';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	const noopNotifications = { addPending: () => {}, clearPending: () => {} };
	setSessionsContext(noopNotifications);
</script>

{@render children?.()}
