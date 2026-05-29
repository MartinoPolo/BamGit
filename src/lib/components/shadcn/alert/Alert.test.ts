import { describe, it, expect } from 'vitest';
import { alertVariants } from './alert-variants.js';

describe('alertVariants', () => {
	it('warning tone applies status-warning color classes', () => {
		const classes = alertVariants({ tone: 'warning' });
		expect(classes).toContain('text-status-warning');
	});
});
