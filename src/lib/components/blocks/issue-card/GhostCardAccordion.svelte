<script lang="ts">
	import type { AssignedIssue } from '$lib/types/generated';
	import type { Issue } from '$lib/modules/issues';
	import * as Collapsible from '$lib/components/shadcn/collapsible/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import IssueCard from './IssueCard.svelte';
	import { useIssueCardSettings } from './index.js';
	import {
		sortAssignedIssues,
		type SortColumn,
		type SortDirection,
	} from '$lib/components/blocks/issue/assigned_issues_utils.js';
	import {
		assignedIssueToGhostIssue,
		getUnlinkedOpenAssignedIssues,
	} from './ghost_card_utils.js';
	import { cn } from '$lib/utils.js';

	const SORT_COLUMNS: SortColumn[] = ['number', 'title', 'prd', 'labels'];

	interface Props {
		assignedIssues: AssignedIssue[];
		dashboardIssues: readonly Issue[];
		onWizardOpen?: (issue: AssignedIssue) => void;
		onQuickAddWithWorktree?: (issue: AssignedIssue) => void;
	}

	let { assignedIssues, dashboardIssues, onWizardOpen, onQuickAddWithWorktree }: Props = $props();

	const issueCardSettingsCtx = useIssueCardSettings();

	let open = $state(false);
	let sortColumn: SortColumn = $state('number');
	let sortDirection: SortDirection = $state('asc');

	const filteredIssues = $derived(getUnlinkedOpenAssignedIssues(assignedIssues, dashboardIssues));

	const sortedIssues = $derived(sortAssignedIssues(filteredIssues, sortColumn, sortDirection));

	const ghostIssues = $derived(sortedIssues.map(assignedIssueToGhostIssue));

	const count = $derived(filteredIssues.length);

	const assignedIssueByNumber = $derived(
		new Map(assignedIssues.map((issue) => [issue.number, issue])),
	);

	function handleSortClick() {
		const currentIndex = SORT_COLUMNS.indexOf(sortColumn);
		const nextIndex = (currentIndex + 1) % SORT_COLUMNS.length;
		if (nextIndex === 0 && sortDirection === 'asc') {
			sortDirection = 'desc';
		} else if (nextIndex === 0) {
			sortDirection = 'asc';
		}
		sortColumn = SORT_COLUMNS[nextIndex];
	}

	function handleCardClick(ghostIssue: Issue) {
		const assigned = assignedIssueByNumber.get(ghostIssue.github_issue_number!);
		if (assigned && onWizardOpen) {
			onWizardOpen(assigned);
		}
	}
</script>

{#if count > 0}
	<Collapsible.Root bind:open>
		<div class="flex items-center gap-2">
			<Collapsible.Trigger
				class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
			>
				<ChevronDownIcon
					class={cn('size-3.5 transition-transform duration-3', !open && '-rotate-90')}
				/>
				Assigned &middot; {count}
				{count === 1 ? 'issue' : 'issues'}
			</Collapsible.Trigger>

			<div class="flex items-center gap-1">
				<button
					type="button"
					class="inline-flex size-5 items-center justify-center rounded text-muted-foreground/60 hover:text-muted-foreground"
					aria-label="Sort issues"
					onclick={handleSortClick}
				>
					<ArrowUpDownIcon class="size-3" />
				</button>
				<button
					type="button"
					class="inline-flex size-5 items-center justify-center rounded text-muted-foreground/60 hover:text-muted-foreground"
					aria-label="Filter issues"
				>
					<FilterIcon class="size-3" />
				</button>
			</div>
		</div>

		<Collapsible.Content class="pt-3">
			<div
				class="grid gap-5"
				style="grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));"
			>
				{#each ghostIssues as issue (issue.id)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div onclick={() => handleCardClick(issue)} class="cursor-pointer">
						<IssueCard
							{issue}
							isGhost={true}
							appearanceSettings={issueCardSettingsCtx.settings}
							onQuickActionAssignFolder={onQuickAddWithWorktree
								? () => {
										const assigned = assignedIssueByNumber.get(
											issue.github_issue_number!,
										);
										if (assigned) {
											onQuickAddWithWorktree(assigned);
										}
									}
								: undefined}
						/>
					</div>
				{/each}
			</div>
		</Collapsible.Content>
	</Collapsible.Root>
{/if}
