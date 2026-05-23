import { describe, it, expect } from 'vitest';
import type { WorkspaceCommand, RunningProcess } from '$lib/types/generated';
import { resolveCommandEntry, groupCommandEntries } from './command_submenu_utils.js';

function makeCommand(overrides: Partial<WorkspaceCommand> = {}): WorkspaceCommand {
	return {
		id: 'cmd-1',
		dashboard_id: 'dash-1',
		category: 'server',
		name: 'Dev Server',
		command: 'npm run dev',
		port_pattern: null,
		expected_exit_code: 0,
		sort_order: 0,
		mode: 'headless',
		restart_policy: 'never',
		max_restart_count: 3,
		backoff_base_delay_ms: 1000,
		timeout_seconds: null,
		...overrides,
	};
}

function makeProcess(overrides: Partial<RunningProcess> = {}): RunningProcess {
	return {
		process_id: 'proc-1',
		command_id: 'cmd-1',
		issue_id: 'issue-1',
		category: 'server',
		name: 'Dev Server',
		pid: 1234,
		port: 3000,
		status: 'running',
		restart_count: 0,
		max_restarts: 3,
		...overrides,
	};
}

describe('resolveCommandEntry', () => {
	it('returns idle state when no matching process exists', () => {
		const command = makeCommand({ id: 'cmd-1' });
		const processes: RunningProcess[] = [];

		const result = resolveCommandEntry(command, processes, 'issue-1');

		expect(result).toEqual({
			command,
			state: 'idle',
			process: null,
			port: null,
		});
	});

	it('returns process status when a matching process exists', () => {
		const command = makeCommand({ id: 'cmd-1' });
		const process = makeProcess({
			command_id: 'cmd-1',
			issue_id: 'issue-1',
			status: 'running',
			port: 3000,
		});

		const result = resolveCommandEntry(command, [process], 'issue-1');

		expect(result).toEqual({
			command,
			state: 'running',
			process,
			port: 3000,
		});
	});

	it('does not match a process with same command_id but different issue_id', () => {
		const command = makeCommand({ id: 'cmd-1' });
		const process = makeProcess({
			command_id: 'cmd-1',
			issue_id: 'issue-other',
			status: 'running',
		});

		const result = resolveCommandEntry(command, [process], 'issue-1');

		expect(result).toEqual({
			command,
			state: 'idle',
			process: null,
			port: null,
		});
	});
});

describe('groupCommandEntries', () => {
	it('groups server commands first, check commands second', () => {
		const serverCommand = makeCommand({ id: 'cmd-1', category: 'server', sort_order: 0 });
		const checkCommand = makeCommand({ id: 'cmd-2', category: 'check', sort_order: 0 });

		const result = groupCommandEntries([checkCommand, serverCommand], [], 'issue-1');

		expect(result).toHaveLength(2);
		expect(result[0].category).toBe('server');
		expect(result[1].category).toBe('check');
	});

	it('sorts entries by sort_order within each group', () => {
		const commandB = makeCommand({
			id: 'cmd-b',
			category: 'check',
			sort_order: 2,
			name: 'Lint',
		});
		const commandA = makeCommand({
			id: 'cmd-a',
			category: 'check',
			sort_order: 1,
			name: 'Typecheck',
		});
		const commandC = makeCommand({
			id: 'cmd-c',
			category: 'check',
			sort_order: 0,
			name: 'Format',
		});

		const result = groupCommandEntries([commandB, commandA, commandC], [], 'issue-1');

		expect(result[0].entries.map((entry) => entry.command.name)).toEqual([
			'Format',
			'Typecheck',
			'Lint',
		]);
	});

	it('omits empty groups when a category has no commands', () => {
		const checkCommand = makeCommand({ id: 'cmd-1', category: 'check', sort_order: 0 });

		const result = groupCommandEntries([checkCommand], [], 'issue-1');

		expect(result).toHaveLength(1);
		expect(result[0].category).toBe('check');
	});

	it('sets hasRunnable to true when any entry is idle or stopped', () => {
		const idleCommand = makeCommand({ id: 'cmd-1', category: 'server', sort_order: 0 });
		const runningCommand = makeCommand({ id: 'cmd-2', category: 'server', sort_order: 1 });
		const runningProcess = makeProcess({
			command_id: 'cmd-2',
			issue_id: 'issue-1',
			status: 'running',
		});

		const result = groupCommandEntries(
			[idleCommand, runningCommand],
			[runningProcess],
			'issue-1',
		);

		expect(result[0].hasRunnable).toBe(true);
	});

	it('sets hasRunning to true when any entry is running', () => {
		const command = makeCommand({ id: 'cmd-1', category: 'server', sort_order: 0 });
		const process = makeProcess({
			command_id: 'cmd-1',
			issue_id: 'issue-1',
			status: 'running',
		});

		const result = groupCommandEntries([command], [process], 'issue-1');

		expect(result[0].hasRunning).toBe(true);
	});

	it('sets hasRunnable to false when all entries are running/passed/failed/timeout', () => {
		const commandA = makeCommand({ id: 'cmd-1', category: 'check', sort_order: 0 });
		const commandB = makeCommand({ id: 'cmd-2', category: 'check', sort_order: 1 });
		const processA = makeProcess({
			command_id: 'cmd-1',
			issue_id: 'issue-1',
			status: 'running',
		});
		const processB = makeProcess({
			process_id: 'proc-2',
			command_id: 'cmd-2',
			issue_id: 'issue-1',
			status: 'passed',
		});

		const result = groupCommandEntries([commandA, commandB], [processA, processB], 'issue-1');

		expect(result[0].hasRunnable).toBe(false);
	});

	it('sets hasRunning to false when no entries are running', () => {
		const commandA = makeCommand({ id: 'cmd-1', category: 'check', sort_order: 0 });
		const commandB = makeCommand({ id: 'cmd-2', category: 'check', sort_order: 1 });
		const processB = makeProcess({
			process_id: 'proc-2',
			command_id: 'cmd-2',
			issue_id: 'issue-1',
			status: 'passed',
		});

		const result = groupCommandEntries([commandA, commandB], [processB], 'issue-1');

		expect(result[0].hasRunning).toBe(false);
	});

	it('labels groups as "Servers" and "Checks"', () => {
		const serverCommand = makeCommand({ id: 'cmd-1', category: 'server', sort_order: 0 });
		const checkCommand = makeCommand({ id: 'cmd-2', category: 'check', sort_order: 0 });

		const result = groupCommandEntries([serverCommand, checkCommand], [], 'issue-1');

		expect(result[0].label).toBe('Servers');
		expect(result[1].label).toBe('Checks');
	});
});
