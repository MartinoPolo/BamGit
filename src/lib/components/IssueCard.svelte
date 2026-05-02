<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Issue } from '$lib/modules/issues';
	import type { Action, GitStatusCache } from '$lib/types/generated';
	import type { IssueCardCallbacks } from '$lib/modules/issues';
	import PullRequestBadge from './PullRequestBadge.svelte';
	import GitHubIssueBadge from './GitHubIssueBadge.svelte';
	import SyncStatusIndicator from './SyncStatusIndicator.svelte';
	import GitBadgeGroup from './GitBadgeGroup.svelte';
	import WorktreeProgressIndicator from './WorktreeProgressIndicator.svelte';
	import ActionButtonGroup from './ActionButtonGroup.svelte';
	import IssueCardTooltip from './IssueCardTooltip.svelte';
	import WorktreeStateIcon from './WorktreeStateIcon.svelte';
	import ColorPicker from './color-picker/ColorPicker.svelte';
	import { clickOutside } from '$lib/actions/click_outside';
	import {
		getPriorityBorderClass,
		PRIORITY_OPTIONS,
		PRIORITY_BADGE_CLASSES,
		issueExpandedStates,
	} from './issue_card_utils.js';

	interface Props extends IssueCardCallbacks {
		issue: Issue;
		actions?: Action[];
		cache?: GitStatusCache | null;
		ghAvailable?: boolean;
		notificationDotColor?: string | null;
		indented?: boolean;
		isLastChild?: boolean;
		childCount?: number;
		forceExpanded?: boolean;
		progressLines?: readonly string[];
		prioritiesEnabled?: boolean;
		paletteColors?: string[];
		usedColors?: string[];
		isDarkMode?: boolean;
	}

	let {
		issue,
		actions = [],
		cache = null,
		ghAvailable = false,
		notificationDotColor = null,
		indented = false,
		isLastChild = false,
		childCount = 0,
		forceExpanded,
		progressLines = [],
		prioritiesEnabled = true,
		paletteColors = [],
		usedColors = [],
		isDarkMode = false,
		onArchive,
		onUnarchive,
		onEdit,
		onDelete,
		onChangePriority,
		onRename,
		onSetupWorktree,
		onRemoveWorktree,
		onExecuteAction,
		onChangeColor,
	}: Props = $props();

	const persistedExpanded = $derived(issueExpandedStates.current[issue.id] ?? false);
	const expanded = $derived(
		forceExpanded ?? (issue.worktree_state === 'pending' || persistedExpanded),
	);

	function toggleExpanded() {
		const current = issueExpandedStates.current;
		issueExpandedStates.current = {
			...current,
			[issue.id]: !persistedExpanded,
		};
	}

	let showOverflow = $state(false);
	let showPrioritySubmenu = $state(false);

	const color = $derived(issue.color ?? '#525252');
	const isArchived = $derived(issue.status === 'archived');
	const isStandalone = $derived(issue.github_issue_url === null);

	let badgeContainerWidth = $state(0);
	const compactBadges = $derived(badgeContainerWidth < 300);

	const worktreeBadge = $derived.by(() => {
		switch (issue.worktree_state) {
			case 'pending':
				return {
					label: m.issue_card_setting_up(),
					class: 'bg-yellow-900/40 text-yellow-400',
				};
			case 'active':
				return { label: m.issue_card_worktree(), class: 'bg-green-900/40 text-green-400' };
			case 'failed':
				return { label: m.issue_card_wt_failed(), class: 'bg-red-900/40 text-red-400' };
			default:
				return null;
		}
	});

	const priorityBorderClass = $derived(getPriorityBorderClass(issue.priority, prioritiesEnabled));

	const priorityBadgeClass = $derived(
		issue.priority !== null ? (PRIORITY_BADGE_CLASSES[issue.priority] ?? null) : null,
	);

	function closeOverflow() {
		showOverflow = false;
		showPrioritySubmenu = false;
	}

	function handleColorSelect(newColor: string) {
		if (onChangeColor && newColor) {
			onChangeColor(issue.id, newColor);
		}
	}
</script>

<IssueCardTooltip {issue}>
	<div
		class="group grid rounded border border-l-[3px] border-border transition-colors {priorityBorderClass} {isArchived
			? ''
			: 'hover:border-input'}"
		style="grid-template-columns: 92px 1fr; {isArchived
			? 'filter: grayscale(0.8) opacity(0.7)'
			: ''}"
		class:ml-6={indented}
	>
		{#if indented}
			<div class="relative -ml-6 w-6 shrink-0" style="grid-column: 1 / -1; grid-row: 1;">
				<div
					class="absolute top-0 left-3 h-1/2 w-px bg-border"
					class:h-full={!isLastChild}
				></div>
				<div class="absolute top-1/2 left-3 h-px w-3 bg-border"></div>
			</div>
		{/if}

		<!-- Left: Colored thumbnail -->
		<div
			class="relative flex items-center justify-center rounded-l"
			style="background-color: {color}"
		>
			{#if notificationDotColor}
				<span
					class="h-3 w-3 animate-pulse rounded-full {notificationDotColor}"
					title={m.issue_card_session_needs_attention()}
				></span>
			{:else}
				<div
					class="h-2.5 w-2.5 rounded-full bg-foreground/30"
					title={m.issue_card_session_idle()}
				></div>
			{/if}
		</div>

		<!-- Right: Content area -->
		<div class="flex min-w-0 flex-col">
			<!-- Title row -->
			<div class="flex items-center gap-2 px-3 py-2">
				<button
					onclick={toggleExpanded}
					class="text-xs text-muted-foreground transition-transform {expanded
						? 'rotate-90'
						: ''} hover:text-foreground"
					title={expanded ? m.issue_card_collapse() : m.issue_card_expand()}
				>
					▸
				</button>

				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-1.5">
						<span class="truncate text-sm font-medium">{issue.name}</span>
						{#if priorityBadgeClass}
							<span
								class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium leading-3 {priorityBadgeClass}"
							>
								{issue.priority}
							</span>
						{/if}
					</div>
				</div>

				{#if childCount > 0}
					<span class="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
						{childCount > 1
							? m.issue_card_children_count({ count: childCount })
							: m.issue_card_child_count({ count: childCount })}
					</span>
				{/if}

				{#if actions.length > 0 && onExecuteAction && !isArchived}
					<div class="opacity-0 transition-opacity group-hover:opacity-100">
						<ActionButtonGroup
							{actions}
							onExecute={(actionId) => onExecuteAction(actionId, issue.id)}
						/>
					</div>
				{/if}

				<!-- Overflow menu -->
				<div class="relative">
					<button
						onclick={() => (showOverflow = !showOverflow)}
						class="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
					>
						⋯
					</button>

					{#if showOverflow}
						<div
							class="absolute right-0 z-[var(--z-dropdown)] mt-1 min-w-35 rounded border border-border bg-popover py-1 shadow-lg"
							use:clickOutside={closeOverflow}
						>
							<button
								onclick={() => {
									onEdit(issue);
									closeOverflow();
								}}
								class="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
							>
								{m.issue_card_edit()}
							</button>
							{#if isStandalone && onRename}
								<button
									onclick={() => {
										onRename(issue);
										closeOverflow();
									}}
									class="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
								>
									{m.issue_card_rename()}
								</button>
							{/if}

							<!-- Priority submenu -->
							{#if !isArchived}
								<div class="relative">
									<button
										onclick={() => (showPrioritySubmenu = !showPrioritySubmenu)}
										class="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
									>
										{m.issue_card_priority()}
										<span class="text-xs text-muted-foreground">▸</span>
									</button>
									{#if showPrioritySubmenu}
										<div
											class="absolute top-0 left-full z-[var(--z-dropdown)] ml-1 min-w-28 rounded border border-border bg-popover py-1 shadow-lg"
										>
											{#each PRIORITY_OPTIONS as option (option.value)}
												<button
													onclick={() => {
														onChangePriority(issue.id, option.value);
														closeOverflow();
													}}
													class="w-full px-3 py-1.5 text-left text-sm hover:bg-accent {issue.priority ===
													option.value
														? 'font-medium text-foreground'
														: 'text-popover-foreground'}"
												>
													{option.label()}
												</button>
											{/each}
										</div>
									{/if}
								</div>
							{/if}

							<!-- Change Color -->
							{#if !isArchived && onChangeColor}
								<div class="flex items-center gap-2 px-3 py-1.5">
									<span class="text-sm text-popover-foreground"
										>{m.issue_card_change_color()}</span
									>
									<ColorPicker
										selectedColor={issue.color ?? ''}
										colors={paletteColors}
										{usedColors}
										{isDarkMode}
										displayText="A"
										side="left"
										onSelect={handleColorSelect}
									/>
								</div>
							{/if}

							{#if onSetupWorktree && issue.branch_name !== null && (issue.worktree_state === 'none' || issue.worktree_state === 'failed')}
								<button
									onclick={() => {
										onSetupWorktree(issue);
										closeOverflow();
									}}
									class="w-full px-3 py-1.5 text-left text-sm text-green-400 hover:bg-accent"
								>
									{issue.worktree_state === 'failed'
										? m.issue_card_retry_worktree()
										: m.issue_card_add_worktree()}
								</button>
							{/if}
							{#if onRemoveWorktree && issue.worktree_state === 'active'}
								<button
									onclick={() => {
										onRemoveWorktree(issue);
										closeOverflow();
									}}
									class="w-full px-3 py-1.5 text-left text-sm text-orange-400 hover:bg-accent"
								>
									{m.issue_card_remove_worktree()}
								</button>
							{/if}
							{#if isArchived}
								<button
									onclick={() => {
										onUnarchive(issue.id);
										closeOverflow();
									}}
									class="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
								>
									{m.issue_card_unarchive()}
								</button>
							{:else}
								<button
									onclick={() => {
										onArchive(issue);
										closeOverflow();
									}}
									class="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
								>
									{m.issue_card_archive()}
								</button>
							{/if}
							<button
								onclick={() => {
									onDelete(issue);
									closeOverflow();
								}}
								class="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-accent"
							>
								{m.issue_card_delete()}
							</button>
						</div>
					{/if}
				</div>
			</div>

			<!-- Info row: issue# + branch + worktree indicator -->
			<div class="flex items-center gap-2 px-3 pb-1 text-xs text-muted-foreground">
				{#if issue.github_issue_number}
					<span>#{issue.github_issue_number}</span>
				{/if}
				{#if issue.branch_name}
					<span class="truncate font-mono text-[10px]">{issue.branch_name}</span>
				{/if}
				<WorktreeStateIcon worktreeState={issue.worktree_state} />
			</div>

			<!-- Badge row -->
			<div
				class="flex flex-wrap items-center gap-1 px-3 pb-2"
				bind:clientWidth={badgeContainerWidth}
			>
				{#if cache?.github_issue_state}
					<GitHubIssueBadge
						state={cache.github_issue_state}
						url={issue.github_issue_url}
						issueNumber={issue.github_issue_number}
						disabled={!ghAvailable}
					/>
				{/if}
				{#if cache?.pr_state}
					<PullRequestBadge
						state={cache.pr_state}
						url={cache.pr_url}
						prNumber={cache.pr_number}
						disabled={!ghAvailable}
					/>
				{/if}
				{#if issue.branch_name !== null && !compactBadges}
					<GitBadgeGroup branchName={issue.branch_name} gitStatus={cache ?? undefined} />
				{/if}
				{#if worktreeBadge}
					<span
						class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs {worktreeBadge.class}"
					>
						{#if issue.worktree_state === 'pending'}
							<span
								class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
							></span>
						{/if}
						{worktreeBadge.label}
					</span>
				{/if}
				{#if issue.labels.length > 0}
					{#each issue.labels as label (label.name)}
						<span
							class="inline-block rounded-full px-1.5 py-px text-[10px] font-medium leading-3"
							style="background-color: {label.color}33; color: {label.color}; border: 1px solid {label.color}44;"
							title={label.name}
						>
							{label.name}
						</span>
					{/each}
				{/if}
			</div>

			{#if expanded}
				<div class="border-t border-border px-3 py-3 text-xs text-muted-foreground">
					<div class="grid grid-cols-2 gap-2">
						<div>
							<span class="text-muted-foreground/60">{m.issue_card_status()}</span>
							{issue.status}
						</div>
						<div>
							<span class="text-muted-foreground/60"
								>{m.issue_card_worktree_label()}</span
							>
							{issue.worktree_state}
						</div>
						{#if issue.priority}
							<div>
								<span class="text-muted-foreground/60"
									>{m.issue_card_priority_label()}</span
								>
								{issue.priority}
							</div>
						{/if}
						{#if issue.created_at}
							<div>
								<span class="text-muted-foreground/60"
									>{m.issue_card_created()}</span
								>
								{new Date(issue.created_at).toLocaleDateString()}
							</div>
						{/if}
						{#if cache}
							<div>
								<span class="text-muted-foreground/60">{m.issue_card_synced()}</span
								>
								<SyncStatusIndicator fetchedAt={cache.fetched_at} />
							</div>
						{/if}
					</div>
					{#if issue.worktree_state === 'pending' && progressLines.length > 0}
						<WorktreeProgressIndicator lines={progressLines} />
					{/if}
				</div>
			{/if}
		</div>
	</div>
</IssueCardTooltip>
