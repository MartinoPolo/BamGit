import type { CardStateClassInput } from './types.js';

export const CARD_STATE_CLASSES = {
	active: 'card-state-active-ic',
	hovered: 'card-state-hovered-ic',
	selectionHover: 'card-state-selection-hover',
	selected: 'card-state-selected-primary',
	loading: 'pointer-events-none',
	archived: 'opacity-70 grayscale-[0.8]',
	error: 'border-l-0.75 border-l-destructive',
	disabled: 'opacity-42 pointer-events-none',
	done: 'bg-transparent border-transparent',
	worktreeSetup: 'opacity-60 border-dashed border-muted',
} as const;

export function deriveCardStateClass(input: CardStateClassInput): string {
	if (input.isArchived) {
		return CARD_STATE_CLASSES.archived;
	}

	if (input.isBatchSelected) {
		return CARD_STATE_CLASSES.selected;
	}

	if (input.isActive) {
		return CARD_STATE_CLASSES.active;
	}

	if (input.isHovered) {
		if (input.isModifierHeld) {
			return CARD_STATE_CLASSES.selectionHover;
		}
		return CARD_STATE_CLASSES.hovered;
	}

	if (input.isDone) {
		return CARD_STATE_CLASSES.done;
	}

	if (input.worktreeState === 'pending') {
		return CARD_STATE_CLASSES.worktreeSetup;
	}

	return '';
}
