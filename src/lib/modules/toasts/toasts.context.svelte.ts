import { createContext } from 'svelte';
import { StateRaw } from '$lib/reactivity/state.svelte.js';

/** @public */
export interface ToastItem {
	id: string;
	tone: 'info' | 'success' | 'warning' | 'danger';
	title: string;
	body?: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

type ToastsContext = ReturnType<typeof createToastsContext>;

const [useToasts, setToastsInternal] = createContext<ToastsContext>();
export { useToasts };

export function setToastsContext() {
	const ctx = createToastsContext();
	setToastsInternal(ctx);
	return ctx;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

const MAX_VISIBLE = 3;
const DEFAULT_DURATION_MS = 4000;

function createToastsContext() {
	const toasts = new StateRaw<ToastItem[]>([]);

	function show(item: Omit<ToastItem, 'id'>, durationMs = DEFAULT_DURATION_MS): string {
		const id = crypto.randomUUID();
		const next = [...toasts.current, { id, ...item }];
		toasts.current = next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;

		setTimeout(() => dismiss(id), durationMs);
		return id;
	}

	function dismiss(id: string): void {
		toasts.current = toasts.current.filter((t) => t.id !== id);
	}

	return { toasts, show, dismiss };
}
