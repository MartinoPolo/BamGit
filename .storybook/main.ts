import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(js|ts|svelte)'],
	addons: [
		'@storybook/addon-svelte-csf',
		'@chromatic-com/storybook',
		'@storybook/addon-vitest',
		'@storybook/addon-a11y',
		'@storybook/addon-docs',
	],
	framework: '@storybook/sveltekit',
	// SvelteKit's vite plugin posixifies the project root and warns on Windows
	// when Storybook's builder provides a backslash-separated root. Normalize
	// separators here so the initial and resolved roots match, silencing the
	// cosmetic "Vite config options will be overridden by SvelteKit: - root" warning.
	viteFinal: async (config) => ({
		...config,
		root: config.root?.replace(/\\/g, '/') ?? process.cwd().replace(/\\/g, '/'),
	}),
};

export default config;
