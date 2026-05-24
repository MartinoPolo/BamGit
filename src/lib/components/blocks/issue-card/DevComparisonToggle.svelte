<script lang="ts">
	import { Switch } from '$lib/components/shadcn/switch/index.js';
	import { useIssueCardSettings } from './issue_card_settings.context.svelte.js';

	const settingsCtx = useIssueCardSettings();
</script>

{#if import.meta.env.DEV}
	<div
		class="flex items-center gap-3 rounded-md border border-dashed border-muted-foreground/30 bg-surface-1/50 px-3 py-2"
	>
		<Switch
			checked={settingsCtx.comparisonEnabled}
			onCheckedChange={() => settingsCtx.toggleComparison()}
		/>
		<div class="flex flex-col">
			<span class="text-xs font-medium text-muted-foreground">A/B: Badge Style</span>
			<span class="text-[10px] text-muted-foreground/70">
				Toggles badge style across all cards. Observe priority badges.
			</span>
		</div>
	</div>
{/if}
