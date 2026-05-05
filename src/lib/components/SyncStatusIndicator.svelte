<script lang="ts">
	import { formatRelativeTime } from '$lib/utils/time';
	import { SimpleTooltip } from '$lib/components/ui/tooltip/index.js';

	let { fetchedAt }: { fetchedAt: string | null } = $props();

	let tick = $state(0);
	const displayText = $derived.by(() => {
		// Reference tick to re-derive on interval updates
		void tick;
		return formatRelativeTime(fetchedAt);
	});

	// Re-tick every 30 seconds to update relative time
	$effect(() => {
		const interval = setInterval(() => {
			tick++;
		}, 30_000);
		return () => clearInterval(interval);
	});
</script>

<SimpleTooltip text="Last synced: {fetchedAt ?? 'never'}">
	<span class="text-[10px] text-muted-foreground">
		{displayText}
	</span>
</SimpleTooltip>
