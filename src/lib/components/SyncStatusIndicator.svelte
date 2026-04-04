<script lang="ts">
	import { format_relative_time } from '$lib/utils/time';

	let { fetched_at }: { fetched_at: string | null } = $props();

	let tick = $state(0);
	const display_text = $derived.by(() => {
		// Reference tick to re-derive on interval updates
		void tick;
		return format_relative_time(fetched_at);
	});

	// Re-tick every 30 seconds to update relative time
	$effect(() => {
		const interval = setInterval(() => {
			tick++;
		}, 30_000);
		return () => clearInterval(interval);
	});
</script>

<span class="text-[10px] text-muted-foreground" title="Last synced: {fetched_at ?? 'never'}">
	{display_text}
</span>
