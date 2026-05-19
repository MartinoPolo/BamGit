import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ProcessStatus, RunningProcess } from '$lib/types/generated';

const MOCK_PROCESS: RunningProcess = {
	process_id: 'proc-1',
	command_id: 'cmd-1',
	issue_id: 'issue-1',
	category: 'check',
	name: 'test',
	pid: 1234,
	port: null,
	status: 'running' as ProcessStatus,
};

const MOCK_PROCESS_2: RunningProcess = {
	process_id: 'proc-2',
	command_id: 'cmd-2',
	issue_id: 'issue-1',
	category: 'server',
	name: 'dev',
	pid: 5678,
	port: 3000,
	status: 'running' as ProcessStatus,
};

const mockInvoke = vi.fn();
const mockListen = vi.fn().mockResolvedValue(() => {});

vi.mock('$lib/tauri.js', () => ({
	invoke: (...args: unknown[]) => mockInvoke(...args),
	listen: (...args: unknown[]) => mockListen(...args),
	isTauri: vi.fn().mockReturnValue(false),
}));

describe('processes context (factory)', () => {
	beforeEach(() => {
		mockInvoke.mockReset();
		mockListen.mockReset().mockResolvedValue(() => {});
	});

	async function createCtx() {
		const { createProcessesContext } = await import('./processes.context.svelte.js');
		return createProcessesContext();
	}

	it('loadProcesses calls get_running_processes and populates state', async () => {
		mockInvoke.mockResolvedValue([MOCK_PROCESS, MOCK_PROCESS_2]);
		const { publicApi } = await createCtx();

		await publicApi.loadProcesses();

		expect(mockInvoke).toHaveBeenCalledWith('get_running_processes');
		expect(publicApi.processes).toHaveLength(2);
	});

	it('runCommand invokes and adds process to state', async () => {
		mockInvoke.mockResolvedValue(MOCK_PROCESS);
		const { publicApi } = await createCtx();

		const result = await publicApi.runCommand('cmd-1', 'issue-1');
		expect(mockInvoke).toHaveBeenCalledWith('run_workspace_command', {
			command_id: 'cmd-1',
			issue_id: 'issue-1',
		});
		expect(result).toEqual(MOCK_PROCESS);
		expect(publicApi.processes).toHaveLength(1);
	});

	it('killProcess invokes and updates status to stopped', async () => {
		mockInvoke.mockResolvedValueOnce(MOCK_PROCESS).mockResolvedValueOnce(undefined);
		const { publicApi } = await createCtx();

		await publicApi.runCommand('cmd-1', 'issue-1');
		await publicApi.killProcess('proc-1');

		expect(mockInvoke).toHaveBeenCalledWith('kill_workspace_process', {
			process_id: 'proc-1',
		});
		const process = publicApi.processes.find((p) => p.process_id === 'proc-1');
		expect(process?.status).toBe('stopped');
	});

	it('getProcessLogs invokes with correct args', async () => {
		mockInvoke.mockResolvedValue(['line 1', 'line 2']);
		const { publicApi } = await createCtx();

		const logs = await publicApi.getProcessLogs('proc-1');
		expect(mockInvoke).toHaveBeenCalledWith('get_process_logs', { process_id: 'proc-1' });
		expect(logs).toEqual(['line 1', 'line 2']);
	});

	it('handleProcessExited updates process status', async () => {
		mockInvoke.mockResolvedValue(MOCK_PROCESS);
		const { publicApi, handleProcessExited } = await createCtx();

		await publicApi.runCommand('cmd-1', 'issue-1');
		handleProcessExited(['proc-1', 'passed']);

		const process = publicApi.processes.find((p) => p.process_id === 'proc-1');
		expect(process?.status).toBe('passed');
	});

	it('handlePortDetected updates process port', async () => {
		mockInvoke.mockResolvedValue(MOCK_PROCESS);
		const { publicApi, handlePortDetected } = await createCtx();

		await publicApi.runCommand('cmd-1', 'issue-1');
		handlePortDetected(['proc-1', 8080]);

		const process = publicApi.processes.find((p) => p.process_id === 'proc-1');
		expect(process?.port).toBe(8080);
	});
});
