<script lang="ts">
	import { useIssueCard } from './index.js';
	import CommandResultBadge from '$lib/components/derived/command-badges/CommandResultBadge.svelte';
	import ServerPortBadge from '$lib/components/derived/command-badges/ServerPortBadge.svelte';
	import {
		computeCommandResultsOverflow,
		MAX_VISIBLE_COMMAND_RESULTS,
	} from './command_results_overflow.js';

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

	const ctx = useIssueCard();

	const visibleResults = $derived(commandResults.slice(0, MAX_VISIBLE_COMMAND_RESULTS));
	const overflow = $derived(computeCommandResultsOverflow(commandResults.length));
</script>

{#if commandResults.length > 0 || serverPort !== null}
	<div class="flex min-h-5 flex-wrap items-center gap-1">
		{#each visibleResults as result (result.commandName)}
			<CommandResultBadge
				state={result.state}
				commandName={result.commandName}
				isStale={result.isStale}
				badgeStyle={ctx.appearanceSettings.badgeStyle}
			/>
		{/each}
		{#if overflow.overflowCount > 0}
			<span
				class="inline-block rounded-full border border-border px-1.5 py-px text-[10px] font-medium leading-3 text-muted-foreground"
			>
				+{overflow.overflowCount}
			</span>
		{/if}
		{#if serverPort !== null}
			<ServerPortBadge port={serverPort} badgeStyle={ctx.appearanceSettings.badgeStyle} />
		{/if}
	</div>
{/if}
