import { describe, it, expect } from 'vitest';
import type { Issue } from '$lib/modules/issues';
import type { IssueDependency } from '$lib/types/generated';
import {
	isPrdIssue,
	findPrdId,
	groupIssuesByPrd,
	isCrossPrdEdge,
	aggregatePrdEdges,
	buildIssuesById,
} from './prd_grouping';

function makeIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 'issue-1',
		dashboard_id: 'dash-1',
		name: 'Test',
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

const PRD_LABEL = { name: 'prd', color: '#000' };

describe('isPrdIssue', () => {
	it('returns true when prd label present', () => {
		expect(isPrdIssue(makeIssue({ labels: [PRD_LABEL] }))).toBe(true);
	});

	it('returns false otherwise', () => {
		expect(isPrdIssue(makeIssue({ labels: [{ name: 'task', color: '#000' }] }))).toBe(false);
	});
});

describe('findPrdId', () => {
	it('returns own id when issue is a PRD', () => {
		const prd = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const map = buildIssuesById([prd]);
		expect(findPrdId('prd-1', map)).toBe('prd-1');
	});

	it('returns parent PRD id for direct sub-issue', () => {
		const prd = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const child = makeIssue({ id: 'child-1', parent_issue_id: 'prd-1' });
		const map = buildIssuesById([prd, child]);
		expect(findPrdId('child-1', map)).toBe('prd-1');
	});

	it('walks chain to find ancestor PRD', () => {
		const prd = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const mid = makeIssue({ id: 'mid', parent_issue_id: 'prd-1' });
		const leaf = makeIssue({ id: 'leaf', parent_issue_id: 'mid' });
		const map = buildIssuesById([prd, mid, leaf]);
		expect(findPrdId('leaf', map)).toBe('prd-1');
	});

	it('returns null when no PRD ancestor exists', () => {
		const orphan = makeIssue({ id: 'orphan' });
		const map = buildIssuesById([orphan]);
		expect(findPrdId('orphan', map)).toBeNull();
	});

	it('handles parent cycle without infinite loop', () => {
		const a = makeIssue({ id: 'a', parent_issue_id: 'b' });
		const b = makeIssue({ id: 'b', parent_issue_id: 'a' });
		const map = buildIssuesById([a, b]);
		expect(findPrdId('a', map)).toBeNull();
	});
});

describe('groupIssuesByPrd', () => {
	it('groups sub-issues under their PRD', () => {
		const prd1 = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const prd2 = makeIssue({ id: 'prd-2', labels: [PRD_LABEL] });
		const a = makeIssue({ id: 'a', parent_issue_id: 'prd-1' });
		const b = makeIssue({ id: 'b', parent_issue_id: 'prd-1' });
		const c = makeIssue({ id: 'c', parent_issue_id: 'prd-2' });

		const { groups, orphans } = groupIssuesByPrd([prd1, prd2, a, b, c]);

		expect(orphans).toEqual([]);
		expect(groups).toHaveLength(2);
		const group1 = groups.find((g) => g.prd.id === 'prd-1')!;
		expect(group1.subIssues.map((i) => i.id).sort()).toEqual(['a', 'b']);
		const group2 = groups.find((g) => g.prd.id === 'prd-2')!;
		expect(group2.subIssues.map((i) => i.id)).toEqual(['c']);
	});

	it('returns issues without PRD as orphans', () => {
		const orphan = makeIssue({ id: 'orphan' });
		const { groups, orphans } = groupIssuesByPrd([orphan]);
		expect(groups).toEqual([]);
		expect(orphans.map((i) => i.id)).toEqual(['orphan']);
	});
});

describe('isCrossPrdEdge', () => {
	it('returns true when blocker and blocked are in different PRDs', () => {
		const prd1 = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const prd2 = makeIssue({ id: 'prd-2', labels: [PRD_LABEL] });
		const a = makeIssue({ id: 'a', parent_issue_id: 'prd-1' });
		const b = makeIssue({ id: 'b', parent_issue_id: 'prd-2' });
		const map = buildIssuesById([prd1, prd2, a, b]);
		const dep: IssueDependency = { id: 'd1', blocker_issue_id: 'a', blocked_issue_id: 'b' };
		expect(isCrossPrdEdge(dep, map)).toBe(true);
	});

	it('returns false within same PRD', () => {
		const prd1 = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const a = makeIssue({ id: 'a', parent_issue_id: 'prd-1' });
		const b = makeIssue({ id: 'b', parent_issue_id: 'prd-1' });
		const map = buildIssuesById([prd1, a, b]);
		const dep: IssueDependency = { id: 'd1', blocker_issue_id: 'a', blocked_issue_id: 'b' };
		expect(isCrossPrdEdge(dep, map)).toBe(false);
	});

	it('returns false when one side has no PRD', () => {
		const prd1 = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const a = makeIssue({ id: 'a', parent_issue_id: 'prd-1' });
		const orphan = makeIssue({ id: 'orphan' });
		const map = buildIssuesById([prd1, a, orphan]);
		const dep: IssueDependency = {
			id: 'd1',
			blocker_issue_id: 'a',
			blocked_issue_id: 'orphan',
		};
		expect(isCrossPrdEdge(dep, map)).toBe(false);
	});
});

describe('aggregatePrdEdges', () => {
	it('aggregates cross-PRD dependencies and counts', () => {
		const prd1 = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const prd2 = makeIssue({ id: 'prd-2', labels: [PRD_LABEL] });
		const a = makeIssue({ id: 'a', parent_issue_id: 'prd-1' });
		const b = makeIssue({ id: 'b', parent_issue_id: 'prd-1' });
		const c = makeIssue({ id: 'c', parent_issue_id: 'prd-2' });
		const map = buildIssuesById([prd1, prd2, a, b, c]);
		const deps: IssueDependency[] = [
			{ id: 'd1', blocker_issue_id: 'a', blocked_issue_id: 'c' },
			{ id: 'd2', blocker_issue_id: 'b', blocked_issue_id: 'c' },
		];
		const edges = aggregatePrdEdges(deps, map);
		expect(edges).toHaveLength(1);
		expect(edges[0]).toEqual({ blockerPrdId: 'prd-1', blockedPrdId: 'prd-2', count: 2 });
	});

	it('skips intra-PRD dependencies', () => {
		const prd1 = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const a = makeIssue({ id: 'a', parent_issue_id: 'prd-1' });
		const b = makeIssue({ id: 'b', parent_issue_id: 'prd-1' });
		const map = buildIssuesById([prd1, a, b]);
		const deps: IssueDependency[] = [
			{ id: 'd1', blocker_issue_id: 'a', blocked_issue_id: 'b' },
		];
		expect(aggregatePrdEdges(deps, map)).toEqual([]);
	});
});
