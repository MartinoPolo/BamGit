import { describe, it, expect } from 'vitest';
import { cardVariants, CARD_STATE_OPTIONS } from './card-variants.js';

describe('cardVariants', () => {
	it('generates base classes with relative, surface bg, border, radius-lg, and shadow-sm', () => {
		const classes = cardVariants();
		expect(classes).toContain('relative');
		expect(classes).toContain('bg-surface');
		expect(classes).toContain('border');
		expect(classes).toContain('shadow-sm');
		expect(classes).toContain('rounded-lg');
	});

	it('generates padded variant with padding', () => {
		const classes = cardVariants({ padding: 'padded' });
		expect(classes).toContain('p-4');
	});

	it('generates none padding variant without padding', () => {
		const classes = cardVariants({ padding: 'none' });
		expect(classes).not.toContain('p-4');
	});

	it('defaults to none padding', () => {
		const classes = cardVariants();
		expect(classes).not.toContain('p-4');
	});

	it('allows merging custom className', () => {
		const classes = cardVariants({ className: 'my-custom-class' });
		expect(classes).toContain('my-custom-class');
	});
});

describe('CARD_STATE_OPTIONS', () => {
	it('contains all expected state values', () => {
		expect(CARD_STATE_OPTIONS).toEqual(
			expect.arrayContaining([
				'default',
				'hover',
				'selected',
				'focus',
				'dragging',
				'loading',
				'error',
				'success',
				'archived',
				'disabled',
			]),
		);
	});
});

describe('cardVariants state axis', () => {
	it('maps hover state to border-strong and shadow-md', () => {
		const classes = cardVariants({ state: 'hover' });
		expect(classes).toContain('border-border-strong');
		expect(classes).toContain('shadow-md');
	});

	it('maps selected state to primary border and ring shadow', () => {
		const classes = cardVariants({ state: 'selected' });
		expect(classes).toMatch(/border-primary/);
		expect(classes).toMatch(/shadow/);
	});

	it('maps focus state to outline with ring color', () => {
		const classes = cardVariants({ state: 'focus' });
		expect(classes).toMatch(/outline/);
		expect(classes).toMatch(/ring/);
	});

	it('maps dragging state to rotation and scale', () => {
		const classes = cardVariants({ state: 'dragging' });
		expect(classes).toMatch(/rotate/);
		expect(classes).toMatch(/scale/);
		expect(classes).toContain('shadow-lg');
	});

	it('maps loading state to relative and overflow-hidden', () => {
		const classes = cardVariants({ state: 'loading' });
		expect(classes).toContain('relative');
		expect(classes).toContain('overflow-hidden');
	});

	it('maps error state to danger border', () => {
		const classes = cardVariants({ state: 'error' });
		expect(classes).toMatch(/status-danger/);
	});

	it('maps success state to success border-left', () => {
		const classes = cardVariants({ state: 'success' });
		expect(classes).toMatch(/status-success/);
	});

	it('maps archived state to reduced opacity', () => {
		const classes = cardVariants({ state: 'archived' });
		expect(classes).toMatch(/opacity/);
	});

	it('maps disabled state to reduced opacity and pointer-events-none', () => {
		const classes = cardVariants({ state: 'disabled' });
		expect(classes).toContain('pointer-events-none');
		expect(classes).toMatch(/opacity/);
	});

	it('keeps default state neutral', () => {
		const classes = cardVariants({ state: 'default' });
		expect(classes).not.toContain('border-border-strong');
		expect(classes).not.toContain('status-danger');
	});
});
