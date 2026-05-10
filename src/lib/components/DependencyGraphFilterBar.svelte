<script lang="ts">
	import {
		DEFAULT_DEPENDENCY_FILTER,
		type DependencyFilter,
	} from '$lib/modules/dependency-graph';
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
	<button
		type="button"
		class="filter-toggle"
		class:active={filter.showClosed}
		onclick={() => update({ showClosed: !filter.showClosed })}
		aria-pressed={filter.showClosed}
		title={filter.showClosed ? 'Hide closed issues' : 'Show closed issues'}
	>
		{#if filter.showClosed}
			<EyeIcon size={12} />
		{:else}
			<EyeOffIcon size={12} />
		{/if}
		<span>Closed</span>
	</button>

	<button
		type="button"
		class="filter-toggle"
		class:active={filter.afkOnly}
		onclick={() => update({ afkOnly: !filter.afkOnly, hitlOnly: false })}
		aria-pressed={filter.afkOnly}
		title="Show only AFK"
	>
		AFK
	</button>

	<button
		type="button"
		class="filter-toggle"
		class:active={filter.hitlOnly}
		onclick={() => update({ hitlOnly: !filter.hitlOnly, afkOnly: false })}
		aria-pressed={filter.hitlOnly}
		title="Show only HITL"
	>
		HITL
	</button>

	{#if areaOptions.length > 0}
		<select
			class="filter-select"
			value={filter.area ?? ''}
			onchange={(event) => {
				const target = event.target as HTMLSelectElement;
				update({ area: target.value === '' ? null : target.value });
			}}
			aria-label="Filter by area"
		>
			<option value="">All areas</option>
			{#each areaOptions as area (area)}
				<option value={area}>{area}</option>
			{/each}
		</select>
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
		<button
			type="button"
			class="filter-reset"
			onclick={reset}
			title="Reset filters"
			aria-label="Reset filters"
		>
			<RotateCcwIcon size={12} />
		</button>
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

	.filter-toggle {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 10px;
		height: 26px;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) * 1);
		background: var(--card);
		color: var(--muted-foreground);
		font-size: 11px;
		font-weight: 600;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.filter-toggle:hover {
		background: var(--accent);
		color: var(--accent-foreground);
	}

	.filter-toggle.active {
		background: var(--primary);
		border-color: var(--primary);
		color: var(--primary-foreground);
	}

	.filter-select {
		height: 26px;
		padding: 0 6px;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) * 1);
		background: var(--card);
		color: var(--foreground);
		font-size: 11px;
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

	.filter-reset {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) * 1);
		background: var(--card);
		color: var(--muted-foreground);
		cursor: pointer;
	}

	.filter-reset:hover {
		background: var(--accent);
		color: var(--accent-foreground);
	}
</style>
