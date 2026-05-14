<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setNotificationsContext } from '$lib/modules/notifications/notifications.context.svelte.js';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
	setNotificationsContext();
</script>

{@render children?.()}
