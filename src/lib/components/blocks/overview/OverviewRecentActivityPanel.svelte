<script lang="ts">
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import { overviewPanelClass, overviewPanelHeaderClass } from './overview_style.js';
	import type {
		OverviewWorkspaceActivity,
		OverviewWorkspaceTotals,
	} from '$lib/modules/overview/overview_summary.js';

	interface Props {
		activities: OverviewWorkspaceActivity[];
		totals: OverviewWorkspaceTotals;
		formatRelativeTime: (isoString: string | null) => string;
		onOpenWorkspace: (dashboardId: string) => void;
	}

	let { activities, totals, formatRelativeTime, onOpenWorkspace }: Props = $props();
</script>

<section class={overviewPanelClass} aria-label="Recent activity">
	<div class={overviewPanelHeaderClass}>
		<span>Recent activity</span>
		<ActivityIcon class="size-3.5 text-foreground-subtle" />
	</div>

	<div class="mt-3.5 grid gap-2">
		{#if activities.length > 0}
			{#each activities as activity (activity.workspace.dashboard_id)}
				<button
					type="button"
					class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md border border-[color-mix(in_oklch,var(--foreground)_8%,transparent)] bg-[color-mix(in_oklch,var(--surface-2)_54%,transparent)] px-2.5 py-2 text-left text-foreground hover:border-[color-mix(in_oklch,var(--moss-400)_34%,var(--border))] hover:bg-[color-mix(in_oklch,var(--moss-400)_7%,var(--surface-2))]"
					onclick={() => onOpenWorkspace(activity.workspace.dashboard_id)}
				>
					<span
						class="size-2 rounded-full bg-moss-400 shadow-[0_0_10px_color-mix(in_oklch,var(--moss-400)_65%,transparent)]"
					></span>
					<span class="min-w-0">
						<strong class="block truncate text-xs font-semibold">
							{activity.workspace.name}
						</strong>
						<small class="block truncate text-[11px] text-foreground-muted">
							{activity.workspace.active_session_count} sessions / {activity.workspace
								.open_issue_count} issues
						</small>
					</span>
					<span
						class="flex items-center gap-1 whitespace-nowrap font-mono text-[11px] text-foreground-muted"
					>
						<ClockIcon class="size-3" />
						{formatRelativeTime(activity.workspace.last_activity)}
					</span>
				</button>
			{/each}
		{:else}
			<div class="grid min-h-22 place-items-center text-xs text-foreground-muted">
				No recent workspace activity
			</div>
		{/if}
	</div>

	<div
		class="mt-3 flex flex-wrap gap-2 border-t border-dashed border-[color-mix(in_oklch,var(--foreground)_10%,transparent)] pt-2.5 font-mono text-[11px] text-foreground-subtle"
	>
		<span>{totals.openIssueCount} open issues</span>
		<span>{totals.activeSessionCount} active sessions</span>
		<span>{totals.attentionCount} need attention</span>
	</div>
</section>
