<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { StatCell } from '$lib/components/ui/stat-cell/index.js';
	import { StatusRow } from '$lib/components/ui/status-row/index.js';
	import GithubIcon from './icons/GithubIcon.svelte';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import ListChecksIcon from '@lucide/svelte/icons/list-checks';
	import GitPullRequestIcon from '@lucide/svelte/icons/git-pull-request';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import UserIcon from '@lucide/svelte/icons/user';
	import GitBranchIcon from '@lucide/svelte/icons/git-branch';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import { cn } from '$lib/utils.js';
	import type { OverviewWorkspaceData } from '$lib/types/generated';
	import {
		AFK_LOOP_RUNNING,
		deriveWorkspaceCardVariant,
		getVariantAccentColor,
		type WorkspaceCardVariant,
	} from './workspace_card_variants.js';

	interface Props {
		workspace: OverviewWorkspaceData;
		onclick: () => void;
		onGithubClick?: () => void;
		onFolderClick?: () => void;
		onGithubRightClick?: () => void;
		onFolderRightClick?: () => void;
		onIssuesClick?: () => void;
		onPrsClick?: () => void;
		onAttnClick?: () => void;
		onHitlClick?: () => void;
		onPrdClick?: () => void;
		onAfkClick?: () => void;
	}

	let {
		workspace,
		onclick,
		onGithubClick,
		onFolderClick,
		onGithubRightClick,
		onFolderRightClick,
		onIssuesClick,
		onPrsClick,
		onAttnClick,
		onHitlClick,
		onPrdClick,
		onAfkClick,
	}: Props = $props();

	const originalAccent = $derived(workspace.accent_color ?? 'oklch(0.580 0.096 134)');

	const variant: WorkspaceCardVariant = $derived(
		deriveWorkspaceCardVariant({
			prsNeedingAttention: workspace.prs_needing_attention,
			hitlCount: workspace.hitl_count,
			afkLoopStatus: workspace.afk_loop_status,
			lastActivity: workspace.last_activity,
			openIssueCount: workspace.open_issue_count,
		}),
	);

	const accentColor = $derived(getVariantAccentColor(variant, originalAccent));
	const gradientTint = $derived(`color-mix(in oklch, ${accentColor} 8%, transparent)`);

	const isAfkOn = $derived(workspace.afk_loop_status === AFK_LOOP_RUNNING);
	const isEmpty = $derived(variant === 'empty');
	const isDormant = $derived(variant === 'dormant');

	const issuesValue = $derived(`${workspace.afk_ready_count}/${workspace.open_issue_count}`);

	const issuesTone = $derived.by(() => {
		if (workspace.afk_ready_count === 0 && workspace.open_issue_count === 0) {
			return 'zero' as const;
		}
		return 'neutral' as const;
	});

	const attnTone = $derived.by(() => {
		if (workspace.prs_needing_attention > 0) {
			return 'danger' as const;
		}
		return 'neutral' as const;
	});

	const hitlTone = $derived.by(() => {
		if (workspace.hitl_count > 0) {
			return 'warning' as const;
		}
		return 'neutral' as const;
	});

	const afkMeta = $derived.by(() => {
		if (isAfkOn) {
			if (workspace.active_session_count === 0) {
				return 'idle';
			}
			const afkCount = Math.max(0, workspace.active_session_count - 1);
			return `${workspace.active_session_count} sessions (${afkCount} AFK)`;
		}
		if (workspace.active_session_count > 0) {
			return `${workspace.active_session_count} sessions`;
		}
		const relativeTime = formatRelativeTime(workspace.last_activity);
		return relativeTime !== m.workspace_no_activity() ? `last ${relativeTime}` : undefined;
	});

	const prdProgressPercent = $derived(
		workspace.prd_total_subs > 0
			? (workspace.prd_completed_subs / workspace.prd_total_subs) * 100
			: 0,
	);

	const initials = $derived(
		workspace.name
			.split(/[\s-_]+/)
			.slice(0, 2)
			.map((word) => word[0]?.toUpperCase() ?? '')
			.join(''),
	);

	function formatRelativeTime(isoString: string | null): string {
		if (isoString == null) {
			return m.workspace_no_activity();
		}
		const date = new Date(isoString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMinutes = Math.floor(diffMs / 60000);

		if (diffMinutes < 1) {
			return m.time_just_now();
		}
		if (diffMinutes < 60) {
			return m.time_minutes_ago({ count: String(diffMinutes) });
		}
		const diffHours = Math.floor(diffMinutes / 60);
		if (diffHours < 24) {
			return m.time_hours_ago({ count: String(diffHours) });
		}
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays === 1) {
			return m.workspace_yesterday();
		}
		return m.time_days_ago({ count: String(diffDays) });
	}

	function formatCost(cost: number | null): string {
		if (cost == null || cost === 0) {
			return '$0.00';
		}
		return `$${cost.toFixed(2)}`;
	}

	function handleIconClick(event: MouseEvent, handler?: () => void) {
		event.stopPropagation();
		handler?.();
	}

	function handleIconContextMenu(event: MouseEvent, handler?: () => void) {
		if (handler) {
			event.preventDefault();
			event.stopPropagation();
			handler();
		}
	}
</script>

<button
	class="block h-full w-full text-left"
	{onclick}
	data-variant={variant}
	style:--ws-accent={accentColor}
>
	<Card.Card
		padding="none"
		accentBarColor={accentColor}
		{gradientTint}
		class={cn(
			'group relative isolate h-full cursor-pointer transition-all duration-200',
			'hover:-translate-y-0.5 hover:shadow-md',
			isDormant && 'opacity-[0.72] saturate-[0.7]',
		)}
	>
		{#if variant === 'active'}
			<div
				class="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] animate-ws-breathe"
				style="box-shadow: inset 0 0 24px color-mix(in oklch, {accentColor} 22%, transparent);"
			></div>
		{/if}

		<div class="relative z-[1] px-3.5 pt-3.5 pb-3">
			<!-- Header: thumbnail + name + subtitle + icon buttons -->
			<div class="mb-2.5 flex items-start justify-between gap-2">
				<div class="flex items-center gap-2.5 min-w-0">
					<div
						class="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2"
					>
						<span class="font-mono text-[10px] font-semibold text-foreground-subtle">
							{initials}
						</span>
					</div>
					<div class="min-w-0">
						<h3
							class="truncate text-[15px] font-semibold leading-tight text-foreground"
						>
							{workspace.name}
						</h3>
						<span
							class="flex items-center gap-1 font-mono text-[10.5px] text-foreground-muted"
						>
							<GitBranchIcon class="size-3 shrink-0" />
							<span class="truncate">
								{workspace.default_branch ?? 'main'} · {workspace.worktree_count} worktrees
							</span>
						</span>
					</div>
				</div>
				<div class="flex shrink-0 gap-0.5">
					<Button
						variant="ghost"
						size="icon"
						class={cn('size-[26px]', workspace.github_repo == null && 'opacity-[0.35]')}
						onclick={(event: MouseEvent) => handleIconClick(event, onGithubClick)}
						oncontextmenu={(event: MouseEvent) =>
							handleIconContextMenu(event, onGithubRightClick)}
					>
						<GithubIcon size={14} strokeWidth={1.7} />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						class={cn(
							'size-[26px]',
							workspace.local_folder == null && 'opacity-[0.35]',
						)}
						onclick={(event: MouseEvent) => handleIconClick(event, onFolderClick)}
						oncontextmenu={(event: MouseEvent) =>
							handleIconContextMenu(event, onFolderRightClick)}
					>
						<FolderIcon size={14} strokeWidth={1.7} />
					</Button>
				</div>
			</div>

			{#if isEmpty}
				<!-- Empty placeholder content -->
				<div
					class="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-border px-4 py-6"
				>
					<SparklesIcon class="size-5 text-foreground-subtle" />
					<span class="text-xs font-medium text-foreground-muted">
						Newly planted — open to track issues
					</span>
				</div>
			{:else}
				<!-- Health grid: 4 stat cells -->
				<div class="mb-2 grid grid-cols-4 gap-1.5">
					<StatCell
						label="ISSUES"
						value={issuesValue}
						tone={issuesTone}
						icon={ListChecksIcon}
						onclick={onIssuesClick}
					/>
					<StatCell
						label="PRs"
						value={workspace.open_pr_count}
						icon={GitPullRequestIcon}
						onclick={onPrsClick}
					/>
					<StatCell
						label="ATTN"
						value={workspace.prs_needing_attention}
						tone={attnTone}
						icon={TriangleAlertIcon}
						pulse={true}
						onclick={onAttnClick}
					/>
					<StatCell
						label="HITL"
						value={workspace.hitl_count}
						tone={hitlTone}
						icon={UserIcon}
						pulse={true}
						onclick={onHitlClick}
					/>
				</div>

				<!-- PRD row -->
				{#if workspace.prd_count > 0}
					<button
						type="button"
						class="mb-1.5 flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface-2 px-2.5 py-1.5 hover:border-border-strong"
						onclick={(event: MouseEvent) => {
							event.stopPropagation();
							onPrdClick?.();
						}}
					>
						<ClipboardListIcon
							class="size-3 shrink-0 text-foreground-subtle"
							strokeWidth={1.7}
						/>
						<span
							class="text-[11px] font-medium text-foreground-muted whitespace-nowrap"
						>
							{workspace.prd_count} PRDs
						</span>
						<div
							class="flex-1 h-1 rounded-full bg-[color-mix(in_oklch,var(--foreground)_10%,transparent)] overflow-hidden"
						>
							<div
								class="h-full rounded-full transition-[width] duration-300 ease-out"
								style="width: {prdProgressPercent}%; background: var(--ws-accent);"
							></div>
						</div>
						<span
							class="font-mono text-[10.5px] tabular-nums text-foreground-subtle whitespace-nowrap"
						>
							{workspace.prd_completed_subs}/{workspace.prd_total_subs} done
						</span>
					</button>
				{:else}
					<div class="mb-1.5 h-[30px]"></div>
				{/if}

				<!-- AFK status row -->
				<StatusRow
					active={isAfkOn}
					label={isAfkOn ? 'AFK loop running' : 'AFK loop off'}
					meta={afkMeta}
					onclick={onAfkClick}
				/>
			{/if}

			<!-- Footer: cost + activity -->
			<div
				class="mt-2.5 flex items-center justify-between border-t border-dashed border-border pt-2"
			>
				<span class="font-mono text-[10.5px] text-foreground-subtle">
					today {formatCost(workspace.total_cost_usd)}
				</span>
				<span
					class="flex items-center gap-1 font-mono text-[10.5px] text-foreground-subtle"
				>
					<ClockIcon class="size-3" />
					{formatRelativeTime(workspace.last_activity)}
				</span>
			</div>
		</div>
	</Card.Card>
</button>
