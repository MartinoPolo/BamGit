export default {
	extends: ['stylelint-config-standard', 'stylelint-config-html/svelte'],
	rules: {
		// @tailwindcss/vite handles imports directly — url() notation breaks SSR build
		'import-notation': 'string',
	},
};
