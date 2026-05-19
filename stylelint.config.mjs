export default {
	extends: ['stylelint-config-standard', 'stylelint-config-html/svelte'],
	rules: {
		// @tailwindcss/vite handles imports directly — url() notation breaks SSR build
		'import-notation': 'string',
		// Tailwind CSS v4 at-rules
		'at-rule-no-unknown': [
			true,
			{ ignoreAtRules: ['theme', 'custom-variant', 'plugin', 'apply', 'layer'] },
		],
		// Svelte :global() pseudo-class
		'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
		// Svelte -global- keyframe prefix
		'keyframes-name-pattern': null,
		// shadcn-svelte uses OKLCH decimal lightness (0.141) and unitless hue (285.823) — both valid CSS
		'lightness-notation': null,
		'hue-degree-notation': null,
		// Tailwind CSS 4 @custom-variant blocks use & nesting outside a scoping root
		'nesting-selector-no-missing-scoping-root': null,
	},
};
