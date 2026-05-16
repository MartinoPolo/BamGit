<script lang="ts">
	interface CommandResult {
		commandName: string;
		state: 'running' | 'passed' | 'failed';
		isStale?: boolean;
	}

	interface Props {
		commandResults?: CommandResult[];
		serverPort?: number | null;
	}

	let { commandResults = [], serverPort = null }: Props = $props();

	const MAX_VISIBLE_RESULTS = 3;
	const visibleResults = $derived(commandResults.slice(0, MAX_VISIBLE_RESULTS));
	const overflowCount = $derived(commandResults.length - MAX_VISIBLE_RESULTS);
</script>

{#if commandResults.length > 0 || serverPort !== null}
	<div class="flex min-h-5 flex-wrap items-center gap-1">
		{#each visibleResults as result (result.commandName)}
			<span
				class="inline-flex items-center gap-1 rounded border border-border px-1.5 py-px text-[10px] font-medium leading-3"
				class:text-success={result.state === 'passed'}
				class:text-destructive={result.state === 'failed'}
				class:text-muted-foreground={result.state === 'running' || result.isStale}
				class:opacity-50={result.isStale}
			>
				{#if result.state === 'running'}
					<span
						class="inline-block size-2.5 animate-spin rounded-full border border-current border-t-transparent"
					></span>
				{/if}
				{result.commandName}
			</span>
		{/each}
		{#if overflowCount > 0}
			<span
				class="inline-block rounded-full border border-border px-1.5 py-px text-[10px] font-medium leading-3 text-muted-foreground"
			>
				+{overflowCount}
			</span>
		{/if}
		{#if serverPort !== null}
			<a
				href="http://localhost:{serverPort}"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 rounded border border-border px-1.5 py-px text-[10px] font-medium leading-3 text-success hover:underline"
				onclick={(event) => event.stopPropagation()}
			>
				<span class="size-1.5 rounded-full bg-success"></span>
				:{serverPort}
			</a>
		{/if}
	</div>
{/if}
