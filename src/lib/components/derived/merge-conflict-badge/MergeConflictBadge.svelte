<script lang="ts">
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
</script>

<SimpleTooltip text="Merge conflicts detected with base branch">
	{#snippet asChild(props)}
		<span
			{...props}
			class="inline-flex items-center gap-1 rounded border border-[color-mix(in_oklch,var(--status-danger)_40%,transparent)] bg-[color-mix(in_oklch,var(--status-danger)_14%,transparent)] px-1.5 py-0.5 text-[10px] leading-tight text-status-danger"
		>
			<span class="opacity-70">⚠</span>
			conflict
		</span>
	{/snippet}
</SimpleTooltip>
