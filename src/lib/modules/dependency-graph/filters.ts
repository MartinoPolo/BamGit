import type { Issue } from '$lib/modules/issues';
import { SPECIAL_LABELS } from '$lib/modules/visualization';
import { hasLabel, isClosedIssue } from './ready_state';

export interface DependencyFilter {
	showClosed: boolean;
	afkOnly: boolean;
	hitlOnly: boolean;
	area: string | null;
	labelSearch: string;
}

export const DEFAULT_DEPENDENCY_FILTER: DependencyFilter = {
	showClosed: false,
	afkOnly: false,
	hitlOnly: false,
	area: null,
	labelSearch: '',
};

const AREA_LABEL_PREFIX = 'area:';

export function extractAreaLabels(issues: readonly Issue[]): string[] {
	const areas = new Set<string>();
	for (const issue of issues) {
		for (const label of issue.labels) {
			if (label.name.startsWith(AREA_LABEL_PREFIX)) {
				areas.add(label.name);
			}
		}
	}
	return Array.from(areas).sort();
}

export function applyDependencyFilter(issues: readonly Issue[], filter: DependencyFilter): Issue[] {
	const search = filter.labelSearch.trim().toLowerCase();
	return issues.filter((issue) => {
		if (!filter.showClosed && isClosedIssue(issue)) {
			return false;
		}
		if (filter.afkOnly && !hasLabel(issue, SPECIAL_LABELS.afk)) {
			return false;
		}
		if (filter.hitlOnly && !hasLabel(issue, SPECIAL_LABELS.hitl)) {
			return false;
		}
		if (filter.area !== null && !hasLabel(issue, filter.area)) {
			return false;
		}
		if (search.length > 0) {
			const hit = issue.labels.some((label) => label.name.toLowerCase().includes(search));
			if (!hit) {
				return false;
			}
		}
		return true;
	});
}
