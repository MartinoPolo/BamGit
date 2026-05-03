import { createContext } from 'svelte';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { isTauri } from '$lib/tauri.js';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { type WindowType, OVERVIEW_LABEL, parseWindowLabel } from './types.js';

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
	};
}
