<script lang="ts">
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

	type CiStatus = 'passed' | 'failed' | 'running';

	interface Props {
		status: CiStatus;
	}

	let { status }: Props = $props();

	const tooltipText = $derived(
		status === 'passed' ? 'CI passed' : status === 'failed' ? 'CI failed' : 'CI running',
	);

	const colorClass = $derived(
		status === 'passed'
			? 'text-status-success'
			: status === 'failed'
				? 'text-status-danger'
				: 'text-status-info',
	);
</script>

<SimpleTooltip text={tooltipText}>
	{#snippet asChild(props)}
		<span
			{...props}
			class="inline-flex items-center gap-1 text-[10px] font-medium {colorClass}"
		>
			{#if status === 'passed'}
				<CircleCheckIcon size={12} />
			{:else if status === 'failed'}
				<CircleXIcon size={12} />
			{:else}
				<LoaderCircleIcon size={12} class="animate-spin" />
				<span class="whitespace-nowrap">running</span>
			{/if}
		</span>
	{/snippet}
</SimpleTooltip>
