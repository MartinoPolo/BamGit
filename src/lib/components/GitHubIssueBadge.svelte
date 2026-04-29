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
		number={issueNumber}
		{url}
		prefix="Issue"
		{disabled}
	/>
{/if}
