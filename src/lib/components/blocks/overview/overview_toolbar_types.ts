import type { OverviewWorkspaceData } from '$lib/types/generated';

// --- Const objects & derived types ---

export const OVERVIEW_SORT_MODES = {
	activity: 'activity',
	name: 'name',
	'issue-count': 'issue-count',
	cost: 'cost',
} as const;
export type OverviewSortMode = (typeof OVERVIEW_SORT_MODES)[keyof typeof OVERVIEW_SORT_MODES];

export const OVERVIEW_SORT_DIRECTIONS = {
	descending: 'descending',
	ascending: 'ascending',
} as const;
export type OverviewSortDirection =
	(typeof OVERVIEW_SORT_DIRECTIONS)[keyof typeof OVERVIEW_SORT_DIRECTIONS];

export const OVERVIEW_FILTER_MODES = {
	all: 'all',
	active: 'active',
	'needs-attention': 'needs-attention',
	dormant: 'dormant',
} as const;
export type OverviewFilterMode = (typeof OVERVIEW_FILTER_MODES)[keyof typeof OVERVIEW_FILTER_MODES];

export const OVERVIEW_FOOTER_CONTENT_OPTIONS = {
	'cost-today': 'cost-today',
	'cost-week': 'cost-week',
	'cost-total': 'cost-total',
	sessions: 'sessions',
	'last-activity': 'last-activity',
} as const;
export type OverviewFooterContent =
	(typeof OVERVIEW_FOOTER_CONTENT_OPTIONS)[keyof typeof OVERVIEW_FOOTER_CONTENT_OPTIONS];

// --- Defaults ---

export const OVERVIEW_SORT_DEFAULT: OverviewSortMode = 'activity';
export const OVERVIEW_SORT_DIRECTION_DEFAULT: OverviewSortDirection = 'descending';
export const OVERVIEW_FILTER_DEFAULT: OverviewFilterMode = 'all';
export const OVERVIEW_FOOTER_CONTENT_DEFAULT: OverviewFooterContent = 'cost-today';

// --- Label maps ---

export const SORT_MODE_LABELS: Record<OverviewSortMode, string> = {
	name: 'Name',
	activity: 'Activity',
	'issue-count': 'Issue count',
	cost: 'Cost',
};

export const FILTER_MODE_LABELS: Record<OverviewFilterMode, string> = {
	all: 'All',
	active: 'Active',
	'needs-attention': 'Needs Attention',
	dormant: 'Dormant',
};

export const SORT_DIRECTION_LABELS: Record<OverviewSortDirection, string> = {
	ascending: 'Ascending',
	descending: 'Descending',
};

export const FOOTER_CONTENT_LABELS: Record<OverviewFooterContent, string> = {
	'cost-today': "Today's cost",
	'cost-week': "This week's cost",
	'cost-total': 'Total cost',
	sessions: 'Active sessions',
	'last-activity': 'Last activity',
};

// --- Pure functions ---

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function sortWorkspaces(
	workspaces: readonly OverviewWorkspaceData[],
	mode: OverviewSortMode,
	direction: OverviewSortDirection,
): OverviewWorkspaceData[] {
	const sorted = [...workspaces];
	const directionMultiplier = direction === 'ascending' ? 1 : -1;

	sorted.sort((a, b) => {
		switch (mode) {
			case 'name':
				return (
					directionMultiplier *
					a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
				);

			case 'activity': {
				const aActivity = a.last_activity;
				const bActivity = b.last_activity;
				if (aActivity === null && bActivity === null) {
					return 0;
				}
				if (aActivity === null) {
					return 1;
				}
				if (bActivity === null) {
					return -1;
				}
				const aTime = new Date(aActivity).getTime();
				const bTime = new Date(bActivity).getTime();
				return directionMultiplier * (aTime - bTime);
			}

			case 'issue-count':
				return directionMultiplier * (a.open_issue_count - b.open_issue_count);

			case 'cost': {
				const aCost = a.cost_today_usd ?? 0;
				const bCost = b.cost_today_usd ?? 0;
				return directionMultiplier * (aCost - bCost);
			}
		}
	});

	return sorted;
}

export function filterWorkspaces(
	workspaces: readonly OverviewWorkspaceData[],
	mode: OverviewFilterMode,
): OverviewWorkspaceData[] {
	switch (mode) {
		case 'all':
			return [...workspaces];

		case 'active':
			return workspaces.filter((w) => w.active_session_count > 0);

		case 'needs-attention':
			return workspaces.filter((w) => w.hitl_count > 0 || w.prs_needing_attention > 0);

		case 'dormant': {
			const now = Date.now();
			return workspaces.filter((w) => {
				if (w.active_session_count > 0) {
					return false;
				}
				if (w.last_activity === null) {
					return true;
				}
				const activityAge = now - new Date(w.last_activity).getTime();
				return activityAge > SEVEN_DAYS_MS;
			});
		}
	}
}

export function searchWorkspaces(
	workspaces: readonly OverviewWorkspaceData[],
	query: string,
): OverviewWorkspaceData[] {
	const trimmed = query.trim();
	if (trimmed === '') {
		return [...workspaces];
	}
	const lowerQuery = trimmed.toLowerCase();
	return workspaces.filter((w) => w.name.toLowerCase().includes(lowerQuery));
}

// --- Type guards ---

const SORT_MODE_VALUES: ReadonlySet<string> = new Set(Object.values(OVERVIEW_SORT_MODES));
const SORT_DIRECTION_VALUES: ReadonlySet<string> = new Set(Object.values(OVERVIEW_SORT_DIRECTIONS));
const FILTER_MODE_VALUES: ReadonlySet<string> = new Set(Object.values(OVERVIEW_FILTER_MODES));
const FOOTER_CONTENT_VALUES: ReadonlySet<string> = new Set(
	Object.values(OVERVIEW_FOOTER_CONTENT_OPTIONS),
);

export function isOverviewSortMode(value: unknown): value is OverviewSortMode {
	return typeof value === 'string' && SORT_MODE_VALUES.has(value);
}

export function isOverviewSortDirection(value: unknown): value is OverviewSortDirection {
	return typeof value === 'string' && SORT_DIRECTION_VALUES.has(value);
}

export function isOverviewFilterMode(value: unknown): value is OverviewFilterMode {
	return typeof value === 'string' && FILTER_MODE_VALUES.has(value);
}

export function isOverviewFooterContent(value: unknown): value is OverviewFooterContent {
	return typeof value === 'string' && FOOTER_CONTENT_VALUES.has(value);
}
