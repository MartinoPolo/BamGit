import { createContext } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { invoke, isTauri } from '$lib/tauri.js';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import {
	parseBinding,
	matchesKeyEvent,
	isEditableElement,
	formatBindingForDisplay,
} from './types.js';
import type { ShortcutAction, ShortcutBinding, ShortcutCollision } from './types.js';
import type { KeyboardShortcut } from '$lib/types/generated';

// ─── Context type ─────────────────────────────────────────────────────────────

type KeyboardShortcutsContext = ReturnType<typeof createKeyboardShortcutsContext>;

const [useKeyboardShortcuts, setKeyboardShortcutsInternal] =
	createContext<KeyboardShortcutsContext>();
export { useKeyboardShortcuts };

// ─── Provider ─────────────────────────────────────────────────────────────────

export function setKeyboardShortcutsContext() {
	const ctx = createKeyboardShortcutsContext();
	setKeyboardShortcutsInternal(ctx);
	return ctx;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

function createKeyboardShortcutsContext() {
	const registeredActions = new SvelteMap<string, ShortcutAction>();
	const customBindings = new SvelteMap<string, string>();
	const loading = new StateRaw(false);
	const error = new StateRaw<string | null>(null);

	function getBinding(actionId: string): string {
		const customBinding = customBindings.get(actionId);
		if (customBinding !== undefined) {
			return customBinding;
		}
		const action = registeredActions.get(actionId);
		return action?.defaultBinding ?? '';
	}

	return {
		get loading() {
			return loading.current;
		},
		get error() {
			return error.current;
		},
		get registeredActions() {
			return registeredActions;
		},

		get allBindings(): ShortcutBinding[] {
			return Array.from(registeredActions.values()).map((action) => ({
				actionId: action.id,
				label: action.label,
				binding: customBindings.get(action.id) ?? action.defaultBinding,
				isCustom: customBindings.has(action.id),
			}));
		},

		registerShortcut(action: ShortcutAction): void {
			registeredActions.set(action.id, action);
		},

		unregisterShortcut(id: string): void {
			registeredActions.delete(id);
		},

		getBinding,

		getBindingForDisplay(actionId: string): string {
			return formatBindingForDisplay(getBinding(actionId));
		},

		checkCollision(actionId: string, newBinding: string): ShortcutCollision | null {
			for (const [registeredId, action] of registeredActions) {
				if (registeredId === actionId) {
					continue;
				}
				const effectiveBinding = customBindings.get(registeredId) ?? action.defaultBinding;
				if (effectiveBinding.toLowerCase() === newBinding.toLowerCase()) {
					return { existingActionId: registeredId, existingLabel: action.label };
				}
			}
			return null;
		},

		async rebind(actionId: string, newBinding: string): Promise<void> {
			customBindings.set(actionId, newBinding);
			if (isTauri()) {
				try {
					await invoke('upsert_custom_binding', {
						request: { action_id: actionId, binding: newBinding },
					});
				} catch (err) {
					console.error('Failed to persist binding:', err);
				}
			}
		},

		async resetBinding(actionId: string): Promise<void> {
			customBindings.delete(actionId);
			if (isTauri()) {
				try {
					await invoke('delete_custom_binding', { action_id: actionId });
				} catch (err) {
					console.error('Failed to delete custom binding:', err);
				}
			}
		},

		handleKeydown(event: KeyboardEvent): void {
			if (isEditableElement(event.target)) {
				return;
			}

			for (const [, action] of registeredActions) {
				const effectiveBinding = customBindings.get(action.id) ?? action.defaultBinding;
				const combo = parseBinding(effectiveBinding);
				if (matchesKeyEvent(combo, event)) {
					event.preventDefault();
					action.callback();
					return;
				}
			}
		},

		async loadCustomBindings(): Promise<void> {
			if (!isTauri()) {
				return;
			}
			try {
				loading.current = true;
				error.current = null;
				const bindings = await invoke<KeyboardShortcut[]>('get_custom_bindings');
				for (const bindingEntry of bindings) {
					customBindings.set(bindingEntry.action_id, bindingEntry.binding);
				}
			} catch (err) {
				error.current = String(err);
				console.error('Failed to load custom bindings:', err);
			} finally {
				loading.current = false;
			}
		},
	};
}
