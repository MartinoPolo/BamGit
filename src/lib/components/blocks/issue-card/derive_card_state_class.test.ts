import { describe, it, expect } from 'vitest';
import { deriveCardState, ISSUE_CARD_STATES, type CardStateInput } from './issue_card_variants.js';

function makeInput(overrides: Partial<CardStateInput> = {}): CardStateInput {
	return {
		isGhost: false,
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

	it('isDone true with no other flags -> done', () => {
		expect(deriveCardState(makeInput({ isDone: true }))).toBe(ISSUE_CARD_STATES.done);
	});

	it('isDone true + isBatchSelected -> selected (batch overrides done)', () => {
		expect(deriveCardState(makeInput({ isDone: true, isBatchSelected: true }))).toBe(
			ISSUE_CARD_STATES.selected,
		);
	});

	it('isDone true + isActive -> active (active overrides done)', () => {
		expect(deriveCardState(makeInput({ isDone: true, isActive: true }))).toBe(
			ISSUE_CARD_STATES.active,
		);
	});

	it('isDone true + isHovered -> hovered (hover overrides done)', () => {
		expect(deriveCardState(makeInput({ isDone: true, isHovered: true }))).toBe(
			ISSUE_CARD_STATES.hovered,
		);
	});

	it('isDone true + isArchived -> archived (archived highest priority)', () => {
		expect(deriveCardState(makeInput({ isDone: true, isArchived: true }))).toBe(
			ISSUE_CARD_STATES.archived,
		);
	});

	describe('ghost state', () => {
		it('isGhost -> ghost', () => {
			expect(deriveCardState(makeInput({ isGhost: true }))).toBe(ISSUE_CARD_STATES.ghost);
		});

		it('ghost overrides archived', () => {
			expect(deriveCardState(makeInput({ isGhost: true, isArchived: true }))).toBe(
				ISSUE_CARD_STATES.ghost,
			);
		});

		it('ghost overrides selected', () => {
			expect(deriveCardState(makeInput({ isGhost: true, isBatchSelected: true }))).toBe(
				ISSUE_CARD_STATES.ghost,
			);
		});

		it('ghost overrides active', () => {
			expect(deriveCardState(makeInput({ isGhost: true, isActive: true }))).toBe(
				ISSUE_CARD_STATES.ghost,
			);
		});

		it('ghost overrides hovered', () => {
			expect(deriveCardState(makeInput({ isGhost: true, isHovered: true }))).toBe(
				ISSUE_CARD_STATES.ghost,
			);
		});
	});
});
