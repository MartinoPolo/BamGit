<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import * as m from '$lib/paraglide/messages.js';
	import { useSettings } from '$lib/modules/settings';
	import type { VersionControlContext } from '$lib/modules/version-control';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import * as DropdownMenu from '$lib/components/shadcn/dropdown-menu/index.js';
	import * as Popover from '$lib/components/shadcn/popover/index.js';
	import { Separator } from '$lib/components/shadcn/separator/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import { Toggle } from '$lib/components/shadcn/toggle/index.js';
	import SearchField from '$lib/components/base/search-field/SearchField.svelte';
	import ThemeToggle from '$lib/components/derived/theme-toggle/ThemeToggle.svelte';
	import GitHubStatusCard from '$lib/components/blocks/github/GitHubStatusCard.svelte';
	import GitHubAuthWizard from '$lib/components/blocks/github-auth/GitHubAuthWizard.svelte';
	import GithubIcon from '$lib/components/derived/icons/GithubIcon.svelte';
	import { invoke } from '$lib/tauri.js';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import { useOverviewToolbar } from './overview_toolbar.context.svelte.js';
	import { overviewActionButtonClass } from './overview_style.js';
	import {
		OVERVIEW_SORT_MODES,
		OVERVIEW_SORT_DIRECTIONS,
		OVERVIEW_FILTER_MODES,
		OVERVIEW_FOOTER_CONTENT_OPTIONS,
		SORT_MODE_LABELS,
		SORT_DIRECTION_LABELS,
		FILTER_MODE_LABELS,
		FOOTER_CONTENT_LABELS,
		isOverviewSortMode,
		isOverviewSortDirection,
		isOverviewFilterMode,
		isOverviewFooterContent,
	} from './overview_toolbar_types.js';

	interface Props {
		versionControl: VersionControlContext;
		filteredCount: number;
		totalCount: number;
	}

	let { versionControl, filteredCount, totalCount }: Props = $props();

	const toolbar = useOverviewToolbar();
	const settingsCtx = useSettings();

	let searchFieldRef = $state<HTMLInputElement | null>(null);
	let authWizardOpen = $state(false);

	function openSettings() {
		settingsCtx.setReturnUrl(page.url.pathname + page.url.search);
		void goto(resolve('/settings/general'));
	}

	function handleKeydown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
			event.preventDefault();
			searchFieldRef?.focus();
			searchFieldRef?.select();
		}
	}

	const sortModeEntries = Object.values(OVERVIEW_SORT_MODES);
	const sortDirectionEntries = Object.values(OVERVIEW_SORT_DIRECTIONS);
	const filterModeEntries = Object.values(OVERVIEW_FILTER_MODES);
	const footerContentEntries = Object.values(OVERVIEW_FOOTER_CONTENT_OPTIONS);
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex items-center gap-2">
	<!-- Search -->
	<SearchField
		bind:ref={searchFieldRef}
		bind:value={toolbar.searchQuery.current}
		placeholder="Search workspaces..."
		class="w-60 max-md:w-40"
		aria-label="Search workspaces"
	/>

	<div class="flex-1"></div>

	<!-- Sort -->
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<SimpleTooltip text="Sort" side="bottom">
					{#snippet asChild(tooltipProps)}
						<Button
							{...props}
							{...tooltipProps}
							intent="ghost"
							size="icon-sm"
							aria-label="Sort workspaces"
							class={[overviewActionButtonClass, 'relative']}
						>
							<ArrowUpDownIcon data-icon="inline-start" />
							{#if toolbar.isNonDefaultSort}
								<span
									class="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary"
								></span>
							{/if}
						</Button>
					{/snippet}
				</SimpleTooltip>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-48">
			<DropdownMenu.Label>Sort by</DropdownMenu.Label>
			<DropdownMenu.RadioGroup
				value={toolbar.sortMode.current}
				onValueChange={(value) => {
					if (isOverviewSortMode(value)) {
						toolbar.sortMode.current = value;
					}
				}}
			>
				{#each sortModeEntries as mode (mode)}
					<DropdownMenu.RadioItem value={mode}>
						{SORT_MODE_LABELS[mode]}
					</DropdownMenu.RadioItem>
				{/each}
			</DropdownMenu.RadioGroup>
			<DropdownMenu.Separator />
			<DropdownMenu.Label>Direction</DropdownMenu.Label>
			<DropdownMenu.RadioGroup
				value={toolbar.sortDirection.current}
				onValueChange={(value) => {
					if (isOverviewSortDirection(value)) {
						toolbar.sortDirection.current = value;
					}
				}}
			>
				{#each sortDirectionEntries as direction (direction)}
					<DropdownMenu.RadioItem value={direction}>
						{SORT_DIRECTION_LABELS[direction]}
					</DropdownMenu.RadioItem>
				{/each}
			</DropdownMenu.RadioGroup>
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<!-- Filter -->
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<SimpleTooltip text="Filter" side="bottom">
					{#snippet asChild(tooltipProps)}
						<Button
							{...props}
							{...tooltipProps}
							intent="ghost"
							size="icon-sm"
							aria-label="Filter workspaces"
							class={[overviewActionButtonClass, 'relative']}
						>
							<FilterIcon data-icon="inline-start" />
							{#if toolbar.isNonDefaultFilter}
								<span
									class="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary"
								></span>
							{/if}
						</Button>
					{/snippet}
				</SimpleTooltip>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-48">
			<DropdownMenu.RadioGroup
				value={toolbar.filterMode.current}
				onValueChange={(value) => {
					if (isOverviewFilterMode(value)) {
						toolbar.filterMode.current = value;
					}
				}}
			>
				{#each filterModeEntries as mode (mode)}
					<DropdownMenu.RadioItem value={mode}>
						{FILTER_MODE_LABELS[mode]}
					</DropdownMenu.RadioItem>
				{/each}
			</DropdownMenu.RadioGroup>
			<DropdownMenu.Separator />
			<span class="px-2 py-1 text-xs text-muted-foreground">
				{filteredCount} of {totalCount} workspaces shown
			</span>
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<Separator orientation="vertical" class="h-4" />

	<!-- Archive toggle -->
	<SimpleTooltip text="Show archived" side="bottom">
		{#snippet asChild(props)}
			<Toggle
				{...props}
				intent="outline"
				size="icon-sm"
				pressed={toolbar.showArchived.current}
				onPressedChange={(pressed) => (toolbar.showArchived.current = pressed)}
				aria-label="Toggle archived workspaces"
				class={overviewActionButtonClass}
			>
				<ArchiveIcon data-icon="inline-start" />
			</Toggle>
		{/snippet}
	</SimpleTooltip>

	<!-- Footer Settings -->
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<SimpleTooltip text="Card footer" side="bottom">
					{#snippet asChild(tooltipProps)}
						<Button
							{...props}
							{...tooltipProps}
							intent="ghost"
							size="icon-sm"
							aria-label="Configure workspace card footer"
							class={[overviewActionButtonClass, 'relative']}
						>
							<SlidersHorizontalIcon data-icon="inline-start" />
							{#if toolbar.isNonDefaultFooter}
								<span
									class="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary"
								></span>
							{/if}
						</Button>
					{/snippet}
				</SimpleTooltip>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-56">
			<DropdownMenu.Label>Workspace card footer</DropdownMenu.Label>
			<DropdownMenu.RadioGroup
				value={toolbar.footerContent.current}
				onValueChange={(value) => {
					if (isOverviewFooterContent(value)) {
						toolbar.footerContent.current = value;
					}
				}}
			>
				{#each footerContentEntries as option (option)}
					<DropdownMenu.RadioItem value={option}>
						{FOOTER_CONTENT_LABELS[option]}
					</DropdownMenu.RadioItem>
				{/each}
			</DropdownMenu.RadioGroup>
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<Separator orientation="vertical" class="h-4" />

	<!-- Theme Toggle -->
	<ThemeToggle compact class={overviewActionButtonClass} />

	<!-- Settings -->
	<SimpleTooltip text={m.nav_settings()} side="bottom">
		{#snippet asChild(props)}
			<Button
				{...props}
				intent="ghost"
				size="icon-sm"
				aria-label={m.nav_settings()}
				onclick={openSettings}
				class={overviewActionButtonClass}
			>
				<SettingsIcon data-icon="inline-start" />
			</Button>
		{/snippet}
	</SimpleTooltip>

	<!-- GitHub Status -->
	<Popover.Root>
		<Popover.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					intent="ghost"
					size="icon-sm"
					aria-label="GitHub connection settings"
					class={overviewActionButtonClass}
				>
					<GithubIcon data-icon="inline-start" />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-80" align="end">
			<GitHubStatusCard
				borderless
				authStatus={versionControl.authStatus}
				ghAvailability={versionControl.ghAvailability}
				onconnect={() => (authWizardOpen = true)}
				ondisconnect={async () => {
					await invoke('github_logout');
					await versionControl.checkAvailability();
				}}
			/>
		</Popover.Content>
	</Popover.Root>
</div>

{#if authWizardOpen}
	<GitHubAuthWizard
		bind:open={authWizardOpen}
		onconnected={() => void versionControl.checkAvailability()}
	/>
{/if}
