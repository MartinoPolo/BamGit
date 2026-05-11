import { describe, it, expect } from 'vitest';
import { statCellVariants, STAT_CELL_TONE_OPTIONS } from './stat-cell-variants.js';

describe('statCellVariants', () => {
	it('generates default variant with surface-2 color-mix bg and border', () => {
		const classes = statCellVariants();
		expect(classes).toMatch(/bg-\[color-mix/);
		expect(classes).toContain('border');
		expect(classes).toContain('border-border');
	});

	it('generates base flex column layout classes', () => {
		const classes = statCellVariants();
		expect(classes).toContain('flex');
		expect(classes).toContain('flex-col');
		expect(classes).toContain('min-w-0');
	});

	it('generates warning variant with status-warning color-mix classes', () => {
		const classes = statCellVariants({ tone: 'warning' });
		expect(classes).toMatch(/status-warning/);
		expect(classes).toMatch(/bg-\[color-mix/);
		expect(classes).toMatch(/border-\[color-mix/);
	});

	it('generates danger variant with status-danger color-mix classes', () => {
		const classes = statCellVariants({ tone: 'danger' });
		expect(classes).toMatch(/status-danger/);
		expect(classes).toMatch(/bg-\[color-mix/);
		expect(classes).toMatch(/border-\[color-mix/);
	});

	it('generates zero variant with same bg as neutral', () => {
		const neutralClasses = statCellVariants({ tone: 'neutral' });
		const zeroClasses = statCellVariants({ tone: 'zero' });
		expect(zeroClasses).toMatch(/bg-\[color-mix.*surface-2/);
		expect(zeroClasses).toContain('border-border');
		// zero has same container styling as neutral
		expect(zeroClasses.includes('bg-')).toBe(neutralClasses.includes('bg-'));
	});

	it('allows merging custom className', () => {
		const classes = statCellVariants({ className: 'my-custom-class' });
		expect(classes).toContain('my-custom-class');
	});
});

describe('STAT_CELL_TONE_OPTIONS', () => {
	it('contains all 4 tone options', () => {
		expect(STAT_CELL_TONE_OPTIONS).toEqual(
			expect.arrayContaining(['neutral', 'zero', 'warning', 'danger']),
		);
		expect(STAT_CELL_TONE_OPTIONS).toHaveLength(4);
	});
});
