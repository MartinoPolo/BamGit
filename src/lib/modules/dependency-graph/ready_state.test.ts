import { describe, it, expect } from 'vitest';
import type { Issue } from '$lib/modules/issues';
import {
	classifyReadyState,
	buildOpenBlockerCounts,
	hasLabel,
	isClosedIssue,
	READY_STATE,
	DESIGN_NEEDED_LABEL,
} from './ready_state';

function makeIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 'issue-1',
		dashboard_id: 'dash-1',
		name: 'Test issue',
		priority: null,
		color: null,
		status: 'active',
		github_issue_url: null,
		github_issue_number: null,
		branch_name: null,
		base_branch: null,
		worktree_folder: null,
		worktree_state: 'none',
		parent_issue_id: null,
		editor_folder: null,
		dev_server_command: null,
		dev_server_port: null,
		dev_server_pid: null,
		browser_url: null,
		labels: [],
		sort_order: 0,
		created_at: '2026-01-01T00:00:00Z',
		character_pack_id: null,
		character_avatar: null,
		is_sound_muted: false,
		...overrides,
	};
}

describe('hasLabel', () => {
	it('returns true when label is present', () => {
		const issue = makeIssue({ labels: [{ name: 'AFK', color: '#000' }] });
		expect(hasLabel(issue, 'AFK')).toBe(true);
	});

	it('returns false when label is absent', () => {
		const issue = makeIssue({ labels: [{ name: 'task', color: '#000' }] });
		expect(hasLabel(issue, 'AFK')).toBe(false);
	});
});

describe('isClosedIssue', () => {
	it('returns true for archived', () => {
		expect(isClosedIssue(makeIssue({ status: 'archived' }))).toBe(true);
	});

	it('returns false for active', () => {
		expect(isClosedIssue(makeIssue({ status: 'active' }))).toBe(false);
	});
});

describe('classifyReadyState', () => {
	it('returns none for closed issue regardless of labels', () => {
		const issue = makeIssue({ status: 'archived', labels: [{ name: 'AFK', color: '#000' }] });
		expect(classifyReadyState({ issue, hasOpenBlockers: false })).toBe(READY_STATE.none);
	});

	it('returns needs-design when design-needed label present (overrides AFK)', () => {
		const issue = makeIssue({
			labels: [
				{ name: DESIGN_NEEDED_LABEL, color: '#000' },
				{ name: 'AFK', color: '#000' },
			],
		});
		expect(classifyReadyState({ issue, hasOpenBlockers: false })).toBe(READY_STATE.needsDesign);
	});

	it('returns ready-to-execute when AFK + open + no blockers', () => {
		const issue = makeIssue({ labels: [{ name: 'AFK', color: '#000' }] });
		expect(classifyReadyState({ issue, hasOpenBlockers: false })).toBe(
			READY_STATE.readyToExecute,
		);
	});

	it('returns none when AFK but has open blockers', () => {
		const issue = makeIssue({ labels: [{ name: 'AFK', color: '#000' }] });
		expect(classifyReadyState({ issue, hasOpenBlockers: true })).toBe(READY_STATE.none);
	});

	it('returns ready-to-grill when HITL + open + no blockers', () => {
		const issue = makeIssue({ labels: [{ name: 'HITL', color: '#000' }] });
		expect(classifyReadyState({ issue, hasOpenBlockers: false })).toBe(
			READY_STATE.readyToGrill,
		);
	});

	it('returns none when HITL but blocked', () => {
		const issue = makeIssue({ labels: [{ name: 'HITL', color: '#000' }] });
		expect(classifyReadyState({ issue, hasOpenBlockers: true })).toBe(READY_STATE.none);
	});

	it('returns none when no special label', () => {
		const issue = makeIssue({ labels: [{ name: 'task', color: '#000' }] });
		expect(classifyReadyState({ issue, hasOpenBlockers: false })).toBe(READY_STATE.none);
	});
});

describe('buildOpenBlockerCounts', () => {
	it('counts open blockers per blocked issue', () => {
		const issues = [makeIssue({ id: 'a' }), makeIssue({ id: 'b' }), makeIssue({ id: 'c' })];
		const deps = [
			{ blocker_issue_id: 'a', blocked_issue_id: 'c' },
			{ blocker_issue_id: 'b', blocked_issue_id: 'c' },
		];
		const counts = buildOpenBlockerCounts(issues, deps);
		expect(counts.get('c')).toBe(2);
	});

	it('excludes closed blockers from count', () => {
		const issues = [
			makeIssue({ id: 'a', status: 'archived' }),
			makeIssue({ id: 'b' }),
			makeIssue({ id: 'c' }),
		];
		const deps = [
			{ blocker_issue_id: 'a', blocked_issue_id: 'c' },
			{ blocker_issue_id: 'b', blocked_issue_id: 'c' },
		];
		const counts = buildOpenBlockerCounts(issues, deps);
		expect(counts.get('c')).toBe(1);
	});

	it('returns 0 (missing key) when no blockers', () => {
		const issues = [makeIssue({ id: 'a' })];
		const counts = buildOpenBlockerCounts(issues, []);
		expect(counts.get('a') ?? 0).toBe(0);
	});

	it('skips dependencies referencing missing issues', () => {
		const issues = [makeIssue({ id: 'b' })];
		const deps = [{ blocker_issue_id: 'missing', blocked_issue_id: 'b' }];
		const counts = buildOpenBlockerCounts(issues, deps);
		expect(counts.get('b') ?? 0).toBe(0);
	});
});
