<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<span
					{...props}
					class="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] leading-tight text-red-700 dark:border-red-700/50 dark:bg-red-900/40 dark:text-red-300"
				>
					<span class="opacity-70">⚠</span>
					conflict
				</span>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>Merge conflicts detected with base branch</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
