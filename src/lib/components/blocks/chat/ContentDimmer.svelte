<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		dimmed: boolean;
		children: Snippet;
	}

	let { dimmed, children }: Props = $props();
</script>

<div
	class="flex flex-col gap-1.5 transition-opacity duration-3 ease-out {dimmed
		? 'opacity-40 hover:opacity-100'
		: ''}"
>
	{@render children()}
</div>
