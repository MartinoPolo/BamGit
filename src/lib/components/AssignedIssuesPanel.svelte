<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { AssignedIssue } from '$lib/types/generated';
	import type { Issue } from '$lib/modules/issues';
	import { categorizeAssignedIssues } from './assigned_issues_utils.js';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Plus from '@lucide/svelte/icons/plus';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { SimpleTooltip } from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		issues: AssignedIssue[];
		dashboardIssues: readonly Issue[];
		deletedIssueNumbers: readonly number[];
		hasMore: boolean;
		disabled?: boolean;
		onWizardOpen?: (issue: AssignedIssue) => void;
		onQuickAddWithWorktree?: (issue: AssignedIssue) => void;
		onLoadMore?: () => void;
	}

	function isBoolean(value: unknown): value is boolean {
		return typeof value === 'boolean';
	}

	let {
		issues,
		dashboardIssues,
		deletedIssueNumbers,
		hasMore,
		disabled = false,
		onWizardOpen,
		onQuickAddWithWorktree,
		onLoadMore,
	}: Props = $props();

	const collapsed = new Persisted<boolean>({
		key: 'grovekeeper_assigned_panel_collapsed',
		serde: jsonSerde(isBoolean),
		defaultValue: false,
	});

	const categorized = $derived(
		categorizeAssignedIssues(issues, dashboardIssues, deletedIssueNumbers),
	);

	async function handleClick(url: string) {
		if (!disabled) {
			try {
				await openUrl(url);
			} catch {
				// Fails silently in browser mock mode
			}
		}
	}
</script>

{#snippet issueRow(issue: AssignedIssue, variant: 'unlinked' | 'linked' | 'deleted')}
	<div class="group flex items-center gap-0.5">
		<Button
			variant="ghost"
			size="sm"
			onclick={() => handleClick(issue.url)}
			class={cn(
				'flex min-w-0 flex-1 justify-start rounded px-2 py-1 text-left text-xs',
				disabled && 'cursor-not-allowed opacity-50',
				variant !== 'deleted' ? 'text-muted-foreground' : 'text-status-warning',
			)}
			{disabled}
		>
			{#if issue.state === 'OPEN'}
				<CircleDot size={12} class="shrink-0 text-gh-open" />
			{:else}
				<CircleCheck size={12} class="shrink-0 text-gh-closed" />
			{/if}
			<span class="min-w-0 truncate">#{issue.number} {issue.title}</span>
			{#if issue.labels.length > 0}
				<span class="flex shrink-0 items-center gap-1">
					{#each issue.labels as label (label.name)}
						<Badge
							size="compact"
							class="rounded-full"
							style="background-color: {label.color}20; color: {label.color}; border-color: {label.color}40;"
						>
							{label.name}
						</Badge>
					{/each}
				</span>
			{/if}
		</Button>
		{#if variant === 'unlinked' || variant === 'deleted'}
			{#if onWizardOpen}
				<SimpleTooltip text={m.assigned_wizard_open()}>
					<Button
						variant="ghost"
						size="icon-sm"
						onclick={() => onWizardOpen(issue)}
						class="shrink-0 opacity-0 group-hover:opacity-100"
					>
						<Plus size={12} />
					</Button>
				</SimpleTooltip>
			{/if}
			{#if onQuickAddWithWorktree}
				<SimpleTooltip text={m.assigned_quick_worktree()}>
					<Button
						variant="ghost"
						size="icon-sm"
						onclick={() => onQuickAddWithWorktree(issue)}
						class="shrink-0 opacity-0 group-hover:opacity-100"
					>
						<GitBranch size={12} />
					</Button>
				</SimpleTooltip>
			{/if}
		{/if}
	</div>
{/snippet}

{#if issues.length > 0}
	<div class="flex flex-col gap-1">
		<Button
			variant="ghost"
			size="sm"
			onclick={() => (collapsed.current = !collapsed.current)}
			class="flex items-center gap-1 px-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 hover:bg-transparent hover:text-muted-foreground"
		>
			{#if collapsed.current}
				<ChevronRight size={12} />
			{:else}
				<ChevronDown size={12} />
			{/if}
			{m.assigned_title({ count: issues.length })}
		</Button>

		{#if !collapsed.current}
			<div class="flex flex-col gap-0.5">
				{#each categorized.unlinked as issue (issue.number)}
					{@render issueRow(issue, 'unlinked')}
				{/each}

				{#if categorized.deleted.length > 0}
					{#each categorized.deleted as issue (issue.number)}
						{@render issueRow(issue, 'deleted')}
					{/each}
				{/if}
			</div>

			{#if categorized.linked.length > 0}
				<div class="border-t border-border pt-1">
					<p
						class="px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/40"
					>
						{m.assigned_linked_heading()}
					</p>
					<div class="flex flex-col gap-0.5">
						{#each categorized.linked as issue (issue.number)}
							{@render issueRow(issue, 'linked')}
						{/each}
					</div>
				</div>
			{/if}

			{#if hasMore && onLoadMore}
				<Button
					variant="ghost"
					size="sm"
					onclick={onLoadMore}
					class="text-muted-foreground/60"
				>
					{m.assigned_load_more()}
				</Button>
			{/if}
		{/if}
	</div>
{/if}
