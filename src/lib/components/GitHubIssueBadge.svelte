<script lang="ts">
	import type { GitHubIssueState } from '$lib/types/github';
	import { CircleDot, CircleCheck } from 'lucide-svelte';
	import GitHubBadge from './GitHubBadge.svelte';

	interface Props {
		state: GitHubIssueState | null;
		url: string | null;
		issue_number: number | null;
		disabled?: boolean;
	}

	let { state, url, issue_number, disabled = false }: Props = $props();

	const config = $derived.by(() => {
		switch (state) {
			case 'open':
				return {
					icon: CircleDot,
					color: 'text-green-400',
					bg: 'bg-green-400/10',
					label: 'Open',
				};
			case 'closed':
				return {
					icon: CircleCheck,
					color: 'text-purple-400',
					bg: 'bg-purple-400/10',
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
		number={issue_number}
		{url}
		prefix="Issue"
		{disabled}
	/>
{/if}
