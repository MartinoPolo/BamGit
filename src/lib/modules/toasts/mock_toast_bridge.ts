import type { ToastTone } from '$lib/components/ui/toast/index.js';

type ShowFn = (item: { tone: ToastTone; title: string; body?: string }) => void;

let showFn: ShowFn | null = null;

const DEDUP_MS = 3000;
const lastFired = new Map<string, number>();

const COMMAND_LABELS: Record<string, string> = {
	setup_worktree: 'Worktree setup',
	remove_worktree: 'Worktree removal',
	open_terminal: 'Opening terminal',
	terminate_session: 'Session termination',
	interrupt_session: 'Session interrupt',
	send_message: 'Sending message to session',
	adopt_session: 'Session adoption',
	spawn_session: 'Spawning session',
	sync_all_github_state: 'GitHub sync',
	execute_action: 'Action execution',
	open_workspace_window: 'Opening workspace window',
};

export const TAURI_ONLY_COMMANDS: ReadonlySet<string> = new Set(Object.keys(COMMAND_LABELS));

export function registerMockToastBridge(fn: ShowFn): void {
	showFn = fn;
}

export function showMockToast(command: string): void {
	if (showFn === null) {
		return;
	}

	const now = Date.now();
	const last = lastFired.get(command);
	if (last !== undefined && now - last < DEDUP_MS) {
		return;
	}
	lastFired.set(command, now);

	const label = COMMAND_LABELS[command] ?? command;
	showFn({
		tone: 'warning',
		title: 'Desktop app required',
		body: `${label} is simulated in browser mode`,
	});
}
