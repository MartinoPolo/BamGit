<script lang="ts">
	import * as DropdownMenu from '$lib/components/shadcn/dropdown-menu/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Switch } from '$lib/components/shadcn/switch/index.js';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import ViewModeToggle from './ViewModeToggle.svelte';
	import { useAiConfig } from '../ai_config.context.svelte.js';
	import type { AiConfigTab, SortBy, GroupBy } from '../ai_config.context.svelte.js';

	// ─── Types ───────────────────────────────────────────────────────────────

	interface Props {
		tab: AiConfigTab;
	}

	// ─── Constants ───────────────────────────────────────────────────────────

	const CATEGORY_TABS: readonly AiConfigTab[] = [
		'skills',
		'agents',
		'instructions',
		'rules',
		'all',
	];

	const SORT_OPTIONS: { value: SortBy; label: string }[] = [
		{ value: 'name', label: 'Name' },
		{ value: 'source', label: 'Source' },
		{ value: 'category', label: 'Category' },
	];

	const GROUP_OPTIONS_BASE: { value: GroupBy; label: string }[] = [
		{ value: 'flat', label: 'None' },
		{ value: 'source', label: 'Source' },
	];

	const GROUP_OPTION_CATEGORY: { value: GroupBy; label: string } = {
		value: 'category',
		label: 'Category',
	};

	// ─── Props ───────────────────────────────────────────────────────────────

	let { tab }: Props = $props();

	// ─── Context ─────────────────────────────────────────────────────────────

	const aiConfig = useAiConfig();

	// ─── Derived ─────────────────────────────────────────────────────────────

	const showCategoryOptions = $derived(CATEGORY_TABS.includes(tab));

	const sortOptions = $derived(
		showCategoryOptions ? SORT_OPTIONS : SORT_OPTIONS.filter((o) => o.value !== 'category'),
	);

	const groupOptions = $derived(
		showCategoryOptions ? [...GROUP_OPTIONS_BASE, GROUP_OPTION_CATEGORY] : GROUP_OPTIONS_BASE,
	);

	const currentSort = $derived(aiConfig.sortByFor(tab));
	const currentGroup = $derived(aiConfig.groupByFor(tab));

	const currentSortLabel = $derived(
		SORT_OPTIONS.find((o) => o.value === currentSort)?.label ?? 'Name',
	);
	const currentGroupLabel = $derived(
		[...GROUP_OPTIONS_BASE, GROUP_OPTION_CATEGORY].find((o) => o.value === currentGroup)
			?.label ?? 'None',
	);
</script>

<div class="flex items-center gap-2">
	<ViewModeToggle {tab} />

	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} intent="ghost" size="sm" class="h-7 gap-1.5 px-2 text-xs">
					<ArrowUpDownIcon class="size-3" />
					Sort: {currentSortLabel}
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start">
			{#each sortOptions as option (option.value)}
				<DropdownMenu.Item
					onSelect={() => aiConfig.setSortByFor(tab, option.value)}
					class={currentSort === option.value ? 'font-medium' : ''}
				>
					{option.label}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} intent="ghost" size="sm" class="h-7 gap-1.5 px-2 text-xs">
					<LayersIcon class="size-3" />
					Group: {currentGroupLabel}
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start">
			{#each groupOptions as option (option.value)}
				<DropdownMenu.Item
					onSelect={() => aiConfig.setGroupByFor(tab, option.value)}
					class={currentGroup === option.value ? 'font-medium' : ''}
				>
					{option.label}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<label class="flex items-center gap-1.5 text-xs text-foreground-muted">
		<Switch
			checked={aiConfig.showDeprecated}
			onCheckedChange={(checked) => {
				aiConfig.showDeprecated = checked;
			}}
			class="scale-75"
		/>
		Show deprecated
	</label>
</div>
