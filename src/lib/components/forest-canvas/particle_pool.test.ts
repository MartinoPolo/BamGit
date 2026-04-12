import { describe, it, expect } from 'vitest';
import { create_particle_pool, acquire, release, for_each_alive } from './particle_pool';
import type { Particle } from './particle_types';

describe('create_particle_pool', () => {
	it('pre-allocates exactly the requested number of slots', () => {
		const pool = create_particle_pool(10);
		expect(pool.slots.length).toBe(10);
	});

	it('initializes all slots with alive=false', () => {
		const pool = create_particle_pool(5);
		for (const slot of pool.slots) {
			expect(slot.alive).toBe(false);
		}
	});

	it('initializes every field to a deterministic default', () => {
		const pool = create_particle_pool(1);
		const slot = pool.slots[0];
		expect(slot.x).toBe(0);
		expect(slot.y).toBe(0);
		expect(slot.vx).toBe(0);
		expect(slot.vy).toBe(0);
		expect(slot.age).toBe(0);
		expect(slot.lifetime).toBe(0);
		expect(slot.rotation).toBe(0);
		expect(slot.rotationSpeed).toBe(0);
		expect(slot.scale).toBe(1);
		expect(slot.extra).toBe(0);
	});
});

describe('acquire', () => {
	it('returns the first dead slot and marks it alive', () => {
		const pool = create_particle_pool(3);
		const slot = acquire(pool);
		expect(slot).not.toBeNull();
		expect(slot?.alive).toBe(true);
	});

	it('returns distinct slots on successive calls', () => {
		const pool = create_particle_pool(3);
		const first = acquire(pool);
		const second = acquire(pool);
		expect(first).not.toBeNull();
		expect(second).not.toBeNull();
		expect(first).not.toBe(second);
	});

	it('returns null when pool is exhausted', () => {
		const pool = create_particle_pool(2);
		acquire(pool);
		acquire(pool);
		const third = acquire(pool);
		expect(third).toBeNull();
	});

	it('does not allocate new objects beyond the pool', () => {
		const pool = create_particle_pool(2);
		const before = pool.slots.length;
		acquire(pool);
		acquire(pool);
		acquire(pool); // exhausted
		expect(pool.slots.length).toBe(before);
	});
});

describe('release', () => {
	it('marks a particle as dead', () => {
		const pool = create_particle_pool(2);
		const particle = acquire(pool);
		expect(particle).not.toBeNull();
		release(particle as Particle);
		expect(particle?.alive).toBe(false);
	});

	it('allows the slot to be reused by a subsequent acquire', () => {
		const pool = create_particle_pool(1);
		const first = acquire(pool);
		expect(first).not.toBeNull();
		release(first as Particle);
		const second = acquire(pool);
		expect(second).toBe(first);
	});
});

describe('for_each_alive', () => {
	it('visits only alive slots', () => {
		const pool = create_particle_pool(4);
		const a = acquire(pool);
		const b = acquire(pool);
		release(a as Particle);
		const visited: Particle[] = [];
		for_each_alive(pool, (p) => visited.push(p));
		expect(visited.length).toBe(1);
		expect(visited[0]).toBe(b);
	});

	it('is a no-op when no particles are alive', () => {
		const pool = create_particle_pool(3);
		let count = 0;
		for_each_alive(pool, () => count++);
		expect(count).toBe(0);
	});
});
