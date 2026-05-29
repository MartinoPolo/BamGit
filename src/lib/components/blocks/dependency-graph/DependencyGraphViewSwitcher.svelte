<script lang="ts">
	import { VIEW_MODE, type ViewMode } from '$lib/modules/dependency-graph';
	import * as Tabs from '$lib/components/shadcn/tabs/index.js';
	import { Select } from '$lib/components/shadcn/select/index.js';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import FocusIcon from '@lucide/svelte/icons/focus';

	interface PrdOption {
		id: string;
		name: string;
	}

	interface Props {
		viewMode: ViewMode;
		selectedPrdId: string | null;
		prdOptions: readonly PrdOption[];
		onViewModeChange: (mode: ViewMode) => void;
		onSelectedPrdChange: (id: string | null) => void;
	}

	let { viewMode, selectedPrdId, prdOptions, onViewModeChange, onSelectedPrdChange }: Props =
		$props();

	function handleSelectChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		onSelectedPrdChange(target.value === '' ? null : target.value);
	}
</script>

<div class="view-switcher">
	<Tabs.Root
		aria-label="Dependency graph view"
		value={viewMode}
		onValueChange={(v) => onViewModeChange(v as ViewMode)}
	>
		<Tabs.List>
			<Tabs.Trigger value={VIEW_MODE.global}>
				<GlobeIcon data-icon="inline-start" />
				Global
			</Tabs.Trigger>
			<Tabs.Trigger value={VIEW_MODE.prds}>
				<LayersIcon data-icon="inline-start" />
				PRDs
			</Tabs.Trigger>
			<Tabs.Trigger value={VIEW_MODE.singlePrd} disabled={prdOptions.length === 0}>
				<FocusIcon data-icon="inline-start" />
				Single PRD
			</Tabs.Trigger>
		</Tabs.List>
	</Tabs.Root>

	{#if viewMode === VIEW_MODE.singlePrd}
		<Select
			value={selectedPrdId ?? ''}
			onchange={handleSelectChange}
			aria-label="Select PRD"
			class="h-[30px] min-w-[180px] w-auto text-[12px]"
		>
			{#if prdOptions.length === 0}
				<option value="">No PRDs available</option>
			{:else}
				{#if selectedPrdId === null}
					<option value="">Select a PRD…</option>
				{/if}
				{#each prdOptions as option (option.id)}
					<option value={option.id}>{option.name}</option>
				{/each}
			{/if}
		</Select>
	{/if}
</div>

<style>
	.view-switcher {
		display: flex;
		align-items: center;
		gap: 8px;
	}
</style>
