<script lang="ts">
	import type { Snippet } from 'svelte';
	import CpuIcon from '@lucide/svelte/icons/cpu';
	import { Button } from '$lib/components/ui/button/index.js';

	interface Props {
		name: string;
		model: string;
		toolCount: number;
		duration: string;
		onCollapse?: () => void;
		children?: Snippet;
	}

	let { name, model, toolCount, duration, onCollapse, children }: Props = $props();
</script>

<div
	class="my-2.5 rounded-r-md border-l-[3px] border-l-azure-400 px-3.5 py-2.5"
	style="background: color-mix(in oklch, var(--azure-400) 4%, transparent)"
>
	<!-- Header -->
	<div class="mb-2 flex items-center gap-1.5">
		<CpuIcon size={12} strokeWidth={1.8} class="text-azure-400" />
		<span class="text-xs font-semibold">Sub-agent: {name}</span>
		<span class="font-mono text-[10px] text-foreground-subtle">
			{model} · {toolCount} tools · {duration}
		</span>
		<div class="flex-1"></div>
		<Button variant="ghost" size="sm" class="px-1.5 text-[10px]" onclick={onCollapse}>
			Collapse
		</Button>
	</div>

	<!-- Sub-agent content -->
	<div class="flex flex-col gap-1.5 opacity-85">
		{#if children}
			{@render children()}
		{:else}
			<div class="text-[13px] leading-[1.5] text-foreground-muted">
				Sub-agent messages would appear here when data is available.
			</div>
		{/if}
	</div>
</div>
