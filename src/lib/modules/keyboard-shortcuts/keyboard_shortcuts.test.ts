import { describe, it, expect } from 'vitest';
import {
	parseBinding,
	formatBinding,
	matchesKeyEvent,
	eventToBinding,
	isEditableElement,
	formatBindingForDisplay,
} from './types.js';

// ─── Mock helper ─────────────────────────────────────────────────────────────

function mockKeyboardEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
	return {
		ctrlKey: false,
		shiftKey: false,
		altKey: false,
		metaKey: false,
		key: '',
		...overrides,
	} as KeyboardEvent;
}

// ─── parseBinding ─────────────────────────────────────────────────────────────

describe('parseBinding', () => {
	it('parses Ctrl+K into a combo with ctrl and lowercase key', () => {
		expect(parseBinding('Ctrl+K')).toEqual({
			ctrl: true,
			shift: false,
			alt: false,
			meta: false,
			key: 'k',
		});
	});

	it('parses Ctrl+Shift+I into a combo with ctrl, shift and lowercase key', () => {
		expect(parseBinding('Ctrl+Shift+I')).toEqual({
			ctrl: true,
			shift: true,
			alt: false,
			meta: false,
			key: 'i',
		});
	});

	it('parses Ctrl+\\ into a combo with ctrl and backslash key', () => {
		expect(parseBinding('Ctrl+\\')).toEqual({
			ctrl: true,
			shift: false,
			alt: false,
			meta: false,
			key: '\\',
		});
	});

	it('parses Alt+F4 into a combo with alt and f4 key', () => {
		expect(parseBinding('Alt+F4')).toEqual({
			ctrl: false,
			shift: false,
			alt: true,
			meta: false,
			key: 'f4',
		});
	});

	it('parses Ctrl+, into a combo with ctrl and comma key', () => {
		expect(parseBinding('Ctrl+,')).toEqual({
			ctrl: true,
			shift: false,
			alt: false,
			meta: false,
			key: ',',
		});
	});
});

// ─── formatBinding ────────────────────────────────────────────────────────────

describe('formatBinding', () => {
	it('formats a ctrl combo into Ctrl+K with uppercase key', () => {
		expect(formatBinding({ ctrl: true, shift: false, alt: false, meta: false, key: 'k' })).toBe(
			'Ctrl+K',
		);
	});

	it('round-trips Ctrl+Shift+I through parse and format', () => {
		expect(formatBinding(parseBinding('Ctrl+Shift+I'))).toBe('Ctrl+Shift+I');
	});
});

// ─── matchesKeyEvent ──────────────────────────────────────────────────────────

describe('matchesKeyEvent', () => {
	it('returns true when event matches the Ctrl+K combo exactly', () => {
		expect(
			matchesKeyEvent(parseBinding('Ctrl+K'), mockKeyboardEvent({ ctrlKey: true, key: 'k' })),
		).toBe(true);
	});

	it('returns false when the key does not match', () => {
		expect(
			matchesKeyEvent(parseBinding('Ctrl+K'), mockKeyboardEvent({ ctrlKey: true, key: 'j' })),
		).toBe(false);
	});

	it('returns false when ctrl modifier is missing', () => {
		expect(matchesKeyEvent(parseBinding('Ctrl+K'), mockKeyboardEvent({ key: 'k' }))).toBe(
			false,
		);
	});

	it('returns false when an extra shift modifier is pressed', () => {
		expect(
			matchesKeyEvent(
				parseBinding('Ctrl+K'),
				mockKeyboardEvent({ ctrlKey: true, shiftKey: true, key: 'k' }),
			),
		).toBe(false);
	});

	it('does not match a modifier-only key press where event.key is Control', () => {
		expect(
			matchesKeyEvent(
				parseBinding('Ctrl+K'),
				mockKeyboardEvent({ ctrlKey: true, key: 'Control' }),
			),
		).toBe(false);
	});
});

// ─── eventToBinding ───────────────────────────────────────────────────────────

describe('eventToBinding', () => {
	it('converts a Ctrl+K event into "Ctrl+K"', () => {
		expect(eventToBinding(mockKeyboardEvent({ ctrlKey: true, key: 'k' }))).toBe('Ctrl+K');
	});

	it('returns null when only a modifier key is pressed', () => {
		expect(eventToBinding(mockKeyboardEvent({ key: 'Control' }))).toBeNull();
	});

	it('converts a Ctrl+Shift+I event into "Ctrl+Shift+I"', () => {
		expect(eventToBinding(mockKeyboardEvent({ ctrlKey: true, shiftKey: true, key: 'i' }))).toBe(
			'Ctrl+Shift+I',
		);
	});
});

// ─── isEditableElement ────────────────────────────────────────────────────────

/** Minimal DOM-like element stub used to avoid requiring a browser environment. */
function mockDomElement(tagName: string, attributes: Record<string, string> = {}): EventTarget {
	return {
		tagName,
		getAttribute(name: string): string | null {
			return attributes[name] ?? null;
		},
	} as unknown as EventTarget;
}

describe('isEditableElement', () => {
	it('returns true for an input element', () => {
		expect(isEditableElement(mockDomElement('INPUT'))).toBe(true);
	});

	it('returns true for an element with contenteditable="true"', () => {
		expect(isEditableElement(mockDomElement('DIV', { contenteditable: 'true' }))).toBe(true);
	});

	it('returns false for a plain div element', () => {
		expect(isEditableElement(mockDomElement('DIV'))).toBe(false);
	});

	it('returns false for null', () => {
		expect(isEditableElement(null)).toBe(false);
	});
});

// ─── Collision detection (pure logic) ────────────────────────────────────────

describe('collision detection pure logic', () => {
	interface ActionBinding {
		actionId: string;
		label: string;
		binding: string;
	}

	function findCollision(
		actionId: string,
		newBinding: string,
		existingBindings: ActionBinding[],
	): { existingActionId: string; existingLabel: string } | null {
		for (const entry of existingBindings) {
			if (entry.actionId === actionId) {
				continue;
			}
			if (entry.binding.toLowerCase() === newBinding.toLowerCase()) {
				return { existingActionId: entry.actionId, existingLabel: entry.label };
			}
		}
		return null;
	}

	it('detects a collision when two actions share the same binding', () => {
		const existingBindings: ActionBinding[] = [
			{ actionId: 'open-search', label: 'Open Search', binding: 'Ctrl+K' },
			{ actionId: 'open-file', label: 'Open File', binding: 'Ctrl+O' },
		];
		const collision = findCollision('new-action', 'Ctrl+K', existingBindings);
		expect(collision).toEqual({
			existingActionId: 'open-search',
			existingLabel: 'Open Search',
		});
	});

	it('returns null when no actions share the binding', () => {
		const existingBindings: ActionBinding[] = [
			{ actionId: 'open-search', label: 'Open Search', binding: 'Ctrl+K' },
		];
		const collision = findCollision('new-action', 'Ctrl+J', existingBindings);
		expect(collision).toBeNull();
	});

	it('does not report a collision when checking the same actionId against itself', () => {
		const existingBindings: ActionBinding[] = [
			{ actionId: 'open-search', label: 'Open Search', binding: 'Ctrl+K' },
		];
		const collision = findCollision('open-search', 'Ctrl+K', existingBindings);
		expect(collision).toBeNull();
	});
});

// ─── formatBindingForDisplay ──────────────────────────────────────────────────

describe('formatBindingForDisplay', () => {
	it('returns the binding string as-is on non-macOS platforms', () => {
		expect(formatBindingForDisplay('Ctrl+K')).toBe('Ctrl+K');
	});
});
