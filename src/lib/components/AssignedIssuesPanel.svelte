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
		<button
			onclick={() => handleClick(issue.url)}
			class="flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors hover:bg-accent hover:text-foreground"
			class:cursor-not-allowed={disabled}
			class:opacity-50={disabled}
			class:text-muted-foreground={variant !== 'deleted'}
			class:text-orange-400={variant === 'deleted'}
			{disabled}
		>
			{#if issue.state === 'OPEN'}
				<CircleDot size={12} class="shrink-0 text-green-400" />
			{:else}
				<CircleCheck size={12} class="shrink-0 text-purple-400" />
			{/if}
			<span class="min-w-0 truncate">#{issue.number} {issue.title}</span>
			{#if issue.labels.length > 0}
				<span class="flex shrink-0 items-center gap-1">
					{#each issue.labels as label (label.name)}
						<span
							class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none"
							style="background-color: {label.color}20; color: {label.color}; border: 1px solid {label.color}40;"
						>
							{label.name}
						</span>
					{/each}
				</span>
			{/if}
		</button>
		{#if variant === 'unlinked' || variant === 'deleted'}
			{#if onWizardOpen}
				<button
					type="button"
					onclick={() => onWizardOpen(issue)}
					class="shrink-0 rounded p-0.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
					title={m.assigned_wizard_open()}
				>
					<Plus size={12} />
				</button>
			{/if}
			{#if onQuickAddWithWorktree}
				<button
					type="button"
					onclick={() => onQuickAddWithWorktree(issue)}
					class="shrink-0 rounded p-0.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
					title={m.assigned_quick_worktree()}
				>
					<GitBranch size={12} />
				</button>
			{/if}
		{/if}
	</div>
{/snippet}

{#if issues.length > 0}
	<div class="flex flex-col gap-1">
		<button
			type="button"
			onclick={() => (collapsed.current = !collapsed.current)}
			class="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 transition-colors hover:text-muted-foreground"
		>
			{#if collapsed.current}
				<ChevronRight size={12} />
			{:else}
				<ChevronDown size={12} />
			{/if}
			{m.assigned_title({ count: issues.length })}
		</button>

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
				<button
					type="button"
					onclick={onLoadMore}
					class="rounded px-2 py-1 text-xs text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
				>
					{m.assigned_load_more()}
				</button>
			{/if}
		{/if}
	</div>
{/if}
