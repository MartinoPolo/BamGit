import { describe, it, expect } from 'vitest';
import { deriveCardState, ISSUE_CARD_STATES, type CardStateInput } from './issue_card_variants.js';

function makeInput(overrides: Partial<CardStateInput> = {}): CardStateInput {
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

describe('deriveCardState', () => {
	it('archived -> archived', () => {
		expect(deriveCardState(makeInput({ isArchived: true }))).toBe(ISSUE_CARD_STATES.archived);
	});

	it('batch selected -> selected', () => {
		expect(deriveCardState(makeInput({ isBatchSelected: true }))).toBe(
			ISSUE_CARD_STATES.selected,
		);
	});

	it('active -> active', () => {
		expect(deriveCardState(makeInput({ isActive: true }))).toBe(ISSUE_CARD_STATES.active);
	});

	it('hovered without modifier -> hovered', () => {
		expect(deriveCardState(makeInput({ isHovered: true }))).toBe(ISSUE_CARD_STATES.hovered);
	});

	it('hovered with modifier -> selectionHover', () => {
		expect(deriveCardState(makeInput({ isHovered: true, isModifierHeld: true }))).toBe(
			ISSUE_CARD_STATES.selectionHover,
		);
	});

	it('no flags -> interactive', () => {
		expect(deriveCardState(makeInput())).toBe(ISSUE_CARD_STATES.interactive);
	});

	it('priority: archived > selected', () => {
		expect(deriveCardState(makeInput({ isArchived: true, isBatchSelected: true }))).toBe(
			ISSUE_CARD_STATES.archived,
		);
	});

	it('priority: selected > active', () => {
		expect(deriveCardState(makeInput({ isBatchSelected: true, isActive: true }))).toBe(
			ISSUE_CARD_STATES.selected,
		);
	});

	it('priority: active > hovered', () => {
		expect(deriveCardState(makeInput({ isActive: true, isHovered: true }))).toBe(
			ISSUE_CARD_STATES.active,
		);
	});

	it('worktree pending -> worktreeSetup', () => {
		expect(deriveCardState(makeInput({ worktreeState: 'pending' }))).toBe(
			ISSUE_CARD_STATES.worktreeSetup,
		);
	});
});
