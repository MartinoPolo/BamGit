<script lang="ts">
	import type { PullRequestState } from '$lib/types/generated';
	import GitPullRequest from '@lucide/svelte/icons/git-pull-request';
	import GitPullRequestDraft from '@lucide/svelte/icons/git-pull-request-draft';
	import GitMerge from '@lucide/svelte/icons/git-merge';
	import GitPullRequestClosed from '@lucide/svelte/icons/git-pull-request-closed';
	import Eye from '@lucide/svelte/icons/eye';
	import MessageSquareWarning from '@lucide/svelte/icons/message-square-warning';
	import Check from '@lucide/svelte/icons/check';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import GitHubBadge from './GitHubBadge.svelte';

	interface PullRequestStateConfig {
		icon: typeof GitPullRequest;
		color: string;
		bg: string;
		label: string;
	}

	const STATE_CONFIG: Record<PullRequestState, PullRequestStateConfig> = {
		open: {
			icon: GitPullRequest,
			color: 'text-green-400',
			bg: 'bg-green-400/10',
			label: 'Open',
		},
		draft: {
			icon: GitPullRequestDraft,
			color: 'text-neutral-400',
			bg: 'bg-neutral-400/10',
			label: 'Draft',
		},
		'review-requested': {
			icon: Eye,
			color: 'text-yellow-400',
			bg: 'bg-yellow-400/10',
			label: 'Review',
		},
		'changes-requested': {
			icon: MessageSquareWarning,
			color: 'text-orange-400',
			bg: 'bg-orange-400/10',
			label: 'Changes',
		},
		approved: {
			icon: Check,
			color: 'text-emerald-400',
			bg: 'bg-emerald-400/10',
			label: 'Approved',
		},
		'ready-to-merge': {
			icon: Sparkles,
			color: 'text-cyan-400',
			bg: 'bg-cyan-400/10',
			label: 'Ready',
		},
		merged: {
			icon: GitMerge,
			color: 'text-purple-400',
			bg: 'bg-purple-400/10',
			label: 'Merged',
		},
		closed: {
			icon: GitPullRequestClosed,
			color: 'text-red-400',
			bg: 'bg-red-400/10',
			label: 'Closed',
		},
	};

	interface Props {
		state: PullRequestState | null;
		url: string | null;
		prNumber: number | null;
		disabled?: boolean;
	}

	let { state, url, prNumber, disabled = false }: Props = $props();

	const config = $derived(state ? STATE_CONFIG[state] : null);
</script>

{#if config && state}
	<GitHubBadge
		icon={config.icon}
		color={config.color}
		bg={config.bg}
		label={config.label}
		number={prNumber}
		{url}
		prefix="PR"
		{disabled}
	/>
{/if}
