<script lang="ts">
	import { cn } from '$lib/utils.js';
	import * as Accordion from '$lib/components/shadcn/accordion/index.js';
	import type { ImportanceTier } from '$lib/types/generated';
	import type { Snippet } from 'svelte';

	interface Props {
		tier: ImportanceTier;
		label: string;
		assignedCount: number;
		totalCount: number;
		value: string;
		children: Snippet;
	}

	let { tier, label, assignedCount, totalCount, value, children }: Props = $props();

	const missingCount = $derived(totalCount - assignedCount);
	const hasMissing = $derived(missingCount > 0);

	const tierDotColor = $derived.by(() => {
		if (tier === 'critical') {
			return 'bg-status-danger shadow-[0_0_6px_var(--status-danger)]';
		}
		if (tier === 'important') {
			return 'bg-status-warning shadow-[0_0_6px_var(--status-warning)]';
		}
		return 'bg-muted-foreground';
	});

	const tierTextColor = $derived.by(() => {
		if (hasMissing && tier === 'critical') {
			return 'text-status-danger';
		}
		if (hasMissing && tier === 'important') {
			return 'text-[color-mix(in_oklch,var(--status-warning)_70%,var(--foreground))]';
		}
		return 'text-foreground';
	});
</script>

<Accordion.Item {value} class="border-none">
	<Accordion.Trigger class="py-2 hover:no-underline">
		<div class="flex items-center gap-2">
			<div class={cn('size-2 rounded-full', tierDotColor)}></div>
			<span class={cn('text-sm font-medium', tierTextColor)}>{label}</span>
			<span class={cn('text-xs', hasMissing ? tierTextColor : 'text-muted-foreground')}>
				{assignedCount} / {totalCount} assigned
				{#if hasMissing}
					<span class="font-medium"> · {missingCount} missing</span>
				{/if}
			</span>
		</div>
	</Accordion.Trigger>
	<Accordion.Content class="pb-4 pt-0">
		<div class="grid gap-3" style:grid-template-columns="repeat(auto-fill, minmax(340px, 1fr))">
			{@render children()}
		</div>
	</Accordion.Content>
</Accordion.Item>
