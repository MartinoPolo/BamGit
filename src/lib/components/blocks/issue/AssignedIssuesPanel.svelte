<script lang="ts">
	import type { AssignedIssue } from '$lib/types/generated';
	import type { Issue } from '$lib/modules/issues';
	import {
		categorizeAssignedIssues,
		filterAssignedIssues,
		sortAssignedIssues,
		sortLabelsByPriority,
		type SortColumn,
		type SortDirection,
	} from './assigned_issues_utils.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import Plus from '@lucide/svelte/icons/plus';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Check from '@lucide/svelte/icons/check';
	import { SvelteSet } from 'svelte/reactivity';
	import { openUrl } from '$lib/opener.js';
	import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
	import * as Collapsible from '$lib/components/shadcn/collapsible/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import { Checkbox } from '$lib/components/shadcn/checkbox/index.js';
	import { SearchField } from '$lib/components/base/search-field/index.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		issues: AssignedIssue[];
		dashboardIssues: readonly Issue[];
		hasMore: boolean;
		loading?: boolean;
		lastSynced?: Date | null;
		disabled?: boolean;
		onWizardOpen?: (issue: AssignedIssue) => void;
		onQuickAddWithWorktree?: (issue: AssignedIssue) => void;
		onLoadMore?: () => void;
		onRefresh?: () => void;
	}

	function isBoolean(value: unknown): value is boolean {
		return typeof value === 'boolean';
	}

	let {
		issues,
		dashboardIssues,
		hasMore,
		loading = false,
		lastSynced = null,
		disabled = false,
		onWizardOpen,
		onQuickAddWithWorktree,
		onLoadMore,
		onRefresh,
	}: Props = $props();

	// ─── Persisted section collapse state ────────────────────────────────────
	const unlinkedCollapsed = new Persisted<boolean>({
		key: 'grovekeeper_assigned_unlinked_collapsed',
		serde: jsonSerde(isBoolean),
		defaultValue: false,
	});
	const linkedCollapsed = new Persisted<boolean>({
		key: 'grovekeeper_assigned_linked_collapsed',
		serde: jsonSerde(isBoolean),
		defaultValue: true,
	});

	// ─── Search, sort, selection state ────────────────────────────────────────
	let searchQuery = $state('');
	let sortColumn = $state<SortColumn>('number');
	let sortDirection = $state<SortDirection>('desc');
	const selectedNumbers = new SvelteSet<number>();
	let panelElement = $state<HTMLDivElement | null>(null);

	// ─── Derived data ────────────────────────────────────────────────────────
	const categorized = $derived(categorizeAssignedIssues(issues, dashboardIssues));

	const filteredUnlinked = $derived(
		sortAssignedIssues(
			filterAssignedIssues(categorized.unlinked, searchQuery),
			sortColumn,
			sortDirection,
		),
	);
	const filteredLinked = $derived(
		sortAssignedIssues(
			filterAssignedIssues(categorized.linked, searchQuery),
			sortColumn,
			sortDirection,
		),
	);
	const allFiltered = $derived([...filteredUnlinked, ...filteredLinked]);

	const selectedCount = $derived(selectedNumbers.size);
	const selectedUnlinkedCount = $derived(
		filteredUnlinked.filter((issue) => selectedNumbers.has(issue.number)).length,
	);

	const globalCheckboxState = $derived.by(() => {
		if (selectedCount === 0) {
			return { checked: false, indeterminate: false };
		}
		const allSelected = allFiltered.every((issue) => selectedNumbers.has(issue.number));
		if (allSelected) {
			return { checked: true, indeterminate: false };
		}
		return { checked: false, indeterminate: true };
	});

	const syncAgoText = $derived.by(() => {
		if (lastSynced === null) {
			return 'never synced';
		}
		const seconds = Math.floor((Date.now() - lastSynced.getTime()) / 1000);
		if (seconds < 60) {
			return `synced ${seconds}s ago`;
		}
		const minutes = Math.floor(seconds / 60);
		return `synced ${minutes}m ago`;
	});

	// ─── Handlers ────────────────────────────────────────────────────────────
	function toggleSort(column: SortColumn) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	function replaceSelectedWith(numbers: number[]) {
		selectedNumbers.clear();
		for (const n of numbers) {
			selectedNumbers.add(n);
		}
	}

	function toggleGlobalCheckbox() {
		if (globalCheckboxState.checked || globalCheckboxState.indeterminate) {
			selectedNumbers.clear();
		} else {
			replaceSelectedWith(allFiltered.map((issue) => issue.number));
		}
	}

	function toggleRowSelection(issueNumber: number) {
		if (selectedNumbers.has(issueNumber)) {
			selectedNumbers.delete(issueNumber);
		} else {
			selectedNumbers.add(issueNumber);
		}
	}

	function selectAllUnlinked() {
		for (const issue of filteredUnlinked) {
			selectedNumbers.add(issue.number);
		}
	}

	function handleAddSelected() {
		if (onWizardOpen === undefined) {
			return;
		}
		for (const issue of filteredUnlinked) {
			if (selectedNumbers.has(issue.number)) {
				onWizardOpen(issue);
			}
		}
		selectedNumbers.clear();
	}

	function handleAddSelectedWithWorktree() {
		if (onQuickAddWithWorktree === undefined) {
			return;
		}
		for (const issue of filteredUnlinked) {
			if (selectedNumbers.has(issue.number)) {
				onQuickAddWithWorktree(issue);
			}
		}
		selectedNumbers.clear();
	}

	function handleRowClick(event: MouseEvent, issueNumber: number) {
		const target = event.target as HTMLElement;
		if (
			target.closest('a') !== null ||
			target.closest('button') !== null ||
			target.closest('[data-slot="checkbox"]') !== null ||
			target.closest('[data-no-select]') !== null
		) {
			return;
		}
		toggleRowSelection(issueNumber);
	}

	// fallow-ignore-next-line complexity
	function handleKeydown(event: KeyboardEvent) {
		if (panelElement === null || !panelElement.contains(document.activeElement)) {
			return;
		}
		if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
			event.preventDefault();
			replaceSelectedWith(allFiltered.map((issue) => issue.number));
		}
		if (event.key === 'Enter' && selectedUnlinkedCount > 0) {
			event.preventDefault();
			handleAddSelected();
		}
	}

	function handleLinkClick(event: MouseEvent, url: string) {
		event.preventDefault();
		if (!disabled) {
			void openUrl(url);
		}
	}

	function sortIcon(column: SortColumn): typeof ArrowUpDown {
		if (sortColumn !== column) {
			return ArrowUpDown;
		}
		return sortDirection === 'asc' ? ArrowUp : ArrowDown;
	}
</script>

{#snippet sortIndicator(column: SortColumn)}
	{@const Icon = sortIcon(column)}
	<Icon size={10} />
{/snippet}

<svelte:window onkeydown={handleKeydown} />

<div bind:this={panelElement} class="flex h-full flex-col gap-0 px-3 pt-2 pb-3" tabindex="-1">
	<!-- Toolbar: Search + Refresh -->
	<div class="flex items-center gap-2 pb-2">
		<SearchField
			bind:value={searchQuery}
			placeholder="Search issues..."
			class="h-7 flex-1 text-xs"
		/>
		<div class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
			<span class="whitespace-nowrap">{syncAgoText}</span>
			<SimpleTooltip text="Refresh assigned issues">
				<Button
					intent="ghost"
					size="icon-sm"
					aria-label="Refresh assigned issues"
					disabled={loading}
					onclick={() => onRefresh?.()}
				>
					<RefreshCw size={13} class={loading ? 'animate-spin' : ''} />
				</Button>
			</SimpleTooltip>
		</div>
	</div>

	<!-- Selection Bar -->
	<div
		class="flex min-h-8.5 items-center gap-2 rounded-md border px-2 py-1 text-xs"
		style="background: {selectedCount > 0
			? 'color-mix(in oklch, var(--primary) 10%, var(--surface))'
			: 'transparent'}; border-color: {selectedCount > 0
			? 'color-mix(in oklch, var(--primary) 30%, var(--border))'
			: 'var(--border)'};"
	>
		<Checkbox
			checked={globalCheckboxState.checked}
			indeterminate={globalCheckboxState.indeterminate}
			onCheckedChange={toggleGlobalCheckbox}
		/>
		<span class="text-muted-foreground">
			{#if selectedCount > 0}
				{selectedCount} selected
			{:else}
				No issues selected
			{/if}
		</span>
		{#if selectedCount > 0 && selectedCount < filteredUnlinked.length}
			<button
				class="text-primary underline-offset-2 hover:underline"
				onclick={selectAllUnlinked}
			>
				Select all {filteredUnlinked.length} unlinked
			</button>
		{/if}
		<div class="flex-1"></div>
		{#if selectedUnlinkedCount > 0}
			<Button intent="primary" size="sm" class="h-6 text-xs" onclick={handleAddSelected}>
				<Plus size={12} />
				Add Selected
			</Button>
			<Button
				intent="secondary"
				size="sm"
				class="h-6 text-xs"
				onclick={handleAddSelectedWithWorktree}
			>
				<GitBranch size={12} />
				Add + Worktree
			</Button>
		{/if}
	</div>

	<!-- Table -->
	<div class="mt-1 flex-1 overflow-auto">
		<!-- Table Header -->
		<div
			class="assigned-table-grid sticky top-0 z-10 border-b border-border bg-surface text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
		>
			<div class="flex items-center justify-center py-1"></div>
			<button
				class="flex items-center gap-0.5 py-1 hover:text-foreground"
				onclick={() => toggleSort('prd')}
			>
				PRD
				{@render sortIndicator('prd')}
			</button>
			<button
				class="flex items-center gap-0.5 py-1 hover:text-foreground"
				onclick={() => toggleSort('number')}
			>
				Issue
				{@render sortIndicator('number')}
			</button>
			<button
				class="flex items-center gap-0.5 py-1 hover:text-foreground"
				onclick={() => toggleSort('title')}
			>
				Title
				{@render sortIndicator('title')}
			</button>
			<button
				class="assigned-labels-col flex items-center gap-0.5 py-1 hover:text-foreground"
				onclick={() => toggleSort('labels')}
			>
				Labels
				{@render sortIndicator('labels')}
			</button>
			<div class="py-1 text-right">Actions</div>
		</div>

		<!-- Unlinked Section -->
		<Collapsible.Root
			class="mt-1"
			open={!unlinkedCollapsed.current}
			onOpenChange={(value: boolean) => {
				unlinkedCollapsed.current = !value;
			}}
		>
			<Collapsible.Trigger
				class="flex w-full items-center gap-1 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground"
			>
				{#if unlinkedCollapsed.current}
					<ChevronRight size={12} />
				{:else}
					<ChevronDown size={12} />
				{/if}
				Unlinked ({filteredUnlinked.length})
			</Collapsible.Trigger>

			<Collapsible.Content>
				{#each filteredUnlinked as issue (issue.number)}
					<div
						class={cn(
							'assigned-table-grid cursor-pointer items-center border-b border-border/40 text-xs transition-colors hover:bg-accent/25',
							selectedNumbers.has(issue.number) && 'bg-primary/5',
						)}
						style="height: 38px;"
						onclick={(event) => handleRowClick(event, issue.number)}
						role="row"
						tabindex="0"
						onkeydown={(event) => {
							if (event.key === ' ') {
								event.preventDefault();
								toggleRowSelection(issue.number);
							}
						}}
					>
						<div class="flex items-center justify-center">
							<Checkbox
								checked={selectedNumbers.has(issue.number)}
								onCheckedChange={() => toggleRowSelection(issue.number)}
							/>
						</div>
						<!-- eslint-disable svelte/no-navigation-without-resolve -- external GitHub links -->
						<div class="assigned-prd-col font-mono text-muted-foreground">
							{#if issue.parent_issue_number !== null}
								<a
									href={issue.url.replace(
										/\/issues\/\d+$/,
										`/issues/${issue.parent_issue_number}`,
									)}
									data-no-select
									class="hover:text-primary hover:underline"
									onclick={(event) =>
										handleLinkClick(
											event,
											issue.url.replace(
												/\/issues\/\d+$/,
												`/issues/${issue.parent_issue_number}`,
											),
										)}
								>
									#{issue.parent_issue_number}
								</a>
							{:else}
								<span class="text-muted-foreground/40">—</span>
							{/if}
						</div>
						<div class="font-mono">
							<a
								href={issue.url}
								data-no-select
								class="text-foreground hover:text-primary hover:underline"
								onclick={(event) => handleLinkClick(event, issue.url)}
							>
								#{issue.number}
							</a>
						</div>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
						<div class="min-w-0 truncate" data-no-select>
							{issue.title}
						</div>
						<div class="assigned-labels-col flex items-center gap-1 overflow-hidden">
							{#each sortLabelsByPriority(issue.labels) as label (label.name)}
								<Badge
									size="compact"
									class="shrink-0 rounded-full"
									style="background-color: #{label.color}20; color: #{label.color}; border-color: #{label.color}40;"
								>
									{label.name}
								</Badge>
							{/each}
						</div>
						<div class="flex items-center justify-end gap-0.5">
							{#if onWizardOpen}
								<SimpleTooltip text="Add to dashboard">
									<Button
										intent="ghost"
										size="icon-sm"
										aria-label="Add to dashboard"
										onclick={(event) => {
											event.stopPropagation();
											onWizardOpen(issue);
										}}
									>
										<Plus size={12} />
									</Button>
								</SimpleTooltip>
							{/if}
							{#if onQuickAddWithWorktree}
								<SimpleTooltip text="Add with worktree">
									<Button
										intent="ghost"
										size="icon-sm"
										aria-label="Add with worktree"
										onclick={(event) => {
											event.stopPropagation();
											onQuickAddWithWorktree(issue);
										}}
									>
										<GitBranch size={12} />
									</Button>
								</SimpleTooltip>
							{/if}
						</div>
					</div>
				{/each}
			</Collapsible.Content>
		</Collapsible.Root>

		<!-- Linked Section -->
		{#if filteredLinked.length > 0}
			<Collapsible.Root
				class="mt-2"
				open={!linkedCollapsed.current}
				onOpenChange={(value: boolean) => {
					linkedCollapsed.current = !value;
				}}
			>
				<Collapsible.Trigger
					class="flex w-full items-center gap-1 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground"
				>
					{#if linkedCollapsed.current}
						<ChevronRight size={12} />
					{:else}
						<ChevronDown size={12} />
					{/if}
					Linked ({filteredLinked.length})
				</Collapsible.Trigger>

				<Collapsible.Content>
					{#each filteredLinked as issue (issue.number)}
						<div
							class="assigned-table-grid items-center border-b border-border/40 text-xs opacity-45"
							style="height: 38px;"
							role="row"
						>
							<div class="flex items-center justify-center">
								<Checkbox
									checked={selectedNumbers.has(issue.number)}
									onCheckedChange={() => toggleRowSelection(issue.number)}
								/>
							</div>
							<!-- eslint-disable svelte/no-navigation-without-resolve -- external GitHub links -->
							<div class="assigned-prd-col font-mono text-muted-foreground">
								{#if issue.parent_issue_number !== null}
									<a
										href={issue.url.replace(
											/\/issues\/\d+$/,
											`/issues/${issue.parent_issue_number}`,
										)}
										class="hover:text-primary hover:underline"
										onclick={(event) =>
											handleLinkClick(
												event,
												issue.url.replace(
													/\/issues\/\d+$/,
													`/issues/${issue.parent_issue_number}`,
												),
											)}
									>
										#{issue.parent_issue_number}
									</a>
								{:else}
									<span class="text-muted-foreground/40">—</span>
								{/if}
							</div>
							<div class="font-mono">
								<a
									href={issue.url}
									class="text-foreground hover:text-primary hover:underline"
									onclick={(event) => handleLinkClick(event, issue.url)}
								>
									#{issue.number}
								</a>
							</div>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
							<div class="min-w-0 truncate">
								{issue.title}
							</div>
							<div
								class="assigned-labels-col flex items-center gap-1 overflow-hidden"
							>
								{#each sortLabelsByPriority(issue.labels) as label (label.name)}
									<Badge
										size="compact"
										class="shrink-0 rounded-full"
										style="background-color: #{label.color}20; color: #{label.color}; border-color: #{label.color}40;"
									>
										{label.name}
									</Badge>
								{/each}
							</div>
							<div class="flex items-center justify-end">
								<SimpleTooltip text="Already linked">
									<span class="text-muted-foreground">
										<Check size={14} />
									</span>
								</SimpleTooltip>
							</div>
						</div>
					{/each}
				</Collapsible.Content>
			</Collapsible.Root>
		{/if}

		<!-- Load More -->
		{#if hasMore && onLoadMore}
			<div class="mt-2 text-center">
				<Button
					intent="ghost"
					size="sm"
					onclick={onLoadMore}
					class="text-muted-foreground/60"
				>
					Load more
				</Button>
			</div>
		{/if}

		<!-- Empty State -->
		{#if issues.length === 0 && !loading}
			<div
				class="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground"
			>
				<p class="text-sm">No assigned issues found</p>
				<p class="text-xs text-muted-foreground/60">
					Issues assigned to you on GitHub will appear here
				</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.assigned-table-grid {
		display: grid;
		grid-template-columns: 28px 56px 54px 1fr 200px 72px;
		gap: 0;
		padding-inline: 4px;
		align-items: center;
	}

	@container (max-width: 600px) {
		.assigned-labels-col {
			display: none;
		}

		.assigned-table-grid {
			grid-template-columns: 28px 56px 54px 1fr 72px;
		}
	}

	@container (max-width: 400px) {
		.assigned-prd-col {
			display: none;
		}

		.assigned-table-grid {
			grid-template-columns: 28px 54px 1fr 72px;
		}
	}
</style>
