import type { ReadableState } from './state.svelte.js';

/** @public */
export class Derived<T> implements ReadableState<T> {
	#current: T;

	constructor(compute: () => T) {
		this.#current = $derived.by(compute);
	}

	get current(): T {
		return this.#current;
	}
}
