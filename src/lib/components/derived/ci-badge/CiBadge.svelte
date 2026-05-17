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

	const CONFIG: Record<CiStatus, { label: string; colorClass: string }> = {
		passed: {
			label: 'CI passed',
			colorClass: 'text-status-success border-status-success/30 bg-status-success/10',
		},
		failed: {
			label: 'CI failed',
			colorClass: 'text-status-danger border-status-danger/30 bg-status-danger/10',
		},
		running: {
			label: 'CI running',
			colorClass: 'text-status-info border-status-info/30 bg-status-info/10',
		},
	};

	const resolved = $derived(CONFIG[status]);
</script>

<SimpleTooltip text={resolved.label}>
	{#snippet asChild(props)}
		<span
			{...props}
			class="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium {resolved.colorClass}"
		>
			{#if status === 'passed'}
				<CircleCheckIcon size={12} />
			{:else if status === 'failed'}
				<CircleXIcon size={12} />
			{:else}
				<LoaderCircleIcon size={12} class="animate-spin" />
			{/if}
			CI
		</span>
	{/snippet}
</SimpleTooltip>
