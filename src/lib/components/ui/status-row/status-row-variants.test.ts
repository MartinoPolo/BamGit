import { describe, it, expect } from 'vitest';
import type { StatusRowProps } from './status-row-variants.js';

describe('StatusRowProps', () => {
	it('type is importable and usable', () => {
		const props: StatusRowProps = {
			active: true,
			label: 'Test',
		};
		expect(props.active).toBe(true);
		expect(props.label).toBe('Test');
	});

	it('accepts all optional props', () => {
		const props: StatusRowProps = {
			active: false,
			label: 'Test',
			meta: 'metadata',
			onclick: () => {},
			activeColor: 'var(--moss-400)',
			class: 'custom',
		};
		expect(props.meta).toBe('metadata');
		expect(props.activeColor).toBe('var(--moss-400)');
	});
});
