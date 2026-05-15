import { describe, it, expect } from 'vitest';
import type { Session } from '$lib/types/generated';
import {
	filterActiveSessions,
	filterFinishedSessions,
	groupSessionsByIssueId,
} from './session_filters.js';

function makeSession(overrides: Partial<Session> = {}): Session {
	return {
		id: 'session-1',
		issue_id: null,
		provider: 'claude-code',
		state: 'running',
		pid: null,
		cli_session_id: null,
		started_at: '2026-01-01T00:00:00Z',
		ended_at: null,
		cost_usd: null,
		token_count: null,
		original_intent: null,
		last_prompt: null,
		last_response_summary: null,
		execution_phase: 'none',
		source: 'spawned',
		working_directory: null,
		...overrides,
	};
}

describe('filterActiveSessions', () => {
	it('excludes sessions with state=finished', () => {
		const sessions = [
			makeSession({ id: 'a', state: 'running' }),
			makeSession({ id: 'b', state: 'finished' }),
		];
		const active = filterActiveSessions(sessions);
		expect(active.map((s) => s.id)).toEqual(['a']);
	});

	it('excludes sessions with state=errored', () => {
		const sessions = [
			makeSession({ id: 'a', state: 'needs-input' }),
			makeSession({ id: 'b', state: 'errored' }),
		];
		const active = filterActiveSessions(sessions);
		expect(active.map((s) => s.id)).toEqual(['a']);
	});

	it('includes running, needs-input, needs-review, and paused states', () => {
		const sessions = [
			makeSession({ id: 'a', state: 'running' }),
			makeSession({ id: 'b', state: 'needs-input' }),
			makeSession({ id: 'c', state: 'needs-review' }),
			makeSession({ id: 'd', state: 'paused' }),
		];
		const active = filterActiveSessions(sessions);
		expect(active.map((s) => s.id)).toEqual(['a', 'b', 'c', 'd']);
	});

	it('returns empty array when all sessions are terminal', () => {
		const sessions = [
			makeSession({ id: 'a', state: 'finished' }),
			makeSession({ id: 'b', state: 'errored' }),
		];
		expect(filterActiveSessions(sessions)).toEqual([]);
	});

	it('returns empty array for empty input', () => {
		expect(filterActiveSessions([])).toEqual([]);
	});
});

describe('filterFinishedSessions', () => {
	it('includes state=finished', () => {
		const sessions = [
			makeSession({ id: 'a', state: 'finished' }),
			makeSession({ id: 'b', state: 'running' }),
		];
		const finished = filterFinishedSessions(sessions);
		expect(finished.map((s) => s.id)).toEqual(['a']);
	});

	it('includes state=errored', () => {
		const sessions = [
			makeSession({ id: 'a', state: 'errored' }),
			makeSession({ id: 'b', state: 'needs-input' }),
		];
		const finished = filterFinishedSessions(sessions);
		expect(finished.map((s) => s.id)).toEqual(['a']);
	});

	it('excludes all non-terminal states', () => {
		const sessions = [
			makeSession({ id: 'a', state: 'running' }),
			makeSession({ id: 'b', state: 'needs-input' }),
			makeSession({ id: 'c', state: 'paused' }),
		];
		expect(filterFinishedSessions(sessions)).toEqual([]);
	});
});

describe('groupSessionsByIssueId', () => {
	it('groups sessions by issue_id', () => {
		const sessions = [
			makeSession({ id: 's1', issue_id: 'issue-a' }),
			makeSession({ id: 's2', issue_id: 'issue-b' }),
			makeSession({ id: 's3', issue_id: 'issue-a' }),
		];
		const grouped = groupSessionsByIssueId(sessions);
		expect(grouped.get('issue-a')?.map((s) => s.id)).toEqual(['s1', 's3']);
		expect(grouped.get('issue-b')?.map((s) => s.id)).toEqual(['s2']);
	});

	it('excludes sessions with null issue_id', () => {
		const sessions = [
			makeSession({ id: 's1', issue_id: 'issue-a' }),
			makeSession({ id: 's2', issue_id: null }),
			makeSession({ id: 's3', issue_id: null }),
		];
		const grouped = groupSessionsByIssueId(sessions);
		expect(grouped.size).toBe(1);
		expect(grouped.has('issue-a')).toBe(true);
	});

	it('returns empty map when all sessions have null issue_id', () => {
		const sessions = [
			makeSession({ id: 's1', issue_id: null }),
			makeSession({ id: 's2', issue_id: null }),
		];
		expect(groupSessionsByIssueId(sessions).size).toBe(0);
	});

	it('returns empty map for empty input', () => {
		expect(groupSessionsByIssueId([]).size).toBe(0);
	});
});
