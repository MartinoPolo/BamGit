export const WINDOW_TYPES = {
	overview: 'overview',
	workspace: 'workspace',
} as const;

export type WindowType = (typeof WINDOW_TYPES)[keyof typeof WINDOW_TYPES];

export const OVERVIEW_LABEL = 'overview';
const WORKSPACE_LABEL_PREFIX = 'workspace-';

export function parseWindowLabel(label: string): {
	windowType: WindowType;
	dashboardId: string | null;
} {
	if (label === OVERVIEW_LABEL) {
		return { windowType: 'overview', dashboardId: null };
	}
	if (label.startsWith(WORKSPACE_LABEL_PREFIX)) {
		return {
			windowType: 'workspace',
			dashboardId: label.slice(WORKSPACE_LABEL_PREFIX.length),
		};
	}
	return { windowType: 'overview', dashboardId: null };
}

export function isWindowType(value: unknown): value is WindowType {
	return typeof value === 'string' && value in WINDOW_TYPES;
}

export function resolveInitialDashboardId(
	label: string,
	searchParams: URLSearchParams,
): { windowType: WindowType; dashboardId: string | null } {
	const parsed = parseWindowLabel(label);
	if (parsed.dashboardId !== null) {
		return parsed;
	}
	const dashboardId = searchParams.get('dashboardId');
	if (dashboardId !== null && dashboardId !== '') {
		return { windowType: 'workspace', dashboardId };
	}
	return parsed;
}

export function resolvePopstateNavigation(
	pathname: string,
	overviewPath: string,
	pageDashboardId: string | undefined,
	currentDashboardId: string | null,
): { windowType: WindowType; dashboardId: string | null } {
	if (pathname === overviewPath || pathname.startsWith(overviewPath + '/')) {
		return { windowType: 'overview', dashboardId: null };
	}
	const dashboardId = pageDashboardId ?? currentDashboardId;
	if (dashboardId !== null) {
		return { windowType: 'workspace', dashboardId };
	}
	return { windowType: 'overview', dashboardId: null };
}
