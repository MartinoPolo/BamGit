<script lang="ts">
	interface Props {
		lines: readonly string[];
	}

	let { lines }: Props = $props();

	let scroll_container: HTMLDivElement | undefined = $state();

	// Auto-scroll to bottom when new lines arrive
	$effect(() => {
		if (lines.length > 0 && scroll_container) {
			scroll_container.scrollTop = scroll_container.scrollHeight;
		}
	});

	/** Strip ANSI escape codes for display */
	function strip_ansi(text: string): string {
		// oxlint-disable-next-line no-control-regex -- intentional: stripping ANSI escape sequences
		return text.replace(/\u001B\[[0-9;]*[a-zA-Z]/g, '');
	}
</script>

<div class="mt-2 border-t border-neutral-800 pt-2">
	<div class="mb-1 text-[10px] font-medium uppercase tracking-wider text-neutral-600">
		Progress
	</div>
	<div
		bind:this={scroll_container}
		class="max-h-32 overflow-y-auto rounded bg-neutral-950 p-2 font-mono text-[11px] leading-4 text-neutral-400"
	>
		{#each lines as line}
			<div class="whitespace-pre-wrap break-all">{strip_ansi(line)}</div>
		{/each}
	</div>
</div>
