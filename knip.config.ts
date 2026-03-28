import type { KnipConfig } from 'knip';

const config: KnipConfig = {
	project: ['src/**/*.{ts,svelte}'],
	ignoreDependencies: [
		'@typescript-eslint/parser',
		'tailwindcss',
		'vitest-browser-svelte',
		'@tauri-apps/plugin-opener',
	],
	ignoreBinaries: ['vite'],
};

export default config;
