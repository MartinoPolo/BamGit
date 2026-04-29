<script lang="ts">
	import type { Snippet } from 'svelte';
	import SearchIcon from '@lucide/svelte/icons/search';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import BellIcon from '@lucide/svelte/icons/bell';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ListIcon from '@lucide/svelte/icons/list';
	import KanbanIcon from '@lucide/svelte/icons/kanban';
	import TreesIcon from '@lucide/svelte/icons/trees';
	import type { ViewMode } from '$lib/modules/board';

	type TopBarControl =
		| 'search'
		| 'filter'
		| 'sort'
		| 'sync'
		| 'legend'
		| 'notifications'
		| 'view'
		| 'plant';

	interface Props {
		title: string;
		subtitle?: string;
		controls?: TopBarControl[];
		transparent?: boolean;
		viewMode?: ViewMode;
		hasNotifications?: boolean;
		syncing?: boolean;
		onViewModeChange?: (mode: ViewMode) => void;
		onSync?: () => void;
		onPlant?: () => void;
		onSearch?: () => void;
		children?: Snippet;
	}

	let {
		title,
		subtitle,
		controls = ['search', 'filter', 'sort', 'sync', 'notifications', 'view', 'plant'],
		transparent = false,
		viewMode,
		hasNotifications = false,
		syncing = false,
		onViewModeChange,
		onSync,
		onPlant,
		onSearch,
		children,
	}: Props = $props();

	function has(control: TopBarControl): boolean {
		return controls.includes(control);
	}

	const viewTabs = [
		{ value: 'list' as const, Icon: ListIcon, label: 'List' },
		{ value: 'kanban' as const, Icon: KanbanIcon, label: 'Kanban' },
		{ value: 'forest' as const, Icon: TreesIcon, label: 'Forest' },
	];
</script>

<div
	class="flex items-center justify-between gap-3"
	class:topbar-default={!transparent}
	class:topbar-transparent={transparent}
>
	<!-- Left: title -->
	<div class="min-w-0">
		{#if transparent}
			<div class="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
				The Grove
			</div>
		{/if}
		<h1 class="truncate text-[17px] font-semibold leading-tight">{title}</h1>
		{#if subtitle}
			<div class="mt-0.5 font-mono text-[10px] text-foreground-subtle">{subtitle}</div>
		{/if}
	</div>

	<!-- Right: controls -->
	<div class="flex shrink-0 items-center gap-1.5">
		{#if has('search')}
			<button class="topbar-search" class:topbar-glass={transparent} onclick={onSearch}>
				<SearchIcon size={12} class="pointer-events-none text-foreground-subtle" />
				<span class="text-foreground-subtle">Search…</span>
				<kbd class="topbar-kbd">Ctrl+K</kbd>
			</button>
		{/if}

		{#if has('filter')}
			<button class="topbar-btn" class:topbar-glass={transparent} title="Filter">
				<FilterIcon size={12} />
				<span>Filter</span>
			</button>
		{/if}

		{#if has('sort')}
			<button class="topbar-btn" class:topbar-glass={transparent} title="Sort">
				<LayersIcon size={12} />
				<span>Sort</span>
			</button>
		{/if}

		{#if has('sync')}
			<button
				class="topbar-btn topbar-btn-icon"
				class:topbar-glass={transparent}
				title="Sync"
				disabled={syncing}
				onclick={onSync}
			>
				<RefreshCwIcon size={13} class={syncing ? 'animate-spin' : ''} />
			</button>
		{/if}

		{#if has('legend')}
			<button
				class="topbar-btn topbar-btn-icon"
				class:topbar-glass={transparent}
				title="Legend"
			>
				<SparklesIcon size={13} />
			</button>
		{/if}

		{#if has('notifications')}
			<button
				class="topbar-btn topbar-btn-icon relative"
				class:topbar-glass={transparent}
				title="Notifications"
			>
				<BellIcon size={13} />
				{#if hasNotifications}
					<span class="absolute top-1 right-1 size-1.5 rounded-full bg-accent"></span>
				{/if}
			</button>
		{/if}

		{#if has('view') && viewMode !== undefined && onViewModeChange}
			<div
				class="flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5"
				class:topbar-glass={transparent}
			>
				{#each viewTabs as tab (tab.value)}
					<button
						class="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] transition-colors"
						class:bg-background={viewMode === tab.value}
						class:text-foreground={viewMode === tab.value}
						class:shadow-sm={viewMode === tab.value}
						class:text-muted-foreground={viewMode !== tab.value}
						title={tab.label}
						onclick={() => onViewModeChange(tab.value)}
					>
						<tab.Icon size={11} />
						<span>{tab.label}</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if has('plant')}
			<button class="topbar-btn-primary" title="Plant a tree" onclick={onPlant}>
				<PlusIcon size={12} />
				<span>Plant</span>
			</button>
		{/if}

		{#if children}
			{@render children()}
		{/if}
	</div>
</div>

<style>
	.topbar-default {
		padding: 12px 20px;
		border-bottom: 1px solid var(--border);
	}

	.topbar-transparent {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: var(--z-raised);
		padding: 14px 24px;
		background: color-mix(in oklch, var(--surface) 60%, transparent);
		backdrop-filter: blur(8px);
	}

	.topbar-search {
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		width: 200px;
		height: 30px;
		padding: 0 8px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: transparent;
		font-size: 12.5px;
		font-family: inherit;
		cursor: pointer;
		transition: border-color 120ms;
	}

	.topbar-search:hover {
		border-color: var(--border-strong);
	}

	.topbar-kbd {
		margin-left: auto;
		padding: 1px 5px;
		font-size: 10px;
		font-family: inherit;
		border-radius: 4px;
		background: var(--surface-2);
		color: var(--foreground-subtle);
	}

	.topbar-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 5px 10px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: transparent;
		font-size: 12px;
		font-family: inherit;
		color: var(--foreground-muted);
		cursor: pointer;
		transition:
			border-color 120ms,
			color 120ms;
	}

	.topbar-btn:hover {
		border-color: var(--border-strong);
		color: var(--foreground);
	}

	.topbar-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.topbar-btn-icon {
		padding: 5px 6px;
	}

	.topbar-btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 5px 12px;
		border: none;
		border-radius: var(--radius);
		background: var(--primary);
		color: var(--primary-foreground);
		font-size: 12px;
		font-family: inherit;
		cursor: pointer;
		transition: opacity 120ms;
	}

	.topbar-btn-primary:hover {
		opacity: 0.9;
	}

	.topbar-glass {
		background: color-mix(in oklch, var(--surface) 60%, transparent);
		backdrop-filter: blur(8px);
	}
</style>
