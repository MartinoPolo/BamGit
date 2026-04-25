import type { SessionState } from '$lib/types/session';
import type { AggregateSessionState } from '$lib/types/tree_visualization';

const PRIORITY: readonly SessionState[] = [
	'needs-input',
	'errored',
	'needs-review',
	'running',
	'paused',
	'finished',
];

export function aggregateSessionState(sessions: readonly SessionState[]): AggregateSessionState {
	if (sessions.length === 0) {
		return 'no-session';
	}

	const stateSet = new Set(sessions);

	for (const state of PRIORITY) {
		if (stateSet.has(state)) {
			return state;
		}
	}

	return 'no-session';
}
