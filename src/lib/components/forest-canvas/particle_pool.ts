// ─── Particle Pool ────────────────────────────────────────────────────────
// Fixed-size object pool. Pre-allocates particles once; dead slots are
// recycled by acquire() to avoid allocation pressure in the rAF loop.

import type { Particle, ParticleKind } from './particle_types';

export interface ParticlePool {
	readonly slots: Particle[];
}

function create_dead_particle(): Particle {
	return {
		kind: 'leaf',
		alive: false,
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		age: 0,
		lifetime: 0,
		rotation: 0,
		rotationSpeed: 0,
		scale: 1,
		extra: 0,
	};
}

export function create_particle_pool(size: number): ParticlePool {
	const slots: Particle[] = Array.from({ length: size }, create_dead_particle);
	return { slots };
}

/** Returns the first dead slot marked alive, or null when the pool is full. */
export function acquire(pool: ParticlePool): Particle | null {
	for (const slot of pool.slots) {
		if (!slot.alive) {
			slot.alive = true;
			return slot;
		}
	}
	return null;
}

export function release(particle: Particle): void {
	particle.alive = false;
}

export function for_each_alive(pool: ParticlePool, visit: (particle: Particle) => void): void {
	for (const slot of pool.slots) {
		if (slot.alive) {
			visit(slot);
		}
	}
}

export function count_alive_of_kind(pool: ParticlePool, kind: ParticleKind): number {
	let count = 0;
	for (const slot of pool.slots) {
		if (slot.alive && slot.kind === kind) {
			count++;
		}
	}
	return count;
}
