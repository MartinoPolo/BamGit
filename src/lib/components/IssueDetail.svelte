<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Issue, IssueCardCallbacks } from '$lib/modules/issues';
	import type { GitStatusCache } from '$lib/types/generated';
	import { PRIORITY_OPTIONS, PRIORITY_BADGE_CLASSES } from './issue_card_utils.js';
	import ColorPicker from './color-picker/ColorPicker.svelte';
	import PullRequestBadge from './PullRequestBadge.svelte';
	import GitHubIssueBadge from './GitHubIssueBadge.svelte';
	import WorktreeStateIcon from './WorktreeStateIcon.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import PenLine from '@lucide/svelte/icons/pen-line';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Archive from '@lucide/svelte/icons/archive';
	import ArchiveRestore from '@lucide/svelte/icons/archive-restore';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import GitBranchPlus from '@lucide/svelte/icons/git-branch-plus';

	interface Props extends IssueCardCallbacks {
		issue: Issue;
		cache?: GitStatusCache | null;
		ghAvailable?: boolean;
		paletteColors?: string[];
		usedColors?: string[];
		isDarkMode?: boolean;
	}

	let {
		issue,
		cache = null,
		ghAvailable = false,
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
		onChangeColor,
	}: Props = $props();

	const color = $derived(issue.color ?? '#525252');
	const isArchived = $derived(issue.status === 'archived');
	const isStandalone = $derived(issue.github_issue_url === null);

	const canSetupWorktree = $derived(
		issue.branch_name !== null &&
			(issue.worktree_state === 'none' || issue.worktree_state === 'failed'),
	);
	const canRemoveWorktree = $derived(issue.worktree_state === 'active');

	const priorityLabel = $derived(
		PRIORITY_OPTIONS.find((o) => o.value === issue.priority)?.label() ??
			m.issue_detail_no_priority(),
	);

	const priorityBadgeClass = $derived(
		issue.priority !== null
			? (PRIORITY_BADGE_CLASSES[issue.priority] ?? 'bg-muted text-muted-foreground')
			: 'bg-muted text-muted-foreground',
	);

	function handleColorSelect(newColor: string) {
		if (onChangeColor) {
			onChangeColor(issue.id, newColor);
		}
	}
</script>

<div class="flex h-full flex-col gap-4 p-5">
	<!-- Header: color swatch + name -->
	<div class="flex items-start gap-3">
		<div class="mt-1 size-4 shrink-0 rounded-full" style="background-color: {color};"></div>
		<div class="flex min-w-0 flex-1 flex-col gap-1">
			<h3 class="text-sm font-semibold text-foreground">{issue.name}</h3>
			<div class="flex flex-wrap items-center gap-2">
				<span
					class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium {priorityBadgeClass}"
				>
					{priorityLabel}
				</span>
				{#if issue.labels.length > 0}
					{#each issue.labels as label (label.name)}
						<span
							class="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none"
							style="background-color: {label.color.startsWith('#')
								? label.color
								: `#${label.color}`}20; color: {label.color.startsWith('#')
								? label.color
								: `#${label.color}`}; border: 1px solid {label.color.startsWith('#')
								? label.color
								: `#${label.color}`}40;"
						>
							{label.name}
						</span>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	<!-- Metadata rows -->
	<div class="flex flex-col gap-2 text-xs text-muted-foreground">
		{#if issue.github_issue_number !== null && cache}
			<div class="flex items-center gap-4">
				<GitHubIssueBadge
					issueNumber={issue.github_issue_number}
					state={cache.github_issue_state}
					url={issue.github_issue_url}
					disabled={!ghAvailable}
				/>
				{#if cache.pr_state}
					<PullRequestBadge
						state={cache.pr_state}
						prNumber={cache.pr_number}
						url={cache.pr_url}
						disabled={!ghAvailable}
					/>
				{/if}
			</div>
		{/if}

		{#if issue.branch_name}
			<div class="flex items-center gap-2">
				<GitBranch size={12} class="shrink-0" />
				<span class="font-mono text-[11px]">{issue.branch_name}</span>
			</div>
		{/if}

		{#if issue.worktree_state !== 'none'}
			<div class="flex items-center gap-2">
				<WorktreeStateIcon worktreeState={issue.worktree_state} />
				<span>{m.issue_detail_worktree()}: {issue.worktree_state}</span>
			</div>
		{/if}
	</div>

	<!-- Priority quick-change -->
	{#if !isArchived}
		<div class="flex flex-wrap gap-1 border-t border-border pt-3">
			{#each PRIORITY_OPTIONS as option (option.value)}
				<button
					onclick={() => onChangePriority(issue.id, option.value)}
					class="rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors {issue.priority ===
					option.value
						? 'ring-1 ring-foreground/30'
						: 'opacity-60 hover:opacity-100'} {option.value !== null
						? (PRIORITY_BADGE_CLASSES[option.value] ?? 'bg-muted text-muted-foreground')
						: 'bg-muted text-muted-foreground'}"
				>
					{option.label()}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Action buttons -->
	<div class="flex flex-wrap gap-1.5 border-t border-border pt-3">
		<Button variant="ghost" size="sm" onclick={() => onEdit(issue)} title={m.issue_card_edit()}>
			<Pencil size={14} />
		</Button>

		{#if isStandalone && onRename}
			<Button
				variant="ghost"
				size="sm"
				onclick={() => onRename(issue)}
				title={m.issue_card_rename()}
			>
				<PenLine size={14} />
			</Button>
		{/if}

		{#if !isArchived}
			<ColorPicker
				selectedColor={issue.color ?? ''}
				colors={paletteColors}
				{usedColors}
				{isDarkMode}
				displayText="A"
				side="top"
				onSelect={handleColorSelect}
			/>
		{/if}

		{#if canSetupWorktree && onSetupWorktree}
			<Button
				variant="ghost"
				size="sm"
				onclick={() => onSetupWorktree(issue)}
				title={issue.worktree_state === 'failed'
					? m.issue_card_retry_worktree()
					: m.issue_card_add_worktree()}
			>
				<GitBranchPlus size={14} />
			</Button>
		{/if}

		{#if canRemoveWorktree && onRemoveWorktree}
			<Button
				variant="ghost"
				size="sm"
				onclick={() => onRemoveWorktree(issue)}
				title={m.issue_card_remove_worktree()}
				class="text-orange-400"
			>
				<GitBranch size={14} />
			</Button>
		{/if}

		<div class="flex-1"></div>

		{#if isArchived}
			<Button
				variant="ghost"
				size="sm"
				onclick={() => onUnarchive(issue.id)}
				title={m.issue_card_unarchive()}
			>
				<ArchiveRestore size={14} />
			</Button>
		{:else}
			<Button
				variant="ghost"
				size="sm"
				onclick={() => onArchive(issue)}
				title={m.issue_card_archive()}
			>
				<Archive size={14} />
			</Button>
		{/if}

		<Button
			variant="ghost"
			size="sm"
			onclick={() => onDelete(issue)}
			title={m.issue_card_delete()}
			class="text-destructive"
		>
			<Trash2 size={14} />
		</Button>
	</div>
</div>
