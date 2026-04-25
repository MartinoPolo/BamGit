import { browser } from '$app/environment';

export type ViewMode = 'cards' | 'forest';

const VIEW_MODE_STORAGE_KEY = 'grovekeeper_view_mode';
const DEFAULT_VIEW_MODE: ViewMode = 'cards';

let viewMode = $state<ViewMode>(loadViewMode());

function loadViewMode(): ViewMode {
	if (!browser) {
		return DEFAULT_VIEW_MODE;
	}
	const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
	if (stored === 'cards' || stored === 'forest') {
		return stored;
	}
	return DEFAULT_VIEW_MODE;
}

/**
 * Must be called once from a root component (e.g., +layout.svelte) during initialization.
 * Sets up reactive effect for localStorage persistence.
 */
export function initializeViewPreference() {
	$effect(() => {
		if (browser) {
			localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
		}
	});
}

export function getViewPreferenceStore() {
	return {
		get mode() {
			return viewMode;
		},
		set mode(value: ViewMode) {
			viewMode = value;
		},
	};
}
