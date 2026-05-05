// ─── Bottom Panel Tab Constants ──────────────────────────────────────────

export const BOTTOM_PANEL_TABS = {
	issues: 'issues',
	kanban: 'kanban',
	issueDetail: 'issue-detail',
	dependencies: 'dependencies',
	activity: 'activity',
	session: 'session',
} as const;

export type BottomPanelTab = (typeof BOTTOM_PANEL_TABS)[keyof typeof BOTTOM_PANEL_TABS];

// ─── Tab Behavior ────────────────────────────────────────────────────────

export type TabBehavior = 'replace' | 'filter' | 'highlight';

export const TAB_BEHAVIOR_MAP = {
	issues: 'replace',
	kanban: 'replace',
	'issue-detail': 'replace',
	dependencies: 'highlight',
	activity: 'filter',
	session: 'replace',
} as const satisfies Record<BottomPanelTab, TabBehavior>;

// ─── Tab Labels ──────────────────────────────────────────────────────────

export const BOTTOM_PANEL_TAB_LABELS = {
	issues: 'Issues',
	kanban: 'Kanban',
	'issue-detail': 'Issue Detail',
	dependencies: 'Dependencies',
	activity: 'Activity',
	session: 'Session',
} as const satisfies Record<BottomPanelTab, string>;

// ─── PRD Overview Logic ──────────────────────────────────────────────────

export function shouldShowPrdOverview(
	activeIssueId: string | null,
	prdIssueId: string | null,
): boolean {
	if (activeIssueId === null) {
		return true;
	}
	if (activeIssueId === prdIssueId) {
		return true;
	}
	return false;
}

// ─── Stage Counts ────────────────────────────────────────────────────────

export interface StageCounts {
	readonly [stage: string]: number;
}

export function computeStageCounts(
	visualizations: ReadonlyArray<{ readonly kind: string; readonly stage?: string }>,
): StageCounts {
	const counts: Record<string, number> = {};
	for (const visualization of visualizations) {
		const stageName =
			visualization.kind === 'tree' || visualization.kind === 'potted-plant'
				? visualization.stage
				: visualization.kind;
		if (stageName !== undefined) {
			counts[stageName] = (counts[stageName] ?? 0) + 1;
		}
	}
	return counts;
}

// ─── Type Guards ─────────────────────────────────────────────────────────

const BOTTOM_PANEL_TAB_VALUES: ReadonlySet<string> = new Set(Object.values(BOTTOM_PANEL_TABS));

export function isBottomPanelTab(value: unknown): value is BottomPanelTab {
	return typeof value === 'string' && BOTTOM_PANEL_TAB_VALUES.has(value);
}
