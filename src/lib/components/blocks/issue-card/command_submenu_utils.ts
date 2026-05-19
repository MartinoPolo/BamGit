import type {
	CommandCategory,
	ProcessStatus,
	RunningProcess,
	WorkspaceCommand,
} from '$lib/types/generated';

/** @public */
export type CommandEntryState = 'idle' | ProcessStatus;

export interface CommandEntry {
	command: WorkspaceCommand;
	state: CommandEntryState;
	process: RunningProcess | null;
	port: number | null;
}

/** @public */
export interface CommandGroup {
	category: CommandCategory;
	label: string;
	entries: CommandEntry[];
	hasRunnable: boolean;
	hasRunning: boolean;
}

export function resolveCommandEntry(
	command: WorkspaceCommand,
	processes: readonly RunningProcess[],
	issueId: string,
): CommandEntry {
	const matchingProcess = processes.find(
		(process) => process.command_id === command.id && process.issue_id === issueId,
	);

	if (matchingProcess) {
		return {
			command,
			state: matchingProcess.status,
			process: matchingProcess,
			port: matchingProcess.port,
		};
	}

	return {
		command,
		state: 'idle',
		process: null,
		port: null,
	};
}

const CATEGORY_ORDER: readonly CommandCategory[] = ['server', 'check'] as const;

const CATEGORY_LABELS: Record<CommandCategory, string> = {
	server: 'Servers',
	check: 'Checks',
} as const;

export function groupCommandEntries(
	commands: readonly WorkspaceCommand[],
	processes: readonly RunningProcess[],
	issueId: string,
): CommandGroup[] {
	const groups: CommandGroup[] = [];

	for (const category of CATEGORY_ORDER) {
		const categoryCommands = commands
			.filter((command) => command.category === category)
			.sort((a, b) => a.sort_order - b.sort_order);

		if (categoryCommands.length === 0) {
			continue;
		}

		const entries = categoryCommands.map((command) =>
			resolveCommandEntry(command, processes, issueId),
		);

		const hasRunnable = entries.some(
			(entry) => entry.state === 'idle' || entry.state === 'stopped',
		);
		const hasRunning = entries.some((entry) => entry.state === 'running');

		groups.push({
			category,
			label: CATEGORY_LABELS[category],
			entries,
			hasRunnable,
			hasRunning,
		});
	}

	return groups;
}
