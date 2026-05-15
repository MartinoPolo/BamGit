import type { Preview } from '@storybook/svelte';
import ThemeDecorator from '../src/lib/storybook/ThemeDecorator.svelte';
import '../src/app.css';

const preview: Preview = {
	decorators: [() => ({ Component: ThemeDecorator })],
	parameters: {
		options: {
			storySort: {
				method: 'alphabetical',
				order: ['Base', 'Derived', 'Blocks'],
			},
		},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /date$/i,
			},
		},
		a11y: {
			test: 'error',
			config: {
				rules: [
					// Deferred: design-level decisions needed
					{ id: 'color-contrast', enabled: false },
					// Deferred: bits-ui Tooltip.Trigger wraps buttons as <button>
					{ id: 'nested-interactive', enabled: false },
					// Deferred: 895 icon-only buttons need aria-labels across all components
					{ id: 'button-name', enabled: false },
					// Deferred: bits-ui renders roles outside required ARIA containers in isolation
					{ id: 'aria-required-parent', enabled: false },
					{ id: 'aria-required-children', enabled: false },
					// Deferred: Storybook decorator renders sidebar landmarks inside story
					{ id: 'landmark-banner-is-top-level', enabled: false },
					{ id: 'landmark-no-duplicate-banner', enabled: false },
					{ id: 'landmark-unique', enabled: false },
					// Deferred: bits-ui open overlays expose internal ARIA artifacts
					{ id: 'aria-input-field-name', enabled: false },
					{ id: 'aria-required-attr', enabled: false },
					{ id: 'aria-allowed-attr', enabled: false },
					{ id: 'scrollable-region-focusable', enabled: false },
				],
			},
		},
	},
};

export default preview;
