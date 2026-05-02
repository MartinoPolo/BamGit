// ─── Types ────────────────────────────────────────────────────────────────────

export interface KeyCombo {
	ctrl: boolean;
	shift: boolean;
	alt: boolean;
	meta: boolean;
	key: string;
}

export interface ShortcutAction {
	id: string;
	label: string;
	defaultBinding: string;
	callback: () => void;
	allowFromEditable?: boolean;
}

export interface ShortcutBinding {
	actionId: string;
	label: string;
	binding: string;
	isCustom: boolean;
}

export interface ShortcutCollision {
	existingActionId: string;
	existingLabel: string;
}

// ─── Modifier key names ───────────────────────────────────────────────────────

const MODIFIER_KEY_NAMES = new Set(['Control', 'Shift', 'Alt', 'Meta', 'AltGraph']);

// ─── parseBinding ─────────────────────────────────────────────────────────────

/**
 * Parse a binding string like "Ctrl+Shift+K" into a KeyCombo.
 * Keys are normalized to lowercase.
 */
export function parseBinding(binding: string): KeyCombo {
	const parts = binding.split('+');

	// The last part is always the actual key (after all modifier prefixes).
	// Special-case: if the binding ends with "+" (e.g. "Ctrl++"), the key is "+".
	// We split on all "+" so "Ctrl++" → ["Ctrl", "", ""] — handle by joining tail.
	// Simpler approach: parse modifiers from the front, remainder is the key.
	const modifierParts = new Set<string>();
	let keyIndex = 0;

	for (let index = 0; index < parts.length - 1; index++) {
		const part = parts[index];
		if (
			part === 'Ctrl' ||
			part === 'Shift' ||
			part === 'Alt' ||
			part === 'Meta' ||
			part === 'Cmd'
		) {
			modifierParts.add(part);
			keyIndex = index + 1;
		}
	}

	// Everything after the last recognized modifier is the key.
	// Join remaining parts with "+" to reconstruct keys like "+" itself.
	const keyPart = parts.slice(keyIndex).join('+').toLowerCase();

	return {
		ctrl: modifierParts.has('Ctrl'),
		shift: modifierParts.has('Shift'),
		alt: modifierParts.has('Alt'),
		meta: modifierParts.has('Meta') || modifierParts.has('Cmd'),
		key: keyPart,
	};
}

// ─── formatBinding ────────────────────────────────────────────────────────────

/**
 * Format a KeyCombo back into a binding string like "Ctrl+Shift+K".
 * Key is uppercased for display.
 */
export function formatBinding(combo: KeyCombo): string {
	const parts: string[] = [];

	if (combo.ctrl) {
		parts.push('Ctrl');
	}
	if (combo.shift) {
		parts.push('Shift');
	}
	if (combo.alt) {
		parts.push('Alt');
	}
	if (combo.meta) {
		parts.push('Meta');
	}

	parts.push(combo.key.toUpperCase());

	return parts.join('+');
}

// ─── matchesKeyEvent ──────────────────────────────────────────────────────────

/**
 * Check if a KeyboardEvent exactly matches a KeyCombo.
 * All modifier states must match and the key must match (case-insensitive).
 */
export function matchesKeyEvent(combo: KeyCombo, event: KeyboardEvent): boolean {
	if (event.ctrlKey !== combo.ctrl) {
		return false;
	}
	if (event.shiftKey !== combo.shift) {
		return false;
	}
	if (event.altKey !== combo.alt) {
		return false;
	}
	if (event.metaKey !== combo.meta) {
		return false;
	}

	const normalizedEventKey = event.key.toLowerCase();

	// Never match bare modifier key presses
	if (MODIFIER_KEY_NAMES.has(event.key)) {
		return false;
	}

	return normalizedEventKey === combo.key;
}

// ─── eventToBinding ───────────────────────────────────────────────────────────

/**
 * Convert a KeyboardEvent to a binding string like "Ctrl+K".
 * Returns null if only modifier keys are pressed (no actual key).
 */
export function eventToBinding(event: KeyboardEvent): string | null {
	if (MODIFIER_KEY_NAMES.has(event.key)) {
		return null;
	}

	const combo: KeyCombo = {
		ctrl: event.ctrlKey,
		shift: event.shiftKey,
		alt: event.altKey,
		meta: event.metaKey,
		key: event.key.toLowerCase(),
	};

	return formatBinding(combo);
}

// ─── DomElementLike ──────────────────────────────────────────────────────────

/** Minimal interface describing the DOM element properties isEditableElement needs. */
interface DomElementLike {
	tagName: string;
	getAttribute(name: string): string | null;
}

function isDomElementLike(value: unknown): value is DomElementLike {
	return (
		value !== null &&
		typeof value === 'object' &&
		'tagName' in value &&
		typeof (value as Record<string, unknown>)['tagName'] === 'string' &&
		'getAttribute' in value &&
		typeof (value as Record<string, unknown>)['getAttribute'] === 'function'
	);
}

// ─── isEditableElement ────────────────────────────────────────────────────────

/**
 * Returns true if the element is an input, textarea, select, or contenteditable.
 * Used to skip shortcut dispatch when the user is typing.
 */
export function isEditableElement(element: EventTarget | null): boolean {
	if (!isDomElementLike(element)) {
		return false;
	}

	const tagName = element.tagName.toLowerCase();

	if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
		return true;
	}

	const contentEditableValue = element.getAttribute('contenteditable');
	if (contentEditableValue === 'true' || contentEditableValue === '') {
		return true;
	}

	return false;
}

// ─── formatBindingForDisplay ──────────────────────────────────────────────────

const MACOS_MODIFIER_SYMBOLS = {
	Ctrl: '⌘',
	Alt: '⌥',
	Shift: '⇧',
	Meta: '⌘',
} as const;

const BINDING_MODIFIER_NAMES = new Set(Object.keys(MACOS_MODIFIER_SYMBOLS));

function detectMacOS(): boolean {
	if (typeof navigator === 'undefined') {
		return false;
	}
	return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

/**
 * Format a binding string for display.
 * On macOS: Ctrl → ⌘, Alt → ⌥, Shift → ⇧, Meta → ⌘ (concatenated without separator).
 * On other platforms: returns the binding as-is.
 */
export function formatBindingForDisplay(binding: string, isMacOS?: boolean): string {
	const mac = isMacOS ?? detectMacOS();

	if (!mac) {
		return binding;
	}

	const parts = binding.split('+');
	const symbols: string[] = [];
	const keyParts: string[] = [];

	for (const part of parts) {
		if (BINDING_MODIFIER_NAMES.has(part)) {
			symbols.push(MACOS_MODIFIER_SYMBOLS[part as keyof typeof MACOS_MODIFIER_SYMBOLS]);
		} else {
			keyParts.push(part);
		}
	}

	return symbols.join('') + keyParts.join('+');
}
