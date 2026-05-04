const DEFAULT_DURATION_MS = 500;
const DEFAULT_MOVE_THRESHOLD_PX = 10;

/** @public */
export interface LongPressOptions {
	onLongPress: () => void;
	duration?: number;
	moveThreshold?: number;
}

export function longPress(
	node: HTMLElement,
	options: LongPressOptions,
): { update(options: LongPressOptions): void; destroy(): void } {
	let currentOptions = options;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let startX = 0;
	let startY = 0;
	let isPressed = false;

	function getDuration(): number {
		return currentOptions.duration ?? DEFAULT_DURATION_MS;
	}

	function getMoveThreshold(): number {
		return currentOptions.moveThreshold ?? DEFAULT_MOVE_THRESHOLD_PX;
	}

	function cancelPress(): void {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		isPressed = false;
	}

	function handlePointerDown(event: Event): void {
		const pointerEvent = event as PointerEvent;
		startX = pointerEvent.clientX;
		startY = pointerEvent.clientY;
		isPressed = true;

		timeoutId = setTimeout(() => {
			if (isPressed) {
				currentOptions.onLongPress();
			}
			isPressed = false;
			timeoutId = null;
		}, getDuration());
	}

	function handlePointerMove(event: Event): void {
		if (!isPressed) {
			return;
		}
		const pointerEvent = event as PointerEvent;
		const deltaX = Math.abs(pointerEvent.clientX - startX);
		const deltaY = Math.abs(pointerEvent.clientY - startY);
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

		if (distance > getMoveThreshold()) {
			cancelPress();
		}
	}

	function handleContextMenu(event: Event): void {
		if (isPressed) {
			event.preventDefault();
		}
	}

	node.addEventListener('pointerdown', handlePointerDown);
	node.addEventListener('pointermove', handlePointerMove);
	node.addEventListener('pointerup', cancelPress);
	node.addEventListener('pointercancel', cancelPress);
	node.addEventListener('contextmenu', handleContextMenu);

	return {
		update(newOptions: LongPressOptions): void {
			currentOptions = newOptions;
		},
		destroy(): void {
			cancelPress();
			node.removeEventListener('pointerdown', handlePointerDown);
			node.removeEventListener('pointermove', handlePointerMove);
			node.removeEventListener('pointerup', cancelPress);
			node.removeEventListener('pointercancel', cancelPress);
			node.removeEventListener('contextmenu', handleContextMenu);
		},
	};
}
