import { browser } from '$app/environment';
import { MediaQuery } from 'svelte/reactivity';

type ThemeMode = 'dark' | 'light' | 'system';

const THEME_STORAGE_KEY = 'grovekeeper_theme_mode';

let themeMode = $state<ThemeMode>(loadThemeMode());
const prefersDark = browser ? new MediaQuery('(prefers-color-scheme: dark)') : null;

const isDark = $derived.by(() => {
	if (themeMode === 'system') {
		return prefersDark?.current ?? true;
	}
	return themeMode === 'dark';
});

function loadThemeMode(): ThemeMode {
	if (!browser) {
		return 'system';
	}
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	if (stored === 'dark' || stored === 'light' || stored === 'system') {
		return stored;
	}
	return 'system';
}

function applyThemeClass(dark: boolean) {
	if (!browser) {
		return;
	}
	document.documentElement.classList.toggle('dark', dark);
}

/**
 * Must be called once from a root component (e.g., +layout.svelte) during initialization.
 * Sets up reactive effects for DOM class toggling and localStorage persistence.
 */
export function initializeTheme() {
	$effect.pre(() => {
		applyThemeClass(isDark);
	});

	$effect(() => {
		if (browser) {
			localStorage.setItem(THEME_STORAGE_KEY, themeMode);
		}
	});
}

export function getThemeStore() {
	return {
		get mode() {
			return themeMode;
		},
		set mode(value: ThemeMode) {
			themeMode = value;
		},
		get isDark() {
			return isDark;
		},
		get prefersDark() {
			return prefersDark?.current ?? true;
		},
	};
}
