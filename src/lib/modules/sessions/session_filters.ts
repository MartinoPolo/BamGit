import type { Session } from '$lib/types/generated';

export function filterActiveSessions(sessions: readonly Session[]): Session[] {
	return sessions.filter(
		(session) => session.state !== 'finished' && session.state !== 'errored',
	);
}

export function filterFinishedSessions(sessions: readonly Session[]): Session[] {
	return sessions.filter(
		(session) => session.state === 'finished' || session.state === 'errored',
	);
}

export function groupSessionsByIssueId(sessions: readonly Session[]): Map<string, Session[]> {
	const map = new Map<string, Session[]>();
	for (const session of sessions) {
		if (session.issue_id === null) {
			continue;
		}
		const existing = map.get(session.issue_id);
		if (existing !== undefined) {
			existing.push(session);
		} else {
			map.set(session.issue_id, [session]);
		}
	}
	return map;
}
