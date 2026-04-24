import { browser } from '$app/environment';

export type ViewMode = 'cards' | 'forest';

const VIEW_MODE_STORAGE_KEY = 'grovekeeper_view_mode';
const DEFAULT_VIEW_MODE: ViewMode = 'cards';

let view_mode = $state<ViewMode>(load_view_mode());

function load_view_mode(): ViewMode {
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
export function initialize_view_preference() {
	$effect(() => {
		if (browser) {
			localStorage.setItem(VIEW_MODE_STORAGE_KEY, view_mode);
		}
	});
}

export function get_view_preference_store() {
	return {
		get mode() {
			return view_mode;
		},
		set mode(value: ViewMode) {
			view_mode = value;
		},
	};
}
