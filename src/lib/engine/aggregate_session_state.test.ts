import { describe, it, expect } from 'vitest';
import { aggregateSessionState } from './aggregate_session_state';
import type { SessionState } from '$lib/types/session';

describe('aggregateSessionState', () => {
	it('returns no-session for empty array', () => {
		expect(aggregateSessionState([])).toBe('no-session');
	});

	it('returns running for single running session', () => {
		expect(aggregateSessionState(['running'])).toBe('running');
	});

	it('returns needs-input for single needs-input session', () => {
		expect(aggregateSessionState(['needs-input'])).toBe('needs-input');
	});

	it('returns errored for single errored session', () => {
		expect(aggregateSessionState(['errored'])).toBe('errored');
	});

	it('returns needs-review for single needs-review session', () => {
		expect(aggregateSessionState(['needs-review'])).toBe('needs-review');
	});

	it('returns paused for single paused session', () => {
		expect(aggregateSessionState(['paused'])).toBe('paused');
	});

	it('returns finished for single finished session', () => {
		expect(aggregateSessionState(['finished'])).toBe('finished');
	});

	it('needs-input wins over running', () => {
		expect(aggregateSessionState(['running', 'needs-input'])).toBe('needs-input');
	});

	it('errored wins over finished', () => {
		expect(aggregateSessionState(['finished', 'errored'])).toBe('errored');
	});

	it('needs-review wins over paused and running', () => {
		expect(aggregateSessionState(['paused', 'running', 'needs-review'])).toBe('needs-review');
	});

	it('errored wins over needs-review', () => {
		expect(aggregateSessionState(['needs-review', 'errored'])).toBe('errored');
	});

	it('needs-input is highest priority across all states', () => {
		const sessions: readonly SessionState[] = [
			'finished',
			'paused',
			'running',
			'errored',
			'needs-input',
		];
		expect(aggregateSessionState(sessions)).toBe('needs-input');
	});

	it('returns finished when all sessions are finished', () => {
		expect(aggregateSessionState(['finished', 'finished', 'finished'])).toBe('finished');
	});

	it('running wins over finished', () => {
		expect(aggregateSessionState(['finished', 'running'])).toBe('running');
	});
});
