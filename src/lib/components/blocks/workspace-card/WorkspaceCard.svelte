<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import * as Card from '$lib/components/shadcn/card/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { StatCell } from '$lib/components/base/stat-cell/index.js';
	import { StatusRow } from '$lib/components/base/status-row/index.js';
	import GithubIcon from '$lib/components/derived/icons/GithubIcon.svelte';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import ListChecksIcon from '@lucide/svelte/icons/list-checks';
	import GitPullRequestIcon from '@lucide/svelte/icons/git-pull-request';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import UserIcon from '@lucide/svelte/icons/user';
	import GitBranchIcon from '@lucide/svelte/icons/git-branch';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import CostLink from '$lib/components/blocks/usage/CostLink.svelte';
	import { cn } from '$lib/utils.js';
	import { formatWorkspaceActivityRelativeTime } from '$lib/modules/overview/overview_time.js';
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

	const isAfkOn = $derived(workspace.afk_loop_status === AFK_LOOP_RUNNING);
	const isEmpty = $derived(variant === 'empty');
	const isDormant = $derived(variant === 'dormant');
	const isArchived = $derived(workspace.status === 'archived');
	const isMissingConfiguration = $derived(
		workspace.github_repo == null || workspace.local_folder == null,
	);

	const issuesSuffix = $derived(`/${workspace.open_issue_count}`);

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
		const relativeTime = formatWorkspaceActivityRelativeTime(workspace.last_activity);
		return relativeTime !== formatWorkspaceActivityRelativeTime(null)
			? `last ${relativeTime}`
			: undefined;
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
		class={cn(
			'group relative isolate h-full min-h-[198px] cursor-pointer overflow-hidden rounded-lg bg-surface transition-all duration-4',
			'border-[color-mix(in_oklch,var(--ws-accent)_25%,var(--border))]',
			'shadow-[0_16px_34px_rgb(0_0_0_/_20%),inset_0_0_4px_color-mix(in_oklch,var(--ws-accent)_22%,transparent),inset_0_1px_0_color-mix(in_oklch,var(--foreground)_6%,transparent)]',
			"before:pointer-events-none before:absolute before:inset-0 before:z-0 before:rounded-[inherit] before:content-['']",
			'before:bg-[radial-gradient(250px_210px_at_0%_100%,color-mix(in_oklch,var(--ws-accent)_30%,transparent),transparent_68%),radial-gradient(180px_150px_at_12%_84%,color-mix(in_oklch,var(--ws-accent)_18%,transparent),transparent_72%),linear-gradient(180deg,color-mix(in_oklch,var(--surface-2)_56%,transparent),transparent_55%)]',
			'hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,var(--ws-accent)_58%,var(--border))]',
			'hover:shadow-[0_22px_48px_rgb(0_0_0_/_26%),0_0_34px_color-mix(in_oklch,var(--ws-accent)_18%,transparent),inset_0_0_14px_color-mix(in_oklch,var(--ws-accent)_21%,transparent),inset_0_1px_0_color-mix(in_oklch,var(--foreground)_7%,transparent)]',
			isDormant && 'opacity-[0.72] saturate-[0.7]',
			isArchived &&
				'opacity-[0.54] grayscale-[0.35] saturate-[0.62] before:bg-[radial-gradient(250px_210px_at_0%_100%,color-mix(in_oklch,var(--foreground-subtle)_12%,transparent),transparent_68%),linear-gradient(180deg,color-mix(in_oklch,var(--surface-2)_42%,transparent),transparent_55%)]',
			isMissingConfiguration &&
				'border-[color-mix(in_oklch,var(--status-warning)_24%,var(--border))]',
		)}
	>
		{#if variant === 'active'}
			<div
				class="pointer-events-none absolute inset-0 rounded-lg animate-ws-breathe"
				style="box-shadow: inset 0 0 24px color-mix(in oklch, {accentColor} 22%, transparent);"
			></div>
		{/if}

		{#if isArchived}
			<Badge tone="neutral" class="absolute top-2 right-2 z-10"
				>{m.workspace_status_archived()}</Badge
			>
		{/if}

		<div class="relative z-1 flex h-full flex-col px-3.5 pt-3.5 pb-3">
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
								{workspace.default_branch ?? 'main'} / {workspace.worktree_count} worktrees
							</span>
						</span>
					</div>
				</div>
				<div class="flex shrink-0 gap-0.5">
					<Button
						intent="ghost"
						size="icon"
						aria-label="Open GitHub repository"
						class={cn('size-6.5', workspace.github_repo == null && 'opacity-[0.35]')}
						onclick={(event: MouseEvent) => handleIconClick(event, onGithubClick)}
						oncontextmenu={(event: MouseEvent) =>
							handleIconContextMenu(event, onGithubRightClick)}
					>
						<GithubIcon strokeWidth={1.7} data-icon="inline-end" />
					</Button>
					<Button
						intent="ghost"
						size="icon"
						aria-label="Open local folder"
						class={cn('size-6.5', workspace.local_folder == null && 'opacity-[0.35]')}
						onclick={(event: MouseEvent) => handleIconClick(event, onFolderClick)}
						oncontextmenu={(event: MouseEvent) =>
							handleIconContextMenu(event, onFolderRightClick)}
					>
						<FolderIcon strokeWidth={1.7} data-icon="inline-end" />
					</Button>
				</div>
			</div>

			<div class="flex-1">
				{#if isEmpty}
					<!-- Empty placeholder content -->
					<div
						class="flex h-full flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-[color-mix(in_oklch,var(--ws-accent)_28%,var(--border))] bg-[color-mix(in_oklch,var(--ws-accent)_7%,transparent)] px-4 py-6"
					>
						<SparklesIcon class="size-5 text-foreground-subtle" />
						<span class="text-xs font-medium text-foreground-muted">
							Newly created - open to track issues
						</span>
					</div>
				{:else}
					<!-- Health grid: 4 stat cells -->
					<div class="mb-2 grid grid-cols-4 gap-1.5">
						<StatCell
							label="ISSUES"
							value={workspace.afk_ready_count}
							suffix={issuesSuffix}
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
					{#if isMissingConfiguration}
						<div
							class="mb-1.5 flex h-7.5 items-center gap-2 rounded-sm border border-[color-mix(in_oklch,var(--status-warning)_35%,transparent)] bg-[color-mix(in_oklch,var(--status-warning)_10%,transparent)] px-2.5 text-[11px] font-medium text-status-warning"
						>
							<TriangleAlertIcon class="size-3 shrink-0" strokeWidth={1.7} />
							<span class="truncate">Configuration incomplete</span>
						</div>
					{:else if workspace.prd_count > 0}
						<button
							type="button"
							class="mb-1.5 flex w-full cursor-pointer items-center gap-2 rounded-sm border border-border bg-surface-2 px-2.5 py-1.5 hover:border-border-strong"
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
									class="h-full rounded-full transition-[width] duration-5 ease-out"
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
						<div class="mb-1.5 h-7.5"></div>
					{/if}

					<!-- AFK status row -->
					<StatusRow
						active={isAfkOn}
						label={isAfkOn ? 'AFK loop running' : 'AFK loop off'}
						meta={afkMeta}
						activeColor={accentColor}
						onclick={onAfkClick}
					/>
				{/if}
			</div>

			<!-- Footer: cost + activity -->
			<div
				class="mt-2.5 flex items-center justify-between border-t border-dashed border-border pt-2"
			>
				<span
					class="flex items-center gap-1 font-mono text-[10.5px] text-foreground-subtle"
				>
					today <CostLink
						costUsd={workspace.total_cost_usd ?? 0}
						period="today"
						scope="workspace"
						size="sm"
					/>
				</span>
				<span
					class="flex items-center gap-1 font-mono text-[10.5px] text-foreground-subtle"
				>
					<ClockIcon class="size-3" />
					{formatWorkspaceActivityRelativeTime(workspace.last_activity)}
				</span>
			</div>
		</div></Card.Card
	>
</button>
