<script lang="ts">
	interface Props {
		keys: string;
		action: string;
	}

	const { keys, action }: Props = $props();

	const keyParts = $derived(keys.split(' / '));
</script>

<li>
	{#each keyParts as key, i (i)}
		{#if i > 0}
			{' / '}
		{/if}
		<kbd class="rounded bg-muted px-1 font-mono text-xs">{key}</kbd>
	{/each}
	{' — '}
	{action}
</li>
