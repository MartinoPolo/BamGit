<script lang="ts">
	import { VIEW_MODE, type ViewMode } from '$lib/modules/dependency-graph';
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
	<div class="segmented" role="tablist" aria-label="Dependency graph view">
		<button
			type="button"
			role="tab"
			aria-selected={viewMode === VIEW_MODE.global}
			class="segmented-button"
			class:active={viewMode === VIEW_MODE.global}
			onclick={() => onViewModeChange(VIEW_MODE.global)}
		>
			<GlobeIcon size={14} />
			<span>Global</span>
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={viewMode === VIEW_MODE.prds}
			class="segmented-button"
			class:active={viewMode === VIEW_MODE.prds}
			onclick={() => onViewModeChange(VIEW_MODE.prds)}
		>
			<LayersIcon size={14} />
			<span>PRDs</span>
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={viewMode === VIEW_MODE.singlePrd}
			class="segmented-button"
			class:active={viewMode === VIEW_MODE.singlePrd}
			onclick={() => onViewModeChange(VIEW_MODE.singlePrd)}
			disabled={prdOptions.length === 0}
		>
			<FocusIcon size={14} />
			<span>Single PRD</span>
		</button>
	</div>

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

	.segmented {
		display: inline-flex;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) * 1);
		overflow: hidden;
		background: var(--card);
	}

	.segmented-button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		border: none;
		border-right: 1px solid var(--border);
		background: transparent;
		color: var(--muted-foreground);
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: background 150ms ease;
	}

	.segmented-button:last-child {
		border-right: none;
	}

	.segmented-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.segmented-button:hover:not(:disabled) {
		background: var(--accent);
	}

	.segmented-button.active {
		background: var(--primary);
		color: var(--primary-foreground);
	}
</style>
