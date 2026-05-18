import { StateRaw } from '$lib/reactivity/state.svelte.js';

const hoveredPrdNumber = new StateRaw<number | null>(null);

export function getHoveredPrdNumber(): number | null {
	return hoveredPrdNumber.current;
}

export function setHoveredPrdNumber(prdNumber: number | null): void {
	hoveredPrdNumber.current = prdNumber;
}
