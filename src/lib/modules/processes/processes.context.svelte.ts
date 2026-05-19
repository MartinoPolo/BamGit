import { createContext, onMount, onDestroy } from 'svelte';
import { invoke, listen, type UnlistenFn } from '$lib/tauri.js';
import type { ProcessStatus, RunningProcess } from '$lib/types/generated';
import { SvelteMap } from 'svelte/reactivity';

// ─── Event payload types ───────────────────────────────────────────────────

type ProcessPortDetectedPayload = [string, number];
type ProcessExitedPayload = [string, ProcessStatus];

// ─── Context ───────────────────────────────────────────────────────────────

type ProcessesContext = ReturnType<typeof createProcessesContext>['publicApi'];

const [useProcesses, setProcessesInternal] = createContext<ProcessesContext>();
export { useProcesses };

export function setProcessesContext() {
	const { publicApi, handlePortDetected, handleProcessExited } = createProcessesContext();
	setProcessesInternal(publicApi);

	let cancelled = false;
	let unlistenPort: UnlistenFn | null = null;
	let unlistenExited: UnlistenFn | null = null;

	onMount(async () => {
		void publicApi.loadProcesses();

		const [portUn, exitedUn] = await Promise.all([
			listen<ProcessPortDetectedPayload>('process-port-detected', (event) => {
				handlePortDetected(event.payload);
			}),
			listen<ProcessExitedPayload>('process-exited', (event) => {
				handleProcessExited(event.payload);
			}),
		]);

		if (cancelled) {
			portUn();
			exitedUn();
			return;
		}

		unlistenPort = portUn;
		unlistenExited = exitedUn;
	});

	onDestroy(() => {
		cancelled = true;
		unlistenPort?.();
		unlistenExited?.();
	});

	return publicApi;
}

// ─── Factory ───────────────────────────────────────────────────────────────

/** @internal - exported only for testing */
export function createProcessesContext() {
	let processes = $state<RunningProcess[]>([]);

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

	// ─── Public interface ──────────────────────────────────────────────────

	const publicApi = {
		get processes() {
			return processes;
		},
		get processesByIssueId() {
			return processesByIssueId;
		},

		async loadProcesses() {
			processes = await invoke<RunningProcess[]>('get_running_processes');
		},

		async runCommand(commandId: string, issueId: string): Promise<RunningProcess> {
			const process = await invoke<RunningProcess>('run_workspace_command', {
				command_id: commandId,
				issue_id: issueId,
			});
			processes = [...processes, process];
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
	};

	return { publicApi, handlePortDetected, handleProcessExited };
}
