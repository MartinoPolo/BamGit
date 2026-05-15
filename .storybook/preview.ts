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
					// foreground-subtle fixed; foreground-muted borderline in light — re-enable after review
					{ id: 'color-contrast', enabled: false },
					// bits-ui Checkbox/Switch/Combobox render as <button> without text — upstream
					{ id: 'button-name', enabled: false },
					// bits-ui Tooltip.Trigger nests buttons (our stories fixed, bits-ui internals remain)
					{ id: 'nested-interactive', enabled: false },
					// bits-ui renders roles outside required ARIA containers in isolation
					{ id: 'aria-required-parent', enabled: false },
					{ id: 'aria-required-children', enabled: false },
					// Storybook decorator renders sidebar landmarks inside story
					{ id: 'landmark-banner-is-top-level', enabled: false },
					{ id: 'landmark-no-duplicate-banner', enabled: false },
					{ id: 'landmark-unique', enabled: false },
					// bits-ui open overlays expose internal ARIA artifacts
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
