import { tv } from 'tailwind-variants';

// ── Card state (visual priority cascade) ─────────────────────────────

export const ISSUE_CARD_STATES = {
	archived: 'archived',
	selected: 'selected',
	active: 'active',
	selectionHover: 'selectionHover',
	hovered: 'hovered',
	worktreeSetup: 'worktreeSetup',
	interactive: 'interactive',
} as const;

export type IssueCardState = (typeof ISSUE_CARD_STATES)[keyof typeof ISSUE_CARD_STATES];

// ── tv() slot variants ───────────────────────────────────────────────

// fallow-ignore-next-line unused-export
export const issueCardVariants = tv({
	slots: {
		card: 'group relative overflow-hidden rounded-lg border outline-none transition-[box-shadow,transform,opacity,filter] duration-3',
		header: 'flex min-h-8 items-center justify-between gap-2.5 px-3 py-1.5',
		preview:
			'relative flex size-25 shrink-0 items-end justify-center overflow-hidden rounded-1.75 border border-[color-mix(in_oklch,var(--ic-color)_20%,var(--border))]',
	},
});

// ── Derive card state from inputs ────────────────────────────────────

export interface CardStateInput {
	readonly isArchived: boolean;
	readonly isBatchSelected: boolean;
	readonly isActive: boolean;
	readonly isHovered: boolean;
	readonly isModifierHeld: boolean;
	readonly worktreeState: string;
}

export function deriveCardState(input: CardStateInput): IssueCardState {
	if (input.isArchived) {
		return 'archived';
	}
	if (input.isBatchSelected) {
		return 'selected';
	}
	if (input.isActive) {
		return 'active';
	}
	if (input.isHovered) {
		if (input.isModifierHeld) {
			return 'selectionHover';
		}
		return 'hovered';
	}
	if (input.worktreeState === 'pending') {
		return 'worktreeSetup';
	}
	return 'interactive';
}

// ── Helpers for context ──────────────────────────────────────────────

export interface IssueCardSlotClasses {
	readonly card: string;
	readonly header: string;
	readonly preview: string;
}

function resolveIssueCardClasses(): IssueCardSlotClasses {
	const slots = issueCardVariants();
	return {
		card: slots.card(),
		header: slots.header(),
		preview: slots.preview(),
	};
}

export const ISSUE_CARD_CLASSES: IssueCardSlotClasses = resolveIssueCardClasses();
