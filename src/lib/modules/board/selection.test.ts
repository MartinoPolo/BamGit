import { describe, it, expect } from 'vitest';
import { shouldShowPrdOverview, computeStageCounts, isBottomPanelTab } from './selection.js';

describe('shouldShowPrdOverview', () => {
	it('returns true when activeIssueId is null (no activation)', () => {
		expect(shouldShowPrdOverview(null, 'prd-123')).toBe(true);
	});

	it('returns true when activeIssueId equals prdIssueId', () => {
		expect(shouldShowPrdOverview('prd-123', 'prd-123')).toBe(true);
	});

	it('returns false when activeIssueId is a non-PRD issue', () => {
		expect(shouldShowPrdOverview('issue-456', 'prd-123')).toBe(false);
	});

	it('returns true when both are null', () => {
		expect(shouldShowPrdOverview(null, null)).toBe(true);
	});

	it('returns false when prdIssueId is null but activeIssueId is set', () => {
		expect(shouldShowPrdOverview('issue-456', null)).toBe(false);
	});
});

describe('computeStageCounts', () => {
	it('returns empty object for empty array', () => {
		expect(computeStageCounts([])).toEqual({});
	});

	it('counts trees by stage field', () => {
		const visualizations = [
			{ kind: 'tree', stage: 'seed' },
			{ kind: 'tree', stage: 'sapling' },
			{ kind: 'tree', stage: 'seed' },
		];
		expect(computeStageCounts(visualizations)).toEqual({ seed: 2, sapling: 1 });
	});

	it('counts potted-plant by stage field', () => {
		const visualizations = [
			{ kind: 'potted-plant', stage: 'sprout' },
			{ kind: 'potted-plant', stage: 'flowering' },
		];
		expect(computeStageCounts(visualizations)).toEqual({ sprout: 1, flowering: 1 });
	});

	it('uses kind as stage name for oak', () => {
		const visualizations = [{ kind: 'oak' }];
		expect(computeStageCounts(visualizations)).toEqual({ oak: 1 });
	});

	it('handles mixed visualizations correctly', () => {
		const visualizations = [
			{ kind: 'tree', stage: 'seed' },
			{ kind: 'potted-plant', stage: 'sprout' },
			{ kind: 'oak' },
			{ kind: 'tree', stage: 'seed' },
			{ kind: 'oak' },
		];
		expect(computeStageCounts(visualizations)).toEqual({
			seed: 2,
			sprout: 1,
			oak: 2,
		});
	});
});

describe('isBottomPanelTab', () => {
	it('returns true for valid tab values', () => {
		expect(isBottomPanelTab('issues')).toBe(true);
		expect(isBottomPanelTab('kanban')).toBe(true);
		expect(isBottomPanelTab('issue-detail')).toBe(true);
		expect(isBottomPanelTab('dependencies')).toBe(true);
		expect(isBottomPanelTab('activity')).toBe(true);
		expect(isBottomPanelTab('session')).toBe(true);
	});

	it('returns false for invalid strings', () => {
		expect(isBottomPanelTab('unknown-tab')).toBe(false);
		expect(isBottomPanelTab('')).toBe(false);
		expect(isBottomPanelTab('issueDetail')).toBe(false);
	});

	it('returns false for non-string values', () => {
		expect(isBottomPanelTab(null)).toBe(false);
		expect(isBottomPanelTab(undefined)).toBe(false);
		expect(isBottomPanelTab(42)).toBe(false);
	});
});
