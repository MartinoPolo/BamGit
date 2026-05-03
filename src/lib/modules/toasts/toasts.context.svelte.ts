import { createContext } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import type { ToastTone } from '$lib/components/ui/toast/index.js';

export interface ToastItem {
	id: string;
	tone: ToastTone;
	title: string;
	body?: string;
}

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 4000;

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

function createToastsContext() {
	let toasts = $state<ToastItem[]>([]);
	const timers = new SvelteMap<string, ReturnType<typeof setTimeout>>();

	function show(item: Omit<ToastItem, 'id'>) {
		const id = crypto.randomUUID();
		toasts = [...toasts, { ...item, id }];

		if (toasts.length > MAX_VISIBLE) {
			const removed = toasts[0];
			toasts = toasts.slice(1);
			clearTimer(removed.id);
		}

		timers.set(
			id,
			setTimeout(() => dismiss(id), AUTO_DISMISS_MS),
		);
	}

	function dismiss(id: string) {
		toasts = toasts.filter((t) => t.id !== id);
		clearTimer(id);
	}

	function clearTimer(id: string) {
		const timer = timers.get(id);
		if (timer !== undefined) {
			clearTimeout(timer);
			timers.delete(id);
		}
	}

	return {
		get toasts(): readonly ToastItem[] {
			return toasts;
		},
		show,
		dismiss,
	};
}
