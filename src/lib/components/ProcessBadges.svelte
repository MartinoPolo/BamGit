<script lang="ts">
	// fallow-ignore-file unused-file
	import type { RunningProcess } from '$lib/types/generated';
	import { Badge } from '$lib/components/ui/badge/index.js';

	interface Props {
		processes: RunningProcess[];
		onViewLogs: (process: RunningProcess) => void;
	}

	let { processes, onViewLogs }: Props = $props();

	const serverProcesses = $derived(processes.filter((p) => p.category === 'server'));
	const checkProcesses = $derived(processes.filter((p) => p.category === 'check'));

	function handlePortClick(port: number) {
		window.open(`http://localhost:${port}`, '_blank');
	}

	function variantForCheck(process: RunningProcess) {
		if (process.status === 'running') {
			return 'amber' as const;
		}
		if (process.status === 'stopped') {
			return 'success' as const;
		}
		return 'danger' as const;
	}
</script>

{#if processes.length > 0}
	<div class="flex flex-wrap items-center gap-1">
		{#each serverProcesses as proc (proc.process_id)}
			{#if proc.status === 'running' && proc.port}
				<Badge
					variant="success"
					dot="pulsing"
					class="cursor-pointer"
					onclick={() => handlePortClick(proc.port!)}
					oncontextmenu={(e) => {
						e.preventDefault();
						onViewLogs(proc);
					}}
				>
					:{proc.port}
				</Badge>
			{:else if proc.status === 'running'}
				<Badge
					variant="success"
					dot="pulsing"
					class="cursor-pointer"
					onclick={() => onViewLogs(proc)}
				>
					{proc.name}
				</Badge>
			{/if}
		{/each}

		{#each checkProcesses as proc (proc.process_id)}
			<Badge
				variant={variantForCheck(proc)}
				class="cursor-pointer"
				onclick={() => onViewLogs(proc)}
			>
				{proc.name}
			</Badge>
		{/each}
	</div>
{/if}
