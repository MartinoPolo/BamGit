<script lang="ts">
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import ListIcon from '@lucide/svelte/icons/list';
	import * as ToggleGroup from '$lib/components/shadcn/toggle-group/index.js';
	import { useAiConfig } from '../ai_config.context.svelte.js';
	import type { AiConfigTab } from '../ai_config.context.svelte.js';

	interface Props {
		tab: AiConfigTab;
	}

	let { tab }: Props = $props();

	const aiConfig = useAiConfig();
</script>

<ToggleGroup.Root
	type="single"
	value={aiConfig.viewModeFor(tab)}
	onValueChange={(value: string) => {
		if (value) {
			aiConfig.setViewModeFor(tab, value as 'card' | 'list');
		}
	}}
	size="icon-sm"
>
	<ToggleGroup.Item value="card" aria-label="Card view">
		<LayoutGridIcon data-icon="inline-start" />
	</ToggleGroup.Item>
	<ToggleGroup.Item value="list" aria-label="List view">
		<ListIcon data-icon="inline-start" />
	</ToggleGroup.Item>
</ToggleGroup.Root>
