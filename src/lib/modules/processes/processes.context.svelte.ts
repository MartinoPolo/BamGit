import { createContext, onMount, onDestroy } from 'svelte';
import { invoke, listen, type UnlistenFn } from '$lib/tauri.js';
import type { ProcessStatus, RunningProcess } from '$lib/types/generated';
import { SvelteMap } from 'svelte/reactivity';

// ─── Types ────────────────────────────────────────────────────────────────

export interface ProcessLogLine {
	stream: 'stdout' | 'stderr';
	text: string;
}

type ProcessPortDetectedPayload = [string, number];
type ProcessExitedPayload = [string, ProcessStatus];
type ProcessOutputPayload = [string, 'stdout' | 'stderr', string];
type ProcessRestartedPayload = [string, number, number];

// ─── Context ──────────────────────────────────────────────────────────────

type ProcessesContext = ReturnType<typeof createProcessesContext>['publicApi'];

const [useProcesses, setProcessesInternal] = createContext<ProcessesContext>();
export { useProcesses };

export function setProcessesContext(onProcessRestarted?: (issueId: string) => void) {
	const {
		publicApi,
		handlePortDetected,
		handleProcessExited,
		handleProcessOutput,
		handleProcessRestarted,
	} = createProcessesContext(onProcessRestarted);
	setProcessesInternal(publicApi);

	let cancelled = false;
	let unlistenPort: UnlistenFn | null = null;
	let unlistenExited: UnlistenFn | null = null;
	let unlistenOutput: UnlistenFn | null = null;
	let unlistenRestarted: UnlistenFn | null = null;

	onMount(async () => {
		void publicApi.loadProcesses();

		const [portUn, exitedUn, outputUn, restartedUn] = await Promise.all([
			listen<ProcessPortDetectedPayload>('process-port-detected', (event) => {
				handlePortDetected(event.payload);
			}),
			listen<ProcessExitedPayload>('process-exited', (event) => {
				handleProcessExited(event.payload);
			}),
			listen<ProcessOutputPayload>('process-output', (event) => {
				handleProcessOutput(event.payload);
			}),
			listen<ProcessRestartedPayload>('process-restarted', (event) => {
				handleProcessRestarted(event.payload);
			}),
		]);

		if (cancelled) {
			portUn();
			exitedUn();
			outputUn();
			restartedUn();
			return;
		}

		unlistenPort = portUn;
		unlistenExited = exitedUn;
		unlistenOutput = outputUn;
		unlistenRestarted = restartedUn;
	});

	onDestroy(() => {
		cancelled = true;
		unlistenPort?.();
		unlistenExited?.();
		unlistenOutput?.();
		unlistenRestarted?.();
	});

	return publicApi;
}

// ─── Factory ──────────────────────────────────────────────────────────────

/** @internal - exported only for testing */
export function createProcessesContext(onProcessRestarted?: (issueId: string) => void) {
	let processes = $state<RunningProcess[]>([]);
	const logLines = new SvelteMap<string, ProcessLogLine[]>();
	let activeLogViewerProcessId = $state<string | null>(null);

	const processesByIssueId = $derived.by(() => {
		const map = new SvelteMap<string, RunningProcess[]>();
		for (const process of processes) {
			const existing = map.get(process.issue_id);
			if (existing) {
				existing.push(process);
			} else {
				map.set(process.issue_id, [process]);
			}
		}
		return map;
	});

	// ─── Event handlers ────────────────────────────────────────────────────

	function handlePortDetected(payload: ProcessPortDetectedPayload) {
		const [processId, port] = payload;
		const process = processes.find((p) => p.process_id === processId);
		if (process) {
			process.port = port;
		}
	}

	function handleProcessExited(payload: ProcessExitedPayload) {
		const [processId, status] = payload;
		const process = processes.find((p) => p.process_id === processId);
		if (process) {
			process.status = status;
		}
	}

	function handleProcessRestarted(payload: ProcessRestartedPayload) {
		const [processId, restartCount, maxRestarts] = payload;
		const process = processes.find((p) => p.process_id === processId);
		if (process) {
			process.restart_count = restartCount;
			process.max_restarts = maxRestarts;
			process.status = 'running';
			onProcessRestarted?.(process.issue_id);
		}
	}

	const maxFrontendLogLines = 1000;

	function handleProcessOutput(payload: ProcessOutputPayload) {
		const [processId, stream, line] = payload;
		const logLine: ProcessLogLine = { stream, text: line };
		const existing = logLines.get(processId) ?? [];
		const updated = [...existing, logLine];
		if (updated.length > maxFrontendLogLines) {
			updated.splice(0, updated.length - maxFrontendLogLines);
		}
		logLines.set(processId, updated);
	}

	// ─── Public interface ──────────────────────────────────────────────────

	const publicApi = {
		get processes() {
			return processes;
		},
		get processesByIssueId() {
			return processesByIssueId;
		},
		get logLines() {
			return logLines;
		},
		get activeLogViewerProcessId() {
			return activeLogViewerProcessId;
		},

		openLogViewer(processId: string) {
			activeLogViewerProcessId = processId;
		},

		closeLogViewer() {
			activeLogViewerProcessId = null;
		},

		async loadProcesses() {
			processes = await invoke<RunningProcess[]>('get_running_processes');
		},

		async runCommand(commandId: string, issueId: string): Promise<RunningProcess | null> {
			const process = await invoke<RunningProcess | null>('run_workspace_command', {
				command_id: commandId,
				issue_id: issueId,
			});
			if (process) {
				processes = [...processes, process];
			}
			return process;
		},

		async killProcess(processId: string): Promise<void> {
			await invoke('kill_workspace_process', { process_id: processId });
			const process = processes.find((p) => p.process_id === processId);
			if (process) {
				process.status = 'stopped';
			}
		},

		async getProcessLogs(processId: string): Promise<string[]> {
			return invoke<string[]>('get_process_logs', { process_id: processId });
		},

		async getFullProcessLogs(processId: string): Promise<string> {
			return invoke<string>('get_full_process_logs', { process_id: processId });
		},

		async testCommand(commandId: string, dashboardId: string): Promise<string> {
			const testProcessId = await invoke<string>('test_workspace_command', {
				command_id: commandId,
				dashboard_id: dashboardId,
			});
			logLines.set(testProcessId, []);
			activeLogViewerProcessId = testProcessId;
			return testProcessId;
		},
	};

	return {
		publicApi,
		handlePortDetected,
		handleProcessExited,
		handleProcessOutput,
		handleProcessRestarted,
	};
}
