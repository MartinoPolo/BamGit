<script lang="ts">
	import type { PullRequestState } from '$lib/types/github';
	import {
		GitPullRequest,
		GitPullRequestDraft,
		GitMerge,
		GitPullRequestClosed,
		Eye,
		MessageSquareWarning,
		Check,
		Sparkles,
	} from 'lucide-svelte';
	import GitHubBadge from './GitHubBadge.svelte';

	interface Props {
		state: PullRequestState | null;
		url: string | null;
		pr_number: number | null;
		disabled?: boolean;
	}

	let { state, url, pr_number, disabled = false }: Props = $props();

	const config = $derived.by(() => {
		switch (state) {
			case 'open':
				return {
					icon: GitPullRequest,
					color: 'text-green-400',
					bg: 'bg-green-400/10',
					label: 'Open',
				};
			case 'draft':
				return {
					icon: GitPullRequestDraft,
					color: 'text-neutral-400',
					bg: 'bg-neutral-400/10',
					label: 'Draft',
				};
			case 'review-requested':
				return {
					icon: Eye,
					color: 'text-yellow-400',
					bg: 'bg-yellow-400/10',
					label: 'Review',
				};
			case 'changes-requested':
				return {
					icon: MessageSquareWarning,
					color: 'text-orange-400',
					bg: 'bg-orange-400/10',
					label: 'Changes',
				};
			case 'approved':
				return {
					icon: Check,
					color: 'text-emerald-400',
					bg: 'bg-emerald-400/10',
					label: 'Approved',
				};
			case 'ready-to-merge':
				return {
					icon: Sparkles,
					color: 'text-cyan-400',
					bg: 'bg-cyan-400/10',
					label: 'Ready',
				};
			case 'merged':
				return {
					icon: GitMerge,
					color: 'text-purple-400',
					bg: 'bg-purple-400/10',
					label: 'Merged',
				};
			case 'closed':
				return {
					icon: GitPullRequestClosed,
					color: 'text-red-400',
					bg: 'bg-red-400/10',
					label: 'Closed',
				};
			default:
				return null;
		}
	});
</script>

{#if config && state}
	<GitHubBadge
		icon={config.icon}
		color={config.color}
		bg={config.bg}
		label={config.label}
		number={pr_number}
		{url}
		prefix="PR"
		{disabled}
	/>
{/if}
