<script lang="ts">
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';

	interface Props {
		overridden: boolean;
		onreset?: () => void;
	}

	let { overridden, onreset }: Props = $props();
</script>

{#if overridden}
	<div class="flex items-center gap-1">
		<span class="size-2 rounded-full bg-primary" title="Overridden for this workspace"></span>
		{#if onreset}
			<SimpleTooltip text="Reset to default">
				<Button intent="ghost" size="icon-sm" onclick={onreset} class="size-6">
					<RotateCcwIcon class="size-3" />
				</Button>
			</SimpleTooltip>
		{/if}
	</div>
{/if}
