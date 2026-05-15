import { describe, it, expect } from 'vitest';
import { deriveCardStateClass } from './derive_card_state_class.js';
import { CARD_STATE_CLASSES } from '$lib/components/blocks/issue/batch_selection_utils.js';
import type { CardStateClassInput } from './types.js';

function makeInput(overrides: Partial<CardStateClassInput> = {}): CardStateClassInput {
	return {
		isArchived: false,
		isBatchSelected: false,
		isActive: false,
		isHovered: false,
		isModifierHeld: false,
		worktreeState: 'active',
		...overrides,
	};
}

describe('deriveCardStateClass', () => {
	it('archived -> archived class', () => {
		const result = deriveCardStateClass(makeInput({ isArchived: true }));
		expect(result).toBe(CARD_STATE_CLASSES.archived);
	});

	it('batch selected -> selected class', () => {
		const result = deriveCardStateClass(makeInput({ isBatchSelected: true }));
		expect(result).toBe(CARD_STATE_CLASSES.selected);
	});

	it('active -> active class', () => {
		const result = deriveCardStateClass(makeInput({ isActive: true }));
		expect(result).toBe(CARD_STATE_CLASSES.active);
	});

	it('hovered without modifier -> hovered class', () => {
		const result = deriveCardStateClass(makeInput({ isHovered: true }));
		expect(result).toBe(CARD_STATE_CLASSES.hovered);
	});

	it('hovered with modifier -> selectionHover class', () => {
		const result = deriveCardStateClass(makeInput({ isHovered: true, isModifierHeld: true }));
		expect(result).toBe(CARD_STATE_CLASSES.selectionHover);
	});

	it('no flags -> empty string', () => {
		const result = deriveCardStateClass(makeInput());
		expect(result).toBe('');
	});

	it('priority: archived > selected (both true -> archived)', () => {
		const result = deriveCardStateClass(makeInput({ isArchived: true, isBatchSelected: true }));
		expect(result).toBe(CARD_STATE_CLASSES.archived);
	});

	it('priority: selected > active (both true -> selected)', () => {
		const result = deriveCardStateClass(makeInput({ isBatchSelected: true, isActive: true }));
		expect(result).toBe(CARD_STATE_CLASSES.selected);
	});

	it('priority: active > hovered (both true -> active)', () => {
		const result = deriveCardStateClass(makeInput({ isActive: true, isHovered: true }));
		expect(result).toBe(CARD_STATE_CLASSES.active);
	});
});
