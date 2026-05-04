import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { longPress } from './long_press.js';

/**
 * Creates a minimal HTMLElement stub backed by an EventTarget for dispatching events.
 * This avoids needing jsdom while still testing real event wiring.
 */
function createElementStub(): HTMLElement {
	const eventTarget = new EventTarget();
	const element = {
		addEventListener: vi.fn(
			(
				type: string,
				listener: EventListenerOrEventListenerObject,
				options?: AddEventListenerOptions | boolean,
			) => {
				eventTarget.addEventListener(type, listener as EventListener, options);
			},
		),
		removeEventListener: vi.fn(
			(
				type: string,
				listener: EventListenerOrEventListenerObject,
				options?: EventListenerOptions | boolean,
			) => {
				eventTarget.removeEventListener(type, listener as EventListener, options);
			},
		),
		dispatchEvent: (event: Event) => eventTarget.dispatchEvent(event),
	} as unknown as HTMLElement;
	return element;
}

/**
 * Node.js lacks PointerEvent, so we create a plain Event and attach
 * clientX/clientY properties that the action reads.
 */
function createPointerEvent(
	type: string,
	options: { clientX?: number; clientY?: number } = {},
): Event {
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.defineProperty(event, 'clientX', { value: options.clientX ?? 0 });
	Object.defineProperty(event, 'clientY', { value: options.clientY ?? 0 });
	return event;
}

describe('longPress', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('fires callback after default 500ms pointerdown', () => {
		const element = createElementStub();
		const onLongPress = vi.fn();
		longPress(element, { onLongPress });

		element.dispatchEvent(createPointerEvent('pointerdown'));
		vi.advanceTimersByTime(500);

		expect(onLongPress).toHaveBeenCalledOnce();
	});

	it('does NOT fire callback if pointerup before 500ms', () => {
		const element = createElementStub();
		const onLongPress = vi.fn();
		longPress(element, { onLongPress });

		element.dispatchEvent(createPointerEvent('pointerdown'));
		vi.advanceTimersByTime(300);
		element.dispatchEvent(createPointerEvent('pointerup'));
		vi.advanceTimersByTime(500);

		expect(onLongPress).not.toHaveBeenCalled();
	});

	// fallow-ignore-next-line code-duplication
	it('does NOT fire callback if pointermove exceeds threshold', () => {
		const element = createElementStub();
		const onLongPress = vi.fn();
		longPress(element, { onLongPress, moveThreshold: 10 });

		element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
		element.dispatchEvent(createPointerEvent('pointermove', { clientX: 11, clientY: 0 }));
		vi.advanceTimersByTime(500);

		expect(onLongPress).not.toHaveBeenCalled();
	});

	it('fires callback if pointermove stays within threshold', () => {
		const element = createElementStub();
		const onLongPress = vi.fn();
		longPress(element, { onLongPress, moveThreshold: 10 });

		element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
		element.dispatchEvent(createPointerEvent('pointermove', { clientX: 5, clientY: 7 }));
		vi.advanceTimersByTime(500);

		expect(onLongPress).toHaveBeenCalledOnce();
	});

	it('cancels on pointercancel event', () => {
		const element = createElementStub();
		const onLongPress = vi.fn();
		longPress(element, { onLongPress });

		element.dispatchEvent(createPointerEvent('pointerdown'));
		vi.advanceTimersByTime(200);
		element.dispatchEvent(createPointerEvent('pointercancel'));
		vi.advanceTimersByTime(500);

		expect(onLongPress).not.toHaveBeenCalled();
	});

	it('respects custom duration', () => {
		const element = createElementStub();
		const onLongPress = vi.fn();
		longPress(element, { onLongPress, duration: 300 });

		element.dispatchEvent(createPointerEvent('pointerdown'));
		vi.advanceTimersByTime(299);
		expect(onLongPress).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(onLongPress).toHaveBeenCalledOnce();
	});

	it('cleans up event listeners on destroy', () => {
		const element = createElementStub();
		const onLongPress = vi.fn();
		const action = longPress(element, { onLongPress });

		action.destroy();

		element.dispatchEvent(createPointerEvent('pointerdown'));
		vi.advanceTimersByTime(500);

		expect(onLongPress).not.toHaveBeenCalled();
	});

	it('update() changes options for subsequent interactions', () => {
		const element = createElementStub();
		const originalCallback = vi.fn();
		const updatedCallback = vi.fn();
		const action = longPress(element, { onLongPress: originalCallback, duration: 500 });

		action.update({ onLongPress: updatedCallback, duration: 200 });

		element.dispatchEvent(createPointerEvent('pointerdown'));
		vi.advanceTimersByTime(200);

		expect(originalCallback).not.toHaveBeenCalled();
		expect(updatedCallback).toHaveBeenCalledOnce();
	});
});
