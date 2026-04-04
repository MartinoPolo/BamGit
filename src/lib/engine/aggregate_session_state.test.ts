import { describe, it, expect } from 'vitest';
import { aggregate_session_state } from './aggregate_session_state';
import type { SessionState } from '$lib/types/session';

describe('aggregate_session_state', () => {
	it('returns no-session for empty array', () => {
		expect(aggregate_session_state([])).toBe('no-session');
	});

	it('returns running for single running session', () => {
		expect(aggregate_session_state(['running'])).toBe('running');
	});

	it('returns needs-input for single needs-input session', () => {
		expect(aggregate_session_state(['needs-input'])).toBe('needs-input');
	});

	it('returns errored for single errored session', () => {
		expect(aggregate_session_state(['errored'])).toBe('errored');
	});

	it('returns needs-review for single needs-review session', () => {
		expect(aggregate_session_state(['needs-review'])).toBe('needs-review');
	});

	it('returns paused for single paused session', () => {
		expect(aggregate_session_state(['paused'])).toBe('paused');
	});

	it('returns finished for single finished session', () => {
		expect(aggregate_session_state(['finished'])).toBe('finished');
	});

	it('needs-input wins over running', () => {
		expect(aggregate_session_state(['running', 'needs-input'])).toBe('needs-input');
	});

	it('errored wins over finished', () => {
		expect(aggregate_session_state(['finished', 'errored'])).toBe('errored');
	});

	it('needs-review wins over paused and running', () => {
		expect(aggregate_session_state(['paused', 'running', 'needs-review'])).toBe('needs-review');
	});

	it('errored wins over needs-review', () => {
		expect(aggregate_session_state(['needs-review', 'errored'])).toBe('errored');
	});

	it('needs-input is highest priority across all states', () => {
		const sessions: readonly SessionState[] = [
			'finished',
			'paused',
			'running',
			'errored',
			'needs-input',
		];
		expect(aggregate_session_state(sessions)).toBe('needs-input');
	});

	it('returns finished when all sessions are finished', () => {
		expect(aggregate_session_state(['finished', 'finished', 'finished'])).toBe('finished');
	});

	it('running wins over finished', () => {
		expect(aggregate_session_state(['finished', 'running'])).toBe('running');
	});
});
