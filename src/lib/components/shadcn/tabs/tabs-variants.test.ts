import { describe, it, expect } from 'vitest';
import { tabsContainerVariants, tabVariants } from './tabs-variants.js';

describe('tabsContainerVariants', () => {
	it('generates container with surface-2 bg, border, padding, and rounded', () => {
		const classes = tabsContainerVariants();
		expect(classes).toContain('inline-flex');
		expect(classes).toContain('bg-surface-2');
		expect(classes).toContain('border');
		expect(classes).toMatch(/rounded/);
		expect(classes).toMatch(/p-\[3px\]/);
		expect(classes).toMatch(/gap-0\.5/);
	});

	it('allows merging custom className', () => {
		const classes = tabsContainerVariants({ className: 'custom-tabs' });
		expect(classes).toContain('custom-tabs');
	});
});

describe('tabVariants', () => {
	it('generates base tab styles with foreground-muted text', () => {
		const classes = tabVariants();
		expect(classes).toContain('text-foreground-muted');
		expect(classes).toContain('cursor-pointer');
		expect(classes).toMatch(/rounded/);
		expect(classes).toMatch(/font-medium/);
	});

	it('generates active variant with surface bg and foreground text', () => {
		const classes = tabVariants({ active: true });
		expect(classes).toContain('bg-surface');
		expect(classes).toContain('text-foreground');
		expect(classes).toContain('shadow-sm');
	});

	it('generates inactive variant without surface bg', () => {
		const classes = tabVariants({ active: false });
		expect(classes).not.toContain('bg-surface');
		expect(classes).not.toContain('shadow-sm');
	});

	it('defaults to inactive', () => {
		const classesDefault = tabVariants();
		const classesInactive = tabVariants({ active: false });
		expect(classesDefault).toBe(classesInactive);
	});

	it('includes hover styling classes', () => {
		const classes = tabVariants();
		expect(classes).toMatch(/hover:text-foreground/);
		expect(classes).toMatch(/hover:bg-/);
	});

	it('includes focus-visible styling classes', () => {
		const classes = tabVariants();
		expect(classes).toMatch(/focus-visible:outline/);
		expect(classes).toMatch(/focus-visible:outline-ring/);
	});

	it('includes disabled styling classes', () => {
		const classes = tabVariants();
		expect(classes).toMatch(/disabled:opacity/);
		expect(classes).toMatch(/disabled:cursor-not-allowed/);
	});

	it('allows merging custom className', () => {
		const classes = tabVariants({ className: 'my-tab' });
		expect(classes).toContain('my-tab');
	});
});
