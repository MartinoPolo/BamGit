type ShowFn = (title: string, body: string) => void;

let showFn: ShowFn | null = null;

export function registerMockToastBridge(fn: ShowFn): void {
	showFn = fn;
}

// ─── Label helpers ───────────────────────────────────────────────────────────

function formatCommandLabel(value: string): string {
	const spaced = value.replace(/[_-]/g, ' ');
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function resolveTitle(command: string, args?: Record<string, unknown>): string {
	if (command === 'execute_action' && typeof args?.actionId === 'string') {
		return `${formatCommandLabel(args.actionId)} is not available`;
	}
	return `${formatCommandLabel(command)} is not available`;
}

// ─── Command descriptions ────────────────────────────────────────────────────

const COMMAND_BODIES: Record<string, string> = {
	setup_worktree: 'Worktree setup is simulated in browser mode',
	remove_worktree: 'Worktree removal is simulated in browser mode',
	open_terminal: 'Opening a terminal requires the desktop app',
	terminate_session: 'Session termination is simulated in browser mode',
	interrupt_session: 'Session interrupt is simulated in browser mode',
	send_message: 'Sending messages requires the desktop app',
	adopt_session: 'Session adoption is simulated in browser mode',
	spawn_session: 'Spawning sessions requires the desktop app',
	sync_all_github_state: 'GitHub sync requires the desktop app',
	execute_action: 'Running actions requires the desktop app',
	open_workspace_window: 'Opening workspace windows requires the desktop app',
	update_peacock_color: 'Peacock color sync requires the desktop app',
	pick_folder: 'Folder picker requires the desktop app',
	open_path: 'Opening local folders requires the desktop app',
	discover_ai_config: 'AI config discovery requires the desktop app',
	run_workspace_command: 'Running commands requires the desktop app',
	kill_workspace_process: 'Killing processes requires the desktop app',
};

export function showMockToast(command: string, args?: Record<string, unknown>): void {
	if (showFn === null) {
		return;
	}

	const title = resolveTitle(command, args);
	const body = COMMAND_BODIES[command] ?? `${command} is simulated in browser mode`;
	showFn(title, body);
}
