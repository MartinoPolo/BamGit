import { CARD_STATE_CLASSES } from '$lib/components/blocks/issue/batch_selection_utils.js';
import type { CardStateClassInput } from './types.js';

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

	return '';
}
