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
		colorClass: string;
		label: string;
	}

	const STATE_CONFIG: Record<PullRequestState, PullRequestStateConfig> = {
		open: {
			icon: GitPullRequest,
			colorClass:
				'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700/50',
			label: 'Open',
		},
		draft: {
			icon: GitPullRequestDraft,
			colorClass:
				'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800/40 dark:text-neutral-400 dark:border-neutral-600/50',
			label: 'Draft',
		},
		'review-requested': {
			icon: Eye,
			colorClass:
				'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700/50',
			label: 'Review',
		},
		'changes-requested': {
			icon: MessageSquareWarning,
			colorClass:
				'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700/50',
			label: 'Changes',
		},
		approved: {
			icon: Check,
			colorClass:
				'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50',
			label: 'Approved',
		},
		'ready-to-merge': {
			icon: Sparkles,
			colorClass:
				'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-700/50',
			label: 'Ready',
		},
		merged: {
			icon: GitMerge,
			colorClass:
				'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50',
			label: 'Merged',
		},
		closed: {
			icon: GitPullRequestClosed,
			colorClass:
				'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700/50',
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
		colorClass={config.colorClass}
		label={config.label}
		number={prNumber}
		{url}
		prefix="PR"
		{disabled}
	/>
{/if}
