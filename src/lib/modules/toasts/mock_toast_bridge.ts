type ShowFn = (title: string, body: string) => void;

let showFn: ShowFn | null = null;

export function registerMockToastBridge(fn: ShowFn): void {
	showFn = fn;
}

// ─── Command labels ──────────────────────────────────────────────────────────

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
};

// ─── Dedup ───────────────────────────────────────────────────────────────────

const DEDUP_MS = 3000;
const lastShown = new Map<string, number>();

export function showMockToast(command: string): void {
	if (showFn === null) {
		return;
	}

	const now = Date.now();
	const last = lastShown.get(command) ?? 0;
	if (now - last < DEDUP_MS) {
		return;
	}
	lastShown.set(command, now);

	const body = COMMAND_BODIES[command] ?? `${command} is simulated in browser mode`;
	showFn('Desktop app required', body);
}
