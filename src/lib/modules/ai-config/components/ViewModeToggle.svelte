<script lang="ts">
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import ListIcon from '@lucide/svelte/icons/list';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { useAiConfig } from '../ai_config.context.svelte.js';
	import type { AiConfigTab } from '../ai_config.context.svelte.js';

	interface Props {
		tab: AiConfigTab;
	}

	let { tab }: Props = $props();

	const aiConfig = useAiConfig();
</script>

<div class="flex items-center gap-0.5">
	<Button
		intent="ghost"
		size="icon-sm"
		aria-pressed={aiConfig.viewModeFor(tab) === 'card'}
		aria-label="Card view"
		onclick={() => aiConfig.setViewModeFor(tab, 'card')}
		class={aiConfig.viewModeFor(tab) === 'card' ? 'bg-surface-2 text-foreground' : ''}
	>
		<LayoutGridIcon data-icon="inline-end" />
	</Button>
	<Button
		intent="ghost"
		size="icon-sm"
		aria-pressed={aiConfig.viewModeFor(tab) === 'list'}
		aria-label="List view"
		onclick={() => aiConfig.setViewModeFor(tab, 'list')}
		class={aiConfig.viewModeFor(tab) === 'list' ? 'bg-surface-2 text-foreground' : ''}
	>
		<ListIcon data-icon="inline-end" />
	</Button>
</div>
