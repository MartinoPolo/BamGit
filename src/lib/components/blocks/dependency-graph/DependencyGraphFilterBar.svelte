<script lang="ts">
	import {
		DEFAULT_DEPENDENCY_FILTER,
		type DependencyFilter,
	} from '$lib/modules/dependency-graph';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Toggle } from '$lib/components/shadcn/toggle/index.js';
	import { Select } from '$lib/components/shadcn/select/index.js';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';

	interface Props {
		filter: DependencyFilter;
		areaOptions: readonly string[];
		onChange: (next: DependencyFilter) => void;
	}

	let { filter, areaOptions, onChange }: Props = $props();

	function update(patch: Partial<DependencyFilter>) {
		onChange({ ...filter, ...patch });
	}

	function reset() {
		onChange({ ...DEFAULT_DEPENDENCY_FILTER });
	}

	const isDefault = $derived(
		filter.showClosed === DEFAULT_DEPENDENCY_FILTER.showClosed &&
			filter.afkOnly === DEFAULT_DEPENDENCY_FILTER.afkOnly &&
			filter.hitlOnly === DEFAULT_DEPENDENCY_FILTER.hitlOnly &&
			filter.area === DEFAULT_DEPENDENCY_FILTER.area &&
			filter.labelSearch === DEFAULT_DEPENDENCY_FILTER.labelSearch,
	);
</script>

<div class="filter-bar">
	<Toggle
		intent="outline"
		size="sm"
		class="h-6.5 text-[11px] font-semibold"
		pressed={filter.showClosed}
		onPressedChange={(pressed) => update({ showClosed: pressed })}
		title={filter.showClosed ? 'Hide closed issues' : 'Show closed issues'}
	>
		{#if filter.showClosed}
			<EyeIcon data-icon="inline-start" />
		{:else}
			<EyeOffIcon data-icon="inline-start" />
		{/if}
		Closed
	</Toggle>

	<Toggle
		intent="outline"
		size="sm"
		class="h-6.5 text-[11px] font-semibold"
		pressed={filter.afkOnly}
		onPressedChange={(pressed) => update({ afkOnly: pressed, hitlOnly: false })}
		title="Show only AFK"
	>
		AFK
	</Toggle>

	<Toggle
		intent="outline"
		size="sm"
		class="h-6.5 text-[11px] font-semibold"
		pressed={filter.hitlOnly}
		onPressedChange={(pressed) => update({ hitlOnly: pressed, afkOnly: false })}
		title="Show only HITL"
	>
		HITL
	</Toggle>

	{#if areaOptions.length > 0}
		<Select
			value={filter.area ?? ''}
			onchange={(event) => {
				const target = event.currentTarget as HTMLSelectElement;
				update({ area: target.value === '' ? null : target.value });
			}}
			aria-label="Filter by area"
			class="h-[26px] w-auto text-[11px]"
		>
			<option value="">All areas</option>
			{#each areaOptions as area (area)}
				<option value={area}>{area}</option>
			{/each}
		</Select>
	{/if}

	<input
		class="filter-search"
		type="search"
		placeholder="Search labels…"
		value={filter.labelSearch}
		oninput={(event) => update({ labelSearch: (event.target as HTMLInputElement).value })}
		aria-label="Search labels"
	/>

	{#if !isDefault}
		<Button
			intent="secondary"
			size="icon-sm"
			class="size-6.5"
			onclick={reset}
			title="Reset filters"
			aria-label="Reset filters"
		>
			<RotateCcwIcon data-icon="inline-start" />
		</Button>
	{/if}
</div>

<style>
	.filter-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		padding: 4px 0;
	}

	.filter-search {
		height: 26px;
		min-width: 140px;
		padding: 0 8px;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) * 1);
		background: var(--card);
		color: var(--foreground);
		font-size: 11px;
	}
</style>
