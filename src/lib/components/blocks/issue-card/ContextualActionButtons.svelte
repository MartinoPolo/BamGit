<script lang="ts">
	import {
		ACTION_POOL,
		type ActionId,
		type DerivedActions,
	} from '$lib/modules/contextual-actions';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import type { ButtonIntent } from '$lib/components/shadcn/button/button-variants.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import * as DropdownMenu from '$lib/components/shadcn/dropdown-menu/index.js';
	import PlayIcon from '@lucide/svelte/icons/play';
	import HandIcon from '@lucide/svelte/icons/hand';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import GitCommitVerticalIcon from '@lucide/svelte/icons/git-commit-vertical';
	import GitPullRequestIcon from '@lucide/svelte/icons/git-pull-request';
	import GitPullRequestCreateIcon from '@lucide/svelte/icons/git-pull-request-create-arrow';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import GitMergeIcon from '@lucide/svelte/icons/git-merge';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import GitBranchPlusIcon from '@lucide/svelte/icons/git-branch-plus';
	import GitBranchMinusIcon from '@lucide/svelte/icons/git-branch-minus';
	import RotateCwIcon from '@lucide/svelte/icons/rotate-cw';
	import MonitorIcon from '@lucide/svelte/icons/monitor';
	import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
	import { useIssueCard } from './index.js';
	import type { Component } from 'svelte';

	type ActionIconComponent = Component<{
		size?: number;
		'data-icon'?: 'inline-start' | 'inline-end';
	}>;

	interface Props {
		derivedActions: DerivedActions;
		onExecute: (actionId: ActionId) => void;
	}

	let { derivedActions, onExecute }: Props = $props();

	const ctx = useIssueCard();

	const primaryIntent = $derived<ButtonIntent>(
		ctx.cardState === 'done'
			? 'secondary'
			: ctx.appearanceSettings.buttonColor === 'issue-color'
				? 'issue-color'
				: 'contextual-primary',
	);

	const issueColorStyle = $derived.by(() => {
		if (ctx.cardState === 'done') {
			return '';
		}
		if (ctx.appearanceSettings.buttonColor !== 'issue-color') {
			return '';
		}
		const color = ctx.color;
		const tonedBg = `color-mix(in oklch, ${color} 85%, var(--background))`;
		return `--issue-btn-bg: ${tonedBg}; --issue-btn-text: var(--background); --issue-btn-border: color-mix(in oklch, ${color} 60%, transparent);`;
	});

	const ICON_MAP: Record<string, ActionIconComponent> = {
		play: PlayIcon,
		hand: HandIcon,
		eye: EyeIcon,
		wrench: WrenchIcon,
		'git-commit-vertical': GitCommitVerticalIcon,
		'git-pull-request': GitPullRequestIcon,
		'git-pull-request-create': GitPullRequestCreateIcon,
		sparkles: SparklesIcon,
		'arrow-up': ArrowUpIcon,
		'git-merge': GitMergeIcon,
		'refresh-cw': RefreshCwIcon,
		'git-branch-plus': GitBranchPlusIcon,
		'git-branch-minus': GitBranchMinusIcon,
		'rotate-cw': RotateCwIcon,
		monitor: MonitorIcon,
	};

	function getLabel(actionId: ActionId): string {
		return ACTION_POOL[actionId].label;
	}

	function getIcon(actionId: ActionId): ActionIconComponent | undefined {
		return ICON_MAP[ACTION_POOL[actionId].icon];
	}

	function handleClick(event: MouseEvent, actionId: ActionId) {
		event.stopPropagation();
		onExecute(actionId);
	}
</script>

<div class="flex items-center gap-1.5">
	{#if derivedActions.primary}
		{@const primaryId = derivedActions.primary}
		<SimpleTooltip text={getLabel(primaryId)}>
			<Button
				intent={primaryIntent}
				size="sm"
				class="font-semibold"
				style={issueColorStyle}
				onclick={(event: MouseEvent) => handleClick(event, primaryId)}
			>
				{#if getIcon(primaryId)}
					{@const IconComponent = getIcon(primaryId)!}
					<IconComponent data-icon="inline-start" />
				{/if}
				{getLabel(primaryId)}
			</Button>
		</SimpleTooltip>
	{/if}

	{#if derivedActions.secondary}
		{@const secondaryId = derivedActions.secondary}
		<SimpleTooltip text={getLabel(secondaryId)}>
			<Button
				intent="secondary"
				size="sm"
				onclick={(event: MouseEvent) => handleClick(event, secondaryId)}
			>
				{#if getIcon(secondaryId)}
					{@const IconComponent = getIcon(secondaryId)!}
					<IconComponent data-icon="inline-start" />
				{/if}
				{getLabel(secondaryId)}
			</Button>
		</SimpleTooltip>
	{/if}

	{#if derivedActions.overflow.length > 0}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<SimpleTooltip text="More actions">
						<Button
							{...props}
							intent="secondary"
							size="icon-sm"
							aria-label="More actions"
							onclick={(event: MouseEvent) => event.stopPropagation()}
						>
							<MoreHorizontalIcon data-icon="inline-end" />
						</Button>
					</SimpleTooltip>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" sideOffset={4}>
				{#each derivedActions.overflow as overflowId (overflowId)}
					<DropdownMenu.Item onclick={() => onExecute(overflowId)}>
						{#if getIcon(overflowId)}
							{@const IconComponent = getIcon(overflowId)!}
							<IconComponent />
						{/if}
						{getLabel(overflowId)}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{/if}
</div>
