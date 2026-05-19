<script lang="ts">
	import { onMount } from 'svelte';
	import * as ContextMenu from '$lib/components/shadcn/context-menu/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { invoke } from '$lib/tauri.js';
	import { useProcesses } from '$lib/modules/processes';
	import { groupCommandEntries, type CommandEntry } from './command_submenu_utils.js';
	import type { WorkspaceCommand } from '$lib/types/generated';
	import TerminalSquareIcon from '@lucide/svelte/icons/terminal-square';
	import PlayIcon from '@lucide/svelte/icons/play';
	import SquareIcon from '@lucide/svelte/icons/square';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import FastForwardIcon from '@lucide/svelte/icons/fast-forward';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

	interface Props {
		dashboardId: string;
		issueId: string;
		onViewLogs?: (processId: string) => void;
	}

	let { dashboardId, issueId, onViewLogs }: Props = $props();

	const processesContext = useProcesses();

	let commands = $state<WorkspaceCommand[]>([]);

	onMount(async () => {
		commands = await invoke<WorkspaceCommand[]>('get_workspace_commands_for_dashboard', {
			dashboardId,
		});
	});

	const groups = $derived(groupCommandEntries(commands, processesContext.processes, issueId));

	function handleRunCommand(entry: CommandEntry) {
		void processesContext.runCommand(entry.command.id, issueId);
	}

	function handleStopCommand(entry: CommandEntry) {
		if (entry.process) {
			void processesContext.killProcess(entry.process.process_id);
		}
	}

	function handleViewLogs(entry: CommandEntry) {
		if (onViewLogs && entry.process) {
			onViewLogs(entry.process.process_id);
		}
	}

	function handleRunAllInGroup(groupIndex: number) {
		const group = groups[groupIndex];
		for (const entry of group.entries) {
			if (entry.state === 'idle' || entry.state === 'stopped') {
				void processesContext.runCommand(entry.command.id, issueId);
			}
		}
	}

	function handleStopAllInGroup(groupIndex: number) {
		const group = groups[groupIndex];
		for (const entry of group.entries) {
			if (entry.state === 'running' && entry.process) {
				void processesContext.killProcess(entry.process.process_id);
			}
		}
	}
</script>

{#if commands.length > 0}
	<ContextMenu.Sub>
		<ContextMenu.SubTrigger>
			<TerminalSquareIcon class="size-4" />
			Commands
		</ContextMenu.SubTrigger>
		<ContextMenu.Portal>
			<ContextMenu.SubContent class="min-w-[300px]">
				{#each groups as group, groupIndex (group.category)}
					{#if groupIndex > 0}
						<ContextMenu.Separator />
					{/if}

					<!-- Group header -->
					<div class="flex items-center gap-1.5 px-2 py-1.5">
						<span
							class="flex-1 text-2xs font-semibold uppercase tracking-widest text-muted-foreground"
						>
							{group.label}
						</span>
						{#if group.hasRunnable}
							<Button
								intent="ghost"
								size="icon-sm"
								class="hover:bg-[color-mix(in_oklch,var(--status-success)_12%,transparent)] hover:text-status-success"
								aria-label="Run All {group.label}"
								onclick={() => handleRunAllInGroup(groupIndex)}
							>
								<FastForwardIcon data-icon />
							</Button>
						{/if}
						{#if group.hasRunning}
							<Button
								intent="ghost"
								size="icon-sm"
								class="hover:bg-[color-mix(in_oklch,var(--status-danger)_12%,transparent)] hover:text-status-danger"
								aria-label="Stop All {group.label}"
								onclick={() => handleStopAllInGroup(groupIndex)}
							>
								<SquareIcon data-icon />
							</Button>
						{/if}
					</div>

					<!-- Command entries -->
					{#each group.entries as entry (entry.command.id)}
						<div
							class="flex min-h-[30px] cursor-default items-center gap-2 rounded-sm px-2 py-1 text-sm hover:bg-accent/25"
						>
							<!-- State icon -->
							<span class="flex size-4 shrink-0 items-center justify-center">
								{#if entry.state === 'idle'}
									<span class="size-1.5 rounded-full bg-muted-foreground/35"
									></span>
								{:else if entry.state === 'running' && entry.command.category === 'server'}
									<span
										class="size-2 rounded-full bg-status-success shadow-[0_0_6px_color-mix(in_oklch,var(--status-success)_50%,transparent)]"
									></span>
								{:else if entry.state === 'running'}
									<LoaderCircleIcon
										class="size-3.5 animate-spin text-status-info"
									/>
								{:else if entry.state === 'passed'}
									<CircleCheckIcon class="size-3.5 text-status-success" />
								{:else if entry.state === 'failed'}
									<CircleXIcon class="size-3.5 text-status-danger" />
								{:else if entry.state === 'timeout'}
									<ClockIcon class="size-3.5 text-status-warning" />
								{:else if entry.state === 'stopped'}
									<SquareIcon class="size-3.5 text-muted-foreground" />
								{/if}
							</span>

							<!-- Command name -->
							<span
								class="min-w-0 flex-1 truncate {entry.state === 'idle' ||
								entry.state === 'stopped'
									? 'text-muted-foreground'
									: ''}"
							>
								{entry.command.name}
							</span>

							<!-- Port button (running servers only) -->
							{#if entry.port !== null && entry.state === 'running'}
								<button
									type="button"
									class="cursor-pointer rounded-sm border border-transparent bg-transparent px-1.5 py-px font-mono text-[10.5px] text-muted-foreground transition-all duration-2 hover:border-border hover:bg-surface-3 hover:text-foreground"
									onclick={(event) => {
										event.stopPropagation();
										handleViewLogs(entry);
									}}
								>
									:{entry.port}
								</button>
							{/if}

							<!-- Action buttons -->
							<div class="ml-auto flex items-center gap-0.5">
								{#if entry.state === 'idle' || entry.state === 'stopped'}
									<Button
										intent="ghost"
										size="icon-sm"
										aria-label="Run {entry.command.name}"
										onclick={(event: MouseEvent) => {
											event.stopPropagation();
											handleRunCommand(entry);
										}}
									>
										<PlayIcon data-icon />
									</Button>
								{:else if entry.state === 'running'}
									<Button
										intent="ghost"
										size="icon-sm"
										class="hover:bg-[color-mix(in_oklch,var(--status-danger)_12%,transparent)] hover:text-status-danger"
										aria-label="Stop {entry.command.name}"
										onclick={(event: MouseEvent) => {
											event.stopPropagation();
											handleStopCommand(entry);
										}}
									>
										<SquareIcon data-icon />
									</Button>
								{:else}
									<Button
										intent="ghost"
										size="icon-sm"
										aria-label="Re-run {entry.command.name}"
										onclick={(event: MouseEvent) => {
											event.stopPropagation();
											handleRunCommand(entry);
										}}
									>
										<RotateCcwIcon data-icon />
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				{/each}
			</ContextMenu.SubContent>
		</ContextMenu.Portal>
	</ContextMenu.Sub>
{/if}
