import { createContext } from 'svelte';
import { browser } from '$app/environment';
import { MediaQuery } from 'svelte/reactivity';
import { Persisted, stringSerde } from '$lib/reactivity/persisted.svelte.js';

// fallow-ignore-next-line unused-types
export type ThemeMode = 'dark' | 'light' | 'system';

type ThemeContext = ReturnType<typeof createThemeContext>;

const [useTheme, setThemeInternal] = createContext<ThemeContext>();
export { useTheme };

export function setThemeContext() {
	const ctx = createThemeContext();
	setThemeInternal(ctx);
	return ctx;
}

function isThemeMode(value: unknown): value is ThemeMode {
	return value === 'dark' || value === 'light' || value === 'system';
}

function createThemeContext() {
	const themeMode = new Persisted<ThemeMode>({
		key: 'grovekeeper_theme_mode',
		serde: stringSerde(isThemeMode),
		defaultValue: 'system',
	});

	const prefersDark = browser ? new MediaQuery('(prefers-color-scheme: dark)') : null;

	const isDark = $derived.by(() => {
		if (themeMode.current === 'system') {
			return prefersDark?.current ?? true;
		}
		return themeMode.current === 'dark';
	});

	$effect.pre(() => {
		if (browser) {
			document.documentElement.classList.toggle('dark', isDark);
		}
	});

	return {
		get mode() {
			return themeMode.current;
		},
		set mode(value: ThemeMode) {
			themeMode.current = value;
		},
		get isDark() {
			return isDark;
		},
		get prefersDark() {
			return prefersDark?.current ?? true;
		},
	};
}
