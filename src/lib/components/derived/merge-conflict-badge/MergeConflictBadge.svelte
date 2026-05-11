<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<span
					{...props}
					class="inline-flex items-center gap-1 rounded border border-[color-mix(in_oklch,var(--status-danger)_40%,transparent)] bg-[color-mix(in_oklch,var(--status-danger)_14%,transparent)] px-1.5 py-0.5 text-[10px] leading-tight text-status-danger"
				>
					<span class="opacity-70">⚠</span>
					conflict
				</span>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>Merge conflicts detected with base branch</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
