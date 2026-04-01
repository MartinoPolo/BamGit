import { browser } from '$app/environment';
import { MediaQuery } from 'svelte/reactivity';

type ThemeMode = 'dark' | 'light' | 'system';

const THEME_STORAGE_KEY = 'bamgit_theme_mode';

let theme_mode = $state<ThemeMode>(load_theme_mode());
const prefers_dark = browser ? new MediaQuery('(prefers-color-scheme: dark)') : null;

const is_dark = $derived.by(() => {
	if (theme_mode === 'system') {
		return prefers_dark?.current ?? true;
	}
	return theme_mode === 'dark';
});

function load_theme_mode(): ThemeMode {
	if (!browser) {
		return 'system';
	}
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	if (stored === 'dark' || stored === 'light' || stored === 'system') {
		return stored;
	}
	return 'system';
}

function apply_theme_class(dark: boolean) {
	if (!browser) {
		return;
	}
	document.documentElement.classList.toggle('dark', dark);
}

/**
 * Must be called once from a root component (e.g., +layout.svelte) during initialization.
 * Sets up reactive effects for DOM class toggling and localStorage persistence.
 */
export function initialize_theme() {
	$effect.pre(() => {
		apply_theme_class(is_dark);
	});

	$effect(() => {
		if (browser) {
			localStorage.setItem(THEME_STORAGE_KEY, theme_mode);
		}
	});
}

export function get_theme_store() {
	return {
		get mode() {
			return theme_mode;
		},
		set mode(value: ThemeMode) {
			theme_mode = value;
		},
		get is_dark() {
			return is_dark;
		},
		get prefers_dark() {
			return prefers_dark?.current ?? true;
		},
	};
}
