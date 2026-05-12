<script lang="ts">
	import type { Component } from 'svelte';
	import { openUrl } from '$lib/opener.js';
	import { WithTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import type { PullRequestState } from '$lib/types/generated';
	import {
		VARIANT_CLASSES,
		ISSUE_STATE_CONFIG,
		PR_STATE_CONFIG,
		type StateConfig,
	} from './github_badge_variants.js';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import GitPullRequest from '@lucide/svelte/icons/git-pull-request';
	import GitPullRequestDraft from '@lucide/svelte/icons/git-pull-request-draft';
	import GitMerge from '@lucide/svelte/icons/git-merge';
	import GitPullRequestClosed from '@lucide/svelte/icons/git-pull-request-closed';
	import Eye from '@lucide/svelte/icons/eye';
	import MessageSquareWarning from '@lucide/svelte/icons/message-square-warning';
	import Check from '@lucide/svelte/icons/check';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	interface Props {
		type: 'issue' | 'pr';
		state: string | PullRequestState | null;
		number: number | null;
		url: string | null;
		disabled?: boolean;
	}

	let { type, state, number, url, disabled = false }: Props = $props();

	const ISSUE_ICONS: Record<string, Component> = {
		open: CircleDot,
		closed: CircleCheck,
	};

	const PR_ICONS: Record<PullRequestState, Component> = {
		open: GitPullRequest,
		draft: GitPullRequestDraft,
		'review-requested': Eye,
		'changes-requested': MessageSquareWarning,
		approved: Check,
		'ready-to-merge': Sparkles,
		merged: GitMerge,
		closed: GitPullRequestClosed,
	};

	const resolved = $derived.by(() => {
		if (state === null || state === undefined) {
			return null;
		}
		let config: StateConfig | undefined;
		let icon: Component | undefined;
		if (type === 'issue') {
			config = ISSUE_STATE_CONFIG[state as keyof typeof ISSUE_STATE_CONFIG];
			icon = ISSUE_ICONS[state];
		} else {
			config = PR_STATE_CONFIG[state as PullRequestState];
			icon = PR_ICONS[state as PullRequestState];
		}
		if (config === undefined || icon === undefined) {
			return null;
		}
		return { ...config, icon, colorClass: VARIANT_CLASSES[config.variant] };
	});

	const tooltip = $derived(
		resolved !== null
			? `${resolved.prefix} #${number} — ${resolved.label}${disabled ? ' (offline)' : ''}`
			: '',
	);

	async function handleClick(event: MouseEvent) {
		event.stopPropagation();
		if (url !== null && !disabled) {
			await openUrl(url);
		}
	}
</script>

{#if resolved !== null}
	{@const Icon = resolved.icon}
	<WithTooltip text={tooltip}>
		{#snippet asChild(props)}
			<button
				{...props}
				onclick={handleClick}
				class="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-opacity {resolved.colorClass}"
				class:opacity-50={disabled}
				class:cursor-not-allowed={disabled}
				class:cursor-pointer={!disabled}
				class:hover:opacity-80={!disabled}
				{disabled}
			>
				<Icon size={12} />
				<span>#{number}</span>
			</button>
		{/snippet}
	</WithTooltip>
{/if}
