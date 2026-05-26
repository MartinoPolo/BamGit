import { createContext } from 'svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { isTauri } from '$lib/tauri.js';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { setUserSetting } from '$lib/modules/settings/settings_commands.js';
import {
	type WindowType,
	OVERVIEW_LABEL,
	parseWindowLabel,
	resolvePopstateNavigation,
} from './types.js';

type WindowContext = ReturnType<typeof createWindowContext>;

const [useWindow, setWindowInternal] = createContext<WindowContext>();
export { useWindow };

export function setWindowContext() {
	const ctx = createWindowContext();
	setWindowInternal(ctx);
	return ctx;
}

const BROWSER_MOCK_LABEL = 'workspace-browser-mock';

function resolveWindowLabel(): string {
	if (!isTauri()) {
		return BROWSER_MOCK_LABEL;
	}
	try {
		return getCurrentWebviewWindow().label;
	} catch {
		return OVERVIEW_LABEL;
	}
}

function createWindowContext() {
	const label = resolveWindowLabel();
	const parsed = parseWindowLabel(label);

	const windowLabel = new StateRaw(label);
	const windowType = new StateRaw<WindowType>(parsed.windowType);
	const boundDashboardId = new StateRaw<string | null>(parsed.dashboardId);

	return {
		get windowLabel() {
			return windowLabel.current;
		},
		get windowType() {
			return windowType.current;
		},
		get boundDashboardId() {
			return boundDashboardId.current;
		},
		get isOverview() {
			return windowType.current === 'overview';
		},
		get isWorkspace() {
			return windowType.current === 'workspace';
		},

		navigateToWorkspace(dashboardId: string) {
			boundDashboardId.current = dashboardId;
			windowType.current = 'workspace';
			void goto(resolve('/'), { state: { dashboardId } });
			void setUserSetting('last_workspace_id', dashboardId);
		},

		navigateToOverview() {
			boundDashboardId.current = null;
			windowType.current = 'overview';
			void goto(resolve('/overview'));
		},

		syncNavigationState(pathname: string, pageState: App.PageState) {
			const resolved = resolvePopstateNavigation(
				pathname,
				resolve('/overview'),
				pageState.dashboardId,
				boundDashboardId.current,
			);
			boundDashboardId.current = resolved.dashboardId;
			windowType.current = resolved.windowType;
		},
	};
}
