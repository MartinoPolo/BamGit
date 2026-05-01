<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
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
	import { useKeyboardShortcuts } from '$lib/modules/keyboard-shortcuts';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Tabs, Tab } from '$lib/components/ui/tabs/index.js';

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

	const shortcutsCtx = useKeyboardShortcuts();
	const searchBinding = $derived(shortcutsCtx.getBindingForDisplay('command-palette'));

	function has(control: TopBarControl): boolean {
		return controls.includes(control);
	}

	const VIEW_LABELS = {
		list: () => m.view_list(),
		kanban: () => m.view_kanban(),
		forest: () => m.view_forest(),
	} as const;

	const viewTabs = [
		{ value: 'list' as const, Icon: ListIcon, labelKey: 'list' as const },
		{ value: 'kanban' as const, Icon: KanbanIcon, labelKey: 'kanban' as const },
		{ value: 'forest' as const, Icon: TreesIcon, labelKey: 'forest' as const },
	];

	const glassClass = $derived(
		transparent
			? 'backdrop-blur-sm bg-[color-mix(in_oklch,var(--surface)_60%,transparent)]'
			: '',
	);
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
				{m.topbar_the_grove()}
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
			<Button
				variant="ghost"
				size="sm"
				class="w-[200px] justify-start {glassClass}"
				onclick={onSearch}
			>
				<SearchIcon size={12} class="pointer-events-none text-foreground-subtle" />
				<span class="text-foreground-subtle">{m.topbar_search()}</span>
				{#if searchBinding}
					<kbd class="topbar-kbd">{searchBinding}</kbd>
				{/if}
			</Button>
		{/if}

		{#if has('filter')}
			<Button variant="ghost" size="sm" class={glassClass} title={m.topbar_filter()}>
				<FilterIcon size={12} />
				<span>{m.topbar_filter()}</span>
			</Button>
		{/if}

		{#if has('sort')}
			<Button variant="ghost" size="sm" class={glassClass} title={m.topbar_sort()}>
				<LayersIcon size={12} />
				<span>{m.topbar_sort()}</span>
			</Button>
		{/if}

		{#if has('sync')}
			<Button
				variant="ghost"
				size="icon-sm"
				class={glassClass}
				title={m.topbar_sync()}
				disabled={syncing}
				onclick={onSync}
			>
				<RefreshCwIcon size={13} class={syncing ? 'animate-spin' : ''} />
			</Button>
		{/if}

		{#if has('legend')}
			<Button variant="ghost" size="icon-sm" class={glassClass} title={m.topbar_legend()}>
				<SparklesIcon size={13} />
			</Button>
		{/if}

		{#if has('notifications')}
			<Button
				variant="ghost"
				size="icon-sm"
				class="relative {glassClass}"
				title={m.topbar_notifications()}
			>
				<BellIcon size={13} />
				{#if hasNotifications}
					<span class="absolute top-1 right-1 size-1.5 rounded-full bg-accent"></span>
				{/if}
			</Button>
		{/if}

		{#if has('view') && viewMode !== undefined && onViewModeChange}
			<Tabs class={glassClass}>
				{#each viewTabs as tab (tab.value)}
					<Tab
						active={viewMode === tab.value}
						title={VIEW_LABELS[tab.labelKey]()}
						onclick={() => onViewModeChange(tab.value)}
					>
						<tab.Icon size={11} />
						<span>{VIEW_LABELS[tab.labelKey]()}</span>
					</Tab>
				{/each}
			</Tabs>
		{/if}

		{#if has('plant')}
			<Button variant="primary" size="sm" title={m.topbar_plant_title()} onclick={onPlant}>
				<PlusIcon size={12} />
				<span>{m.topbar_plant()}</span>
			</Button>
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

	.topbar-kbd {
		margin-left: auto;
		padding: 1px 5px;
		font-size: 10px;
		font-family: inherit;
		border-radius: 4px;
		background: var(--surface-2);
		color: var(--foreground-subtle);
	}
</style>
