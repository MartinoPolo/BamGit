import { describe, it, expect } from 'vitest';
import { deriveCardStateClass, CARD_STATE_CLASSES } from './derive_card_state_class.js';
import type { CardStateClassInput } from './types.js';

function makeInput(overrides: Partial<CardStateClassInput> = {}): CardStateClassInput {
	return {
		isArchived: false,
		isDone: false,
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

	it('done -> done class', () => {
		const result = deriveCardStateClass(makeInput({ isDone: true }));
		expect(result).toBe(CARD_STATE_CLASSES.done);
	});

	it('worktree pending -> worktreeSetup class', () => {
		const result = deriveCardStateClass(makeInput({ worktreeState: 'pending' }));
		expect(result).toBe(CARD_STATE_CLASSES.worktreeSetup);
	});

	it('priority: archived > done (both true -> archived)', () => {
		const result = deriveCardStateClass(makeInput({ isArchived: true, isDone: true }));
		expect(result).toBe(CARD_STATE_CLASSES.archived);
	});

	it('priority: done > worktreeSetup (both true -> done)', () => {
		const result = deriveCardStateClass(makeInput({ isDone: true, worktreeState: 'pending' }));
		expect(result).toBe(CARD_STATE_CLASSES.done);
	});
});
