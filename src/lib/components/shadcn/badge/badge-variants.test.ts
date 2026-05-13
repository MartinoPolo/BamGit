import { describe, it, expect } from 'vitest';
import { BADGE_DOT_OPTIONS, BADGE_VARIANTS, badgeVariants } from './badge-variants.js';

describe('badgeVariants', () => {
	it('generates default variant classes with surface-2 bg, foreground-muted text, and border', () => {
		const classes = badgeVariants();
		expect(classes).toContain('bg-surface-2');
		expect(classes).toContain('text-foreground-muted');
		expect(classes).toContain('border');
	});

	it('generates base inline-flex layout classes', () => {
		const classes = badgeVariants();
		expect(classes).toContain('inline-flex');
		expect(classes).toContain('items-center');
		expect(classes).toContain('whitespace-nowrap');
	});

	it('generates success variant with color-mix background and status-success color', () => {
		const classes = badgeVariants({ variant: 'success' });
		expect(classes).toContain('text-status-success');
		expect(classes).toMatch(/bg-\[color-mix/);
		expect(classes).toMatch(/border-\[color-mix/);
	});

	it('generates warning variant classes', () => {
		const classes = badgeVariants({ variant: 'warning' });
		expect(classes).toMatch(/status-warning/);
	});

	it('generates danger variant classes', () => {
		const classes = badgeVariants({ variant: 'danger' });
		expect(classes).toContain('text-status-danger');
	});

	it('generates info variant classes', () => {
		const classes = badgeVariants({ variant: 'info' });
		expect(classes).toContain('text-status-info');
	});

	it('generates moss variant with primary color', () => {
		const classes = badgeVariants({ variant: 'moss' });
		expect(classes).toContain('text-primary');
	});

	it('generates amber variant with accent color-mix', () => {
		const classes = badgeVariants({ variant: 'amber' });
		expect(classes).toMatch(/accent/);
	});

	it('generates mono variant with font-mono class', () => {
		const classes = badgeVariants({ variant: 'mono' });
		expect(classes).toContain('font-mono');
	});

	it('allows merging custom className', () => {
		const classes = badgeVariants({ className: 'my-custom-class' });
		expect(classes).toContain('my-custom-class');
	});
});

describe('BADGE_VARIANTS', () => {
	it('contains all expected variant keys', () => {
		expect(BADGE_VARIANTS).toEqual(
			expect.arrayContaining([
				'default',
				'success',
				'warning',
				'danger',
				'info',
				'moss',
				'amber',
				'mono',
				'merged',
			]),
		);
	});
});

describe('BADGE_DOT_OPTIONS', () => {
	it('contains static and pulsing options', () => {
		expect(BADGE_DOT_OPTIONS).toEqual(expect.arrayContaining(['static', 'pulsing']));
	});
});

describe('badge size variants', () => {
	it('default size uses h-5 and rounded-full', () => {
		const classes = badgeVariants({ size: 'default' });
		expect(classes).toContain('h-5');
		expect(classes).toContain('rounded-full');
	});

	it('compact size uses smaller height and rounded corners', () => {
		const classes = badgeVariants({ size: 'compact' });
		expect(classes).toContain('rounded');
		expect(classes).toContain('text-[10px]');
		expect(classes).not.toContain('h-5');
		expect(classes).not.toContain('rounded-full');
	});

	it('uses default size when no size specified', () => {
		const classes = badgeVariants();
		expect(classes).toContain('h-5');
		expect(classes).toContain('rounded-full');
	});
});
