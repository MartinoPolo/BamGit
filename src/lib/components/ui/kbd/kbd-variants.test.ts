import { describe, it, expect } from 'vitest';
import { kbdVariants } from './kbd-variants.js';

describe('kbdVariants', () => {
	it('generates inline-flex layout with center alignment', () => {
		const classes = kbdVariants();
		expect(classes).toContain('inline-flex');
		expect(classes).toContain('items-center');
		expect(classes).toContain('justify-center');
	});

	it('generates mono font class', () => {
		const classes = kbdVariants();
		expect(classes).toContain('font-mono');
	});

	it('generates surface-2 background', () => {
		const classes = kbdVariants();
		expect(classes).toContain('bg-surface-2');
	});

	it('generates border class', () => {
		const classes = kbdVariants();
		expect(classes).toContain('border');
	});

	it('generates 4px border radius', () => {
		const classes = kbdVariants();
		expect(classes).toContain('rounded-1');
	});

	it('generates foreground-muted text color', () => {
		const classes = kbdVariants();
		expect(classes).toContain('text-foreground-muted');
	});

	it('allows merging custom className', () => {
		const classes = kbdVariants({ className: 'extra-class' });
		expect(classes).toContain('extra-class');
	});
});
