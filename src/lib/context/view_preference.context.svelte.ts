import { createContext } from 'svelte';
import { Persisted, stringSerde } from '$lib/reactivity/persisted.svelte.js';

export type ViewMode = 'cards' | 'forest';

type ViewPreferenceContext = ReturnType<typeof createViewPreferenceContext>;

const [useViewPreference, setViewPreferenceInternal] = createContext<ViewPreferenceContext>();
export { useViewPreference };

export function setViewPreferenceContext() {
	const ctx = createViewPreferenceContext();
	setViewPreferenceInternal(ctx);
	return ctx;
}

function isViewMode(value: unknown): value is ViewMode {
	return value === 'cards' || value === 'forest';
}

function createViewPreferenceContext() {
	const viewMode = new Persisted<ViewMode>({
		key: 'grovekeeper_view_mode',
		serde: stringSerde(isViewMode),
		defaultValue: 'cards',
	});

	return {
		get mode() {
			return viewMode.current;
		},
		set mode(value: ViewMode) {
			viewMode.current = value;
		},
	};
}
