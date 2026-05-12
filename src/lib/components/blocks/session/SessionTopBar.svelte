<script lang="ts">
	import type { Session } from '$lib/types/generated/Session.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import GitBranchIcon from '@lucide/svelte/icons/git-branch';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import * as Tabs from '$lib/components/shadcn/tabs/index.js';
	import { WithTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import { Separator } from '$lib/components/shadcn/separator/index.js';
	import SessionStateBadge from './SessionStateBadge.svelte';

	interface Props {
		session: Session;
		branchName?: string;
		issueNumber?: number | null;
		prNumber?: number | null;
		activeTab?: 'chat' | 'files' | 'stats';
		onTabChange?: (tab: 'chat' | 'files' | 'stats') => void;
		onOpenInCli?: () => void;
		onBack?: () => void;
	}

	let {
		session,
		branchName = '',
		issueNumber = null,
		prNumber = null,
		activeTab = 'chat',
		onTabChange,
		onOpenInCli,
		onBack,
	}: Props = $props();

	const sessionTitle = $derived(
		session.original_intent ?? session.last_prompt ?? `Session ${session.id.slice(0, 8)}`,
	);

	const truncatedTitle = $derived(
		sessionTitle.length > 60 ? sessionTitle.slice(0, 60) + '…' : sessionTitle,
	);
</script>

<div class="flex h-10 shrink-0 items-center gap-2.5 border-b border-border bg-surface px-3.5">
	<!-- Left: back button + title + state badge -->
	{#if onBack}
		<Button variant="ghost" size="icon-sm" onclick={onBack}>
			<ArrowLeftIcon size={14} strokeWidth={2} />
		</Button>
	{/if}
	<span
		class="max-w-70 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold tracking-[-0.01em]"
	>
		{truncatedTitle}
	</span>
	<SessionStateBadge state={session.state} />

	<!-- Center: git context -->
	<div class="flex flex-1 items-center justify-center gap-2">
		{#if branchName}
			<GitBranchIcon size={12} strokeWidth={1.6} class="text-foreground-subtle" />
			<span class="font-mono text-[11px] text-foreground-muted">{branchName}</span>
		{/if}
		{#if issueNumber !== null}
			<Badge variant="info">#{issueNumber} open</Badge>
		{/if}
		{#if prNumber !== null}
			<Badge variant="moss">PR #{prNumber} draft</Badge>
		{/if}
	</div>

	<!-- Right: actions + tabs -->
	<div class="flex shrink-0 items-center gap-1.5">
		{#if onOpenInCli}
			<WithTooltip text="Open session in CLI">
				<Button variant="secondary" size="sm" onclick={onOpenInCli}>
					<ExternalLinkIcon size={11} strokeWidth={1.8} />
					<span class="text-[11px]">Open in CLI</span>
				</Button>
			</WithTooltip>
		{/if}

		<Button variant="ghost" size="icon-sm">
			<EllipsisVerticalIcon size={14} strokeWidth={2} />
		</Button>

		<Separator orientation="vertical" class="mx-1 h-4.5" />

		<Tabs.Root>
			<Tabs.Tab active={activeTab === 'chat'} onclick={() => onTabChange?.('chat')}>
				Chat
			</Tabs.Tab>
			<Tabs.Tab active={activeTab === 'files'} onclick={() => onTabChange?.('files')}>
				Files
			</Tabs.Tab>
			<Tabs.Tab active={activeTab === 'stats'} onclick={() => onTabChange?.('stats')}>
				Stats
			</Tabs.Tab>
		</Tabs.Root>
	</div>
</div>
