<script lang="ts">
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import GitHubBadge from './GitHubBadge.svelte';

	interface Props {
		state: string | null;
		url: string | null;
		issueNumber: number | null;
		disabled?: boolean;
	}

	let { state, url, issueNumber, disabled = false }: Props = $props();

	const config = $derived.by(() => {
		switch (state) {
			case 'open':
				return {
					icon: CircleDot,
					colorClass:
						'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700/50',
					label: 'Open',
				};
			case 'closed':
				return {
					icon: CircleCheck,
					colorClass:
						'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50',
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
		colorClass={config.colorClass}
		label={config.label}
		number={issueNumber}
		{url}
		prefix="Issue"
		{disabled}
	/>
{/if}
