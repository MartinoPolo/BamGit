import { describe, it, expect } from 'vitest';
import { serializeLabels, toIssue } from './serialization.js';
import type { Issue as GeneratedIssue } from '$lib/types/generated';
import type { IssueLabel } from './types.js';

function makeRawIssue(overrides: Partial<GeneratedIssue> = {}): GeneratedIssue {
	return {
		id: 'issue-1',
		dashboard_id: 'dash-1',
		name: 'Test Issue',
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
		labels: null,
		sort_order: 0,
		created_at: '2026-01-01T00:00:00Z',
		character_pack_id: null,
		character_avatar: null,
		is_sound_muted: false,
		...overrides,
	};
}

describe('serializeLabels', () => {
	it('serializes labels array to JSON string', () => {
		const labels: IssueLabel[] = [
			{ name: 'bug', color: '#ff0000' },
			{ name: 'AFK', color: '#00ff00' },
		];
		const result = serializeLabels(labels);
		expect(result).toBe(JSON.stringify(labels));
	});

	it('returns undefined when labels is undefined (no-op for partial updates)', () => {
		expect(serializeLabels(undefined)).toBeUndefined();
	});

	it('serializes empty array to "[]"', () => {
		expect(serializeLabels([])).toBe('[]');
	});
});

describe('toIssue — label deserialization', () => {
	it('deserializes labels from JSON string to IssueLabel[]', () => {
		const raw = makeRawIssue({
			labels: JSON.stringify([{ name: 'bug', color: '#ff0000' }]),
		});
		const issue = toIssue(raw);
		expect(issue.labels).toEqual([{ name: 'bug', color: '#ff0000' }]);
	});

	it('returns empty array when labels is null', () => {
		const raw = makeRawIssue({ labels: null });
		const issue = toIssue(raw);
		expect(issue.labels).toEqual([]);
	});

	it('returns empty array when labels is invalid JSON', () => {
		const raw = makeRawIssue({ labels: 'not-json' });
		const issue = toIssue(raw);
		expect(issue.labels).toEqual([]);
	});

	it('returns empty array when labels JSON is not an array', () => {
		const raw = makeRawIssue({ labels: '{"name": "bug"}' });
		const issue = toIssue(raw);
		expect(issue.labels).toEqual([]);
	});

	it('defaults invalid hex colors to #808080', () => {
		const raw = makeRawIssue({
			labels: JSON.stringify([{ name: 'bug', color: 'not-a-color' }]),
		});
		const issue = toIssue(raw);
		expect(issue.labels[0].color).toBe('#808080');
	});

	it('preserves valid hex colors', () => {
		const raw = makeRawIssue({
			labels: JSON.stringify([{ name: 'bug', color: '#aaBB11' }]),
		});
		const issue = toIssue(raw);
		expect(issue.labels[0].color).toBe('#aaBB11');
	});
});

describe('toIssue — priority validation', () => {
	it('validates known priority values', () => {
		for (const priority of ['lowest', 'low', 'medium', 'high', 'top']) {
			const issue = toIssue(makeRawIssue({ priority }));
			expect(issue.priority).toBe(priority);
		}
	});

	it('returns null for unknown priority', () => {
		const issue = toIssue(makeRawIssue({ priority: 'critical' }));
		expect(issue.priority).toBeNull();
	});

	it('returns null for null priority', () => {
		const issue = toIssue(makeRawIssue({ priority: null }));
		expect(issue.priority).toBeNull();
	});
});

describe('toIssue — status validation', () => {
	it('validates known status values', () => {
		expect(toIssue(makeRawIssue({ status: 'active' })).status).toBe('active');
		expect(toIssue(makeRawIssue({ status: 'archived' })).status).toBe('archived');
	});

	it('defaults unknown status to active', () => {
		const issue = toIssue(makeRawIssue({ status: 'deleted' }));
		expect(issue.status).toBe('active');
	});
});

describe('toIssue — worktree_state validation', () => {
	it('validates all known worktree states', () => {
		for (const state of ['none', 'pending', 'active', 'failed', 'removing', 'removed']) {
			const issue = toIssue(makeRawIssue({ worktree_state: state }));
			expect(issue.worktree_state).toBe(state);
		}
	});

	it('defaults unknown worktree state to none', () => {
		const issue = toIssue(makeRawIssue({ worktree_state: 'broken' }));
		expect(issue.worktree_state).toBe('none');
	});
});

describe('serializeLabels + toIssue round-trip', () => {
	it('labels survive a serialize → deserialize round-trip', () => {
		const labels: IssueLabel[] = [
			{ name: 'AFK', color: '#00ff00' },
			{ name: 'area:ui', color: '#ff8800' },
		];
		const serialized = serializeLabels(labels);
		const raw = makeRawIssue({ labels: serialized as string });
		const issue = toIssue(raw);
		expect(issue.labels).toEqual(labels);
	});
});
