import { describe, it, expect } from 'vitest';
import { cardVariants, CARD_STATE_OPTIONS, CARD_STATE_CLASSES } from './card-variants.js';

describe('cardVariants', () => {
	it('generates base classes with relative, surface bg, border, radius-lg, and shadow-sm', () => {
		const classes = cardVariants();
		expect(classes).toContain('relative');
		expect(classes).toContain('bg-surface');
		expect(classes).toContain('border');
		expect(classes).toContain('shadow-sm');
		expect(classes).toMatch(/rounded-\[var\(--radius-lg\)\]/);
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

describe('CARD_STATE_CLASSES', () => {
	it('maps hover state to border-strong and shadow-md', () => {
		const classes = CARD_STATE_CLASSES.hover;
		expect(classes).toContain('border-border-strong');
		expect(classes).toContain('shadow-md');
	});

	it('maps selected state to primary border and ring shadow', () => {
		const classes = CARD_STATE_CLASSES.selected;
		expect(classes).toMatch(/border-primary/);
		expect(classes).toMatch(/shadow/);
	});

	it('maps focus state to outline with ring color', () => {
		const classes = CARD_STATE_CLASSES.focus;
		expect(classes).toMatch(/outline/);
		expect(classes).toMatch(/ring/);
	});

	it('maps dragging state to rotation and scale', () => {
		const classes = CARD_STATE_CLASSES.dragging;
		expect(classes).toMatch(/rotate/);
		expect(classes).toMatch(/scale/);
		expect(classes).toContain('shadow-lg');
	});

	it('maps loading state to relative and overflow-hidden', () => {
		const classes = CARD_STATE_CLASSES.loading;
		expect(classes).toContain('relative');
		expect(classes).toContain('overflow-hidden');
	});

	it('maps error state to danger border', () => {
		const classes = CARD_STATE_CLASSES.error;
		expect(classes).toMatch(/status-danger/);
	});

	it('maps success state to success border-left', () => {
		const classes = CARD_STATE_CLASSES.success;
		expect(classes).toMatch(/status-success/);
	});

	it('maps archived state to reduced opacity', () => {
		const classes = CARD_STATE_CLASSES.archived;
		expect(classes).toMatch(/opacity/);
	});

	it('maps disabled state to reduced opacity and pointer-events-none', () => {
		const classes = CARD_STATE_CLASSES.disabled;
		expect(classes).toContain('pointer-events-none');
		expect(classes).toMatch(/opacity/);
	});

	it('does not have a default key', () => {
		expect('default' in CARD_STATE_CLASSES).toBe(false);
	});

	it('returns undefined for default state lookup', () => {
		expect(CARD_STATE_CLASSES['default']).toBeUndefined();
	});
});
