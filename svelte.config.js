import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) => {
			const path_segments = filename?.split(/[/\\]/) ?? [];
			const is_external_library = path_segments.includes('node_modules');
			return is_external_library ? undefined : true;
		},
		experimental: { async: true },
	},
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: 'index.html',
		}),
		paths: {
			relative: false,
		},
	},
	vitePlugin: {
		inspector: {
			toggleKeyCombo: 'alt-x',
			showToggleButton: 'active',
		},
	},
};

export default config;
