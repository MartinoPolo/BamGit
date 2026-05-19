<script lang="ts">
	import { useIssueCard } from './index.js';
	import { useProcesses } from '$lib/modules/processes';
	import CommandResultBadge from '$lib/components/derived/command-badges/CommandResultBadge.svelte';
	import ServerPortBadge from '$lib/components/derived/command-badges/ServerPortBadge.svelte';
	import type { CommandResultState } from '$lib/components/derived/command-badges/index.js';
	import type { ProcessStatus } from '$lib/types/generated';
	import {
		computeCommandResultsOverflow,
		MAX_VISIBLE_COMMAND_RESULTS,
	} from './command_results_overflow.js';

	const ctx = useIssueCard();
	const processesCtx = useProcesses();

	const STATUS_TO_BADGE_STATE = {
		running: 'running',
		passed: 'passed',
		failed: 'failed',
		timeout: 'timeout',
		stopped: 'stopped',
	} as const satisfies Record<ProcessStatus, CommandResultState>;

	const issueProcesses = $derived(processesCtx.processesByIssueId.get(ctx.issue.id) ?? []);

	const commandResults = $derived(
		issueProcesses
			.filter((p) => p.category !== 'server')
			.map((p) => ({
				commandName: p.name,
				state: STATUS_TO_BADGE_STATE[p.status],
				isStale: p.status !== 'running' && (ctx.cache?.has_local_changes ?? false),
				restartCount: p.restart_count,
				maxRestarts: p.max_restarts,
			})),
	);

	const runningServerProcess = $derived.by(() => {
		return (
			issueProcesses.find(
				(p) => p.category === 'server' && p.port !== null && p.status === 'running',
			) ?? null
		);
	});

	const serverPort = $derived(runningServerProcess?.port ?? null);

	function handleKillServerProcess(processId: string) {
		void processesCtx.killProcess(processId);
	}

	function handleViewLogs(processId: string) {
		processesCtx.openLogViewer(processId);
	}

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
				restartCount={result.restartCount}
				maxRestarts={result.maxRestarts}
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
		{#if serverPort !== null && runningServerProcess !== null}
			<ServerPortBadge
				port={serverPort}
				badgeStyle={ctx.appearanceSettings.badgeStyle}
				processId={runningServerProcess.process_id}
				onKillProcess={handleKillServerProcess}
				onViewLogs={handleViewLogs}
			/>
		{/if}
	</div>
{/if}
