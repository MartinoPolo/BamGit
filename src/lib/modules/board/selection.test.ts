import { describe, it, expect } from 'vitest';
import {
	BOTTOM_PANEL_TABS,
	TAB_BEHAVIOR_MAP,
	BOTTOM_PANEL_TAB_LABELS,
	shouldShowPrdOverview,
	computeStageCounts,
	isBottomPanelTab,
} from './selection.js';

describe('BOTTOM_PANEL_TABS', () => {
	it('has exactly 4 entries with correct values', () => {
		expect(BOTTOM_PANEL_TABS).toEqual({
			issueDetail: 'issue-detail',
			dependencies: 'dependencies',
			activity: 'activity',
			session: 'session',
		});
		expect(Object.keys(BOTTOM_PANEL_TABS)).toHaveLength(4);
	});
});

describe('TAB_BEHAVIOR_MAP', () => {
	it('maps issue-detail to replace', () => {
		expect(TAB_BEHAVIOR_MAP['issue-detail']).toBe('replace');
	});

	it('maps dependencies to highlight', () => {
		expect(TAB_BEHAVIOR_MAP['dependencies']).toBe('highlight');
	});

	it('maps activity to filter', () => {
		expect(TAB_BEHAVIOR_MAP['activity']).toBe('filter');
	});

	it('maps session to replace', () => {
		expect(TAB_BEHAVIOR_MAP['session']).toBe('replace');
	});

	it('covers all tabs', () => {
		const tabValues = Object.values(BOTTOM_PANEL_TABS);
		const mappedTabs = Object.keys(TAB_BEHAVIOR_MAP);
		expect(mappedTabs).toHaveLength(tabValues.length);
		for (const tab of tabValues) {
			expect(TAB_BEHAVIOR_MAP).toHaveProperty(tab);
		}
	});
});

describe('shouldShowPrdOverview', () => {
	it('returns true when selectedIssueId is null (no selection)', () => {
		expect(shouldShowPrdOverview(null, 'prd-123')).toBe(true);
	});

	it('returns true when selectedIssueId equals prdIssueId', () => {
		expect(shouldShowPrdOverview('prd-123', 'prd-123')).toBe(true);
	});

	it('returns false when selectedIssueId is a non-PRD issue', () => {
		expect(shouldShowPrdOverview('issue-456', 'prd-123')).toBe(false);
	});

	it('returns true when both are null', () => {
		expect(shouldShowPrdOverview(null, null)).toBe(true);
	});

	it('returns false when prdIssueId is null but selectedIssueId is set', () => {
		expect(shouldShowPrdOverview('issue-456', null)).toBe(false);
	});
});

describe('BOTTOM_PANEL_TAB_LABELS', () => {
	it('maps each tab to correct display label', () => {
		expect(BOTTOM_PANEL_TAB_LABELS['issue-detail']).toBe('Issue Detail');
		expect(BOTTOM_PANEL_TAB_LABELS['dependencies']).toBe('Dependencies');
		expect(BOTTOM_PANEL_TAB_LABELS['activity']).toBe('Activity');
		expect(BOTTOM_PANEL_TAB_LABELS['session']).toBe('Session');
	});

	it('has a non-empty label for every tab', () => {
		const tabValues = Object.values(BOTTOM_PANEL_TABS);
		for (const tab of tabValues) {
			const label = BOTTOM_PANEL_TAB_LABELS[tab];
			expect(label).toBeDefined();
			expect(typeof label).toBe('string');
			expect(label.length).toBeGreaterThan(0);
		}
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
