import type { KnipConfig } from 'knip';

const config: KnipConfig = {
	entry: ['src/**/*.{ts,svelte}', 'src/lib/tauri/commands.ts!'],
	project: ['src/**/*.{ts,svelte}'],
	ignoreDependencies: [
		'@typescript-eslint/parser',
		'vitest-browser-svelte',
		'@tauri-apps/plugin-opener',
		// shadcn-svelte ecosystem — used transitively by ui components
		'bits-ui',
		'lucide-svelte',
	],
	ignoreBinaries: ['vite'],
};

export default config;
